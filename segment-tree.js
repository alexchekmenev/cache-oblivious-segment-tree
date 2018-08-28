const {
    nearestPowerOfTwoGTE,
    nearestPowerOfTwoLTE
} = require('./utils');

let K; // calc from B
let H; // calc from N
let N; // N changes to power of 2
let state;
let incomplete_blocks_start_pos;
let incomplete_blocks_size;
let full_blocks_count;

let _cache;

// function getBlocksCount(n, blockSize) {
//     const N = nearestPowerOfTwoGTE(n);
//     const H = Math.log2(2 * N)|0;
//     const numbersCount = (blockSize / 4)|0;
//     const K = Math.log2(nearestPowerOfTwoLTE(numbersCount + 1))|0;
//     const incomplete_levels_start_pos = 1 << (H - H % K);
//     const incomplete_level_block_size = (1 << (H % K)) - 1;
//     const count_in_block = (1 << K) - 1;
//
//     console.log('K', K);
//     console.log('H', H);
//     // console.log('incomplete_levels_start_pos', incomplete_levels_start_pos);
//     // console.log('incomplete_level_block_size', incomplete_level_block_size);
//
//     if ((incomplete_levels_start_pos - 1) % count_in_block) {
//         throw new Error("(incomplete_levels_start_pos - 1) % numbersCount != 0");
//     }
//
//     full_blocks_count = (incomplete_levels_start_pos - 1) / count_in_block;
//     let blocksCount = full_blocks_count;
//     if (incomplete_level_block_size > 0) {
//         blocksCount += incomplete_levels_start_pos / count_in_block;
//     }
//     return blocksCount;
// }

function init(cache, values) {
    if (!values) {
        return null;
    }
    _cache = cache;
    const n = values.length;

    const blockSize = cache.getBlockSize();
    N = nearestPowerOfTwoGTE(n);
    // console.log('N', N);
    H = Math.log2(2 * N)|0;
    // console.log('H', H);
    const numbersCount = (blockSize / 4)|0;
    K = Math.log2(nearestPowerOfTwoLTE(numbersCount + 1))|0;
    console.log('segment-tree: count_in_block', (1 << K) - 1);
    incomplete_blocks_start_pos = 1 << (H - H % K);
    incomplete_blocks_size = (1 << (H % K)) - 1;

    state = {
        v: 1,
        v_root: 1,
        v_offset_in_tree: 0,
        level: 0,
        level_l: 1,
        level_r: 1 << K,
        v_l: 0,
        v_r: N - 1,
        // incomplete_level: (H < K)
    };
    build(state, values);
}

function getChildren(s) {
    const count_in_block = (1 << K) - 1;
    const state_l = Object.assign({}, s);
    const state_r = Object.assign({}, s);

    // state_l.incomplete_level = state_r.incomplete_level = s.incomplete_level;
    state_l.v_root = state_r.v_root = s.v_root;

    // if (s.incomplete_level) {
    //     state_l.v = s.v + (s.v - s.v_root) + 1;
    //     state_r.v = s.v + (s.v - s.v_root) + 2;
    //     state_l.level = state_r.level = s.level;
    //     state_l.level_l = state_r.level_l = s.level_l;
    //     state_l.level_r = state_r.level_r = s.level_r;
    // } else {
        if (s.v_offset_in_tree !== s.v - s.v_root) {
            // console.log('v', s.v, 'v_root', s.v_root, 'offset_in_tree', s.v_offset_in_tree);
            throw new Error('s.v_offset_in_tree !== s.v - s.v_root');
        }
        state_l.v_offset_in_tree = s.v_offset_in_tree * 2 + 1;
        state_r.v_offset_in_tree = s.v_offset_in_tree * 2 + 2;
        if (state_l.v_offset_in_tree < count_in_block) { // stay in this block
            state_l.v = s.v + s.v_offset_in_tree + 1;
            state_r.v = s.v + s.v_offset_in_tree + 2;
            state_l.level = state_r.level = s.level;
            state_l.level_l = state_r.level_l = s.level_l;
            state_l.level_r = state_r.level_r = s.level_r;
        } else { // change level
            const block_pos_in_level = +Math.floor((s.v - s.level_l) / count_in_block);

            const last_row_length = (1 << (K - 1));
            const next_level_h = Math.min(H - (s.level + 1) * K, K); // remain height

            // if (next_level_h < K) {
            //     state_l.incomplete_level = state_r.incomplete_level = true;
            // }

            const next_level_block_size = (1 << next_level_h) - 1;

            const shift_l = 2 * (block_pos_in_level * last_row_length
                + s.v_offset_in_tree - ((1 << (K - 1)) - 1)) * next_level_block_size;
            const shift_r = (2 * (block_pos_in_level * last_row_length
                + s.v_offset_in_tree - ((1 << (K - 1)) - 1)) + 1) * next_level_block_size;

            // console.log('offset', s.v_offset_in_tree);
            // console.log('r', s.level_r);
            // console.log('add', next_level_h);
            // console.log('add', (1 << ((s.level + 1) * K)));
            // console.log('add', (1 << ((s.level + 1) * K)) * ((1 << next_level_h) - 1));

            state_l.v = state_l.v_root = s.level_r + shift_l;
            state_r.v = state_r.v_root = s.level_r + shift_r;

            // console.log('shift: l='+shift_l+', r='+shift_r);
            // console.log(s.v + ': l=' + state_l.v + ', r=' + state_r.v);

            state_l.v_offset_in_tree = state_r.v_offset_in_tree = 0;
            state_l.level = state_r.level = s.level + 1; // increase level
            state_l.level_l = state_r.level_l = s.level_r;
            state_l.level_r = state_r.level_r = s.level_r + (1 << ((s.level + 1) * K)) * ((1 << next_level_h) - 1);
        }
    // }
    // console.log('v = ' + s.v + ', l = ' + state_l.v + ', r = ' + state_r.v);
    state_l.v_l = s.v_l;
    state_l.v_r = (s.v_l + s.v_r) >> 1;
    state_r.v_l = ((s.v_l + s.v_r) >> 1) + 1;
    state_r.v_r = s.v_r;

    return {
        state_l,
        state_r
    }
}


