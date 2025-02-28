const { Menu } = require('electron');
const { updateElectronApp } = require('update-electron-app');

// internal imports
const { graphOpen, graphReload, graphClose } = require('./graph');

function createMenu() {
    const defaultMenu = Menu.getApplicationMenu();
    const defaultMenuTemplate = defaultMenu.items.filter(item => item.label !== 'File' && item.label !== 'Window');

    defaultMenuTemplate.push({
        label: 'Application',
        submenu: [
            {label: 'Update', click: () => appUpdate()}
        ]
    });

    defaultMenuTemplate.unshift({
        label: 'Graph',
        submenu: [
            { label: 'Open (preview)', accelerator: 'CmdOrCtrl+Shift+O', click: graphOpen },
            { label: 'Reload', accelerator: 'CmdOrCtrl+F5', click: graphReload },
            { label: 'Close', accelerator: 'CmdOrCtrl+W', click: graphClose }
        ]
    });

    const menu = Menu.buildFromTemplate(defaultMenuTemplate);
    Menu.setApplicationMenu(menu);
}

function appUpdate() {
    console.log('Checking for updates...');
    updateElectronApp({
        updateInterval: '5 minutes',
        notifyUser: true
    });
}

module.exports = { createMenu };