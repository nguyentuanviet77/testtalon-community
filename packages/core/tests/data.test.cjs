const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const modulePath = require.resolve('../../../dist/packages/core/lib/common-funcs');
const { readCsvDataFile, appendCSVDataRows, redefineTestLocator, resolveProjectPath } = require(modulePath);

function runInProject(t, source) {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'testtalon-path-aliases-'));
  t.after(() => fs.rmSync(directory, { recursive: true, force: true }));
  const script = `
    const assert = require('node:assert/strict');
    const fs = require('node:fs');
    const path = require('node:path');
    const fnLib = require(${JSON.stringify(modulePath)});
    (async () => { ${source} })().catch(error => { console.error(error); process.exitCode = 1; });
  `;
  const result = spawnSync(process.execPath, ['-e', script], { cwd: directory, encoding: 'utf8', timeout: 30000 });
  assert.equal(result.status, 0, result.stdout + result.stderr);
}

test('project path aliases resolve source folders without requiring files or an import loader', () => {
  const root = path.resolve('logs/project path fixture');
  const mappings = {
    '@data': 'data', '@config': 'config', '@packages': 'packages',
    '@objectRepositories': 'object-repositories', '@tests': 'tests', '@logs': 'logs',
  };
  for (const [alias, directory] of Object.entries(mappings)) {
    assert.equal(resolveProjectPath(alias, root), path.join(root, directory));
    assert.equal(resolveProjectPath(`${alias}/nested/file.csv`, root), path.join(root, directory, 'nested/file.csv'));
    assert.equal(resolveProjectPath(`${alias}/`, root), path.join(root, directory));
  }
  assert.equal(resolveProjectPath('@data/example.csv'), path.resolve('data/example.csv'));
  assert.equal(resolveProjectPath('@data//nested/../file.csv', root), path.join(root, 'data/file.csv'));
  assert.equal(resolveProjectPath('./data/../file.csv', root), path.join(root, 'file.csv'));
  assert.equal(resolveProjectPath(path.join(root, 'absolute.csv'), os.tmpdir()), path.join(root, 'absolute.csv'));
  for (const literal of ['@database/file.csv', '@data-backup/file.csv', '@unknown/file.csv', 'folder/@data/file.csv']) {
    assert.equal(resolveProjectPath(literal, root), path.resolve(root, literal));
  }
});

test('compiled CSV readers accept aliases and preserve selection, headers and missing-file behavior', t => {
  runInProject(t, String.raw`
    fs.mkdirSync('data/web', { recursive: true });
    fs.writeFileSync('data/web/people.csv', 'id,message\n1,one\n2,"two, quoted"\n3,three\n4,four\n5,five\n6,six\n');
    const alias = '@data/web/people.csv';
    const relative = 'data/web/people.csv';
    const absolute = path.resolve(relative);
    const selected = fnLib.readCsvDataFile(alias, ['2-5'], false);
    assert.deepEqual(selected.map(row => row.id), ['2', '3', '4', '5']);
    assert.equal(selected[0].message, 'two, quoted');
    assert.deepEqual(selected, fnLib.readCsvDataFile(relative, ['2-5'], false));
    assert.deepEqual(selected, fnLib.readCsvDataFile(absolute, ['2-5'], false));
    assert.deepEqual(fnLib.readCsvDataFile(alias, [2, '2-3']).map(row => row.id), ['2', '3']);
    assert.deepEqual(fnLib.readCsvDataFile(alias, 'all', true)[0], ['id', 'message']);
    assert.deepEqual(fnLib.readDataFromFile(alias), fnLib.readDataFromFile(relative));
    assert.equal(fnLib.readDataFromFile(alias)[0].column0, 'id');
    const errors = [];
    const saved = console.error;
    try {
      console.error = message => errors.push(message);
      assert.deepEqual(fnLib.readCsvDataFile('@data/missing.csv'), []);
    } finally { console.error = saved; }
    assert.deepEqual(errors, ['File not found: ' + path.resolve('data/missing.csv')]);
    assert.equal(fs.existsSync('@data'), false);
  `);
});

test('CSV writer entry points resolve aliases before creating directories and retain deduplication', t => {
  runInProject(t, String.raw`
    const file = '@data/output/accounts.csv';
    assert.equal(fs.existsSync(fnLib.resolveProjectPath(file)), false);
    fnLib.appendCSVDataRows(file, [{ id: 1, message: 'one' }, { id: 2, message: 'two' }]);
    fnLib.appendCSVData(file, { id: 1, message: 'duplicate' });
    fnLib.appendRowToCsv(file, { id: 3, message: 'three' });
    assert.deepEqual(fnLib.readCsvDataFile(file), [
      { id: '1', message: 'one' }, { id: '2', message: 'two' }, { id: '3', message: 'three' },
    ]);
    assert.ok(fs.existsSync('data/output/accounts.csv'));
    assert.equal(fs.existsSync('@data'), false);
    fnLib.appendCSVDataRows('@logs/empty.csv', []);
    assert.equal(fs.existsSync('logs'), false);
  `);
});

test('file helpers reject bare root aliases before creating stray directories', t => {
  runInProject(t, String.raw`
    for (const file of ['@/data/web/users.csv', '@\\data\\users.csv']) {
      const message = /Use a named project alias/;
      assert.throws(() => fnLib.resolveProjectPath(file), message);
      assert.throws(() => fnLib.readCsvDataFile(file), message);
      assert.throws(() => fnLib.readDataFromFile(file), message);
      assert.throws(() => fnLib.appendCSVDataRows(file, [{ id: 1 }]), message);
      assert.throws(() => fnLib.appendCSVData(file, { id: 1 }), message);
      assert.throws(() => fnLib.appendRowToCsv(file, { id: 1 }), message);
      await assert.rejects(fnLib.extractFailedTestSteps(file), message);
    }
    assert.equal(fs.existsSync('@'), false);
    assert.deepEqual(fs.readdirSync('.'), []);
  `);
});

test('failed-step JSON reader accepts a log alias without changing extraction behavior', t => {
  runInProject(t, String.raw`
    fs.mkdirSync('logs');
    const report = { suites: [{ suites: [{ specs: [{ title: 'fixture case', tests: [{ status: 'unexpected', results: [{ steps: [
      { title: 'failed step', error: { message: '\u001b[31mfixture error\u001b[0m' } },
    ] }] }] }] }] }] };
    fs.writeFileSync('logs/result.json', JSON.stringify(report));
    const result = await fnLib.extractFailedTestSteps('@logs/result.json', 'fixture case');
    assert.deepEqual(result, [{ title: 'failed step', error: 'fixture error' }]);
    assert.deepEqual(result, await fnLib.extractFailedTestSteps(path.resolve('logs/result.json'), 'fixture case'));
  `);
});

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

