console.log(`# renderer/common.js`);

async function displayVersion() {
    const version = await window.api_internal.getAppVersion();
    document.getElementById('app-version').innerText = `version: ${version}`;
}

displayVersion();
