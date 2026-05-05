'use strict';

const { deepEqual } = require('@hapi/hoek');


const internals = {
    standardTypes: new Set(['string', 'number', 'integer', 'boolean', 'object', 'array', 'null']),
    primitiveTypes: new Set(['string', 'number', 'boolean']),
    metaPassthroughKeywords: new Set([
        '$comment',
        'contentEncoding',
        'contentMediaType',
        'contentSchema',
        'deprecated',
        'examples',
        'format',
        'readOnly',
        'title',
        'writeOnly'
    ]),
    onlyFallbackAnnotationKeywords: new Set([
        '$comment',
        '$defs',
        'contentEncoding',
        'contentMediaType',
        'contentSchema',
        'default',
        'deprecated',
        'description',
        'examples',
        'readOnly',
        'title',
        'writeOnly'
    ])
};


exports.target = 'draft-2020-12';


exports.nullSchema = function () {

    return { type: 'null' };
};


exports.appendCompositeKeyword = function (schema, keyword, value) {

    if (typeof schema === 'boolean') {
        return schema ? { [keyword]: value } : false;
    }

    if (schema.allOf) {
        if (schema[keyword] !== undefined) {
            schema.allOf.push({ [keyword]: schema[keyword] });
            delete schema[keyword];
        }

        schema.allOf.push({ [keyword]: value });
        return schema;
    }

    if (schema[keyword] === undefined) {
        schema[keyword] = value;
        return schema;
    }

    schema.allOf = [
        { [keyword]: schema[keyword] },
        { [keyword]: value }
    ];

    delete schema[keyword];

    return schema;
};


exports.finalizeOnlySchema = function (source, schema, values, mode, options) {

    let base = exports.onlyCanRetainBaseSchema(source, values, options.prefs)
        ? internals.onlyBaseSchema(source, mode, options)
        : internals.onlyFallbackAnnotations(schema);

    if (typeof base === 'boolean') {
        base = {};
    }

    if (schema.$defs) {
        base.$defs = schema.$defs;
    }

    if (values.length === 1 &&
        values[0] === null) {

        base.type = 'null';
        delete base.enum;
        return base;
    }

    base.enum = values;

    const types = exports.onlyTypes(values);
    if (types) {
        base.type = types.length === 1 ? types[0] : types;
    }
    else {
        delete base.type;
    }

    return base;
};


exports.appendType = function (type, addition) {

    const types = Array.isArray(type) ? type.slice() : [type];

    if (!types.includes(addition)) {
        types.push(addition);
    }

    return types.length === 1 ? types[0] : types;
};


exports.onlyCanRetainBaseSchema = function (source, values, prefs) {

    const base = internals.onlyBaseClone(source);
    const baseSchema = base.$_jsonSchema('input', { prefs, $defs: {} });
    const baseTypes = exports.schemaTypes(baseSchema);
    let checked = false;

    for (const value of values) {
        if (value === null) {
            continue;
        }

        const valueType = exports.jsonSchemaValueType(value);
        if (valueType === null) {
            return false;
        }

        if (baseTypes &&
            !baseTypes.has(valueType)) {

            continue;
        }

        checked = true;

        if (base.validate(value, prefs).error) {
            return false;
        }
    }

    return checked || !baseTypes;
};


exports.onlyTypes = function (values) {

    const types = values.map(exports.jsonSchemaValueType);
    if (types.includes(null)) {
        return null;
    }

    return [...new Set(types)];
};


exports.jsonSchemaValues = function (source, values) {

    return exports.uniqueJsonSchemaValues(values.flatMap((value) => exports.jsonSchemaRepresentations(source, value)));
};


exports.jsonSchemaRepresentations = function (source, value) {

    if (source.type === 'date') {
        if (!(value instanceof Date)) {
            return [];
        }

        return internals.jsonSchemaDateValues(source, value);
    }

    if (value instanceof Date) {
        return [];
    }

    return [value];
};


exports.jsonSchemaValueType = function (value) {

    if (value === null) {
        return 'null';
    }

    const type = typeof value;
    return internals.primitiveTypes.has(type) ? type : null;
};


exports.schemaTypes = function (schema) {

    if (typeof schema === 'boolean' ||
        schema.type === undefined) {

        return null;
    }

    const types = Array.isArray(schema.type) ? schema.type : [schema.type];
    return new Set(types);
};


exports.applyExamples = function (source, schema, examples) {

    if (!examples) {
        return;
    }

    schema.examples = internals.mergeExamples(schema.examples, exports.jsonSchemaAnnotationValue(source, examples));
};


