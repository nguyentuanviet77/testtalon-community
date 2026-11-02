const { test } = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');

const root = path.resolve(__dirname, '../../../..');
const { serveSampleApp, SAMPLE_APP_ROOT } = require(path.join(root, 'dist/packages/web/lib/sample-app.js'));

const origin = 'https://fixtures.example.test';

/** A browser context that records the route handler, and a way to ask it for a URL. */
async function served(app) {
  let handler;
  await serveSampleApp({ route: async (pattern, fn) => { assert.equal(pattern, `${origin}/**`); handler = fn; } }, app, origin);
  return url => new Promise(resolve => handler({ request: () => ({ url: () => url }), fulfill: async options => resolve(options) }));
}

test('the sample applications live in the sample-app folder at the repository root', () => {
  assert.equal(SAMPLE_APP_ROOT, path.join(root, 'sample-app'));
});

test('/name is answered with name.html from the application folder', async () => {
  const ask = await served('alerts-frames-windows');
  for (const page of ['alerts', 'frame', 'popup']) {
    const answer = await ask(`${origin}/${page}`);
    assert.equal(answer.path, path.join(SAMPLE_APP_ROOT, 'alerts-frames-windows', `${page}.html`));
  }
  assert.equal((await ask(`${origin}/alerts.html`)).path, path.join(SAMPLE_APP_ROOT, 'alerts-frames-windows', 'alerts.html'));
  assert.equal((await ask(`${origin}/frame?x=1#top`)).path, path.join(SAMPLE_APP_ROOT, 'alerts-frames-windows', 'frame.html'));
});

test('an unknown page or a path outside the application folder gets a 404', async () => {
  const ask = await served('alerts-frames-windows');
  for (const url of [`${origin}/`, `${origin}/missing`, `${origin}/..%2f..%2fpackage.json`, `${origin}/%2e%2e%2fcommunity-demo%2fdemo.html`, `${origin}/..%2f..%2f..%2fpackage.json`]) {
    const answer = await ask(url);
    assert.equal(answer.status, 404, url);
    assert.equal(answer.path, undefined, url);
  }
});

test('an application that does not exist is an error that names it', async () => {
  await assert.rejects(served('no-such-app'), /Sample application "no-such-app" not found/);
  for (const app of ['..', '../community-demo', '.']) await assert.rejects(served(app), /must be a folder name below/);
});
