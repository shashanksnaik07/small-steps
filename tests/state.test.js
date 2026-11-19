import test from 'node:test';
import assert from 'node:assert/strict';
import { load, defaults, KEY } from '../src/state.js';

const fakeStorage = (value) => ({ getItem: (k) => (k === KEY ? value : null) });

test('fresh start when nothing is saved', () => {
  assert.deepEqual(load(fakeStorage(null)), defaults());
});

test('saved data is restored and merged over the defaults', () => {
  const saved = JSON.stringify({ tasks: [{ id: 'a' }], today: { minutes: 90 }, settings: { theme: 'dark' } });
  const s = load(fakeStorage(saved));
  assert.equal(s.tasks.length, 1);
  assert.equal(s.today.minutes, 90);
  assert.equal(s.today.energy, 'ok');          // default kept
  assert.equal(s.settings.theme, 'dark');
  assert.equal(s.settings.font, 'hyper');      // default kept
});

test('bad saved data does not break the app', () => {
  assert.deepEqual(load(fakeStorage('{not json')), defaults());
  assert.deepEqual(load({ getItem() { throw new Error('blocked'); } }), defaults());
});
