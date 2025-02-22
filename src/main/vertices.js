const chalk = require('chalk');
const fs = require('fs').promises;
const path = require('path');

// internal imports
const { extractYaml, parseYaml, validateSchema } = require('./helpers');
const { SCHEMA_VERTEX_YAML_COMPOUND, SCHEMA_VERTEX_YAML_INDEX } = require('./schemas');

chalk.level = 2;

const IGNORE_ITEMS = [
    '.git',
    '.gitignore',
    '.research',
    'CONTRIBUTING.md',
    'LICENSE.md',
    'README.md',
]

async function processVertices(graphPath) {
    const vertices = [];

    //console.log(chalk.blue('# processVertices()'));
    const graphItemsAll = await fs.readdir(graphPath);
    //console.log(chalk.green(`graphItemsAll: ${graphItemsAll}`));
    const graphItemsNotIgnored = graphItemsAll.filter(item => !IGNORE_ITEMS.includes(item));
    //console.log(chalk.green(`graphItemsNotIgnored: ${graphItemsNotIgnored}`));

    // get only the folders
    let graphItemsFolders = [];
    for (const item of graphItemsNotIgnored) {
        const itemPath = path.join(graphPath, item);
        const itemStats = await fs.stat(itemPath);
        if (itemStats.isDirectory()) {
            graphItemsFolders.push(item);
        }
    }
    console.log(chalk.green(`graphItemsFolders: ${graphItemsFolders}`));

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

module.exports = { processVertices };