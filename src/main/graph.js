const { BrowserWindow, dialog, ipcMain } = require('electron');
const fs = require('fs').promises;
const path = require('path');
const yaml = require('yaml');
const chalk = require('chalk');

// internal imports
const { SCHEMA_GRAPH_YAML } = require('./schemas');

chalk.level = 2;
let currentGraphPath = null;
let currentGraphItems = null;

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
    oGraph.clear();
    currentGraphItems = null;
    
    const graphPath = await graphSelect();
    console.log(chalk.blue(`# graphOpen()`))
    console.log(`path: ${graphPath}`);
    console.log(`currentGraphPath: ${currentGraphPath}`);

    if (!graphPath) {
        currentGraphPath = null;
        return null;
    }
    
    // process the graph
    const graphItems = await graphRead(graphPath);
    console.log(`graphItems: ${graphItems}`);

    try {
        if (!graphItems.includes('.research')) {
            dialog.showMessageBox({
                title: 'Warning',
                message: 'The .research item is missing.',
                type: 'warning'
            });
            return;
        }

        if (!(await isFolder('.research'))) {
            dialog.showMessageBox({
                title: 'Warning',
                message: 'The .research item is not a folder.',
                type: 'warning'
            });
            return;
        }

        const researchFolder = path.join(currentGraphPath, '.research');
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

        // set graph object
        oGraph.set({
            path: path.normalize(currentGraphPath),
            language: researchFolderGraphYamlContentParsed.language || 'en'
        });

        console.log(chalk.magenta(JSON.stringify(oGraph.get(), null, 2)));
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
    try {
        const result = await dialog.showOpenDialog({
            properties: ['openDirectory'],
            title: 'Select a Folder',
            buttonLabel: 'Choose Folder'
        });
        
        if (!result.canceled) {
            currentGraphPath = result.filePaths[0];
            return currentGraphPath;
        }

        return null;
    } catch (error) {
        console.error('Error selecting folder:', error);
        throw error;
    }
}

async function graphRead(path) {
    try {
        currentGraphItems = await fs.readdir(path);
        return currentGraphItems;
    } catch (error) {
        console.error('Error reading folder:', error);
        throw error;
    }
}

// validators
async function isFolder(item) {
    const itemPath = path.join(currentGraphPath, item);
    const itemStats = await fs.stat(itemPath);
    return itemStats.isDirectory();
}

async function validateSchema(schema, data) {
    const result = schema.safeParse(data);
    if (!result.success) {
        return false;
    }
    return true;
}

// parsers
async function parseYaml(yamlContent) {
    try {
        const parsed = yaml.parse(yamlContent);
        if (!parsed || typeof parsed !== 'object') {
            return null;
        }
        return parsed;
    } catch (error) {
        return null;
    }
}

// getters
function getCurrentGraphPath() {
    return currentGraphPath;
}

function getCurrentGraphItems() {
    return currentGraphItems;
}

function getGraph() {
    return oGraph.get();
}

// setters
function updateGraph(updates) {
    return oGraph.update(updates);
}

function clearGraph() {
    oGraph.clear();
}

module.exports = { 
    graphOpen, 
    getCurrentGraphPath, 
    getCurrentGraphItems,
    getGraph,
    updateGraph,
    clearGraph 
};