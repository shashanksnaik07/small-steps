// Connects voice input to the page: which button says what, and what happens with the words.
import { $ } from '../util.js';
import { state, save } from '../state.js';
import { voice } from './registry.js';
import { getRecognition, startVoice, stopVoice, silenceVoice, dictation } from './listen.js';
import { parseTask, parseToday, parseFocus, parseSettings, parseDateIn, parseSize, normNums } from './parsers.js';
import { status, submitAdd } from '../ui/add.js';
import { buildPlan, planMessage, renderPlan } from '../ui/plan.js';
import { applySettings, syncSettingsUI } from '../ui/settings.js';
import { isTimerRunning } from '../ui/focus.js';

const SIZE_LABEL = { tiny: 'tiny steps', small: 'small steps', medium: 'medium steps' };
const ENERGY_LABEL = { low: 'low energy', ok: 'okay energy', high: 'good energy' };

const isoLabel = (iso) => new Date(iso + 'T00:00:00').toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
const minsLabel = (n) => (n < 60 ? n + ' minutes' : (n === 60 ? '1 hour' : (n / 60) + ' hours'));

function setSize(size) {
  const r = document.querySelector('input[name="size"][value="' + size + '"]');
  if (r) r.checked = true;
  state.settings.stepSize = size; save();
}
function setEnergy(en) {
  const r = document.querySelector('input[name="energy"][value="' + en + '"]');
  if (r) r.checked = true;
  state.today.energy = en; save();
}
function wire(btn, make) {
  btn.hidden = false;
  btn.addEventListener('click', () => startVoice(btn, make()));
}

export function initVoice() {
  // No support: the voice buttons stay hidden and everything works by typing.
  if (!getRecognition()) return;

  /* Add card */
  wire($('micTitle'), () => dictation($('title'), false, status));
  wire($('micNotes'), () => dictation($('notes'), true, status));
  $('voiceHint').hidden = false;
  $('talkBox').hidden = false;

  wire($('sayAll'), () => ({
    continuous: true, autoStopMs: 3200, say: status,
    start: 'Listening. Say the task, when it is due, how small the steps should be, and anything that makes it hard. Then say "break it down". I will stop when you pause.',
    onInterim: (t) => status('Hearing: ' + t),
    onFinal(text) {
      const r = parseTask(text, new Date());
      const parts = [];
      if (r.title) { $('title').value = r.title; parts.push('task "' + r.title + '"'); }
      if (r.notes) { $('notes').value = r.notes; parts.push('what makes it hard'); }
      if (r.due) { $('due').value = r.due; parts.push('due ' + isoLabel(r.due)); }
      if (r.size) { setSize(r.size); parts.push(SIZE_LABEL[r.size]); }
      if (!parts.length) { status('I did not catch a task. Try: "Write my history paper, due next Friday, tiny steps, break it down". You can also type.'); return; }
      if (r.run && r.title) { status('I heard ' + parts.join(', ') + '. Making the steps now.'); submitAdd(); return; }
      status('I heard ' + parts.join(', ') + '. Check it, then say "break it down" or press the button.');
    },
  }));

  wire($('sayDate'), () => ({
    continuous: false, say: status,
    start: 'Listening. Say a date, like "next Friday", "tomorrow" or "March 5th".',
    onFinal(text) {
      const r = parseDateIn(normNums(text), new Date());
      if (!r) { status('I did not catch a date. Try "next Friday", "tomorrow" or "March 5th". You can also pick it on the calendar.'); return; }
      $('due').value = r.iso;
      status('Due date set to ' + isoLabel(r.iso) + '.');
    },
  }));

  wire($('saySize'), () => ({
    continuous: false, say: status,
    start: 'Listening. Say tiny, small or medium.',
    onFinal(text) {
      const r = parseSize(text, true);
      if (!r) { status('I did not catch a step size. Say tiny, small or medium.'); return; }
      setSize(r.size);
      status('Step size set to ' + SIZE_LABEL[r.size] + '.');
    },
  }));

  $('addForm').addEventListener('submit', silenceVoice);

  /* Today card */
  const todaySay = (m) => { $('todayStatus').textContent = m; };
  wire($('sayToday'), () => ({
    continuous: false, say: todaySay,
    start: 'Listening. For example: "I have an hour and low energy. Plan my session."',
    onFinal(text) {
      const r = parseToday(text);
      const parts = [];
      if (r.minutes) { $('mins').value = String(r.minutes); state.today.minutes = r.minutes; save(); parts.push(minsLabel(r.minutes)); }
      if (r.energy) { setEnergy(r.energy); parts.push(ENERGY_LABEL[r.energy]); }
      if (!parts.length && !r.intent) { todaySay('I did not catch a time or energy level. Try: "I have an hour and low energy."'); return; }
      todaySay(parts.length ? 'Set to ' + parts.join(' and ') + '.' : '');
      if (r.intent === 'plan' || r.intent === 'start') {
        buildPlan();
        if (!planMessage()) { renderPlan(); if (r.intent === 'start') $('startBtn').click(); }
      } else if (parts.length) {
        todaySay('Set to ' + parts.join(' and ') + '. Say "plan my session" or press the button.');
      }
    },
  }));

  /* Focus mode: hands-free commands */
  const focusSay = (m) => { $('focusMsg').textContent = m; };
  wire($('fSay'), () => ({
    continuous: false, say: focusSay,
    start: 'Listening. You can say: done, pause, start, too big, skip, five more minutes, or stop.',
    onFinal(text) {
      const a = parseFocus(text);
      if (a === 'done') $('fDone').click();
      else if (a === 'skip') $('fSkip').click();
      else if (a === 'smaller') $('fSmaller').click();
      else if (a === 'plus') $('fPlus').click();
      else if (a === 'stop') $('fStop').click();
      else if (a === 'pause') { if (isTimerRunning()) $('fToggle').click(); else focusSay('The timer is not running.'); }
      else if (a === 'start') { if (!isTimerRunning()) $('fToggle').click(); else focusSay('The timer is already running.'); }
      else focusSay('I did not catch that. You can say done, pause, start, too big, skip, five more minutes, or stop.');
    },
  }));

  /* Settings */
  const setSay = (m) => { $('setStatus').textContent = m; };
  wire($('setSaySettings'), () => ({
    continuous: false, say: setSay,
    start: 'Listening. For example: "dark mode, larger text, hide the numbers".',
    onFinal(text) {
      const list = parseSettings(text);
      if (!list.length) { setSay('I did not catch a setting. Try: dark mode, larger text, calm motion, or hide the numbers.'); return; }
      list.forEach((c) => { state.settings[c.k] = c.v; });
      save(); applySettings(); syncSettingsUI();
      setSay('Done: ' + list.map((c) => c.label).join(', ') + '.');
    },
  }));

  // The "add a step" forms are drawn later, so the task list asks for voice through this registry.
  voice.api = { supported: true, start: startVoice, dictation };

  $('focus').addEventListener('close', stopVoice);
  $('settings').addEventListener('close', stopVoice);
}
