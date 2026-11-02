const { test } = require('node:test');
const assert = require('node:assert/strict');
const { globalSettings, resolveGlobalSettings } = require('../../../../dist/config/global/global-settings');

test('shared GUI globals preserve types and remain independent of project environment mutations', () => {
  const previous = process.env.HIGHLIGHT_TEST_OBJECT_ENABLED;
  const original = globalSettings.HIGHLIGHT_TEST_OBJECT_ENABLED;
  try {
    globalSettings.HIGHLIGHT_TEST_OBJECT_ENABLED = false;
    process.env.HIGHLIGHT_TEST_OBJECT_ENABLED = 'true';
    assert.equal(globalSettings.HIGHLIGHT_TEST_OBJECT_ENABLED, false);
    globalSettings.HIGHLIGHT_TEST_OBJECT_ENABLED = true;
    process.env.HIGHLIGHT_TEST_OBJECT_ENABLED = 'false';
    assert.equal(globalSettings.HIGHLIGHT_TEST_OBJECT_ENABLED, true);
    assert.equal(typeof globalSettings.GUI_TIMEOUT, 'number');
    assert.equal(resolveGlobalSettings({ HIGHLIGHT_TEST_OBJECT_ENABLED: 'false' }).HIGHLIGHT_TEST_OBJECT_ENABLED, false);
  } finally {
    globalSettings.HIGHLIGHT_TEST_OBJECT_ENABLED = original;
    if (previous === undefined) delete process.env.HIGHLIGHT_TEST_OBJECT_ENABLED;
    else process.env.HIGHLIGHT_TEST_OBJECT_ENABLED = previous;
  }
});