function build(s, values) {
    // console.log(s);
    if (s.v >= 2 * N) {
        console.log(s.v, s.v_l, s.v_r);
    }
    const blockId = getBlockIdByV(s.v);
    // if (blockId >= 2048) {
    //     console.log('blockId', blockId, 'v', s.v);
    // }
    const offsetInBlock = getOffsetInBlockByV(s.v);
    // console.log('v=' + s.v);
    if (s.v_l === s.v_r) {
        // console.log(`a[${s.v}] = ${values[s.v_l]}`);
        _cache.set(blockId, offsetInBlock, values[s.v_l]);
        return values[s.v_l];
    } else {
        const {state_l, state_r} = getChildren(s);
        const value = build(state_l, values) + build(state_r, values);
        // console.log(`a[${s.v}] = ${value}`);
        _cache.set(blockId, offsetInBlock, value);
        return value;
    }
}

function find(s, q) {
    if (s.v_l > q.r || s.v_r < q.l) {
        return 0;
    }
    // console.log(s);
    const blockId = getBlockIdByV(s.v);
    const offsetInBlock = getOffsetInBlockByV(s.v);
    if (q.l <= s.v_l && s.v_r <= q.r) {
        // console.log(blockId, offsetInBlock, _cache.get(blockId, offsetInBlock));
        return _cache.get(blockId, offsetInBlock);
    } else {
        const {state_l, state_r} = getChildren(s);
        return find(state_l, q) + find(state_r, q);
    }
}

function getBlockIdByV(v) {
    return ((v - 1) / ((1 << K) - 1))|0;
    // if (v < incomplete_blocks_start_pos) {
    //     return ((v - 1) / ((1 << K) - 1))|0;
    // } else {
    //     const blockId = full_blocks_count + (((v - incomplete_blocks_start_pos) / incomplete_blocks_size)|0);
    //     // console.log('full_blocks_count', incomplete_blocks_size);
    //     // console.log('v', v, 'blockId', blockId);
    //     return blockId;
    // }
}

function getOffsetInBlockByV(v) {
    return (v - 1) % ((1 << K) - 1);
}

function query(q) {
    // _cache = cache;
    // N = nearestPowerOfTwoGTE(n);
    // H = Math.log2(2 * N)|0;
    // const blockSize = cache.getBlockSize();
    // const numbersCount = (blockSize / 4)|0;
    // K = Math.log2(nearestPowerOfTwoLTE(numbersCount + 1))|0;
    state = {
        v: 1,
        v_root: 1,
        v_offset_in_tree: 0,
        level: 0,
        level_l: 1,
        level_r: 1 << K,
        v_l: 0,
        v_r: N - 1
    };
    return find(state, q);
}

function generateArray(length, min, max) {
    if (!min) {
        min = 1;
    }
    if (!max) {
        max = 1e9;
    }
    const result = [];
    for(let i = 0; i < length; i++) {
        const x = min + (Math.random() * (max - min + 1))|0;
        result.push(x);
    }
    return result;
}

module.exports = {
    // getBlocksCount,
    init,
    query,
    generateArray
};