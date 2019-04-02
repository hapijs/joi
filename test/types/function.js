'use strict';

const Code = require('@hapi/code');
const Lab = require('@hapi/lab');
const Joi = require('../..');

const Helper = require('../helper');


const internals = {};


const { describe, it } = exports.lab = Lab.script();
const { expect } = Code;


describe('func', () => {

    it('can be called on its own', () => {

        const func = Joi.func;
        expect(() => func()).to.throw('Must be invoked on a Joi instance.');
    });

    it('should throw an exception if arguments were passed.', () => {

        expect(
            () => Joi.func('invalid argument.')
        ).to.throw('Joi.func() does not allow arguments.');
    });

    it('validates a function', () => {

        Helper.validate(Joi.func().required(), [
            [function () { }, true],
            ['', false, null, {
                message: '"value" must be a Function',
                details: [{
                    message: '"value" must be a Function',
                    path: [],
                    type: 'function.base',
                    context: { label: 'value', key: undefined, value: '' }
                }]
            }]
        ]);
    });

    it('validates a function arity', () => {

        Helper.validate(Joi.func().arity(2).required(), [
            [function (a,b) { }, true],
            [function (a,b,c) { }, false, null, {
                message: '"value" must have an arity of 2',
                details: [{
                    message: '"value" must have an arity of 2',
                    path: [],
                    type: 'function.arity',
                    context: { n: 2, label: 'value', key: undefined }
                }]
            }],
            [function (a) { }, false, null, {
                message: '"value" must have an arity of 2',
                details: [{
                    message: '"value" must have an arity of 2',
                    path: [],
                    type: 'function.arity',
                    context: { n: 2, label: 'value', key: undefined }
                }]
            }],
            [(a,b) => { }, true],
            [(a,b,c) => { }, false, null, {
                message: '"value" must have an arity of 2',
                details: [{
                    message: '"value" must have an arity of 2',
                    path: [],
                    type: 'function.arity',
                    context: { n: 2, label: 'value', key: undefined }
                }]
            }],
            [(a) => { }, false, null, {
                message: '"value" must have an arity of 2',
                details: [{
                    message: '"value" must have an arity of 2',
                    path: [],
                    type: 'function.arity',
                    context: { n: 2, label: 'value', key: undefined }
                }]
            }],
            ['', false, null, {
                message: '"value" must be a Function',
                details: [{
                    message: '"value" must be a Function',
                    path: [],
                    type: 'function.base',
                    context: { label: 'value', key: undefined, value: '' }
                }]
            }]
        ]);
    });

    it('validates a function arity unless values are illegal', () => {

        const schemaWithStringArity = function () {

            return Joi.func().arity('deux');
        };

        const schemaWithNegativeArity = function () {

            return Joi.func().arity(-2);
        };

        expect(schemaWithStringArity).to.throw(Error, 'n must be a positive integer');
        expect(schemaWithNegativeArity).to.throw(Error, 'n must be a positive integer');
    });

    it('validates a function min arity', () => {

        Helper.validate(Joi.func().minArity(2).required(), [
            [function (a,b) { }, true],
            [function (a,b,c) { }, true],
            [function (a) { }, false, null, {
                message: '"value" must have an arity greater or equal to 2',
                details: [{
                    message: '"value" must have an arity greater or equal to 2',
                    path: [],
                    type: 'function.minArity',
                    context: { n: 2, label: 'value', key: undefined }
                }]
            }],
            [(a,b) => { }, true],
            [(a,b,c) => { }, true],
            [(a) => { }, false, null, {
                message: '"value" must have an arity greater or equal to 2',
                details: [{
                    message: '"value" must have an arity greater or equal to 2',
                    path: [],
                    type: 'function.minArity',
                    context: { n: 2, label: 'value', key: undefined }
                }]
            }],
            ['', false, null, {
                message: '"value" must be a Function',
                details: [{
                    message: '"value" must be a Function',
                    path: [],
                    type: 'function.base',
                    context: { label: 'value', key: undefined, value: '' }
                }]
            }]
        ]);
    });

    it('validates a function arity unless values are illegal', () => {

        const schemaWithStringMinArity = function () {

            return Joi.func().minArity('deux');
        };

        const schemaWithNegativeMinArity = function () {

            return Joi.func().minArity(-2);
        };

        const schemaWithZeroArity = function () {

            return Joi.func().minArity(0);
        };

        expect(schemaWithStringMinArity).to.throw(Error, 'n must be a strict positive integer');
        expect(schemaWithNegativeMinArity).to.throw(Error, 'n must be a strict positive integer');
        expect(schemaWithZeroArity).to.throw(Error, 'n must be a strict positive integer');
    });

    it('validates a function max arity', () => {

        Helper.validate(Joi.func().maxArity(2).required(), [
            [function (a,b) { }, true],
            [function (a,b,c) { }, false, null, {
                message: '"value" must have an arity lesser or equal to 2',
                details: [{
                    message: '"value" must have an arity lesser or equal to 2',
                    path: [],
                    type: 'function.maxArity',
                    context: { n: 2, label: 'value', key: undefined }
                }]
            }],
            [function (a) { }, true],
            [(a,b) => { }, true],
            [(a,b,c) => { }, false, null, {
                message: '"value" must have an arity lesser or equal to 2',
                details: [{
                    message: '"value" must have an arity lesser or equal to 2',
                    path: [],
                    type: 'function.maxArity',
                    context: { n: 2, label: 'value', key: undefined }
                }]
            }],
            [(a) => { }, true],
            ['', false, null, {
                message: '"value" must be a Function',
                details: [{
                    message: '"value" must be a Function',
                    path: [],
                    type: 'function.base',
                    context: { label: 'value', key: undefined, value: '' }
                }]
            }]
        ]);
    });

    it('validates a function arity unless values are illegal', () => {

        const schemaWithStringMaxArity = function () {

            return Joi.func().maxArity('deux');
        };

        const schemaWithNegativeMaxArity = function () {

            return Joi.func().maxArity(-2);
        };

        expect(schemaWithStringMaxArity).to.throw('n must be a positive integer');
        expect(schemaWithNegativeMaxArity).to.throw('n must be a positive integer');
    });

    it('validates a function with keys', () => {

        const a = function () { };
        a.a = 'abc';

        const b = function () { };
        b.a = 123;

        Helper.validate(Joi.func().keys({ a: Joi.string().required() }).required(), [
            [function () { }, false, null, {
                message: 'child "a" fails because ["a" is required]',
                details: [{
                    message: '"a" is required',
                    path: ['a'],
                    type: 'any.required',
                    context: { label: 'a', key: 'a' }
                }]
            }],
            [a, true],
            [b, false, null, {
                message: 'child "a" fails because ["a" must be a string]',
                details: [{
                    message: '"a" must be a string',
                    path: ['a'],
                    type: 'string.base',
                    context: { value: 123, label: 'a', key: 'a' }
                }]
            }],
            ['', false, null, {
                message: '"value" must be a Function',
                details: [{
                    message: '"value" must be a Function',
                    path: [],
                    type: 'function.base',
                    context: { label: 'value', key: undefined, value: '' }
                }]
            }]
        ]);
    });

    it('keeps validated value as a function', async () => {

        const schema = Joi.func().keys({ a: Joi.number() });

        const b = 'abc';
        const value = function () {

            return b;
        };

        value.a = '123';

        const validated = await schema.validate(value);
        expect(validated).to.be.a.function();
        expect(validated()).to.equal('abc');
        expect(validated).to.not.equal(value);
    });

    it('retains validated value prototype', async () => {

        const schema = Joi.func().keys({ a: Joi.number() });

        const value = function () {

            this.x = 'o';
        };

        value.prototype.get = function () {

            return this.x;
        };

        const validated = await schema.validate(value);
        expect(validated).to.be.a.function();
        const p = new validated();
        expect(p.get()).to.equal('o');
        expect(validated).to.not.equal(value);
    });

    it('keeps validated value as a function (no clone)', async () => {

        const schema = Joi.func();

        const b = 'abc';
        const value = function () {

            return b;
        };

        value.a = '123';

        const validated = await schema.validate(value);
        expect(validated).to.be.a.function();
        expect(validated()).to.equal('abc');
        expect(validated).to.equal(value);
    });

    it('validates references', () => {

        const schema = Joi.func().ref();

        const fn = () => {};
        Helper.validate(schema, [
            [fn, false, null, {
                message: '"value" must be a Joi reference',
                details: [{
                    message: '"value" must be a Joi reference',
                    path: [],
                    type: 'function.ref',
                    context: { label: 'value', key: undefined, value: fn }
                }]
            }],
            [{}, false, null, {
                message: '"value" must be a Function',
                details: [{
                    message: '"value" must be a Function',
                    path: [],
                    type: 'function.base',
                    context: { label: 'value', key: undefined, value: {} }
                }]
            }],
            [Joi.ref('a.b'), true]
        ]);
    });
});

