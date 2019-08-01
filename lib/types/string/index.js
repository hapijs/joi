'use strict';

const Address = require('@hapi/address');
const Hoek = require('@hapi/hoek');

const Any = require('../any');
const Common = require('../../common');

const Ip = require('./ip');
const Uri = require('./uri');


const internals = {
    base64Regex: {
        // paddingRequired
        true: {
            // urlSafe
            true: /^(?:[\w\-]{2}[\w\-]{2})*(?:[\w\-]{2}==|[\w\-]{3}=)?$/,
            false: /^(?:[A-Za-z0-9+\/]{2}[A-Za-z0-9+\/]{2})*(?:[A-Za-z0-9+\/]{2}==|[A-Za-z0-9+\/]{3}=)?$/
        },
        false: {
            true: /^(?:[\w\-]{2}[\w\-]{2})*(?:[\w\-]{2}(==)?|[\w\-]{3}=?)?$/,
            false: /^(?:[A-Za-z0-9+\/]{2}[A-Za-z0-9+\/]{2})*(?:[A-Za-z0-9+\/]{2}(==)?|[A-Za-z0-9+\/]{3}=?)?$/
        }
    },
    dataUriRegex: {
        format: /^data:[\w+.-]+\/[\w+.-]+;((charset=[\w-]+|base64),)?(.*)$/,
        base64: {
            // paddingRequired
            true: /^(?:[A-Za-z0-9+\/]{4})*(?:[A-Za-z0-9+\/]{2}==|[A-Za-z0-9+\/]{3}=)?$/,
            false: /^(?:[A-Za-z0-9+\/]{4})*(?:[A-Za-z0-9+\/]{2}(==)?|[A-Za-z0-9+\/]{3}=?)?$/
        }
    },
    hexRegex: /^[a-f0-9]+$/i,
    hostRegex: /^(([a-zA-Z0-9]|[a-zA-Z0-9][a-zA-Z0-9\-]*[a-zA-Z0-9])\.)*([A-Za-z0-9]|[A-Za-z0-9][A-Za-z0-9\-]*[A-Za-z0-9])$/,
    ipRegex: Ip.createIpRegex(['ipv4', 'ipv6', 'ipvfuture'], 'optional'),
    isoDurationRegex: /^P(?!$)(\d+Y)?(\d+M)?(\d+W)?(\d+D)?(T(?=\d)(\d+H)?(\d+M)?(\d+S)?)?$/,

    guidBrackets: {
        '{': '}', '[': ']', '(': ')', '': ''
    },
    guidVersions: {
        uuidv1: '1',
        uuidv2: '2',
        uuidv3: '3',
        uuidv4: '4',
        uuidv5: '5'
    },

    cidrPresences: ['required', 'optional', 'forbidden'],
    normalizationForms: ['NFC', 'NFD', 'NFKC', 'NFKD']
};


