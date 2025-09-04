// electron/preload.cjs
const { contextBridge, ipcRenderer } = require('electron');

console.log('[Preload] Loaded');

contextBridge.exposeInMainWorld('electronAPI', {
  // Existing
  getMachineId: () => ipcRenderer.invoke('get-machine-id'),
  sendLog: (...args) => ipcRenderer.send('renderer-log', ...args),

  // New: trigger native download (no new page)
  // Usage: window.electronAPI.downloadFile({ url: 'https://...', filename: 'example.pdf' })
  downloadFile: (args) => ipcRenderer.send('download-file', args),

  // Subscribe to progress (percent, bytes, etc.)
  onDownloadProgress: (cb) => {
    const listener = (_event, payload) => cb(payload);
    ipcRenderer.on('download-progress', listener);
    // return unsubscribe
    return () => ipcRenderer.removeListener('download-progress', listener);
  },

  // Subscribe to completion
  onDownloadComplete: (cb) => {
    const listener = (_event, payload) => cb(payload);
    ipcRenderer.on('download-complete', listener);
    return () => ipcRenderer.removeListener('download-complete', listener);
  },

  // Subscribe to errors
  onDownloadError: (cb) => {
    const listener = (_event, payload) => cb(payload);
    ipcRenderer.on('download-error', listener);
    return () => ipcRenderer.removeListener('download-error', listener);
  },
});

console.log('[Preload] Exposed electronAPI');
