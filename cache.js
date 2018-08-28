"use strict";

let _storage;
let queue = []; // array of ints
let totalBlocksCount = 0;
let loadedBlocks = []; // object of Uint32Array
let loadedBlocksCount = 0;

module.exports = {
    init,
    syncAll,
    get,
    set,
    getBlockSize
};

function init(M, storage) {
    if (storage.getBlockSize() > M){
        throw new Error('block size greater than available RAM volume');
    }
    _storage = storage;
    totalBlocksCount = (M / storage.getBlockSize())|0;
}

/**
 * Synchronous
 */
function load(blockId) {
    if (!loadedBlocks.hasOwnProperty(blockId)) {
        if (loadedBlocksCount + 1 > totalBlocksCount) {
            sync();
        }
        queue.push(blockId);
        loadedBlocksCount++;
        loadedBlocks[blockId] = _storage.readBlock(blockId);
    }
    return loadedBlocks[blockId];
}

/**
 * Synchronous
 */
function sync() {
    if (queue.length > 0) {
        const blockId = queue.shift();
        loadedBlocksCount--;
        _storage.writeBlock(blockId, loadedBlocks[blockId]);
        delete loadedBlocks[blockId];
    }
}

/**
 * Synchronous
 */
function syncAll() {
    while (queue.length > 0) {
        sync();
    }
}

/**
 * Synchronous
 */
function get(blockId, offset) {
    const block = load(blockId);
    return block[offset];
}

/**
 * Synchronous
 */
function set(blockId, offset, value) {
    const block = load(blockId);
    block[offset] = value;
}

function getBlockSize() {
    return _storage.getBlockSize();
}