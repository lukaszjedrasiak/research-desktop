const { dialog, ipcMain } = require('electron');

const chalk = require('chalk');
const fs = require('fs').promises;
const path = require('path');

// internal imports
const { extractYaml, parseYaml, validateSchema, jsonToYaml } = require('./helpers');
const { SCHEMA_VERTEX_YAML_COMPOUND, SCHEMA_VERTEX_YAML_INDEX } = require('./schemas');

chalk.level = 2;

// IPC
ipcMain.handle('vertex-create', () => {
    return vertexCreate();
});

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

        frontmatterParsed.title = {};
        frontmatterParsed.slug = {};

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
            frontmatterParsed.title[indexLanguage] = indexFileYamlParsed.title;
            frontmatterParsed.slug[indexLanguage] = indexFileYamlParsed.slug;
        }

        vertices.push(frontmatterParsed);
    }

    return vertices;
}

async function vertexCreate() {
    console.log(chalk.blue('# vertexCreate()'));

    // internal imports
    const { getGraph, graphReload } = require('./graph');

    const currentGraph = getGraph();

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
        console.log(chalk.green(`vertexCreate() | name: ${vertexName} | path: ${result.filePath}`));

        // create folder
        const vertexFolderPath = path.join(currentGraph.path, vertexName);
        await fs.mkdir(vertexFolderPath, { recursive: true });

        // create graph.yaml
        const graphYamlObject = {
            uuid: crypto.randomUUID(),
            type: 'permanent',
            visibility: 'private',
            created: new Date().toISOString(),
            modified: new Date().toISOString(),
            canvas: {
                x: 0,
                y: 0,
                library: 'material-symbols-rounded',
                icon: 'article',
                size: 16,
                fill: '--primary',
                stroke: null
            },
            edges: {
                'parent': [],
                'sibling': []
            }
        }

        const graphYamlString = await jsonToYaml(graphYamlObject);

        const graphYamlPath = path.join(vertexFolderPath, 'graph.yaml');
        await fs.writeFile(graphYamlPath, graphYamlString);

        // create index files
        for (const singleLanguage of currentGraph.languages.all) {
            const indexYamlObject = {
                title: vertexName,
                slug: vertexName
            }

            const indexYamlString = await jsonToYaml(indexYamlObject);
            const indexYamlStringFinal = `---\n${indexYamlString}---\n\n...`;
            const indexFilePath = path.join(vertexFolderPath, `index.${singleLanguage}.md`);
            await fs.writeFile(indexFilePath, indexYamlStringFinal);
        }

        graphReload();
    }
    
    return null;
}

module.exports = {
    processVertices,
    vertexCreate
};