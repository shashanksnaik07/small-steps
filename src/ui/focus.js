// Focus mode: one step at a time, with an optional gentle timer.
import { $, uid, openDlg, closeDlg } from '../util.js';
import { state, save } from '../state.js';
import { findTask, findStep } from '../model.js';
import { renderTasks } from './tasks.js';
import { renderPlan, livePlan } from './plan.js';

let queue = [];
let cur = 0;
let total = 0;
let remaining = 0;
let endAt = 0;
let timer = null;
let running = false;

export function isTimerRunning() { return running; }

const curRef = () => queue[cur];
const curStep = () => { const r = curRef(); return r ? findStep(findTask(state.tasks, r.t), r.s) : null; };
const fmt = (ms) => { const s = Math.max(0, Math.ceil(ms / 1000)); return Math.floor(s / 60) + ':' + ('0' + (s % 60)).slice(-2); };

function stopTimer() { running = false; if (timer) { clearInterval(timer); timer = null; } }

function paintTimer() {
  $('time').textContent = fmt(remaining);
  $('bar').style.width = (total ? Math.min(100, (1 - remaining / total) * 100) : 0) + '%';
}

function showStep() {
  stopTimer();
  const step = curStep();
  if (!step) { finishFocus(); return; }
  const task = findTask(state.tasks, curRef().t);
  $('focusWrap').classList.toggle('brk', !!step.brk);
  $('focusMeta').textContent = (step.brk ? 'Break' : task.title) + '  ·  step ' + (cur + 1) + ' of ' + queue.length;
  $('focusStep').textContent = step.text;
  total = Math.min(step.mins, 25) * 60000;
  remaining = total;
  $('fToggle').textContent = 'Start timer';
  $('focusMsg').textContent = step.brk ? 'There is no rush. Take the time.' : 'Start whenever you are ready.';
  $('fDone').style.display = ''; $('fToggle').style.display = ''; $('fPlus').style.display = '';
  $('fSmaller').style.display = step.brk ? 'none' : '';
  $('fSkip').style.display = step.brk ? 'none' : '';
  paintTimer();
}

function startTimer() {
  if (running) return;
  running = true;
  endAt = Date.now() + remaining;
  $('fToggle').textContent = 'Pause';
  timer = setInterval(() => {
    remaining = endAt - Date.now();
    if (remaining <= 0) {
      remaining = 0; stopTimer(); paintTimer();
      $('fToggle').textContent = 'Start timer';
      $('focusMsg').textContent = 'Time is up. Finish the sentence you are on, then choose: Done, or 5 more minutes.';
      return;
    }
    paintTimer();
  }, 250);
  $('focusMsg').textContent = 'Just this one step. Nothing else.';
}

function pauseTimer() {
  if (!running) return;
  remaining = endAt - Date.now();
  stopTimer();
  $('fToggle').textContent = 'Resume';
  $('focusMsg').textContent = 'Paused. That is okay.';
}

function finishFocus() {
  stopTimer();
  $('focusWrap').classList.remove('brk');
  $('focusMeta').textContent = '';
  $('focusStep').textContent = 'That is the session done. Nothing else is needed right now.';
  $('time').textContent = '';
  $('bar').style.width = '100%';
  $('focusMsg').textContent = 'Rest if you can.';
  ['fDone', 'fToggle', 'fPlus', 'fSmaller', 'fSkip'].forEach((id) => { $(id).style.display = 'none'; });
  renderTasks(); renderPlan();
}

export function initFocus() {
  const dlg = $('focus');

  $('startBtn').addEventListener('click', () => {
    queue = livePlan();
    if (!queue.length) return;
    cur = 0;
    openDlg(dlg);
    showStep();
  });

  $('fToggle').addEventListener('click', () => { if (running) pauseTimer(); else startTimer(); });

  $('fPlus').addEventListener('click', () => {
    const was = running;
    if (was) { remaining = endAt - Date.now(); stopTimer(); }
    remaining += 5 * 60000;
    total = Math.max(total, remaining);
    paintTimer();
    if (was) startTimer();
    else $('fToggle').textContent = remaining === 5 * 60000 ? 'Start timer' : 'Resume';
    $('focusMsg').textContent = 'Added five minutes.';
  });

  $('fDone').addEventListener('click', () => {
    const s = curStep();
    if (!s) return;
    s.done = true; save(); stopTimer();
    queue.splice(cur, 1);
    if (cur >= queue.length) cur = 0;
    renderTasks(); renderPlan();
    if (!queue.length) finishFocus();
    else { showStep(); $('focusMsg').textContent = 'Nice. One down.'; }
  });

  $('fSkip').addEventListener('click', () => {
    if (queue.length < 2) { $('focusMsg').textContent = 'This is the only step left. You can stop for now if you like.'; return; }
    const r = queue.splice(cur, 1)[0];
    queue.push(r);
    if (cur >= queue.length) cur = 0;
    showStep();
    $('focusMsg').textContent = 'Skipped for now. It is still on your list.';
  });

  $('fSmaller').addEventListener('click', () => {
    const s = curStep();
    const task = findTask(state.tasks, curRef().t);
    if (!s) return;
    if (s.mins <= 3) {
      s.text = 'Open it and look at it for one minute. You can stop after that.';
      s.mins = 1; s.effort = 'low';
    } else {
      const first = Math.max(1, Math.ceil(s.mins / 3));
      const rest = s.mins - first;
      const original = s.text;
      const next = { id: uid(), text: original, mins: rest, effort: s.effort, brk: false, done: false };
      s.text = 'Just the first bit of this: ' + original;
      s.mins = first;
      const idx = task.steps.indexOf(s);
      task.steps.splice(idx + 1, 0, next);
      queue.splice(cur + 1, 0, { t: task.id, s: next.id });
      const pi = state.plan.findIndex((r) => r.s === s.id);
      if (pi >= 0) state.plan.splice(pi + 1, 0, { t: task.id, s: next.id });
    }
    save(); renderTasks(); renderPlan(); showStep();
    $('focusMsg').textContent = 'Made it smaller. You only need to do this part.';
  });

  $('fStop').addEventListener('click', () => { stopTimer(); closeDlg(dlg); });
  dlg.addEventListener('close', stopTimer);
}
