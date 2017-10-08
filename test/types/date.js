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
const before = lab.before;
const after = lab.after;
const expect = Lab.expect;


describe('date', () => {

    before((done) => {

        // Mock Date.now so we don't have to deal with sub-second differences in the tests

        const original = Date.now;
        Date.now = function () {

            return 1485907200000;   // Random date
        };
        Date.now.restore = function () {

            Date.now = original;
        };
        done();
    });

    after((done) => {

        Date.now.restore();
        done();
    });

    it('can be called on its own', (done) => {

        const date = Joi.date;
        expect(() => date()).not.to.throw();
        done();
    });

    it('should throw an exception if arguments were passed.', (done) => {

        expect(
            () => Joi.date('invalid argument.')
        ).to.throw('Joi.date() does not allow arguments.');

        done();
    });

    it('fails on boolean', (done) => {

        const schema = Joi.date();
        Helper.validate(schema, [
            [true, false, null, {
                message: '"value" must be a number of milliseconds or valid date string',
                details: [{
                    message: '"value" must be a number of milliseconds or valid date string',
                    path: [],
                    type: 'date.base',
                    context: { label: 'value', key: undefined }
                }]
            }],
            [false, false, null, {
                message: '"value" must be a number of milliseconds or valid date string',
                details: [{
                    message: '"value" must be a number of milliseconds or valid date string',
                    path: [],
                    type: 'date.base',
                    context: { label: 'value', key: undefined }
                }]
            }]
        ], done);
    });

    it('fails on non-finite numbers', (done) => {

        const schema = Joi.date();
        Helper.validate(schema, [
            [Infinity, false, null, {
                message: '"value" must be a number of milliseconds or valid date string',
                details: [{
                    message: '"value" must be a number of milliseconds or valid date string',
                    path: [],
                    type: 'date.base',
                    context: { label: 'value', key: undefined }
                }]
            }],
            [-Infinity, false, null, {
                message: '"value" must be a number of milliseconds or valid date string',
                details: [{
                    message: '"value" must be a number of milliseconds or valid date string',
                    path: [],
                    type: 'date.base',
                    context: { label: 'value', key: undefined }
                }]
            }],
            [NaN, false, null, {
                message: '"value" must be a number of milliseconds or valid date string',
                details: [{
                    message: '"value" must be a number of milliseconds or valid date string',
                    path: [],
                    type: 'date.base',
                    context: { label: 'value', key: undefined }
                }]
            }]
        ], done);
    });

    it('matches specific date', (done) => {

        const now = Date.now();
        Joi.date().valid(new Date(now)).validate(new Date(now), (err, value) => {

            expect(err).to.not.exist();
            done();
        });
    });

    it('errors on invalid input and convert disabled', (done) => {

        Joi.date().options({ convert: false }).validate('1-1-2013 UTC', (err, value) => {

            expect(err).to.be.an.error('"value" must be a valid date');
            expect(err.details).to.equal([{
                message: '"value" must be a valid date',
                path: [],
                type: 'date.strict',
                context: { label: 'value', key: undefined }
            }]);
            done();
        });
    });

    it('validates date', (done) => {

        Joi.date().validate(new Date(), (err, value) => {

            expect(err).to.not.exist();
            done();
        });
    });

    it('validates millisecond date as a string', (done) => {

        const now = new Date();
        const mili = now.getTime();

        Joi.date().validate(mili.toString(), (err, value) => {

            expect(err).to.not.exist();
            expect(value).to.equal(now);
            done();
        });
    });

    describe('validate()', () => {

        describe('min', () => {

            it('validates min', (done) => {

                const d = new Date('1-1-2000 UTC');
                const message = `"value" must be larger than or equal to "${d}"`;
                Helper.validate(Joi.date().min('1-1-2000 UTC'), [
                    ['1-1-2001 UTC', true],
                    ['1-1-2000 UTC', true],
                    [0, false, null, {
                        message,
                        details: [{
                            message,
                            path: [],
                            type: 'date.min',
                            context: { limit: d, label: 'value', key: undefined }
                        }]
                    }],
                    ['0', false, null, {
                        message,
                        details: [{
                            message,
                            path: [],
                            type: 'date.min',
                            context: { limit: d, label: 'value', key: undefined }
                        }]
                    }],
                    ['-1', false, null, {
                        message,
                        details: [{
                            message,
                            path: [],
                            type: 'date.min',
                            context: { limit: d, label: 'value', key: undefined }
                        }]
                    }],
                    ['1-1-1999 UTC', false, null, {
                        message,
                        details: [{
                            message,
                            path: [],
                            type: 'date.min',
                            context: { limit: d, label: 'value', key: undefined }
                        }]
                    }]
                ], done);
            });

            it('accepts "now" as the min date', (done) => {

                const future = new Date(Date.now() + 1000000);

                Joi.date().min('now').validate(future, (err, value) => {

                    expect(err).to.not.exist();
                    expect(value).to.equal(future);
                    done();
                });
            });

            it('errors if .min("now") is used with a past date', (done) => {

                const now = Date.now();
                const dnow = new Date(now);
                const past = new Date(now - 1000000);

                Joi.date().min('now').validate(past, (err, value) => {

                    const message = `"value" must be larger than or equal to "${dnow}"`;
                    expect(err).to.be.an.error(message);
                    expect(err.details).to.equal([{
                        message: `"value" must be larger than or equal to "${dnow}"`,
                        path: [],
                        type: 'date.min',
                        context: { limit: dnow, label: 'value', key: undefined }
                    }]);
                    done();
                });
            });

            it('accepts references as min date', (done) => {

                const ref = Joi.ref('a');
                const schema = Joi.object({ a: Joi.date(), b: Joi.date().min(ref) });
                const now = Date.now();

                Helper.validate(schema, [
                    [{ a: now, b: now }, true],
                    [{ a: now, b: now + 1e3 }, true],
                    [{ a: now, b: now - 1e3 }, false, null, {
                        message: `child "b" fails because ["b" must be larger than or equal to "${new Date(now)}"]`,
                        details: [{
                            message: `"b" must be larger than or equal to "${new Date(now)}"`,
                            path: ['b'],
                            type: 'date.min',
                            context: { limit: new Date(now), label: 'b', key: 'b' }
                        }]
                    }]
                ], done);
            });

            it('accepts references as min date within a when', (done) => {

                const ref = Joi.ref('b');
                const schema = Joi.object({
                    a: Joi.date().required(),
                    b: Joi.date().required(),
                    c: Joi.number().required().when('a', {
                        is: Joi.date().min(ref), // a >= b
                        then: Joi.number().valid(0)
                    })
                });

                Helper.validate(schema, [
                    [{ a: 123, b: 123, c: 0 }, true],
                    [{ a: 123, b: 456, c: 42 }, true],
                    [{ a: 456, b: 123, c: 0 }, true],
                    [{ a: 123, b: 123, c: 42 }, false, null, {
                        message: 'child "c" fails because ["c" must be one of [0]]',
                        details: [{
                            message: '"c" must be one of [0]',
                            path: ['c'],
                            type: 'any.allowOnly',
                            context: { valids: [0], label: 'c', key: 'c' }
                        }]
                    }],
                    [{ a: 456, b: 123, c: 42 }, false, null, {
                        message: 'child "c" fails because ["c" must be one of [0]]',
                        details: [{
                            message: '"c" must be one of [0]',
                            path: ['c'],
                            type: 'any.allowOnly',
                            context: { valids: [0], label: 'c', key: 'c' }
                        }]
                    }]
                ], done);
            });

            it('accepts context references as min date', (done) => {

                const ref = Joi.ref('$a');
                const schema = Joi.object({ b: Joi.date().min(ref) });
                const now = Date.now();
                const dnow = new Date(now);

                Helper.validate(schema, [
                    [{ b: now }, true, { context: { a: now } }],
                    [{ b: now + 1e3 }, true, { context: { a: now } }],
                    [{ b: now - 1e3 }, false, { context: { a: now } }, {
                        message: `child "b" fails because ["b" must be larger than or equal to "${dnow}"]`,
                        details: [{
                            message: `"b" must be larger than or equal to "${dnow}"`,
                            path: ['b'],
                            type: 'date.min',
                            context: { limit: dnow, label: 'b', key: 'b' }
                        }]
                    }]
                ], done);
            });

            it('errors if reference is not a date', (done) => {

                const schema = Joi.object({ a: Joi.string(), b: Joi.date().min(Joi.ref('a')) });
                const now = Date.now();

                Helper.validate(schema, [
                    [{ a: 'abc', b: now }, false, null, {
                        message: 'child "b" fails because ["b" references "a" which is not a date]',
                        details: [{
                            message: '"b" references "a" which is not a date',
                            path: ['b'],
                            type: 'date.ref',
                            context: { ref: 'a', label: 'b', key: 'b' }
                        }]
                    }],
                    [{ a: '123', b: now }, true],
                    [{ a: (now + 1e3).toString(), b: now }, false, null, {
                        message: `child "b" fails because ["b" must be larger than or equal to "${new Date(now + 1e3)}"]`,
                        details: [{
                            message: `"b" must be larger than or equal to "${new Date(now + 1e3)}"`,
                            path: ['b'],
                            type: 'date.min',
                            context: { limit: new Date(now + 1e3), label: 'b', key: 'b' }
                        }]
                    }]
                ], done);
            });

            it('errors if context reference is not a date', (done) => {

                const schema = Joi.object({ b: Joi.date().min(Joi.ref('$a')) });
                const now = Date.now();

                Helper.validate(schema, [
                    [{ b: now }, false, { context: { a: 'abc' } }, {
                        message: 'child "b" fails because ["b" references "a" which is not a date]',
                        details: [{
                            message: '"b" references "a" which is not a date',
                            path: ['b'],
                            type: 'date.ref',
                            context: { ref: 'a', label: 'b', key: 'b' }
                        }]
                    }],
                    [{ b: now }, false, { context: { a: (now + 1e3).toString() } }, {
                        message: `child "b" fails because ["b" must be larger than or equal to "${new Date(now + 1e3)}"]`,
                        details: [{
                            message: `"b" must be larger than or equal to "${new Date(now + 1e3)}"`,
                            path: ['b'],
                            type: 'date.min',
                            context: { limit: new Date(now + 1e3), label: 'b', key: 'b' }
                        }]
                    }]
                ], done);
            });
        });

        describe('max', () => {

            it('validates max', (done) => {

                const d = new Date('1-1-1970 UTC');
                const message = `"value" must be less than or equal to "${d}"`;
                Helper.validate(Joi.date().max('1-1-1970 UTC'), [
                    ['1-1-1971 UTC', false, null, {
                        message,
                        details: [{
                            message,
                            path: [],
                            type: 'date.max',
                            context: { limit: d, label: 'value', key: undefined }
                        }]
                    }],
                    ['1-1-1970 UTC', true],
                    [0, true],
                    [1, false, null, {
                        message,
                        details: [{
                            message,
                            path: [],
                            type: 'date.max',
                            context: { limit: d, label: 'value', key: undefined }
                        }]
                    }],
                    ['0', true],
                    ['-1', true],
                    ['1-1-2014 UTC', false, null, {
                        message,
                        details: [{
                            message,
                            path: [],
                            type: 'date.max',
                            context: { limit: d, label: 'value', key: undefined }
                        }]
                    }]
                ], done);
            });

            it('accepts "now" as the max date', (done) => {

                const past = new Date(Date.now() - 1000000);

                Joi.date().max('now').validate(past, (err, value) => {

                    expect(err).to.not.exist();
                    expect(value).to.equal(past);
                    done();
                });
            });

            it('errors if .max("now") is used with a future date', (done) => {

                const now = Date.now();
                const dnow = new Date(now);
                const future = new Date(now + 1000000);

                Joi.date().max('now').validate(future, (err, value) => {

                    const message = `"value" must be less than or equal to "${dnow}"`;
                    expect(err).to.be.an.error(message);
                    expect(err.details).to.equal([{
                        message: `"value" must be less than or equal to "${dnow}"`,
                        path: [],
                        type: 'date.max',
                        context: { limit: dnow, label: 'value', key: undefined }
                    }]);
                    done();
                });
            });

            it('accepts references as max date', (done) => {

                const ref = Joi.ref('a');
                const schema = Joi.object({ a: Joi.date(), b: Joi.date().max(ref) });
                const now = Date.now();

                Helper.validate(schema, [
                    [{ a: now, b: now }, true],
                    [{ a: now, b: now + 1e3 }, false, null, {
                        message: `child "b" fails because ["b" must be less than or equal to "${new Date(now)}"]`,
                        details: [{
                            message: `"b" must be less than or equal to "${new Date(now)}"`,
                            path: ['b'],
                            type: 'date.max',
                            context: { limit: new Date(now), label: 'b', key: 'b' }
                        }]
                    }],
                    [{ a: now, b: now - 1e3 }, true]
                ], done);
            });

            it('accepts references as max date', (done) => {

                const schema = Joi.object({ b: Joi.date().max(Joi.ref('$a')) });
                const now = Date.now();

                Helper.validate(schema, [
                    [{ b: now }, true, { context: { a: now } }],
                    [{ b: now + 1e3 }, false, { context: { a: now } }, {
                        message: `child "b" fails because ["b" must be less than or equal to "${new Date(now)}"]`,
                        details: [{
                            message: `"b" must be less than or equal to "${new Date(now)}"`,
                            path: ['b'],
                            type: 'date.max',
                            context: { limit: new Date(now), label: 'b', key: 'b' }
                        }]
                    }],
                    [{ b: now - 1e3 }, true, { context: { a: now } }]
                ], done);
            });

            it('errors if reference is not a date', (done) => {

                const schema = Joi.object({ a: Joi.string(), b: Joi.date().max(Joi.ref('a')) });
                const now = Date.now();

                Helper.validate(schema, [
                    [{ a: 'abc', b: new Date() }, false, null, {
                        message: 'child "b" fails because ["b" references "a" which is not a date]',
                        details: [{
                            message: '"b" references "a" which is not a date',
                            path: ['b'],
                            type: 'date.ref',
                            context: { ref: 'a', label: 'b', key: 'b' }
                        }]
                    }],
                    [{ a: '100000000000000', b: now }, true],
                    [{ a: (now - 1e3).toString(), b: now }, false, null, {
                        message: `child "b" fails because ["b" must be less than or equal to "${new Date(now - 1e3)}"]`,
                        details: [{
                            message: `"b" must be less than or equal to "${new Date(now - 1e3)}"`,
                            path: ['b'],
                            type: 'date.max',
                            context: { limit: new Date(now - 1e3), label: 'b', key: 'b' }
                        }]
                    }]
                ], done);
            });

            it('errors if context reference is not a date', (done) => {

                const schema = Joi.object({ b: Joi.date().max(Joi.ref('$a')) });
                const now = Date.now();

                Helper.validate(schema, [
                    [{ b: now }, false, { context: { a: 'abc' } }, {
                        message: 'child "b" fails because ["b" references "a" which is not a date]',
                        details: [{
                            message: '"b" references "a" which is not a date',
                            path: ['b'],
                            type: 'date.ref',
                            context: { ref: 'a', label: 'b', key: 'b' }
                        }]
                    }],
                    [{ b: now }, true, { context: { a: '100000000000000' } }],
                    [{ b: now }, false, { context: { a: (now - 1e3).toString() } }, {
                        message: `child "b" fails because ["b" must be less than or equal to "${new Date(now - 1e3)}"]`,
                        details: [{
                            message: `"b" must be less than or equal to "${new Date(now - 1e3)}"`,
                            path: ['b'],
                            type: 'date.max',
                            context: { limit: new Date(now - 1e3), label: 'b', key: 'b' }
                        }]
                    }]
                ], done);
            });
        });

        it('validates only valid dates', (done) => {

            Helper.validate(Joi.date(), [
                ['1-1-2013 UTC', true],
                [new Date().getTime(), true],
                [new Date().getTime().toFixed(4), true],
                ['not a valid date', false, null, {
                    message: '"value" must be a number of milliseconds or valid date string',
                    details: [{
                        message: '"value" must be a number of milliseconds or valid date string',
                        path: [],
                        type: 'date.base',
                        context: { label: 'value', key: undefined }
                    }]
                }],
                [new Date('not a valid date'), false, null, {
                    message: '"value" must be a number of milliseconds or valid date string',
                    details: [{
                        message: '"value" must be a number of milliseconds or valid date string',
                        path: [],
                        type: 'date.base',
                        context: { label: 'value', key: undefined }
                    }]
                }]
            ], done);
        });

        describe('iso()', () => {

            it('avoids unnecessary cloning when called twice', (done) => {

                const schema = Joi.date().iso();
                expect(schema.iso()).to.shallow.equal(schema);
                done();
            });

            it('validates isoDate', (done) => {

                Helper.validate(Joi.date().iso(), [
                    ['+002013-06-07T14:21:46.295Z', true],
                    ['-002013-06-07T14:21:46.295Z', true],
                    ['002013-06-07T14:21:46.295Z', false, null, {
                        message: '"value" must be a valid ISO 8601 date',
                        details: [{
                            message: '"value" must be a valid ISO 8601 date',
                            path: [],
                            type: 'date.isoDate',
                            context: { label: 'value', key: undefined }
                        }]
                    }],
                    ['+2013-06-07T14:21:46.295Z', false, null, {
                        message: '"value" must be a valid ISO 8601 date',
                        details: [{
                            message: '"value" must be a valid ISO 8601 date',
                            path: [],
                            type: 'date.isoDate',
                            context: { label: 'value', key: undefined }
                        }]
                    }],
                    ['-2013-06-07T14:21:46.295Z', false, null, {
                        message: '"value" must be a valid ISO 8601 date',
                        details: [{
                            message: '"value" must be a valid ISO 8601 date',
                            path: [],
                            type: 'date.isoDate',
                            context: { label: 'value', key: undefined }
                        }]
                    }],
                    ['2013-06-07T14:21:46.295Z', true],
                    ['2013-06-07T14:21:46.295Z0', false, null, {
                        message: '"value" must be a valid ISO 8601 date',
                        details: [{
                            message: '"value" must be a valid ISO 8601 date',
                            path: [],
                            type: 'date.isoDate',
                            context: { label: 'value', key: undefined }
                        }]
                    }],
                    ['2013-06-07T14:21:46.295+07:00', true],
                    ['2013-06-07T14:21:46.295+07:000', false, null, {
                        message: '"value" must be a valid ISO 8601 date',
                        details: [{
                            message: '"value" must be a valid ISO 8601 date',
                            path: [],
                            type: 'date.isoDate',
                            context: { label: 'value', key: undefined }
                        }]
                    }],
                    ['2013-06-07T14:21:46.295-07:00', true],
                    ['2013-06-07T14:21:46Z', true],
                    ['2013-06-07T14:21:46Z0', false, null, {
                        message: '"value" must be a valid ISO 8601 date',
                        details: [{
                            message: '"value" must be a valid ISO 8601 date',
                            path: [],
                            type: 'date.isoDate',
                            context: { label: 'value', key: undefined }
                        }]
                    }],
                    ['2013-06-07T14:21:46+07:00', true],
                    ['2013-06-07T14:21:46-07:00', true],
                    ['2013-06-07T14:21Z', true],
                    ['2013-06-07T14:21+07:00', true],
                    ['2013-06-07T14:21+07:000', false, null, {
                        message: '"value" must be a valid ISO 8601 date',
                        details: [{
                            message: '"value" must be a valid ISO 8601 date',
                            path: [],
                            type: 'date.isoDate',
                            context: { label: 'value', key: undefined }
                        }]
                    }],
                    ['2013-06-07T14:21-07:00', true],
                    ['2013-06-07T14:21Z+7:00', false, null, {
                        message: '"value" must be a valid ISO 8601 date',
                        details: [{
                            message: '"value" must be a valid ISO 8601 date',
                            path: [],
                            type: 'date.isoDate',
                            context: { label: 'value', key: undefined }
                        }]
                    }],
                    ['2013-06-07', true],
                    ['2013-06-07T', false, null, {
                        message: '"value" must be a valid ISO 8601 date',
                        details: [{
                            message: '"value" must be a valid ISO 8601 date',
                            path: [],
                            type: 'date.isoDate',
                            context: { label: 'value', key: undefined }
                        }]
                    }],
                    ['2013-06-07T14:21', true],
                    ['1-1-2013', false, null, {
                        message: '"value" must be a valid ISO 8601 date',
                        details: [{
                            message: '"value" must be a valid ISO 8601 date',
                            path: [],
                            type: 'date.isoDate',
                            context: { label: 'value', key: undefined }
                        }]
                    }]
                ], done);
            });

            it('converts expanded isoDates', (done) => {

                const schema = { item: Joi.date().iso() };
                Joi.compile(schema).validate({ item: '-002013-06-07T14:21:46.295Z' }, (err, value) => {

                    expect(err).to.not.exist();
                    expect(value.item.toISOString()).to.be.equal('-002013-06-07T14:21:46.295Z');
                    done();
                });
            });

            it('validates isoDate with a friendly error message', (done) => {

                const schema = { item: Joi.date().iso() };
                Joi.compile(schema).validate({ item: 'something' }, (err, value) => {

                    expect(err.message).to.equal('child "item" fails because ["item" must be a valid ISO 8601 date]');
                    expect(err.details).to.equal([{
                        message: '"item" must be a valid ISO 8601 date',
                        path: ['item'],
                        type: 'date.isoDate',
                        context: { label: 'item', key: 'item' }
                    }]);
                    done();
                });
            });

            it('validates isoDate after clone', (done) => {

                const schema = { item: Joi.date().iso().clone() };
                Joi.compile(schema).validate({ item: '2013-06-07T14:21:46.295Z' }, (err, value) => {

                    expect(err).to.not.exist();
                    done();
                });
            });
        });

        describe('timestamp()', () => {

            it('avoids unnecessary cloning when called twice', (done) => {

                const schema = Joi.date().timestamp('unix');
                expect(schema.timestamp('unix')).to.shallow.equal(schema);
                done();
            });

            it('fails on empty strings', (done) => {

                const schema = Joi.date().timestamp();
                Helper.validate(schema, [
                    ['', false, null, {
                        message: '"value" must be a valid timestamp or number of milliseconds',
                        details: [{
                            message: '"value" must be a valid timestamp or number of milliseconds',
                            path: [],
                            type: 'date.timestamp.javascript',
                            context: { key: undefined, label: 'value' }
                        }]
                    }],
                    [' \t ', false, null, {
                        message: '"value" must be a valid timestamp or number of milliseconds',
                        details: [{
                            message: '"value" must be a valid timestamp or number of milliseconds',
                            path: [],
                            type: 'date.timestamp.javascript',
                            context: { key: undefined, label: 'value' }
                        }]
                    }]
                ], done);
            });

            it('validates javascript timestamp', (done) => {

                const now = new Date();
                const milliseconds = now.getTime();

                Joi.date().timestamp().validate(milliseconds, (err, value) => {

                    expect(err).to.not.exist();
                    expect(value).to.equal(now);
                });
                Joi.date().timestamp('javascript').validate(milliseconds, (err, value) => {

                    expect(err).to.not.exist();
                    expect(value).to.equal(now);
                });
                Joi.date().timestamp('unix').timestamp('javascript').validate(milliseconds, (err, value) => {

                    expect(err).to.not.exist();
                    expect(value).to.equal(now);
                });
                done();
            });

            it('validates unix timestamp', (done) => {

                const now = new Date();
                const seconds = now.getTime() / 1000;

                Joi.date().timestamp('unix').validate(seconds, (err, value) => {

                    expect(err).to.not.exist();
                    expect(value).to.equal(now);
                });
                Joi.date().timestamp().timestamp('unix').validate(seconds, (err, value) => {

                    expect(err).to.not.exist();
                    expect(value).to.equal(now);
                });
                Joi.date().timestamp('javascript').timestamp('unix').validate(seconds, (err, value) => {

                    expect(err).to.not.exist();
                    expect(value).to.equal(now);
                });
                done();
            });

            it('validates timestamps with decimals', (done) => {

                Helper.validate(Joi.date().timestamp(), [
                    [new Date().getTime().toFixed(4), true]
                ]);
                Helper.validate(Joi.date().timestamp('javascript'), [
                    [new Date().getTime().toFixed(4), true]
                ]);
                Helper.validate(Joi.date().timestamp('unix'), [
                    [(new Date().getTime() / 1000).toFixed(4), true]
                ]);
                done();
            });

            it('validates only valid timestamps and returns a friendly error message', (done) => {

                Helper.validate(Joi.date().timestamp(), [
                    [new Date().getTime(), true],
                    [new Date().getTime().toFixed(4), true],
                    ['1.452126061677e+12', true],
                    [1.452126061677e+12, true],
                    [1E3, true],
                    ['1E3', true],
                    [',', false, null, {
                        message: '"value" must be a valid timestamp or number of milliseconds',
                        details: [{
                            message: '"value" must be a valid timestamp or number of milliseconds',
                            path: [],
                            type: 'date.timestamp.javascript',
                            context: { label: 'value', key: undefined }
                        }]
                    }],
                    ['123A,0xA', false, null, {
                        message: '"value" must be a valid timestamp or number of milliseconds',
                        details: [{
                            message: '"value" must be a valid timestamp or number of milliseconds',
                            path: [],
                            type: 'date.timestamp.javascript',
                            context: { label: 'value', key: undefined }
                        }]
                    }],
                    ['1-1-2013 UTC', false, null, {
                        message: '"value" must be a valid timestamp or number of milliseconds',
                        details: [{
                            message: '"value" must be a valid timestamp or number of milliseconds',
                            path: [],
                            type: 'date.timestamp.javascript',
                            context: { label: 'value', key: undefined }
                        }]
                    }],
                    ['not a valid timestamp', false, null, {
                        message: '"value" must be a valid timestamp or number of milliseconds',
                        details: [{
                            message: '"value" must be a valid timestamp or number of milliseconds',
                            path: [],
                            type: 'date.timestamp.javascript',
                            context: { label: 'value', key: undefined }
                        }]
                    }],
                    [new Date('not a valid date'), false, null, {
                        message: '"value" must be a valid timestamp or number of milliseconds',
                        details: [{
                            message: '"value" must be a valid timestamp or number of milliseconds',
                            path: [],
                            type: 'date.timestamp.javascript',
                            context: { label: 'value', key: undefined }
                        }]
                    }]
                ], done);
            });

            it('fails with not allowed type', (done) => {

                expect(() => {

                    Joi.date().timestamp('not allowed');
                }).to.throw(Error, /"type" must be one of/);
                done();
            });
        });
    });
});
