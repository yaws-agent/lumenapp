const { app, BrowserWindow, ipcMain, shell } = require('electron');
const path = require('path');
const fs = require('fs');

// ---- Backend bridge (slsteam-moon) ----
const os = require('os');
const { execSync, spawn } = require('child_process');
const CONFIG_DIR = path.join(os.homedir(), '.config', 'SLSsteam');
const CONFIG_FILE = path.join(CONFIG_DIR, 'config.yml');
const API_PIPE = '/tmp/SLSsteam.API';
const SLS_DIR = path.join(os.homedir(), '.local', 'share', 'SLSsteam');
const BACKUP_FILE = path.join(CONFIG_DIR, 'config.yml.bak');

// Resolve the slsteam-moon setup.sh (installer). Search common locations.
function findSetup() {
  const cand = [
    process.env.SLSTEAM_MOON_SETUP,
    path.join(SLS_DIR, 'setup.sh'),
    '/opt/slsteam-moon/setup.sh',
    path.join(__dirname, '..', 'slsteam-moon', 'setup.sh'),
  ];
  for (const c of cand) {
    if (c && fs.existsSync(c)) return c;
  }
  return null;
}

function ensureConfig() {
  if (!fs.existsSync(CONFIG_DIR)) fs.mkdirSync(CONFIG_DIR, { recursive: true });
  if (!fs.existsSync(CONFIG_FILE)) {
    // Defaults mirror slsteam-moon's config_default.hpp where it matters.
    fs.writeFileSync(CONFIG_FILE,
      '# Lumen-managed slsteam-moon config\n' +
      'DisableFamilyShareLock: yes\n' +
      'DisableParentalRestrictions: no\n' +
      'PlayNotOwnedGames: no\n' +
      'DisableCloud: no\n' +
      'API: yes\n' +
      'Notifications: yes\n' +
      'LogLevel: 2\n');
  }
}
function readConfig() {
  ensureConfig();
  return fs.readFileSync(CONFIG_FILE, 'utf8');
}
function setConfigKey(key, value) {
  ensureConfig();
  let c = readConfig();
  const re = new RegExp('^' + key + ':\\s*.*$', 'm');
  if (re.test(c)) c = c.replace(re, key + ': ' + value);
  else c += `\n${key}: ${value}\n`;
  fs.writeFileSync(CONFIG_FILE, c);
}
function isInstalled() {
  return fs.existsSync(path.join(SLS_DIR, 'SLSsteam.so'));
}
// Backend API pipe: commands are pipe-separated, e.g. "install|appId|library".
function sendApi(cmd) {
  try { fs.writeFileSync(API_PIPE, cmd + '\n'); return true; }
  catch (e) { return false; }
}
function runSetup(args) {
  const setup = findSetup();
  if (!setup) {
    return { ok: false, error: 'slsteam-moon setup.sh not found. Clone https://github.com/swwayps/slsteam-moon and point SLSTEAM_MOON_SETUP at it, or install via the project README.' };
  }
  try {
    const out = execSync(`bash "${setup}" ${args}`, { cwd: path.dirname(setup), timeout: 120000, stdio: ['ignore', 'pipe', 'pipe'] });
    return { ok: true, log: out.toString() };
  } catch (e) {
    return { ok: false, error: (e.stdout ? e.stdout.toString() : '') + (e.stderr ? e.stderr.toString() : '') + String(e.message) };
  }
}
function restartSteam() {
  try { execSync('pkill -f steam 2>/dev/null; sleep 1; nohup steam >/dev/null 2>&1 &'); } catch (e) {}
  return true;
}

