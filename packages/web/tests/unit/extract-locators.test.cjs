const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { EventEmitter } = require('node:events');
const { spawnSync } = require('node:child_process');
const { parseOptions, isTargetUrl } = require('../../scripts/extract-locators');

const script = path.resolve(__dirname, '../../scripts/extract-locators.js');
const target = 'https://example.test/notifications';

// Exercise the complete orchestration with browser and disk boundaries replaced.
// No network requests, real login sessions, or repository files are created.
function harness(settings = {}) {
  const calls = { writes: [], visits: [], closed: false, prompted: false };
  let current = target;
  const page = {
    isClosed: () => false,
    goto: async (url) => {
      calls.visits.push(url);
      current = settings.redirect || url;
      return { status: () => settings.status || 200 };
    },
    url: () => current,
    waitForTimeout: async () => {},
    locator: (selector) => selector === 'input[type="password"]' ? {
      count: async () => settings.password ? 1 : 0,
      nth: () => ({ isVisible: async () => true })
    } : {
      waitFor: async () => {
        if (settings.notReady) throw new Error('Timeout or strict-mode failure');
      }
    },
    evaluate: async (callback, rules) => {
      if (settings.lateRedirect) current = 'https://example.test/login';
      if (settings.elements) return callback(rules);
      return [{ section: 'general', logicalName: 'read_Button', locator: '#read' }];
    }
  };
  const context = {
    on() {},
    pages: () => [page],
    newPage: async () => page,
    storageState: async () => ({ cookies: [], origins: [] })
  };
  const terminal = new EventEmitter();
  terminal.close = () => terminal.emit('close');
  terminal.question = async (_prompt, { signal }) => {
    calls.prompted = true;
    if (settings.commands) {
      const next = settings.commands.shift() || { answer: 'exit' };
      if (next.url) current = next.url;
      return next.answer;
    }
    if (settings.cancel) {
      terminal.emit('SIGINT');
      signal.throwIfAborted();
    }
    if (settings.redirectAfterLogin) settings.redirect = settings.redirectAfterLogin;
  };
  const module = { exports: {} };
  vm.runInNewContext(fs.readFileSync(script, 'utf8'), {
    module, __dirname: path.dirname(script), URL, AbortController,
    document: { querySelectorAll: () => settings.elements || [] },
    console: { log() {}, error() {} },
    process: { stdin: { isTTY: !settings.noTTY }, stdout: { isTTY: !settings.noTTY } },
    require: (name) => {
      if (name === 'playwright') return { chromium: { launch: async (options) => {
        calls.launch = options;
        return {
          once() {},
          newContext: async (options) => { calls.context = options; return context; },
          close: async () => { calls.closed = true; }
        };
      } } };
      if (name === 'node:fs') return {
        existsSync: () => true, mkdirSync() {}, chmodSync() {},
        writeFileSync: (file, data) => calls.writes.push({ file, data: JSON.parse(data) })
      };
      if (name === 'node:readline/promises') return { createInterface: () => terminal };
      return require(name);
    }
  });
  return { calls, run: (options = {}) => module.exports.extractLocators({ url: target, timeout: 100, ...options }) };
}

test('CLI validates arguments before browser launch', () => {
  assert.equal(parseOptions(['--url', target]).url, target);
  assert.equal(parseOptions(['--help']).help, true);
  for (const args of [[], ['--url', 'bad'], ['--url', 'file:///tmp/a'],
    ['--url', 'https://user:secret@example.test'], ['--url', target, '--timeout', '0'],
    ['--url', target, '--wait-for', ' '], ['--url', target, '--unknown'],
    ['--url', target, '--storage-state', '/missing/extractor-state.json']]) {
    assert.throws(() => parseOptions(args));
  }
  const help = spawnSync(process.execPath, [script, '--help'], { encoding: 'utf8' });
  assert.equal(help.status, 0);
  assert.match(help.stdout, /--interactive-login/);
  const invalid = spawnSync(process.execPath, [script], { encoding: 'utf8' });
  assert.equal(invalid.status, 1);
  assert.match(invalid.stderr, /--url is required/);
});