internals.String = Any.extend({

    type: 'string',

    // Initialize

    initialize: function () {

        this._inners.replacements = null;
    },

    // Coerce

    coerce: {
        from: 'string',
        method: function (value, state, prefs) {

            const normalize = this._uniqueRules.get('normalize');
            if (normalize) {
                value = value.normalize(normalize.args.form);
            }

            const casing = this._uniqueRules.get('case');
            if (casing) {
                value = casing.args.direction === 'upper' ? value.toLocaleUpperCase() : value.toLocaleLowerCase();
            }

            const trim = this._uniqueRules.get('trim');
            if (trim &&
                trim.args.enabled) {

                value = value.trim();
            }

            if (this._inners.replacements) {
                for (const replacement of this._inners.replacements) {
                    value = value.replace(replacement.pattern, replacement.replacement);
                }
            }

            const hex = this._uniqueRules.get('hex');
            if (hex &&
                hex.args.options.byteAligned &&
                value.length % 2 !== 0) {

                value = `0${value}`;
            }

            if (this._uniqueRules.has('isoDate')) {
                let valid = false;
                if (Common.isIsoDate(value)) {
                    const date = new Date(value);
                    if (!isNaN(date.getTime())) {
                        value = date.toISOString();
                        valid = true;
                    }
                }

                if (!valid) {
                    return { value, errors: this.createError('string.isoDate', value, null, state, prefs) };
                }
            }

            if (this._flags.truncate) {
                const rule = this._uniqueRules.get('max');
                if (rule) {
                    let limit = rule.args.limit;
                    if (Common.isResolvable(limit)) {
                        limit = limit.resolve(value, state, prefs);
                        if (!Common.limit(limit)) {
                            return { value, errors: this.createError('number.ref', limit, { ref: rule.args.limit }, state, prefs) };
                        }
                    }

                    value = value.slice(0, limit);
                }
            }

            return { value };
        }
    },

    // Base validation

    validate: function (value, state, prefs) {

        if (typeof value !== 'string') {
            return { value, errors: this.createError('string.base', value, null, state, prefs) };
        }

        if (value === '') {
            return { value, errors: this.createError('string.empty', value, null, state, prefs) };
        }
    },

    // Rules

    rules: {

        alphanum: {
            method: function () {

                return this._rule('alphanum');
            },
            validate: function (value, helpers) {

                if (/^[a-zA-Z0-9]+$/.test(value)) {
                    return value;
                }

                return helpers.error('string.alphanum');
            }
        },

        base64: {
            method: function (options = {}) {

                Common.assertOptions(options, ['paddingRequired', 'urlSafe']);

                options = { urlSafe: false, paddingRequired: true, ...options };
                Hoek.assert(typeof options.paddingRequired === 'boolean', 'paddingRequired must be boolean');
                Hoek.assert(typeof options.urlSafe === 'boolean', 'urlSafe must be boolean');

                return this._rule({ name: 'base64', args: { options } });
            },
            validate: function (value, helpers, { options }) {

                const regex = internals.base64Regex[options.paddingRequired][options.urlSafe];
                if (regex.test(value)) {
                    return value;
                }

                return helpers.error('string.base64');
            }
        },

        case: {
            method: function (direction) {

                Hoek.assert(['lower', 'upper'].includes(direction), 'Invalid case:', direction);

                return this._rule({ name: 'case', args: { direction } });
            },
            validate: function (value, helpers, { direction }) {

                if (direction === 'lower' && value === value.toLocaleLowerCase() ||
                    direction === 'upper' && value === value.toLocaleUpperCase()) {

                    return value;
                }

                return helpers.error(`string.${direction}case`);
            },
            convert: true
        },

        creditCard: {
            method: function () {

                return this._rule('creditCard');
            },
            validate: function (value, helpers) {

                let i = value.length;
                let sum = 0;
                let mul = 1;

                while (i--) {
                    const char = value.charAt(i) * mul;
                    sum = sum + (char - (char > 9) * 9);
                    mul = mul ^ 3;
                }

                if (sum > 0 &&
                    sum % 10 === 0) {

                    return value;
                }

                return helpers.error('string.creditCard');
            }
        },

        dataUri: {
            method: function (options = {}) {

                Common.assertOptions(options, ['paddingRequired']);

                options = { paddingRequired: true, ...options };
                Hoek.assert(typeof options.paddingRequired === 'boolean', 'paddingRequired must be boolean');

                return this._rule({ name: 'dataUri', args: { options } });
            },
            validate: function (value, helpers, { options }) {

                const matches = value.match(internals.dataUriRegex.format);

                if (matches) {
                    if (!matches[2]) {
                        return value;
                    }

                    if (matches[2] !== 'base64') {
                        return value;
                    }

                    const base64regex = internals.dataUriRegex.base64[options.paddingRequired];
                    if (base64regex.test(matches[3])) {
                        return value;
                    }
                }

                return helpers.error('string.dataUri');
            }
        },

        domain: {
            method: function (options) {

                if (options) {
                    Common.assertOptions(options, ['allowUnicode', 'minDomainSegments', 'tlds']);
                    options = internals.addressOptions(options);
                }

                return this._rule({ name: 'domain', args: { options } });
            },
            validate: function (value, helpers, { options }) {

                if (Address.domain.isValid(value, options)) {
                    return value;
                }

                return helpers.error('string.domain');
            }
        },

        email: {
            method: function (options = {}) {

                Common.assertOptions(options, ['allowUnicode', 'minDomainSegments', 'multiple', 'separator', 'tlds']);
                Hoek.assert(options.multiple === undefined || typeof options.multiple === 'boolean', 'multiple option must be an boolean');

                options = internals.addressOptions(options);
                const regex = new RegExp(`\\s*[${options.separator ? Hoek.escapeRegex(options.separator) : ','}]\\s*`);

                return this._rule({ name: 'email', args: { options }, regex });
            },
            validate: function (value, helpers, { options }, { regex }) {

                const emails = options.multiple ? value.split(regex) : [value];
                const invalids = [];
                for (const email of emails) {
                    if (!Address.email.isValid(email, options)) {
                        invalids.push(email);
                    }
                }

                if (!invalids.length) {
                    return value;
                }

                return helpers.error('string.email', { value, invalids });
            }
        },

        guid: {
            alias: 'uuid',
            method: function (options = {}) {

                Common.assertOptions(options, ['version']);

                let versionNumbers = '';

                if (options.version) {
                    const versions = [].concat(options.version);

                    Hoek.assert(versions.length >= 1, 'version must have at least 1 valid version specified');
                    const set = new Set();

                    for (let i = 0; i < versions.length; ++i) {
                        const version = versions[i];
                        Hoek.assert(typeof version === 'string', 'version at position ' + i + ' must be a string');
                        const versionNumber = internals.guidVersions[version.toLowerCase()];
                        Hoek.assert(versionNumber, 'version at position ' + i + ' must be one of ' + Object.keys(internals.guidVersions).join(', '));
                        Hoek.assert(!set.has(versionNumber), 'version at position ' + i + ' must not be a duplicate');

                        versionNumbers += versionNumber;
                        set.add(versionNumber);
                    }
                }

                const regex = new RegExp(`^([\\[{\\(]?)[0-9A-F]{8}([:-]?)[0-9A-F]{4}\\2?[${versionNumbers || '0-9A-F'}][0-9A-F]{3}\\2?[${versionNumbers ? '89AB' : '0-9A-F'}][0-9A-F]{3}\\2?[0-9A-F]{12}([\\]}\\)]?)$`, 'i');

                return this._rule({ name: 'guid', args: { options }, regex });
            },
            validate: function (value, helpers, args, { regex }) {

                const results = regex.exec(value);

                if (!results) {
                    return helpers.error('string.guid');
                }

                // Matching braces

                if (internals.guidBrackets[results[1]] !== results[results.length - 1]) {
                    return helpers.error('string.guid');
                }

                return value;
            }
        },

        hex: {
            method: function (options = {}) {

                Common.assertOptions(options, ['byteAligned']);

                options = { byteAligned: false, ...options };
                Hoek.assert(typeof options.byteAligned === 'boolean', 'byteAligned must be boolean');

                return this._rule({ name: 'hex', args: { options } });
            },
            validate: function (value, helpers, { options }) {

                if (!internals.hexRegex.test(value)) {
                    return helpers.error('string.hex');
                }

                if (options.byteAligned &&
                    value.length % 2 !== 0) {

                    return helpers.error('string.hexAlign');
                }

                return value;
            }
        },

        hostname: {
            method: function () {

                return this._rule('hostname');
            },
            validate: function (value, helpers) {

                if (value.length <= 255 && internals.hostRegex.test(value) ||
                    internals.ipRegex.test(value)) {

                    return value;
                }

                return helpers.error('string.hostname');
            }
        },

        insensitive: {
            method: function () {

                return this._flag('insensitive', true);
            }
        },

        ip: {
            method: function (options = {}) {

                Common.assertOptions(options, ['cidr', 'version']);

                options = Object.assign({}, options);       // Shallow cloned

                let regex = internals.ipRegex;
                if (options.cidr) {
                    Hoek.assert(typeof options.cidr === 'string', 'cidr must be a string');
                    options.cidr = options.cidr.toLowerCase();

                    Hoek.assert(Hoek.contain(internals.cidrPresences, options.cidr), 'cidr must be one of ' + internals.cidrPresences.join(', '));

                    if (!options.version &&
                        options.cidr !== 'optional') {

                        regex = Ip.createIpRegex(['ipv4', 'ipv6', 'ipvfuture'], options.cidr);
                    }
                }
                else {
                    options.cidr = 'optional';
                }

                let versions;
                if (options.version) {
                    if (!Array.isArray(options.version)) {
                        options.version = [options.version];
                    }

                    Hoek.assert(options.version.length >= 1, 'version must have at least 1 version specified');

                    versions = [];
                    for (let i = 0; i < options.version.length; ++i) {
                        let version = options.version[i];
                        Hoek.assert(typeof version === 'string', 'version at position ' + i + ' must be a string');
                        version = version.toLowerCase();
                        Hoek.assert(Ip.versions[version], 'version at position ' + i + ' must be one of ' + Object.keys(Ip.versions).join(', '));
                        versions.push(version);
                    }

                    versions = Array.from(new Set(versions));
                    regex = Ip.createIpRegex(versions, options.cidr);
                }

                return this._rule({ name: 'ip', args: { options }, versions, regex });
            },
            validate: function (value, helpers, { options }, { versions, regex }) {

                if (regex.test(value)) {
                    return value;
                }

                if (versions) {
                    return helpers.error('string.ipVersion', { value, cidr: options.cidr, version: versions });
                }

                return helpers.error('string.ip', { value, cidr: options.cidr });
            }
        },

        isoDate: {
            method: function () {

                return this._rule('isoDate');
            },
            validate: function (value, { error }) {

                if (Common.isIsoDate(value)) {
                    return value;
                }

                return error('string.isoDate');
            },
            convert: true
        },

        isoDuration: {
            method: function () {

                return this._rule('isoDuration');
            },
            validate: function (value, helpers) {

                if (internals.isoDurationRegex.test(value)) {
                    return value;
                }

                return helpers.error('string.isoDuration');
            }
        },

        length: {
            method: function (limit, encoding) {

                return internals.length(this, 'length', limit, '=', encoding);
            },
            validate: function (value, helpers, { limit, encoding }, { name, operator, args }) {

                const length = encoding ? Buffer.byteLength(value, encoding) : value.length;
                if (Common.compare(length, limit, operator)) {
                    return value;
                }

                return helpers.error('string.' + name, { limit: args.limit, value, encoding });
            },
            args: ['limit', 'encoding'],
            refs: {
                limit: {
                    assert: Common.limit,
                    code: 'string.ref',
                    message: 'limit must be a positive integer or reference'
                }
            }
        },

        lowercase: {
            method: function () {

                return this.case('lower');
            }
        },

        max: {
            method: function (limit, encoding) {

                return internals.length(this, 'max', limit, '<=', encoding);
            },
            args: ['limit', 'encoding']
        },

        min: {
            method: function (limit, encoding) {

                return internals.length(this, 'min', limit, '>=', encoding);
            },
            args: ['limit', 'encoding']
        },

        normalize: {
            method: function (form = 'NFC') {

                Hoek.assert(Hoek.contain(internals.normalizationForms, form), 'normalization form must be one of ' + internals.normalizationForms.join(', '));

                return this._rule({ name: 'normalize', args: { form } });
            },
            validate: function (value, { error }, { form }) {

                if (value === value.normalize(form)) {
                    return value;
                }

                return error('string.normalize', { value, form });
            },
            convert: true
        },

        pattern: {
            alias: 'regex',
            method: function (regex, options = {}) {

                Hoek.assert(regex instanceof RegExp, 'regex must be a RegExp');
                Hoek.assert(!regex.flags.includes('g') && !regex.flags.includes('y'), 'regex should not use global or sticky mode');

                if (typeof options === 'string') {
                    options = { name: options };
                }

                Common.assertOptions(options, ['invert', 'name']);

                const errorCode = ['string.pattern', options.invert ? '.invert' : '', options.name ? '.name' : '.base'].join('');
                return this._rule({ name: 'pattern', args: { regex, options }, errorCode });
            },
            validate: function (value, helpers, { regex, options }, { errorCode }) {

                const patternMatch = regex.test(value);

                if (patternMatch ^ options.invert) {
                    return value;
                }

                return helpers.error(errorCode, { name: options.name, regex, value });
            },
            args: ['regex', 'options'],
            multi: true
        },

        replace: {
            method: function (pattern, replacement) {

                if (typeof pattern === 'string') {
                    pattern = new RegExp(Hoek.escapeRegex(pattern), 'g');
                }

                Hoek.assert(pattern instanceof RegExp, 'pattern must be a RegExp');
                Hoek.assert(typeof replacement === 'string', 'replacement must be a String');

                const obj = this.clone();

                if (!obj._inners.replacements) {
                    obj._inners.replacements = [];
                }

                obj._inners.replacements.push({ pattern, replacement });
                return obj;
            }
        },

        token: {
            method: function () {

                return this._rule('token');
            },
            validate: function (value, helpers) {

                if (/^\w+$/.test(value)) {
                    return value;
                }

                return helpers.error('string.token');
            }
        },

        trim: {
            method: function (enabled = true) {

                Hoek.assert(typeof enabled === 'boolean', 'enabled must be a boolean');

                return this._rule({ name: 'trim', args: { enabled } });
            },
            validate: function (value, helpers, { enabled }) {

                if (!enabled ||
                    value === value.trim()) {

                    return value;
                }

                return helpers.error('string.trim');
            },
            convert: true
        },

        truncate: {
            method: function (enabled = true) {

                Hoek.assert(typeof enabled === 'boolean', 'enabled must be a boolean');

                return this._flag('truncate', enabled);
            }
        },

        uppercase: {
            method: function () {

                return this.case('upper');
            }
        },

        uri: {
            method: function (options = {}) {

                Common.assertOptions(options, ['allowRelative', 'allowQuerySquareBrackets', 'domain', 'relativeOnly', 'scheme']);

                const unknownOptions = Object.keys(options).filter((key) => !['scheme', 'allowRelative', 'relativeOnly', 'allowQuerySquareBrackets', 'domain'].includes(key));
                Hoek.assert(unknownOptions.length === 0, `options contain unknown keys: ${unknownOptions}`);

                if (options.domain) {
                    options = Object.assign({}, options);                   // Shallow cloned
                    options.domain = internals.addressOptions(options.domain);
                }

                const regex = Uri.createRegex(options);
                return this._rule({ name: 'uri', args: { options }, regex });
            },
            validate: function (value, helpers, { options }, { regex }) {

                if (['http:/', 'https:/'].includes(value)) {            // scheme:/ is technically valid but makes no sense
                    return helpers.error('string.uri');
                }

                const match = regex.exec(value);
                if (match) {
                    if (options.domain &&
                        !Address.domain.isValid(match[1], options.domain)) {

                        return helpers.error('string.domain', { value: match[1] });
                    }

                    return value;
                }

                if (options.relativeOnly) {
                    return helpers.error('string.uriRelativeOnly');
                }

                if (options.scheme) {
                    return helpers.error('string.uriCustomScheme', { scheme: regex.scheme, value });
                }

                return helpers.error('string.uri');
            }
        }
    },

    // Build

    build: function (desc) {

        let obj = this;                                     // eslint-disable-line consistent-this

        for (const { pattern, replacement } of desc.replacements) {
            obj = obj.replace(pattern, replacement);
        }

        return obj;
    }
});


