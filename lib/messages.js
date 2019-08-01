'use strict';

const Hoek = require('@hapi/hoek');

const Template = require('./template');


const internals = {};


exports.compile = function (messages, target) {

    // Single value string ('plain error message', 'template {error} message')

    if (typeof messages === 'string') {
        Hoek.assert(!target, 'Cannot set single message string');
        return new Template(messages);
    }

    // Single value template

    if (Template.isTemplate(messages)) {
        Hoek.assert(!target, 'Cannot set single message template');
        return messages;
    }

    // By error code { 'number.min': <string | template> }

    Hoek.assert(typeof messages === 'object' && !Array.isArray(messages), 'Invalid message options');

    target = target ? Hoek.clone(target) : {};

    for (let code in messages) {
        const message = messages[code];

        if (code === 'root' ||
            Template.isTemplate(message)) {

            target[code] = message;
            continue;
        }

        if (typeof message === 'string') {
            target[code] = new Template(message);
            continue;
        }

        // By language { english: { 'number.min': <string | template> } }

        Hoek.assert(typeof message === 'object' && !Array.isArray(message), 'Invalid message for', code);

        const language = code;
        target[language] = target[language] || {};

        for (code in message) {
            const localized = message[code];

            if (code === 'root' ||
                Template.isTemplate(localized)) {

                target[language][code] = localized;
                continue;
            }

            Hoek.assert(typeof localized === 'string', 'Invalid message for', code, 'in', language);
            target[language][code] = new Template(localized);
        }
    }

    return target;
};


exports.decompile = function (messages) {

    // By error code { 'number.min': <string | template> }

    const target = {};
    for (let code in messages) {
        const message = messages[code];

        if (code === 'root') {
            target[code] = message;
            continue;
        }

        if (Template.isTemplate(message)) {
            target[code] = message.describe({ compact: true });
            continue;
        }

        // By language { english: { 'number.min': <string | template> } }

        const language = code;
        target[language] = {};

        for (code in message) {
            const localized = message[code];

            if (code === 'root') {
                target[language][code] = localized;
                continue;
            }

            target[language][code] = localized.describe({ compact: true });
        }
    }

    return target;
};


