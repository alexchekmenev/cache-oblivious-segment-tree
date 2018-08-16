const cache = require('./cache');
const segmentTree = require('./segment-tree');
const storage = require('./storage');
const {nearestPowerOfTwoGTE, nearestPowerOfTwoLTE} = require('./utils');

//TODO: get from ENV
const N = 1 << 25;
const T = 1000;

// const B = (N * 2 - 1) * 4; // 1 Kb;
// const M = 10 * B; // 1 Mb;

const B = 8192; // 1 Kb;
let M = 1e21; // 1 Mb;

function fromScratch(M, n) {
    console.log('B=' + B + ', M=' + M);
    const start = new Date();

    const N = nearestPowerOfTwoGTE(n);
    storage.init(2 * N - 1, B);
    storage.createBlocks();
    console.log(storage.getBlocksCount() + ' blocks created');

    cache.init(M, storage);

    const values = segmentTree.generateArray(n, 1, 1); //storage.generateArray(n, 1, 10);
    segmentTree.init(cache, values);
    // cache.syncAll();
    console.log('build: ' + ((new Date()) - start) + ' ms.' );

    test(n, T, cache);
    storage.removeBlocks();
}

function test(N, T, cache) {
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
        const res = segmentTree.query(N, qs[i], cache);
        // console.log(qs[i].l, qs[i].r, 'sum = ' + res);
        if (qs[i].r - qs[i].l + 1 !== res) {
            throw new Error('wrong sum');
            // console.log('ERR');
        }
    }
    console.log('test: ' + (((new Date()) - start) / T).toFixed(2) + ' ms. per test\n' );
}

function genRandomInRange(l, r) {
    return l + (Math.random() * (r - l + 1))|0;
}

// fromScratch(N);

function tester() {
    let m = 1 << 15;
    for(; m <= (1 << 21); m *= 2) {
        fromScratch(m, N);
    }
}

tester();