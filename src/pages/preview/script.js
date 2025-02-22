console.log('# pages/preview/script.js');

document.addEventListener('DOMContentLoaded', async () => {
    const graphData = await window.api_internal.getGraphData();
    console.log(`%c# graphData`, 'color: lightblue');
    console.log(`%c${JSON.stringify(graphData, null, 2)}`, 'color: plum');
});