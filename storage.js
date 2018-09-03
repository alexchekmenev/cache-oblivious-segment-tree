"use strict";

const fs = require('fs');
const path = require('path');
const {nearestPowerOfTwoGTE, nearestPowerOfTwoLTE} = require('./utils');

let BLOCKS;
let blockSize = 0;
let blocksCount = 0;
let readBlockCount = 0;

module.exports = {
    init: (B, n) => {
        blockSize = B;
        const N = nearestPowerOfTwoGTE(n);
        const count_in_block = nearestPowerOfTwoLTE(((B + 2 * 4 - 1) / 4)|0) - 1;
        blocksCount = ((2 * N - 1 + count_in_block - 1) / count_in_block)|0;
        readBlockCount = 0;
        BLOCKS = path.join(process.cwd(), '../blocks', 't-' + (+new Date()));
        // console.log('BLOCKS', BLOCKS);
        fs.mkdirSync(BLOCKS);
    },
    getBlockSize: () => {
        return blockSize;
    },
    getBlocksCount: () => {
        return blocksCount;
    },
    readBlock: (blockId) => {
        readBlockCount++;
        if (readBlockCount % 10000 === 0 && readBlockCount > 0) {
            console.log('readBlockCount', readBlockCount);
        }
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
        for(let i = 0; i < blocksCount; i++) {
            fillZeroes(i, blockSize / 4);
        }
    },
    removeBlocks: () => {
        readBlockCount = 0;
        for(let blockId = 0; blockId < blocksCount; blockId++) {
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
