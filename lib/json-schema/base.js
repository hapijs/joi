'use strict';

const Common = require('../common');
const Helpers = require('./common');
const Conditions = require('./conditions');


exports.convert = function (source, mode, options = {}) {

    if (options.target !== undefined &&
        options.target !== Helpers.target) {

        throw new Error(`Unsupported JSON Schema target: ${options.target}`);
    }

    const rootCall = !options.$defs;
    const defs = options.$defs ?? {};

    const prefs = source._preferences
        ? Common.preferences(options.prefs, source._preferences)
        : options.prefs;
    const presence = source._flags.presence || prefs?.presence;

    if (presence === 'forbidden' && !options.ignorePresence) {
        return false;
    }

    let schema = {};

    const jsonSchemaType = Helpers.jsonSchemaType(source);
    const isTypeAny = source.type === 'any';
    const isOnly = source._flags.only;

    const rawValids = source._valids && Array.from(source._valids._values);
    const valids = rawValids && Helpers.jsonSchemaValues(source, rawValids);
    const onlyValues = valids && valids.filter((value) => typeof value !== 'symbol');
    const nonNullValids = valids && valids.filter((value) => value !== null);
    const rawAllowedValues = rawValids && rawValids.filter((value) => typeof value !== 'symbol' && value !== null);
    let typesOverlap = true;

    // If 'only' is set, check if the allowed values' types overlap with the schema type

    if (rawValids && isOnly && !isTypeAny) {
        const comparableValues = rawValids.filter((value) => typeof value !== 'symbol' && value !== null);
        if (comparableValues.length) {
            const types = new Set(comparableValues.map((value) => typeof value));
            const type = jsonSchemaType || source.type;
            typesOverlap = types.has(type) || (type === 'date' && types.has('object'));
        }
    }

    // Set the JSON Schema 'type' if it's a standard type and there's an overlap

    if (!isTypeAny && typesOverlap && jsonSchemaType) {
        schema.type = jsonSchemaType;
    }

    if (source._flags.description) {
        schema.description = source._flags.description;
    }

    if (source._flags.default !== undefined && typeof source._flags.default !== 'function') {
        const defaultValue = Helpers.jsonSchemaDefaultValue(source, source._flags.default);
        if (defaultValue !== undefined) {
            schema.default = defaultValue;
        }
    }

    const subOptions = { ...options, $defs: defs, prefs };

    // Apply type-specific JSON Schema conversion

    if (source._definition.jsonSchema && typesOverlap) {
        schema = source._definition.jsonSchema(source, schema, mode, subOptions);
    }

    // Apply rule-specific JSON Schema conversions

    for (const rule of source._rules) {
        const definition = source._definition.rules[rule.name];
        if (definition.jsonSchema && typesOverlap && !rule._resolve.length) {
            schema = definition.jsonSchema(rule, schema, isOnly, mode, subOptions);
        }
    }

    // Handle shared schemas

    if (source.$_terms.shared) {
        for (const shared of source.$_terms.shared) {
            defs[shared._flags.id] = shared.$_jsonSchema(mode, subOptions);
        }
    }

    Helpers.applyExamples(source, schema, source.$_terms.examples);
    Helpers.applyMetas(source, schema, source.$_terms.metas);

    if (rootCall && Object.keys(defs).length) {
        schema.$defs = defs;
    }

    // Handle allowed values (valids)

    if (source._valids) {
        const values = isOnly ? onlyValues : nonNullValids.filter((value) => typeof value !== 'symbol');
        if (values.length) {
            if (source._flags.only) {
                if (!(values.length === 1 && values[0] === null) &&
                    typeof schema !== 'boolean') {

                    schema.enum = values;

                    const types = Helpers.onlyTypes(values);
                    if (types) {
                        schema.type = types.length === 1 ? types[0] : types;
                    }
                }
            }
            else {
                const extras = [];
                if (!isTypeAny) {
                    const base = internals.onlyBaseClone(source);
                    const schemaTypes = new Set(Helpers.schemaTypes(schema) || []);
                    schemaTypes.add(jsonSchemaType || source.type);

                    for (const rawValue of rawAllowedValues) {
                        const representations = Helpers.jsonSchemaRepresentations(source, rawValue);
                        const candidates = [];

                        for (const value of representations) {
                            const valueType = Helpers.jsonSchemaValueType(value);
                            if (valueType === null ||
                                !schemaTypes.has(valueType)) {

                                extras.push(value);
                                continue;
                            }

                            candidates.push(value);
                        }

                        // If values are allowed but not exclusive, add them via
                        // 'anyOf' when the base schema would otherwise reject them.
                        if (candidates.length &&
                            base.validate(rawValue, prefs).error) {

                            extras.push(...candidates);
                        }
                    }
                }

                const uniqueExtras = Helpers.uniqueJsonSchemaValues(extras);
                if (uniqueExtras.length) {
                    if (!schema.anyOf) {
                        schema = {
                            anyOf: [schema]
                        };
                    }

                    schema.anyOf.push({ enum: uniqueExtras });
                }
            }
        }
    }

    // Handle disallowed values (invalids)

    if (source._invalids) {
        const invalids = Helpers.jsonSchemaValues(source, Array.from(source._invalids._values)
            .filter((value) => typeof value !== 'symbol'))
            .filter((value) => value !== null || Helpers.schemaCanMatchNull(schema));

        if (invalids.length) {
            schema = Helpers.appendCompositeKeyword(schema, 'not', { enum: invalids });
        }
    }

    // Handle 'null' if it's an allowed value

    if (!isOnly && source._valids && source._valids.has(null) && !isTypeAny) {
        if (schema.type) {
            schema.type = Helpers.appendType(schema.type, 'null');
        }
        else if (schema.anyOf) {
            schema.anyOf.unshift(Helpers.nullSchema());
        }
        else {
            schema = {
                anyOf: [
                    Helpers.nullSchema(),
                    schema
                ]
            };
        }
    }

    // Handle conditionals (whens) by generating multiple possible schemas
    // combined with 'anyOf'
    if (source.$_terms.whens) {
        return { anyOf: Conditions.expandWhenSchemas(source, mode, subOptions) };
    }

    if (isOnly &&
        rawValids &&
        rawValids.some((value) => typeof value !== 'symbol') &&
        !onlyValues.length) {

        return false;
    }

    if (isOnly && onlyValues && onlyValues.length) {
        schema = Helpers.finalizeOnlySchema(source, schema, onlyValues, mode, subOptions);
    }

    return schema;
};


const internals = {};


internals.onlyBaseClone = function (source) {

    const base = source.clone();
    base._valids = null;
    base._invalids = null;
    delete base._flags.only;
    return base;
};
