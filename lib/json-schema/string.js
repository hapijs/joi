'use strict';

const Url = require('url');
const { ipRegex } = require('@hapi/address');


exports.applyBase = function (schema, res) {

    const noEmpty = !schema._valids?.has('') && !schema._flags.only;
    if (!noEmpty) {
        return res;
    }

    const min = schema.$_getRule('min');
    const length = schema.$_getRule('length');

    if ((!min || min._resolve.length || min.args.limit > 0) &&
        (!length || length._resolve.length || length.args.limit > 0)) {

        res.minLength = 1;
    }

    return res;
};


exports.appendPattern = function (res, pattern) {

    if (res.allOf) {
        const existingPattern = res.pattern;
        delete res.pattern;
        res.allOf.push(...[existingPattern].filter((value) => value !== undefined).map((value) => ({ pattern: value })), { pattern });
        return res;
    }

    if (res.pattern === undefined) {
        res.pattern = pattern;
        return res;
    }

    res.allOf = [
        { pattern: res.pattern },
        { pattern }
    ];

    delete res.pattern;
    return res;
};


exports.base64Pattern = function (options, base64Regex) {

    return base64Regex[options.paddingRequired][options.urlSafe].source;
};


exports.dataUriPattern = function (options, base64Regex) {

    const mediaType = 'data:[\\w+.-]+\\/[\\w+.-]+;';
    const base64 = internals.unanchoredPattern(base64Regex[options.paddingRequired].false);

    return `^${mediaType}(?:base64,${base64}|(?!base64,).*)$`;
};


exports.domainPattern = function (options, minDomainSegments = 2) {

    const min = (options.minDomainSegments || minDomainSegments) - 1;
    const max = options.maxDomainSegments !== undefined ? options.maxDomainSegments - 1 : '';
    const fqdn = options.allowFullyQualified ? '\\.?' : '';
    const totalLength = '(?=.{1,256}$)';
    const labelLength = '(?=[^.]{1,63}\\.)';
    const tldLength = `(?=[^.]{1,63}${options.allowFullyQualified ? '(?:\\.?$)' : '$'})`;
    const label = internals.domainSegmentPattern({
        allowUnicode: options.allowUnicode !== false,
        allowUnderscore: options.allowUnderscore
    });
    const tld = internals.domainTldPattern(options);
    const denied = internals.domainDeniedTldLookahead(options);

    return `^${totalLength}(?:${labelLength}${label}\\.){${min},${max}}${denied}${tldLength}${tld}${fqdn}$`;
};


exports.hexPattern = function (options, mode) {

    const digits = '[0-9A-Fa-f]+';
    const bytes = '(?:[0-9A-Fa-f]{2})+';

    if (!options.byteAligned) {
        if (options.prefix === true) {
            return '^0[xX][0-9A-Fa-f]+$';
        }

        if (options.prefix === 'optional') {
            return '^(?:0[xX])?[0-9A-Fa-f]+$';
        }

        return '^[0-9A-Fa-f]+$';
    }

    if (options.prefix === true) {
        return `^0[xX]${bytes}$`;
    }

    if (options.prefix === 'optional') {
        if (mode === 'output') {
            return `^(?:${bytes}|0[xX]${bytes})$`;
        }

        return `^(?:${digits}|0[xX]${bytes})$`;
    }

    if (mode === 'output') {
        return `^${bytes}$`;
    }

    return '^[0-9A-Fa-f]+$';
};


exports.hostnamePattern = function (minDomainSegments = 2) {

    const hostname = internals.unanchoredPattern(exports.domainPattern({ minDomainSegments: 1, tlds: false }, minDomainSegments));
    const ip = internals.unanchoredPattern(exports.ipPattern({ cidr: 'forbidden' }));

    return `^(?:${hostname}|${ip})$`;
};


