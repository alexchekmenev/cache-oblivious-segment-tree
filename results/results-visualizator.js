"use strict";

const {load} = require('./results-saver');
const stringify = require('csv-stringify');
const fs = require('fs');
const path = require('path');


function main() {
    const results = load();
    const tests = results.data.filter(r => r.n === 26);
    tests.sort((a, b) => {
        if (a.b < b.b) {
            return -1;
        } else if (a.b > b.b) {
            return 1;
        } else {
            if (a.m < b.m) {
                return -1;
            } else if (a.m > b.m) {
                return 1;
            }
        }
        return 0;
    });
    const height = tests[tests.length - 1].b - tests[0].b + 2;
    const width = tests[tests.length - 1].m - tests[0].m + 2;
    const table = [];
    for(let i = 0; i < height; i++) {
        table.push([]);
        const lastRowInd = table.length - 1;
        for(let j = 0; j < width; j++) {
            table[lastRowInd].push(0);
        }
    }

    tests.forEach((r) => {
        const i = r.b - tests[0].b + 1;
        const j = r.m - tests[0].m + 1;
        table[i][j] = r.test;
        table[i][0] = r.b;
        table[0][j] = r.m;
    });

    // const rows = tests.slice(1).reduce((rows, r) => {
    //     const i = rows.length - 1;
    //     const j = rows[i].length - 1;
    //     console.log(i, j, r);
    //     if (rows[i][j].b === r.b) {
    //         rows[i].push(r);
    //     } else {
    //         rows.push([r.b, r]);
    //     }
    //     return rows;
    // }, [[tests[0].b, tests[0]]]);
    //
    // const table = rows.map(row => {
    //     const newRow = [row[0]];
    //     row.slice(1).forEach(cell => {
    //         newRow.push(cell.test);
    //     });
    //     return newRow;
    // });
    // const header = rows[0].slice(1).map(cell => cell.m);
    // header.unshift('B / M');
    // table.unshift(header);
    console.log(table);

    stringify(table, function(err, output) {
        if (err) {
            console.error(err)
        } else {
            fs.writeFileSync(path.join(process.cwd(), 'results/results.csv'), output);
        }
    });
}

main();