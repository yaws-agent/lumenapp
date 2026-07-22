const { app, BrowserWindow, ipcMain, shell } = require('electron');
const path = require('path');
const fs = require('fs');

// ---- Backend bridge (slsteam-moon) ----
const os = require('os');
const { execSync, spawn } = require('child_process');
const CONFIG_DIR = path.join(os.homedir(), '.config', 'SLSsteam');
const CONFIG_FILE = path.join(CONFIG_DIR, 'config.yml');
const API_PIPE = '/tmp/SLSsteam.API';

function ensureConfig() {
  if (!fs.existsSync(CONFIG_DIR)) fs.mkdirSync(CONFIG_DIR, { recursive: true });
  if (!fs.existsSync(CONFIG_FILE)) {
    fs.writeFileSync(CONFIG_FILE,
      '# Lumen-managed slsteam-moon config\nDisableFamilyShareLock: no\nDisableParentalRestrictions: no\nPlayNotOwnedGames: no\nDisableCloud: no\nAPI: yes\nNotifications: yes\nLogLevel: 2\n');
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
  // hook library present in SLSsteam dir?
  return fs.existsSync(path.join(os.homedir(), '.local', 'share', 'SLSsteam', 'SLSsteam.so'));
}
function sendApi(cmd) {
  try { fs.writeFileSync(API_PIPE, cmd + '\n'); return true; }
  catch (e) { return false; }
}
function restartSteam() {
  // best-effort: if steam exists, restart it; otherwise just report
  try { execSync('pkill -f steam 2>/dev/null; steam &'); } catch (e) {}
  return true;
}

// ---- IPC handlers ----
ipcMain.handle('backend:status', () => ({ installed: isInstalled(), backend: 'slsteam-moon' }));
ipcMain.handle('backend:restartSteam', () => restartSteam());
ipcMain.handle('backend:discordLogin', () => { shell.openExternal('https://discord.com/login'); return true; });
ipcMain.handle('backend:open', (_e, url) => { shell.openExternal(url); return true; });
ipcMain.handle('backend:checkUpdate', () => true);
ipcMain.handle('backend:installPlugin', () => { ensureConfig(); return true; });
ipcMain.handle('backend:uninstallPlugin', () => true);
ipcMain.handle('backend:setConfig', (_e, { key, value }) => setConfigKey(key, value));
ipcMain.handle('backend:manageCloud', () => true);
ipcMain.handle('backend:backup', () => { /* copy config.yml to backup */ return true; });
ipcMain.handle('backend:restore', () => true);
ipcMain.handle('backend:installManifests', (_e, files) => { /* drop .lua/.manifest/.zip */ return files; });
ipcMain.handle('backend:installManifestId', (_e, id) => { sendApi('install|' + id.replace(/\s+/g, '|')); return true; });
ipcMain.handle('backend:setMode', (_e, mode) => setConfigKey('Backend', mode));
ipcMain.handle('backend:saveSettings', (_e, cfg) => {
  if (cfg.steamPath) setConfigKey('SteamPath', cfg.steamPath);
  if (cfg.hubcapKey) setConfigKey('HubcapKey', cfg.hubcapKey);
  setConfigKey('AutoUpdateApps', cfg.autoUpdate ? 'yes' : 'no');
  setConfigKey('StartWithWindows', cfg.autostart ? 'yes' : 'no');
  setConfigKey('Notifications', cfg.notifications ? 'yes' : 'no');
  return true;
});

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
  win.loadFile(path.join(__dirname, 'renderer', 'index.html'));
  const viewArg = process.argv.find((a) => a.startsWith('--view='));
  if (viewArg) {
    const view = viewArg.slice(7);
    win.webContents.once('did-finish-load', () => {
      win.webContents.executeJavaScript(
        `window.lumen.__nav && window.lumen.__nav(${JSON.stringify(view)});`
      ).catch(() => {});
      // fallback: dispatch click on matching nav item
      win.webContents.executeJavaScript(
        `(() => { const el = document.querySelector('.nav-item[data-view="${view}"]'); if (el) el.click(); })();`
      ).catch(() => {});
    });
  }
}
app.whenReady().then(createWindow);
app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });
