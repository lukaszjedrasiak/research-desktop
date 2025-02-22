const { app, ipcMain, BrowserWindow } = require('electron');
const { updateElectronApp } = require('update-electron-app');
const path = require('path');

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

    // open dev tools
    win.webContents.openDevTools({
        mode: 'dock',
        activate: true
    });
}

app.whenReady().then(() => {
    createWindow()
})

ipcMain.handle('get-app-version', () => {
    return app.getVersion();
});