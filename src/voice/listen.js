// Listening: a thin wrapper around the browser's built-in speech recognition.
// Nothing is recorded or kept by this app. Some browsers send audio to the browser
// maker's service to turn it into text.

export function getRecognition() {
  return window.SpeechRecognition || window.webkitSpeechRecognition || null;
}

const ERR = {
  'not-allowed': 'The microphone is blocked. You can allow it in your browser settings, or use the keyboard instead.',
  'service-not-allowed': 'Voice input is not allowed in this browser right now. Typing works fine.',
  'no-speech': 'I did not hear anything. Tap the microphone and try again, or use the keyboard.',
  'audio-capture': 'I could not find a microphone. You can use the keyboard instead.',
  'network': 'Voice input needs an internet connection in this browser. You can use the keyboard instead.',
};

let activeRec = null;
let activeBtn = null;

export function stopVoice() {
  if (activeRec) { try { activeRec.stop(); } catch (e) { /* already stopped */ } }
}

// Stops listening and drops the result (used when a form is submitted by hand).
export function silenceVoice() {
  if (activeRec) activeRec._quiet = true;
  stopVoice();
}

// cfg: { continuous, autoStopMs, start, say(msg), onInterim(text), onFinal(text) }
export function startVoice(btn, cfg) {
  const SR = getRecognition();
  if (!SR) return;
  if (activeBtn === btn) { stopVoice(); return; }
  stopVoice();

  const rec = new SR();
  let finalText = '';
  let interim = '';
  let errored = false;
  let idle = null;
  const say = cfg.say || (() => {});
  const idleLabel = btn.getAttribute('aria-label');

  rec.lang = navigator.language || 'en-US';
  rec.interimResults = true;
  rec.continuous = !!cfg.continuous;
  rec.maxAlternatives = 1;

  function bump() {
    if (!cfg.autoStopMs) return;
    clearTimeout(idle);
    idle = setTimeout(() => { try { rec.stop(); } catch (e) { /* ignore */ } }, cfg.autoStopMs);
  }

  rec.onstart = () => {
    activeRec = rec; activeBtn = btn;
    btn.classList.add('on');
    btn.setAttribute('aria-pressed', 'true');
    if (btn.classList.contains('mic')) btn.setAttribute('aria-label', 'Stop listening');
    say(cfg.start || 'Listening. Tap the microphone again when you are done.');
  };
  rec.onresult = (e) => {
    interim = '';
    for (let i = e.resultIndex; i < e.results.length; i++) {
      const r = e.results[i];
      if (r.isFinal) finalText += r[0].transcript + ' ';
      else interim += r[0].transcript;
    }
    if (cfg.onInterim) cfg.onInterim((finalText + interim).trim());
    bump();
  };
  rec.onerror = (e) => { if (ERR[e.error]) { errored = true; say(ERR[e.error]); } };
  rec.onend = () => {
    clearTimeout(idle);
    btn.classList.remove('on');
    btn.setAttribute('aria-pressed', 'false');
    if (idleLabel !== null && btn.classList.contains('mic')) btn.setAttribute('aria-label', idleLabel);
    if (activeBtn === btn) { activeBtn = null; activeRec = null; }
    if (rec._quiet || errored) return;
    const text = (finalText || interim).trim();
    if (!text) { say(ERR['no-speech']); return; }
    cfg.onFinal(text);
  };
  try { rec.start(); } catch (err) { say('I could not start the microphone. You can use the keyboard instead.'); }
}

// Speak into a text box. The words appear as they are heard.
export function dictation(field, continuous, say) {
  const base = field.value.trim();
  const max = Number(field.getAttribute('maxlength')) || 400;
  return {
    continuous,
    autoStopMs: continuous ? 3000 : 0,
    say,
    start: 'Listening. Say it however it comes out. I will stop when you pause, or tap the microphone again.',
    onInterim(t) {
      let v = base ? (t ? base + ' ' + t : base) : t;
      if (!base && v) v = v.charAt(0).toUpperCase() + v.slice(1);
      field.value = v.slice(0, max);
    },
    onFinal() { say('Got it. Check the words, fix anything that is off, then continue.'); },
  };
}
