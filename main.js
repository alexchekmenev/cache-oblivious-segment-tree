"use strict";

const storage = require('./storage');
const cache = require('./cache');
const segmentTree = require('./segment-tree');
const {load, save} = require('./results-saver');

const T = 1000;

// TODO: get from ENV
// const N = 1 << 23;
// const B = 1 << 13;
// let Mmin = 1 << 22; // 1 Mb;
// let Mmax = 1 << 28; // 1 Mb;

// function tester() {
//     let m = Mmax;
//     for(; m >= Mmin; m /= 2) {
//         fromScratch(B, m, N);
//     }
// }

function a() {
    let cnt = 0;
    const total = 378;
    const results = load();
    for(let n = 20; n <= 26; n++) {
        for(let m = n - 2; m <= n + 1; m++) {
            for(let b = 10; b <= m; b++) {
                cnt++;
                if (cnt <= results.count) {
                    continue;
                }
                console.log(`TEST ${cnt} / ${total}\n`);
                if (m === b) {
                    results.data.push({
                        n,
                        m,
                        b,
                        build: 0,
                        test: 0
                    });
                } else {
                    const times = fromScratch(1 << b, 1 << m, 1 << n);
                    results.data.push({
                        n,
                        m,
                        b,
                        build: times.build,
                        test: times.test
                    });
                }
                results.count = cnt;
                save(results);
            }
        }
    }
}
a();


function fromScratch(B, M, n) {
    console.log(`B = 2^${Math.log2(B)}, M = 2^${Math.log2(M)}`);
    const start = new Date();

    storage.init(B, n);
    storage.createBlocks();
    console.log(storage.getBlocksCount() + ' blocks created');

    cache.init(M, storage);

    const values = segmentTree.generateArray(n, 1, 1);
    segmentTree.init(cache, values);
    cache.syncAll();

    const buildTime = (new Date()) - start;
    console.log('build: ' + buildTime + ' ms.' );

    const testTime = test(n, T) / T;
    console.log('test: ' + testTime.toFixed(2) + ' ms. per test\n' );
    storage.removeBlocks();

    return {
        build: buildTime,
        test: testTime
    }
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
            console.log(i, qs[i]);
            console.log('got ', res, ', expected', qs[i].r - qs[i].l + 1);
            throw new Error('wrong sum');
        }
    }
    return new Date() - start;
}

function genRandomInRange(l, r) {
    return l + (Math.random() * (r - l + 1))|0;
}