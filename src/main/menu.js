const { Menu } = require('electron');
const { updateElectronApp } = require('update-electron-app');

function createMenu() {
    const defaultMenu = Menu.getApplicationMenu();
    const defaultMenuTemplate = defaultMenu.items.map(item => item);

    defaultMenuTemplate.push({
        label: 'Application',
        submenu: [
            {label: 'Update', click: () => appUpdate()}
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