// The optional AI planner. It calls /api/breakdown (see api/breakdown.js).
// Whatever comes back is checked before the app uses it.
import { uid } from '../util.js';

export function cleanSteps(list) {
  if (!Array.isArray(list)) return [];
  return list.slice(0, 20).map((r) => {
    const text = String((r && r.text) || '').trim().slice(0, 220);
    const mins = Math.round(Number(r && r.mins));
    let eff = String((r && r.effort) || 'med').toLowerCase();
    if (eff === 'medium') eff = 'med';
    if (['low', 'med', 'high'].indexOf(eff) < 0) eff = 'med';
    if (!text || !(mins >= 1)) return null;
    return { id: uid(), text, mins: Math.min(mins, 45), effort: eff, brk: r.kind === 'break', done: false };
  }).filter(Boolean);
}

export async function breakdownAI(payload, fetchImpl = globalThis.fetch, timeoutMs = 20000) {
  if (typeof fetchImpl !== 'function') throw new Error('no fetch');
  const ctl = typeof AbortController !== 'undefined' ? new AbortController() : null;
  const timer = setTimeout(() => { if (ctl) ctl.abort(); }, timeoutMs);
  try {
    const r = await fetchImpl('/api/breakdown', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: ctl ? ctl.signal : undefined,
    });
    if (!r.ok) throw new Error('status ' + r.status);
    const j = await r.json();
    const steps = cleanSteps(j.steps);
    if (steps.length < 3) throw new Error('too few steps');
    return { steps, tip: String(j.tip || '').slice(0, 200), source: 'ai' };
  } finally {
    clearTimeout(timer);
  }
}
