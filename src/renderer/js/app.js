// Lumen — renderer logic
/* uses window.lumen bridge from preload */

// ---- Navigation (with animated transitions) ----
const navItems = document.querySelectorAll('.nav-item');
const views = document.querySelectorAll('.view');
// Inject the iridescent curved-glass hover lens into each nav item (Apple Liquid Glass style)
navItems.forEach((item) => {
  if (!item.querySelector('.glass-lens')) {
    const lens = document.createElement('span');
    lens.className = 'glass-lens';
    item.insertBefore(lens, item.firstChild);
  }
  // track cursor so the lens specular follows the pointer
  item.addEventListener('pointermove', (e) => {
    const r = item.getBoundingClientRect();
    item.style.setProperty('--mx', (((e.clientX - r.left) / r.width) * 100) + '%');
    item.style.setProperty('--my', (((e.clientY - r.top) / r.height) * 100) + '%');
  });
  item.addEventListener('click', () => {
    const target = item.dataset.view;
    navItems.forEach((n) => n.classList.remove('active'));
    item.classList.add('active');
    views.forEach((v) => {
      v.classList.add('hidden');
      v.classList.remove('view-entrance');
    });
    const el = document.getElementById('view-' + target);
    if (el) {
      el.classList.remove('hidden');
      el.classList.add('view-entrance');
    }
    if (target === 'home') { refreshStatus(); loadItems(); }
    else if (target === 'manage') { const q = (document.getElementById('manageSearch') || {}).value || ''; renderManage(q); }
  });
});

// Inject the iridescent curved-glass hover lens into each .glass-btn too (Apple Liquid Glass)
document.querySelectorAll('.glass-btn').forEach((btn) => {
  if (!btn.querySelector('.glass-lens')) {
    const lens = document.createElement('span');
    lens.className = 'glass-lens';
    btn.insertBefore(lens, btn.firstChild);
  }
  btn.addEventListener('pointermove', (e) => {
    const r = btn.getBoundingClientRect();
    btn.style.setProperty('--mx', (((e.clientX - r.left) / r.width) * 100) + '%');
    btn.style.setProperty('--my', (((e.clientY - r.top) / r.height) * 100) + '%');
  });
});

// Stagger entrance animation on view's child cards
function staggerEntrance(container) {
  const cards = container.querySelectorAll('.card');
  cards.forEach((card, i) => {
    card.style.animation = 'none';
    card.style.animationDelay = (0.08 * (i + 1)) + 's';
    void card.offsetHeight;
    card.style.animation = '';
  });
}

// ---- Home: Luas counter + added/recent lists (shared store) ----
function luaBadge(type) {
  const map = { lua: 'LUA', manifest: 'MAN', zip: 'ZIP', game: 'GAME' };
  return `<span class="item-type type-${type}">${map[type] || type.toUpperCase()}</span>`;
}
function renderHome() {
  const items = (window.__lumenItems || []);
  const count = items.length;
  const c = document.getElementById('luaCount');
  if (c) { c.textContent = count; c.classList.remove('pop'); void c.offsetWidth; c.classList.add('pop'); }

  const list = document.getElementById('homeItemList');
  if (list) {
    if (!items.length) list.innerHTML = '<p class="muted small">Nothing added yet.</p>';
    else list.innerHTML = items.map((i) => `
      <div class="item-row">
        ${luaBadge(i.type)}
        <span class="item-name">${i.name}${i.appid ? ' <span class="item-appid">#' + i.appid + '</span>' : ''}</span>
        <span class="item-when">${timeAgo(i.addedAt)}</span>
      </div>`).join('');
  }
  const recent = document.getElementById('homeRecent');
  if (recent) {
    const games = items.filter((i) => i.type === 'game').slice(0, 5);
    if (!games.length) recent.innerHTML = '<p class="muted small">No games added yet.</p>';
    else recent.innerHTML = games.map((g) => `
      <div class="recent-row">
        <div class="recent-cap">${g.image ? `<img src="${g.image}" alt="">` : (g.name || '?').charAt(0)}</div>
        <div class="recent-meta"><div class="recent-name">${g.name || 'Unknown'}</div><div class="recent-sub">added ${timeAgo(g.addedAt)}</div></div>
      </div>`).join('');
  }
}
function timeAgo(iso) {
  try {
    const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
    if (s < 60) return 'just now';
    if (s < 3600) return Math.floor(s / 60) + 'm ago';
    if (s < 86400) return Math.floor(s / 3600) + 'h ago';
    return Math.floor(s / 86400) + 'd ago';
  } catch (e) { return ''; }
}
async function loadItems() {
  try { window.__lumenItems = await window.lumen.getItems(); }
  catch (e) { window.__lumenItems = []; }
  renderHome();
}

// ---- Backend status ----
async function refreshStatus() {
  try {
    const s = await window.lumen.status();
    const dot = document.getElementById('statusDot');
    if (s.installed) { dot.className = 'status-dot ok'; document.getElementById('statusText').textContent = 'Lumen plugin active'; }
    else { dot.className = 'status-dot bad'; document.getElementById('statusText').textContent = 'Lumen plugin not active'; }
    document.getElementById('backendPath').textContent = 'Backend: ' + (s.backend || 'slsteam-moon');
  } catch (e) {
    document.getElementById('statusText').textContent = 'Status unavailable';
  }
// ---- Lightweight toast feedback ----
function toast(msg, kind) {
  let t = document.getElementById('toast');
  if (!t) {
    t = document.createElement('div');
    t.id = 'toast';
    document.body.appendChild(t);
  }
    t.id = 'toast';
    document.body.appendChild(t);
  }
  t.textContent = msg;
  t.className = 'toast show' + (kind ? ' ' + kind : '');
  clearTimeout(t._timer);
  t._timer = setTimeout(() => { t.className = 'toast'; }, 3200);
}

// ---- Buttons ----
document.getElementById('btnRestart').addEventListener('click', () => window.lumen.restartSteam());
document.getElementById('btnDiscord').addEventListener('click', () => window.lumen.discordLogin());
document.getElementById('btnDiscord2').addEventListener('click', () => window.lumen.open('https://discord.gg/'));
document.getElementById('btnSource').addEventListener('click', () => window.lumen.open('https://github.com/swwayps/slsteam-moon'));
document.getElementById('btnCheckUpdate').addEventListener('click', () => window.lumen.checkUpdate());

document.getElementById('btnInstallPlugin').addEventListener('click', async () => {
  const r = await window.lumen.installPlugin();
  const d = document.getElementById('pluginDot');
  if (r && r.ok) { d.className = 'status-dot ok'; document.getElementById('pluginStatus').textContent = 'Plugin installed'; toast('Plugin installed', 'ok'); }
  else { d.className = 'status-dot bad'; toast('Install failed: ' + ((r && r.error) || 'unknown'), 'err'); }
});
document.getElementById('btnUninstallPlugin').addEventListener('click', async () => {
  const r = await window.lumen.uninstallPlugin();
  const d = document.getElementById('pluginDot');
  if (r && r.ok) { d.className = 'status-dot bad'; document.getElementById('pluginStatus').textContent = 'Plugin not installed'; toast('Plugin uninstalled'); }
  else { toast('Uninstall failed: ' + ((r && r.error) || 'unknown'), 'err'); }
});

// ---- Fixes: placeholder tab (toggles re-wired when Fixes is implemented) ----

// ---- Cloud / Backups: moved to Settings tab (re-wired when Settings is redone) ----

// ---- Manage: searchable list of games added by Lumen App ----
function fmtDate(iso) {
  try {
    const d = new Date(iso);
    return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' }) +
      ' · ' + d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  } catch (e) { return ''; }
}
async function renderManage(query) {
  const el = document.getElementById('manageList');
  if (!el) return;
  let items = [];
  try { items = (await window.lumen.getItems()) || []; } catch (e) {}
  const games = items.filter((i) => i.type === 'game')
    .filter((g) => {
      if (!query) return true;
      const q = query.toLowerCase();
      return (g.name || '').toLowerCase().includes(q) ||
             (g.appid ? String(g.appid) : '').includes(q);
    });
  if (!games.length) {
    el.innerHTML = '<p class="muted small" style="text-align:center;padding:24px">No games found.</p>';
    return;
  }
  el.innerHTML = games.map((g) => `
    <div class="manage-row">
      <div class="manage-banner">${g.image ? `<img src="${g.image}" alt="">` : '<span class="manage-banner-ph">🎮</span>'}</div>
      <div class="manage-info">
        <div class="manage-name">${g.name || 'Unknown'}</div>
        <div class="manage-sub">appid ${g.appid || '—'} · added ${fmtDate(g.addedAt)}</div>
      </div>
    </div>`).join('');
}
const manageSearch = document.getElementById('manageSearch');
if (manageSearch) manageSearch.addEventListener('input', (e) => renderManage(e.target.value));

// ---- Home dropzone (.lua / .manifest / .zip) -> shared store ----
const dz = document.getElementById('dropzone');
const fileInput = document.getElementById('fileInput');
document.getElementById('btnBrowse').addEventListener('click', () => fileInput.click());
fileInput.addEventListener('change', async (e) => {
  const files = Array.from(e.target.files).map((f) => f.name);
  await addDroppedFiles(files);
});
['dragover','dragenter'].forEach((ev) => dz.addEventListener(ev, (e) => { e.preventDefault(); dz.classList.add('drag'); }));
['dragleave','drop'].forEach((ev) => dz.addEventListener(ev, (e) => { e.preventDefault(); dz.classList.remove('drag'); }));
dz.addEventListener('drop', async (e) => {
  const files = Array.from(e.dataTransfer.files).map((f) => f.name);
  await addDroppedFiles(files);
});
async function addDroppedFiles(files) {
  let added = 0;
  for (const name of files) {
    const ext = name.split('.').pop().toLowerCase();
    const type = ext === 'lua' ? 'lua' : (ext === 'manifest' ? 'manifest' : 'zip');
    await window.lumen.addItem({ name, type, file: name });
    added++;
  }
  if (added) { await loadItems(); toast(added + ' file(s) added', 'ok'); }
  else toast('No .lua / .manifest / .zip files', 'err');
}

