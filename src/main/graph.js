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

const IGNORE_ITEMS = [
    '.git',
    '.gitignore',
    '.research',
    'CONTRIBUTING.md',
    'LICENSE.md',
    'README.md',
]

// IPC
ipcMain.handle('get-graph-data', () => {
    return oGraph.get();
});

ipcMain.handle('graph-reload', () => {
    return graphReload();
});

ipcMain.handle('close-graph', () => {
    return graphClose();
});

// main function
async function graphOpen() {
    console.log(chalk.blue(`# graphOpen()`))

    // internal imports
    const { SCHEMA_GRAPH_YAML } = require('./schemas');
    const { processVertices } = require('./vertices');
    const { processEdges } = require('./edges');
    const { parseYaml, validateSchema } = require('./helpers');

    oGraph.clear();
    const graphPath = await graphSelect();
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
                message: 'The graph.yaml file is missing.',
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
                message: 'The graph.yaml file is not a valid YAML object.',
                type: 'warning'
            });
            return;
        }

        // schema validation
        if (!(await validateSchema(SCHEMA_GRAPH_YAML, researchFolderGraphYamlContentParsed))) {
            dialog.showMessageBox({
                title: 'Warning',
                message: 'The graph.yaml file does not match the required schema.',
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
            languages: researchFolderGraphYamlContentParsed.languages,
            vertices: vertices,
            edges: edges,
            items: graphItemsClassified
        });

        //console.log(chalk.magenta(JSON.stringify(oGraph.get(), null, 2)));
        const mainWindow = BrowserWindow.getFocusedWindow();
        mainWindow.loadFile('src/pages/preview/index.html');

        console.log(chalk.green(`# graphOpen() | ${graphPath}`));
        return oGraph.get();
    } catch (error) {
        console.error('Error opening graph:', error);
        dialog.showMessageBox({
            title: 'Error',
            message: 'Error opening graph: ' + error.message,
            type: 'error'
        });
        return;
    }
}

async function graphReload() {
    console.log(chalk.blue(`# graphReload()`));

    // internal imports
    const { SCHEMA_GRAPH_YAML } = require('./schemas');
    const { processVertices } = require('./vertices');
    const { processEdges } = require('./edges');
    const { parseYaml, validateSchema } = require('./helpers');
    
    // Get the current graph data
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
    
    const graphPath = currentGraph.path;
    
    // Clear the current graph data
    oGraph.clear();
    
    // Read and process the graph files
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
                message: 'The graph.yaml file is missing.',
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
                message: 'The graph.yaml file is not a valid YAML object.',
                type: 'warning'
            });
            return;
        }

        // schema validation
        if (!(await validateSchema(SCHEMA_GRAPH_YAML, researchFolderGraphYamlContentParsed))) {
            dialog.showMessageBox({
                title: 'Warning',
                message: 'The graph.yaml file does not match the required schema.',
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
            languages: researchFolderGraphYamlContentParsed.languages,
            vertices: vertices,
            edges: edges,
            items: graphItemsClassified
        });

        // Reload the preview
        const mainWindow = BrowserWindow.getFocusedWindow();
        mainWindow.loadFile('src/pages/preview/index.html');

        console.log(chalk.green(`# graphReload() | ${graphPath}`));
        return oGraph.get();
    } catch (error) {
        console.error('Error reloading graph:', error);
        dialog.showMessageBox({
            title: 'Error',
            message: 'Error reloading graph: ' + error.message,
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
    clearGraph();
    
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
function getGraph() {
    return oGraph.get();
}

function updateGraph(updates) {
    return oGraph.update(updates);
}

function clearGraph() {
    oGraph.clear();
}

module.exports = { 
    graphOpen, 
    graphReload,
    graphClose,
    getGraph,
    updateGraph,
    clearGraph 
};