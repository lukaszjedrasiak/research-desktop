const { dialog, ipcMain } = require('electron');

const chalk = require('chalk');
const fs = require('fs').promises;
const path = require('path');

// internal imports
const { extractYaml, parseYaml, validateSchema, jsonToYaml } = require('./helpers');
const { SCHEMA_VERTEX_YAML_COMPOUND, SCHEMA_VERTEX_YAML_INDEX } = require('./schemas');

chalk.level = 2;


// global objects
const gVertices = {
    data: null,
    set: function(vertices) {
        this.data = vertices;
    },
    get: function() {
        return this.data;
    }
}

// IPC
ipcMain.handle('vertex-create', (event, x = 0, y = 0) => {
    return vertexCreate(x, y);
});

ipcMain.handle('vertices-get', () => {
    return gVertices.get();
});

ipcMain.handle('vertex-get-content', (event, uuid) => {
    return vertexGetContent(uuid);
});

// main functions
async function processVertices(graphPath, graphItems) {
    console.log(chalk.blue('# processVertices()'));
    const vertices = [];

    // get only the folders
    let graphItemsFolders = [];
    for (const item of graphItems) {
        const itemPath = path.join(graphPath, item);
        const itemStats = await fs.stat(itemPath);
        if (itemStats.isDirectory()) {
            graphItemsFolders.push(item);
        }
    }

    for (const vertexFolderName of graphItemsFolders) {
        //console.log(chalk.blue(`# vertexFolderName: ${vertexFolderName}`));
        const vertexFolderPath = path.join(graphPath, vertexFolderName);
        const vertexFolderItems = await fs.readdir(vertexFolderPath);

        // frontmatter exists?
        if (!vertexFolderItems.includes('graph.yaml')) continue;

        // read frontmatter
        const frontmatterPath = path.join(vertexFolderPath, 'graph.yaml');
        const frontmatterRaw = await fs.readFile(frontmatterPath, 'utf8');

        const frontmatterParsed = await parseYaml(frontmatterRaw);
        if (!frontmatterParsed) continue;

        const frontmatterSchemaValid = await validateSchema(SCHEMA_VERTEX_YAML_COMPOUND, frontmatterParsed);
        if (!frontmatterSchemaValid) continue;

        frontmatterParsed._title = {};
        frontmatterParsed._slug = {};

        const indexFiles = vertexFolderItems.filter(file => file.startsWith('index.') && file.endsWith('.md'));
        if (indexFiles.length === 0) continue;

        for (const indexFile of indexFiles) {
            //console.log(chalk.blue(`# indexFile: ${indexFile}`));
            const indexFilePath = path.join(vertexFolderPath, indexFile);
            const indexFileRaw = await fs.readFile(indexFilePath, 'utf8');
            const indexFileYaml = await extractYaml(indexFileRaw);
            if (!indexFileYaml) continue;

            const indexFileYamlParsed = await parseYaml(indexFileYaml);
            if (!indexFileYamlParsed) continue;
            
            const indexFileYamlSchemaValid = await validateSchema(SCHEMA_VERTEX_YAML_INDEX, indexFileYamlParsed);
            if (!indexFileYamlSchemaValid) continue;

            const indexLanguage = indexFile.split('.')[1];
            frontmatterParsed._title[indexLanguage] = indexFileYamlParsed._title;
            frontmatterParsed._slug[indexLanguage] = indexFileYamlParsed._slug;
        }

        frontmatterParsed.path = vertexFolderPath;

        vertices.push(frontmatterParsed);
    }

    gVertices.set(vertices);
    return vertices;
}

async function vertexCreate(x = 0, y = 0) {
    console.log(chalk.blue('# vertexCreate()'));

    // internal imports
    const { graphGet, graphOpenReload } = require('./graph');

    const currentGraph = graphGet();
    //console.log(currentGraph);

    if (!currentGraph) {
        dialog.showMessageBox({
            title: 'Error',
            message: 'No graph is currently loaded',
            type: 'error'
        });
        return;
    }

    // Use native save dialog to get vertex name and location
    const result = await dialog.showSaveDialog({
        title: 'Create New Vertex',
        buttonLabel: 'Create Vertex',
        properties: ['createDirectory'],
        defaultPath: currentGraph.path
    });

    if (!result.canceled && result.filePath) {
        const vertexName = path.basename(result.filePath);
        console.log(chalk.green(`# vertexCreate() | name: ${vertexName} | path: ${result.filePath}`));

        // create folder
        const vertexFolderPath = path.join(currentGraph.path, vertexName);
        await fs.mkdir(vertexFolderPath, { recursive: true });

        // create graph.yaml
        const graphYamlObject = {
            _uuid: crypto.randomUUID(),
            _graph: currentGraph.uuid,
            _type: 'permanent',
            _visibility: 'private',
            _created: new Date().toISOString(),
            _modified: new Date().toISOString(),
            _canvas: {
                x: x,
                y: y,
                //library: 'material-symbols-rounded',
                //icon: 'article',
                //size: 16,
                //fill: '--primary',
                //stroke: null
            },
        }

        let graphYamlString = await jsonToYaml(graphYamlObject);
        graphYamlString += '\n# _edges:\n#   - target: uuid\n#     label: label-name\n#     weight: 1\n';

        const graphYamlPath = path.join(vertexFolderPath, 'graph.yaml');
        await fs.writeFile(graphYamlPath, graphYamlString);

        // create index files
        for (const singleLanguage of currentGraph.languages.all) {
            const indexYamlObject = {
                _title: vertexName,
                _slug: vertexName
            }

            const indexYamlString = await jsonToYaml(indexYamlObject);
            const indexYamlStringFinal = `---\n${indexYamlString}---\n\n...`;
            const indexFilePath = path.join(vertexFolderPath, `index.${singleLanguage}.md`);
            await fs.writeFile(indexFilePath, indexYamlStringFinal);
        }

        graphOpenReload('reload');
    }
    
    return null;
}

async function vertexGetContent(uuid) {
    console.log(chalk.blue(`# vertexGetContent(${uuid})`));
    const vertices = gVertices.get();
    const vertexFound = vertices.find(vertex => vertex._uuid === uuid);
    if (!vertexFound) return null;

    const vertexContent = {};

    const indexFiles = await fs.readdir(vertexFound.path);
    const indexFilesFiltered = indexFiles.filter(file => file.startsWith('index.') && file.endsWith('.md'));
    if (indexFilesFiltered.length === 0) return null;

    for (const indexFile of indexFilesFiltered) {
        const indexFilePath = path.join(vertexFound.path, indexFile);
        const indexFileLanguage = indexFile.split('.')[1];
        const indexFileRaw = await fs.readFile(indexFilePath, 'utf8');

        vertexContent[indexFileLanguage] = indexFileRaw;
    }

    return vertexContent;
}

module.exports = {
    processVertices,
    vertexCreate
};