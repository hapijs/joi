'use strict';

const Net = require('net');

const Address = require('@hapi/address');
const Hoek = require('@hapi/hoek');

const Any = require('../any');
const JoiDate = require('../date');
const Utils = require('../../utils');

const Ip = require('./ip');
const Uri = require('./uri');


const internals = {
    base64Regex: {
        true: /^(?:[A-Za-z0-9+\/]{2}[A-Za-z0-9+\/]{2})*(?:[A-Za-z0-9+\/]{2}==|[A-Za-z0-9+\/]{3}=)?$/,
        false: /^(?:[A-Za-z0-9+\/]{2}[A-Za-z0-9+\/]{2})*(?:[A-Za-z0-9+\/]{2}(==)?|[A-Za-z0-9+\/]{3}=?)?$/
    },
    dataUriRegex: {
        format: /^data:[\w+.-]+\/[\w+.-]+;((charset=[\w-]+|base64),)?(.*)$/,
        base64: {
            true: /^(?:[A-Za-z0-9+\/]{4})*(?:[A-Za-z0-9+\/]{2}==|[A-Za-z0-9+\/]{3}=)?$/,
            false: /^(?:[A-Za-z0-9+\/]{4})*(?:[A-Za-z0-9+\/]{2}(==)?|[A-Za-z0-9+\/]{3}=?)?$/
        }
    },
    hexRegex: /^[a-f0-9]+$/i,
    hostRegex: /^(([a-zA-Z0-9]|[a-zA-Z0-9][a-zA-Z0-9\-]*[a-zA-Z0-9])\.)*([A-Za-z0-9]|[A-Za-z0-9][A-Za-z0-9\-]*[A-Za-z0-9])$/,
    ipRegex: Ip.createIpRegex(['ipv4', 'ipv6', 'ipvfuture'], 'optional'),
    isoDurationRegex: /^P(?!$)(\d+Y)?(\d+M)?(\d+W)?(\d+D)?(T(?=\d)(\d+H)?(\d+M)?(\d+S)?)?$/,
    uriRegex: Uri.createUriRegex(),

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


internals.String = class extends Any {

    constructor() {

        super();

        this._type = 'string';
        this._invalids.add('');
    }

    _base(value, state, options) {

        if (typeof value === 'string' &&
            options.convert) {

            if (this._flags.normalize) {
                value = value.normalize(this._flags.normalize);
            }

            if (this._flags.case) {
                value = this._flags.case === 'upper' ? value.toLocaleUpperCase() : value.toLocaleLowerCase();
            }

            if (this._flags.trim) {
                value = value.trim();
            }

            if (this._inner.replacements) {
                for (const replacement of this._inner.replacements) {
                    value = value.replace(replacement.pattern, replacement.replacement);
                }
            }

            if (this._flags.truncate) {
                for (const test of this._tests) {
                    if (test.name === 'max') {
                        value = value.slice(0, test.arg.limit);     // BUG - issue 1826
                        break;
                    }
                }
            }

            if (this._flags.byteAligned &&
                value.length % 2 !== 0) {

                value = `0${value}`;
            }
        }

        if (typeof value === 'string') {
            return { value, errors: null };
        }

        return { value, errors: this.createError('string.base', { value }, state, options) };
    }

    alphanum() {

        return this._rule('alphanum');
    }

    base64(options = {}) {

        Hoek.assert(typeof options === 'object', 'options must be an object');

        options = { paddingRequired: true, ...options };
        Hoek.assert(typeof options.paddingRequired === 'boolean', 'paddingRequired must be boolean');

        return this._rule('base64', { args: { options } });
    }

    creditCard() {

        return this._rule('creditCard');
    }

    dataUri(options = {}) {

        Hoek.assert(typeof options === 'object', 'options must be an object');

        options = { paddingRequired: true, ...options };
        Hoek.assert(typeof options.paddingRequired === 'boolean', 'paddingRequired must be boolean');

        return this._rule('dataUri', { args: { options } });
    }

    email(options) {

        if (options) {
            Hoek.assert(typeof options === 'object', 'email options must be an object');

            // Migration validation for unsupported options

            Hoek.assert(options.checkDNS === undefined, 'checkDNS option is not supported');
            Hoek.assert(options.errorLevel === undefined, 'errorLevel option is not supported');
            Hoek.assert(options.minDomainAtoms === undefined, 'minDomainAtoms option is not supported, use minDomainSegments instead');
            Hoek.assert(options.tldBlacklist === undefined, 'tldBlacklist option is not supported, use tlds.deny instead');
            Hoek.assert(options.tldWhitelist === undefined, 'tldWhitelist option is not supported, use tlds.allow instead');

            // Validate options

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
        }

        return this._rule('email', { args: { options } });
    }

    guid(options = {}) {

        let versionNumbers = '';

        if (options.version) {
            const versions = [].concat(options.version);

            Hoek.assert(versions.length >= 1, 'version must have at least 1 valid version specified');
            const set = new Set();

            for (let i = 0; i < versions.length; ++i) {
                let version = versions[i];
                Hoek.assert(typeof version === 'string', 'version at position ' + i + ' must be a string');
                version = version.toLowerCase();
                const versionNumber = internals.guidVersions[version];
                Hoek.assert(versionNumber, 'version at position ' + i + ' must be one of ' + Object.keys(internals.guidVersions).join(', '));
                Hoek.assert(!set.has(versionNumber), 'version at position ' + i + ' must not be a duplicate');

                versionNumbers += versionNumber;
                set.add(versionNumber);
            }
        }

        const regex = new RegExp(`^([\\[{\\(]?)[0-9A-F]{8}([:-]?)[0-9A-F]{4}\\2?[${versionNumbers || '0-9A-F'}][0-9A-F]{3}\\2?[${versionNumbers ? '89AB' : '0-9A-F'}][0-9A-F]{3}\\2?[0-9A-F]{12}([\\]}\\)]?)$`, 'i');

        return this._rule('guid', { args: { options }, regex });
    }

    hex(options = {}) {

        Hoek.assert(typeof options === 'object', 'options must be an object');

        options = { byteAligned: false, ...options };
        Hoek.assert(typeof options.byteAligned === 'boolean', 'byteAligned must be boolean');

        const obj = this._rule('hex', { args: { options } });

        if (options.byteAligned) {
            obj._flags.byteAligned = true;
        }

        return obj;
    }

    hostname() {

        return this._rule('hostname');
    }

    insensitive() {

        if (this._flags.insensitive) {
            return this;
        }

        const obj = this.clone();
        obj._flags.insensitive = true;
        return obj;
    }

    ip(options = {}) {

        let regex = internals.ipRegex;
        Hoek.assert(typeof options === 'object', 'options must be an object');
        options = Object.assign({}, options);       // Shallow cloned

        if (options.cidr) {
            Hoek.assert(typeof options.cidr === 'string', 'cidr must be a string');
            options.cidr = options.cidr.toLowerCase();

            Hoek.assert(Hoek.contain(internals.cidrPresences, options.cidr), 'cidr must be one of ' + internals.cidrPresences.join(', '));

            // If we only received a `cidr` setting, create a regex for it. But we don't need to create one if `cidr` is "optional" since that is the default

            if (!options.version &&
                options.cidr !== 'optional') {

                regex = Ip.createIpRegex(['ipv4', 'ipv6', 'ipvfuture'], options.cidr);
            }
        }
        else {
            options.cidr = 'optional';                // Set our default cidr strategy
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

            versions = Array.from(new Set(versions));   // Make sure we have a set of versions
            regex = Ip.createIpRegex(versions, options.cidr);
        }

        return this._rule('ip', { args: { options }, versions, regex });
    }

    isoDate() {

        return this._rule('isoDate');
    }

    isoDuration() {

        return this._rule('isoDuration');
    }

    length(limit, encoding) {

        return this._length('length', limit, '=', encoding);
    }

    lowercase() {

        const obj = this._rule('lowercase');
        obj._flags.case = 'lower';
        return obj;
    }

    max(limit, encoding) {

        return this._length('max', limit, '<=', encoding);
    }

    min(limit, encoding) {

        return this._length('min', limit, '>=', encoding);
    }

    normalize(form = 'NFC') {

        Hoek.assert(Hoek.contain(internals.normalizationForms, form), 'normalization form must be one of ' + internals.normalizationForms.join(', '));

        const obj = this._rule('normalize', { args: { form } });
        obj._flags.normalize = form;
        return obj;
    }

    regex(pattern, options) {

        Hoek.assert(pattern instanceof RegExp, 'pattern must be a RegExp');
        Hoek.assert(!pattern.flags.includes('g') && !pattern.flags.includes('y'), 'pattern should not use global or sticky mode');

        const patternObject = { pattern };

        if (typeof options === 'string') {
            patternObject.name = options;
        }
        else if (typeof options === 'object') {
            patternObject.invert = !!options.invert;

            if (options.name) {
                patternObject.name = options.name;
            }
        }

        const errorCode = ['string.regex', patternObject.invert ? '.invert' : '', patternObject.name ? '.name' : '.base'].join('');
        return this._rule('regex', { args: { patternObject }, errorCode });
    }

    replace(pattern, replacement) {

        if (typeof pattern === 'string') {
            pattern = new RegExp(Hoek.escapeRegex(pattern), 'g');
        }

        Hoek.assert(pattern instanceof RegExp, 'pattern must be a RegExp');
        Hoek.assert(typeof replacement === 'string', 'replacement must be a String');

        // This can not be considere a test like trim, we can't "reject"
        // anything from this rule, so just clone the current object
        const obj = this.clone();

        if (!obj._inner.replacements) {
            obj._inner.replacements = [];
        }

        obj._inner.replacements.push({
            pattern,
            replacement
        });

        return obj;
    }

    token() {

        return this._rule('token');
    }

    trim(enabled = true) {

        Hoek.assert(typeof enabled === 'boolean', 'option must be a boolean');

        if (this._flags.trim && enabled ||
            !this._flags.trim && !enabled) {

            return this;
        }

        let obj;
        if (enabled) {
            obj = this._rule('trim');
        }
        else {
            obj = this.clone();
            obj._tests = obj._tests.filter((test) => test.name !== 'trim');
        }

        obj._flags.trim = enabled;
        return obj;
    }

    truncate(enabled) {

        const value = enabled === undefined ? true : !!enabled;

        if (this._flags.truncate === value) {
            return this;
        }

        const obj = this.clone();
        obj._flags.truncate = value;
        return obj;
    }

    uppercase() {

        const obj = this._rule('uppercase');
        obj._flags.case = 'upper';
        return obj;
    }

    uri(options = {}) {

        Hoek.assert(typeof options === 'object', 'options must be an object');

        const unknownOptions = Object.keys(options).filter((key) => !['scheme', 'allowRelative', 'relativeOnly', 'allowQuerySquareBrackets'].includes(key));
        Hoek.assert(unknownOptions.length === 0, `options contain unknown keys: ${unknownOptions}`);

        let customScheme = '';
        if (options.scheme) {
            Hoek.assert(options.scheme instanceof RegExp || typeof options.scheme === 'string' || Array.isArray(options.scheme), 'scheme must be a RegExp, String, or Array');

            const schemes = [].concat(options.scheme);
            Hoek.assert(schemes.length >= 1, 'scheme must have at least 1 scheme specified');

            // Flatten the array into a string to be used to match the schemes

            for (let i = 0; i < schemes.length; ++i) {
                const scheme = schemes[i];
                Hoek.assert(scheme instanceof RegExp || typeof scheme === 'string', 'scheme at position ' + i + ' must be a RegExp or String');

                // Add OR separators if a value already exists

                customScheme = customScheme + (customScheme ? '|' : '');

                // If someone wants to match HTTP or HTTPS for example then we need to support both RegExp and String so we don't escape their pattern unknowingly

                if (scheme instanceof RegExp) {
                    customScheme = customScheme + scheme.source;
                }
                else {
                    Hoek.assert(/[a-zA-Z][a-zA-Z0-9+-\.]*/.test(scheme), 'scheme at position ' + i + ' must be a valid scheme');
                    customScheme = customScheme + Hoek.escapeRegex(scheme);
                }
            }
        }

        let regex = internals.uriRegex;

        if (customScheme ||
            options.allowRelative ||
            options.relativeOnly ||
            options.allowQuerySquareBrackets) {

            regex = Uri.createUriRegex(customScheme, options.allowRelative, options.relativeOnly, options.allowQuerySquareBrackets);
        }

        return this._rule('uri', { args: { options }, regex, customScheme });
    }

    _length(name, limit, operator, encoding) {

        Hoek.assert(!encoding || Buffer.isEncoding(encoding), 'Invalid encoding:', encoding);

        const refs = {
            limit: {
                assert: (value) => Number.isSafeInteger(value) && value >= 0,
                code: 'string.ref',
                message: 'limit must be a positive integer or reference'
            }
        };

        return this._rule(name, { rule: 'length', refs, args: { limit, encoding }, operator, override: true });
    }
};


internals.String.prototype._rules = {

    alphanum: function (value, helpers) {

        if (/^[a-zA-Z0-9]+$/.test(value)) {
            return value;
        }

        return helpers.error('string.alphanum', { value });
    },

    base64: function (value, helpers, { options }) {

        const regex = internals.base64Regex[options.paddingRequired];
        if (regex.test(value)) {
            return value;
        }

        return helpers.error('string.base64', { value });
    },

    creditCard: function (value, helpers) {

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

        return helpers.error('string.creditCard', { value });
    },

    dataUri: function (value, helpers, { options }) {

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

        return helpers.error('string.dataUri', { value });
    },

    email: function (value, helpers, { options }) {

        if (Address.email.isValid(value, options)) {
            return value;
        }

        return helpers.error('string.email', { value });
    },

    guid: function (value, helpers, args, { regex }) {

        const results = regex.exec(value);

        if (!results) {
            return helpers.error('string.guid', { value });
        }

        // Matching braces

        if (internals.guidBrackets[results[1]] !== results[results.length - 1]) {
            return helpers.error('string.guid', { value });
        }

        return value;
    },

    hex: function (value, helpers, { options }) {

        if (!internals.hexRegex.test(value)) {
            return helpers.error('string.hex', { value });
        }

        if (options.byteAligned &&
            value.length % 2 !== 0) {

            return helpers.error('string.hexAlign', { value });
        }

        return value;
    },

    hostname: function (value, helpers) {

        if (value.length <= 255 && internals.hostRegex.test(value) ||
            Net.isIPv6(value)) {

            return value;
        }

        return helpers.error('string.hostname', { value });
    },

    ip: function (value, helpers, { options }, { versions, regex }) {

        if (regex.test(value)) {
            return value;
        }

        if (versions) {
            return helpers.error('string.ipVersion', { value, cidr: options.cidr, version: versions });
        }

        return helpers.error('string.ip', { value, cidr: options.cidr });
    },

    isoDate: function (value, { error, options }) {

        if (JoiDate._isIsoDate(value)) {
            if (!options.convert) {
                return value;
            }

            const date = new Date(value);
            if (!isNaN(date.getTime())) {
                return date.toISOString();
            }
        }

        return error('string.isoDate', { value });
    },

    isoDuration: function (value, helpers) {

        if (internals.isoDurationRegex.test(value)) {
            return value;
        }

        return helpers.error('string.isoDuration', { value });
    },

    length: function (value, helpers, { limit, encoding }, { alias, operator, args }) {

        const length = encoding ? Buffer.byteLength(value, encoding) : value.length;
        if (Utils.compare(length, limit, operator)) {
            return value;
        }

        return helpers.error('string.' + alias, { limit: args.limit, value, encoding });
    },

    lowercase: function (value, { error, options }) {

        if (options.convert ||
            value === value.toLocaleLowerCase()) {

            return value;
        }

        return error('string.lowercase', { value });
    },

    normalize: function (value, { error, options }, { form }) {

        if (options.convert ||
            value === value.normalize(form)) {

            return value;
        }

        return error('string.normalize', { value, form });
    },

    regex: function (value, helpers, { patternObject }, { errorCode }) {

        const patternMatch = patternObject.pattern.test(value);

        if (patternMatch ^ patternObject.invert) {
            return value;
        }

        return helpers.error(errorCode, { name: patternObject.name, pattern: patternObject.pattern, value });
    },

    token: function (value, helpers) {

        if (/^\w+$/.test(value)) {
            return value;
        }

        return helpers.error('string.token', { value });
    },

    trim: function (value, { error, options }) {

        if (options.convert ||
            value === value.trim()) {

            return value;
        }

        return error('string.trim', { value });
    },

    uppercase: function (value, { error, options }) {

        if (options.convert ||
            value === value.toLocaleUpperCase()) {

            return value;
        }

        return error('string.uppercase', { value });
    },

    uri: function (value, helpers, { options }, { regex, customScheme }) {

        if (regex.test(value)) {
            return value;
        }

        if (options.relativeOnly) {
            return helpers.error('string.uriRelativeOnly', { value });
        }

        if (customScheme) {
            return helpers.error('string.uriCustomScheme', { scheme: customScheme, value });
        }

        return helpers.error('string.uri', { value });
    }
};


// Aliases

internals.String.prototype.uuid = internals.String.prototype.guid;


module.exports = new internals.String();
