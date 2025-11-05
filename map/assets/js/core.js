// core.js — утилиты
export const $ = s => document.querySelector(s);
export const $$ = s => Array.from(document.querySelectorAll(s));

export function toast(html, ms = 4000) {
  let el = $('#toast');
  if (!el) {
    el = document.createElement('div');
    el.id = 'toast';
    el.className = 'toast';
    document.body.appendChild(el);
  }
  el.innerHTML = html;
  el.style.display = 'block';
  clearTimeout(el._t);
  el._t = setTimeout(() => el.style.display = 'none', ms);
}

export function fmtDist(m) {
  return (m / 1000).toFixed(1).replace('.', ',') + ' км';
}

export function fmtTime(s) {
  const h = (s / 3600) | 0;
  const m = Math.round((s % 3600) / 60);
  return h ? `${h} ч ${m} мин` : `${m} мин`;
}

export function escapeHtml(s = '') {
  const div = document.createElement('div');
  div.textContent = String(s);
  return div.innerHTML;
}

export const log = (...args) => {
  if (window.TRANSTIME_CONFIG?.debug) console.log('[TT]', ...args);
};