test('URL validation tolerates trailing slash but rejects changed routes and credentials destinations', () => {
  assert.equal(isTargetUrl(`${target}/`, target), true);
  for (const actual of ['https://other.test/notifications', 'https://example.test/login',
    `${target}?login=1`, `${target}#/login`]) {
    assert.equal(isTargetUrl(actual, target), false);
  }
});

test('public extraction keeps page-derived filename and JSON root', async () => {
  const { calls, run } = harness();
  const output = await run();
  assert.equal(output, path.resolve(__dirname, '../../object-repositories/gui/notifications-gui.json'));
  assert.equal(calls.writes[0].data.notifications.general.read_Button, '#read');
  assert.equal(calls.launch.headless, true);
  assert.equal(calls.closed, true);
});

test('saved session is loaded and saved only after successful validation', async () => {
  const { calls, run } = harness();
  await run({ storageState: 'existing.json', saveStorage: 'playwright/.auth/new.json', waitFor: '#ready' });
  assert.equal(calls.context.storageState, 'existing.json');
  assert.equal(calls.writes.length, 2);
  assert.deepEqual(calls.writes[0].data, { cookies: [], origins: [] });
});

for (const [name, settings, message] of [
  ['expired session redirect', { redirect: 'https://example.test/login' }, /requested URL/],
  ['unauthorized response', { status: 401 }, /HTTP 401/],
  ['forbidden response', { status: 403 }, /HTTP 403/],
  ['server error', { status: 500 }, /HTTP 500/],
  ['missing or ambiguous readiness element', { notReady: true }, /Readiness selector/],
  ['same-URL password form', { password: true }, /password field/],
  ['redirect during extraction', { lateRedirect: true }, /requested URL/]
]) {
  test(`${name} preserves output and closes the browser`, async () => {
    const { calls, run } = harness(settings);
    await assert.rejects(run({ storageState: 'state.json', saveStorage: 'state.json', waitFor: '#ready' }), message);
    assert.equal(calls.writes.length, 0);
    assert.equal(calls.closed, true);
  });
}

test('interactive login opens headed browser, prompts, then revisits target', async () => {
  const { calls, run } = harness();
  await run({ interactiveLogin: true, saveStorage: 'state.json' });
  assert.equal(calls.launch.headless, false);
  assert.equal(calls.prompted, true);
  assert.deepEqual(calls.visits, [target, target]);
  assert.equal(calls.writes.length, 2);
});

test('failed interactive login does not save files', async () => {
  const { calls, run } = harness({ redirectAfterLogin: 'https://example.test/login' });
  await assert.rejects(run({ interactiveLogin: true, saveStorage: 'state.json' }), /requested URL/);
  assert.equal(calls.writes.length, 0);
  assert.equal(calls.closed, true);
});

test('cancelled interactive login closes browser and preserves files', async () => {
  const { calls, run } = harness({ cancel: true });
  await assert.rejects(run({ interactiveLogin: true }), /cancelled/);
  assert.equal(calls.writes.length, 0);
  assert.equal(calls.closed, true);
});

test('interactive login refuses non-terminal input before launch', async () => {
  const { calls, run } = harness({ noTTY: true });
  await assert.rejects(run({ interactiveLogin: true }), /interactive terminal/);
  assert.equal(calls.launch, undefined);
});

function container(tag = 'div', className = '', role = '', parentElement = null) {
  return {
    tagName: tag.toUpperCase(), parentElement,
    getAttribute: (name) => ({ class: className, role })[name] || null
  };
}

function button(id, parentElement) {
  return { id, tagName: 'BUTTON', parentElement, offsetParent: {}, textContent: id };
}

