const { app, ipcMain, BrowserWindow } = require('electron');
const { updateElectronApp } = require('update-electron-app');
const path = require('path');

// internal imports
const { createMenu } = require('./menu');

app.setAppUserModelId('com.squirrel.jedrasiak-research-desktop.JedrasiakResearchDesktop');
updateElectronApp();

// prevent duplicate launches when installing
if (require("electron-squirrel-startup")) {
    app.quit();
}

const createWindow = () => {
    const win = new BrowserWindow({
        show: false,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            contextIsolation: true,
            nodeIntegration: false
        },
        icon: path.join(__dirname, '../public/images/icon.ico')
    })

    win.maximize();
    win.show();
    win.loadFile('src/pages/dashboard/index.html');

    // open dev tools only in development mode
    if (!app.isPackaged) {
        win.webContents.openDevTools({
            mode: 'dock',
            activate: true
        });

        win.webContents.on('context-menu', (e, params) => {
            win.webContents.inspectElement(params.x, params.y)
        })
    }
}

app.whenReady().then(() => {
    createWindow();
    createMenu();
})

ipcMain.handle('get-app-version', () => {
    return app.getVersion();
});