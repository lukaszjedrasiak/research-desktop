console.log(`# main/preload.js`);
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api_internal', {
    getAppVersion: () => ipcRenderer.invoke('get-app-version'),
    getGraphData: () => ipcRenderer.invoke('graph-get'),
    getGraphItems: () => ipcRenderer.invoke('graphItems-get'),
    getVertices: () => ipcRenderer.invoke('vertices-get'),
    getEdges: () => ipcRenderer.invoke('edges-get'),

    vertexGetContent: (uuid) => ipcRenderer.invoke('vertex-get-content', uuid),
});
