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

        for (const label of Object.keys(vertex._edges)) {
            if (!vertex._edges[label]?.length) continue;

            for (const edge of vertex._edges[label]) {
                edges.push({
                    _from: vertex._uuid,
                    _to: edge,
                    _label: label,
                    _canvas: {
                        color: '--layer',
                        width: 1,
                        weight: 1
                    }
                });
            }
        }
    }
    gEdges.set(edges);
    return edges;
}

module.exports = { processEdges };