console.log(`# main/preload.js`);
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api_internal', {
    getAppVersion: () => ipcRenderer.invoke('get-app-version')
});
