// The "What do you need to get done?" form.
import { $, uid } from '../util.js';
import { state, save } from '../state.js';
import { breakdownLocal } from '../planner/local.js';
import { breakdownAI } from '../planner/ai.js';
import { renderTasks, expanded } from './tasks.js';

export function status(msg) { $('addStatus').textContent = msg; }

const EXAMPLE = { title: 'Write the 5 page paper for ENG 101', notes: 'The instructions are unclear and I cannot get started.' };

export function submitAdd() {
  $('addForm').dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }));
}

export function initAdd() {
  $('exampleBtn').addEventListener('click', () => {
    $('title').value = EXAMPLE.title;
    $('notes').value = EXAMPLE.notes;
    $('title').focus();
  });

  document.querySelectorAll('input[name="size"]').forEach((r) => {
    r.addEventListener('change', function () { state.settings.stepSize = this.value; save(); });
  });

  $('addForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const title = $('title').value.trim();
    const notes = $('notes').value.trim();
    const due = $('due').value;
    const size = (document.querySelector('input[name="size"]:checked') || {}).value || 'small';
    if (!title) { status('Type a task first, even a rough one.'); $('title').focus(); return; }

    state.settings.stepSize = size;
    const btn = $('goBtn');
    btn.disabled = true;
    status('Thinking it through...');

    let res;
    if (state.settings.useAI) {
      try { res = await breakdownAI({ title, notes, due: due || null, stepSize: size }); }
      catch (err) { res = breakdownLocal(title, notes, size); }
    } else {
      res = breakdownLocal(title, notes, size);
    }

    const task = { id: uid(), title, due: due || '', notes, created: Date.now(), steps: res.steps };
    state.tasks.push(task);
    expanded[task.id] = true;
    save();
    $('title').value = ''; $('notes').value = ''; $('due').value = '';
    renderTasks();
    const who = res.source === 'ai' ? 'AI wrote these steps.' : 'Built-in planner wrote these steps.';
    status('Done. ' + who + ' ' + (res.tip || 'Change anything that does not fit.'));
    btn.disabled = false;
  });
}
