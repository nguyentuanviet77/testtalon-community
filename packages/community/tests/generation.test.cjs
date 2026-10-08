const test = require('node:test');
const assert = require('node:assert/strict');
const data = require('../../../dist/core/lib/GenerateData');

test('random floats support fixed, negative and fractional ranges without crypto bound errors', () => {
  assert.equal(data.randomFloatInRange(3, 3), 3);
  assert.equal(data.randomFloatInRange(-1.5, -1.5), -1.5);
  for (let index = 0; index < 100; index++) {
    const value = data.randomFloatInRange(-1.5, 0.25);
    assert.ok(Number.isFinite(value) && value >= -1.5 && value <= 0.25);
  }
  assert.throws(() => data.randomFloatInRange(2, 1), /min must be less than or equal to max/);
});

test('generated strings and synthetic accounts obey requested lengths and public domain', () => {
  assert.match(data.randomNumber(8), /^\d{8}$/);
  assert.match(data.randomString(8), /^[a-zA-Z]{8}$/);
  assert.match(data.randomAlphaNumeric(8), /^[a-zA-Z0-9]{8}$/);
  assert.match(data.randomStringFromCharSet(8, 'XY'), /^[XY]{8}$/);
  assert.equal(data.generateAccountPassword(16).length, 16);
  assert.ok(data.generateAccountName().length > 0);
  assert.ok(data.generateAccountEmail('example.test').endsWith('@example.test'));
});

test('integer, date and selection generators respect fixed boundaries and input values', () => {
  assert.equal(data.randomIntInRange(-3, -3), -3);
  assert.throws(() => data.randomIntInRange(2, 1), /min must be less than or equal to max/);
  assert.equal(data.randomDateInRange(new Date(0), new Date(0)).getTime(), 0);
  assert.equal(data.randomPick(['public fixture']), 'public fixture');
  assert.equal(typeof data.randomBoolean(), 'boolean');
});