exports.ipPattern = function (options) {

    return ipRegex(options).regex.source.replace(/\[\\w-\\\./g, '[\\w.\\-');
};


const internals = {};


internals.unanchoredPattern = function (regex) {

    const pattern = typeof regex === 'string' ? regex : regex.source;
    return pattern.replace(/^\^/, '').replace(/\$$/, '');
};


internals.domainSegmentPattern = function ({ allowUnicode, allowUnderscore, tld = false }) {

    const nonAscii = allowUnicode ? '\\u0080-\\u{10FFFF}' : '';
    const start = `[${tld ? 'A-Za-z' : `A-Za-z0-9${allowUnderscore ? '_' : ''}`}${nonAscii}]`;
    const body = `[A-Za-z0-9${nonAscii}-]`;
    const end = `[A-Za-z0-9${nonAscii}]`;

    return `${start}(?:${body}*${end})?`;
};


internals.domainTldPattern = function (options = {}) {

    const allow = internals.tldPatternValues(options.tlds && options.tlds.allow, options.allowUnicode !== false);
    if (allow !== null) {
        if (!allow.length) {
            return '(?!)';
        }

        return `(?:${allow.join('|')})`;
    }

    return internals.domainSegmentPattern({
        allowUnicode: options.allowUnicode !== false,
        tld: true
    });
};


internals.domainDeniedTldLookahead = function (options = {}) {

    const deny = internals.tldPatternValues(options.tlds && options.tlds.deny, options.allowUnicode !== false);
    if (!deny ||
        !deny.length) {

        return '';
    }

    const denied = deny.join('|');
    const suffix = options.allowFullyQualified ? '\\.?$' : '$';
    return `(?!(?:${denied})${suffix})`;
};


internals.tldValues = function (values) {

    if (values instanceof Set) {
        return [...values];
    }

    return null;
};


internals.tldPatternValues = function (values, allowUnicode) {

    const tlds = internals.tldValues(values);
    if (!tlds) {
        return null;
    }

    const patterns = new Set();
    for (const tld of tlds) {
        const canonical = internals.domainTldValue(tld);
        if (!canonical) {
            continue;
        }

        patterns.add(internals.caseInsensitiveLiteral(canonical));

        if (!allowUnicode) {
            continue;
        }

        const unicode = Url.domainToUnicode(canonical).normalize('NFC');
        if (unicode &&
            unicode !== canonical) {

            for (const variant of internals.unicodeTldVariants(canonical, unicode)) {
                patterns.add(internals.caseInsensitiveLiteral(variant));
            }
        }
    }

    return [...patterns].sort();
};


internals.unicodeTldVariants = function (canonical, unicode) {

    const variants = new Set([
        unicode,
        unicode.normalize('NFD'),
        unicode.toLowerCase().normalize('NFC'),
        unicode.toUpperCase().normalize('NFC')
    ]);

    const valid = [];
    for (const variant of variants) {
        if (Url.domainToASCII(variant).toLowerCase() === canonical) {
            valid.push(variant);
        }
    }

    return valid;
};


internals.domainTldValue = function (value) {

    if (/[^\x00-\x7f]/.test(value)) {
        return null;
    }

    const lower = value.toLowerCase();
    if (value !== lower) {
        return null;
    }

    return lower;
};


internals.caseInsensitiveLiteral = function (value) {

    const pattern = [];
    for (const char of value) {
        const lower = char.toLowerCase();
        const upper = char.toUpperCase();

        if (lower.length !== 1 ||
            upper.length !== 1) {

            pattern.push(internals.regexLiteral(char));
            continue;
        }

        if (lower === upper) {
            pattern.push(internals.regexLiteral(char));
            continue;
        }

        pattern.push(`[${internals.regexClassLiteral(lower)}${internals.regexClassLiteral(upper)}]`);
    }

    return pattern.join('');
};


internals.regexClassLiteral = function (value) {

    return value.replace(/[\\\]\[\^-]/g, '\\$&');
};


internals.regexLiteral = function (value) {

    return value.replace(/[|\\{}()[\]^$+*?.]/g, '\\$&');
};
