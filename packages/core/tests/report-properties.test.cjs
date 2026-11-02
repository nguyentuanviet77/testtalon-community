const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const { getReportProperties, getReportAttributes, REPORT_PROPERTIES_ANNOTATION } = require('../../../dist/packages/core/config/report-properties');

function context(use = {}, metadata = {}) {
  return {
    project: { name: 'dev', use, metadata },
    config: { workers: 4 },
    workerIndex: 3,
    parallelIndex: 1,
    annotations: [],
  };
}

test('resolved fixture overrides produce a complete, typed report object', () => {
  const info = context({ browserName: 'chromium', channel: 'chrome' }, { envProfile: 'uat', deviceName: 'Test device' });
  const properties = getReportProperties(info, {
    browserName: 'chromium', channel: 'msedge', headless: false,
    isMobile: true, viewport: { width: 390, height: 844 },
  }, { RUN_ENV: ' Staging ' });
  assert.deepEqual(properties, {
    Browser: 'msedge (chromium)', IsHeadless: false, Viewpoint: { width: 390, height: 844 },
    IsMobile: true, NumWorker: 4, WorkerIndex: 3, ParallelIndex: 1,
    Device: 'Test device', EnvProfile: 'uat', RunEnv: 'Staging', Project: 'dev',
  });
});

test('unset values use Playwright defaults and a blank environment uses the profile', () => {
  const properties = getReportProperties(context(), {}, { RUN_ENV: ' ' });
  assert.equal(properties.Browser, 'chromium');
  assert.equal(properties.IsHeadless, true);
  assert.deepEqual(properties.Viewpoint, { width: 1280, height: 720 });
  assert.equal(properties.IsMobile, false);
  assert.equal(properties.Device, 'Desktop');
  assert.equal(properties.EnvProfile, 'dev');
  assert.equal(properties.RunEnv, 'dev');
});

test('serial native runs report the scheduled worker count instead of the global limit', () => {
  const info = context({}, { mobile: { platformName: 'iOS', deviceName: 'Test phone' } });
  info.config.metadata = { actualWorkers: 1 };
  assert.equal(getReportProperties(info).NumWorker, 1);
});

test('mixed projects use the run worker count without forcing all mobile runs to one', () => {
  const info = context({ isMobile: true });
  info.config.metadata = { actualWorkers: 3 };
  assert.equal(getReportProperties(info).NumWorker, 3);
});

test('zero scheduled workers are preserved and invalid worker metadata falls back', () => {
  const info = context();
  info.config.metadata = { actualWorkers: 0 };
  assert.equal(getReportProperties(info).NumWorker, 0);
  for (const actualWorkers of [undefined, null, '1', -1, 1.5, NaN, Infinity]) {
    info.config.metadata = { actualWorkers };
    assert.equal(getReportProperties(info).NumWorker, 4);
  }
});

test('null viewport, explicit false, and zero worker identifiers are preserved', () => {
  const info = context({ viewport: null, isMobile: false, headless: false });
  info.workerIndex = 0;
  info.parallelIndex = 0;
  const properties = getReportProperties(info, info.project.use, {});
  assert.equal(properties.Viewpoint, null);
  assert.equal(properties.IsHeadless, false);
  assert.equal(properties.WorkerIndex, 0);
  assert.equal(properties.ParallelIndex, 0);
  assert.ok(getReportAttributes(properties).some(item => item.key === 'Viewpoint' && item.value === 'No fixed viewport'));
});

test('device engine and launch/context options are used for configuration fallbacks', () => {
  const info = context({ defaultBrowserType: 'webkit', contextOptions: { isMobile: true, viewport: { width: 375, height: 667 } } });
  const properties = getReportProperties(info, info.project.use, {});
  assert.equal(properties.Browser, 'webkit');
  assert.equal(properties.Device, 'Unknown');
  assert.deepEqual(properties.Viewpoint, { width: 375, height: 667 });
  const chrome = context({ launchOptions: { channel: 'chrome-beta', headless: false } });
  const fallback = getReportProperties(chrome, chrome.project.use, {});
  assert.equal(fallback.Browser, 'chrome-beta (chromium)');
  assert.equal(fallback.IsHeadless, false);
});

