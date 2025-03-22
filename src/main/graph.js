const { BrowserWindow, dialog, ipcMain } = require('electron');
const fs = require('fs').promises;
const path = require('path');
const chalk = require('chalk');

// internal imports


chalk.level = 2;

// global graph object definition
const oGraph = {
    data: null,
    
    // Setters
    set: function(graphData) {
        this.data = graphData;
    },
    
    update: function(updates) {
        if (!this.data) return;
        this.data = { ...this.data, ...updates };
    },
    
    clear: function() {
        this.data = null;
    },
    
    // Getters
    get: function() {
        return this.data;
    }
};

const gItems = {
    data: null,
    set: function(items) {
        this.data = items;
    },
    get: function() {
        return this.data;
    }
}

const IGNORE_ITEMS = [
    '.git',
    '.gitignore',
    '.research',
    'CONTRIBUTING.md',
    'LICENSE.md',
    'README.md',
]

// IPC
ipcMain.handle('graph-get', () => {
    return oGraph.get();
});

ipcMain.handle('graph-close', () => {
    return graphClose();
});

ipcMain.handle('graphItems-get', () => {
    return gItems.get();
});

// main function
async function graphOpenReload(mode) {
    console.log(chalk.blue(`# graphOpenReload(${mode})`));

    // top level variables
    let graphPath;

    // internal imports
    const { SCHEMA_GRAPH_YAML } = require('./schemas');
    const { processVertices } = require('./vertices');
    const { processEdges } = require('./edges');
    const { parseYaml, validateSchema } = require('./helpers');

    if (mode === 'reload') {
        const currentGraph = oGraph.get();
        
        // Check if there's any graph loaded
        if (!currentGraph || !currentGraph.path) {
            dialog.showMessageBox({
                title: 'Warning',
                message: 'No graph is currently loaded to reload.',
                type: 'warning'
            });
            return null;
        }
        
        graphPath = currentGraph.path;
        oGraph.clear();
    } else if (mode === 'open') {
        oGraph.clear();
        graphPath = await graphSelect();
    }

    if (!graphPath) return null;

    const graphItemsAll = await graphRead(graphPath);
    const graphItemsNotIgnored = graphItemsAll.filter(item => !IGNORE_ITEMS.includes(item));
    const graphItemsClassified = [];

    try {
        if (!graphItemsAll.includes('.research')) {
            dialog.showMessageBox({
                title: 'Warning',
                message: 'The .research item is missing.',
                type: 'warning'
            });
            return;
        }

        if (!(await isFolder(graphPath, '.research'))) {
            dialog.showMessageBox({
                title: 'Warning',
                message: 'The .research item is not a folder.',
                type: 'warning'
            });
            return;
        }

        const researchFolder = path.join(graphPath, '.research');
        const researchFolderItems = await fs.readdir(researchFolder);

        if (!researchFolderItems.includes('graph.yaml')) {
            dialog.showMessageBox({
                title: 'Warning',
                message: 'The .research/graph.yaml file is missing.',
                type: 'warning'
            });
            return;
        }

        const researchFolderGraphYaml = path.join(researchFolder, 'graph.yaml');
        const researchFolderGraphYamlContentRaw = await fs.readFile(researchFolderGraphYaml, 'utf8');
        const researchFolderGraphYamlContentParsed = await parseYaml(researchFolderGraphYamlContentRaw);

        if (!researchFolderGraphYamlContentParsed) {
            dialog.showMessageBox({
                title: 'Warning',
                message: 'The .research/graph.yaml file is not a valid YAML object.',
                type: 'warning'
            });
            return;
        }

        // schema validation
        if (!(await validateSchema(SCHEMA_GRAPH_YAML, researchFolderGraphYamlContentParsed))) {
            dialog.showMessageBox({
                title: 'Warning',
                message: 'The .research/graph.yaml file does not match the required schema.',
                type: 'warning'
            });
            return;
        }

        // proces items
        for (const item of graphItemsNotIgnored) {
            const itemPath = path.join(graphPath, item);
            const itemStats = await fs.stat(itemPath);

            if (itemStats.isDirectory()) {
                graphItemsClassified.push({
                    name: item,
                    type: 'folder',
                    path: itemPath,
                });
            } else if (itemStats.isFile()) {
                graphItemsClassified.push({
                    name: item,
                    type: 'file',
                    path: itemPath,
                });
            }
        }

        // process vertices
        const vertices = await processVertices(graphPath, graphItemsNotIgnored);
        const edges = await processEdges(vertices);

        // set graph object
        oGraph.set({
            path: path.normalize(graphPath),
            //language: researchFolderGraphYamlContentParsed.language || 'en',
            uuid: researchFolderGraphYamlContentParsed.uuid,
            languages: researchFolderGraphYamlContentParsed.languages,
            //vertices: vertices,
            //edges: edges,
            //items: graphItemsClassified
        });

        gItems.set(graphItemsClassified);

        //console.log(chalk.magenta(JSON.stringify(oGraph.get(), null, 2)));
        const mainWindow = BrowserWindow.getFocusedWindow();
        mainWindow.loadFile('src/pages/preview/index.html');

        console.log(chalk.green(`# graphOpenReload(${mode}) | ${graphPath}`));
        return oGraph.get();
    } catch (error) {
        console.error(`Error in graphOpenReload(${mode})`, error);
        dialog.showMessageBox({
            title: 'Error',
            message: `Error in graphOpenReload(${mode}): ` + error.message,
            type: 'error'
        });
        return;
    }
}

async function graphClose() {
    console.log(chalk.blue(`# graphClose()`));
    
    // Get the current graph data to check if there's anything loaded
    const currentGraph = oGraph.get();
    
    // Check if there's any graph loaded
    if (!currentGraph) {
        dialog.showMessageBox({
            title: 'Warning',
            message: 'No graph is currently loaded to close.',
            type: 'warning'
        });
        return null;
    }
    
    // Clean the graph object
    graphClear();
    
    // Navigate to dashboard
    const mainWindow = BrowserWindow.getFocusedWindow();
    mainWindow.loadFile('src/pages/dashboard/index.html');
    
    console.log(chalk.green(`# graphClose() | Graph closed successfully`));
    return true;
}

// helpers
async function graphSelect() {
    const result = await dialog.showOpenDialog({
        properties: ['openDirectory'],
        title: 'Select a Folder',
        buttonLabel: 'Choose Folder'
    });
    
    if (!result.canceled) {
        const path = result.filePaths[0];
        return path;
    }

    return null;
}

async function graphRead(path) {
    const items = await fs.readdir(path);
    return items;
}

// validators
async function isFolder(folderPath, item) {
    const itemPath = path.join(folderPath, item);
    const itemStats = await fs.stat(itemPath);
    return itemStats.isDirectory();
}

// getters & setters
function graphGet() {
    return oGraph.get();
}

function graphUpdate(updates) {
    return oGraph.update(updates);
}

function graphClear() {
    oGraph.clear();
}

module.exports = { 
    graphOpenReload, 
    graphClose,
    graphGet,
    graphUpdate,
    graphClear
};