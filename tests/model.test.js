import test from 'node:test';
import assert from 'node:assert/strict';
import { computePlan, livePlan, sortedTasks, dueText, progress, findTask, findStep } from '../src/model.js';

const step = (id, mins, effort, extra = {}) => ({ id, text: id, mins, effort, brk: false, done: false, ...extra });

const tasks = () => [
  { id: 'late', due: '2026-12-01', created: 1, steps: [step('l1', 10, 'low'), step('l2', 10, 'low')] },
  { id: 'soon', due: '2026-11-20', created: 2, steps: [step('s1', 15, 'low'), step('sb', 5, 'low', { brk: true }), step('s2', 20, 'high')] },
  { id: 'none', due: '', created: 3, steps: [step('n1', 5, 'low')] },
];

test('tasks are ordered by due date, undated last', () => {
  assert.deepEqual(sortedTasks(tasks()).map((t) => t.id), ['soon', 'late', 'none']);
});

test('plan: fits the minutes and stops at a step that is too heavy', () => {
  const plan = computePlan(tasks(), { minutes: 60, energy: 'ok' });
  // soon: s1 (15) and the break (5), then s2 is "high" so that task stops; late: l1, l2 (20); none: n1 (5)
  assert.deepEqual(plan.map((r) => r.s), ['s1', 'sb', 'l1', 'l2', 'n1']);
});

test('plan: low energy only takes low-effort steps, good energy takes all', () => {
  const low = computePlan(tasks(), { minutes: 180, energy: 'low' }).map((r) => r.s);
  assert.ok(!low.includes('s2'));
  const high = computePlan(tasks(), { minutes: 180, energy: 'high' }).map((r) => r.s);
  assert.ok(high.includes('s2'));
});

test('plan: never ends on a break', () => {
  const t = [{ id: 'a', due: '', created: 1, steps: [step('a1', 10, 'low'), step('ab', 5, 'low', { brk: true })] }];
  assert.deepEqual(computePlan(t, { minutes: 60, energy: 'ok' }).map((r) => r.s), ['a1']);
});

test('plan: nothing fits means an empty plan, not an error', () => {
  assert.deepEqual(computePlan(tasks(), { minutes: 1, energy: 'ok' }), []);
});

test('live plan drops steps that are done', () => {
  const t = tasks();
  const plan = computePlan(t, { minutes: 60, energy: 'ok' });
  findStep(findTask(t, 'soon'), 's1').done = true;
  assert.ok(!livePlan(t, plan).some((r) => r.s === 's1'));
});

test('progress', () => {
  const t = tasks()[0];
  t.steps[0].done = true;
  assert.deepEqual(progress(t), { done: 1, total: 2, pct: 50 });
  assert.deepEqual(progress({ steps: [] }), { done: 0, total: 0, pct: 0 });
});

test('due text is calm about dates that have passed', () => {
  const now = new Date(2026, 10, 18);
  assert.equal(dueText('', now), 'No due date');
  assert.equal(dueText('2026-11-18', now), 'Due today');
  assert.equal(dueText('2026-11-19', now), 'Due tomorrow');
  assert.match(dueText('2026-11-25', now), /^Due in 7 days/);
  assert.match(dueText('2026-11-01', now), /That is okay\.$/);
});
