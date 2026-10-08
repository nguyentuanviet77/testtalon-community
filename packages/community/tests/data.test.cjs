const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { readCsvDataFile, appendCSVDataRows, redefineTestLocator } = require('../../../dist/packages/community/lib/CommonFuncs');
const { globalVariables } = require('../../../dist/config/community/globalVariables');

test('CSV selection preserves values, ranges and deterministic deduplication', () => {
  fs.mkdirSync('logs', { recursive: true });
  const directory = fs.mkdtempSync(path.resolve('logs/community-data-'));
  try {
    const file = path.join(directory, 'sample.csv');
    appendCSVDataRows(file, [{ id: 1, message: 'one' }, { id: 2, message: 'two' }]);
    appendCSVDataRows(file, [{ id: 1, message: 'duplicate' }, { id: 3, message: 'three' }]);
    assert.deepEqual(readCsvDataFile(file, [1, '2-3']).map(row => row.message), ['one', 'two', 'three']);
    assert.equal(readCsvDataFile(file, 'all').length, 3);
    assert.equal(redefineTestLocator('#row-{id}-{id}', { '{id}': '2' }), '#row-2-2');
  } finally {
    fs.rmSync(directory, { recursive: true, force: true });
  }
});

test('Community variables contain browser settings and read environment at access time', () => {
  const previous = process.env.HIGHLIGHT_TEST_OBJECT_ENABLED;
  try {
    process.env.HIGHLIGHT_TEST_OBJECT_ENABLED = 'true';
    assert.equal(globalVariables.HIGHLIGHT_TEST_OBJECT_ENABLED, true);
    process.env.HIGHLIGHT_TEST_OBJECT_ENABLED = 'false';
    assert.equal(globalVariables.HIGHLIGHT_TEST_OBJECT_ENABLED, false);
    assert.deepEqual(Object.keys(globalVariables).sort(), ['GUI_TIMEOUT', 'HIGHLIGHT_TEST_OBJECT_ENABLED']);
  } finally {
    if (previous === undefined) delete process.env.HIGHLIGHT_TEST_OBJECT_ENABLED;
    else process.env.HIGHLIGHT_TEST_OBJECT_ENABLED = previous;
  }
});
