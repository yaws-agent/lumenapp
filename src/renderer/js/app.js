// Lumen — renderer logic
/* uses window.lumen bridge from preload */

// ---- Navigation (with animated transitions) ----
const navItems = document.querySelectorAll('.nav-item');
const views = document.querySelectorAll('.view');
navItems.forEach((item) => {
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
      // Re-trigger blurIn animation
      el.style.animation = 'none';
      void el.offsetHeight;
      el.style.animation = '';
    }
    if (target === 'home') refreshStatus();
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
}

// ---- Buttons ----
document.getElementById('btnRestart').addEventListener('click', () => window.lumen.restartSteam());
document.getElementById('btnDiscord').addEventListener('click', () => window.lumen.discordLogin());
document.getElementById('btnDiscord2').addEventListener('click', () => window.lumen.open('https://discord.gg/'));
document.getElementById('btnSource').addEventListener('click', () => window.lumen.open('https://github.com/swwayps/slsteam-moon'));
document.getElementById('btnCheckUpdate').addEventListener('click', () => window.lumen.checkUpdate());

document.getElementById('btnInstallPlugin').addEventListener('click', async () => {
  await window.lumen.installPlugin();
  const d = document.getElementById('pluginDot'); d.className = 'status-dot ok';
  document.getElementById('pluginStatus').textContent = 'Plugin installed';
});
document.getElementById('btnUninstallPlugin').addEventListener('click', async () => {
  await window.lumen.uninstallPlugin();
  const d = document.getElementById('pluginDot'); d.className = 'status-dot bad';
  document.getElementById('pluginStatus').textContent = 'Plugin not installed';
});

// ---- Fixes (toggles write config) ----
['fixParental','fixFamily','fixNotOwned'].forEach((id) => {
  document.getElementById(id).addEventListener('change', async (e) => {
    const map = { fixParental: 'DisableParentalRestrictions', fixFamily: 'DisableFamilyShareLock', fixNotOwned: 'PlayNotOwnedGames' };
    await window.lumen.setConfig(map[id], e.target.checked ? 'yes' : 'no');
  });
});

// ---- Cloud / Manage ----
document.getElementById('cloudEnable').addEventListener('change', async (e) => {
  await window.lumen.setConfig('DisableCloud', e.target.checked ? 'no' : 'yes');
});
document.getElementById('btnCloud').addEventListener('click', () => window.lumen.manageCloud());
document.getElementById('btnBackup').addEventListener('click', () => window.lumen.backup());
document.getElementById('btnRestore').addEventListener('click', () => window.lumen.restore());

// ---- Manifestos (dropzone + install) ----
const dz = document.getElementById('dropzone');
const fileInput = document.getElementById('fileInput');
document.getElementById('btnBrowse').addEventListener('click', () => fileInput.click());
fileInput.addEventListener('change', async (e) => {
  const files = Array.from(e.target.files).map((f) => f.path);
  await window.lumen.installManifests(files);
});
['dragover','dragenter'].forEach((ev) => dz.addEventListener(ev, (e) => { e.preventDefault(); dz.classList.add('drag'); }));
['dragleave','drop'].forEach((ev) => dz.addEventListener(ev, (e) => { e.preventDefault(); dz.classList.remove('drag'); }));
dz.addEventListener('drop', async (e) => {
  const files = Array.from(e.dataTransfer.files).map((f) => f.path);
  await window.lumen.installManifests(files);
});
document.getElementById('btnInstallManifest').addEventListener('click', async () => {
  const v = document.getElementById('manifestId').value.trim();
  if (v) await window.lumen.installManifestId(v);
});

// ---- Mode ----
document.getElementById('backendSelect').addEventListener('change', async (e) => {
  await window.lumen.setMode(e.target.value);
});

// ---- Settings ----
document.getElementById('btnSaveSettings').addEventListener('click', async () => {
  const cfg = {
    steamPath: document.getElementById('steamPath').value,
    hubcapKey: document.getElementById('hubcapKey').value,
    autoUpdate: document.getElementById('autoUpdate').checked,
    autostart: document.getElementById('autostart').checked,
    notifications: document.getElementById('notif').checked,
  };
  await window.lumen.saveSettings(cfg);
  alert('Settings saved');
});

// init
refreshStatus();

// ---- Pointer-tracking sheen over cards ----
document.querySelectorAll('.card').forEach((card) => {
  card.classList.add('glass-pointer-sheen');
  card.addEventListener('mousemove', (e) => {
    const rect = card.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    card.style.setProperty('--mx', x + '%');
    card.style.setProperty('--my', y + '%');
  });
});

// ---- Set stagger indices on nav items ----
document.querySelectorAll('.nav-item').forEach((item, i) => {
  item.style.setProperty('--i', i);
});
