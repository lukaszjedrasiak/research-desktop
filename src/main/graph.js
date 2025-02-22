const { dialog } = require('electron');
const fs = require('fs').promises;

let currentGraphPath = null;
let currentGraphItems = null;

// main function
async function graphOpen() {
    const path = await graphSelect();
    if (!path) return;
    
    // process the graph
    const items = await graphRead(path);
    console.log(items);
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

// getters
function getCurrentGraphPath() {
    return currentGraphPath;
}

function getCurrentGraphItems() {
    return currentGraphItems;
}

module.exports = { graphOpen, getCurrentGraphPath, getCurrentGraphItems };