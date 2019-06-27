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
            target[code] = message.source;
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

            target[language][code] = localized.source;
        }
    }

    return target;
};


exports.errors = {
    root: 'value',

    'any.unknown': '"{{#label}}" is not allowed',
    'any.invalid': '"{{#label}}" contains an invalid value',
    'any.empty': '"{{#label}}" is not allowed to be empty',
    'any.required': '"{{#label}}" is required',
    'any.allowOnly': '"{{#label}}" must be one of {{#valids}}',
    'any.default': '"{{#label}}" threw an error when running default method',
    'any.failover': '"{{#label}}" threw an error when running failover method',

    'alternatives.base': '"{{#label}}" does not match any of the allowed types',
    'alternatives.types': '"{{#label}}" must be one of {{#types}}',
    'alternatives.match': '"{{#label}}" does not match any of the allowed types',

    'array.base': '"{{#label}}" must be an array',
    'array.includes': '"{{#label}}" does not match any of the allowed types',
    'array.includesRequiredUnknowns': '"{{#label}}" does not contain {{#unknownMisses}} required value(s)',
    'array.includesRequiredKnowns': '"{{#label}}" does not contain {{#knownMisses}}',
    'array.includesRequiredBoth': '"{{#label}}" does not contain {{#knownMisses}} and {{#unknownMisses}} other required value(s)',
    'array.excludes': '"{{#label}}" contains an excluded value',
    'array.hasKnown': '"{{#label}}" does not contain at least one required match for type "{#patternLabel}"',
    'array.hasUnknown': '"{{#label}}" does not contain at least one required match',
    'array.min': '"{{#label}}" must contain at least {{#limit}} items',
    'array.max': '"{{#label}}" must contain less than or equal to {{#limit}} items',
    'array.length': '"{{#label}}" must contain {{#limit}} items',
    'array.orderedLength': '"{{#label}}" must contain at most {{#limit}} items',
    'array.ref': '"{{#label}}" references "{{#ref}}" which is not a positive integer',
    'array.sort': '"{{#label}}" must be sorted in {#order} order by {{#by}}',
    'array.sort.mismatching': '"{{#label}}" cannot be sorted due to mismatching types',
    'array.sort.unsupported': '"{{#label}}" cannot be sorted due to unsupported type {#type}',
    'array.sparse': '"{{#label}}" must not be a sparse array item',
    'array.unique': '"{{#label}}" contains a duplicate value',

    'boolean.base': '"{{#label}}" must be a boolean',

    'binary.base': '"{{#label}}" must be a buffer or a string',
    'binary.min': '"{{#label}}" must be at least {{#limit}} bytes',
    'binary.max': '"{{#label}}" must be less than or equal to {{#limit}} bytes',
    'binary.length': '"{{#label}}" must be {{#limit}} bytes',
    'binary.ref': '"{{#label}}" references "{{#ref}}" which is not a positive integer',

    'date.base': '"{{#label}}" must be a number of milliseconds or valid date string',
    'date.strict': '"{{#label}}" must be a valid date',
    'date.min': '"{{#label}}" must be larger than or equal to "{{#limit}}"',
    'date.max': '"{{#label}}" must be less than or equal to "{{#limit}}"',
    'date.less': '"{{#label}}" must be less than "{{#limit}}"',
    'date.greater': '"{{#label}}" must be greater than "{{#limit}}"',
    'date.isoDate': '"{{#label}}" must be a valid ISO 8601 date',
    'date.timestamp.javascript': '"{{#label}}" must be a valid timestamp or number of milliseconds',
    'date.timestamp.unix': '"{{#label}}" must be a valid timestamp or number of seconds',
    'date.ref': '"{{#label}}" references "{{#ref}}" which is not a date',

    'function.base': '"{{#label}}" must be a Function',
    'function.arity': '"{{#label}}" must have an arity of {{#n}}',
    'function.class': '"{{#label}}" must be a class',
    'function.maxArity': '"{{#label}}" must have an arity lesser or equal to {{#n}}',
    'function.minArity': '"{{#label}}" must have an arity greater or equal to {{#n}}',

    'lazy.base': 'schema error: lazy schema must be set',
    'lazy.schema': 'schema error: lazy schema function must return a schema',

    'object.base': '"{{#label}}" must be an object',
    'object.allowUnknown': '"{{#label}}" is not allowed',
    'object.and': '"{{#label}}" contains {{#presentWithLabels}} without its required peers {{#missingWithLabels}}',
    'object.assert': '"{{#label}}" is invalid because "{{#ref}}" failed to {{#message}}',
    'object.instance': '"{{#label}}" must be an instance of "{{#type}}"',
    'object.length': '"{{#label}}" must have {{#limit}} children',
    'object.max': '"{{#label}}" must have less than or equal to {{#limit}} children',
    'object.min': '"{{#label}}" must have at least {{#limit}} children',
    'object.missing': '"{{#label}}" must contain at least one of {{#peersWithLabels}}',
    'object.nand': '"{{#mainWithLabel}}" must not exist simultaneously with {{#peersWithLabels}}',
    'object.oxor': '"{{#label}}" contains a conflict between optional exclusive peers {{#peersWithLabels}}',
    'object.pattern.match': '"{{#label}}" keys failed to match pattern requirements',
    'object.ref': '"{{#label}}" references "{{#ref}}" which is not a positive integer',
    'object.refType': '"{{#label}}" must be a Joi reference',
    'object.rename.multiple': '"{{#label}}" cannot rename "{{#from}}" because multiple renames are disabled and another key was already renamed to "{{#to}}"',
    'object.rename.override': '"{{#label}}" cannot rename "{{#from}}" because override is disabled and target "{{#to}}" exists',
    'object.schema': '"{{#label}}" must be a Joi schema of {{#type}} type',
    'object.with': '"{{#mainWithLabel}}" missing required peer "{{#peerWithLabel}}"',
    'object.without': '"{{#mainWithLabel}}" conflict with forbidden peer "{{#peerWithLabel}}"',
    'object.xor': '"{{#label}}" contains a conflict between exclusive peers {{#peersWithLabels}}',

    'number.base': '"{{#label}}" must be a number',
    'number.unsafe': '"{{#label}}" must be a safe number',
    'number.min': '"{{#label}}" must be larger than or equal to {{#limit}}',
    'number.max': '"{{#label}}" must be less than or equal to {{#limit}}',
    'number.less': '"{{#label}}" must be less than {{#limit}}',
    'number.greater': '"{{#label}}" must be greater than {{#limit}}',
    'number.integer': '"{{#label}}" must be an integer',
    'number.negative': '"{{#label}}" must be a negative number',
    'number.positive': '"{{#label}}" must be a positive number',
    'number.precision': '"{{#label}}" must have no more than {{#limit}} decimal places',
    'number.ref': '"{{#label}}" references "{{#ref}}" which is not a number',
    'number.multiple': '"{{#label}}" must be a multiple of {{#multiple}}',
    'number.port': '"{{#label}}" must be a valid port',

    'string.base': '"{{#label}}" must be a string',
    'string.min': '"{{#label}}" length must be at least {{#limit}} characters long',
    'string.max': '"{{#label}}" length must be less than or equal to {{#limit}} characters long',
    'string.length': '"{{#label}}" length must be {{#limit}} characters long',
    'string.alphanum': '"{{#label}}" must only contain alpha-numeric characters',
    'string.token': '"{{#label}}" must only contain alpha-numeric and underscore characters',
    'string.regex.base': '"{{#label}}" with value "{[.]}" fails to match the required pattern: {{#pattern}}',
    'string.regex.name': '"{{#label}}" with value "{[.]}" fails to match the {{#name}} pattern',
    'string.regex.invert.base': '"{{#label}}" with value "{[.]}" matches the inverted pattern: {{#pattern}}',
    'string.regex.invert.name': '"{{#label}}" with value "{[.]}" matches the inverted {{#name}} pattern',
    'string.domain': '"{{#label}}" must contain a valid domain name',
    'string.email': '"{{#label}}" must be a valid email',
    'string.uri': '"{{#label}}" must be a valid uri',
    'string.uriRelativeOnly': '"{{#label}}" must be a valid relative uri',
    'string.uriCustomScheme': '"{{#label}}" must be a valid uri with a scheme matching the {{#scheme}} pattern',
    'string.isoDate': '"{{#label}}" must be a valid ISO 8601 date',
    'string.isoDuration': '"{{#label}}" must be a valid ISO 8601 duration',
    'string.guid': '"{{#label}}" must be a valid GUID',
    'string.hex': '"{{#label}}" must only contain hexadecimal characters',
    'string.hexAlign': '"{{#label}}" hex decoded representation must be byte aligned',
    'string.base64': '"{{#label}}" must be a valid base64 string',
    'string.dataUri': '"{{#label}}" must be a valid dataUri string',
    'string.hostname': '"{{#label}}" must be a valid hostname',
    'string.normalize': '"{{#label}}" must be unicode normalized in the {{#form}} form',
    'string.lowercase': '"{{#label}}" must only contain lowercase characters',
    'string.uppercase': '"{{#label}}" must only contain uppercase characters',
    'string.trim': '"{{#label}}" must not have leading or trailing whitespace',
    'string.creditCard': '"{{#label}}" must be a credit card',
    'string.ref': '"{{#label}}" references "{{#ref}}" which is not a number',
    'string.ip': '"{{#label}}" must be a valid ip address with a {{#cidr}} CIDR',
    'string.ipVersion': '"{{#label}}" must be a valid ip address of one of the following versions {{#version}} with a {{#cidr}} CIDR',

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
