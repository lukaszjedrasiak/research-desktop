const { ipcMain } = require('electron');
const chalk = require('chalk');

chalk.level = 2;

// global objects
const gEdges = {
    data: null,
    set: function(edges) {
        this.data = edges;
    },
    get: function() {
        return this.data;
    }
}

// IPC
ipcMain.handle('edges-get', () => {
    return gEdges.get();
});

// main functions
async function processEdges(vertices) {
    console.log(chalk.blue('# processEdges()'));
    const edges = [];
    
    for (const vertex of vertices) {
        if (!vertex._edges) continue;

        for (const edge of vertex._edges) {
            edges.push({
                _from: vertex._uuid,
                _to: edge.target,
                _label: edge.label,
                _canvas: {
                    color: '--layer',
                    width: edge.weight,
                    weight: edge.weight
                }
            });
        }
    }
    gEdges.set(edges);
    return edges;
}

module.exports = { processEdges };