test('extraction populates every configured section from container keywords', async () => {
  const names = ['header', 'footer', 'dashboard', 'navigation', 'filters', 'search',
    'jobResults', 'pagination', 'modal', 'general', 'alerts', 'forms', 'tables', 'tabs', 'menus'];
  const elements = names.map((name, index) => button(`item${index}`,
    container('div', name === 'general' ? 'unclassified' : name)));
  const { calls, run } = harness({ elements });
  await run();
  const result = calls.writes[0].data.notifications;
  assert.deepEqual(Object.keys(result), names);
  names.forEach((name, index) => assert.equal(result[name][`item${index}_Button`], `#item${index}`));
});

test('semantic containers beat keyword guesses and nearer ancestors beat outer containers', async () => {
  const { calls, run } = harness({ elements: [
    button('dialogAction', container('dialog', 'search-popup')),
    button('menuAction', container('div', 'navigation-list', 'menu')),
    button('formAction', container('form', '', '', container('header'))),
    button('tabAction', container('div', '', 'tablist')),
    button('tableAction', container('table')),
    button('alertAction', container('div', '', 'alert'))
  ] });
  await run();
  const result = calls.writes[0].data.notifications;
  for (const [section, id] of [['modal', 'dialogAction'], ['menus', 'menuAction'],
    ['forms', 'formAction'], ['tabs', 'tabAction'], ['tables', 'tableAction'], ['alerts', 'alertAction']]) {
    assert.equal(result[section][`${id.toLowerCase()}_Button`], `#${id}`);
  }
});

test('ancestor search includes level ten but ignores level eleven', async () => {
  let tenth = container('form');
  for (let index = 0; index < 9; index++) tenth = container('div', '', '', tenth);
  const { calls, run } = harness({ elements: [
    button('inside', tenth), button('outside', container('div', '', '', tenth))
  ] });
  await run();
  assert.equal(calls.writes[0].data.notifications.forms.inside_Button, '#inside');
  assert.equal(calls.writes[0].data.notifications.general.outside_Button, '#outside');
});


test('free browsing repeatedly captures manually visited pages without navigation', async () => {
  assert.equal(parseOptions(['--interactive']).url, undefined);
  assert.throws(() => parseOptions(['--interactive', '--interactive-login']));
  const { calls, run } = harness({ commands: [
    { answer: '', url: target },
    { answer: '', url: 'https://example.test/settings' },
    { answer: 'exit' }
  ] });
  await run({ interactive: true, url: undefined });
  assert.deepEqual(calls.visits, []);
  assert.equal(calls.writes.length, 2);
  assert.ok(calls.writes[0].data.notifications);
  assert.ok(calls.writes[1].data.settings);
  assert.equal(calls.closed, true);
});

test('free browsing recovers from blank page and allows login-form inspection', async () => {
  const { calls, run } = harness({ password: true, commands: [
    { answer: '', url: 'about:blank' },
    { answer: '', url: 'https://example.test/login' },
    { answer: 'exit' }
  ] });
  await run({ interactive: true, url: undefined, storageState: 'state.json' });
  assert.equal(calls.writes.length, 1);
  assert.ok(calls.writes[0].data.login);
  assert.equal(calls.closed, true);
});

test('free browsing only navigates once for an optional startup URL', async () => {
  const { calls, run } = harness({ commands: [
    { answer: '', url: 'https://example.test/dashboard' }, { answer: 'exit' }
  ] });
  await run({ interactive: true });
  assert.deepEqual(calls.visits, [target]);
  assert.ok(calls.writes[0].data.dashboard);
});

test('free browsing exits without capturing and refuses non-terminal input', async () => {
  const { calls, run } = harness({ commands: [{ answer: 'exit' }] });
  await run({ interactive: true, url: undefined });
  assert.equal(calls.writes.length, 0);
  assert.equal(calls.closed, true);
  await assert.rejects(harness({ noTTY: true }).run({ interactive: true }), /interactive terminal/);
});
