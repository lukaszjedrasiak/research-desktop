console.log('# pages/preview/script.js');

import wcCanvas from '../../renderer/components/wcCanvas/wcCanvas.js';

document.addEventListener('DOMContentLoaded', async () => {
    const graphData = await window.api_internal.getGraphData();
    const graphItems = await window.api_internal.getGraphItems();
    console.log(`%c# graphData`, 'color: lightblue');
    console.log(`%c${JSON.stringify(graphData, null, 2)}`, 'color: plum');
    console.log(`%c# graphItems`, 'color: lightblue');
    console.log(`%c${JSON.stringify(graphItems, null, 2)}`, 'color: plum');
});