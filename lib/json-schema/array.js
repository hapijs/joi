'use strict';


exports.emit = function (schema, res, mode, options) {

    const ordered = schema.$_terms.ordered;

    // Handle ordered items (tuple-like) using 'prefixItems'

    if (ordered.length) {
        res.prefixItems = ordered.map((item) => item.$_jsonSchema(mode, options));
    }

    if (schema.$_terms.items.length) {
        const items = internals.itemsSchema(schema, mode, options);

        // If there are ordered items, remaining items are 'unevaluatedItems'

        if (ordered.length) {
            res.unevaluatedItems = items;
            internals.setOrderedMinItems(res, ordered);
        }
        else {
            res.items = items;
        }
    }
    else if (ordered.length) {
        // No additional items allowed beyond the ordered ones

        res.unevaluatedItems = false;
        internals.setOrderedMinItems(res, ordered);
        res.maxItems = ordered.length;
    }

    // Map 'has' rules to 'contains' in JSON Schema

    const contains = [];
    for (const rule of schema._rules) {
        if (rule.name === 'has' &&
            !internals.hasReferences(rule.args.schema)) {

            contains.push(rule.args.schema.$_jsonSchema(mode, options));
        }
    }

    if (contains.length) {
        if (contains.length === 1) {
            res.contains = contains[0];
        }
        else {
            res.allOf = contains.map((item) => ({ contains: item }));
        }
    }

    if (schema._flags.single &&
        schema.$_terms.items.length) {

        res = {
            anyOf: [
                res,
                internals.itemsSchema(schema, mode, options)
            ]
        };
    }

    return res;
};


const internals = {};


internals.itemsSchema = function (schema, mode, options) {

    if (schema.$_terms.items.length === 1) {
        return schema.$_terms.items[0].$_jsonSchema(mode, options);
    }

    return {
        anyOf: schema.$_terms.items.map((item) => item.$_jsonSchema(mode, options))
    };
};


internals.setOrderedMinItems = function (res, ordered) {

    // Ordered items are optional by default; the array only needs to reach the
    // last explicitly required position.
    const minItems = internals.orderedMinItems(ordered);
    if (minItems) {
        res.minItems = minItems;
    }
};


internals.orderedMinItems = function (ordered) {

    for (let i = ordered.length - 1; i >= 0; --i) {
        if (ordered[i]._flags.presence === 'required') {
            return i + 1;
        }
    }

    return 0;
};


internals.hasReferences = function (schema) {

    return !!schema._refs.refs.length;
};
