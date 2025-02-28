const z = require('zod');
const ISO6391 = require('iso-639-1');

const SCHEMA_GRAPH_YAML = z.object({
    language: z.string()
        .refine(code => ISO6391.validate(code), {
            message: "Must be a valid ISO 639-1 language code (e.g., 'en', 'de', 'fr')"
        })
});

const SCHEMA_VERTEX_YAML_COMPOUND = z.object({
    uuid: z.string().uuid(),
    type: z.enum(['permanent', 'fleeting', 'literature', 'source']),
    visibility: z.enum(['public', 'private']),
    
    created: z.coerce.date().or(z.string().datetime()),
    modified: z.coerce.date().or(z.string().datetime()),
    
    canvas: z.object({
        x: z.number(),
        y: z.number(),
        size: z.number().int().positive(),
        fill: z.string(),
        stroke: z.string().nullable()
    }),

    edges: z.record(
        z.string(), // any string key for link type
        z.array(z.string().uuid())
    ).optional()
})

const SCHEMA_VERTEX_YAML_INDEX = z.object({
    title: z.string(),
    slug: z.string()
})

module.exports = {
    SCHEMA_GRAPH_YAML,
    SCHEMA_VERTEX_YAML_COMPOUND,
    SCHEMA_VERTEX_YAML_INDEX
};