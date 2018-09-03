"use strict";

const fs = require('fs');
const path = require('path');

const RESULTS_PATH = path.join(process.cwd(), 'results.json');

module.exports = {
    load,
    save
};

function load() {
    const buffer = fs.readFileSync(RESULTS_PATH, 'utf8');
    if (buffer.length === 0) {
        return [];
    }
    return JSON.parse(buffer);
}

function save(results) {
    const str = JSON.stringify(results);
    fs.writeFileSync(RESULTS_PATH, str, 'utf8');
}