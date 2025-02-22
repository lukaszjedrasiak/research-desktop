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

async function validateSchema(schema, data) {
    const result = schema.safeParse(data);
    if (!result.success) {
        return false;
    }
    return true;
}

module.exports = {
    parseYaml,
    validateSchema
};