// Helpers

internals.addressOptions = function (options) {

    if (options.tlds &&
        typeof options.tlds === 'object') {

        Hoek.assert(options.tlds.allow === undefined ||
            options.tlds.allow === false ||
            options.tlds.allow === true ||
            Array.isArray(options.tlds.allow) ||
            options.tlds.allow instanceof Set, 'tlds.allow must be an array, Set, or boolean');

        Hoek.assert(options.tlds.deny === undefined ||
            Array.isArray(options.tlds.deny) ||
            options.tlds.deny instanceof Set, 'tlds.deny must be an array or Set');

        const normalizeTable = (table) => {

            if (table === undefined ||
                typeof table === 'boolean' ||
                table instanceof Set) {

                return table;
            }

            return new Set(table);
        };

        options = Object.assign({}, options);       // Shallow cloned
        options.tlds = {
            allow: normalizeTable(options.tlds.allow),
            deny: normalizeTable(options.tlds.deny)
        };
    }

    Hoek.assert(options.minDomainSegments === undefined ||
        Number.isSafeInteger(options.minDomainSegments) && options.minDomainSegments > 0, 'minDomainSegments must be a positive integer');

    return options;
};


internals.length = function (schema, name, limit, operator, encoding) {

    Hoek.assert(!encoding || Buffer.isEncoding(encoding), 'Invalid encoding:', encoding);

    return schema._rule({ name, method: 'length', args: { limit, encoding }, operator });
};


module.exports = new internals.String();
