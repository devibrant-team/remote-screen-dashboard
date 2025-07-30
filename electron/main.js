import { app, BrowserWindow, ipcMain } from 'electron';
import path from 'path';
import { fileURLToPath } from 'url';
import pkg from 'node-machine-id';
const { machineIdSync } = pkg;

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const isDev = process.env.NODE_ENV === 'development';

let win;

function createWindow() {
  win = new BrowserWindow({
    width: 1000,
    height: 700,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });


    // Production mode: load React build unpacked outside ASAR
     const indexPath = path.join(app.getAppPath(), 'dist', 'index.html');
    win.loadFile(indexPath);

  win.on('closed', () => {
    win = null;
  });
}

console.log('[Main] Preload path:', path.join(__dirname, 'preload.js'));

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

// IPC handler for machine ID
ipcMain.handle('get-machine-id', async () => {
  return machineIdSync();
});

// IPC listener to receive logs from renderer process
ipcMain.on('renderer-log', (event, ...args) => {
  console.log('[Renderer]', ...args);
});
 