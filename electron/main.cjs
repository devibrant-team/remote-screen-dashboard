// electron/main.cjs
const { app, BrowserWindow, ipcMain, session } = require('electron');
const path = require('path');
const { machineIdSync } = require('node-machine-id');

const isDev = process.env.NODE_ENV === 'development';

let win;
// keep track of active downloads if you later want cancel/pause/resume
const activeDownloads = new Map(); // id -> item

function createWindow() {
  win = new BrowserWindow({
    width: 1000,
    height: 700,
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  const indexPath = path.join(app.getAppPath(), 'dist', 'index.html');
  win.loadFile(indexPath);

  win.on('closed', () => {
    win = null;
  });
}

console.log('[Main] Preload path:', path.join(__dirname, 'preload.cjs'));

app.whenReady().then(() => {
  createWindow();

  // Native download pipeline (progress + complete)
  session.defaultSession.on('will-download', (event, item, webContents) => {
    // Optional: let renderer suggest a filename via metadata
    const meta = item.getSaveDialogOptions?.() || {};
    const suggestedName =
      (meta && meta.defaultPath && path.basename(meta.defaultPath)) ||
      item.getFilename();

    const savePath = path.join(app.getPath('downloads'), suggestedName);
    item.setSavePath(savePath);

    // simple id to correlate events in renderer if you ever have multiple
    const downloadId = Date.now().toString(36) + Math.random().toString(36).slice(2);
    activeDownloads.set(downloadId, item);

    // progress
    item.on('updated', (_e, state) => {
      if (!win) return;
      const received = item.getReceivedBytes();
      const total = item.getTotalBytes();
      const percent = total > 0 ? Math.round((received / total) * 100) : 0;

      win.webContents.send('download-progress', {
        id: downloadId,
        state,
        received,
        total,
        percent,
        filename: item.getFilename(),
        savePath,
      });
    });

    // done
    item.once('done', (_e, state) => {
      activeDownloads.delete(downloadId);
      if (!win) return;
      if (state === 'completed') {
        win.webContents.send('download-complete', {
          id: downloadId,
          state,
          filename: item.getFilename(),
          savePath: item.getSavePath(),
        });
      } else {
        win.webContents.send('download-error', {
          id: downloadId,
          state,
          filename: item.getFilename(),
          received: item.getReceivedBytes(),
          total: item.getTotalBytes(),
        });
      }
    });
  });

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

// IPC: machine ID
ipcMain.handle('get-machine-id', async () => {
  return machineIdSync();
});

// IPC: logs from renderer
ipcMain.on('renderer-log', (_event, ...args) => {
  console.log('[Renderer]', ...args);
});

// IPC: trigger a download from renderer
// payload: { url: string, filename?: string }
ipcMain.on('download-file', (_event, payload) => {
  try {
    const { url, filename } = typeof payload === 'string' ? { url: payload } : payload || {};
    if (!win || !url) return;

    // If you want to hint a filename from renderer, pass via a custom 'saveDialogOptions'
    // Electron will not show a dialog by default, we just map it to will-download meta.
    win.webContents.downloadURL(url);

    console.log('[Main] Download requested:', url, filename ? `(as ${filename})` : '');
  } catch (err) {
    console.error('[Main] download-file error:', err);
  }
});
