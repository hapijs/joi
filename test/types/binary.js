'use strict';

// Load modules

const Lab = require('lab');
const Joi = require('../..');
const Helper = require('../helper');


// Declare internals

const internals = {};


// Test shortcuts

const lab = exports.lab = Lab.script();
const describe = lab.describe;
const it = lab.it;
const expect = Lab.expect;


describe('binary', () => {

    it('should throw an exception if arguments were passed.', (done) => {

        expect(
            () => Joi.binary('invalid argument.')
        ).to.throw('Joi.binary() does not allow arguments.');

        done();
    });

    it('converts a string to a buffer', (done) => {

        Joi.binary().validate('test', (err, value) => {

            expect(err).to.not.exist();
            expect(value instanceof Buffer).to.equal(true);
            expect(value.length).to.equal(4);
            expect(value.toString('utf8')).to.equal('test');
            done();
        });
    });

    it('validates allowed buffer content', (done) => {

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
        ], done);
    });

    describe('validate()', () => {

        it('returns an error when a non-buffer or non-string is used', (done) => {

            Joi.binary().validate(5, (err, value) => {

                expect(err).to.be.an.error('"value" must be a buffer or a string');
                expect(err.details).to.equal([{
                    message: '"value" must be a buffer or a string',
                    path: [],
                    type: 'binary.base',
                    context: { label: 'value', key: undefined }
                }]);
                done();
            });
        });

        it('accepts a buffer object', (done) => {

            Joi.binary().validate(new Buffer('hello world'), (err, value) => {

                expect(err).to.not.exist();
                expect(value.toString('utf8')).to.equal('hello world');
                done();
            });
        });
    });

    describe('encoding()', () => {

        it('applies encoding', (done) => {

            const schema = Joi.binary().encoding('base64');
            const input = new Buffer('abcdef');
            schema.validate(input.toString('base64'), (err, value) => {

                expect(err).to.not.exist();
                expect(value instanceof Buffer).to.equal(true);
                expect(value.toString()).to.equal('abcdef');
                done();
            });
        });

        it('throws when encoding is invalid', (done) => {

            expect(() => {

                Joi.binary().encoding('base6');
            }).to.throw('Invalid encoding: base6');
            done();
        });

        it('avoids unnecessary cloning when called twice', (done) => {

            const schema = Joi.binary().encoding('base64');
            expect(schema.encoding('base64')).to.shallow.equal(schema);
            done();
        });
    });

    describe('min()', () => {

        it('validates buffer size', (done) => {

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
            ], done);
        });

        it('throws when min is not a number', (done) => {

            expect(() => {

                Joi.binary().min('a');
            }).to.throw('limit must be a positive integer');
            done();
        });

        it('throws when min is not an integer', (done) => {

            expect(() => {

                Joi.binary().min(1.2);
            }).to.throw('limit must be a positive integer');
            done();
        });
    });

    describe('max()', () => {

        it('validates buffer size', (done) => {

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
            ], done);
        });

        it('throws when max is not a number', (done) => {

            expect(() => {

                Joi.binary().max('a');
            }).to.throw('limit must be a positive integer');
            done();
        });

        it('throws when max is not an integer', (done) => {

            expect(() => {

                Joi.binary().max(1.2);
            }).to.throw('limit must be a positive integer');
            done();
        });
    });

    describe('length()', () => {

        it('validates buffer size', (done) => {

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
            ], done);
        });

        it('throws when length is not a number', (done) => {

            expect(() => {

                Joi.binary().length('a');
            }).to.throw('limit must be a positive integer');
            done();
        });

        it('throws when length is not an integer', (done) => {

            expect(() => {

                Joi.binary().length(1.2);
            }).to.throw('limit must be a positive integer');
            done();
        });
    });
});
