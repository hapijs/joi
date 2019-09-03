'use strict';

const Code = require('@hapi/code');
const Lab = require('@hapi/lab');
const Joi = require('../..');

const Helper = require('../helper');


const internals = {};


const { describe, it } = exports.lab = Lab.script();
const { expect } = Code;


describe('number', () => {

    it('throws an exception if arguments were passed.', () => {

        expect(() => Joi.number('invalid argument.')).to.throw('The number type does not allow arguments');
    });

    it('fails on boolean', () => {

        const schema = Joi.number();
        Helper.validate(schema, [
            [true, false, null, {
                message: '"value" must be a number',
                details: [{
                    message: '"value" must be a number',
                    path: [],
                    type: 'number.base',
                    context: { label: 'value', value: true }
                }]
            }],
            [false, false, null, {
                message: '"value" must be a number',
                details: [{
                    message: '"value" must be a number',
                    path: [],
                    type: 'number.base',
                    context: { label: 'value', value: false }
                }]
            }]
        ]);
    });

    it('instantiates separate copies on invocation', () => {

        const result1 = Joi.number().min(5);
        const result2 = Joi.number().max(5);

        expect(Object.keys(result1)).to.not.shallow.equal(Object.keys(result2));
    });

    it('shows resulting object with #valueOf', () => {

        const result = Joi.number().min(5);
        expect(result.valueOf()).to.exist();
    });

    describe('error message', () => {

        it('displays correctly for int type', () => {

            const t = Joi.number().integer();
            expect(Joi.compile(t).validate('1.1').error).to.be.an.error(/integer/);
        });
    });

    describe('cast()', () => {

        it('casts value to string', () => {

            const schema = Joi.number().cast('string');
            expect(schema.validate(0).value).to.equal('0');
            expect(schema.validate(0.01).value).to.equal('0.01');
            expect(schema.validate(-12).value).to.equal('-12');
        });

        it('ignores null', () => {

            const schema = Joi.number().allow(null).cast('string');
            expect(schema.validate(null).value).to.be.null();
        });

        it('ignores string', () => {

            const schema = Joi.number().allow('x').cast('string');
            expect(schema.validate('x').value).to.equal('x');
        });
    });

    describe('describe()', () => {

        it('describes a minimum of 0', () => {

            const schema = Joi.number().min(0);
            expect(schema.describe()).to.equal({
                type: 'number',
                rules: [
                    {
                        name: 'min',
                        args: { limit: 0 }
                    }
                ]
            });
        });
    });

    describe('greater()', () => {

        it('throws when limit is not a number', () => {

            expect(() => {

                Joi.number().greater('a');
            }).to.throw('limit must be a number or reference');
        });

        it('accepts references as greater value', () => {

            const ref = Joi.ref('a');
            const schema = Joi.object({ a: Joi.number(), b: Joi.number().greater(ref) });

            Helper.validate(schema, [
                [{ a: 42, b: 1337 }, true],
                [{ a: 1337, b: 42 }, false, null, {
                    message: '"b" must be greater than ref:a',
                    details: [{
                        message: '"b" must be greater than ref:a',
                        path: ['b'],
                        type: 'number.greater',
                        context: { limit: ref, value: 42, label: 'b', key: 'b' }
                    }]
                }],
                [{ a: '1337', b: 42 }, false, null, {
                    message: '"b" must be greater than ref:a',
                    details: [{
                        message: '"b" must be greater than ref:a',
                        path: ['b'],
                        type: 'number.greater',
                        context: { limit: ref, value: 42, label: 'b', key: 'b' }
                    }]
                }],
                [{ a: 2.4, b: 4.2 }, true],
                [{ a: 4.2, b: 4.20000001 }, true],
                [{
                    a: 4.20000001,
                    b: 4.2
                }, false, null, {
                    message: '"b" must be greater than ref:a',
                    details: [{
                        message: '"b" must be greater than ref:a',
                        path: ['b'],
                        type: 'number.greater',
                        context: { limit: ref, value: 4.2, label: 'b', key: 'b' }
                    }]
                }],
                [{ a: 4.2, b: 2.4 }, false, null, {
                    message: '"b" must be greater than ref:a',
                    details: [{
                        message: '"b" must be greater than ref:a',
                        path: ['b'],
                        type: 'number.greater',
                        context: { limit: ref, value: 2.4, label: 'b', key: 'b' }
                    }]
                }]
            ]);
        });

        it('accepts context references as greater value', () => {

            const ref = Joi.ref('$a');
            const schema = Joi.object({ b: Joi.number().greater(ref) });

            Helper.validate(schema, [
                [{ b: 1337 }, true, { context: { a: 42 } }],
                [{ b: 42 }, false, { context: { a: 1337 } }, {
                    message: '"b" must be greater than ref:global:a',
                    details: [{
                        message: '"b" must be greater than ref:global:a',
                        path: ['b'],
                        type: 'number.greater',
                        context: { limit: ref, value: 42, label: 'b', key: 'b' }
                    }]
                }],
                [{ b: 4.2 }, true, { context: { a: 2.4 } }],
                [{ b: 4.20000001 }, true, { context: { a: 4.2 } }],
                [{ b: 4.2 }, false, { context: { a: 4.20000001 } }, {
                    message: '"b" must be greater than ref:global:a',
                    details: [{
                        message: '"b" must be greater than ref:global:a',
                        path: ['b'],
                        type: 'number.greater',
                        context: { limit: ref, value: 4.2, label: 'b', key: 'b' }
                    }]
                }],
                [{ b: 2.4 }, false, { context: { a: 4.2 } }, {
                    message: '"b" must be greater than ref:global:a',
                    details: [{
                        message: '"b" must be greater than ref:global:a',
                        path: ['b'],
                        type: 'number.greater',
                        context: { limit: ref, value: 2.4, label: 'b', key: 'b' }
                    }]
                }]
            ]);
        });

        it('errors if reference is not a number', () => {

            const ref = Joi.ref('a');
            const schema = Joi.object({ a: Joi.string(), b: Joi.number().greater(ref) });

            Helper.validate(schema, [
                [{ a: 'abc', b: 42 }, false, null, {
                    message: '"b" limit references "ref:a" which must be a number',
                    details: [{
                        message: '"b" limit references "ref:a" which must be a number',
                        path: ['b'],
                        type: 'any.ref',
                        context: { ref, label: 'b', key: 'b', value: 'abc', arg: 'limit', reason: 'must be a number' }
                    }]
                }]
            ]);
        });

        it('errors if context reference is not a number', () => {

            const ref = Joi.ref('$a');
            const schema = Joi.object({ b: Joi.number().greater(ref) });

            Helper.validate(schema, [
                [{ b: 42 }, false, { context: { a: 'abc' } }, {
                    message: '"b" limit references "ref:global:a" which must be a number',
                    details: [{
                        message: '"b" limit references "ref:global:a" which must be a number',
                        path: ['b'],
                        type: 'any.ref',
                        context: { ref, label: 'b', key: 'b', value: 'abc', arg: 'limit', reason: 'must be a number' }
                    }]
                }]
            ]);
        });
    });

    describe('less()', () => {

        it('throws when limit is not a number', () => {

            expect(() => {

                Joi.number().less('a');
            }).to.throw('limit must be a number or reference');
        });

        it('accepts references as less value', () => {

            const ref = Joi.ref('a');
            const schema = Joi.object({ a: Joi.number(), b: Joi.number().less(ref) });

            Helper.validate(schema, [
                [{ a: 1337, b: 42 }, true],
                [{ a: 42, b: 1337 }, false, null, {
                    message: '"b" must be less than ref:a',
                    details: [{
                        message: '"b" must be less than ref:a',
                        path: ['b'],
                        type: 'number.less',
                        context: { limit: ref, value: 1337, label: 'b', key: 'b' }
                    }]
                }],
                [{ a: '42', b: 1337 }, false, null, {
                    message: '"b" must be less than ref:a',
                    details: [{
                        message: '"b" must be less than ref:a',
                        path: ['b'],
                        type: 'number.less',
                        context: { limit: ref, value: 1337, label: 'b', key: 'b' }
                    }]
                }],
                [{ a: 4.2, b: 2.4 }, true],
                [{ a: 4.2, b: 4.20000001 }, false, null, {
                    message: '"b" must be less than ref:a',
                    details: [{
                        message: '"b" must be less than ref:a',
                        path: ['b'],
                        type: 'number.less',
                        context: { limit: ref, value: 4.20000001, label: 'b', key: 'b' }
                    }]
                }],
                [{ a: 4.20000001, b: 4.2 }, true],
                [{ a: 2.4, b: 4.2 }, false, null, {
                    message: '"b" must be less than ref:a',
                    details: [{
                        message: '"b" must be less than ref:a',
                        path: ['b'],
                        type: 'number.less',
                        context: { limit: ref, value: 4.2, label: 'b', key: 'b' }
                    }]
                }]
            ]);
        });

        it('accepts context references as less value', () => {

            const ref = Joi.ref('$a');
            const schema = Joi.object({ b: Joi.number().less(ref) });

            Helper.validate(schema, [
                [{ b: 42 }, true, { context: { a: 1337 } }],
                [{ b: 1337 }, false, { context: { a: 42 } }, {
                    message: '"b" must be less than ref:global:a',
                    details: [{
                        message: '"b" must be less than ref:global:a',
                        path: ['b'],
                        type: 'number.less',
                        context: { limit: ref, value: 1337, label: 'b', key: 'b' }
                    }]
                }],
                [{ b: 2.4 }, true, { context: { a: 4.2 } }],
                [{ b: 4.20000001 }, false, { context: { a: 4.2 } }, {
                    message: '"b" must be less than ref:global:a',
                    details: [{
                        message: '"b" must be less than ref:global:a',
                        path: ['b'],
                        type: 'number.less',
                        context: { limit: ref, value: 4.20000001, label: 'b', key: 'b' }
                    }]
                }],
                [{ b: 4.2 }, true, { context: { a: 4.20000001 } }],
                [{ b: 4.2 }, false, { context: { a: 2.4 } }, {
                    message: '"b" must be less than ref:global:a',
                    details: [{
                        message: '"b" must be less than ref:global:a',
                        path: ['b'],
                        type: 'number.less',
                        context: { limit: ref, value: 4.2, label: 'b', key: 'b' }
                    }]
                }]
            ]);
        });

        it('errors if reference is not a number', () => {

            const ref = Joi.ref('a');
            const schema = Joi.object({ a: Joi.string(), b: Joi.number().less(ref) });

            Helper.validate(schema, [
                [{ a: 'abc', b: 42 }, false, null, {
                    message: '"b" limit references "ref:a" which must be a number',
                    details: [{
                        message: '"b" limit references "ref:a" which must be a number',
                        path: ['b'],
                        type: 'any.ref',
                        context: { ref, label: 'b', key: 'b', value: 'abc', arg: 'limit', reason: 'must be a number' }
                    }]
                }]
            ]);
        });

        it('errors if reference is null', () => {

            const ref = Joi.ref('a');
            const schema = Joi.object({ a: Joi.any(), b: Joi.number().less(ref) });

            Helper.validate(schema, [
                [{ a: null, b: 42 }, false, null, {
                    message: '"b" limit references "ref:a" which must be a number',
                    details: [{
                        message: '"b" limit references "ref:a" which must be a number',
                        path: ['b'],
                        type: 'any.ref',
                        context: { ref, label: 'b', key: 'b', value: null, arg: 'limit', reason: 'must be a number' }
                    }]
                }]
            ]);
        });

        it('errors if context reference is not a number', () => {

            const ref = Joi.ref('$a');
            const schema = Joi.object({ a: Joi.string(), b: Joi.number().less(ref) });

            Helper.validate(schema, [
                [{ b: 42 }, false, { context: { a: 'abc' } }, {
                    message: '"b" limit references "ref:global:a" which must be a number',
                    details: [{
                        message: '"b" limit references "ref:global:a" which must be a number',
                        path: ['b'],
                        type: 'any.ref',
                        context: { ref, label: 'b', key: 'b', value: 'abc', arg: 'limit', reason: 'must be a number' }
                    }]
                }]
            ]);
        });
    });

    describe('max()', () => {

        it('throws when limit is not a number', () => {

            expect(() => {

                Joi.number().max('a');
            }).to.throw('limit must be a number or reference');
        });

        it('accepts references as max value', () => {

            const ref = Joi.ref('a');
            const schema = Joi.object({ a: Joi.number(), b: Joi.number().max(ref) });

            Helper.validate(schema, [
                [{ a: 1337, b: 42 }, true],
                [{ a: 42, b: 1337 }, false, null, {
                    message: '"b" must be less than or equal to ref:a',
                    details: [{
                        message: '"b" must be less than or equal to ref:a',
                        path: ['b'],
                        type: 'number.max',
                        context: { limit: ref, value: 1337, label: 'b', key: 'b' }
                    }]
                }],
                [{ a: '42', b: 1337 }, false, null, {
                    message: '"b" must be less than or equal to ref:a',
                    details: [{
                        message: '"b" must be less than or equal to ref:a',
                        path: ['b'],
                        type: 'number.max',
                        context: { limit: ref, value: 1337, label: 'b', key: 'b' }
                    }]
                }],
                [{ a: 4.2, b: 2.4 }, true],
                [{ a: 4.2, b: 4.20000001 }, false, null, {
                    message: '"b" must be less than or equal to ref:a',
                    details: [{
                        message: '"b" must be less than or equal to ref:a',
                        path: ['b'],
                        type: 'number.max',
                        context: { limit: ref, value: 4.20000001, label: 'b', key: 'b' }
                    }]
                }],
                [{ a: 4.20000001, b: 4.2 }, true],
                [{ a: 2.4, b: 4.2 }, false, null, {
                    message: '"b" must be less than or equal to ref:a',
                    details: [{
                        message: '"b" must be less than or equal to ref:a',
                        path: ['b'],
                        type: 'number.max',
                        context: { limit: ref, value: 4.2, label: 'b', key: 'b' }
                    }]
                }]
            ]);
        });

        it('accepts context references as max value', () => {

            const ref = Joi.ref('$a');
            const schema = Joi.object({ b: Joi.number().max(ref) });

            Helper.validate(schema, [
                [{ b: 42 }, true, { context: { a: 1337 } }],
                [{ b: 1337 }, false, { context: { a: 42 } }, {
                    message: '"b" must be less than or equal to ref:global:a',
                    details: [{
                        message: '"b" must be less than or equal to ref:global:a',
                        path: ['b'],
                        type: 'number.max',
                        context: { limit: ref, value: 1337, label: 'b', key: 'b' }
                    }]
                }],
                [{ b: 2.4 }, true, { context: { a: 4.2 } }],
                [{ b: 4.20000001 }, false, { context: { a: 4.2 } }, {
                    message: '"b" must be less than or equal to ref:global:a',
                    details: [{
                        message: '"b" must be less than or equal to ref:global:a',
                        path: ['b'],
                        type: 'number.max',
                        context: { limit: ref, value: 4.20000001, label: 'b', key: 'b' }
                    }]
                }],
                [{ b: 4.2 }, true, { context: { a: 4.20000001 } }],
                [{ b: 4.2 }, false, { context: { a: 2.4 } }, {
                    message: '"b" must be less than or equal to ref:global:a',
                    details: [{
                        message: '"b" must be less than or equal to ref:global:a',
                        path: ['b'],
                        type: 'number.max',
                        context: { limit: ref, value: 4.2, label: 'b', key: 'b' }
                    }]
                }]
            ]);
        });

        it('errors if reference is not a number', () => {

            const ref = Joi.ref('a');
            const schema = Joi.object({ a: Joi.string(), b: Joi.number().max(ref) });

            Helper.validate(schema, [
                [{ a: 'abc', b: 42 }, false, null, {
                    message: '"b" limit references "ref:a" which must be a number',
                    details: [{
                        message: '"b" limit references "ref:a" which must be a number',
                        path: ['b'],
                        type: 'any.ref',
                        context: { ref, label: 'b', key: 'b', value: 'abc', arg: 'limit', reason: 'must be a number' }
                    }]
                }]
            ]);
        });

        it('errors if context reference is not a number', () => {

            const ref = Joi.ref('$a');
            const schema = Joi.object({ b: Joi.number().max(ref) });

            Helper.validate(schema, [
                [{ b: 42 }, false, { context: { a: 'abc' } }, {
                    message: '"b" limit references "ref:global:a" which must be a number',
                    details: [{
                        message: '"b" limit references "ref:global:a" which must be a number',
                        path: ['b'],
                        type: 'any.ref',
                        context: { ref, label: 'b', key: 'b', value: 'abc', arg: 'limit', reason: 'must be a number' }
                    }]
                }]
            ]);
        });
    });

    describe('min()', () => {

        it('throws when limit is not a number', () => {

            expect(() => {

                Joi.number().min('a');
            }).to.throw('limit must be a number or reference');
        });

        it('throws when limit is null', () => {

            expect(() => {

                Joi.number().min(null);
            }).to.throw('limit must be a number or reference');
        });

        it('supports 64bit numbers', () => {

            const schema = Joi.number().min(1394035612500);
            const input = 1394035612552;

            expect(schema.validate(input)).to.equal({ value: input });
        });

        it('accepts references as min value', () => {

            const ref = Joi.ref('a');
            const schema = Joi.object({ a: Joi.number(), b: Joi.number().min(ref) });

            Helper.validate(schema, [
                [{ a: 42, b: 1337 }, true],
                [{ a: 1337, b: 42 }, false, null, {
                    message: '"b" must be larger than or equal to ref:a',
                    details: [{
                        message: '"b" must be larger than or equal to ref:a',
                        path: ['b'],
                        type: 'number.min',
                        context: { limit: ref, value: 42, label: 'b', key: 'b' }
                    }]
                }],
                [{ a: '1337', b: 42 }, false, null, {
                    message: '"b" must be larger than or equal to ref:a',
                    details: [{
                        message: '"b" must be larger than or equal to ref:a',
                        path: ['b'],
                        type: 'number.min',
                        context: { limit: ref, value: 42, label: 'b', key: 'b' }
                    }]
                }],
                [{ a: 2.4, b: 4.2 }, true],
                [{ a: 4.2, b: 4.20000001 }, true],
                [{ a: 4.20000001, b: 4.2 }, false, null, {
                    message: '"b" must be larger than or equal to ref:a',
                    details: [{
                        message: '"b" must be larger than or equal to ref:a',
                        path: ['b'],
                        type: 'number.min',
                        context: { limit: ref, value: 4.2, label: 'b', key: 'b' }
                    }]
                }],
                [{ a: 4.2, b: 2.4 }, false, null, {
                    message: '"b" must be larger than or equal to ref:a',
                    details: [{
                        message: '"b" must be larger than or equal to ref:a',
                        path: ['b'],
                        type: 'number.min',
                        context: { limit: ref, value: 2.4, label: 'b', key: 'b' }
                    }]
                }]
            ]);
        });

        it('accepts references as min value within a when', () => {

            const schema = Joi.object({
                a: Joi.number().required(),
                b: Joi.number().required(),
                c: Joi.number().required().when('a', {
                    is: Joi.number().min(Joi.ref('b')), // a >= b
                    then: Joi.number().valid(0)
                })
            });

            Helper.validate(schema, [
                [{ a: 0, b: 1, c: 42 }, true],
                [{ a: 1, b: 1, c: 0 }, true],
                [{ a: 2, b: 1, c: 0 }, true],
                [{ a: 1, b: 1, c: 42 }, false, null, {
                    message: '"c" must be [0]',
                    details: [{
                        message: '"c" must be [0]',
                        path: ['c'],
                        type: 'any.only',
                        context: { value: 42, valids: [0], label: 'c', key: 'c' }
                    }]
                }],
                [{ a: 2, b: 1, c: 42 }, false, null, {
                    message: '"c" must be [0]',
                    details: [{
                        message: '"c" must be [0]',
                        path: ['c'],
                        type: 'any.only',
                        context: { value: 42, valids: [0], label: 'c', key: 'c' }
                    }]
                }]
            ]);
        });

        it('accepts context references as min value', () => {

            const ref = Joi.ref('$a');
            const schema = Joi.object({ b: Joi.number().min(ref) });

            Helper.validate(schema, [
                [{ b: 1337 }, true, { context: { a: 42 } }],
                [{ b: 42 }, false, { context: { a: 1337 } }, {
                    message: '"b" must be larger than or equal to ref:global:a',
                    details: [{
                        message: '"b" must be larger than or equal to ref:global:a',
                        path: ['b'],
                        type: 'number.min',
                        context: { limit: ref, value: 42, label: 'b', key: 'b' }
                    }]
                }],
                [{ b: 4.2 }, true, { context: { a: 2.4 } }],
                [{ b: 4.20000001 }, true, { context: { a: 4.2 } }],
                [{ b: 4.2 }, false, { context: { a: 4.20000001 } }, {
                    message: '"b" must be larger than or equal to ref:global:a',
                    details: [{
                        message: '"b" must be larger than or equal to ref:global:a',
                        path: ['b'],
                        type: 'number.min',
                        context: { limit: ref, value: 4.2, label: 'b', key: 'b' }
                    }]
                }],
                [{ b: 2.4 }, false, { context: { a: 4.2 } }, {
                    message: '"b" must be larger than or equal to ref:global:a',
                    details: [{
                        message: '"b" must be larger than or equal to ref:global:a',
                        path: ['b'],
                        type: 'number.min',
                        context: { limit: ref, value: 2.4, label: 'b', key: 'b' }
                    }]
                }]
            ]);
        });

        it('errors if reference is not a number', () => {

            const ref = Joi.ref('a');
            const schema = Joi.object({ a: Joi.string(), b: Joi.number().min(ref) });

            Helper.validate(schema, [
                [{ a: 'abc', b: 42 }, false, null, {
                    message: '"b" limit references "ref:a" which must be a number',
                    details: [{
                        message: '"b" limit references "ref:a" which must be a number',
                        path: ['b'],
                        type: 'any.ref',
                        context: { ref, label: 'b', key: 'b', value: 'abc', arg: 'limit', reason: 'must be a number' }
                    }]
                }]
            ]);
        });

        it('errors if context reference is not a number', () => {

            const ref = Joi.ref('$a');
            const schema = Joi.object({ b: Joi.number().min(ref) });

            Helper.validate(schema, [
                [{ b: 42 }, false, { context: { a: 'abc' } }, {
                    message: '"b" limit references "ref:global:a" which must be a number',
                    details: [{
                        message: '"b" limit references "ref:global:a" which must be a number',
                        path: ['b'],
                        type: 'any.ref',
                        context: { ref, label: 'b', key: 'b', value: 'abc', arg: 'limit', reason: 'must be a number' }
                    }]
                }]
            ]);
        });
    });

    describe('multiple()', () => {

        it('throws when multiple is not a number', () => {

            expect(() => {

                Joi.number().multiple('a');
            }).to.throw('base must be a positive number or reference');
        });

        it('throws when multiple is 0', () => {

            expect(() => {

                Joi.number().multiple(0);
            }).to.throw('base must be a positive number or reference');
        });

        it('handles integer multiples correctly', () => {

            const rule = Joi.number().multiple(3);
            Helper.validate(rule, [
                [0, true], // 0 is a multiple of every integer
                [3, true],
                [4, false, null, {
                    message: '"value" must be a multiple of 3',
                    details: [{
                        message: '"value" must be a multiple of 3',
                        path: [],
                        type: 'number.multiple',
                        context: { multiple: 3, value: 4, label: 'value' }
                    }]
                }],
                [9, true],
                ['a', false, null, {
                    message: '"value" must be a number',
                    details: [{
                        message: '"value" must be a number',
                        path: [],
                        type: 'number.base',
                        context: { label: 'value', value: 'a' }
                    }]
                }],
                [9.1, false, null, {
                    message: '"value" must be a multiple of 3',
                    details: [{
                        message: '"value" must be a multiple of 3',
                        path: [],
                        type: 'number.multiple',
                        context: { multiple: 3, value: 9.1, label: 'value' }
                    }]
                }],
                [8.9, false, null, {
                    message: '"value" must be a multiple of 3',
                    details: [{
                        message: '"value" must be a multiple of 3',
                        path: [],
                        type: 'number.multiple',
                        context: { multiple: 3, value: 8.9, label: 'value' }
                    }]
                }]
            ]);
        });

        it('handles floats multiples correctly', () => {

            const schema = Joi.number().multiple(3.5);
            Helper.validate(schema, [
                [0, true], // 0 is a multiple of every integer
                [3.5, true],
                [3.6, false, null, {
                    message: '"value" must be a multiple of 3.5',
                    details: [{
                        message: '"value" must be a multiple of 3.5',
                        path: [],
                        type: 'number.multiple',
                        context: { multiple: 3.5, value: 3.6, label: 'value' }
                    }]
                }],
                [10.5, true],
                ['a', false, null, {
                    message: '"value" must be a number',
                    details: [{
                        message: '"value" must be a number',
                        path: [],
                        type: 'number.base',
                        context: { label: 'value', value: 'a' }
                    }]
                }],
                [10.501, false, null, {
                    message: '"value" must be a multiple of 3.5',
                    details: [{
                        message: '"value" must be a multiple of 3.5',
                        path: [],
                        type: 'number.multiple',
                        context: { multiple: 3.5, value: 10.501, label: 'value' }
                    }]
                }],
                [10.499, false, null, {
                    message: '"value" must be a multiple of 3.5',
                    details: [{
                        message: '"value" must be a multiple of 3.5',
                        path: [],
                        type: 'number.multiple',
                        context: { multiple: 3.5, value: 10.499, label: 'value' }
                    }]
                }]
            ]);
        });

        it('handles references correctly', () => {

            const ref = Joi.ref('a');
            const schema = Joi.object({ a: Joi.number(), b: Joi.number().multiple(ref) });
            Helper.validate(schema, [
                [{ a: 2, b: 32 }, true],
                [{ a: 43, b: 0 }, true],
                [{ a: 4, b: 25 }, false, null, {
                    message: '"b" must be a multiple of ref:a',
                    details: [{
                        message: '"b" must be a multiple of ref:a',
                        path: ['b'],
                        type: 'number.multiple',
                        context: { multiple: ref, value: 25, label: 'b', key: 'b' }
                    }]
                }],
                [{ a: 0, b: 0 }, false, null, {
                    message: '"b" base references "ref:a" which must be a positive number',
                    details: [{
                        message: '"b" base references "ref:a" which must be a positive number',
                        path: ['b'],
                        type: 'any.ref',
                        context: { ref, key: 'b', label: 'b', value: 0, arg: 'base', reason: 'must be a positive number' }
                    }]
                }]
            ]);
        });

        it('handles references correctly within a when', () => {

            const schema = Joi.object({
                a: Joi.number().required(),
                b: Joi.number().required(),
                c: Joi.number().required().when('a', {
                    is: Joi.number().multiple(Joi.ref('b')), // a % b === 0
                    then: Joi.number().valid(0)
                })
            });

            Helper.validate(schema, [
                [{ a: 2, b: 3, c: 42 }, true],
                [{ a: 2, b: 4, c: 42 }, true],
                [{ a: 4, b: 2, c: 0 }, true],
                [{ a: 4, b: 2, c: 42 }, false, null, {
                    message: '"c" must be [0]',
                    details: [{
                        message: '"c" must be [0]',
                        path: ['c'],
                        type: 'any.only',
                        context: { value: 42, valids: [0], label: 'c', key: 'c' }
                    }]
                }]
            ]);
        });

        it('handles non-number references correctly', () => {

            const ref = Joi.ref('a');
            const schema = Joi.object({ a: Joi.string(), b: Joi.number().multiple(ref) });
            Helper.validate(schema, [
                [{ a: 'test', b: 32 }, false, null, {
                    message: '"b" base references "ref:a" which must be a positive number',
                    details: [{
                        message: '"b" base references "ref:a" which must be a positive number',
                        path: ['b'],
                        type: 'any.ref',
                        context: { ref, label: 'b', key: 'b', value: 'test', arg: 'base', reason: 'must be a positive number' }
                    }]
                }],
                [{ a: 'test', b: 0 }, false, null, {
                    message: '"b" base references "ref:a" which must be a positive number',
                    details: [{
                        message: '"b" base references "ref:a" which must be a positive number',
                        path: ['b'],
                        type: 'any.ref',
                        context: { ref, label: 'b', key: 'b', value: 'test', arg: 'base', reason: 'must be a positive number' }
                    }]
                }],
                [{ a: 'test', b: NaN }, false, null, {
                    message: '"b" must be a number',
                    details: [{
                        message: '"b" must be a number',
                        path: ['b'],
                        type: 'number.base',
                        context: { label: 'b', key: 'b', value: NaN }
                    }]
                }]
            ]);
        });

        it('handles context references correctly', () => {

            const ref = Joi.ref('$a');
            const schema = Joi.object({ b: Joi.number().multiple(ref) });
            Helper.validate(schema, [
                [{ b: 32 }, true, { context: { a: 2 } }],
                [{ b: 0 }, true, { context: { a: 43 } }],
                [{ b: 25 }, false, { context: { a: 4 } }, {
                    message: '"b" must be a multiple of ref:global:a',
                    details: [{
                        message: '"b" must be a multiple of ref:global:a',
                        path: ['b'],
                        type: 'number.multiple',
                        context: { multiple: ref, value: 25, label: 'b', key: 'b' }
                    }]
                }],
                [{ b: 31 }, false, { context: { a: 0 } }, {
                    message: '"b" base references "ref:global:a" which must be a positive number',
                    details: [{
                        message: '"b" base references "ref:global:a" which must be a positive number',
                        path: ['b'],
                        type: 'any.ref',
                        context: { ref, key: 'b', label: 'b', value: 0, arg: 'base', reason: 'must be a positive number' }
                    }]
                }],
                [{ b: 0 }, false, { context: { a: 0 } }, {
                    message: '"b" base references "ref:global:a" which must be a positive number',
                    details: [{
                        message: '"b" base references "ref:global:a" which must be a positive number',
                        path: ['b'],
                        type: 'any.ref',
                        context: { ref, key: 'b', label: 'b', value: 0, arg: 'base', reason: 'must be a positive number' }
                    }]
                }],
                [{ b: 32 }, false, { context: { a: 'test' } }, {
                    message: '"b" base references "ref:global:a" which must be a positive number',
                    details: [{
                        message: '"b" base references "ref:global:a" which must be a positive number',
                        path: ['b'],
                        type: 'any.ref',
                        context: { ref, label: 'b', key: 'b', value: 'test', arg: 'base', reason: 'must be a positive number' }
                    }]
                }],
                [{ b: 0 }, false, { context: { a: 'test' } }, {
                    message: '"b" base references "ref:global:a" which must be a positive number',
                    details: [{
                        message: '"b" base references "ref:global:a" which must be a positive number',
                        path: ['b'],
                        type: 'any.ref',
                        context: { ref, label: 'b', key: 'b', value: 'test', arg: 'base', reason: 'must be a positive number' }
                    }]
                }],
                [{ b: 0 }, false, { context: { a: NaN } }, {
                    message: '"b" base references "ref:global:a" which must be a positive number',
                    details: [{
                        message: '"b" base references "ref:global:a" which must be a positive number',
                        path: ['b'],
                        type: 'any.ref',
                        context: { ref, label: 'b', key: 'b', value: NaN, arg: 'base', reason: 'must be a positive number' }
                    }]
                }]
            ]);
        });
    });

    describe('port()', () => {

        it('validates correctly', () => {

            const schema = Joi.object({ port: Joi.number().port() });

            Helper.validate(schema, [
                [{ port: 1337 }, true],
                [{ port: -1 }, false, null, {
                    message: '"port" must be a valid port',
                    details: [{
                        message: '"port" must be a valid port',
                        path: ['port'],
                        type: 'number.port',
                        context: { value: -1, label: 'port', key: 'port' }
                    }]
                }],
                [{ port: 65536 }, false, null, {
                    message: '"port" must be a valid port',
                    details: [{
                        message: '"port" must be a valid port',
                        path: ['port'],
                        type: 'number.port',
                        context: { value: 65536, label: 'port', key: 'port' }
                    }]
                }],
                [{ port: 8.88 }, false, null, {
                    message: '"port" must be a valid port',
                    details: [{
                        message: '"port" must be a valid port',
                        path: ['port'],
                        type: 'number.port',
                        context: { value: 8.88, label: 'port', key: 'port' }
                    }]
                }]
            ]);
        });
    });

    describe('precision()', () => {

        it('converts numbers', () => {

            const rule = Joi.number().precision(4);
            Helper.validate(rule, [
                [1.5, true, null, 1.5],
                [0.12345, true, null, 0.1235],
                [123456, true, null, 123456],
                [123456.123456, true, null, 123456.1235],
                ['123456.123456', true, null, 123456.1235],
                ['abc', false, null, {
                    message: '"value" must be a number',
                    details: [{
                        message: '"value" must be a number',
                        path: [],
                        type: 'number.base',
                        context: { label: 'value', value: 'abc' }
                    }]
                }],
                [NaN, false, null, {
                    message: '"value" must be a number',
                    details: [{
                        message: '"value" must be a number',
                        path: [],
                        type: 'number.base',
                        context: { label: 'value', value: NaN }
                    }]
                }]
            ]);
        });
    });

    describe('safe', () => {

        it('accepts safe numbers', () => {

            const t = Joi.number();
            Helper.validate(t, [
                [Number.MAX_SAFE_INTEGER, true, null, Number.MAX_SAFE_INTEGER],
                [Number.MIN_SAFE_INTEGER, true, null, Number.MIN_SAFE_INTEGER]
            ]);
        });
    });

    describe('validate()', () => {

        it('allows undefined', () => {

            Helper.validate(Joi.number(), [
                [undefined, true]
            ]);
        });

        it('denies undefined when .required()', () => {

            Helper.validate(Joi.number().required(), [
                [undefined, false, null, {
                    message: '"value" is required',
                    details: [{
                        message: '"value" is required',
                        path: [],
                        type: 'any.required',
                        context: { label: 'value' }
                    }]
                }]
            ]);
        });

        it('compares valid matching post-coerce value', () => {

            const schema = Joi.number().valid(1, 2, 3);
            expect(schema.validate('1')).to.equal({ value: 1 });
        });

        it('ignores invalid matching of pre-coerce value', () => {

            const schema = Joi.number().invalid('1');
            expect(schema.validate('1')).to.equal({ value: 1 });
        });

        it('returns false for denied value', () => {

            const text = Joi.number().invalid(50);
            const err = text.validate(50).error;
            expect(err).to.be.an.error('"value" contains an invalid value');
            expect(err.details).to.equal([{
                message: '"value" contains an invalid value',
                path: [],
                type: 'any.invalid',
                context: { value: 50, invalids: [50], label: 'value' }
            }]);
        });

        it('validates integer', () => {

            const t = Joi.number().integer();
            Helper.validate(t, [
                [100, true],
                [0, true],
                ['+42', true, null, 42],
                [null, false, null, {
                    message: '"value" must be a number',
                    details: [{
                        message: '"value" must be a number',
                        path: [],
                        type: 'number.base',
                        context: { label: 'value', value: null }
                    }]
                }],
                [1.02, false, null, {
                    message: '"value" must be an integer',
                    details: [{
                        message: '"value" must be an integer',
                        path: [],
                        type: 'number.integer',
                        context: { value: 1.02, label: 'value' }
                    }]
                }],
                [0.01, false, null, {
                    message: '"value" must be an integer',
                    details: [{
                        message: '"value" must be an integer',
                        path: [],
                        type: 'number.integer',
                        context: { value: 0.01, label: 'value' }
                    }]
                }],
                [-0, false, null, {
                    message: '"value" must be an integer',
                    details: [{
                        message: '"value" must be an integer',
                        path: [],
                        type: 'number.integer',
                        context: { value: -0, label: 'value' }
                    }]
                }]
            ]);
        });

        it('returns false for Infinity', () => {

            const t = Joi.number();
            Helper.validate(t, [
                [Infinity, false, null, {
                    message: '"value" cannot be infinity',
                    details: [{
                        message: '"value" cannot be infinity',
                        path: [],
                        type: 'number.infinity',
                        context: { value: Infinity, label: 'value' }
                    }]
                }],
                [-Infinity, false, null, {
                    message: '"value" cannot be infinity',
                    details: [{
                        message: '"value" cannot be infinity',
                        path: [],
                        type: 'number.infinity',
                        context: { value: -Infinity, label: 'value' }
                    }]
                }]
            ]);
        });

        it('returns true for allowed Infinity', () => {

            const t = Joi.number().allow(Infinity, -Infinity);
            Helper.validate(t, [
                [Infinity, true],
                [-Infinity, true]
            ]);
        });

        it('returns true for decimal numbers', () => {

            const t = Joi.number();
            Helper.validate(t, [
                [0.00000001, true, null, 0.00000001]
            ]);
        });

        it('can accept string numbers', () => {

            const t = Joi.number();
            Helper.validate(t, [
                ['1', true, null, 1],
                ['100', true, null, 100],
                ['+100', true, null, 100],
                ['+00100', true, null, 100],
                ['1e3', true, null, 1000],
                ['1e003', true, null, 1000],
                ['1e-003', true, null, 0.001],
                ['-1e+3', true, null, -1000],
                ['+1e-3', true, null, 0.001],
                ['1.0000', true, null, 1],
                ['1.10000', true, null, 1.1],
                ['1.1e4', true, null, 11000],
                ['1.100e4', true, null, 11000],
                ['100e3', true, null, 100000],
                ['-00100e3', true, null, -100000],
                ['-00100e-003', true, null, -0.1],
                ['-001231.0133210e003', true, null, -1231013.321],
                ['+001231.0133210e003', true, null, 1231013.321],
                ['0.00000095', true, null, 0.00000095],
                ['.5', true, null, 0.5],
                ['1 some text', false, null, {
                    message: '"value" must be a number',
                    details: [{
                        message: '"value" must be a number',
                        path: [],
                        type: 'number.base',
                        context: { label: 'value', value: '1 some text' }
                    }]
                }],
                ['\t\r', false, null, {
                    message: '"value" must be a number',
                    details: [{
                        message: '"value" must be a number',
                        path: [],
                        type: 'number.base',
                        context: { label: 'value', value: '\t\r' }
                    }]
                }],
                [' ', false, null, {
                    message: '"value" must be a number',
                    details: [{
                        message: '"value" must be a number',
                        path: [],
                        type: 'number.base',
                        context: { label: 'value', value: ' ' }
                    }]
                }],
                [' 2', true],
                ['\t\r43', true],
                ['43 ', true],
                ['', false, null, {
                    message: '"value" must be a number',
                    details: [{
                        message: '"value" must be a number',
                        path: [],
                        type: 'number.base',
                        context: { label: 'value', value: '' }
                    }]
                }]
            ]);
        });

        it('required validates correctly', () => {

            const t = Joi.number().required();
            Helper.validate(t, [
                [NaN, false, null, {
                    message: '"value" must be a number',
                    details: [{
                        message: '"value" must be a number',
                        path: [],
                        type: 'number.base',
                        context: { label: 'value', value: NaN }
                    }]
                }],
                ['100', true]
            ]);
        });

        it('converts an object string to a number', () => {

            const config = { a: Joi.number() };
            const obj = { a: '123' };

            expect(Joi.compile(config).validate(obj)).to.equal({ value: { a: 123 } });
        });

        it('converts a string to a number', () => {

            expect(Joi.number().validate('1')).to.equal({ value: 1 });
        });

        it('errors on null', () => {

            const err = Joi.number().validate(null).error;
            expect(err).to.be.an.error('"value" must be a number');
            expect(err.details).to.equal([{
                message: '"value" must be a number',
                path: [],
                type: 'number.base',
                context: { label: 'value', value: null }
            }]);
        });

        it('handles combination of min and max', () => {

            const rule = Joi.number().min(8).max(10);
            Helper.validate(rule, [
                [1, false, null, {
                    message: '"value" must be larger than or equal to 8',
                    details: [{
                        message: '"value" must be larger than or equal to 8',
                        path: [],
                        type: 'number.min',
                        context: { limit: 8, value: 1, label: 'value' }
                    }]
                }],
                [11, false, null, {
                    message: '"value" must be less than or equal to 10',
                    details: [{
                        message: '"value" must be less than or equal to 10',
                        path: [],
                        type: 'number.max',
                        context: { limit: 10, value: 11, label: 'value' }
                    }]
                }],
                [8, true],
                [9, true],
                [null, false, null, {
                    message: '"value" must be a number',
                    details: [{
                        message: '"value" must be a number',
                        path: [],
                        type: 'number.base',
                        context: { label: 'value', value: null }
                    }]
                }]
            ]);
        });

        it('handles combination of min, max, and null allowed', () => {

            const rule = Joi.number().min(8).max(10).allow(null);
            Helper.validate(rule, [
                [1, false, null, {
                    message: '"value" must be larger than or equal to 8',
                    details: [{
                        message: '"value" must be larger than or equal to 8',
                        path: [],
                        type: 'number.min',
                        context: { limit: 8, value: 1, label: 'value' }
                    }]
                }],
                [11, false, null, {
                    message: '"value" must be less than or equal to 10',
                    details: [{
                        message: '"value" must be less than or equal to 10',
                        path: [],
                        type: 'number.max',
                        context: { limit: 10, value: 11, label: 'value' }
                    }]
                }],
                [8, true],
                [9, true],
                [null, true]
            ]);
        });

        it('handles combination of min and positive', () => {

            const rule = Joi.number().min(-3).positive();
            Helper.validate(rule, [
                [1, true],
                [-2, false, null, {
                    message: '"value" must be a positive number',
                    details: [{
                        message: '"value" must be a positive number',
                        path: [],
                        type: 'number.positive',
                        context: { value: -2, label: 'value' }
                    }]
                }],
                [8, true],
                [null, false, null, {
                    message: '"value" must be a number',
                    details: [{
                        message: '"value" must be a number',
                        path: [],
                        type: 'number.base',
                        context: { label: 'value', value: null }
                    }]
                }]
            ]);
        });

        it('handles combination of max and positive', () => {

            const rule = Joi.number().max(5).positive();
            Helper.validate(rule, [
                [4, true],
                [-2, false, null, {
                    message: '"value" must be a positive number',
                    details: [{
                        message: '"value" must be a positive number',
                        path: [],
                        type: 'number.positive',
                        context: { value: -2, label: 'value' }
                    }]
                }],
                [8, false, null, {
                    message: '"value" must be less than or equal to 5',
                    details: [{
                        message: '"value" must be less than or equal to 5',
                        path: [],
                        type: 'number.max',
                        context: { limit: 5, value: 8, label: 'value' }
                    }]
                }],
                [null, false, null, {
                    message: '"value" must be a number',
                    details: [{
                        message: '"value" must be a number',
                        path: [],
                        type: 'number.base',
                        context: { label: 'value', value: null }
                    }]
                }]
            ]);
        });

        it('handles combination of min and negative', () => {

            const rule = Joi.number().min(-3).negative();
            Helper.validate(rule, [
                [4, false, null, {
                    message: '"value" must be a negative number',
                    details: [{
                        message: '"value" must be a negative number',
                        path: [],
                        type: 'number.negative',
                        context: { value: 4, label: 'value' }
                    }]
                }],
                [-2, true],
                [-4, false, null, {
                    message: '"value" must be larger than or equal to -3',
                    details: [{
                        message: '"value" must be larger than or equal to -3',
                        path: [],
                        type: 'number.min',
                        context: { limit: -3, value: -4, label: 'value' }
                    }]
                }],
                [null, false, null, {
                    message: '"value" must be a number',
                    details: [{
                        message: '"value" must be a number',
                        path: [],
                        type: 'number.base',
                        context: { label: 'value', value: null }
                    }]
                }]
            ]);
        });

        it('handles combination of negative and allow', () => {

            const rule = Joi.number().negative().allow(1);
            Helper.validate(rule, [
                [1, true],
                [-10, true],
                [8, false, null, {
                    message: '"value" must be a negative number',
                    details: [{
                        message: '"value" must be a negative number',
                        path: [],
                        type: 'number.negative',
                        context: { value: 8, label: 'value' }
                    }]
                }],
                [0, false, null, {
                    message: '"value" must be a negative number',
                    details: [{
                        message: '"value" must be a negative number',
                        path: [],
                        type: 'number.negative',
                        context: { value: 0, label: 'value' }
                    }]
                }],
                [null, false, null, {
                    message: '"value" must be a number',
                    details: [{
                        message: '"value" must be a number',
                        path: [],
                        type: 'number.base',
                        context: { label: 'value', value: null }
                    }]
                }]
            ]);
        });

        it('handles combination of positive and allow', () => {

            const rule = Joi.number().positive().allow(-1);
            Helper.validate(rule, [
                [1, true],
                [-1, true],
                [8, true],
                [-10, false, null, {
                    message: '"value" must be a positive number',
                    details: [{
                        message: '"value" must be a positive number',
                        path: [],
                        type: 'number.positive',
                        context: { value: -10, label: 'value' }
                    }]
                }],
                [null, false, null, {
                    message: '"value" must be a number',
                    details: [{
                        message: '"value" must be a number',
                        path: [],
                        type: 'number.base',
                        context: { label: 'value', value: null }
                    }]
                }]
            ]);
        });

        it('handles combination of positive, allow, and null allowed', () => {

            const rule = Joi.number().positive().allow(-1).allow(null);
            Helper.validate(rule, [
                [1, true],
                [-1, true],
                [8, true],
                [-10, false, null, {
                    message: '"value" must be a positive number',
                    details: [{
                        message: '"value" must be a positive number',
                        path: [],
                        type: 'number.positive',
                        context: { value: -10, label: 'value' }
                    }]
                }],
                [null, true]
            ]);
        });

        it('handles combination of negative, allow, and null allowed', () => {

            const rule = Joi.number().negative().allow(1).allow(null);
            Helper.validate(rule, [
                [1, true],
                [-10, true],
                [8, false, null, {
                    message: '"value" must be a negative number',
                    details: [{
                        message: '"value" must be a negative number',
                        path: [],
                        type: 'number.negative',
                        context: { value: 8, label: 'value' }
                    }]
                }],
                [0, false, null, {
                    message: '"value" must be a negative number',
                    details: [{
                        message: '"value" must be a negative number',
                        path: [],
                        type: 'number.negative',
                        context: { value: 0, label: 'value' }
                    }]
                }],
                [null, true]
            ]);
        });

        it('handles combination of positive, allow, null allowed, and invalid', () => {

            const rule = Joi.number().positive().allow(-1).allow(null).invalid(1);
            Helper.validate(rule, [
                [1, false, null, {
                    message: '"value" contains an invalid value',
                    details: [{
                        message: '"value" contains an invalid value',
                        path: [],
                        type: 'any.invalid',
                        context: { value: 1, invalids: [1], label: 'value' }
                    }]
                }],
                [-1, true],
                [8, true],
                [-10, false, null, {
                    message: '"value" must be a positive number',
                    details: [{
                        message: '"value" must be a positive number',
                        path: [],
                        type: 'number.positive',
                        context: { value: -10, label: 'value' }
                    }]
                }],
                [null, true]
            ]);
        });

        it('handles combination of negative, allow, null allowed, and invalid', () => {

            const rule = Joi.number().negative().allow(1).allow(null).invalid(-5);
            Helper.validate(rule, [
                [1, true],
                [-10, true],
                [-5, false, null, {
                    message: '"value" contains an invalid value',
                    details: [{
                        message: '"value" contains an invalid value',
                        path: [],
                        type: 'any.invalid',
                        context: { value: -5, invalids: [-5], label: 'value' }
                    }]
                }],
                [8, false, null, {
                    message: '"value" must be a negative number',
                    details: [{
                        message: '"value" must be a negative number',
                        path: [],
                        type: 'number.negative',
                        context: { value: 8, label: 'value' }
                    }]
                }],
                [0, false, null, {
                    message: '"value" must be a negative number',
                    details: [{
                        message: '"value" must be a negative number',
                        path: [],
                        type: 'number.negative',
                        context: { value: 0, label: 'value' }
                    }]
                }],
                [null, true]
            ]);
        });

        it('handles combination of min, max, and allow', () => {

            const rule = Joi.number().min(8).max(10).allow(1);
            Helper.validate(rule, [
                [1, true],
                [11, false, null, {
                    message: '"value" must be less than or equal to 10',
                    details: [{
                        message: '"value" must be less than or equal to 10',
                        path: [],
                        type: 'number.max',
                        context: { limit: 10, value: 11, label: 'value' }
                    }]
                }],
                [8, true],
                [9, true],
                [null, false, null, {
                    message: '"value" must be a number',
                    details: [{
                        message: '"value" must be a number',
                        path: [],
                        type: 'number.base',
                        context: { label: 'value', value: null }
                    }]
                }]
            ]);
        });

        it('handles combination of min, max, allow, and null allowed', () => {

            const rule = Joi.number().min(8).max(10).allow(1).allow(null);
            Helper.validate(rule, [
                [1, true],
                [11, false, null, {
                    message: '"value" must be less than or equal to 10',
                    details: [{
                        message: '"value" must be less than or equal to 10',
                        path: [],
                        type: 'number.max',
                        context: { limit: 10, value: 11, label: 'value' }
                    }]
                }],
                [8, true],
                [9, true],
                [null, true]
            ]);
        });

        it('handles combination of min, max, allow, and invalid', () => {

            const rule = Joi.number().min(8).max(10).allow(1).invalid(9);
            Helper.validate(rule, [
                [1, true],
                [11, false, null, {
                    message: '"value" must be less than or equal to 10',
                    details: [{
                        message: '"value" must be less than or equal to 10',
                        path: [],
                        type: 'number.max',
                        context: { limit: 10, value: 11, label: 'value' }
                    }]
                }],
                [8, true],
                [9, false, null, {
                    message: '"value" contains an invalid value',
                    details: [{
                        message: '"value" contains an invalid value',
                        path: [],
                        type: 'any.invalid',
                        context: { value: 9, invalids: [9], label: 'value' }
                    }]
                }],
                [null, false, null, {
                    message: '"value" must be a number',
                    details: [{
                        message: '"value" must be a number',
                        path: [],
                        type: 'number.base',
                        context: { label: 'value', value: null }
                    }]
                }]
            ]);
        });

        it('handles combination of min, max, allow, invalid, and null allowed', () => {

            const rule = Joi.number().min(8).max(10).allow(1).invalid(9).allow(null);
            Helper.validate(rule, [
                [1, true],
                [11, false, null, {
                    message: '"value" must be less than or equal to 10',
                    details: [{
                        message: '"value" must be less than or equal to 10',
                        path: [],
                        type: 'number.max',
                        context: { limit: 10, value: 11, label: 'value' }
                    }]
                }],
                [8, true],
                [9, false, null, {
                    message: '"value" contains an invalid value',
                    details: [{
                        message: '"value" contains an invalid value',
                        path: [],
                        type: 'any.invalid',
                        context: { value: 9, invalids: [9], label: 'value' }
                    }]
                }],
                [null, true]
            ]);
        });

        it('handles combination of min, max, and integer', () => {

            const rule = Joi.number().min(8).max(10).integer();
            Helper.validate(rule, [
                [1, false, null, {
                    message: '"value" must be larger than or equal to 8',
                    details: [{
                        message: '"value" must be larger than or equal to 8',
                        path: [],
                        type: 'number.min',
                        context: { limit: 8, value: 1, label: 'value' }
                    }]
                }],
                [11, false, null, {
                    message: '"value" must be less than or equal to 10',
                    details: [{
                        message: '"value" must be less than or equal to 10',
                        path: [],
                        type: 'number.max',
                        context: { limit: 10, value: 11, label: 'value' }
                    }]
                }],
                [8, true],
                [9, true],
                [9.1, false, null, {
                    message: '"value" must be an integer',
                    details: [{
                        message: '"value" must be an integer',
                        path: [],
                        type: 'number.integer',
                        context: { value: 9.1, label: 'value' }
                    }]
                }],
                [null, false, null, {
                    message: '"value" must be a number',
                    details: [{
                        message: '"value" must be a number',
                        path: [],
                        type: 'number.base',
                        context: { label: 'value', value: null }
                    }]
                }]
            ]);
        });

        it('handles combination of min, max, integer, and allow', () => {

            const rule = Joi.number().min(8).max(10).integer().allow(9.1);
            Helper.validate(rule, [
                [1, false, null, {
                    message: '"value" must be larger than or equal to 8',
                    details: [{
                        message: '"value" must be larger than or equal to 8',
                        path: [],
                        type: 'number.min',
                        context: { limit: 8, value: 1, label: 'value' }
                    }]
                }],
                [11, false, null, {
                    message: '"value" must be less than or equal to 10',
                    details: [{
                        message: '"value" must be less than or equal to 10',
                        path: [],
                        type: 'number.max',
                        context: { limit: 10, value: 11, label: 'value' }
                    }]
                }],
                [8, true],
                [9, true],
                [9.1, true],
                [9.2, false, null, {
                    message: '"value" must be an integer',
                    details: [{
                        message: '"value" must be an integer',
                        path: [],
                        type: 'number.integer',
                        context: { value: 9.2, label: 'value' }
                    }]
                }],
                [null, false, null, {
                    message: '"value" must be a number',
                    details: [{
                        message: '"value" must be a number',
                        path: [],
                        type: 'number.base',
                        context: { label: 'value', value: null }
                    }]
                }]
            ]);
        });

        it('handles combination of min, max, integer, allow, and invalid', () => {

            const rule = Joi.number().min(8).max(10).integer().allow(9.1).invalid(8);
            Helper.validate(rule, [
                [1, false, null, {
                    message: '"value" must be larger than or equal to 8',
                    details: [{
                        message: '"value" must be larger than or equal to 8',
                        path: [],
                        type: 'number.min',
                        context: { limit: 8, value: 1, label: 'value' }
                    }]
                }],
                [11, false, null, {
                    message: '"value" must be less than or equal to 10',
                    details: [{
                        message: '"value" must be less than or equal to 10',
                        path: [],
                        type: 'number.max',
                        context: { limit: 10, value: 11, label: 'value' }
                    }]
                }],
                [8, false, null, {
                    message: '"value" contains an invalid value',
                    details: [{
                        message: '"value" contains an invalid value',
                        path: [],
                        type: 'any.invalid',
                        context: { value: 8, invalids: [8], label: 'value' }
                    }]
                }],
                [9, true],
                [9.1, true],
                [9.2, false, null, {
                    message: '"value" must be an integer',
                    details: [{
                        message: '"value" must be an integer',
                        path: [],
                        type: 'number.integer',
                        context: { value: 9.2, label: 'value' }
                    }]
                }],
                [null, false, null, {
                    message: '"value" must be a number',
                    details: [{
                        message: '"value" must be a number',
                        path: [],
                        type: 'number.base',
                        context: { label: 'value', value: null }
                    }]
                }]
            ]);
        });

        it('handles combination of min, max, integer, allow, invalid, and null allowed', () => {

            const rule = Joi.number().min(8).max(10).integer().allow(9.1).invalid(8).allow(null);
            Helper.validate(rule, [
                [1, false, null, {
                    message: '"value" must be larger than or equal to 8',
                    details: [{
                        message: '"value" must be larger than or equal to 8',
                        path: [],
                        type: 'number.min',
                        context: { limit: 8, value: 1, label: 'value' }
                    }]
                }],
                [11, false, null, {
                    message: '"value" must be less than or equal to 10',
                    details: [{
                        message: '"value" must be less than or equal to 10',
                        path: [],
                        type: 'number.max',
                        context: { limit: 10, value: 11, label: 'value' }
                    }]
                }],
                [8, false, null, {
                    message: '"value" contains an invalid value',
                    details: [{
                        message: '"value" contains an invalid value',
                        path: [],
                        type: 'any.invalid',
                        context: { value: 8, invalids: [8], label: 'value' }
                    }]
                }],
                [9, true],
                [9.1, true],
                [9.2, false, null, {
                    message: '"value" must be an integer',
                    details: [{
                        message: '"value" must be an integer',
                        path: [],
                        type: 'number.integer',
                        context: { value: 9.2, label: 'value' }
                    }]
                }],
                [null, true]
            ]);
        });

        it('handles limiting the number of decimal places', () => {

            const rule = Joi.number().precision(1).prefs({ convert: false });
            Helper.validate(rule, [
                [1, true],
                [9.1, true],
                [9.21, false, null, {
                    message: '"value" must have no more than 1 decimal places',
                    details: [{
                        message: '"value" must have no more than 1 decimal places',
                        path: [],
                        type: 'number.precision',
                        context: { limit: 1, value: 9.21, label: 'value' }
                    }]
                }],
                [9.9999, false, null, {
                    message: '"value" must have no more than 1 decimal places',
                    details: [{
                        message: '"value" must have no more than 1 decimal places',
                        path: [],
                        type: 'number.precision',
                        context: { limit: 1, value: 9.9999, label: 'value' }
                    }]
                }],
                [9.9e-99, false, null, {
                    message: '"value" must have no more than 1 decimal places',
                    details: [{
                        message: '"value" must have no more than 1 decimal places',
                        path: [],
                        type: 'number.precision',
                        context: { limit: 1, value: 9.9e-99, label: 'value' }
                    }]
                }],
                [9.9e3, true],
                [null, false, null, {
                    message: '"value" must be a number',
                    details: [{
                        message: '"value" must be a number',
                        path: [],
                        type: 'number.base',
                        context: { label: 'value', value: null }
                    }]
                }]
            ]);
        });

        it('handles combination of min, max, integer, allow, invalid, null allowed and precision', () => {

            const rule = Joi.number().min(8).max(10).integer().allow(9.1).invalid(8).allow(null).precision(1).prefs({ convert: false });
            Helper.validate(rule, [
                [1, false, null, {
                    message: '"value" must be larger than or equal to 8',
                    details: [{
                        message: '"value" must be larger than or equal to 8',
                        path: [],
                        type: 'number.min',
                        context: { limit: 8, value: 1, label: 'value' }
                    }]
                }],
                [11, false, null, {
                    message: '"value" must be less than or equal to 10',
                    details: [{
                        message: '"value" must be less than or equal to 10',
                        path: [],
                        type: 'number.max',
                        context: { limit: 10, value: 11, label: 'value' }
                    }]
                }],
                [8, false, null, {
                    message: '"value" contains an invalid value',
                    details: [{
                        message: '"value" contains an invalid value',
                        path: [],
                        type: 'any.invalid',
                        context: { value: 8, invalids: [8], label: 'value' }
                    }]
                }],
                [9, true],
                [9.1, true],
                [9.11, false, null, {
                    message: '"value" must be an integer',
                    details: [{
                        message: '"value" must be an integer',
                        path: [],
                        type: 'number.integer',
                        context: { value: 9.11, label: 'value' }
                    }]
                }],
                [9.2, false, null, {
                    message: '"value" must be an integer',
                    details: [{
                        message: '"value" must be an integer',
                        path: [],
                        type: 'number.integer',
                        context: { value: 9.2, label: 'value' }
                    }]
                }],
                [9.22, false, null, {
                    message: '"value" must be an integer',
                    details: [{
                        message: '"value" must be an integer',
                        path: [],
                        type: 'number.integer',
                        context: { value: 9.22, label: 'value' }
                    }]
                }],
                [null, true]
            ]);
        });

        it('handles combination of greater and less', () => {

            const rule = Joi.number().greater(5).less(10);
            Helper.validate(rule, [
                [0, false, null, {
                    message: '"value" must be greater than 5',
                    details: [{
                        message: '"value" must be greater than 5',
                        path: [],
                        type: 'number.greater',
                        context: { limit: 5, value: 0, label: 'value' }
                    }]
                }],
                [11, false, null, {
                    message: '"value" must be less than 10',
                    details: [{
                        message: '"value" must be less than 10',
                        path: [],
                        type: 'number.less',
                        context: { limit: 10, value: 11, label: 'value' }
                    }]
                }],
                [5, false, null, {
                    message: '"value" must be greater than 5',
                    details: [{
                        message: '"value" must be greater than 5',
                        path: [],
                        type: 'number.greater',
                        context: { limit: 5, value: 5, label: 'value' }
                    }]
                }],
                [10, false, null, {
                    message: '"value" must be less than 10',
                    details: [{
                        message: '"value" must be less than 10',
                        path: [],
                        type: 'number.less',
                        context: { limit: 10, value: 10, label: 'value' }
                    }]
                }],
                [8, true],
                [5.01, true],
                [9.99, true],
                [null, false, null, {
                    message: '"value" must be a number',
                    details: [{
                        message: '"value" must be a number',
                        path: [],
                        type: 'number.base',
                        context: { label: 'value', value: null }
                    }]
                }]
            ]);
        });

        it('handles combination of greater, less, and integer', () => {

            const rule = Joi.number().integer().greater(5).less(10);
            Helper.validate(rule, [
                [0, false, null, {
                    message: '"value" must be greater than 5',
                    details: [{
                        message: '"value" must be greater than 5',
                        path: [],
                        type: 'number.greater',
                        context: { limit: 5, value: 0, label: 'value' }
                    }]
                }],
                [11, false, null, {
                    message: '"value" must be less than 10',
                    details: [{
                        message: '"value" must be less than 10',
                        path: [],
                        type: 'number.less',
                        context: { limit: 10, value: 11, label: 'value' }
                    }]
                }],
                [5, false, null, {
                    message: '"value" must be greater than 5',
                    details: [{
                        message: '"value" must be greater than 5',
                        path: [],
                        type: 'number.greater',
                        context: { limit: 5, value: 5, label: 'value' }
                    }]
                }],
                [10, false, null, {
                    message: '"value" must be less than 10',
                    details: [{
                        message: '"value" must be less than 10',
                        path: [],
                        type: 'number.less',
                        context: { limit: 10, value: 10, label: 'value' }
                    }]
                }],
                [6, true],
                [9, true],
                [5.01, false, null, {
                    message: '"value" must be an integer',
                    details: [{
                        message: '"value" must be an integer',
                        path: [],
                        type: 'number.integer',
                        context: { value: 5.01, label: 'value' }
                    }]
                }],
                [9.99, false, null, {
                    message: '"value" must be an integer',
                    details: [{
                        message: '"value" must be an integer',
                        path: [],
                        type: 'number.integer',
                        context: { value: 9.99, label: 'value' }
                    }]
                }]
            ]);
        });

        it('handles combination of greater, less, and null allowed', () => {

            const rule = Joi.number().greater(5).less(10).allow(null);
            Helper.validate(rule, [
                [0, false, null, {
                    message: '"value" must be greater than 5',
                    details: [{
                        message: '"value" must be greater than 5',
                        path: [],
                        type: 'number.greater',
                        context: { limit: 5, value: 0, label: 'value' }
                    }]
                }],
                [11, false, null, {
                    message: '"value" must be less than 10',
                    details: [{
                        message: '"value" must be less than 10',
                        path: [],
                        type: 'number.less',
                        context: { limit: 10, value: 11, label: 'value' }
                    }]
                }],
                [5, false, null, {
                    message: '"value" must be greater than 5',
                    details: [{
                        message: '"value" must be greater than 5',
                        path: [],
                        type: 'number.greater',
                        context: { limit: 5, value: 5, label: 'value' }
                    }]
                }],
                [10, false, null, {
                    message: '"value" must be less than 10',
                    details: [{
                        message: '"value" must be less than 10',
                        path: [],
                        type: 'number.less',
                        context: { limit: 10, value: 10, label: 'value' }
                    }]
                }],
                [8, true],
                [5.01, true],
                [9.99, true],
                [null, true]
            ]);
        });

        it('handles combination of greater, less, invalid, and allow', () => {

            const rule = Joi.number().greater(5).less(10).invalid(6).allow(-3);
            Helper.validate(rule, [
                [0, false, null, {
                    message: '"value" must be greater than 5',
                    details: [{
                        message: '"value" must be greater than 5',
                        path: [],
                        type: 'number.greater',
                        context: { limit: 5, value: 0, label: 'value' }
                    }]
                }],
                [11, false, null, {
                    message: '"value" must be less than 10',
                    details: [{
                        message: '"value" must be less than 10',
                        path: [],
                        type: 'number.less',
                        context: { limit: 10, value: 11, label: 'value' }
                    }]
                }],
                [5, false, null, {
                    message: '"value" must be greater than 5',
                    details: [{
                        message: '"value" must be greater than 5',
                        path: [],
                        type: 'number.greater',
                        context: { limit: 5, value: 5, label: 'value' }
                    }]
                }],
                [10, false, null, {
                    message: '"value" must be less than 10',
                    details: [{
                        message: '"value" must be less than 10',
                        path: [],
                        type: 'number.less',
                        context: { limit: 10, value: 10, label: 'value' }
                    }]
                }],
                [6, false, null, {
                    message: '"value" contains an invalid value',
                    details: [{
                        message: '"value" contains an invalid value',
                        path: [],
                        type: 'any.invalid',
                        context: { value: 6, invalids: [6], label: 'value' }
                    }]
                }],
                [8, true],
                [5.01, true],
                [9.99, true],
                [-3, true],
                [null, false, null, {
                    message: '"value" must be a number',
                    details: [{
                        message: '"value" must be a number',
                        path: [],
                        type: 'number.base',
                        context: { label: 'value', value: null }
                    }]
                }]
            ]);
        });
    });

    describe('unsafe', () => {

        it('returns the same instance if nothing changed', () => {

            const schema = Joi.number();
            expect(schema.unsafe(false)).to.shallow.equal(schema);
            expect(schema.unsafe()).to.not.shallow.equal(schema);
            expect(schema.unsafe(true)).to.not.shallow.equal(schema);
        });

        it('checks unsafe numbers', () => {

            const t = Joi.number();
            Helper.validate(t, [
                ['-0', true, null, 0],
                ['9007199254740981.1', false, null, {
                    message: '"value" must be a safe number',
                    details: [{
                        message: '"value" must be a safe number',
                        path: [],
                        type: 'number.unsafe',
                        context: { value: '9007199254740981.1', label: 'value' }
                    }]
                }],
                ['90071992547409811e-1', false, null, {
                    message: '"value" must be a safe number',
                    details: [{
                        message: '"value" must be a safe number',
                        path: [],
                        type: 'number.unsafe',
                        context: { value: '90071992547409811e-1', label: 'value' }
                    }]
                }],
                ['9007199254740992', false, null, {
                    message: '"value" must be a safe number',
                    details: [{
                        message: '"value" must be a safe number',
                        path: [],
                        type: 'number.unsafe',
                        context: { value: 9007199254740992, label: 'value' }
                    }]
                }],
                ['-9007199254740992', false, null, {
                    message: '"value" must be a safe number',
                    details: [{
                        message: '"value" must be a safe number',
                        path: [],
                        type: 'number.unsafe',
                        context: { value: -9007199254740992, label: 'value' }
                    }]
                }],
                ['90.071992549e+15', false, null, {
                    message: '"value" must be a safe number',
                    details: [{
                        message: '"value" must be a safe number',
                        path: [],
                        type: 'number.unsafe',
                        context: { value: 90071992549000000, label: 'value' }
                    }]
                }],
                [9007199254740992, false, null, {
                    message: '"value" must be a safe number',
                    details: [{
                        message: '"value" must be a safe number',
                        path: [],
                        type: 'number.unsafe',
                        context: { value: 9007199254740992, label: 'value' }
                    }]
                }],
                [-9007199254740992, false, null, {
                    message: '"value" must be a safe number',
                    details: [{
                        message: '"value" must be a safe number',
                        path: [],
                        type: 'number.unsafe',
                        context: { value: -9007199254740992, label: 'value' }
                    }]
                }]
            ]);
        });

        it('accepts unsafe numbers with a loss of precision when disabled', () => {

            const t = Joi.number().unsafe();
            Helper.validate(t, [
                ['9007199254740981.1', true, null, 9007199254740981],
                ['9007199254740992', true, null, 9007199254740992],
                ['-9007199254740992', true, null, -9007199254740992],
                ['90.071992549e+15', true, null, 90071992549000000],
                [9007199254740992, true, null, 9007199254740992],
                [-9007199254740992, true, null, -9007199254740992]
            ]);
        });
    });
});
