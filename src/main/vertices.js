const chalk = require('chalk');

chalk.level = 2;

async function processVertices(graphPath) {
    console.log(chalk.blue('# processVertices()'));
    //console.log(`graphPath: ${graphPath}`);
}

module.exports = { processVertices };