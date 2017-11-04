'use strict';

// Load modules

const Lab = require('lab');
const Joi = require('../..');
const Helper = require('../helper');


// Declare internals

const internals = {};


// Test shortcuts

const { describe, it, expect } = exports.lab = Lab.script();


describe('binary', () => {

    it('can be called on its own', () => {

        const binary = Joi.binary;
        expect(() => binary()).to.throw('Must be invoked on a Joi instance.');
    });

    it('should throw an exception if arguments were passed.', () => {

        expect(
            () => Joi.binary('invalid argument.')
        ).to.throw('Joi.binary() does not allow arguments.');
    });

    it('converts a string to a buffer', async () => {

        const value = await Joi.binary().validate('test');
        expect(value instanceof Buffer).to.equal(true);
        expect(value.length).to.equal(4);
        expect(value.toString('utf8')).to.equal('test');
    });

    it('validates allowed buffer content', () => {

        const hello = new Buffer('hello');
        const schema = Joi.binary().valid(hello);

        Helper.validate(schema, [
            ['hello', true],
            [hello, true],
            [new Buffer('hello'), true],
            ['goodbye', false, null, {
                message: '"value" must be one of [hello]',
                details: [{
                    message: '"value" must be one of [hello]',
                    path: [],
                    type: 'any.allowOnly',
                    context: { valids: [hello], label: 'value', key: undefined }
                }]
            }],
            [new Buffer('goodbye'), false, null, {
                message: '"value" must be one of [hello]',
                details: [{
                    message: '"value" must be one of [hello]',
                    path: [],
                    type: 'any.allowOnly',
                    context: { valids: [hello], label: 'value', key: undefined }
                }]
            }],
            [new Buffer('HELLO'), false, null, {
                message: '"value" must be one of [hello]',
                details: [{
                    message: '"value" must be one of [hello]',
                    path: [],
                    type: 'any.allowOnly',
                    context: { valids: [hello], label: 'value', key: undefined }
                }]
            }]
        ]);
    });

    describe('validate()', () => {

        it('returns an error when a non-buffer or non-string is used', async () => {

            const err = await expect(Joi.binary().validate(5)).to.reject('"value" must be a buffer or a string');
            expect(err.details).to.equal([{
                message: '"value" must be a buffer or a string',
                path: [],
                type: 'binary.base',
                context: { label: 'value', key: undefined }
            }]);
        });

        it('accepts a buffer object', async () => {

            const value = await Joi.binary().validate(new Buffer('hello world'));
            expect(value.toString('utf8')).to.equal('hello world');
        });
    });

    describe('encoding()', () => {

        it('applies encoding', async () => {

            const schema = Joi.binary().encoding('base64');
            const input = new Buffer('abcdef');
            const value = await schema.validate(input.toString('base64'));
            expect(value instanceof Buffer).to.equal(true);
            expect(value.toString()).to.equal('abcdef');
        });

        it('throws when encoding is invalid', () => {

            expect(() => {

                Joi.binary().encoding('base6');
            }).to.throw('Invalid encoding: base6');
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
                [new Buffer('testing'), true],
                [new Buffer('test'), false, null, {
                    message: '"value" must be at least 5 bytes',
                    details: [{
                        message: '"value" must be at least 5 bytes',
                        path: [],
                        type: 'binary.min',
                        context: { limit: 5, value: new Buffer('test'), label: 'value', key: undefined }
                    }]
                }]
            ]);
        });

        it('throws when min is not a number', () => {

            expect(() => {

                Joi.binary().min('a');
            }).to.throw('limit must be a positive integer');
        });

        it('throws when min is not an integer', () => {

            expect(() => {

                Joi.binary().min(1.2);
            }).to.throw('limit must be a positive integer');
        });
    });

    describe('max()', () => {

        it('validates buffer size', () => {

            const schema = Joi.binary().max(5);
            Helper.validate(schema, [
                [new Buffer('testing'), false, null, {
                    message: '"value" must be less than or equal to 5 bytes',
                    details: [{
                        message: '"value" must be less than or equal to 5 bytes',
                        path: [],
                        type: 'binary.max',
                        context: {
                            limit: 5,
                            value: new Buffer('testing'),
                            label: 'value',
                            key: undefined
                        }
                    }]
                }],
                [new Buffer('test'), true]
            ]);
        });

        it('throws when max is not a number', () => {

            expect(() => {

                Joi.binary().max('a');
            }).to.throw('limit must be a positive integer');
        });

        it('throws when max is not an integer', () => {

            expect(() => {

                Joi.binary().max(1.2);
            }).to.throw('limit must be a positive integer');
        });
    });

    describe('length()', () => {

        it('validates buffer size', () => {

            const schema = Joi.binary().length(4);
            Helper.validate(schema, [
                [new Buffer('test'), true],
                [new Buffer('testing'), false, null, {
                    message: '"value" must be 4 bytes',
                    details: [{
                        message: '"value" must be 4 bytes',
                        path: [],
                        type: 'binary.length',
                        context: {
                            limit: 4,
                            value: new Buffer('testing'),
                            label: 'value',
                            key: undefined
                        }
                    }]
                }]
            ]);
        });

        it('throws when length is not a number', () => {

            expect(() => {

                Joi.binary().length('a');
            }).to.throw('limit must be a positive integer');
        });

        it('throws when length is not an integer', () => {

            expect(() => {

                Joi.binary().length(1.2);
            }).to.throw('limit must be a positive integer');
        });
    });
});
