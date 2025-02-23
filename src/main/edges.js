const chalk = require('chalk');

chalk.level = 2;

async function processEdges(vertices) {
    console.log(chalk.blue('# processEdges()'));
    const edges = [];
    
    for (const vertex of vertices) {
        if (!vertex.edges) continue;

        for (const label of Object.keys(vertex.edges)) {
            if (!vertex.edges[label]?.length) continue;

            for (const edge of vertex.edges[label]) {
                edges.push({
                    from: vertex.uuid,
                    to: edge,
                    label: label,
                    canvas: {
                        color: '--layer',
                        width: 1,
                        weight: 1
                    }
                });
            }
        }
    }
    return edges;
}

module.exports = { processEdges };