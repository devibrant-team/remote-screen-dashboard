// electron/preload.cjs
const { contextBridge, ipcRenderer } = require('electron');

console.log('[Preload] Loaded');

contextBridge.exposeInMainWorld('electronAPI', {
  getMachineId: () => ipcRenderer.invoke('get-machine-id'),
  sendLog: (...args) => ipcRenderer.send('renderer-log', ...args),

  downloadFile: (args) => ipcRenderer.send('download-file', args),

  onDownloadProgress: (cb) => {
    const listener = (_e, payload) => cb(payload);
    ipcRenderer.on('download-progress', listener);
    return () => ipcRenderer.removeListener('download-progress', listener);
  },

  onDownloadComplete: (cb) => {
    const listener = (_e, payload) => cb(payload);
    ipcRenderer.on('download-complete', listener);
    return () => ipcRenderer.removeListener('download-complete', listener);
  },

  onDownloadError: (cb) => {
    const listener = (_e, payload) => cb(payload);
    ipcRenderer.on('download-error', listener);
    return () => ipcRenderer.removeListener('download-error', listener);
  },
});

console.log('[Preload] Exposed electronAPI');
