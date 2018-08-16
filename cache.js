let _storage;
let totalBlocksCount = 0;

let queue = []; // array of ints
let loadedBlocks = []; // object of Uint32Array
let loadedBlocksCount = 0;

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
    // console.log('queue', queue);
    if (!loadedBlocks.hasOwnProperty(blockId)) {
        if (loadedBlocksCount + 1 > totalBlocksCount) {
            sync();
        }
        // console.log('load block#' + blockId);
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
        // console.log('sync block#' + blockId);
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
    // console.log('set: blockId=' + blockId + ', offset =' + offset);
    const block = load(blockId);
    // console.log(block);
    block[offset] = value;
}

function getBlockSize() {
    return _storage.getBlockSize();
}

module.exports = {
    init,
    syncAll,
    get,
    set,
    getBlockSize
};