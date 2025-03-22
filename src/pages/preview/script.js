console.log('# pages/preview/script.js');

import wcCanvas from '../../renderer/components/wcCanvas/wcCanvas.js';
import wcVertexPreview from '../../renderer/components/wcVertexPreview/wcVertexPreview.js';

document.addEventListener('DOMContentLoaded', async () => {
    const graphData = await window.api_internal.getGraphData();
    console.log(`%c>> graphData`, 'color: lightblue');
    console.log(`%c${JSON.stringify(graphData, null, 2)}`, 'color: plum');

    const graphItems = await window.api_internal.getGraphItems();
    console.log(`%c>> graphItems`, 'color: lightblue');
    console.log(`%c>> graphItems.length: ${graphItems.length}`, 'color: lightblue');
    console.log(`%c${JSON.stringify(graphItems[0], null, 2)}`, 'color: plum');

    const vertices = await window.api_internal.getVertices();
    console.log(`%c>> vertices`, 'color: lightblue');
    console.log(`%c>> vertices.length: ${vertices.length}`, 'color: lightblue');
    console.log(`%c${JSON.stringify(vertices[0], null, 2)}`, 'color: plum');

    const edges = await window.api_internal.getEdges();
    console.log(`%c>> edges`, 'color: lightblue');
    console.log(`%c>> edges.length: ${edges.length}`, 'color: lightblue');
    console.log(`%c${JSON.stringify(edges[0], null, 2)}`, 'color: plum');
});