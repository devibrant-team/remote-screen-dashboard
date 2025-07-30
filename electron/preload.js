// preload.js
const { contextBridge, ipcRenderer } = require('electron');

console.log('[Preload] Loaded');

contextBridge.exposeInMainWorld('electronAPI', {
  getMachineId: () => ipcRenderer.invoke('get-machine-id'),

  sendLog: (...args) => ipcRenderer.send('renderer-log', ...args),
});

console.log('[Preload] Exposed electronAPI');
