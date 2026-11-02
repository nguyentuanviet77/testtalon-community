const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const os = require('node:os');
const { spawnSync } = require('node:child_process');
const reportUtils = require('../../../dist/packages/core/config/report-properties');

function harness(actualWorkers = 1) {
  const logs = [];
  const completed = [];
  const filename = path.resolve(__dirname, '../../../dist/packages/reporting/custom/test-run-reporter.js');
  const module = { exports: {} };
  const dist = path.resolve(__dirname, '../../../dist');
  const mocks = {
    'packages/core/config/logger': { info: entry => logs.push(entry), error: entry => logs.push(entry) },
    'packages/core/lib/common-funcs': { formatLocalTime: date => date.toISOString() },
    'packages/core/config/report-properties': reportUtils,
  };
  vm.runInNewContext(fs.readFileSync(filename, 'utf8'), {
    module, exports: module.exports,
    require: name => {
      const key = name.startsWith('.') ? path.relative(dist, path.resolve(path.dirname(filename), name)).split(path.sep).join('/').replace(/\.js$/, '') : name;
      if (Object.hasOwn(mocks, key)) return mocks[key];
      assert.ok(key.startsWith('node:'), `Shared reporter imports an unexpected dependency: ${key}`);
      return require(name);
    },
  }, { filename });
  class RecordingReporter extends module.exports.TestRunReporter {
    async onRunComplete(summary, outputDirs) { completed.push({ summary, outputDirs }); }
  }
  const reporter = new RecordingReporter();
  const project = { name: 'dev', use: { browserName: 'chromium' }, metadata: { envProfile: 'dev' }, outputDir: 'logs/test-results' };
  const testCase = { title: 'example', annotations: [], parent: { project: () => project } };
  reporter.onBegin({ workers: 4, metadata: { actualWorkers }, projects: [project] }, {});
  return { reporter, testCase, logs, completed, SharedReporter: module.exports.TestRunReporter };
}

test('shared reporter preserves totals, skip reasons, scheduled workers and timing', async () => {
  const { reporter, testCase, logs, completed } = harness(2);
  for (const status of ['passed', 'failed', 'timedOut', 'interrupted', 'skipped', 'skipped']) {
    reporter.onTestEnd(testCase, { status, workerIndex: 0, parallelIndex: 0, annotations: status === 'skipped'
      ? [{ type: 'skip', description: 'Set SECURITY_BASE_URL to run this.' }] : [] });
  }
  reporter.onError({ stack: 'synthetic runner error' });
  await reporter.onEnd({ status: 'failed', startTime: new Date('2026-01-01T00:00:00Z'), duration: 2000 });
  await reporter.onExit();
  assert.equal(completed.length, 1);
  const { summary, outputDirs } = completed[0];
  assert.deepEqual([summary.total, summary.passed, summary.failed, summary.skipped, summary.workers], [6, 1, 3, 2, 2]);
  assert.equal(summary.duration, '00 hours 00 minutes 02 seconds');
  assert.equal(summary.startTime, '2026-01-01T00:00:00.000Z');
  assert.equal(summary.status, 'failed');
  assert.equal(summary.errors, 1);
  assert.ok(Math.abs(summary.passRate - 16.666667) < 0.000001);
  assert.deepEqual(Array.from(outputDirs), ['logs/test-results']);
  assert.deepEqual(logs.filter(entry => entry.event === 'Skip Reason').map(entry => entry.message),
    ['Set SECURITY_BASE_URL to run this.', 'Set SECURITY_BASE_URL to run this.']);
  assert.ok(logs.some(entry => entry.event === 'Summary' && entry.message.includes('ERRORS: [1]')));
  assert.equal(Object.hasOwn(summary, 'reportPortalLink'), false);
});

test('reasonless skips and non-skipped attempts never print a skip reason', () => {
  const { reporter, testCase, logs } = harness();
  reporter.onTestEnd(testCase, { status: 'skipped', workerIndex: 0, parallelIndex: 0, annotations: [{ type: 'skip' }] });
  reporter.onTestEnd(testCase, { status: 'passed', workerIndex: 0, parallelIndex: 0, annotations: [{ type: 'skip', description: 'not a skipped attempt' }] });
  assert.equal(logs.filter(entry => entry.event === 'Skip Reason').length, 0);
});

test('explicit steps and test lifecycle events are logged without logging framework steps', () => {
  const { reporter, testCase, logs } = harness();
  reporter.onTestBegin(testCase);
  for (const category of ['test.step', 'pw:api']) {
    reporter.onStepBegin(testCase, { workerIndex: 0 }, { category, title: 'example step' });
    reporter.onStepEnd(testCase, { workerIndex: 0 }, { category, title: 'example step' });
  }
  assert.equal(logs.filter(entry => entry.event === 'Started TestCase').length, 1);
  assert.equal(logs.filter(entry => entry.event === 'Executing Step').length, 1);
  assert.equal(logs.filter(entry => entry.event === 'Completed Step').length, 1);
  for (const entry of logs.filter(entry => ['Executing Step', 'Completed Step'].includes(entry.event))) {
    assert.equal(entry.message, 'example step | Test: example | Worker: 0');
  }
});

test('identical step titles remain distinguishable across tests and workers', () => {
  const { reporter, testCase, logs } = harness(2);
  reporter.onStepBegin(testCase, { workerIndex: 0 }, { category: 'test.step', title: 'Navigate to the home page' });
  reporter.onStepBegin({ ...testCase, title: 'another example' }, { workerIndex: 1 }, { category: 'test.step', title: 'Navigate to the home page' });
  assert.deepEqual(logs.filter(entry => entry.event === 'Executing Step').map(entry => entry.message), [
    'Navigate to the home page | Test: example | Worker: 0',
    'Navigate to the home page | Test: another example | Worker: 1',
  ]);
});

test('development logger writes one formatted console line and retains file output', t => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'testtalon-logger-output-'));
  t.after(() => fs.rmSync(directory, { recursive: true, force: true }));
  const loggerFile = path.resolve(__dirname, '../../../dist/packages/core/config/logger.js');
  const marker = 'single-development-log-entry';
  const child = spawnSync(process.execPath, ['-e', `
    const logger = require(${JSON.stringify(loggerFile)}).default;
    logger.info({ event: 'Executing Step', message: ${JSON.stringify(marker)} });
    logger.end();
  `], { cwd: directory, encoding: 'utf8', env: { PATH: process.env.PATH, NODE_ENV: 'development' } });
  assert.equal(child.status, 0, child.stderr);
  assert.equal(child.stdout.split(marker).length - 1, 1, 'Console output must not echo the plain message');
  assert.ok(child.stdout.includes('[Executing Step]'));
  const files = fs.readdirSync(path.join(directory, 'logs')).filter(file => file.endsWith('.log'));
  const output = files.map(file => fs.readFileSync(path.join(directory, 'logs', file), 'utf8')).join('');
  assert.equal(output.split(marker).length - 1, 1, 'File transport must still write the entry');
  assert.ok(output.includes('[Executing Step]'));
});

test('zero-test completion and the unextended shared hook require no integration configuration', async () => {
  const { reporter, completed, SharedReporter } = harness(0);
  await reporter.onEnd({ status: 'passed', startTime: new Date(), duration: 0 });
  await reporter.onExit();
  assert.equal(completed[0].summary.total, 0);
  assert.equal(completed[0].summary.passRate, 0);
  assert.equal(completed[0].summary.workers, 0);
  await new SharedReporter().onExit();
});
