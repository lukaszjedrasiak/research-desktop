const { Menu } = require('electron');
const { updateElectronApp } = require('update-electron-app');

// internal imports
const { graphOpenReload, graphClose } = require('./graph');
const { vertexCreate } = require('./vertices');

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
        label: 'Vertex',
        submenu: [
            { label: 'New', accelerator: 'CmdOrCtrl+N', click: vertexCreate}
        ]
    });

    defaultMenuTemplate.unshift({
        label: 'Graph',
        submenu: [
            {
                label: 'Open (preview)', 
                accelerator: 'CmdOrCtrl+Shift+O', 
                click: () => graphOpenReload('open')
            },
            { 
                label: 'Reload', 
                accelerator: 'CmdOrCtrl+F5', 
                click: () => graphOpenReload('reload')
            },
            { 
                label: 'Close', 
                accelerator: 'CmdOrCtrl+W', 
                click: graphClose 
            }
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