// ---- Mode ----
document.getElementById('backendSelect').addEventListener('change', async (e) => {
  await window.lumen.setMode(e.target.value);
});

// ---- Settings ----
document.getElementById('btnSaveSettings').addEventListener('click', async () => {
  const cfg = {
    steamPath: document.getElementById('steamPath').value,
    hubcapKey: document.getElementById('hubcapKey').value,
    autoUpdate: document.getElementById('autoUpdate').classList.contains('on'),
    autostart: document.getElementById('autostart').classList.contains('on'),
    notifications: document.getElementById('notif').classList.contains('on'),
  };
  await window.lumen.saveSettings(cfg);
  toast('Settings saved', 'ok');
});

// ---- Auto-update (About > Check for Updates) ----
const btnCheckUpdate = document.getElementById('btnCheckUpdate');
if (btnCheckUpdate) {
  btnCheckUpdate.addEventListener('click', async () => {
    btnCheckUpdate.disabled = true;
    btnCheckUpdate.textContent = 'Checking…';
    const r = await window.lumen.checkUpdate().catch(() => ({ ok: false }));
    btnCheckUpdate.disabled = false;
    btnCheckUpdate.textContent = 'Check for Updates';
    if (!r || !r.ok) { toast('Update check unavailable', 'err'); return; }
    toast('You are on the latest version', 'ok');
  });
}
// Updater events pushed from the main process (via preload bridge)
if (window.lumen && window.lumen.onUpdate) {
  window.lumen.onUpdate('update:available', () => toast('Update available — downloading…', 'ok'));
  window.lumen.onUpdate('update:progress', () => {});
  window.lumen.onUpdate('update:ready', () => {
    if (confirm('A new version of Lumen is ready. Restart and install now?')) window.lumen.quitAndInstall();
  });
}

// init
refreshStatus();
loadItems();

// ---- Programmatic navigation helper (for automated screenshot capture) ----
window.__nav = (view) => {
  const item = document.querySelector('.nav-item[data-view="' + view + '"]');
  if (item) item.click();
};

// ---- Keyboard view navigation (1-8) for testing/screenshots ----
const viewOrder = ['home','plugin','fixes','manage','add','mode','settings','about'];
document.addEventListener('keydown', (e) => {
  if (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT') return;
  const n = parseInt(e.key, 10);
  if (n >= 1 && n <= viewOrder.length) {
    const v = viewOrder[n - 1];
    const item = document.querySelector('.nav-item[data-view="' + v + '"]');
    if (item) item.click();
  }
});

// ---- Pointer-tracking sheen over cards and dropzones ----
// Create a dedicated overlay div so we don't clobber .card::before/::after.
document.querySelectorAll('.card, .dropzone').forEach((el) => {
  el.classList.add('glass-pointer-sheen');
  const sheen = document.createElement('div');
  sheen.className = 'pointer-sheen';
  el.appendChild(sheen);
  el.addEventListener('mousemove', (e) => {
    const rect = el.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    el.style.setProperty('--mx', x + '%');
    el.style.setProperty('--my', y + '%');
  });
});

// ---- Set stagger indices on nav items ----
document.querySelectorAll('.nav-item').forEach((item, i) => {
  item.style.setProperty('--i', i);
});

// ---- Deep-link to a view via ?view=fixes (Chromium/Electron screenshot helper) ----
// ?static=1 (or prefers-reduced-motion) disables entrance animations -> shows settled state
(function () {
  try {
    const params = new URLSearchParams(location.search);
    const reduce = params.get('static') === '1' ||
      (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
    if (reduce) document.body.classList.add('no-anim');
    const m = params.get('view');
    if (m) {
      const go = () => window.__nav(m);
      if (document.readyState === 'complete' || document.readyState === 'interactive') setTimeout(go, 60);
      else document.addEventListener('DOMContentLoaded', () => setTimeout(go, 60));
    }
    // ?lens=X forces the iridescent hover lens visible on a nav item (screenshot aid)
    const lens = params.get('lens');
    if (lens) {
      const apply = () => {
        const it = document.querySelector('.nav-item[data-view="' + lens + '"]');
        if (it) { it.style.setProperty('--mx','50%'); it.style.setProperty('--my','42%');
          const l = it.querySelector('.glass-lens'); if (l) l.style.opacity = '1'; }
      };
      if (document.readyState === 'complete' || document.readyState === 'interactive') setTimeout(apply, 120);
      else document.addEventListener('DOMContentLoaded', () => setTimeout(apply, 120));
    }
  } catch (e) {}
})();
