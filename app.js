/* ═══════════════════════════════════════════════════════════
   BlogVault — app.js
   ═══════════════════════════════════════════════════════════ */

/* ─── DOM HELPER ─────────────────────────────────────────── */
const $ = id => document.getElementById(id);
 
/* ─── UTILIDADES ─────────────────────────────────────────── */
 
/** Genera un ID único basado en timestamp + random */
function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}
 
/** Escapa caracteres HTML para prevenir XSS */
function esc(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
 
/** Formatea una fecha ISO a texto legible en español */
function fmtDate(iso) {
  return new Date(iso).toLocaleDateString('es-ES', {
    day: 'numeric', month: 'long', year: 'numeric'
  });
}
 
/** Muestra una notificación flotante */
function showToast(msg, type = 'success', ms = 3000) {
  const t = $('toast');
  t.textContent = msg;
  t.className = `show ${type}`;
  clearTimeout(t._timer);
  t._timer = setTimeout(() => (t.className = ''), ms);
}