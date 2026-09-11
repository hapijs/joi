'use strict';

const Code = require('@hapi/code');
const Lab = require('@hapi/lab');

const Joi = require('..');
const Messages = require('../lib/messages');

const { describe, it } = exports.lab = Lab.script();
const expect = Code.expect;

// JSON.parse produces a genuine own "__proto__" property (unlike the { __proto__: ... }
// object literal shorthand, which the parser special-cases as prototype-setting syntax
// and never creates an own key), matching how an attacker delivers this in practice
// (a JSON request body or config file fed into .messages()/.prefs()).
const attackerJson = (message) => JSON.parse(`{"__proto__": ${JSON.stringify(message)}}`);


describe('messages() proto guard', () => {

    it('does not let a top-level __proto__ code hijack the compiled messages object prototype', () => {

        const before = Messages.compile({ 'number.min': 'too small' });
        expect(Object.getPrototypeOf(before)).to.equal(Object.prototype);

        expect(() => Messages.compile(attackerJson('pwned'))).to.throw();
    });

    it('rejects __proto__ as a language-scoped error code', () => {

        expect(() => Messages.compile({ english: attackerJson('pwned') })).to.throw();
    });

    it('rejects __proto__ via merge()', () => {

        expect(() => Messages.merge({ 'number.min': 'too small' }, attackerJson('pwned'))).to.throw();
    });

    it('rejects __proto__ through the public .messages()/.prefs() schema API', () => {

        expect(() => Joi.any().messages(attackerJson('pwned'))).to.throw();
        expect(() => Joi.any().prefs({ messages: attackerJson('pwned') })).to.throw();
    });
});
