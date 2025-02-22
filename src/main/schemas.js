const z = require('zod');
const ISO6391 = require('iso-639-1');

const SCHEMA_GRAPH_YAML = z.object({
    language: z.string()
        .refine(code => ISO6391.validate(code), {
            message: "Must be a valid ISO 639-1 language code (e.g., 'en', 'de', 'fr')"
        })
});

module.exports = { SCHEMA_GRAPH_YAML };