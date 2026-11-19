// The built-in planner: rule-based, runs in the browser, no data leaves the device.
import { TEMPLATES } from './templates.js';
import { uid } from '../util.js';

export function detectType(t) {
  t = t.toLowerCase();
  if (/(email|e-mail|message|reply|text back|write to|ask (my|the|a)|contact)/.test(t)) return 'message';
  if (/(interview)/.test(t)) return 'interview';
  if (/(apply|application|resume|cover letter|internship|linkedin)/.test(t)) return 'application';
  if (/(grocer|shopping|meal plan|meal prep|errand)/.test(t)) return 'shopping';
  if (/(clean|tidy|laundry|dishes|declutter|vacuum|organi[sz]e)/.test(t)) return 'chores';
  if (/(exam|midterm|quiz|test|final|study|review|revise)/.test(t)) return 'exam';
  if (/(presentation|slides|present|talk|pitch)/.test(t)) return 'presentation';
  if (/(read|chapter|article)/.test(t)) return 'reading';
  if (/(code|coding|program|project|implement|notebook|script|debug|app\b)/.test(t)) return 'coding';
  if (/(homework|problem set|pset|\bhw\b|worksheet|exercise)/.test(t)) return 'problems';
  if (/(essay|paper|report|write|writing|draft|thesis|reflection|post|assignment)/.test(t)) return 'writing';
  return 'generic';
}

export function sizeCap(size) {
  return size === 'tiny' ? 5 : size === 'medium' ? 20 : 10;
}

function lowerFirst(t) { return t.charAt(0).toLowerCase() + t.slice(1); }

function step(text, mins, effort, brk) {
  return { id: uid(), text, mins, effort, brk: !!brk, done: false };
}

export function breakdownLocal(title, notes, size) {
  const tpl = TEMPLATES[detectType(title)];
  const steps = tpl.map((r) => step(r[0].replace('{t}', title), r[1], r[2], r[3]));
  const n = (notes || '').toLowerCase();

  if (/(unclear|confus|do not understand|don't understand|dont understand|not sure what)/.test(n)) {
    steps.splice(1, 0, step('Write down your questions about the instructions, then send them to your instructor or TA', 5, 'low'));
  }
  if (size === 'tiny' || /(cannot start|can't start|cant start|stuck|procrastinat|avoid)/.test(n)) {
    steps.unshift(step('Open what you need and just look at it for one minute. You may stop after that.', 1, 'low'));
  }

  // split long steps to the chosen size
  const cap = sizeCap(size);
  const out = [];
  steps.forEach((s) => {
    if (s.brk || s.mins <= cap) { out.push(s); return; }
    const parts = Math.min(4, Math.ceil(s.mins / cap));
    const each = Math.ceil(s.mins / parts);
    for (let i = 1; i <= parts; i++) {
      out.push(step(i === 1 ? s.text : 'Keep going: ' + lowerFirst(s.text), each, s.effort, false));
    }
  });
  return { steps: out, tip: 'This is a starting plan. Change anything that does not fit you.', source: 'builtin' };
}
