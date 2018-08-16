const fs = require('fs');
const Q = require('q');
const path = require('path');
const BLOCKS = path.join(process.cwd(), 'blocks');

let length = 0;
let blockSize = 0;
let blocksCount = 0;

let readBlockCount = 0;
let lastReadTimestamp = 0;

module.exports = {
    init: (N, B) => {
        length = N;
        blockSize = B;
        // console.log('N = ' + N);
        blocksCount = ((4 * N + B - 1) / B)|0;
        console.log(blocksCount)
    },
    getBlockSize: () => {
        return blockSize;
    },
    getLength: () => {
        return length;
    },
    getBlocksCount: () => {
        return blocksCount;
    },
    readBlock: (blockId) => {
        if (readBlockCount % 10000 === 0) {
            console.log(readBlockCount);
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
        for(let i = 0; i < blocksCount; i++) {
            fillZeroes(i, blockSize / 4);
        }
    },
    removeBlocks: () => {
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
