const { app, BrowserWindow } = require('electron')

const createWindow = () => {
    const win = new BrowserWindow({
        show: false,
        webPreferences: {
            contextIsolation: true,
            nodeIntegration: false
        }
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