exports.applyMetas = function (source, schema, metas = []) {

    if (!metas.length) {
        return;
    }

    for (const meta of metas) {
        if (!meta ||
            typeof meta !== 'object' ||
            Array.isArray(meta)) {

            continue;
        }

        for (const [key, value] of Object.entries(meta)) {
            if (key === 'examples') {
                const merged = internals.mergeExamples(schema.examples, exports.jsonSchemaAnnotationValue(source, value));
                if (merged !== undefined) {
                    schema.examples = merged;
                }

                continue;
            }

            if (!internals.metaPassthroughKeywords.has(key) ||
                value === undefined ||
                schema[key] !== undefined) {

                continue;
            }

            schema[key] = exports.jsonSchemaAnnotationValue(source, value);
        }
    }
};


exports.uniqueJsonSchemaValues = function (values) {

    return internals.mergeExamples([], values);
};


exports.jsonSchemaAnnotationValue = function (source, value) {

    if (value instanceof Date) {
        return internals.jsonSchemaAnnotationDateValue(source, value);
    }

    if (Array.isArray(value)) {
        return value.map((item) => exports.jsonSchemaAnnotationValue(source, item));
    }

    if (internals.isPlainObject(value)) {
        const copy = {};
        for (const [key, item] of Object.entries(value)) {
            copy[key] = exports.jsonSchemaAnnotationValue(source, item);
        }

        return copy;
    }

    return value;
};


exports.jsonSchemaDefaultValue = function (source, value) {

    if (source?.type === 'date' &&
        value === 'now') {

        return undefined;
    }

    return exports.jsonSchemaAnnotationValue(source, value);
};


exports.schemaCanMatchNull = function (schema) {

    if (schema === false) {
        return false;
    }

    if (schema === true) {
        return true;
    }

    if (schema.enum) {
        return schema.enum.includes(null);
    }

    if (schema.type !== undefined) {
        const types = Array.isArray(schema.type) ? schema.type : [schema.type];
        return types.includes('null');
    }

    if (schema.anyOf) {
        return schema.anyOf.some(exports.schemaCanMatchNull);
    }

    if (schema.oneOf) {
        return schema.oneOf.some(exports.schemaCanMatchNull);
    }

    if (schema.allOf) {
        return schema.allOf.every(exports.schemaCanMatchNull);
    }

    return true;
};


exports.jsonSchemaType = function (schema) {

    if (internals.standardTypes.has(schema.type)) {
        return schema.type;
    }

    return schema._definition?.jsonSchemaType || null;
};


internals.onlyBaseSchema = function (source, mode, options) {

    return internals.onlyBaseClone(source).$_jsonSchema(mode, options);
};


internals.onlyBaseClone = function (source) {

    const base = source.clone();
    base._valids = null;
    base._invalids = null;
    delete base._flags.only;
    return base;
};


internals.onlyFallbackAnnotations = function (schema) {

    if (typeof schema === 'boolean') {
        return {};
    }

    const annotations = {};
    for (const key of internals.onlyFallbackAnnotationKeywords) {
        if (schema[key] !== undefined) {
            annotations[key] = schema[key];
        }
    }

    return annotations;
};


internals.jsonSchemaDateValues = function (source, value) {

    const format = source._flags.format;
    if (format === 'javascript') {
        return [value.getTime()];
    }

    if (format === 'unix') {
        return [value.getTime() / 1000];
    }

    if (format === 'iso') {
        return [value.toISOString()];
    }

    return [value.toISOString(), value.getTime()];
};


internals.mergeExamples = function (existing, next) {

    if (!Array.isArray(next) ||
        !next.length) {

        return existing;
    }

    const merged = existing ? [...existing] : [];
    for (const example of next) {
        if (!merged.some((item) => deepEqual(item, example))) {
            merged.push(example);
        }
    }

    return merged;
};


internals.jsonSchemaAnnotationDateValue = function (source, value) {

    if (source?.type === 'date') {
        const format = source._flags.format;
        if (format === 'javascript') {
            return value.getTime();
        }

        if (format === 'unix') {
            return value.getTime() / 1000;
        }
    }

    return value.toISOString();
};


internals.isPlainObject = function (value) {

    if (!value ||
        typeof value !== 'object') {

        return false;
    }

    const prototype = Object.getPrototypeOf(value);
    return prototype === Object.prototype || prototype === null;
};