test('reporters retain the worker snapshot despite a different parent environment', () => {
  const info = context();
  const worker = getReportProperties(info, { browserName: 'firefox', headless: false }, { RUN_ENV: 'Worker environment' });
  info.annotations.push({ type: REPORT_PROPERTIES_ANNOTATION, description: JSON.stringify(worker) });
  const parent = getReportProperties(info, { browserName: 'chromium', channel: 'chrome' }, { RUN_ENV: 'Wrong parent environment' });
  assert.deepEqual(parent, worker);
  assert.equal(getReportAttributes(parent).length, Object.keys(worker).length);
});

test('malformed snapshots fall back safely to the supplied project configuration', () => {
  for (const description of ['invalid JSON', 'null', '{}', '{"Viewpoint":false}']) {
    const info = context({ browserName: 'firefox' });
    info.annotations.push({ type: REPORT_PROPERTIES_ANNOTATION, description });
    assert.equal(getReportProperties(info, info.project.use, {}).Browser, 'firefox');
  }
});

test('each call returns independent viewport data', () => {
  const info = context({ viewport: { width: 800, height: 600 } });
  getReportProperties(info, info.project.use, {}).Viewpoint.width = 1;
  assert.equal(getReportProperties(info, info.project.use, {}).Viewpoint.width, 800);
});

test('real runner propagates scheduled workers for serial devices, mixed projects, and CLI limits', () => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'report-workers-'));
  const runner = require.resolve('@playwright/test/cli');
  const playwright = require.resolve('@playwright/test');
  const properties = require.resolve('../../../dist/packages/core/config/report-properties');
  try {
    fs.writeFileSync(path.join(directory, 'workers.test.cjs'), `
      const { test, expect } = require(${JSON.stringify(playwright)});
      const { getReportProperties } = require(${JSON.stringify(properties)});
      for (const title of ['first', 'second']) {
        test(title, async ({}, info) => {
          expect(getReportProperties(info).NumWorker).toBe(info.config.metadata.expectedWorkers);
        });
      }
    `);
    const serialDevice = { name: 'mobile', workers: 1, fullyParallel: false,
      metadata: { mobile: { platformName: 'iOS' } } };
    const scenarios = [
      { projects: [serialDevice], expectedWorkers: 1 },
      { projects: [serialDevice, { ...serialDevice, name: 'second-device' }], expectedWorkers: 2 },
      { projects: [serialDevice, { name: 'desktop' }], expectedWorkers: 3 },
      { projects: [serialDevice, { name: 'desktop' }], expectedWorkers: 1, args: ['--workers=1'] },
      { projects: [{ name: 'desktop' }], expectedWorkers: 2 },
    ];
    for (const scenario of scenarios) {
      const configPath = path.join(directory, 'playwright.config.cjs');
      fs.writeFileSync(configPath, `module.exports = ${JSON.stringify({
        testDir: directory, outputDir: path.join(directory, 'results'),
        workers: 4, fullyParallel: true, reporter: 'list',
        projects: scenario.projects, metadata: { expectedWorkers: scenario.expectedWorkers },
      })};`);
      const run = spawnSync(process.execPath, [runner, 'test', '--config', configPath, ...(scenario.args ?? [])],
        { encoding: 'utf8', timeout: 30000, env: { ...process.env, FORCE_COLOR: '0', NO_COLOR: '1' } });
      assert.equal(run.status, 0, `${run.stdout}\n${run.stderr}`);
      // A shell that forces colours (FORCE_COLOR, CLICOLOR_FORCE) still puts escape codes between the words, so match the plain text.
      const plain = run.stdout.replace(/\x1B\[[0-9;]*m/g, '');
      assert.match(plain, new RegExp(`using ${scenario.expectedWorkers} worker`));
    }
  } finally {
    fs.rmSync(directory, { recursive: true, force: true });
  }
});
