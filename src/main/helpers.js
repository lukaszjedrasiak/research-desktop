const yaml = require('yaml');

async function parseYaml(yamlContent) {
    try {
        const parsed = yaml.parse(yamlContent);
        if (!parsed || typeof parsed !== 'object') {
            return null;
        }
        return parsed;
    } catch (error) {
        return null;
    }
}

module.exports = {
    parseYaml
};