// "Today": pick steps that fit the time and energy a person has.
import { $, esc } from '../util.js';
import { state, save } from '../state.js';
import { findTask, findStep, computePlan, livePlan as livePlanOf } from '../model.js';

export function buildPlan() {
  state.plan = computePlan(state.tasks, state.today);
  save();
}

export function livePlan() {
  return livePlanOf(state.tasks, state.plan);
}

export function renderPlan() {
  const out = $('planOut');
  const list = livePlan();
  $('startBtn').hidden = !list.length;
  if (!state.plan.length) { out.innerHTML = ''; return; }
  if (!list.length) { out.innerHTML = '<p class="plan-total">Everything in this session is done. You can stop here, or plan another one.</p>'; return; }
  let total = 0;
  const li = list.map((r, i) => {
    const t = findTask(state.tasks, r.t);
    const s = findStep(t, r.s);
    total += s.mins;
    return '<li class="' + (s.brk ? 'brk' : '') + '"><span class="n">' + (i + 1) + '</span><span class="t">' + esc(s.text) + '<span class="of">' + esc(t.title) + '</span></span><span class="m">' + s.mins + ' min</span></li>';
  }).join('');
  out.innerHTML = '<ol class="plan-list" style="list-style:none">' + li + '</ol><p class="plan-total">About ' + total + ' minutes. You do not have to finish it all.</p>';
}

// Returns true when it showed a message instead of a plan.
export function planMessage() {
  if (!state.tasks.length) { $('planOut').innerHTML = '<p class="plan-total">Add a task first, then I can plan a session.</p>'; return true; }
  if (!state.plan.length) {
    $('planOut').innerHTML = '<p class="plan-total">Nothing fits right now. That is fine. Try a little more time, or a different energy level, or add a smaller task.</p>';
    $('startBtn').hidden = true;
    return true;
  }
  return false;
}

export function initPlan() {
  $('mins').addEventListener('change', function () { state.today.minutes = Number(this.value); save(); });
  document.querySelectorAll('input[name="energy"]').forEach((r) => {
    r.addEventListener('change', function () { state.today.energy = this.value; save(); });
  });
  $('planBtn').addEventListener('click', () => { buildPlan(); if (!planMessage()) renderPlan(); });
}
