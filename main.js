const cache = require('./cache');
const segmentTree = require('./segment-tree');
const storage = require('./storage');

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
    console.log('B=' + B + ', M=2^' + Math.log2(M));
    const start = new Date();

    // const blocksCount = segmentTree.getBlocksCount(n, B);
    // console.log('blocksCount', blocksCount);

    storage.init(B, n);
    storage.createBlocks();
    console.log(storage.getBlocksCount() + ' blocks created');

    cache.init(M, storage);

    const values = segmentTree.generateArray(n, 1, 1);
    segmentTree.init(cache, values);
    cache.syncAll();
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
        // console.log('query', qs[i].l, qs[i].r);
        const res = segmentTree.query(qs[i]);
        // console.log(qs[i].l, qs[i].r, 'sum = ' + res);
        if (qs[i].r - qs[i].l + 1 !== res) {
            // console.log(qs[i].l, qs[i].r, 'sum = ' + res, qs[i].r - qs[i].l + 1);
            throw new Error('wrong sum');
            // console.log('ERR');
        }
        // console.log('\n\n\n')
    }
    console.log('test: ' + (((new Date()) - start) / T).toFixed(2) + ' ms. per test\n' );
}

function genRandomInRange(l, r) {
    return l + (Math.random() * (r - l + 1))|0;
}