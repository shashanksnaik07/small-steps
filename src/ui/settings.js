// Comfort settings: theme, text size, font, calm motion, hidden timer, AI on or off.
import { $, openDlg, closeDlg } from '../util.js';
import { state, save, resetState } from '../state.js';

let mq = null;
try { mq = window.matchMedia('(prefers-color-scheme: dark)'); } catch (e) { /* not in a browser */ }

export function applySettings() {
  const s = state.settings;
  const root = document.documentElement;
  const theme = s.theme === 'auto' ? ((mq && mq.matches) ? 'dark' : 'light') : s.theme;
  root.setAttribute('data-theme', theme);
  root.setAttribute('data-size', s.size);
  root.setAttribute('data-font', s.font);
  root.setAttribute('data-motion', s.motion);
  if (s.hideTime) root.setAttribute('data-hide-time', '1');
  else root.removeAttribute('data-hide-time');
}

function setRadio(name, val) {
  const r = document.querySelector('input[name="' + name + '"][value="' + val + '"]');
  if (r) r.checked = true;
}

export function syncSettingsUI() {
  const s = state.settings;
  setRadio('theme', s.theme); setRadio('size2', s.size); setRadio('font', s.font);
  $('setMotion').checked = (s.motion === 'reduced');
  $('setHide').checked = !!s.hideTime;
  $('setAI').checked = !!s.useAI;
  setRadio('size', s.stepSize);
  $('mins').value = String(state.today.minutes);
  setRadio('energy', state.today.energy);
}

function bindRadio(name, key) {
  document.querySelectorAll('input[name="' + name + '"]').forEach((r) => {
    r.addEventListener('change', function () { state.settings[key] = this.value; save(); applySettings(); });
  });
}

// onReset runs after "Clear all my data" so the screen can redraw.
export function initSettings(onReset) {
  const dlg = $('settings');
  if (mq && mq.addEventListener) mq.addEventListener('change', applySettings);
  $('openSettings').addEventListener('click', () => { syncSettingsUI(); openDlg(dlg); });
  $('closeSettings').addEventListener('click', () => closeDlg(dlg));
  bindRadio('theme', 'theme'); bindRadio('size2', 'size'); bindRadio('font', 'font');
  $('setMotion').addEventListener('change', function () { state.settings.motion = this.checked ? 'reduced' : 'full'; save(); applySettings(); });
  $('setHide').addEventListener('change', function () { state.settings.hideTime = this.checked; save(); applySettings(); });
  $('setAI').addEventListener('change', function () { state.settings.useAI = this.checked; save(); });
  $('clearAll').addEventListener('click', () => {
    if (!confirm('This removes all your tasks and settings from this browser. Continue?')) return;
    resetState();
    applySettings(); syncSettingsUI();
    if (onReset) onReset();
  });
}
