const z = require('zod');
const ISO6391 = require('iso-639-1');

const SCHEMA_GRAPH_YAML = z.object({
    uuid: z.string().uuid(),
    languages: z.object({
        default: z.string()
            .refine(code => ISO6391.validate(code), {
                message: "Default language must be a valid ISO 639-1 language code (e.g., 'en', 'de', 'fr')"
            }),
        all: z.array(
            z.string()
                .refine(code => ISO6391.validate(code), {
                    message: "All languages must be valid ISO 639-1 language codes (e.g., 'en', 'de', 'fr')"
                })
        )
    })
});

const SCHEMA_VERTEX_YAML_COMPOUND = z.object({
    _uuid: z.string().uuid(),
    _graph: z.string().uuid(),
    _type: z.enum(['permanent', 'fleeting', 'literature', 'source']),
    _visibility: z.enum(['public', 'private']),
    
    _created: z.coerce.date().or(z.string().datetime()),
    _modified: z.coerce.date().or(z.string().datetime()),
    
    _canvas: z.object({
        x: z.number(),
        y: z.number(),
        library: z.string(),
        icon: z.string(),
        size: z.number().int().positive(),
        fill: z.string(),
        stroke: z.string().nullable()
    }),

    _edges: z.record(
        z.string(), // any string key for link type
        z.array(z.string().uuid())
    ).optional()
}).passthrough()

const SCHEMA_VERTEX_YAML_INDEX = z.object({
    _title: z.string(),
    _slug: z.string()
}).passthrough()

module.exports = {
    SCHEMA_GRAPH_YAML,
    SCHEMA_VERTEX_YAML_COMPOUND,
    SCHEMA_VERTEX_YAML_INDEX
};