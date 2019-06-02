'use strict';

const Hoek = require('@hapi/hoek');

const About = require('../about');
const Errors = require('../errors');
const Ref = require('../ref');
const Settings = require('../settings');
const State = require('./state');
const Validator = require('../validator');
const Values = require('../values');
const Utils = require('../utils');

let Alternatives = null;                            // Delay-loaded to prevent circular dependencies
let Cast = null;
let Schemas = null;


const internals = {
    keysToRestore: [
        '_description',
        '_examples',
        '_flags',
        '_inner',
        '_invalids',
        '_meta',
        '_notes',
        '_refs',
        '_settings',
        '_tags',
        '_tests',
        '_uniqueRules',
        '_unit',
        '_valids'
    ]
};


module.exports = internals.Any = class {

    constructor() {

        Cast = Cast || require('../cast');

        this[Settings.symbols.any] = true;

        this._type = 'any';
        this._settings = null;
        this._refs = new Ref.Manager();

        this._valids = new Values();
        this._invalids = new Values();

        this._tests = [];
        this._uniqueRules = new Map();

        this._flags = {
            /*
             presence: 'optional',                   // optional, required, forbidden, ignore
             allowOnly: false,
             allowUnknown: undefined,
             default: undefined,
             failover: undefined,
             forbidden: false,
             encoding: undefined,
             insensitive: false,
             trim: false,
             normalize: undefined,                   // NFC, NFD, NFKC, NFKD
             case: undefined,                        // upper, lower
             empty: undefined,
             func: false,
             raw: false
             */
        };

        this._description = null;
        this._unit = null;
        this._notes = [];
        this._tags = [];
        this._examples = [];
        this._meta = [];

        this._inner = {};                           // Hash of arrays of immutable objects
    }

    // About

    get schemaType() {

        return this._type;
    }

    describe() {

        return About.describe(this);
    }

    // Rules

    allow(...values) {

        Utils.verifyFlat(values, 'allow');

        const obj = this.clone();
        for (const value of values) {
            Hoek.assert(value !== undefined, 'Cannot call allow/valid/invalid with undefined');
            obj._invalids.remove(value);
            obj._valids.add(value, obj._refs);
        }

        return obj;
    }

    concat(schema) {

        Hoek.assert(schema instanceof internals.Any, 'Invalid schema object');
        Hoek.assert(this._type === 'any' || schema._type === 'any' || schema._type === this._type, 'Cannot merge type', this._type, 'with another type:', schema._type);

        let obj = this.clone();

        if (this._type === 'any' &&
            schema._type !== 'any') {

            // Reset values as if we were "this"

            const tmpObj = schema.clone();
            for (const key of internals.keysToRestore) {
                tmpObj[key] = obj[key];
            }

            obj = tmpObj;
        }

        obj._settings = obj._settings ? Settings.concat(obj._settings, schema._settings) : schema._settings;
        obj._valids.merge(schema._valids, schema._invalids);
        obj._invalids.merge(schema._invalids, schema._valids);
        obj._refs.register(schema, Ref.toSibling);

        for (const test of schema._tests) {
            if (test.rule &&
                !test.rule.multi) {

                obj._tests = obj._tests.filter((target) => target.name !== test.name);
                obj._uniqueRules.set(test.name, test.rule);
            }

            obj._tests.push(test);
        }

        if (obj._flags.empty &&
            schema._flags.empty) {

            obj._flags.empty = obj._flags.empty.concat(schema._flags.empty);
            const flags = Object.assign({}, schema._flags);
            delete flags.empty;
            Hoek.merge(obj._flags, flags);
        }
        else if (schema._flags.empty) {
            obj._flags.empty = schema._flags.empty;
            const flags = Object.assign({}, schema._flags);
            delete flags.empty;
            Hoek.merge(obj._flags, flags);
        }
        else {
            Hoek.merge(obj._flags, schema._flags);
        }

        obj._description = schema._description || obj._description;
        obj._unit = schema._unit || obj._unit;
        obj._notes.push(...schema._notes);
        obj._tags.push(...schema._tags);
        obj._examples.push(...schema._examples);
        obj._meta.push(...schema._meta);

        for (const key in schema._inner) {
            const sources = schema._inner[key];
            if (!sources) {
                continue;
            }

            const targets = obj._inner[key];
            if (!targets) {
                obj._inner[key] = sources.slice();
                continue;
            }

            if (obj._type !== 'object' ||
                key !== 'children') {

                obj._inner[key] = obj._inner[key].concat(sources);
                continue;
            }

            // Special handling for object children

            const keys = {};
            for (let i = 0; i < targets.length; ++i) {
                keys[targets[i].key] = i;
            }

            for (const source of sources) {
                const sourceKey = source.key;
                if (keys[sourceKey] >= 0) {
                    targets[keys[sourceKey]] = {
                        key: sourceKey,
                        schema: targets[keys[sourceKey]].schema.concat(source.schema)
                    };
                }
                else {
                    targets.push(source);
                }
            }
        }

        return obj;
    }

    createError(type, context, state, options, flags = this._flags) {

        return Errors.create(type, context, state, options, flags);
    }

    createOverrideError(type, context, state, options, message, template) {

        return Errors.create(type, context, state, options, this._flags, message, template);
    }

    default(value, description) {

        return this._default('default', value, description);
    }

    description(desc) {

        Hoek.assert(desc && typeof desc === 'string', 'Description must be a non-empty string');

        const obj = this.clone();
        obj._description = desc;
        return obj;
    }

    empty(schema) {

        const obj = this.clone();
        if (schema === undefined) {
            delete obj._flags.empty;
        }
        else {
            obj._flags.empty = Cast.schema(this._currentJoi, schema);
        }

        return obj;
    }

    error(err, options = { self: false }) {

        Hoek.assert(err && (err instanceof Error || typeof err === 'function'), 'Must provide a valid Error object or a function');

        const unknownKeys = Object.keys(options).filter((k) => !['self'].includes(k));
        Hoek.assert(unknownKeys.length === 0, `Options ${unknownKeys} are unknown`);

        const obj = this.clone();
        obj._flags.error = err;

        if (options.self) {
            obj._flags.selfError = true;
        }

        return obj;
    }

    example(...examples) {

        Hoek.assert(examples.length > 0, 'Missing examples');

        const processed = [];
        for (let i = 0; i < examples.length; ++i) {
            const example = [].concat(examples[i]);
            Hoek.assert(example.length <= 2, `Bad example format at index ${i}`);

            const value = example[0];
            let options = example[1];
            if (options !== undefined) {
                Hoek.assert(options && typeof options === 'object', `Options for example at index ${i} must be an object`);
                const unknownOptions = Object.keys(options).filter((option) => !['parent', 'context'].includes(option));
                Hoek.assert(unknownOptions.length === 0, `Unknown example options ${unknownOptions} at index ${i}`);
            }
            else {
                options = {};
            }

            const localState = new State('', [], [options.parent || null]);
            const result = this._validate(value, localState, Settings.concat(Settings.defaults, options.context ? { context: options.context } : null));
            Hoek.assert(!result.errors, `Bad example at index ${i}:`, result.errors && Errors.process(result.errors, value));

            const ex = { value };
            if (Object.keys(options).length) {
                ex.options = options;
            }

            processed.push(ex);
        }

        const obj = this.clone();
        obj._examples = processed;
        return obj;
    }

    failover(value, description) {

        return this._default('failover', value, description);
    }

    forbidden() {

        if (this._flags.presence === 'forbidden') {
            return this;
        }

        const obj = this.clone();
        obj._flags.presence = 'forbidden';
        return obj;
    }

    invalid(...values) {

        Utils.verifyFlat(values, 'invalid');

        const obj = this.clone();
        for (const value of values) {
            Hoek.assert(value !== undefined, 'Cannot call allow/valid/invalid with undefined');
            obj._valids.remove(value);
            obj._invalids.add(value, obj._refs);
        }

        return obj;
    }

    label(name) {

        Hoek.assert(name && typeof name === 'string', 'Label name must be a non-empty string');

        const obj = this.clone();
        obj._flags.label = name;
        return obj;
    }

    meta(meta) {

        Hoek.assert(meta !== undefined, 'Meta cannot be undefined');

        const obj = this.clone();
        obj._meta = obj._meta.concat(meta);
        return obj;
    }

    notes(notes) {

        Hoek.assert(notes && (typeof notes === 'string' || Array.isArray(notes)), 'Notes must be a non-empty string or array');

        const obj = this.clone();
        obj._notes = obj._notes.concat(notes);
        return obj;
    }

    optional() {

        if (this._flags.presence === 'optional') {
            return this;
        }

        const obj = this.clone();
        obj._flags.presence = 'optional';
        return obj;
    }

    options(options) {

        Hoek.assert(!options.context, 'Cannot override context');
        this.checkOptions(options);

        const obj = this.clone();
        obj._settings = Settings.concat(obj._settings, options);
        return obj;
    }

    raw(isRaw) {

        const value = isRaw === undefined ? true : isRaw;

        if (this._flags.raw === value) {
            return this;
        }

        const obj = this.clone();
        obj._flags.raw = value;
        return obj;
    }

    required() {

        if (this._flags.presence === 'required') {
            return this;
        }

        const obj = this.clone();
        obj._flags.presence = 'required';
        return obj;
    }

    strict(isStrict) {

        const obj = this.clone();

        const convert = isStrict === undefined ? false : !isStrict;
        obj._settings = Settings.concat(obj._settings, { convert });
        return obj;
    }

    strip() {

        if (this._flags.strip) {
            return this;
        }

        const obj = this.clone();
        obj._flags.strip = true;
        return obj;
    }

    tags(tags) {

        Hoek.assert(tags && (typeof tags === 'string' || Array.isArray(tags)), 'Tags must be a non-empty string or array');

        const obj = this.clone();
        obj._tags = obj._tags.concat(tags);
        return obj;
    }

    unit(name) {

        Hoek.assert(name && typeof name === 'string', 'Unit name must be a non-empty string');

        const obj = this.clone();
        obj._unit = name;
        return obj;
    }

    valid(...values) {

        const obj = this.allow(...values);
        obj._flags.allowOnly = true;
        return obj;
    }

    when(condition, options) {

        Hoek.assert(options && typeof options === 'object', 'Invalid options');
        Hoek.assert(options.then !== undefined || options.otherwise !== undefined, 'options must have at least one of "then" or "otherwise"');

        const then = options.hasOwnProperty('then') ? this.concat(Cast.schema(this._currentJoi, options.then)) : undefined;
        const otherwise = options.hasOwnProperty('otherwise') ? this.concat(Cast.schema(this._currentJoi, options.otherwise)) : undefined;

        Alternatives = Alternatives || require('./alternatives');

        const alternativeOptions = { then, otherwise };
        if (Object.prototype.hasOwnProperty.call(options, 'is')) {
            alternativeOptions.is = options.is;
        }

        const obj = Alternatives.when(condition, alternativeOptions);
        obj._flags.presence = 'ignore';
        obj._baseType = this;

        return obj;
    }

    // Helpers

    applyFunctionToChildren(children, fn, args = [], root) {

        children = [].concat(children);

        if (children.length !== 1 || children[0] !== '') {
            root = root ? (root + '.') : '';

            const extraChildren = (children[0] === '' ? children.slice(1) : children).map((child) => {

                return root + child;
            });

            throw new Error('unknown key(s) ' + extraChildren.join(', '));
        }

        return this[fn](...args);
    }

    checkOptions(options) {

        Schemas = Schemas || require('../schemas');

        const result = Schemas.options.validate(options);

        if (result.error) {
            throw new Error(result.error.details[0].message);
        }
    }

    clone() {

        const obj = Object.create(Object.getPrototypeOf(this));

        obj[Settings.symbols.any] = true;

        obj._currentJoi = this._currentJoi;
        obj._type = this._type;
        obj._settings = this._settings;
        obj._baseType = this._baseType;
        obj._valids = this._valids.slice();
        obj._invalids = this._invalids.slice();
        obj._tests = this._tests.slice();
        obj._uniqueRules = Hoek.clone(this._uniqueRules, { shallow: true });
        obj._refs = this._refs.clone();
        obj._flags = Hoek.clone(this._flags);

        obj._description = this._description;
        obj._unit = this._unit;
        obj._notes = this._notes.slice();
        obj._tags = this._tags.slice();
        obj._examples = this._examples.slice();
        obj._meta = this._meta.slice();

        obj._inner = {};
        for (const key in this._inner) {
            obj._inner[key] = this._inner[key] ? this._inner[key].slice() : null;
        }

        return obj;
    }

    validate(value, options, callback) {

        if (typeof options === 'function') {
            return Validator.validateWithOptions(value, this, null, options);
        }

        return Validator.validateWithOptions(value, this, options, callback);
    }

    // Internals

    _default(flag, value, description) {

        if (typeof value === 'function') {
            if (!value.description &&
                description) {

                value.description = description;
            }

            if (!this._flags.func) {
                Hoek.assert(value.description && typeof value.description === 'string', `description must be provided when ${flag} value is a function`);
            }
        }

        if (value === undefined) {
            value = Settings.symbols.deepDefault;
        }

        const obj = this.clone();
        obj._flags[flag] = value;
        obj._refs.register(value);
        return obj;
    }

    _getLabel(def) {

        return this._flags.label || def;
    }

    _init() {

        return this;
    }

    _rule(name, options = {}) {

        const obj = this.clone();

        const rule = {
            rule: name,
            alias: name,
            resolve: [],
            ...options      // args, refs, multi, convert, ...rule-specific
        };

        if (options.refs) {
            for (const key in options.args) {
                const resolver = options.refs[key];
                if (resolver) {
                    let arg = options.args[key];
                    if (Ref.isRef(arg)) {
                        rule.resolve.push(key);
                        obj._refs.register(arg);
                    }
                    else {
                        if (resolver.normalize) {
                            arg = resolver.normalize(arg);
                            options.args[key] = arg;
                        }

                        Hoek.assert(resolver.assert(arg), resolver.message);
                    }
                }
            }
        }

        if (!options.multi) {
            obj._uniqueRules.set(name, rule);
            obj._tests = obj._tests.filter((test) => test.name !== name);
        }

        obj._tests.push({ rule, name, arg: options.args });
        return obj;
    }

    _validate(value, state, options, reference) {

        return Validator.validate(value, this, state, options, reference);
    }

    _test(name, arg, func, options) {

        const obj = this.clone();
        obj._tests.push({ func, name, arg, options });
        return obj;
    }
};


internals.Any.prototype.isImmutable = true;     // Prevents Hoek from deep cloning schema objects


// Aliases

internals.Any.prototype.disallow = internals.Any.prototype.invalid;
internals.Any.prototype.equal = internals.Any.prototype.valid;
internals.Any.prototype.exist = internals.Any.prototype.required;
internals.Any.prototype.not = internals.Any.prototype.invalid;
internals.Any.prototype.only = internals.Any.prototype.valid;
