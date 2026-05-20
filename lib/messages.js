'use strict';

const { assert, clone } = require('@hapi/hoek');

const Template = require('./template');


const internals = {};


exports.compile = function (messages, target) {

    // Single value string ('plain error message', 'template {error} message')

    if (typeof messages === 'string') {
        assert(!target, 'Cannot set single message string');
        return new Template(messages);
    }

    // Single value template

    if (Template.isTemplate(messages)) {
        assert(!target, 'Cannot set single message template');
        return messages;
    }

    // By error code { 'number.min': <string | template> }

    assert(typeof messages === 'object' && !Array.isArray(messages), 'Invalid message options');

    target = target ? clone(target) : {};

    for (const code of Object.keys(messages)) {
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

        assert(typeof message === 'object' && !Array.isArray(message), 'Invalid message for', code);

        const language = code;
        target[language] = target[language] || {};

        for (const key of Object.keys(message)) {
            const localized = message[key];

            if (key === 'root' ||
                Template.isTemplate(localized)) {

                target[language][key] = localized;
                continue;
            }

            assert(typeof localized === 'string', 'Invalid message for', key, 'in', language);
            target[language][key] = new Template(localized);
        }
    }

    return target;
};


exports.decompile = function (messages) {

    // By error code { 'number.min': <string | template> }

    const target = {};
    for (const code of Object.keys(messages)) {
        const message = messages[code];

        if (code === 'root') {
            target.root = message;
            continue;
        }

        if (Template.isTemplate(message)) {
            target[code] = message.describe({ compact: true });
            continue;
        }

        // By language { english: { 'number.min': <string | template> } }

        const language = code;
        target[language] = {};

        for (const key of Object.keys(message)) {
            const localized = message[key];

            if (key === 'root') {
                target[language].root = localized;
                continue;
            }

            target[language][key] = localized.describe({ compact: true });
        }
    }

    return target;
};


exports.merge = function (base, extended) {

    if (!base) {
        return exports.compile(extended);
    }

    if (!extended) {
        return base;
    }

    // Single value string

    if (typeof extended === 'string') {
        return new Template(extended);
    }

    // Single value template

    if (Template.isTemplate(extended)) {
        return extended;
    }

    // By error code { 'number.min': <string | template> }

    const target = clone(base);

    for (const code of Object.keys(extended)) {
        const message = extended[code];

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

        assert(typeof message === 'object' && !Array.isArray(message), 'Invalid message for', code);

        const language = code;
        target[language] = target[language] || {};

        for (const key of Object.keys(message)) {
            const localized = message[key];

            if (key === 'root' ||
                Template.isTemplate(localized)) {

                target[language][key] = localized;
                continue;
            }

            assert(typeof localized === 'string', 'Invalid message for', key, 'in', language);
            target[language][key] = new Template(localized);
        }
    }

    return target;
};
