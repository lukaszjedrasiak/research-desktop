const yaml = require('yaml');

async function extractYaml(content) {
    const regex = /---\n([\s\S]*?)\n---/;
    const match = content.match(regex);
    return match ? match[1] : null;
}

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

async function jsonToYaml(jsonObject) {
    return yaml.stringify(jsonObject, { indent: 4 });
}

async function validateSchema(schema, data) {
    const result = schema.safeParse(data);
    if (!result.success) {
        console.log(result.error);
        return false;
    }
    return true;
}

module.exports = {
    extractYaml,
    parseYaml,
    validateSchema,
    jsonToYaml
};