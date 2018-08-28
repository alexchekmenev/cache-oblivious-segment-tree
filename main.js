"use strict";

const storage = require('./storage');
const cache = require('./cache');
const segmentTree = require('./segment-tree');

//TODO: get from ENV
const N = 1 << 20;
const T = 1000;
const B = 1 << 22;
let Mmin = 1 << 22; // 1 Mb;
let Mmax = 1 << 27; // 1 Mb;

function tester() {
    let m = Mmax;
    for(; m >= Mmin; m /= 2) {
        fromScratch(m, N);
    }
}

tester();


function fromScratch(M, n) {
    console.log(`B = ${B}, M = 2^${Math.log2(M)}`);
    const start = new Date();

    storage.init(B, n);
    storage.createBlocks();
    console.log(storage.getBlocksCount() + ' blocks created');

    cache.init(M, storage);

    const values = segmentTree.generateArray(n, 1, 1);
    segmentTree.init(cache, values);
    cache.syncAll();
    console.log('build: ' + ((new Date()) - start) + ' ms.' );

    test(n, T);
    storage.removeBlocks();
}

function test(N, T) {
    const qs = [];
    for(let i = 0; i < T; i++) {
        let l = genRandomInRange(0, N - 1);
        let r = genRandomInRange(0, N - 1);
        if (l > r) {
            const tmp = r;
            r = l;
            l = tmp;
        }
        qs.push({
            l, r
        });
    }

    const start = new Date();
    for(let i = 0; i < T; i++) {
        // console.log('query', qs[i].l, qs[i].r);
        const res = segmentTree.query(qs[i]);
        if (qs[i].r - qs[i].l + 1 !== res) {
            // console.log(qs[i].l, qs[i].r, 'sum = ' + res, qs[i].r - qs[i].l + 1);
            throw new Error('wrong sum');
        }
    }
    console.log('test: ' + (((new Date()) - start) / T).toFixed(2) + ' ms. per test\n' );
}

function genRandomInRange(l, r) {
    return l + (Math.random() * (r - l + 1))|0;
}