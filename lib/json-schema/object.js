'use strict';

const Common = require('../common');
const Conditions = require('./conditions');
const Helpers = require('./common');


exports.depJsonSchema = {

    with(dep, res) {

        internals.mergeDependentRequired(res, dep.key.key, dep.paths);
    },

    without(dep, res) {

        const prohibited = {};
        for (const peer of dep.paths) {
            prohibited[peer] = false;
        }

        internals.mergeDependentSchemaProperties(res, dep.key.key, prohibited);
    },

    and(dep, res) {

        for (const peer of dep.paths) {
            internals.mergeDependentRequired(res, peer, dep.paths.filter((path) => path !== peer));
        }
    },

    nand(dep, res) {

        const props = {};
        for (const peer of dep.paths) {
            props[peer] = true;
        }

        Helpers.appendCompositeKeyword(res, 'not', { properties: props, required: dep.paths });
    },

    or(dep, res) {

        const branches = dep.paths.map((peer) => ({ properties: { [peer]: true }, required: [peer] }));
        Helpers.appendCompositeKeyword(res, 'anyOf', branches);
    },

    xor(dep, res) {

        const branches = dep.paths.map((peer) => ({ properties: { [peer]: true }, required: [peer] }));
        Helpers.appendCompositeKeyword(res, 'oneOf', branches);
    },

    oxor(dep, res) {

        const branches = dep.paths.map((peer) => ({ properties: { [peer]: true }, required: [peer] }));
        Helpers.appendCompositeKeyword(res, 'oneOf', [
            { not: { anyOf: branches } },
            ...branches
        ]);
    }
};


exports.child = function (schema, mode, options, prefs) {

    const childPrefs = schema._preferences
        ? Common.preferences(prefs, schema._preferences)
        : prefs;
    const presence = schema._flags.presence || childPrefs?.presence;
    const jsonSchema = schema.$_jsonSchema(mode, { ...options, ignorePresence: true });

    if (schema._flags.id) {
        options.$defs[schema._flags.id] = jsonSchema;
    }

    if (presence === 'forbidden' ||
        (mode === 'output' && schema._flags.result === 'strip')) {

        return {
            schema: false,
            required: false
        };
    }

    return {
        schema: jsonSchema,
        required: presence === 'required' ||
            (mode === 'output' && schema._flags.default !== undefined && !childPrefs?.noDefaults)
    };
};


exports.hoistedWhens = function (schema, key, mode, options, prefs) {

    if (!schema.$_terms.whens?.length) {
        return null;
    }

    const conditionals = [];
    const base = schema.clone();
    base.$_terms.whens = null;

    for (const when of schema.$_terms.whens) {
        const conditional = internals.hoistedWhen(base, key, when, mode, options, prefs);
        if (!conditional) {
            return null;
        }

        conditionals.push(conditional);
    }

    return { base, conditionals };
};


exports.appendConditional = function (res, conditional) {

    if (res.allOf) {
        res.allOf.push(conditional);
        return;
    }

    if (res.if !== undefined) {
        internals.promoteConditional(res, conditional);
        return;
    }

    Object.assign(res, conditional);
};


const internals = {};


internals.mergeDependentRequired = function (res, key, peers) {

    res.dependentRequired = res.dependentRequired || {};
    res.dependentRequired[key] = internals.mergeUniqueItems(res.dependentRequired[key], peers);
};


internals.mergeDependentSchemaProperties = function (res, key, properties) {

    res.dependentSchemas = res.dependentSchemas || {};

    const existing = res.dependentSchemas[key];
    if (!existing) {
        res.dependentSchemas[key] = { properties };
        return;
    }

    existing.properties = {
        ...existing.properties,
        ...properties
    };
};


internals.hoistedWhen = function (base, key, when, mode, options, prefs) {

    if (!when.ref) {
        return null;
    }

    const path = internals.hoistableRefPath(when.ref);
    if (!path) {
        return null;
    }

    if (when.switch) {
        return internals.hoistedSwitchWhen(base, key, when, path, mode, options, prefs);
    }

    const literal = Conditions.literalValue(when.is);
    if (!literal.found) {
        return null;
    }

    const conditional = {
        if: internals.hoistedWhenCondition(path, literal.value)
    };

    conditional.then = when.then && internals.hoistedWhenBranch(base.concat(when.then), key, mode, options, prefs);
    conditional.else = when.otherwise && internals.hoistedWhenBranch(base.concat(when.otherwise), key, mode, options, prefs);

    if (conditional.then === undefined) {
        delete conditional.then;
    }

    if (conditional.else === undefined) {
        delete conditional.else;
    }

    return conditional;
};


internals.hoistedSwitchWhen = function (base, key, when, path, mode, options, prefs) {

    let conditional;

    for (let i = when.switch.length - 1; i >= 0; --i) {
        const item = when.switch[i];
        const literal = Conditions.literalValue(item.is);
        if (!literal.found) {
            return null;
        }

        const nested = {
            if: internals.hoistedWhenCondition(path, literal.value),
            then: internals.hoistedWhenBranch(base.concat(item.then), key, mode, options, prefs)
        };

        const otherwise = item.otherwise && internals.hoistedWhenBranch(base.concat(item.otherwise), key, mode, options, prefs);
        if (otherwise !== undefined) {
            nested.else = otherwise;
        }
        else if (conditional !== undefined) {
            nested.else = conditional;
        }

        conditional = nested;
    }

    return conditional;
};


internals.hoistableRefPath = function (ref) {

    if (ref.type !== 'value' ||
        ref.ancestor !== 1 ||
        !ref.path.length ||
        ref.adjust !== null ||
        ref.map !== null ||
        ref.iterables !== null ||
        ref.in !== false) {

        return null;
    }

    for (const segment of ref.path) {
        if (typeof segment !== 'string' ||
            !segment.length ||
            /^\d+$/.test(segment)) {

            return null;
        }
    }

    return ref.path;
};


internals.hoistedWhenCondition = function (path, value) {

    let schema = {
        const: value
    };

    for (let i = path.length - 1; i >= 0; --i) {
        schema = {
            type: 'object',
            properties: {
                [path[i]]: schema
            },
            required: [path[i]]
        };
    }

    return schema;
};


internals.hoistedWhenBranch = function (schema, key, mode, options, prefs) {

    const child = exports.child(schema, mode, options, prefs);
    const branch = {
        properties: {
            [key]: child.schema
        }
    };

    if (child.required) {
        branch.required = [key];
    }

    return branch;
};


internals.takeConditional = function (res) {

    const conditional = {};
    for (const key of ['if', 'then', 'else']) {
        if (res[key] !== undefined) {
            conditional[key] = res[key];
            delete res[key];
        }
    }

    return conditional;
};


internals.promoteConditional = function (res, conditional) {

    res.allOf = [
        internals.takeConditional(res),
        conditional
    ];
};


internals.mergeUniqueItems = function (existing = [], next = []) {

    const items = [...existing];
    for (const value of next) {
        if (!items.includes(value)) {
            items.push(value);
        }
    }

    return items;
};
