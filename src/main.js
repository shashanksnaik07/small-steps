// Entry point: connect every part of the page, then draw it.
import { $ } from './util.js';
import { initAdd } from './ui/add.js';
import { initTasks, renderTasks, expanded } from './ui/tasks.js';
import { initPlan, renderPlan } from './ui/plan.js';
import { initFocus } from './ui/focus.js';
import { initSettings, applySettings, syncSettingsUI } from './ui/settings.js';
import { initVoice } from './voice/wiring.js';

initAdd();
initTasks();
initPlan();
initFocus();
initSettings(() => {
  Object.keys(expanded).forEach((k) => { delete expanded[k]; });
  renderTasks();
  renderPlan();
  $('planOut').innerHTML = '';
});
initVoice(); // before the first draw, so the "add a step" boxes get their microphone

applySettings();
syncSettingsUI();
renderTasks();
renderPlan();
