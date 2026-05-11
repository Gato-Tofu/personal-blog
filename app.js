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

/* ══════════════════════════════════════════════════════════
   CRUD DE PUBLICACIONES
   ══════════════════════════════════════════════════════════ */
 
/** Guarda una publicación nueva o actualiza una existente */
function savePost() {
  clearErrors();
  const title   = $('post-title').value.trim();
  const content = $('post-content').value.trim();
  const editId  = $('edit-id').value;
  let ok = true;
 
  if (!title)   { showErr('err-post-title');   ok = false; }
  if (!content) { showErr('err-post-content'); ok = false; }
  if (!ok) return;
 
  const session = getSession();
  if (!session) { showToast('Sesión expirada.', 'error'); showPage('login'); return; }
 
  const posts = getPosts();
 
  if (editId) {
    const idx = posts.findIndex(p => p.id === editId);
    if (idx > -1) {
      posts[idx].title     = title;
      posts[idx].content   = content;
      posts[idx].updatedAt = new Date().toISOString();
    }
    savePosts(posts);
    showToast('Publicación actualizada ✓');
  } else {
    const post = {
      id: uid(), title, content,
      authorId:   session.id,
      authorName: session.name,
      createdAt:  new Date().toISOString(),
      updatedAt:  null,
    };
    posts.unshift(post);
    savePosts(posts);
    showToast('Publicación creada ✓');
  }
  showPage('blog');
}

/** Elimina una publicación por ID con confirmación */
function deletePost(id) {
  if (!confirm('¿Eliminar esta publicación? Esta acción no se puede deshacer.')) return;
  savePosts(getPosts().filter(p => p.id !== id));
  showToast('Publicación eliminada.');
  showPage('blog');
}
 
/** Abre el formulario de edición con los datos del post */
function editPost(id) {
  const session = getSession();
  if (!session) { showToast('Inicia sesión primero.', 'error'); showPage('login'); return; }
  showPage('post-form', id);
}

/* ══════════════════════════════════════════════════════════
   RENDERIZADO
   ══════════════════════════════════════════════════════════ */
 
/** Renderiza la grilla de publicaciones */
function renderPosts() {
  const posts   = getPosts();
  const session = getSession();
  const grid    = $('posts-grid');
 
  $('posts-count').textContent =
    `${posts.length} publicación${posts.length !== 1 ? 'es' : ''}`;
 
  if (posts.length === 0) {
    grid.innerHTML = `
      <div class="empty-state">
        <div class="icon">✍️</div>
        <h3>Aún no hay publicaciones</h3>
        <p>Sé el primero en compartir algo increíble.</p>
        ${session ? `<button class="btn btn-primary" onclick="showPage('post-form')">Crear primera entrada</button>` : ''}
      </div>`;
    return;
  }
 
  grid.innerHTML = posts.map(p => {
    const mine    = session && p.authorId === session.id;
    const excerpt = p.content.length > 180 ? p.content.slice(0, 180) + '…' : p.content;
    return `
      <article class="post-card">
        <div class="post-card-body">
          <div class="post-card-date">${fmtDate(p.createdAt)}${p.updatedAt ? ' · editado' : ''}</div>
          <div class="post-card-title" onclick='showPage("post-detail","${p.id}")'>${esc(p.title)}</div>
          <div class="post-card-excerpt">${esc(excerpt)}</div>
        </div>
        <div class="post-card-footer">
          <button class="btn btn-ghost btn-sm" onclick='showPage("post-detail","${p.id}")'>Leer →</button>
          ${mine ? `
            <button class="btn btn-ghost btn-sm" onclick='editPost("${p.id}")'>Editar</button>
            <button class="btn btn-danger btn-sm" onclick='deletePost("${p.id}")'>Eliminar</button>
          ` : ''}
          <span class="post-card-author">por ${esc(p.authorName)}</span>
        </div>
      </article>`;
  }).join('');
}

/** Muestra el detalle completo de una publicación */
function renderDetail(id) {
  const post    = getPosts().find(p => p.id === id);
  const session = getSession();
  if (!post) { showPage('blog'); return; }
 
  $('detail-date').textContent    = fmtDate(post.createdAt) + (post.updatedAt ? ' · editado' : '');
  $('detail-author').textContent  = 'por ' + post.authorName;
  $('detail-title').textContent   = post.title;
  $('detail-content').textContent = post.content;
 
  const mine = session && post.authorId === session.id;
  $('detail-actions').innerHTML = mine ? `
    <button class="btn btn-ghost"  onclick='editPost("${post.id}")'>Editar</button>
    <button class="btn btn-danger" onclick='deletePost("${post.id}")'>Eliminar</button>
  ` : '';
}
 
/** Configura el formulario para crear o editar */
function setupForm(editId) {
  $('edit-id').value = editId || '';
  if (editId) {
    const post = getPosts().find(p => p.id === editId);
    if (post) {
      $('form-title').textContent = 'Editar publicación';
      $('post-title').value   = post.title;
      $('post-content').value = post.content;
      return;
    }
  }
  $('form-title').textContent = 'Nueva publicación';
  $('post-title').value = $('post-content').value = '';
}

/* ══════════════════════════════════════════════════════════
   VALIDACIÓN
   ══════════════════════════════════════════════════════════ */
 
/** Muestra un mensaje de error en un campo */
function showErr(id, msg) {
  const el = $(id);
  if (msg) el.textContent = msg;
  el.classList.add('show');
}
 
/** Limpia todos los mensajes de error visibles */
function clearErrors() {
  document.querySelectorAll('.form-error').forEach(e => e.classList.remove('show'));
}
 
/* ══════════════════════════════════════════════════════════
   INICIALIZACIÓN
   ══════════════════════════════════════════════════════════ */
document.addEventListener('DOMContentLoaded', () => {
  updateNav();
  getSession() ? showPage('blog') : showPage('landing');
});