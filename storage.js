const fs = require('fs');
const Q = require('q');
const path = require('path');
const BLOCKS = path.join(process.cwd(), '../blocks');
const {nearestPowerOfTwoGTE, nearestPowerOfTwoLTE} = require('./utils');

// let length = 0;
let _blockSize = 0;
let _blocksCount = 0;

let readBlockCount = 0;

module.exports = {
    init: (B, n) => {
        // length = N;
        _blockSize = B;
        // console.log('N = ' + N);
        // _blocksCount = blocksCount;
        const N = nearestPowerOfTwoGTE(n);
        const count_in_block = nearestPowerOfTwoLTE(((B + 2 * 4 - 1) / 4)|0) - 1;
        console.log('storage: count_in_block', count_in_block);
        _blocksCount = ((2 * N - 1 + count_in_block - 1) / count_in_block)|0;
    },
    getBlockSize: () => {
        return _blockSize;
    },
    getBlocksCount: () => {
        return _blocksCount;
    },
    readBlock: (blockId) => {
        if (readBlockCount % 10000 === 0) {
            console.log('readBlockCount', readBlockCount);
        }
        readBlockCount++;
        const filePath = path.join(BLOCKS, 'block-'+blockId);
        const buffer = fs.readFileSync(filePath);
        return new Uint32Array(toArrayBuffer(buffer));
    },
    writeBlock: (blockId, arrayBuffer) => {
        const filePath = path.join(BLOCKS, 'block-'+blockId);
        const buffer = Buffer.from(arrayBuffer.buffer);
        fs.writeFileSync(filePath, buffer);
    },
    createBlocks: () => {
        // console.log('creating blocks...');
        for(let i = 0; i < _blocksCount; i++) {
            fillZeroes(i, _blockSize / 4);
        }
    },
    removeBlocks: () => {
        readBlockCount = 0;
        for(let blockId = 0; blockId < _blocksCount; blockId++) {
            fs.unlinkSync(path.join(BLOCKS, 'block-'+blockId));
        }
    }
};

function fillZeroes(blockId, countOfZeroes) {
    const zeroes = new Uint32Array(countOfZeroes);
    const buffer = Buffer.from(zeroes.buffer);
    const filePath = path.join(BLOCKS, 'block-'+blockId);
    fs.writeFileSync(filePath, buffer);
}

function toArrayBuffer(buf) {
    const ab = new ArrayBuffer(buf.length);
    const view = new Uint8Array(ab);
    for (let i = 0; i < buf.length; ++i) {
        view[i] = buf[i];
    }
    return ab;
}
