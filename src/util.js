// Small helpers shared across the app.

export const $ = (id) => document.getElementById(id);

export function esc(s) {
  return String(s).replace(/[&<>"']/g, (c) => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
  ));
}

export function uid() {
  return Math.random().toString(36).slice(2, 9) + Date.now().toString(36).slice(-4);
}

export function openDlg(d) {
  if (d.showModal) d.showModal();
  else d.setAttribute('open', '');
}

export function closeDlg(d) {
  if (d.close) d.close();
  else d.removeAttribute('open');
}
