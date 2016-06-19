'use strict';

// Load modules

const Lab = require('lab');
const Code = require('code');
const Joi = require('../lib');
const Helper = require('./helper');


// Declare internals

const internals = {};


// Test shortcuts

const lab = exports.lab = Lab.script();
const describe = lab.describe;
const it = lab.it;
const expect = Code.expect;


describe('date', () => {

    it('fails on boolean', (done) => {

        const schema = Joi.date();
        Helper.validate(schema, [
            [true, false, null, '"value" must be a number of milliseconds or valid date string'],
            [false, false, null, '"value" must be a number of milliseconds or valid date string']
        ], done);
    });

    it('fails on non-finite numbers', (done) => {

        const schema = Joi.date();
        Helper.validate(schema, [
            [Infinity, false, null, /number of milliseconds or valid date string/],
            [-Infinity, false, null, /number of milliseconds or valid date string/],
            [NaN, false, null, /number of milliseconds or valid date string/]
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

            expect(err).to.exist();
            expect(err.message).to.equal('"value" must be a valid date');
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

                Helper.validate(Joi.date().min('1-1-2000 UTC'), [
                    ['1-1-2001 UTC', true],
                    ['1-1-2000 UTC', true],
                    [0, false, null, /^"value" must be larger than or equal to ".+"$/],
                    ['0', false, null, /^"value" must be larger than or equal to ".+"$/],
                    ['-1', false, null, /^"value" must be larger than or equal to ".+"$/],
                    ['1-1-1999 UTC', false, null, /^"value" must be larger than or equal to ".+"$/]
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

                const past = new Date(Date.now() - 1000000);

                Joi.date().min('now').validate(past, (err, value) => {

                    expect(err).to.exist();
                    done();
                });
            });

            it('accepts references as min date', (done) => {

                const schema = Joi.object({ a: Joi.date(), b: Joi.date().min(Joi.ref('a')) });
                const now = Date.now();

                Helper.validate(schema, [
                    [{ a: now, b: now }, true],
                    [{ a: now, b: now + 1e3 }, true],
                    [{ a: now, b: now - 1e3 }, false, null, /^child "b" fails because \["b" must be larger than or equal to ".+"\]$/]
                ], done);
            });

            it('accepts context references as min date', (done) => {

                const schema = Joi.object({ b: Joi.date().min(Joi.ref('$a')) });
                const now = Date.now();

                Helper.validate(schema, [
                    [{ b: now }, true, { context: { a: now } }],
                    [{ b: now + 1e3 }, true, { context: { a: now } }],
                    [{ b: now - 1e3 }, false, { context: { a: now } }, /^child "b" fails because \["b" must be larger than or equal to ".+"\]$/]
                ], done);
            });

            it('errors if reference is not a date', (done) => {

                const schema = Joi.object({ a: Joi.string(), b: Joi.date().min(Joi.ref('a')) });
                const now = Date.now();

                Helper.validate(schema, [
                    [{ a: 'abc', b: now }, false, null, 'child "b" fails because ["b" references "a" which is not a date]'],
                    [{ a: '123', b: now }, true],
                    [{ a: (now + 1e3).toString(), b: now }, false, null, /^child "b" fails because \["b" must be larger than or equal to/]
                ], done);
            });

            it('errors if context reference is not a date', (done) => {

                const schema = Joi.object({ b: Joi.date().min(Joi.ref('$a')) });
                const now = Date.now();

                Helper.validate(schema, [
                    [{ b: now }, false, { context: { a: 'abc' } }, 'child "b" fails because ["b" references "a" which is not a date]'],
                    [{ b: now }, false, { context: { a: (now + 1e3).toString() } }, /^child "b" fails because \["b" must be larger than or equal to/]
                ], done);
            });
        });

        describe('max', () => {

            it('validates max', (done) => {

                Helper.validate(Joi.date().max('1-1-1970 UTC'), [
                    ['1-1-1971 UTC', false, null, /^"value" must be less than or equal to ".+"$/],
                    ['1-1-1970 UTC', true],
                    [0, true],
                    [1, false, null, /^"value" must be less than or equal to ".+"$/],
                    ['0', true],
                    ['-1', true],
                    ['1-1-2014 UTC', false, null, /^"value" must be less than or equal to ".+"$/]
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

                const future = new Date(Date.now() + 1000000);

                Joi.date().max('now').validate(future, (err, value) => {

                    expect(err).to.exist();
                    done();
                });
            });

            it('accepts references as max date', (done) => {

                const schema = Joi.object({ a: Joi.date(), b: Joi.date().max(Joi.ref('a')) });
                const now = Date.now();

                Helper.validate(schema, [
                    [{ a: now, b: now }, true],
                    [{ a: now, b: now + 1e3 }, false, null, /^child "b" fails because \["b" must be less than or equal to ".+"\]$/],
                    [{ a: now, b: now - 1e3 }, true]
                ], done);
            });

            it('accepts references as max date', (done) => {

                const schema = Joi.object({ b: Joi.date().max(Joi.ref('$a')) });
                const now = Date.now();

                Helper.validate(schema, [
                    [{ b: now }, true, { context: { a: now } }],
                    [{ b: now + 1e3 }, false, { context: { a: now } }, /^child "b" fails because \["b" must be less than or equal to ".+"\]$/],
                    [{ b: now - 1e3 }, true, { context: { a: now } }]
                ], done);
            });

            it('errors if reference is not a date', (done) => {

                const schema = Joi.object({ a: Joi.string(), b: Joi.date().max(Joi.ref('a')) });
                const now = Date.now();

                Helper.validate(schema, [
                    [{ a: 'abc', b: new Date() }, false, null, 'child "b" fails because ["b" references "a" which is not a date]'],
                    [{ a: '100000000000000', b: now }, true],
                    [{ a: (now - 1e3).toString(), b: now }, false, null, /^child "b" fails because \["b" must be less than or equal to/]
                ], done);
            });

            it('errors if context reference is not a date', (done) => {

                const schema = Joi.object({ b: Joi.date().max(Joi.ref('$a')) });
                const now = Date.now();

                Helper.validate(schema, [
                    [{ b: now }, false, { context: { a: 'abc' } }, 'child "b" fails because ["b" references "a" which is not a date]'],
                    [{ b: now }, true, { context: { a: '100000000000000' } }],
                    [{ b: now }, false, { context: { a: (now - 1e3).toString() } }, /^child "b" fails because \["b" must be less than or equal to/]
                ], done);
            });
        });

        it('validates only valid dates', (done) => {

            Helper.validate(Joi.date(), [
                ['1-1-2013 UTC', true],
                [new Date().getTime(), true],
                [new Date().getTime().toFixed(4), true],
                ['not a valid date', false, null, '"value" must be a number of milliseconds or valid date string'],
                [new Date('not a valid date'), false, null, '"value" must be a number of milliseconds or valid date string']
            ], done);
        });

        describe('iso()', () => {

            it('validates isoDate', (done) => {

                Helper.validate(Joi.date().iso(), [
                    ['2013-06-07T14:21:46.295Z', true],
                    ['2013-06-07T14:21:46.295Z0', false, null, '"value" must be a valid ISO 8601 date'],
                    ['2013-06-07T14:21:46.295+07:00', true],
                    ['2013-06-07T14:21:46.295+07:000', false, null, '"value" must be a valid ISO 8601 date'],
                    ['2013-06-07T14:21:46.295-07:00', true],
                    ['2013-06-07T14:21:46Z', true],
                    ['2013-06-07T14:21:46Z0', false, null, '"value" must be a valid ISO 8601 date'],
                    ['2013-06-07T14:21:46+07:00', true],
                    ['2013-06-07T14:21:46-07:00', true],
                    ['2013-06-07T14:21Z', true],
                    ['2013-06-07T14:21+07:00', true],
                    ['2013-06-07T14:21+07:000', false, null, '"value" must be a valid ISO 8601 date'],
                    ['2013-06-07T14:21-07:00', true],
                    ['2013-06-07T14:21Z+7:00', false, null, '"value" must be a valid ISO 8601 date'],
                    ['2013-06-07', true],
                    ['2013-06-07T', false, null, '"value" must be a valid ISO 8601 date'],
                    ['2013-06-07T14:21', true],
                    ['1-1-2013', false, null, '"value" must be a valid ISO 8601 date']
                ], done);
            });

            it('validates isoDate with a friendly error message', (done) => {

                const schema = { item: Joi.date().iso() };
                Joi.compile(schema).validate({ item: 'something' }, (err, value) => {

                    expect(err.message).to.contain('must be a valid ISO 8601 date');
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
                    [',', false, null, /must be a valid timestamp/],
                    ['123A,0xA', false, null, /must be a valid timestamp/],
                    ['1-1-2013 UTC', false, null, /must be a valid timestamp/],
                    ['not a valid timestamp', false, null, /must be a valid timestamp/],
                    [new Date('not a valid date'), false, null, /must be a valid timestamp/]
                ], done);
            });

            it('fails with not allowed type', (done) => {

                expect(() => {

                    Joi.date().timestamp('not allowed');
                }).to.throw(Error, /"type" must be one of/);
                done();
            });
        });

        describe('format()', () => {

            it('validates custom format', (done) => {

                Helper.validate(Joi.date().format('DD#YYYY$MM'), [
                    ['07#2013$06', true],
                    ['2013-06-07', false, null, '"value" must be a string with one of the following formats DD#YYYY$MM']
                ], done);
            });

            it('validates several custom formats', (done) => {

                Helper.validate(Joi.date().format(['DD#YYYY$MM', 'YY|DD|MM']), [
                    ['13|07|06', true],
                    ['2013-06-07', false, null, '"value" must be a string with one of the following formats [DD#YYYY$MM, YY|DD|MM]']
                ], done);
            });

            it('fails with bad formats', (done) => {

                expect(() => {

                    Joi.date().format(true);
                }).to.throw('Invalid format.');

                expect(() => {

                    Joi.date().format(['YYYYMMDD', true]);
                }).to.throw('Invalid format.');
                done();
            });
        });
    });
});
