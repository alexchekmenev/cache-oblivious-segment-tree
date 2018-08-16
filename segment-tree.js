const {
    nearestPowerOfTwoGTE,
    nearestPowerOfTwoLTE
} = require('./utils');

let K; // calc from B
let H; // calc from N
let N; // N changes to power of 2
let state;

let _cache;

function init(cache, values) {
    if (!values) {
        return null;
    }
    _cache = cache;
    const n = values.length;
    const blockSize = cache.getBlockSize();
    N = nearestPowerOfTwoGTE(n);
    H = Math.log2(N)|0;
    const numbersCount = (blockSize / 4)|0;
    K = Math.log2(nearestPowerOfTwoLTE(numbersCount + 1))|0;
    state = {
        v: 1,
        v_offset: 0,
        level: 0,
        level_l: 1,
        level_r: 1 << K,
        v_l: 0,
        v_r: N - 1
    };
    build(state, values);
}


function build(s, values) {
    if (s.v >= 2 * N - 1) {
        console.log(s.v, s.v_l, s.v_r);
    }
    const blockId = getBlockIdByV(s.v);
    const blockCount= 32768;
    if (blockId >= 32768) {
        console.log(s.v, s.v_l, s.v_r);
    }
    const count_in_block = (1 << K) - 1;
    // console.log('v=' + s.v);
    if (s.v_l === s.v_r) {
        // console.log(`a[${s.v}] = ${values[s.v_l]}`);
        // console.log(values, s.v_l);
        _cache.set(blockId, s.v_offset, values[s.v_l]);
        return values[s.v_l];
    } else {
        const state_l = Object.assign({}, s);
        const state_r = Object.assign({}, s);
        state_l.v_offset = s.v_offset * 2 + 1;
        state_r.v_offset = s.v_offset * 2 + 2;
        if (state_l.v_offset < count_in_block) { // stay in this block
            state_l.v += s.v_offset + 1;
            state_r.v += s.v_offset + 2;
            state_l.level = state_r.level = s.level;
            state_l.level_l = state_r.level_l = s.level_l;
            state_l.level_r = state_r.level_r = s.level_r;
        } else { // change block
            // console.log('change block');
            const block_pos_in_level = +Math.floor((s.v - s.level_l) / count_in_block);

            const last_row_length = (1 << (K - 1));
            const next_level_h = Math.min((H + 1) - (s.level + 1) * K, K); // remain height
            const next_level_block_size = (1 << next_level_h) - 1;

            const shift_l = 2 * (block_pos_in_level * last_row_length
                + s.v_offset - ((1 << (K - 1)) - 1)) * next_level_block_size;
            const shift_r = (2 * (block_pos_in_level * last_row_length
                + s.v_offset - ((1 << (K - 1)) - 1)) + 1) * next_level_block_size;
            // console.log('offset', s.v_offset);
            // console.log('r', s.level_r);
            // console.log('add', next_level_h);
            // console.log('add', (1 << ((s.level + 1) * K)));
            // console.log('add', (1 << ((s.level + 1) * K)) * ((1 << next_level_h) - 1));
            state_l.v = s.level_r + shift_l;
            state_r.v = s.level_r + shift_r;
            // console.log('shift: l='+shift_l+', r='+shift_r);
            // console.log(s.v + ': l=' + state_l.v + ', r=' + state_r.v);
            state_l.v_offset = state_r.v_offset = 0;
            state_l.level = state_r.level = s.level + 1; // increase level
            state_l.level_l = state_r.level_l = s.level_r;
            state_l.level_r = state_r.level_r = s.level_r + (1 << ((s.level + 1) * K)) * ((1 << next_level_h) - 1);
        }
        state_l.v_l = s.v_l;
        state_l.v_r = (s.v_l + s.v_r) >> 1;
        state_r.v_l = ((s.v_l + s.v_r) >> 1) + 1;
        state_r.v_r = s.v_r;
        // console.log('v = ' + s.v + ', l = ' + state_l.v + ', r = ' + state_r.v);
        const value = build(state_l, values) + build(state_r, values);
        // console.log(`a[${s.v}] = ${value}`);
        _cache.set(getBlockIdByV(s.v), s.v_offset, value);
        return value;
    }
}

function find(s, q) {
    const count_in_block = (1 << K) - 1;
    if (s.v_l > q.r || s.v_r < q.l) {
        return 0;
    }
    if (q.l <= s.v_l && s.v_r <= q.r) {
        return _cache.get(getBlockIdByV(s.v), s.v_offset);
    } else {
        const state_l = Object.assign({}, s);
        const state_r = Object.assign({}, s);
        state_l.v_offset = s.v_offset * 2 + 1;
        state_r.v_offset = s.v_offset * 2 + 2;
        if (state_l.v_offset < count_in_block) { // stay in this block
            state_l.v += s.v_offset + 1;
            state_r.v += s.v_offset + 2;
            state_l.level = state_r.level = s.level;
            state_l.level_l = state_r.level_l = s.level_l;
            state_l.level_r = state_r.level_r = s.level_r;
        } else { // change block
            const block_pos_in_level = +Math.floor((s.v - s.level_l) / count_in_block);

            const last_row_length = (1 << (K - 1));
            const next_level_h = Math.min((H + 1) - (s.level + 1) * K, K); // remain height
            const next_level_block_size = (1 << next_level_h) - 1;

            const shift_l = 2 * (block_pos_in_level * last_row_length
                + s.v_offset - ((1 << (K - 1)) - 1)) * next_level_block_size;
            const shift_r = (2 * (block_pos_in_level * last_row_length
                + s.v_offset - ((1 << (K - 1)) - 1)) + 1) * next_level_block_size;

            state_l.v = s.level_r + shift_l;
            state_r.v = s.level_r + shift_r;
            state_l.v_offset = state_r.v_offset = 0;
            state_l.level = state_r.level = s.level + 1; // increase level
            state_l.level_l = state_r.level_l = s.level_r;
            state_l.level_r = state_r.level_r = s.level_r + (1 << ((s.level + 1) * K)) * ((1 << K) - 1);
        }
        state_l.v_l = s.v_l;
        state_l.v_r = (s.v_l + s.v_r) >> 1;
        state_r.v_l = ((s.v_l + s.v_r) >> 1) + 1;
        state_r.v_r = s.v_r;
        return find(state_l, q) + find(state_r, q);
    }
}

function getBlockIdByV(v) {
    const kk = (1 << K) - 1;
    const vv = v - 1;
    // console.log('getBlockId', v, kk);
    return ((v - 1) / ((1 << K) - 1))|0;
}

function query(n, q, cache) {
    _cache = cache;
    N = nearestPowerOfTwoGTE(n);
    H = Math.log2(N)|0;
    const blockSize = cache.getBlockSize();
    const numbersCount = (blockSize / 4)|0;
    K = Math.log2(nearestPowerOfTwoLTE(numbersCount + 1))|0;
    state = {
        v: 1,
        v_offset: 0,
        level: 0,
        level_l: 1,
        level_r: 1 << K,
        v_l: 0,
        v_r: N - 1
    };
    return find(state, q);
}

function generateArray (length, min, max) {
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
    init,
    query,
    generateArray
};