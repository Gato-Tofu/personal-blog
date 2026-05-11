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

/* ─── HASH DE CONTRASEÑA (djb2) ──────────────────────────── */
/**
 * Hash simple para frontend. Las contraseñas nunca se guardan en texto plano.
 * En producción real usar bcrypt en un backend.
 */
function hashPass(str) {
  let h = 5381;
  for (let i = 0; i < str.length; i++) h = ((h << 5) + h) ^ str.charCodeAt(i);
  return (h >>> 0).toString(36);
}
 
/* ─── CLAVES DE LOCALSTORAGE ─────────────────────────────── */
const USERS_KEY   = 'bv_users';
const POSTS_KEY   = 'bv_posts';
const SESSION_KEY = 'bv_session';
 
/* ─── LECTURA DE DATOS ───────────────────────────────────── */
const getUsers   = () => JSON.parse(localStorage.getItem(USERS_KEY)   || '[]');
const getPosts   = () => JSON.parse(localStorage.getItem(POSTS_KEY)   || '[]');
const getSession = () => JSON.parse(localStorage.getItem(SESSION_KEY) || 'null');
 
/* ─── ESCRITURA DE DATOS ─────────────────────────────────── */
const saveUsers   = u => localStorage.setItem(USERS_KEY,   JSON.stringify(u));
const savePosts   = p => localStorage.setItem(POSTS_KEY,   JSON.stringify(p));
const saveSession = s => localStorage.setItem(SESSION_KEY, JSON.stringify(s));

/* ══════════════════════════════════════════════════════════
   NAVEGACIÓN — router de páginas
   ══════════════════════════════════════════════════════════ */
 
/** Muestra una página y oculta las demás */
function showPage(name, data = null) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  const target = $(`page-${name}`);
  if (target) target.classList.add('active');
 
  if (name === 'blog')                renderPosts();
  if (name === 'post-form')           setupForm(data || null);
  if (name === 'post-detail' && data) renderDetail(data);
 
  window.scrollTo({ top: 0, behavior: 'smooth' });
}
 
/** Navega al inicio según si hay sesión activa */
function goHome() {
  getSession() ? showPage('blog') : showPage('landing');
}

/* ══════════════════════════════════════════════════════════
   AUTENTICACIÓN
   ══════════════════════════════════════════════════════════ */
 
/** Actualiza la barra de navegación según el estado de sesión */
function updateNav() {
  const session = getSession();
  if (session) {
    $('nav-user').classList.remove('hidden');
    $('nav-username').textContent = session.name;
    $('btn-new-post').classList.remove('hidden');
    $('btn-logout').classList.remove('hidden');
    $('btn-nav-login').classList.add('hidden');
    $('btn-nav-reg').classList.add('hidden');
  } else {
    $('nav-user').classList.add('hidden');
    $('btn-new-post').classList.add('hidden');
    $('btn-logout').classList.add('hidden');
    $('btn-nav-login').classList.remove('hidden');
    $('btn-nav-reg').classList.remove('hidden');
  }
}
 
/** Registra un nuevo usuario */
function register() {
  clearErrors();
  const name  = $('reg-name').value.trim();
  const email = $('reg-email').value.trim().toLowerCase();
  const pass  = $('reg-pass').value;
  let ok = true;
 
  if (!name)                          { showErr('err-reg-name');  ok = false; }
  if (!email || !email.includes('@')) { showErr('err-reg-email'); ok = false; }
  if (pass.length < 6)                { showErr('err-reg-pass');  ok = false; }
  if (!ok) return;
 
  const users = getUsers();
  if (users.find(u => u.email === email)) {
    showErr('err-reg-email', 'Este correo ya está registrado.');
    return;
  }
 
  const user = { id: uid(), name, email, passHash: hashPass(pass) };
  users.push(user);
  saveUsers(users);
  saveSession({ id: user.id, name: user.name, email: user.email });
  updateNav();
  showToast(`¡Bienvenido, ${name}! 🎉`);
  showPage('blog');
  $('reg-name').value = $('reg-email').value = $('reg-pass').value = '';
}

/** Inicia sesión verificando credenciales */
function loginUser() {
  clearErrors();
  const email = $('login-email').value.trim().toLowerCase();
  const pass  = $('login-pass').value;
  let ok = true;
 
  if (!email) { showErr('err-login-email'); ok = false; }
  if (!pass)  { showErr('err-login-pass');  ok = false; }
  if (!ok) return;
 
  const user = getUsers().find(u => u.email === email && u.passHash === hashPass(pass));
  if (!user) {
    showErr('err-login-email', 'Correo o contraseña incorrectos.');
    return;
  }
 
  saveSession({ id: user.id, name: user.name, email: user.email });
  updateNav();
  showToast(`¡Hola de nuevo, ${user.name}!`);
  showPage('blog');
  $('login-email').value = $('login-pass').value = '';
}
 
/** Cierra la sesión activa */
function logout() {
  localStorage.removeItem(SESSION_KEY);
  updateNav();
  showToast('Sesión cerrada. ¡Hasta pronto!');
  showPage('landing');
}