describe('func().class()', () => {

    it('should differentiate between classes and functions', () => {

        const classSchema = Joi.object({
            _class: Joi.func().class()
        });

        const testFunc = function () {};
        const testClass = class MyClass {};

        Helper.validate(classSchema, [
            [{ _class: testClass }, true],
            [{ _class: testFunc }, false, null, {
                message: 'child "_class" fails because ["_class" must be a class]',
                details: [{
                    message: '"_class" must be a class',
                    path: ['_class'],
                    type: 'function.class',
                    context: { key: '_class', label: '_class', value: testFunc }
                }]
            }]
        ]);
    });

    it('refuses class look-alikes and bad values', () => {

        const classSchema = Joi.object({
            _class: Joi.func().class()
        });

        Helper.validate(classSchema, [
            [{ _class: ['class '] }, false, null, {
                message: 'child "_class" fails because ["_class" must be a Function]',
                details: [{
                    message: '"_class" must be a Function',
                    path: ['_class'],
                    type: 'function.base',
                    context: { key: '_class', label: '_class', value: ['class '] }
                }]
            }],
            [{ _class: null }, false, null, {
                message: 'child "_class" fails because ["_class" must be a Function]',
                details: [{
                    message: '"_class" must be a Function',
                    path: ['_class'],
                    type: 'function.base',
                    context: { key: '_class', label: '_class', value: null }
                }]
            }]
        ]);
    });
});
