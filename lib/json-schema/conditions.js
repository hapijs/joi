'use strict';

const { deepEqual } = require('@hapi/hoek');


exports.expandWhenSchemas = function (schema, mode, options) {

    const base = schema.clone();
    base.$_terms.whens = null;

    const matches = [];
    for (const when of schema.$_terms.whens) {
        const tests = exports.tests(when);
        for (let i = 0; i < tests.length; ++i) {
            const test = tests[i];
            if (test.then) {
                matches.push(base.concat(test.then).$_jsonSchema(mode, options));
            }

            if (test.otherwise) {
                matches.push(base.concat(test.otherwise).$_jsonSchema(mode, options));
            }

            if (!test.then || (i === tests.length - 1 && !test.otherwise)) {
                matches.push(base.$_jsonSchema(mode, options));
            }
        }
    }

    return exports.uniqueSchemas(matches);
};


exports.matchSchemas = function (match, mode, options) {

    if (match.schema) {
        return [match.schema.$_jsonSchema(mode, options)];
    }

    // Handle conditional matches (when/switch)

    const matches = [];
    for (const test of exports.tests(match)) {
        if (test.then) {
            matches.push(test.then.$_jsonSchema(mode, options));
        }

        if (test.otherwise) {
            matches.push(test.otherwise.$_jsonSchema(mode, options));
        }
    }

    return matches;
};


exports.tests = function (when) {

    return when.is ? [when] : when.switch;
};


exports.literalValue = function (schema) {

    const isAnyType = schema.type === 'any';
    const isOnly = schema._flags.only;
    const hasRules = !!schema._rules.length;
    const hasInvalids = !!schema._invalids;

    if (!isAnyType ||
        !isOnly ||
        hasRules ||
        hasInvalids) {

        return { found: false };
    }

    const values = Array.from(schema._valids._values).filter((value) => typeof value !== 'symbol');
    if (values.length !== 1) {
        return { found: false };
    }

    const value = values[0];
    return value === null || ['string', 'number', 'boolean'].includes(typeof value)
        ? { found: true, value }
        : { found: false };
};


exports.uniqueSchemas = function (schemas) {

    const unique = [];
    for (const schema of schemas) {
        if (!unique.some((candidate) => deepEqual(candidate, schema))) {
            unique.push(schema);
        }
    }

    return unique;
};
