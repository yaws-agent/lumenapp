const { contextBridge, ipcRenderer } = require('electron');
contextBridge.exposeInMainWorld('lumen', {
  status: () => ipcRenderer.invoke('backend:status'),
  restartSteam: () => ipcRenderer.invoke('backend:restartSteam'),
  discordLogin: () => ipcRenderer.invoke('backend:discordLogin'),
  open: (u) => ipcRenderer.invoke('backend:open', u),
  checkUpdate: () => ipcRenderer.invoke('app:checkUpdate'),
  quitAndInstall: () => ipcRenderer.invoke('app:quitAndInstall'),
  installPlugin: () => ipcRenderer.invoke('backend:installPlugin'),
  uninstallPlugin: () => ipcRenderer.invoke('backend:uninstallPlugin'),
  setConfig: (k, v) => ipcRenderer.invoke('backend:setConfig', { key: k, value: v }),
  manageCloud: () => ipcRenderer.invoke('backend:manageCloud'),
  backup: () => ipcRenderer.invoke('backend:backup'),
  restore: () => ipcRenderer.invoke('backend:restore'),
  installManifests: (f) => ipcRenderer.invoke('backend:installManifests', f),
  installManifestId: (id) => ipcRenderer.invoke('backend:installManifestId', id),
  // shared "Luas" store (Home + Manifestos + Add tab all push here)
  getItems: () => ipcRenderer.invoke('store:getItems'),
  addItem: (item) => ipcRenderer.invoke('store:addItem', item),
  removeItem: (id) => ipcRenderer.invoke('store:removeItem', id),
  setMode: (m) => ipcRenderer.invoke('backend:setMode', m),
  saveSettings: (c) => ipcRenderer.invoke('backend:saveSettings', c),
  onUpdate: (ev, cb) => ipcRenderer.on(ev, (_e, ...a) => cb(...a)),
});
