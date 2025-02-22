console.log('# pages/preview/script.js');

document.addEventListener('DOMContentLoaded', async () => {
    const graphData = await window.api_internal.getGraphData();
    console.log(graphData);
    console.log(graphData.path);
});