// Pure functions over the task list. No DOM, no storage, so they are easy to test.

export function findTask(tasks, id) {
  return tasks.find((t) => t.id === id) || null;
}

export function findStep(task, id) {
  if (!task) return null;
  return task.steps.find((s) => s.id === id) || null;
}

export function sortedTasks(tasks) {
  return tasks.slice().sort((a, b) => {
    const da = a.due ? new Date(a.due + 'T00:00:00').getTime() : Infinity;
    const db = b.due ? new Date(b.due + 'T00:00:00').getTime() : Infinity;
    if (da !== db) return da - db;
    return (a.created || 0) - (b.created || 0);
  });
}

export function dueText(due, nowDate) {
  if (!due) return 'No due date';
  const d = new Date(due + 'T00:00:00');
  const now = nowDate ? new Date(nowDate) : new Date();
  now.setHours(0, 0, 0, 0);
  const diff = Math.round((d - now) / 86400000);
  const label = d.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
  if (diff === 0) return 'Due today';
  if (diff === 1) return 'Due tomorrow';
  if (diff > 1) return 'Due in ' + diff + ' days (' + label + ')';
  return 'Date passed (' + label + '). That is okay.';
}

export function progress(task) {
  const total = task.steps.length;
  const done = task.steps.filter((s) => s.done).length;
  return { done, total, pct: total ? Math.round((done / total) * 100) : 0 };
}

export function isBreakRef(tasks, ref) {
  const s = findStep(findTask(tasks, ref.t), ref.s);
  return !!(s && s.brk);
}

// Picks the steps that fit the time and energy a person has today, soonest due first.
export function computePlan(tasks, today) {
  const mins = Number(today.minutes) || 60;
  const en = today.energy;
  const allow = en === 'low' ? ['low'] : en === 'ok' ? ['low', 'med'] : ['low', 'med', 'high'];
  const plan = [];
  let used = 0;
  sortedTasks(tasks).forEach((t) => {
    for (let i = 0; i < t.steps.length; i++) {
      const s = t.steps[i];
      if (s.done) continue;
      if (allow.indexOf(s.effort) < 0) break;
      if (used + s.mins > mins) break;
      plan.push({ t: t.id, s: s.id });
      used += s.mins;
    }
  });
  while (plan.length && isBreakRef(tasks, plan[plan.length - 1])) plan.pop();
  return plan;
}

// The planned steps that are still not done.
export function livePlan(tasks, plan) {
  return plan.filter((r) => {
    const s = findStep(findTask(tasks, r.t), r.s);
    return s && !s.done;
  });
}
