'use strict';

const Hoek = require('@hapi/hoek');

const Cache = require('./cache');
const Cast = require('./cast');
const Common = require('./common');
const Errors = require('./errors');
const Extend = require('./extend');
const Manifest = require('./manifest');
const Messages = require('./messages');
const Modify = require('./modify');
const Ref = require('./ref');
const Validator = require('./validator');
const Values = require('./values');


const internals = {};


internals.Base = class {

    constructor(type) {

        this._type = type;
        this._definition = {};
        this._ids = new Modify.Ids();
        this._preferences = null;
        this._refs = new Ref.Manager();
        this._cache = null;

        this._valids = null;
        this._invalids = null;

        this._rules = [];
        this._singleRules = new Map();              // The rule options passed for non-multi rules
        this._ruleset = null;                       // null: use last, false: error, number: start position
        this._flags = {};

        this._inners = {                            // Hash of arrays of immutable objects (extended by other types)
            alterations: null,
            examples: null,
            externals: null,
            metas: [],
            notes: [],
            tags: []
        };
    }

    // Manifest

    get type() {

        return this._type;
    }

    describe() {

        return Manifest.describe(this);
    }

    // Rules

    allow(...values) {

        Common.verifyFlat(values, 'allow');

        const obj = this.clone();

        if (!obj._valids) {
            obj._valids = new Values();
        }

        for (const value of values) {
            Hoek.assert(value !== undefined, 'Cannot call allow/valid/invalid with undefined');

            if (obj._invalids) {
                obj._invalids.remove(value);
                if (!obj._invalids.length) {
                    obj._invalids = null;
                }
            }

            obj._valids.add(value, obj._refs);
        }

        return obj;
    }

    alter(targets) {

        Hoek.assert(targets && typeof targets === 'object' && !Array.isArray(targets), 'Invalid targets argument');
        Hoek.assert(!this._inRuleset(), 'Cannot set alterations inside a ruleset');

        const obj = this.clone();
        obj._inners.alterations = obj._inners.alterations || [];
        for (const target in targets) {
            const adjuster = targets[target];
            Hoek.assert(typeof adjuster === 'function', 'Alteration adjuster for', target, 'must be a function');
            obj._inners.alterations.push({ target, adjuster });
        }

        obj._ruleset = false;
        return obj;
    }

    cast(to) {

        Hoek.assert(to === false || this._definition.cast[to], 'Type', this._type, 'does not support casting to', to);

        return this.setFlag('cast', to === false ? undefined : to);
    }

    default(value, options) {

        return this._default('default', value, options);
    }

    description(desc) {

        Hoek.assert(desc && typeof desc === 'string', 'Description must be a non-empty string');

        return this.setFlag('description', desc);
    }

    empty(schema) {

        const obj = this.clone();

        if (schema !== undefined) {
            schema = obj._cast(schema);
            obj._refs.register(schema);
        }

        return obj.setFlag('empty', schema, { clone: false });
    }

    error(err) {

        Hoek.assert(err, 'Missing error');
        Hoek.assert(err instanceof Error || typeof err === 'function', 'Must provide a valid Error object or a function');

        return this.setFlag('error', err);
    }

    example(example, options = {}) {

        Hoek.assert(example !== undefined, 'Missing example');
        Common.assertOptions(options, ['override']);

        return this._inner('examples', example, { single: true, override: options.override });
    }

    external(method) {

        Hoek.assert(typeof method === 'function', 'Method must be a function');

        return this._inner('externals', method, { single: true });
    }

    failover(value, options) {

        return this._default('failover', value, options);
    }

    forbidden() {

        return this.presence('forbidden');
    }

    id(id) {

        Hoek.assert(id && typeof id === 'string', 'id must be a non-empty string');
        Hoek.assert(/^[^\.]+$/.test(id), 'id cannot contain period character');
        Hoek.assert(!this._flags.id, 'Cannot override schema id');

        return this.setFlag('id', id);
    }

    invalid(...values) {

        Common.verifyFlat(values, 'invalid');

        const obj = this.clone();

        if (!obj._invalids) {
            obj._invalids = new Values();
        }

        for (const value of values) {
            Hoek.assert(value !== undefined, 'Cannot call allow/valid/invalid with undefined');

            if (obj._valids) {
                obj._valids.remove(value);
                if (!obj._valids.length) {
                    Hoek.assert(!obj._flags.only, 'Setting invalid value', value, 'leaves schema rejecting all values due to previous valid rule');
                    obj._valids = null;
                }
            }

            obj._invalids.add(value, obj._refs);
        }

        return obj;
    }

    keep() {

        return this.rule({ keep: true });
    }

    label(name) {

        Hoek.assert(name && typeof name === 'string', 'Label name must be a non-empty string');

        return this.setFlag('label', name);
    }

    meta(meta) {

        Hoek.assert(meta !== undefined, 'Meta cannot be undefined');

        return this._inner('metas', meta, { single: true });
    }

    note(...notes) {

        Hoek.assert(notes.length, 'Missing notes');
        for (const note of notes) {
            Hoek.assert(note && typeof note === 'string', 'Notes must be non-empty strings');
        }

        return this._inner('notes', notes);
    }

    only(mode = true) {

        Hoek.assert(typeof mode === 'boolean', 'Invalid mode:', mode);

        return this.setFlag('only', mode);
    }

    optional() {

        return this.presence('optional');
    }

    prefs(prefs) {

        Hoek.assert(prefs.context === undefined, 'Cannot override context');
        Hoek.assert(prefs.externals === undefined, 'Cannot override externals');
        Hoek.assert(prefs.warnings === undefined, 'Cannot override warnings');

        Common.checkPreferences(prefs);

        const obj = this.clone();
        obj._preferences = Common.preferences(obj._preferences, prefs);
        return obj;
    }

    presence(mode) {

        Hoek.assert(['optional', 'required', 'forbidden'].includes(mode), 'Unknown presence mode', mode);

        return this.setFlag('presence', mode);
    }

    raw(enabled = true) {

        return this.setFlag('result', enabled ? 'raw' : undefined);
    }

    result(mode) {

        Hoek.assert(['raw', 'strip'].includes(mode), 'Unknown result mode', mode);

        return this.setFlag('result', mode);
    }

    required() {

        return this.presence('required');
    }

    strict(enabled) {

        const obj = this.clone();

        const convert = enabled === undefined ? false : !enabled;
        obj._preferences = Common.preferences(obj._preferences, { convert });
        return obj;
    }

    strip(enabled = true) {

        return this.setFlag('result', enabled ? 'strip' : undefined);
    }

    tag(...tags) {

        Hoek.assert(tags.length, 'Missing tags');
        for (const tag of tags) {
            Hoek.assert(tag && typeof tag === 'string', 'Tags must be non-empty strings');
        }

        return this._inner('tags', tags);
    }

    unit(name) {

        Hoek.assert(name && typeof name === 'string', 'Unit name must be a non-empty string');

        return this.setFlag('unit', name);
    }

    valid(...values) {

        return this.allow(...values).setFlag('only', true, { clone: false });
    }

    when(condition, options) {

        if (Array.isArray(options)) {
            options = { switch: options };
        }

        Common.assertOptions(options, ['is', 'then', 'otherwise', 'switch']);
        Hoek.assert(options.then || options.otherwise || options.switch, 'At least one of then, otherwise, or switch is required');

        const process = (settings) => {

            const item = {
                is: settings.is,
                then: settings.then && this.concat(this._cast(settings.then))
            };

            if (settings.otherwise) {
                item.otherwise = this.concat(this._cast(settings.otherwise));
            }

            return item;
        };

        const alt = process(options);

        if (options.switch) {
            Hoek.assert(Array.isArray(options.switch), '"switch" must be an array');
            alt.switch = options.switch.map(process);

            const last = alt.switch[alt.switch.length - 1];
            if (!alt.otherwise &&
                !last.otherwise) {

                last.otherwise = this;
            }
        }
        else {
            if (!alt.then) {
                alt.then = this;
            }
            else if (!alt.otherwise) {
                alt.otherwise = this;
            }
        }

        return this._root.alternatives().when(condition, alt);
    }

    // Helpers

    cache(cache) {

        Hoek.assert(!this._inRuleset(), 'Cannot set caching inside a ruleset');
        Hoek.assert(!this._cache, 'Cannot override schema cache');

        const obj = this.clone();
        obj._cache = cache || Cache.provider.provision();
        obj._ruleset = false;
        return obj;
    }

    clone() {

        const obj = Object.create(Object.getPrototypeOf(this));
        return this._assign(obj);
    }

    concat(source) {

        Hoek.assert(Common.isSchema(source), 'Invalid schema object');
        Hoek.assert(this._type === 'any' || source._type === 'any' || source._type === this._type, 'Cannot merge type', this._type, 'with another type:', source._type);

        let obj = this.clone();

        if (this._type === 'any' &&
            source._type !== 'any') {

            // Change obj to match source type

            const tmpObj = source.clone();
            for (const key of Object.keys(obj)) {
                if (key !== '_type') {
                    tmpObj[key] = obj[key];
                }
            }

            obj = tmpObj;
        }

        obj._ids.concat(source._ids);
        obj._preferences = obj._preferences ? Common.preferences(obj._preferences, source._preferences) : source._preferences;
        obj._valids = Values.merge(obj._valids, source._valids, source._invalids);
        obj._invalids = Values.merge(obj._invalids, source._invalids, source._valids);
        obj._refs.register(source, Ref.toSibling);

        // Remove unique rules present in source

        for (const name of source._singleRules.keys()) {
            if (obj._singleRules.has(name)) {
                obj._rules = obj._rules.filter((target) => target.name !== name);
                obj._singleRules.delete(name);
            }
        }

        // Adjust ruleset

        if (source._ruleset !== null) {
            Hoek.assert(!obj._inRuleset(), 'Cannot concatenate onto a schema with open ruleset');
            obj._ruleset = source._ruleset === false ? false : source._ruleset + obj._rules.length;
        }

        // Rules

        for (const test of source._rules) {
            if (!source._definition.rules[test.method].multi) {
                obj._singleRules.set(test.name, test.options);
            }

            obj._rules.push(test);
        }

        // Flags

        if (obj._flags.empty &&
            source._flags.empty) {

            obj._flags.empty = obj._flags.empty.concat(source._flags.empty);
            const flags = Object.assign({}, source._flags);
            delete flags.empty;
            Hoek.merge(obj._flags, flags);
        }
        else if (source._flags.empty) {
            obj._flags.empty = source._flags.empty;
            const flags = Object.assign({}, source._flags);
            delete flags.empty;
            Hoek.merge(obj._flags, flags);
        }
        else {
            Hoek.merge(obj._flags, source._flags);
        }

        // Inners

        for (const key in source._inners) {
            const inners = source._inners[key];
            if (!inners) {
                if (!obj._inners[key]) {
                    obj._inners[key] = inners;
                }

                continue;
            }

            if (!obj._inners[key]) {
                obj._inners[key] = inners.slice();
                continue;
            }

            obj._inners[key] = obj._inners[key].concat(inners);
        }

        return obj.rebuild();
    }

    createError(code, value, local, state, prefs, options = {}) {

        const flags = options.flags !== false ? this._flags : {};
        return new Errors.Report(code, value, local, flags, this._definition.messages, state, prefs);
    }

    extract(path) {

        path = Array.isArray(path) ? path : path.split('.');
        return this._ids.reach(path);
    }

    fork(paths, adjuster) {

        Hoek.assert(!this._inRuleset(), 'Cannot fork inside a ruleset');

        let obj = this;                                             // eslint-disable-line consistent-this
        for (let path of [].concat(paths)) {
            path = Array.isArray(path) ? path : path.split('.');
            obj = obj._ids.fork(path, adjuster, obj);
        }

        obj._ruleset = false;
        return obj;
    }

    mapLabels(path) {

        path = Array.isArray(path) ? path : path.split('.');
        return this._ids.labels(path);
    }

    message(message) {

        return this.rule({ message });
    }

    rule(options) {

        Common.assertOptions(options, ['keep', 'message', 'warn']);

        Hoek.assert(this._ruleset !== false, 'Cannot apply rules to empty ruleset');
        const start = this._ruleset === null ? this._rules.length - 1 : this._ruleset;
        Hoek.assert(start >= 0 && start < this._rules.length, 'Cannot apply rules to empty ruleset');

        options = Object.assign({}, options);                   // Shallow cloned

        if (options.message) {
            options.message = Messages.compile(options.message);
        }

        const obj = this.clone();

        for (let i = start; i < obj._rules.length; ++i) {
            obj._rules[i] = Object.assign({}, obj._rules[i], options);
        }

        obj._ruleset = false;
        return obj;
    }

    get ruleset() {

        Hoek.assert(!this._inRuleset(), 'Cannot start a new ruleset without closing the previous one');

        const obj = this.clone();
        obj._ruleset = obj._rules.length;
        return obj;
    }

    get $() {

        return this.ruleset;
    }

    tailor(targets) {

        Hoek.assert(!this._inRuleset(), 'Cannot tailor inside a ruleset');

        if (!this._inners.alterations) {
            return this;
        }

        targets = [].concat(targets);

        let obj = this;                                                     // eslint-disable-line consistent-this
        for (const { target, adjuster } of this._inners.alterations) {
            if (targets.includes(target)) {
                obj = adjuster(obj);
                Hoek.assert(Common.isSchema(obj), 'Alteration adjuster for', target, 'failed to return a schema object');
            }
        }

        obj._ruleset = false;
        return obj;
    }

    validate(value, options) {

        return Validator.entry(value, this, options);
    }

    validateAsync(value, options) {

        return Validator.entryAsync(value, this, options);
    }

    warn() {

        return this.rule({ warn: true });
    }

    // Extensions

    extend(options) {

        return Extend.type(this, options);
    }

    setFlag(name, value, options = {}) {

        Hoek.assert(!this._inRuleset(), 'Cannot set flag inside a ruleset');

        if (Hoek.deepEqual(value, this._flags[name])) {
            return this;
        }

        const obj = options.clone !== false ? this.clone() : this;

        if (value !== undefined) {
            obj._flags[name] = value;
        }
        else {
            delete obj._flags[name];
        }

        obj._ruleset = false;
        return obj;
    }

    getFlag(name) {

        return this._flags[name];
    }

    addRule(options) {

        // Normalize rule

        if (typeof options === 'string') {
            options = { name: options };
        }

        Hoek.assert(options && typeof options === 'object', 'Invalid options');
        Hoek.assert(options.name && typeof options.name === 'string', 'Invalid rule name');

        const rule = {
            name: options.name,
            method: options.method || options.name,
            args: options.args,
            resolve: [],
            warn: options.warn,
            options
        };

        const definition = this._definition.rules[rule.method];

        Hoek.assert(definition, 'Unknown rule', rule.method);
        Hoek.assert(!rule.args || Object.keys(rule.args).length === 1 || Object.keys(rule.args).length === this._definition.rules[rule.name].args.length, 'Invalid rule definition for', this._type, rule.name);

        // Check for unique changes

        if (!definition.multi &&
            this._singleRules.has(rule.name) &&
            Hoek.deepEqual(rule.options, this._singleRules.get(rule.name))) {

            return this;
        }

        // Args

        const obj = this.clone();

        const args = rule.args;
        if (args) {
            for (const key in args) {
                let arg = args[key];
                if (arg === undefined) {
                    delete args[key];
                    continue;
                }

                if (definition.argsByName) {
                    const resolver = definition.argsByName.get(key);
                    if (resolver.ref) {
                        if (Common.isResolvable(arg)) {
                            rule.resolve.push(key);
                            obj._refs.register(arg);
                        }
                        else {
                            if (resolver.normalize) {
                                arg = resolver.normalize(arg);
                                rule.args[key] = arg;
                            }

                            Hoek.assert(resolver.assert(arg), key, resolver.message, 'or reference');
                        }
                    }
                }

                args[key] = arg;
            }
        }

        // Unique rules

        if (!definition.multi) {
            obj._ruleRemove(rule.name, { clone: false });
            obj._singleRules.set(rule.name, rule.options);
        }

        if (obj._ruleset === false) {
            obj._ruleset = null;
        }

        if (definition.priority) {
            obj._rules.unshift(rule);
        }
        else {
            obj._rules.push(rule);
        }

        return obj;
    }

    getRule(name) {

        return this._singleRules.get(name);
    }

    getRules(name) {

        const rules = [];
        for (const test of this._rules) {
            if (test.name === name) {
                rules.push(test.options);
            }
        }

        return rules;
    }

    rebuild() {

        if (!this._definition.rebuild) {
            return this;
        }

        Hoek.assert(!this._inRuleset(), 'Cannot add this rule inside a ruleset');

        this._resetRegistrations();
        this._definition.rebuild(this);
        this._ruleset = false;
        return this;
    }

    // Internals

    _assign(target) {

        target._root = this._root;
        target._type = this._type;
        target._ids = this._ids.clone();
        target._preferences = this._preferences;
        target._valids = this._valids && this._valids.clone();
        target._invalids = this._invalids && this._invalids.clone();
        target._rules = this._rules.slice();
        target._singleRules = Hoek.clone(this._singleRules, { shallow: true });
        target._ruleset = this._ruleset;
        target._refs = this._refs.clone();
        target._flags = Hoek.clone(this._flags);
        target._cache = null;

        target._inners = {};
        for (const key in this._inners) {
            target._inners[key] = this._inners[key] ? this._inners[key].slice() : null;
        }

        return target;
    }

    _cast(schema, options) {

        return Cast.schema(this._root, schema, options);
    }

    _default(flag, value, options = {}) {

        Common.assertOptions(options, 'literal');

        Hoek.assert(value !== undefined, 'Missing', flag, 'value');
        Hoek.assert(typeof value === 'function' || !options.literal, 'Only function value supports literal option');

        if (typeof value === 'function' &&
            options.literal) {

            value = {
                [Common.symbols.literal]: true,
                literal: value
            };
        }

        const obj = this.setFlag(flag, value);
        obj._refs.register(value);
        return obj;
    }

    _inner(type, values, options = {}) {

        Hoek.assert(!this._inRuleset(), `Cannot set ${type} inside a ruleset`);

        const obj = this.clone();
        if (!obj._inners[type] ||
            options.override) {

            obj._inners[type] = [];
        }

        if (options.single) {
            obj._inners[type].push(values);
        }
        else {
            obj._inners[type].push(...values);
        }

        obj._ruleset = false;
        return obj;
    }

    _inRuleset() {

        return this._ruleset !== null && this._ruleset !== false;
    }

    _match(value, state, prefs) {

        prefs = Object.assign({}, prefs);       // Shallow cloned
        prefs.abortEarly = true;
        prefs._externals = false;

        return !Validator.validate(value, this, state, prefs).errors;
    }

    _register(schema, { family, key } = {}) {

        this._refs.register(schema, family);
        this._ids.register(schema, key);
    }

    _resetRegistrations() {

        this._refs.reset();
        this._ids.reset();
    }

    _ruleRemove(name, options = {}) {

        if (!this._singleRules.has(name)) {
            return this;
        }

        const obj = options.clone !== false ? this.clone() : this;

        obj._singleRules.delete(name);

        const filtered = [];
        for (let i = 0; i < obj._rules.length; ++i) {
            const test = obj._rules[i];
            if (test.name === name &&
                !test.keep) {

                if (obj._inRuleset() &&
                    i < obj._ruleset) {

                    --obj._ruleset;
                }

                continue;
            }

            filtered.push(test);
        }

        obj._rules = filtered;
        return obj;
    }

    _validate(value, state, prefs) {

        return Validator.validate(value, this, state, prefs);
    }
};


internals.Base.prototype.isImmutable = true;                        // Prevents Hoek from deep cloning schema objects


internals.Base.prototype[Common.symbols.any] = {
    version: Common.version,
    compile: Cast.compile,
    root: '_root'
};


// Aliases

internals.Base.prototype.disallow = internals.Base.prototype.invalids;
internals.Base.prototype.equal = internals.Base.prototype.valid;
internals.Base.prototype.exist = internals.Base.prototype.required;
internals.Base.prototype.not = internals.Base.prototype.invalid;
internals.Base.prototype.options = internals.Base.prototype.prefs;
internals.Base.prototype.preferences = internals.Base.prototype.prefs;


module.exports = new internals.Base();
