// /map/errors.js — единые обработчики ошибок + CSP (модуль)
import { toast as coreToast } from './assets/js/core.js';

// Безопасная обёртка: если coreToast ещё не готов — используем fallback
function safeToast(msg, ms = 4000) {
  try {
    (coreToast || window.__tt_fallback_toast)(msg, ms);
  } catch {
    window.__tt_fallback_toast(msg, ms);
  }
}

// Простейший fallback-тост
window.__tt_fallback_toast = window.__tt_fallback_toast || ((html, ms = 4000) => {
  let el = document.getElementById('toast');
  if (!el) {
    el = document.createElement('div');
    el.id = 'toast';
    el.className = 'toast';
    document.body.appendChild(el);
  }
  el.innerHTML = html;
  el.style.display = 'block';
  clearTimeout(el._t);
  el._t = setTimeout(() => (el.style.display = 'none'), ms);
});

// JS runtime errors
window.addEventListener('error', (e) => {
  safeToast('JS error: ' + (e.message || 'unknown'));
  console.log('[TT error]', e);
});

// Unhandled Promise rejections
window.addEventListener('unhandledrejection', (e) => {
  const msg = e?.reason?.message || e?.reason || 'unhandled rejection';
  safeToast('Promise error: ' + msg);
  console.log('[TT unhandled]', e?.reason || e);
});

// CSP violations (не спамим report-only по style-src)
document.addEventListener('securitypolicyviolation', (e) => {
  const vd = String(e.violatedDirective || '');
  const info = `CSP: ${vd}\n${e.blockedURI || '(no URI)'}\nsource: ${e.sourceFile || 'n/a'}:${e.lineNumber || 0}`;
  const isStyleReportOnly = vd.includes('style-src') && e.disposition === 'report';
  if (!isStyleReportOnly) safeToast(info, 6000);
  console.log('[TT CSP]', e);
});
