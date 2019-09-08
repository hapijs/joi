'use strict';

const Code = require('@hapi/code');
const Lab = require('@hapi/lab');
const Joi = require('../..');

const Helper = require('../helper');


const internals = {};


const { describe, it } = exports.lab = Lab.script();
const { expect } = Code;


describe('function', () => {

    it('throws an exception if arguments were passed.', () => {

        expect(() => Joi.function('invalid argument.')).to.throw('The function type does not allow arguments');
    });

    it('validates a function', () => {

        Helper.validate(Joi.function().required(), [
            [function () { }, true],
            ['', false, {
                message: '"value" must be of type function',
                path: [],
                type: 'object.base',
                context: { label: 'value', value: '', type: 'function' }
            }]
        ]);
    });

    it('supports func() alias', () => {

        Helper.validate(Joi.func().required(), [
            [function () { }, true],
            ['', false, {
                message: '"value" must be of type function',
                path: [],
                type: 'object.base',
                context: { label: 'value', value: '', type: 'function' }
            }]
        ]);
    });

    it('validates a function arity', () => {

        const schema = Joi.function().arity(2).required();
        Helper.validate(schema, [
            [function (a, b) { }, true],
            [(a, b) => { }, true],
            ['', false, {
                message: '"value" must be of type function',
                path: [],
                type: 'object.base',
                context: { label: 'value', value: '', type: 'function' }
            }]
        ]);

        const error1 = schema.validate(function (a, b, c) { }).error;                   // eslint-disable-line prefer-arrow-callback
        expect(error1).to.be.an.error('"value" must have an arity of 2');
        expect(error1.details).to.equal([{
            message: '"value" must have an arity of 2',
            path: [],
            type: 'function.arity',
            context: { n: 2, label: 'value', value: error1.details[0].context.value }
        }]);

        const error2 = schema.validate(function (a) { }).error;                         // eslint-disable-line prefer-arrow-callback
        expect(error2).to.be.an.error('"value" must have an arity of 2');
        expect(error2.details).to.equal([{
            message: '"value" must have an arity of 2',
            path: [],
            type: 'function.arity',
            context: { n: 2, label: 'value', value: error2.details[0].context.value }
        }]);

        const error3 = schema.validate((a, b, c) => { }).error;
        expect(error3).to.be.an.error('"value" must have an arity of 2');
        expect(error3.details).to.equal([{
            message: '"value" must have an arity of 2',
            path: [],
            type: 'function.arity',
            context: { n: 2, label: 'value', value: error3.details[0].context.value }
        }]);

        const error4 = schema.validate((a) => { }).error;
        expect(error4).to.be.an.error('"value" must have an arity of 2');
        expect(error4.details).to.equal([{
            message: '"value" must have an arity of 2',
            path: [],
            type: 'function.arity',
            context: { n: 2, label: 'value', value: error4.details[0].context.value }
        }]);
    });

    it('validates a function arity unless values are illegal', () => {

        const schemaWithStringArity = function () {

            return Joi.function().arity('deux');
        };

        const schemaWithNegativeArity = function () {

            return Joi.function().arity(-2);
        };

        expect(schemaWithStringArity).to.throw(Error, 'n must be a positive integer');
        expect(schemaWithNegativeArity).to.throw(Error, 'n must be a positive integer');
    });

    it('validates a function min arity', () => {

        const schema = Joi.function().minArity(2).required();
        Helper.validate(schema, [
            [function (a, b) { }, true],
            [function (a, b, c) { }, true],
            [(a, b) => { }, true],
            [(a, b, c) => { }, true],
            ['', false, {
                message: '"value" must be of type function',
                path: [],
                type: 'object.base',
                context: { label: 'value', value: '', type: 'function' }
            }]
        ]);

        const error1 = schema.validate(function (a) { }).error;                         // eslint-disable-line prefer-arrow-callback
        expect(error1).to.be.an.error('"value" must have an arity greater or equal to 2');
        expect(error1.details).to.equal([{
            message: '"value" must have an arity greater or equal to 2',
            path: [],
            type: 'function.minArity',
            context: { n: 2, label: 'value', value: error1.details[0].context.value }
        }]);

        const error2 = schema.validate((a) => { }).error;
        expect(error2).to.be.an.error('"value" must have an arity greater or equal to 2');
        expect(error2.details).to.equal([{
            message: '"value" must have an arity greater or equal to 2',
            path: [],
            type: 'function.minArity',
            context: { n: 2, label: 'value', value: error2.details[0].context.value }
        }]);
    });

    it('validates a function arity unless values are illegal', () => {

        const schemaWithStringMinArity = function () {

            return Joi.function().minArity('deux');
        };

        const schemaWithNegativeMinArity = function () {

            return Joi.function().minArity(-2);
        };

        const schemaWithZeroArity = function () {

            return Joi.function().minArity(0);
        };

        expect(schemaWithStringMinArity).to.throw(Error, 'n must be a strict positive integer');
        expect(schemaWithNegativeMinArity).to.throw(Error, 'n must be a strict positive integer');
        expect(schemaWithZeroArity).to.throw(Error, 'n must be a strict positive integer');
    });

    it('validates a function max arity', () => {

        const schema = Joi.function().maxArity(2).required();
        Helper.validate(schema, [
            [function (a, b) { }, true],
            [function (a) { }, true],
            [(a, b) => { }, true],
            [(a) => { }, true]
        ]);

        const error1 = schema.validate(function (a, b, c) { }).error;                       // eslint-disable-line prefer-arrow-callback
        expect(error1).to.be.an.error('"value" must have an arity lesser or equal to 2');
        expect(error1.details).to.equal([{
            message: '"value" must have an arity lesser or equal to 2',
            path: [],
            type: 'function.maxArity',
            context: { n: 2, label: 'value', value: error1.details[0].context.value }
        }]);

        const error2 = schema.validate((a, b, c) => { }).error;
        expect(error2).to.be.an.error('"value" must have an arity lesser or equal to 2');
        expect(error2.details).to.equal([{
            message: '"value" must have an arity lesser or equal to 2',
            path: [],
            type: 'function.maxArity',
            context: { n: 2, label: 'value', value: error2.details[0].context.value }
        }]);

        const error3 = schema.validate('').error;
        expect(error3).to.be.an.error('"value" must be of type function');
        expect(error3.details).to.equal([{
            message: '"value" must be of type function',
            path: [],
            type: 'object.base',
            context: { label: 'value', value: '', type: 'function' }
        }]);
    });

    it('validates a function arity unless values are illegal', () => {

        const schemaWithStringMaxArity = function () {

            return Joi.function().maxArity('deux');
        };

        const schemaWithNegativeMaxArity = function () {

            return Joi.function().maxArity(-2);
        };

        expect(schemaWithStringMaxArity).to.throw('n must be a positive integer');
        expect(schemaWithNegativeMaxArity).to.throw('n must be a positive integer');
    });

    it('validates a function with keys', () => {

        const a = function () { };
        a.a = 'abc';

        const b = function () { };
        b.a = 123;

        Helper.validate(Joi.function().keys({ a: Joi.string().required() }).required(), [
            [function () { }, false, {
                message: '"a" is required',
                path: ['a'],
                type: 'any.required',
                context: { label: 'a', key: 'a' }
            }],
            [a, true],
            [b, false, {
                message: '"a" must be a string',
                path: ['a'],
                type: 'string.base',
                context: { value: 123, label: 'a', key: 'a' }
            }],
            ['', false, {
                message: '"value" must be of type function',
                path: [],
                type: 'object.base',
                context: { label: 'value', value: '', type: 'function' }
            }]
        ]);
    });

    it('validates a function with keys and function rules', () => {

        const schema = Joi.function()
            .keys({ a: Joi.string().required() })
            .minArity(1)
            .required();

        const a = function (x) { };
        a.a = 'abc';

        const b = function (x) { };
        b.a = 123;

        const c = function () { };
        c.a = 'abc';

        Helper.validate(schema, [
            [a, true],
            [function (x) { }, false, {
                message: '"a" is required',
                path: ['a'],
                type: 'any.required',
                context: { label: 'a', key: 'a' }
            }],
            [b, false, {
                message: '"a" must be a string',
                path: ['a'],
                type: 'string.base',
                context: { value: 123, label: 'a', key: 'a' }
            }]
        ]);

        const err = schema.validate(c).error;
        expect(err).to.be.an.error('"value" must have an arity greater or equal to 1');
        expect(err.details).to.equal([{
            message: '"value" must have an arity greater or equal to 1',
            path: [],
            type: 'function.minArity',
            context: { value: err.details[0].context.value, label: 'value', n: 1 }
        }]);
    });

    it('validates a function with object rules and function rules', () => {

        const schema = Joi.function()
            .min(1)
            .minArity(1)
            .required();

        const a = function (x) { };
        a.a = 'abc';

        const b = function () { };
        b.a = 'abc';

        Helper.validate(schema, [
            [a, true]
        ]);

        const err1 = schema.validate(b).error;
        expect(err1).to.be.an.error('"value" must have an arity greater or equal to 1');
        expect(err1.details).to.equal([{
            message: '"value" must have an arity greater or equal to 1',
            path: [],
            type: 'function.minArity',
            context: { value: err1.details[0].context.value, label: 'value', n: 1 }
        }]);

        const c = function (x) { };

        const err2 = schema.validate(c).error;
        expect(err2).to.be.an.error('"value" must have at least 1 key');
        expect(err2.details).to.equal([{
            message: '"value" must have at least 1 key',
            path: [],
            type: 'object.min',
            context: { value: err2.details[0].context.value, label: 'value', limit: 1 }
        }]);
    });

    it('keeps validated value as a function', () => {

        const schema = Joi.function().keys({ a: Joi.number() });

        const b = 'abc';
        const value = function () {

            return b;
        };

        value.a = '123';

        const validated = schema.validate(value).value;
        expect(validated).to.be.a.function();
        expect(validated()).to.equal('abc');
        expect(validated).to.not.equal(value);
    });

    it('retains validated value prototype', () => {

        const schema = Joi.function().keys({ a: Joi.number() });

        const value = function () {

            this.x = 'o';
        };

        value.prototype.get = function () {

            return this.x;
        };

        const validated = schema.validate(value).value;
        expect(validated).to.be.a.function();
        const p = new validated();
        expect(p.get()).to.equal('o');
        expect(validated).to.not.equal(value);
    });

    it('keeps validated value as a function (no clone)', () => {

        const schema = Joi.function();

        const b = 'abc';
        const value = function () {

            return b;
        };

        value.a = '123';

        const validated = schema.validate(value).value;
        expect(validated).to.be.a.function();
        expect(validated()).to.equal('abc');
        expect(validated).to.equal(value);
    });
});

describe('function().class()', () => {

    it('should differentiate between classes and functions', () => {

        const classSchema = Joi.object({
            _class: Joi.function().class()
        });

        const testFunc = function () { };
        const testClass = class MyClass { };

        Helper.validate(classSchema, [
            [{ _class: testClass }, true],
            [{ _class: testFunc }, false, {
                message: '"_class" must be a class',
                path: ['_class'],
                type: 'function.class',
                context: { key: '_class', label: '_class', value: testFunc }
            }]
        ]);
    });

    it('refuses class look-alikes and bad values', () => {

        const classSchema = Joi.object({
            _class: Joi.function().class()
        });

        Helper.validate(classSchema, [
            [{ _class: ['class '] }, false, {
                message: '"_class" must be of type function',
                path: ['_class'],
                type: 'object.base',
                context: { key: '_class', label: '_class', value: ['class '], type: 'function' }
            }],
            [{ _class: null }, false, {
                message: '"_class" must be of type function',
                path: ['_class'],
                type: 'object.base',
                context: { key: '_class', label: '_class', value: null, type: 'function' }
            }]
        ]);
    });
});
