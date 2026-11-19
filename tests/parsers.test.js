import test from 'node:test';
import assert from 'node:assert/strict';
import {
  parseDateIn, parseTask, parseToday, parseFocus, parseSettings, parseSize, normNums, snapMinutes,
} from '../src/voice/parsers.js';

// Wednesday, 18 November 2026
const NOW = new Date(2026, 10, 18);

test('dates: relative words', () => {
  assert.equal(parseDateIn('due tomorrow', NOW).iso, '2026-11-19');
  assert.equal(parseDateIn('day after tomorrow', NOW).iso, '2026-11-20');
  assert.equal(parseDateIn('in 2 weeks', NOW).iso, '2026-12-02');
  assert.equal(parseDateIn('next friday', NOW).iso, '2026-11-20');
  assert.equal(parseDateIn('end of the month', NOW).iso, '2026-11-30');
});

test('dates: month and day, in both orders', () => {
  assert.equal(parseDateIn('March 5th', NOW).iso, '2027-03-05'); // already passed this year
  assert.equal(parseDateIn('the 20th of November', NOW).iso, '2026-11-20');
  assert.equal(parseDateIn('12/25', NOW).iso, '2026-12-25');
});

test('dates: nothing found', () => {
  assert.equal(parseDateIn('write my paper', NOW), null);
});

test('number words become digits only in date and time spots', () => {
  assert.equal(normNums('march fifth'), 'march 5th');
  assert.equal(normNums('two hours'), '2 hours');
  assert.equal(normNums('twenty one days'), '21 days');
});

test('step size', () => {
  assert.equal(parseSize('with tiny steps', false).size, 'tiny');
  assert.equal(parseSize('small steps', false).size, 'small');
  assert.equal(parseSize('medium steps', false).size, 'medium');
  assert.equal(parseSize('tiny', true).size, 'tiny');
  assert.equal(parseSize('small', false), null); // a bare "small" only counts when asked for a size
  assert.equal(parseSize('small', true).size, 'small');
});

test('talk it through: one sentence fills the whole form', () => {
  const r = parseTask('Write my history paper, due next Friday, tiny steps, I cannot get started, break it down', NOW);
  assert.equal(r.title, 'Write my history paper');
  assert.equal(r.due, '2026-11-20');
  assert.equal(r.size, 'tiny');
  assert.match(r.notes, /cannot get started/i);
  assert.equal(r.run, true);
});

test('talk it through: no command means no auto-run', () => {
  const r = parseTask('I need to study for chemistry', NOW);
  assert.equal(r.title, 'Study for chemistry');
  assert.equal(r.run, false);
});

test('today: time, energy and intent', () => {
  const r = parseToday('I have an hour and low energy, plan my session');
  assert.deepEqual(r, { minutes: 60, energy: 'low', intent: 'plan' });
  assert.equal(parseToday('two hours, feeling great, let us go').minutes, 120);
  assert.equal(parseToday('start').intent, 'start');
});

test('minutes snap to the options in the menu', () => {
  assert.equal(snapMinutes(50), 45);
  assert.equal(snapMinutes(500), 180);
});

test('focus commands', () => {
  assert.equal(parseFocus('done'), 'done');
  assert.equal(parseFocus('this is too big'), 'smaller');
  assert.equal(parseFocus('five more minutes'), 'plus');
  assert.equal(parseFocus('skip this one'), 'skip');
  assert.equal(parseFocus('pause'), 'pause');
  assert.equal(parseFocus('stop'), 'stop');
  assert.equal(parseFocus('banana'), null);
});

test('settings by voice', () => {
  const list = parseSettings('dark mode, larger text, hide the numbers');
  const by = Object.fromEntries(list.map((c) => [c.k, c.v]));
  assert.deepEqual(by, { theme: 'dark', size: 'l', hideTime: true });
  assert.deepEqual(parseSettings('hello there'), []);
});
