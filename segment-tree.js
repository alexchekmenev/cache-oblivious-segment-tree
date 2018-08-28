"use strict";

const {nearestPowerOfTwoGTE, nearestPowerOfTwoLTE} = require('./utils');

let _cache;
let K; // calc from B
let H; // calc from N
let N; // N changes to power of 2

module.exports = {
    init,
    query,
    generateArray
};

function init(cache, values) {
    if (!values) {
        return null;
    }
    _cache = cache;
    const n = values.length;

    const blockSize = cache.getBlockSize();
    N = nearestPowerOfTwoGTE(n);
    H = Math.log2(2 * N)|0;
    const numbersCount = (blockSize / 4)|0;
    K = Math.log2(nearestPowerOfTwoLTE(numbersCount + 1))|0;

    const state = {
        v: 1,
        v_root: 1,
        v_offset_in_tree: 0,
        level: 0,
        level_l: 1,
        level_r: 1 << K,
        v_l: 0,
        v_r: N - 1
    };
    _build(state, values);
}

function query(q) {
    const state = {
        v: 1,
        v_root: 1,
        v_offset_in_tree: 0,
        level: 0,
        level_l: 1,
        level_r: 1 << K,
        v_l: 0,
        v_r: N - 1
    };
    return _find(state, q);
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

function _getChildren(s) {
    const count_in_block = (1 << K) - 1;
    const state_l = Object.assign({}, s);
    const state_r = Object.assign({}, s);

    state_l.v_root = state_r.v_root = s.v_root;
    if (s.v_offset_in_tree !== s.v - s.v_root) {
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
        const next_level_block_size = (1 << next_level_h) - 1;
        const shift_l = 2 * (block_pos_in_level * last_row_length
            + s.v_offset_in_tree - ((1 << (K - 1)) - 1)) * next_level_block_size;
        const shift_r = (2 * (block_pos_in_level * last_row_length
            + s.v_offset_in_tree - ((1 << (K - 1)) - 1)) + 1) * next_level_block_size;

        state_l.v = state_l.v_root = s.level_r + shift_l;
        state_r.v = state_r.v_root = s.level_r + shift_r;
        state_l.v_offset_in_tree = state_r.v_offset_in_tree = 0;
        state_l.level = state_r.level = s.level + 1; // increase level
        state_l.level_l = state_r.level_l = s.level_r;
        state_l.level_r = state_r.level_r = s.level_r + (1 << ((s.level + 1) * K)) * ((1 << next_level_h) - 1);
    }
    state_l.v_l = s.v_l;
    state_l.v_r = (s.v_l + s.v_r) >> 1;
    state_r.v_l = ((s.v_l + s.v_r) >> 1) + 1;
    state_r.v_r = s.v_r;

    return {
        state_l,
        state_r
    }
}

function _build(s, values) {
    const blockId = _getBlockIdByV(s.v);
    const offsetInBlock = _getOffsetInBlockByV(s.v);
    if (s.v_l === s.v_r) {
        _cache.set(blockId, offsetInBlock, values[s.v_l]);
        return values[s.v_l];
    } else {
        const {state_l, state_r} = _getChildren(s);
        const value = _build(state_l, values) + _build(state_r, values);
        _cache.set(blockId, offsetInBlock, value);
        return value;
    }
}

function _find(s, q) {
    if (s.v_l > q.r || s.v_r < q.l) {
        return 0;
    }
    const blockId = _getBlockIdByV(s.v);
    const offsetInBlock = _getOffsetInBlockByV(s.v);
    if (q.l <= s.v_l && s.v_r <= q.r) {
        return _cache.get(blockId, offsetInBlock);
    } else {
        const {state_l, state_r} = _getChildren(s);
        return _find(state_l, q) + _find(state_r, q);
    }
}

function _getBlockIdByV(v) {
    return ((v - 1) / ((1 << K) - 1))|0;
}

function _getOffsetInBlockByV(v) {
    return (v - 1) % ((1 << K) - 1);
}