// ---- IPC handlers ----
ipcMain.handle('backend:status', () => ({ installed: isInstalled(), backend: 'slsteam-moon' }));
ipcMain.handle('backend:restartSteam', () => restartSteam());
ipcMain.handle('backend:discordLogin', () => { shell.openExternal('https://discord.com/login'); return true; });
ipcMain.handle('backend:open', (_e, url) => { shell.openExternal(url); return true; });
ipcMain.handle('backend:installPlugin', () => {
  ensureConfig();
  setConfigKey('API', 'yes'); // manifest install needs the API pipe
  const r = runSetup('install');
  return r;
});
ipcMain.handle('backend:uninstallPlugin', () => runSetup('uninstall'));
ipcMain.handle('backend:setConfig', (_e, { key, value }) => { setConfigKey(key, value); return true; });
ipcMain.handle('backend:manageCloud', () => {
  // Enable CloudRedirect: ensure cloud saves are NOT disabled, then patch steam .desktop via dc_run.
  setConfigKey('DisableCloud', 'no');
  const dc = path.join(SLS_DIR, 'desktop-coverage.lib.sh');
  let log = '';
  if (fs.existsSync(dc)) {
    try {
      log = execSync(`bash -c 'source "${dc}" && dc_run'`, { timeout: 30000, stdio: ['ignore','pipe','pipe'] }).toString();
    } catch (e) { log = (e.stderr ? e.stderr.toString() : '') + String(e.message); }
  }
  return { ok: true, log };
});
ipcMain.handle('backend:backup', () => {
  ensureConfig();
  fs.copyFileSync(CONFIG_FILE, BACKUP_FILE);
  return { ok: true, file: BACKUP_FILE };
});
ipcMain.handle('backend:restore', () => {
  if (!fs.existsSync(BACKUP_FILE)) return { ok: false, error: 'No backup found' };
  fs.copyFileSync(BACKUP_FILE, CONFIG_FILE);
  return { ok: true, file: BACKUP_FILE };
});
ipcMain.handle('backend:installManifests', (_e, files) => {
  // drop .lua/.manifest/.zip -> best-effort copy into the manifests drop dir
  const dir = path.join(SLS_DIR, 'manifests');
  try { fs.mkdirSync(dir, { recursive: true }); } catch (e) {}
  let n = 0;
  for (const f of (files || [])) {
    try { fs.copyFileSync(f, path.join(dir, path.basename(f))); n++; } catch (e) {}
  }
  return { ok: true, count: n };
});
ipcMain.handle('backend:installManifestId', (_e, id) => {
  // Backend API: install|appId|library  (input "appId library", e.g. "480 200")
  ensureConfig();
  setConfigKey('API', 'yes');
  const parts = String(id).trim().split(/\s+/);
  const appId = parts[0];
  const library = parts[1] || '0';
  if (!/^\d+$/.test(appId)) return { ok: false, error: 'Manifest ID must be numeric (appId [library])' };
  const ok = sendApi(`install|${appId}|${library}`);
  return { ok, cmd: `install|${appId}|${library}` };
});
ipcMain.handle('backend:setMode', (_e, mode) => { setConfigKey('Backend', mode); return true; });
ipcMain.handle('app:checkUpdate', async () => {
  if (!autoUpdater) return { ok: false, error: 'electron-updater not available' };
  try {
    const r = await autoUpdater.checkForUpdates();
    return { ok: true, updateAvailable: !!(r && r.updateInfo) };
  } catch (e) { return { ok: false, error: String(e.message || e) }; }
});
ipcMain.handle('app:quitAndInstall', () => {
  if (autoUpdater && updateReady) autoUpdater.quitAndInstall();
  return true;
});
ipcMain.handle('backend:saveSettings', (_e, cfg) => {
  if (cfg.steamPath) setConfigKey('SteamPath', cfg.steamPath);
  if (cfg.hubcapKey) setConfigKey('HubcapKey', cfg.hubcapKey);
  setConfigKey('AutoUpdateApps', cfg.autoUpdate ? 'yes' : 'no');
  setConfigKey('StartWithWindows', cfg.autostart ? 'yes' : 'no');
  setConfigKey('Notifications', cfg.notifications ? 'yes' : 'no');
  return true;
});

// ---- Auto-updater (electron-updater -> GitHub Releases, distro-agnostic AppImage) ----
let autoUpdater = null;
let updateReady = false;
try {
  const { autoUpdater: AU } = require('electron-updater');
  autoUpdater = AU;
  autoUpdater.autoDownload = true;
  autoUpdater.autoInstallOnAppQuit = true;
  // Channel follows the user's mode: "beta" or "latest" (Stable).
  try {
    const cfgRaw = fs.existsSync(CONFIG_FILE) ? fs.readFileSync(CONFIG_FILE, 'utf8') : '';
    const m = cfgRaw.match(/Backend:\s*(\S+)/i);
    autoUpdater.channel = (m && /beta/i.test(m[1])) ? 'beta' : 'latest';
  } catch (e) { autoUpdater.channel = 'latest'; }

  autoUpdater.on('update-available', () => {
    if (mainWin) mainWin.webContents.send('update:available');
  });
  autoUpdater.on('download-progress', (p) => {
    if (mainWin) mainWin.webContents.send('update:progress', Math.round(p.percent || 0));
  });
  autoUpdater.on('update-downloaded', () => {
    updateReady = true;
    if (mainWin) mainWin.webContents.send('update:ready');
  });
  autoUpdater.on('error', () => { /* fail silently; user can retry via About */ });
  // Silently check in the background shortly after launch.
  setTimeout(() => { try { autoUpdater.checkForUpdates(); } catch (e) {} }, 4000);
} catch (e) { autoUpdater = null; }

// Keep a handle to the main window so the updater can push events to the UI.
let mainWin = null;
function notifyUpdateState() {
  if (mainWin) mainWin.webContents.send(updateReady ? 'update:ready' : 'update:none');
}

// ---- Window ----
function createWindow() {
  const win = new BrowserWindow({
    width: 1000, height: 680,
    titleBarStyle: 'hidden',
    backgroundColor: '#dfe4ee',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });
  mainWin = win;
  win.loadFile(path.join(__dirname, 'renderer', 'index.html'));
  const viewArg = process.argv.find((a) => a.startsWith('--view='));
  if (viewArg) {
    const view = viewArg.slice(7);
    win.webContents.once('did-finish-load', () => {
      // navigate via the renderer's window.__nav helper
      win.webContents.executeJavaScript(
        `if (window.__nav) window.__nav(${JSON.stringify(view)}); else { const el = document.querySelector('.nav-item[data-view="${view}"]'); if (el) el.click(); }`
      ).catch(() => {});
    });
  }
}
app.whenReady().then(createWindow);
app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });
