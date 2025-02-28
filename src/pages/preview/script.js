console.log('# pages/preview/script.js');

import wcCanvas from '../../renderer/components/wcCanvas/wcCanvas.js';

document.addEventListener('DOMContentLoaded', async () => {
    const graphData = await window.api_internal.getGraphData();
    console.log(`%c# graphData`, 'color: lightblue');
    console.log(`%c${JSON.stringify(graphData, null, 2)}`, 'color: plum');
});