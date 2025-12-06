// electron/main.cjs
const { app, BrowserWindow, ipcMain, session } = require('electron');
const path = require('path');
const { machineIdSync } = require('node-machine-id');

const isDev = !app.isPackaged;

function getPreloadPath() {
  // In dev: __dirname = <repo>/electron
  // In prod: __dirname = <App>.app/.../app.asar/electron
  // So preload is always next to main.cjs.
  return path.join(__dirname, 'preload.cjs');
}

const { autoUpdater } = require("electron-updater");

// somewhere in your setup (you probably already have autoUpdater config)
ipcMain.on("app/start-update", () => {
  // for example:
  autoUpdater.checkForUpdatesAndNotify();
  // or if update already downloaded:
  // autoUpdater.quitAndInstall();
});

let win;
const activeDownloads = new Map();

function createWindow() {
  const preloadPath = getPreloadPath();

  win = new BrowserWindow({
    width: 1000,
    height: 700,
    webPreferences: {
      preload: preloadPath,
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  if (isDev) {
    // Match your dev script (wait-on http://localhost:5174)
    win.loadURL('http://localhost:5174');
    win.webContents.openDevTools({ mode: 'detach' });
  } else {
    const indexPath = path.join(app.getAppPath(), 'dist', 'index.html');
    win.loadFile(indexPath);
  }

  win.on('closed', () => { win = null; });
}

app.whenReady().then(() => {
  createWindow();

  // Native download pipeline
  session.defaultSession.on('will-download', (event, item) => {
    const suggestedName = item.getFilename();
    const savePath = path.join(app.getPath('downloads'), suggestedName);
    item.setSavePath(savePath);

    const downloadId = Date.now().toString(36) + Math.random().toString(36).slice(2);
    activeDownloads.set(downloadId, item);

    item.on('updated', () => {
      if (!win) return;
      const received = item.getReceivedBytes();
      const total = item.getTotalBytes();
      const percent = total > 0 ? Math.round((received / total) * 100) : 0;
      win.webContents.send('download-progress', {
        id: downloadId,
        state: item.getState?.(),
        received,
        total,
        percent,
        filename: item.getFilename(),
        savePath,
      });
    });

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
  try {
    return machineIdSync(true); // hashed
  } catch {
    return machineIdSync();
  }
});



// IPC: trigger a download from renderer
ipcMain.on("download-file", (_event, payload) => {
  try {
    const { url } =
      typeof payload === "string" ? { url: payload } : payload || {};
    if (!win || !url) return;
    win.webContents.downloadURL(url);
  } catch (err) {
    console.error("[Main] download-file error:", err);
  }
});
