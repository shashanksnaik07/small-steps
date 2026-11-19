import test from 'node:test';
import assert from 'node:assert/strict';
import handler from '../api/breakdown.js';

function call({ method = 'POST', body = {}, ip = '1.1.1.' + Math.floor(Math.random() * 250) } = {}) {
  return new Promise((resolve) => {
    const res = {
      code: 200,
      status(c) { this.code = c; return this; },
      json(o) { resolve({ code: this.code, body: o }); },
    };
    handler({ method, body, headers: { 'x-forwarded-for': ip } }, res);
  });
}

const realFetch = globalThis.fetch;
const mockModel = (text, ok = true) => { globalThis.fetch = async () => ({ ok, json: async () => ({ content: [{ text }] }) }); };

test.afterEach(() => { globalThis.fetch = realFetch; delete process.env.ANTHROPIC_API_KEY; });

test('only POST is allowed', async () => {
  assert.equal((await call({ method: 'GET' })).code, 405);
});

test('without a key it says AI is not configured, so the app falls back', async () => {
  assert.equal((await call({ body: { title: 'x' } })).code, 501);
});

test('a title is required', async () => {
  process.env.ANTHROPIC_API_KEY = 'test';
  assert.equal((await call({ body: { title: '  ' } })).code, 400);
});

test('good model output is validated and returned', async () => {
  process.env.ANTHROPIC_API_KEY = 'test';
  const steps = [1, 2, 3, 4].map((n) => ({ text: 'Do thing ' + n, mins: 3, effort: 'low', kind: 'step' }));
  mockModel('```json\n' + JSON.stringify({ tip: 'Be kind to yourself.', steps }) + '\n```');
  const r = await call({ body: { title: 'Write essay', notes: 'hard', stepSize: 'tiny' } });
  assert.equal(r.code, 200);
  assert.equal(r.body.steps.length, 4);
  assert.equal(r.body.tip, 'Be kind to yourself.');
});

test('unusable model output becomes a 502 so the app uses the built-in planner', async () => {
  process.env.ANTHROPIC_API_KEY = 'test';
  mockModel(JSON.stringify({ steps: [{ text: 'one', mins: 2 }] }));
  assert.equal((await call({ body: { title: 'x' } })).code, 502);
  mockModel('not json at all');
  assert.equal((await call({ body: { title: 'x' } })).code, 502);
  mockModel('{}', false);
  assert.equal((await call({ body: { title: 'x' } })).code, 502);
});

test('per-visitor rate limit', async () => {
  process.env.ANTHROPIC_API_KEY = 'test';
  mockModel('{}', false);
  let last;
  for (let i = 0; i < 21; i++) last = await call({ body: { title: 'x' }, ip: '9.9.9.9' });
  assert.equal(last.code, 429);
});
