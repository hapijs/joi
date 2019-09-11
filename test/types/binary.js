'use strict';

const Code = require('@hapi/code');
const Lab = require('@hapi/lab');
const Joi = require('../..');

const Helper = require('../helper');


const internals = {};


const { describe, it } = exports.lab = Lab.script();
const { expect } = Code;


describe('binary', () => {

    it('should throw an exception if arguments were passed.', () => {

        expect(() => Joi.binary('invalid argument.')).to.throw('The binary type does not allow arguments');
    });

    it('converts a string to a buffer', () => {

        const value = Joi.binary().validate('test').value;
        expect(value instanceof Buffer).to.equal(true);
        expect(value.length).to.equal(4);
        expect(value.toString('utf8')).to.equal('test');
    });

    it('validates allowed buffer content', () => {

        const hello = Buffer.from('hello');
        const schema = Joi.binary().valid(hello);

        Helper.validate(schema, [
            ['hello', true, Buffer.from('hello')],
            [hello, true],
            [Buffer.from('hello'), true],
            ['goodbye', false, {
                message: '"value" must be [hello]',
                path: [],
                type: 'any.only',
                context: { value: Buffer.from('goodbye'), valids: [hello], label: 'value' }
            }],
            [Buffer.from('goodbye'), false, {
                message: '"value" must be [hello]',
                path: [],
                type: 'any.only',
                context: { value: Buffer.from('goodbye'), valids: [hello], label: 'value' }
            }],
            [Buffer.from('HELLO'), false, {
                message: '"value" must be [hello]',
                path: [],
                type: 'any.only',
                context: { value: Buffer.from('HELLO'), valids: [hello], label: 'value' }
            }]
        ]);
    });

    describe('cast()', () => {

        it('casts value to string', () => {

            const schema = Joi.binary().cast('string');

            Helper.validate(schema, [
                [Buffer.from('test'), true, 'test']
            ]);
        });

        it('casts value to string (in object)', () => {

            const schema = Joi.object({
                a: Joi.binary().cast('string')
            });

            Helper.validate(schema, [
                [{ a: Buffer.from('test') }, true, { a: 'test' }],
                [{}, true]
            ]);
        });

        it('ignores null', () => {

            const schema = Joi.binary().allow(null).cast('string');

            Helper.validate(schema, [
                [null, true]
            ]);
        });

        it('ignores string', () => {

            const schema = Joi.binary().allow('x').cast('string');

            Helper.validate(schema, [
                ['x', true]
            ]);
        });

        it('does not leak casts to any', () => {

            expect(() => Joi.any().cast('string')).to.throw('Type any does not support casting to string');
        });
    });

    describe('validate()', () => {

        it('returns an error when a non-buffer or non-string is used', () => {

            Helper.validate(Joi.binary(), [
                [5, false, {
                    message: '"value" must be a buffer or a string',
                    path: [],
                    type: 'binary.base',
                    context: { label: 'value', value: 5 }
                }]
            ]);
        });

        it('accepts a buffer object', () => {

            Helper.validate(Joi.binary(), [
                [Buffer.from('hello world'), true]
            ]);
        });

        it('accepts a buffer object in strict mode', () => {

            Helper.validate(Joi.binary().strict(), [
                [Buffer.from('hello world'), true],
                ['hello world', false, '"value" must be a buffer or a string']
            ]);
        });
    });

    describe('encoding()', () => {

        it('applies encoding', () => {

            const schema = Joi.binary().encoding('base64');

            Helper.validate(schema, [
                [Buffer.from('abcdef'), true]
            ]);
        });

        it('throws when encoding is invalid', () => {

            expect(() => Joi.binary().encoding('base6')).to.throw('Invalid encoding: base6');
        });

        it('avoids unnecessary cloning when called twice', () => {

            const schema = Joi.binary().encoding('base64');
            expect(schema.encoding('base64')).to.shallow.equal(schema);
        });
    });

    describe('min()', () => {

        it('validates buffer size', () => {

            const schema = Joi.binary().min(5);

            Helper.validate(schema, [
                [Buffer.from('testing'), true],
                [Buffer.from('test'), false, {
                    message: '"value" must be at least 5 bytes',
                    path: [],
                    type: 'binary.min',
                    context: { limit: 5, value: Buffer.from('test'), label: 'value' }
                }]
            ]);
        });

        it('throws when min is not a number', () => {

            expect(() => Joi.binary().min('a')).to.throw('limit must be a positive integer or reference');
        });

        it('throws when min is not an integer', () => {

            expect(() => Joi.binary().min(1.2)).to.throw('limit must be a positive integer or reference');
        });
    });

    describe('max()', () => {

        it('validates buffer size', () => {

            const schema = Joi.binary().max(5);

            Helper.validate(schema, [
                [Buffer.from('testing'), false, {
                    message: '"value" must be less than or equal to 5 bytes',
                    path: [],
                    type: 'binary.max',
                    context: {
                        limit: 5,
                        value: Buffer.from('testing'),
                        label: 'value'
                    }
                }],
                [Buffer.from('test'), true]
            ]);
        });

        it('throws when max is not a number', () => {

            expect(() => Joi.binary().max('a')).to.throw('limit must be a positive integer or reference');
        });

        it('throws when max is not an integer', () => {

            expect(() => Joi.binary().max(1.2)).to.throw('limit must be a positive integer or reference');
        });
    });

    describe('length()', () => {

        it('validates buffer size', () => {

            const schema = Joi.binary().length(4);

            Helper.validate(schema, [
                [Buffer.from('test'), true],
                [Buffer.from('testing'), false, {
                    message: '"value" must be 4 bytes',
                    path: [],
                    type: 'binary.length',
                    context: {
                        limit: 4,
                        value: Buffer.from('testing'),
                        label: 'value'
                    }
                }]
            ]);
        });

        it('throws when length is not a number', () => {

            expect(() => Joi.binary().length('a')).to.throw('limit must be a positive integer or reference');
        });

        it('throws when length is not an integer', () => {

            expect(() => Joi.binary().length(1.2)).to.throw('limit must be a positive integer or reference');
        });
    });
});
