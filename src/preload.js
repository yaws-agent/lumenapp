const { contextBridge, ipcRenderer } = require('electron');
contextBridge.exposeInMainWorld('lumen', {
  status: () => ipcRenderer.invoke('backend:status'),
  restartSteam: () => ipcRenderer.invoke('backend:restartSteam'),
  discordLogin: () => ipcRenderer.invoke('backend:discordLogin'),
  open: (u) => ipcRenderer.invoke('backend:open', u),
  checkUpdate: () => ipcRenderer.invoke('backend:checkUpdate'),
  installPlugin: () => ipcRenderer.invoke('backend:installPlugin'),
  uninstallPlugin: () => ipcRenderer.invoke('backend:uninstallPlugin'),
  setConfig: (k, v) => ipcRenderer.invoke('backend:setConfig', { key: k, value: v }),
  manageCloud: () => ipcRenderer.invoke('backend:manageCloud'),
  backup: () => ipcRenderer.invoke('backend:backup'),
  restore: () => ipcRenderer.invoke('backend:restore'),
  installManifests: (f) => ipcRenderer.invoke('backend:installManifests', f),
  installManifestId: (id) => ipcRenderer.invoke('backend:installManifestId', id),
  setMode: (m) => ipcRenderer.invoke('backend:setMode', m),
  saveSettings: (c) => ipcRenderer.invoke('backend:saveSettings', c),
});
