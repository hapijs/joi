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

            // A flat code named __proto__ triggers the legacy accessor on plain-object assignment, and
            // what we assign is always a Template, i.e. an object the accessor accepts, so it replaces
            // target's own prototype instead of creating an own property. That in turn makes
            // Template.isTemplate(target) true, so every code renders that one message

            assert(code !== '__proto__', 'Cannot use __proto__ as a message code');

            target[code] = message;
            continue;
        }

        if (typeof message === 'string') {

            assert(code !== '__proto__', 'Cannot use __proto__ as a message code');

            target[code] = new Template(message);
            continue;
        }

        // By language { english: { 'number.min': <string | template> } }

        assert(typeof message === 'object' && !Array.isArray(message), 'Invalid message for', code);

        const language = code;

        // Don't reuse an inherited object, otherwise a language named __proto__ or constructor writes on the prototype

        const localizedTarget = Object.hasOwn(target, language) ? target[language] : {};
        target[language] = localizedTarget;

        for (const key of Object.keys(message)) {
            const localized = message[key];

            assert(key !== '__proto__', 'Cannot use __proto__ as a message code');

            if (key === 'root' ||
                Template.isTemplate(localized)) {

                localizedTarget[key] = localized;
                continue;
            }

            assert(typeof localized === 'string', 'Invalid message for', key, 'in', language);
            localizedTarget[key] = new Template(localized);
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

            // Same as in compile(), a flat code named __proto__ replaces target's own prototype

            assert(code !== '__proto__', 'Cannot use __proto__ as a message code');

            target[code] = message;
            continue;
        }

        if (typeof message === 'string') {

            assert(code !== '__proto__', 'Cannot use __proto__ as a message code');

            target[code] = new Template(message);
            continue;
        }

        // By language { english: { 'number.min': <string | template> } }

        assert(typeof message === 'object' && !Array.isArray(message), 'Invalid message for', code);

        const language = code;

        // Same as in compile(), don't reuse an inherited object

        const localizedTarget = Object.hasOwn(target, language) ? target[language] : {};
        target[language] = localizedTarget;

        for (const key of Object.keys(message)) {
            const localized = message[key];

            assert(key !== '__proto__', 'Cannot use __proto__ as a message code');

            if (key === 'root' ||
                Template.isTemplate(localized)) {

                localizedTarget[key] = localized;
                continue;
            }

            assert(typeof localized === 'string', 'Invalid message for', key, 'in', language);
            localizedTarget[key] = new Template(localized);
        }
    }

    return target;
};
