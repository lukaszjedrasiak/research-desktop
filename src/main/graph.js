const { BrowserWindow, dialog, ipcMain } = require('electron');
const fs = require('fs').promises;
const path = require('path');
const chalk = require('chalk');

// internal imports
const { SCHEMA_GRAPH_YAML } = require('./schemas');
const { processVertices } = require('./vertices');
const { processEdges } = require('./edges');
const { parseYaml, validateSchema } = require('./helpers');

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

// IPC
ipcMain.handle('get-graph-data', () => {
    return oGraph.get();
});

// main function
async function graphOpen() {
    console.log(chalk.blue(`# graphOpen()`))

    oGraph.clear();
    const graphPath = await graphSelect();
    if (!graphPath) return null;
    const graphItems = await graphRead(graphPath);

    try {
        if (!graphItems.includes('.research')) {
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

        // process vertices
        const vertices = await processVertices(graphPath);
        const edges = await processEdges(vertices);

        // set graph object
        oGraph.set({
            path: path.normalize(graphPath),
            language: researchFolderGraphYamlContentParsed.language || 'en',
            vertices: vertices,
            edges: edges
        });

        //console.log(chalk.magenta(JSON.stringify(oGraph.get(), null, 2)));
        const mainWindow = BrowserWindow.getFocusedWindow();
        mainWindow.loadFile('src/pages/preview/index.html');

        return oGraph.get();
    } catch (error) {
        console.error('Error validating .research folder:', error);
        dialog.showMessageBox({
            title: 'Error',
            message: 'Error validating folder structure',
            type: 'error'
        });
        return;
    }
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
    getGraph,
    updateGraph,
    clearGraph 
};