exports.errors = {
    root: 'value',

    'alternatives.base': '"{{#label}}" does not match any of the allowed types',
    'alternatives.match': '"{{#label}}" does not match any of the allowed types',
    'alternatives.types': '"{{#label}}" must be one of {{#types}}',

    'any.default': '"{{#label}}" threw an error when running default method',
    'any.failover': '"{{#label}}" threw an error when running failover method',
    'any.invalid': '"{{#label}}" contains an invalid value',
    'any.only': '"{{#label}}" must be one of {{#valids}}',
    'any.required': '"{{#label}}" is required',
    'any.unknown': '"{{#label}}" is not allowed',

    'array.base': '"{{#label}}" must be an array',
    'array.excludes': '"{{#label}}" contains an excluded value',
    'array.hasKnown': '"{{#label}}" does not contain at least one required match for type "{#patternLabel}"',
    'array.hasUnknown': '"{{#label}}" does not contain at least one required match',
    'array.includes': '"{{#label}}" does not match any of the allowed types',
    'array.includesRequiredBoth': '"{{#label}}" does not contain {{#knownMisses}} and {{#unknownMisses}} other required value(s)',
    'array.includesRequiredKnowns': '"{{#label}}" does not contain {{#knownMisses}}',
    'array.includesRequiredUnknowns': '"{{#label}}" does not contain {{#unknownMisses}} required value(s)',
    'array.length': '"{{#label}}" must contain {{#limit}} items',
    'array.max': '"{{#label}}" must contain less than or equal to {{#limit}} items',
    'array.min': '"{{#label}}" must contain at least {{#limit}} items',
    'array.orderedLength': '"{{#label}}" must contain at most {{#limit}} items',
    'array.ref': '"{{#label}}" references "{{#ref}}" which is not a positive integer',
    'array.sort': '"{{#label}}" must be sorted in {#order} order by {{#by}}',
    'array.sort.mismatching': '"{{#label}}" cannot be sorted due to mismatching types',
    'array.sort.unsupported': '"{{#label}}" cannot be sorted due to unsupported type {#type}',
    'array.sparse': '"{{#label}}" must not be a sparse array item',
    'array.unique': '"{{#label}}" contains a duplicate value',

    'binary.base': '"{{#label}}" must be a buffer or a string',
    'binary.length': '"{{#label}}" must be {{#limit}} bytes',
    'binary.max': '"{{#label}}" must be less than or equal to {{#limit}} bytes',
    'binary.min': '"{{#label}}" must be at least {{#limit}} bytes',
    'binary.ref': '"{{#label}}" references "{{#ref}}" which is not a positive integer',

    'boolean.base': '"{{#label}}" must be a boolean',

    'date.base': '"{{#label}}" must be a number of milliseconds or valid date string',
    'date.greater': '"{{#label}}" must be greater than "{{#limit}}"',
    'date.isoDate': '"{{#label}}" must be a valid ISO 8601 date',
    'date.less': '"{{#label}}" must be less than "{{#limit}}"',
    'date.max': '"{{#label}}" must be less than or equal to "{{#limit}}"',
    'date.min': '"{{#label}}" must be larger than or equal to "{{#limit}}"',
    'date.ref': '"{{#label}}" references "{{#ref}}" which is not a date',
    'date.strict': '"{{#label}}" must be a valid date',
    'date.timestamp.javascript': '"{{#label}}" must be a valid timestamp or number of milliseconds',
    'date.timestamp.unix': '"{{#label}}" must be a valid timestamp or number of seconds',

    'function.arity': '"{{#label}}" must have an arity of {{#n}}',
    'function.base': '"{{#label}}" must be a Function',
    'function.class': '"{{#label}}" must be a class',
    'function.maxArity': '"{{#label}}" must have an arity lesser or equal to {{#n}}',
    'function.minArity': '"{{#label}}" must have an arity greater or equal to {{#n}}',

    'link.depth': '"{{#label}}" contains link reference "{{#ref}}" outside of schema boundaries',
    'link.loop': '"{{#label}}" contains link reference to another link "{{#ref}}"',
    'link.ref': '"{{#label}}" contains link reference to non-existing "{{#ref}}" schema',
    'link.uninitialized': 'uninitialized schema',

    'number.base': '"{{#label}}" must be a number',
    'number.greater': '"{{#label}}" must be greater than {{#limit}}',
    'number.integer': '"{{#label}}" must be an integer',
    'number.less': '"{{#label}}" must be less than {{#limit}}',
    'number.max': '"{{#label}}" must be less than or equal to {{#limit}}',
    'number.min': '"{{#label}}" must be larger than or equal to {{#limit}}',
    'number.multiple': '"{{#label}}" must be a multiple of {{#multiple}}',
    'number.negative': '"{{#label}}" must be a negative number',
    'number.port': '"{{#label}}" must be a valid port',
    'number.positive': '"{{#label}}" must be a positive number',
    'number.precision': '"{{#label}}" must have no more than {{#limit}} decimal places',
    'number.ref': '"{{#label}}" references "{{#ref}}" which is not a number',
    'number.unsafe': '"{{#label}}" must be a safe number',

    'object.and': '"{{#label}}" contains {{#presentWithLabels}} without its required peers {{#missingWithLabels}}',
    'object.assert': '"{{#label}}" is invalid because "{{#ref}}" failed to {{#message}}',
    'object.base': '"{{#label}}" must be an object',
    'object.instance': '"{{#label}}" must be an instance of "{{#type}}"',
    'object.length': '"{{#label}}" must have {{#limit}} keys',
    'object.max': '"{{#label}}" must have less than or equal to {{#limit}} keys',
    'object.min': '"{{#label}}" must have at least {{#limit}} keys',
    'object.missing': '"{{#label}}" must contain at least one of {{#peersWithLabels}}',
    'object.nand': '"{{#mainWithLabel}}" must not exist simultaneously with {{#peersWithLabels}}',
    'object.oxor': '"{{#label}}" contains a conflict between optional exclusive peers {{#peersWithLabels}}',
    'object.pattern.match': '"{{#label}}" keys failed to match pattern requirements',
    'object.ref': '"{{#label}}" references "{{#ref}}" which is not a positive integer',
    'object.refType': '"{{#label}}" must be a Joi reference',
    'object.rename.multiple': '"{{#label}}" cannot rename "{{#from}}" because multiple renames are disabled and another key was already renamed to "{{#to}}"',
    'object.rename.override': '"{{#label}}" cannot rename "{{#from}}" because override is disabled and target "{{#to}}" exists',
    'object.schema': '"{{#label}}" must be a Joi schema of {{#type}} type',
    'object.unknown': '"{{#label}}" is not allowed',
    'object.with': '"{{#mainWithLabel}}" missing required peer "{{#peerWithLabel}}"',
    'object.without': '"{{#mainWithLabel}}" conflict with forbidden peer "{{#peerWithLabel}}"',
    'object.xor': '"{{#label}}" contains a conflict between exclusive peers {{#peersWithLabels}}',

    'string.alphanum': '"{{#label}}" must only contain alpha-numeric characters',
    'string.base': '"{{#label}}" must be a string',
    'string.base64': '"{{#label}}" must be a valid base64 string',
    'string.creditCard': '"{{#label}}" must be a credit card',
    'string.dataUri': '"{{#label}}" must be a valid dataUri string',
    'string.domain': '"{{#label}}" must contain a valid domain name',
    'string.email': '"{{#label}}" must be a valid email',
    'string.empty': '"{{#label}}" is not allowed to be empty',
    'string.guid': '"{{#label}}" must be a valid GUID',
    'string.hex': '"{{#label}}" must only contain hexadecimal characters',
    'string.hexAlign': '"{{#label}}" hex decoded representation must be byte aligned',
    'string.hostname': '"{{#label}}" must be a valid hostname',
    'string.ip': '"{{#label}}" must be a valid ip address with a {{#cidr}} CIDR',
    'string.ipVersion': '"{{#label}}" must be a valid ip address of one of the following versions {{#version}} with a {{#cidr}} CIDR',
    'string.isoDate': '"{{#label}}" must be a valid ISO 8601 date',
    'string.isoDuration': '"{{#label}}" must be a valid ISO 8601 duration',
    'string.length': '"{{#label}}" length must be {{#limit}} characters long',
    'string.lowercase': '"{{#label}}" must only contain lowercase characters',
    'string.max': '"{{#label}}" length must be less than or equal to {{#limit}} characters long',
    'string.min': '"{{#label}}" length must be at least {{#limit}} characters long',
    'string.normalize': '"{{#label}}" must be unicode normalized in the {{#form}} form',
    'string.token': '"{{#label}}" must only contain alpha-numeric and underscore characters',
    'string.pattern.base': '"{{#label}}" with value "{[.]}" fails to match the required pattern: {{#regex}}',
    'string.pattern.name': '"{{#label}}" with value "{[.]}" fails to match the {{#name}} pattern',
    'string.pattern.invert.base': '"{{#label}}" with value "{[.]}" matches the inverted pattern: {{#regex}}',
    'string.pattern.invert.name': '"{{#label}}" with value "{[.]}" matches the inverted {{#name}} pattern',
    'string.ref': '"{{#label}}" references "{{#ref}}" which is not a number',
    'string.trim': '"{{#label}}" must not have leading or trailing whitespace',
    'string.uri': '"{{#label}}" must be a valid uri',
    'string.uriCustomScheme': '"{{#label}}" must be a valid uri with a scheme matching the {{#scheme}} pattern',
    'string.uriRelativeOnly': '"{{#label}}" must be a valid relative uri',
    'string.uppercase': '"{{#label}}" must only contain uppercase characters',

    'symbol.base': '"{{#label}}" must be a symbol',
    'symbol.map': '"{{#label}}" must be one of {{#map}}'
};


internals.cache = function () {

    const compiled = {};

    for (const code in exports.errors) {
        if (code === 'root') {
            continue;
        }

        compiled[code] = new Template(exports.errors[code]);
    }

    return compiled;
};

exports.compiled = internals.cache();
