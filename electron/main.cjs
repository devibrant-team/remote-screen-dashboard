const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const { machineIdSync } = require('node-machine-id');

// Replace ESM way of getting __dirname with CommonJS equivalent
// const __dirname = __dirname; // Already available in CommonJS

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
