// The task list: draw it, and handle ticking, removing, adding and deleting steps.
import { $, esc, uid } from '../util.js';
import { state, save } from '../state.js';
import { findTask, findStep, sortedTasks, dueText, progress } from '../model.js';
import { voice } from '../voice/registry.js';
import { renderPlan } from './plan.js';

export const expanded = {};

const MICSVG = '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5 11a7 7 0 0 0 14 0M12 18v3"/></svg>';
const CHECK = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7"/></svg>';

export function renderTasks() {
  const box = $('tasks');
  if (!state.tasks.length) {
    box.innerHTML = '<p class="empty">Nothing here yet. Add one task above and I will help you break it down.</p>';
    return;
  }
  box.innerHTML = sortedTasks(state.tasks).map((t) => {
    const p = progress(t);
    const open = !!expanded[t.id];
    const steps = open
      ? '<ul class="steps">' + t.steps.map((s) => (
        '<li class="step' + (s.done ? ' done' : '') + (s.brk ? ' brk' : '') + '" data-t="' + t.id + '" data-s="' + s.id + '">'
        + '<button class="check" type="button" role="checkbox" aria-checked="' + (s.done ? 'true' : 'false') + '" aria-label="Mark done: ' + esc(s.text) + '" data-act="toggle">' + CHECK + '</button>'
        + '<span class="st">' + esc(s.text) + '</span><span class="sm">' + s.mins + ' min</span>'
        + '<button class="rm" type="button" data-act="remove" aria-label="Remove this step">&times;</button></li>'
      )).join('') + '</ul>'
      + '<form class="add-step" data-t="' + t.id + '"><div class="field"><input type="text" maxlength="200" placeholder="Add a step" aria-label="Add a step to ' + esc(t.title) + '">'
      + (voice.api ? '<button class="mic" type="button" data-act="mic-step" aria-pressed="false" aria-label="Say a step out loud" title="Say it out loud">' + MICSVG + '</button>' : '')
      + '</div><button class="btn secondary" type="submit">Add</button><p class="step-say" role="status" aria-live="polite"></p></form>'
      : '';
    return '<article class="task" data-t="' + t.id + '">'
      + '<div class="task-head"><div><div class="task-title">' + esc(t.title) + '</div><div class="task-due">' + esc(dueText(t.due)) + '</div></div>'
      + '<div class="task-tools"><button class="btn ghost" type="button" data-act="expand" aria-expanded="' + open + '">' + (open ? 'Hide steps' : 'Show steps') + '</button>'
      + '<button class="btn ghost" type="button" data-act="delete">Delete</button></div></div>'
      + '<div class="prog"><div class="bar"><i style="width:' + p.pct + '%"></i></div><div class="txt">' + p.done + ' of ' + p.total + ' steps done</div></div>'
      + steps + '</article>';
  }).join('');
}

export function initTasks() {
  $('tasks').addEventListener('click', (e) => {
    const b = e.target.closest('[data-act]');
    if (!b) return;
    const act = b.getAttribute('data-act');
    const card = b.closest('.task');
    const tid = card ? card.getAttribute('data-t') : null;
    const task = findTask(state.tasks, tid);

    if (act === 'expand') { expanded[tid] = !expanded[tid]; renderTasks(); return; }
    if (act === 'delete') {
      if (!confirm('Delete "' + task.title + '"?')) return;
      state.tasks = state.tasks.filter((t) => t.id !== tid);
      state.plan = state.plan.filter((r) => r.t !== tid);
      save(); renderTasks(); renderPlan();
      return;
    }
    if (act === 'mic-step') {
      const form = b.closest('.add-step');
      const input = form.querySelector('input');
      const msg = form.querySelector('.step-say');
      if (voice.api) voice.api.start(b, voice.api.dictation(input, false, (m) => { msg.textContent = m; }));
      return;
    }
    const li = b.closest('.step');
    if (!li) return;
    const sid = li.getAttribute('data-s');
    const step = findStep(task, sid);
    if (act === 'toggle') { step.done = !step.done; save(); renderTasks(); renderPlan(); }
    if (act === 'remove') {
      task.steps = task.steps.filter((s) => s.id !== sid);
      state.plan = state.plan.filter((r) => r.s !== sid);
      save(); renderTasks(); renderPlan();
    }
  });

  $('tasks').addEventListener('submit', (e) => {
    const f = e.target.closest('.add-step');
    if (!f) return;
    e.preventDefault();
    const input = f.querySelector('input');
    const text = input.value.trim();
    if (!text) return;
    const task = findTask(state.tasks, f.getAttribute('data-t'));
    task.steps.push({ id: uid(), text, mins: 10, effort: 'med', brk: false, done: false });
    save(); renderTasks();
    const again = document.querySelector('.add-step[data-t="' + task.id + '"] input');
    if (again) again.focus();
  });
}
