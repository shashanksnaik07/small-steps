// App state and its storage in the browser. Nothing leaves the device.

export const KEY = 'smallsteps.v1';

export function defaults() {
  let reduce = false;
  try { reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) { /* not in a browser */ }
  return {
    tasks: [],
    plan: [],
    today: { minutes: 60, energy: 'ok' },
    settings: {
      theme: 'auto', font: 'hyper', size: 'm', motion: reduce ? 'reduced' : 'full',
      hideTime: false, stepSize: 'small', useAI: true,
    },
  };
}

export function load(storage) {
  const d = defaults();
  try {
    const s = JSON.parse((storage || globalThis.localStorage).getItem(KEY));
    if (s && s.tasks) {
      d.tasks = s.tasks;
      d.plan = s.plan || [];
      d.today = Object.assign(d.today, s.today || {});
      d.settings = Object.assign(d.settings, s.settings || {});
    }
  } catch (e) { /* no storage, or bad data: start fresh */ }
  return d;
}

// One shared object. It is changed in place so every module sees the same data.
export const state = load();

export function save() {
  try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) { /* storage full or blocked */ }
}

export function resetState() {
  const d = defaults();
  state.tasks = d.tasks;
  state.plan = d.plan;
  state.today = d.today;
  state.settings = d.settings;
  try { localStorage.removeItem(KEY); } catch (e) { /* ignore */ }
}
