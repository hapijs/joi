'use strict';

const Assert = require('@hapi/hoek/lib/assert');
const Clone = require('@hapi/hoek/lib/clone');

const Common = require('./common');
const Messages = require('./messages');


const internals = {};


exports.type = function (from, options) {

    const base = Object.getPrototypeOf(from);
    const prototype = Clone(base);
    const schema = from._assign(Object.create(prototype));
    const def = Object.assign({}, options);                                 // Shallow cloned
    delete def.base;

    prototype._definition = def;

    const parent = base._definition || {};
    def.messages = Messages.merge(parent.messages, def.messages);
    def.properties = Object.assign({}, parent.properties, def.properties);

    // Initialize

    schema.type = def.type;

    if (def.initialize) {
        def.initialize(schema);
    }

    if (!def.args) {
        def.args = parent.args;
    }

    // Prepare

    def.prepare = internals.prepare(def.prepare, parent.prepare);

    // Coerce

    if (def.coerce) {
        if (typeof def.coerce === 'function') {
            def.coerce = { method: def.coerce };
        }

        if (def.coerce.from &&
            !Array.isArray(def.coerce.from)) {

            def.coerce = { method: def.coerce.method, from: [].concat(def.coerce.from) };
        }
    }

    def.coerce = internals.coerce(def.coerce, parent.coerce);

    // Validate

    def.validate = internals.validate(def.validate, parent.validate);

    // Rules

    const rules = Object.assign({}, parent.rules);
    if (def.rules) {
        for (const name in def.rules) {
            const rule = def.rules[name];
            Assert(typeof rule === 'object', 'Invalid rule definition for', def.type, name);

            let method = rule.method;
            if (method === undefined) {
                method = function () {

                    return this.$_addRule(name);
                };
            }

            if (method) {
                Assert(!prototype[name], 'Rule conflict in', def.type, name);
                prototype[name] = method;
            }

            Assert(!rules[name], 'Rule conflict in', def.type, name);
            rules[name] = rule;

            if (rule.alias) {
                const aliases = [].concat(rule.alias);
                for (const alias of aliases) {
                    prototype[alias] = rule.method;
                }
            }

            if (rule.args) {
                rule.argsByName = new Map();
                rule.args = rule.args.map((arg) => {

                    if (typeof arg === 'string') {
                        arg = { name: arg };
                    }

                    Assert(!rule.argsByName.has(arg.name), 'Duplicated argument name', arg.name);

                    if (Common.isSchema(arg.assert)) {
                        arg.assert = arg.assert.strict().label(arg.name);
                    }

                    rule.argsByName.set(arg.name, arg);
                    return arg;
                });
            }
        }
    }

    def.rules = rules;

    // Overrides

    if (def.overrides) {
        prototype._super = base;
        schema.super = {};
        for (const override in def.overrides) {
            Assert(base[override], 'Cannot override missing', override);
            schema.super[override] = base[override].bind(schema);
        }

        Object.assign(prototype, def.overrides);
    }

    // Casts

    def.cast = Object.assign({}, parent.cast, def.cast);

    // Manifest

    def.build = internals.build(def.build, parent.build);

    // Modify

    def.modify = internals.modify(def.modify, parent.modify);
    def.rebuild = internals.rebuild(def.rebuild, parent.rebuild);

    schema._ids._reachable = !!def.modify;

    return schema;
};


// Helpers

internals.build = function (child, parent) {

    if (!child ||
        !parent) {

        return child || parent;
    }

    return function (obj, desc) {

        return child(parent(obj, desc), desc);
    };
};


internals.coerce = function (child, parent) {

    if (!child ||
        !parent) {

        return child || parent;
    }

    return {
        from: child.from && parent.from ? [...new Set([...child.from, ...parent.from])] : null,
        method: function (schema, value, helpers) {

            let coerced;
            if (!parent.from ||
                parent.from.includes(typeof value)) {

                coerced = parent.method(schema, value, helpers);
                if (coerced) {
                    if (coerced.errors ||
                        coerced.value === undefined) {

                        return coerced;
                    }

                    value = coerced.value;
                }
            }

            if (!child.from ||
                child.from.includes(typeof value)) {

                const own = child.method(schema, value, helpers);
                if (own) {
                    return own;
                }
            }

            return coerced;
        }
    };
};


internals.modify = function (child, parent) {

    if (!child ||
        !parent) {

        return child || parent;
    }

    return function (obj, id, schema) {

        const found = parent(obj, id, schema);
        if (found) {
            return found;
        }

        return child(obj, id, schema);
    };
};


internals.prepare = function (child, parent) {

    if (!child ||
        !parent) {

        return child || parent;
    }

    return function (schema, value, helpers) {

        const prepared = child(schema, value, helpers);
        if (prepared) {
            if (prepared.errors ||
                prepared.value === undefined) {

                return prepared;
            }

            value = prepared.value;
        }

        return parent(schema, value, helpers) || prepared;
    };
};


internals.rebuild = function (child, parent) {

    if (!child ||
        !parent) {

        return child || parent;
    }

    return function (schema) {

        parent(schema);
        child(schema);
    };
};


internals.validate = function (child, parent) {

    if (!child ||
        !parent) {

        return child || parent;
    }

    return function (schema, value, helpers) {

        const result = parent(schema, value, helpers);
        if (result) {
            if (result.errors &&
                (!Array.isArray(result.errors) || result.errors.length)) {

                return result;
            }

            value = result.value;
        }

        return child(schema, value, helpers) || result;
    };
};
