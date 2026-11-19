import test from 'node:test';
import assert from 'node:assert/strict';
import { detectType, breakdownLocal, sizeCap } from '../src/planner/local.js';
import { cleanSteps, breakdownAI } from '../src/planner/ai.js';
import { TEMPLATES } from '../src/planner/templates.js';

test('task type is recognised from the title', () => {
  assert.equal(detectType('Study for the chemistry midterm'), 'exam');
  assert.equal(detectType('Prepare the class presentation'), 'presentation');
  assert.equal(detectType('Read chapter 4'), 'reading');
  assert.equal(detectType('Debug the Python script'), 'coding');
  assert.equal(detectType('Finish homework 3'), 'problems');
  assert.equal(detectType('Write the 5 page paper'), 'writing');
  assert.equal(detectType('Clean my room'), 'chores');
  assert.equal(detectType('Plan my groceries for the week'), 'shopping');
  assert.equal(detectType('Email my professor about an extension'), 'message');
  assert.equal(detectType('Prepare for my job interview'), 'interview');
  assert.equal(detectType('Apply for the summer internship'), 'application');
  assert.equal(detectType('Plan my sister\'s birthday'), 'generic');
});

test('every template ends without a trailing break and has valid steps', () => {
  for (const [name, tpl] of Object.entries(TEMPLATES)) {
    assert.ok(tpl.length >= 5, name);
    for (const [text, mins, effort] of tpl) {
      assert.ok(text.length > 3, name);
      assert.ok(mins >= 1 && mins <= 30, name);
      assert.ok(['low', 'med', 'high'].includes(effort), name);
    }
  }
});

test('built-in planner: first step is tiny, no step is bigger than the chosen size', () => {
  const r = breakdownLocal('Write the 5 page paper', 'I cannot get started', 'tiny');
  assert.equal(r.source, 'builtin');
  assert.equal(r.steps[0].mins, 1);
  const cap = sizeCap('tiny');
  for (const s of r.steps) assert.ok(s.brk || s.mins <= cap, s.text);
  assert.ok(r.steps.every((s) => s.id && s.done === false));
});

test('built-in planner: unclear instructions add a question step', () => {
  const r = breakdownLocal('Write an essay', 'the instructions are unclear', 'small');
  assert.ok(r.steps.some((s) => /questions about the instructions/i.test(s.text)));
});

test('AI output is cleaned before use', () => {
  const steps = cleanSteps([
    { text: '  Open the file ', mins: 2, effort: 'low' },
    { text: 'Rest', mins: 5, effort: 'medium', kind: 'break' },
    { text: '', mins: 5 },            // dropped: no text
    { text: 'No time', mins: 0 },      // dropped: bad minutes
    { text: 'Huge', mins: 500, effort: 'weird' },
  ]);
  assert.equal(steps.length, 3);
  assert.equal(steps[0].text, 'Open the file');
  assert.equal(steps[1].effort, 'med');
  assert.equal(steps[1].brk, true);
  assert.equal(steps[2].mins, 45);
  assert.equal(steps[2].effort, 'med');
  assert.deepEqual(cleanSteps('nope'), []);
});

const ok = (body) => async () => ({ ok: true, json: async () => body });

test('AI planner: good response', async () => {
  const body = { tip: 'Go gently.', steps: [1, 2, 3].map((n) => ({ text: 'Step ' + n, mins: 3, effort: 'low' })) };
  const r = await breakdownAI({ title: 'x' }, ok(body));
  assert.equal(r.source, 'ai');
  assert.equal(r.steps.length, 3);
  assert.equal(r.tip, 'Go gently.');
});

test('AI planner: errors and thin answers reject so the app can fall back', async () => {
  await assert.rejects(breakdownAI({}, async () => ({ ok: false, status: 502 })));
  await assert.rejects(breakdownAI({}, ok({ steps: [{ text: 'only one', mins: 3 }] })));
  await assert.rejects(breakdownAI({}, null));
});

test('split steps read naturally, with no "part 1 of 2" labels', () => {
  const r = breakdownLocal('Write the 5 page paper', '', 'tiny');
  assert.ok(!r.steps.some((s) => /part \d of \d/.test(s.text)));
  assert.ok(r.steps.some((s) => s.text.startsWith('Keep going: ')));
});

test('every kind of task gets a plan of a sensible length', () => {
  for (const title of ['Clean my room', 'Buy groceries', 'Email my TA', 'Interview prep', 'Apply for a job', 'Plan a trip']) {
    const r = breakdownLocal(title, '', 'small');
    assert.ok(r.steps.length >= 6 && r.steps.length <= 16, title);
  }
});
