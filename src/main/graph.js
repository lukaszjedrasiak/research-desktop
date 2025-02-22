const { dialog } = require('electron');
const fs = require('fs').promises;
const path = require('path');

let currentGraphPath = null;
let currentGraphItems = null;

// main function
async function graphOpen() {
    const graphPath = await graphSelect();
    console.log(`path: ${path}`);
    console.log(`currentGraphPath: ${currentGraphPath}`);

    if (!graphPath) return;
    
    // process the graph
    const graphItems = await graphRead(graphPath);
    console.log(graphItems);

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
function itemExists(items, itemName) {
    return items.includes(itemName);
}

async function isFolder(item) {
    const itemPath = path.join(currentGraphPath, item);
    const itemStats = await fs.stat(itemPath);
    return itemStats.isDirectory();
}

// getters
function getCurrentGraphPath() {
    return currentGraphPath;
}

function getCurrentGraphItems() {
    return currentGraphItems;
}

module.exports = { graphOpen, getCurrentGraphPath, getCurrentGraphItems };