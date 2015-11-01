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
            [true, false],
            [false, false]
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
            expect(err.message).to.equal('"value" must be a number of milliseconds or valid date string');
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
            expect(value).to.deep.equal(now);
            done();
        });
    });

    describe('#validate', () => {

        describe('min', () => {

            it('validates min', (done) => {

                Helper.validate(Joi.date().min('1-1-2000 UTC'), [
                    ['1-1-2001 UTC', true],
                    ['1-1-2000 UTC', true],
                    [0, false],
                    ['0', false],
                    ['-1', false],
                    ['1-1-1999 UTC', false]
                ], done);
            });

            it('accepts "now" as the min date', (done) => {

                const future = new Date(Date.now() + 1000000);

                Joi.date().min('now').validate(future, (err, value) => {

                    expect(err).to.not.exist();
                    expect(value).to.deep.equal(future);
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
                    [{ a: now, b: now - 1e3 }, false]
                ], done);
            });

            it('accepts context references as min date', (done) => {

                const schema = Joi.object({ b: Joi.date().min(Joi.ref('$a')) });
                const now = Date.now();

                Helper.validate(schema, [
                    [{ b: now }, true, { context: { a: now } }],
                    [{ b: now + 1e3 }, true, { context: { a: now } }],
                    [{ b: now - 1e3 }, false, { context: { a: now } }]
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
                    ['1-1-1971 UTC', false],
                    ['1-1-1970 UTC', true],
                    [0, true],
                    [1, false],
                    ['0', true],
                    ['-1', true],
                    ['1-1-2014 UTC', false]
                ], done);
            });

            it('accepts "now" as the max date', (done) => {

                const past = new Date(Date.now() - 1000000);

                Joi.date().max('now').validate(past, (err, value) => {

                    expect(err).to.not.exist();
                    expect(value).to.deep.equal(past);
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
                    [{ a: now, b: now + 1e3 }, false],
                    [{ a: now, b: now - 1e3 }, true]
                ], done);
            });

            it('accepts references as max date', (done) => {

                const schema = Joi.object({ b: Joi.date().max(Joi.ref('$a')) });
                const now = Date.now();

                Helper.validate(schema, [
                    [{ b: now }, true, { context: { a: now } }],
                    [{ b: now + 1e3 }, false, { context: { a: now } }],
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
                ['not a valid date', false],
                [new Date('not a valid date'), false]
            ], done);
        });

        describe('#iso', () => {

            it('validates isoDate', (done) => {

                Helper.validate(Joi.date().iso(), [
                    ['2013-06-07T14:21:46.295Z', true],
                    ['2013-06-07T14:21:46.295Z0', false],
                    ['2013-06-07T14:21:46.295+07:00', true],
                    ['2013-06-07T14:21:46.295+07:000', false],
                    ['2013-06-07T14:21:46.295-07:00', true],
                    ['2013-06-07T14:21:46Z', true],
                    ['2013-06-07T14:21:46Z0', false],
                    ['2013-06-07T14:21:46+07:00', true],
                    ['2013-06-07T14:21:46-07:00', true],
                    ['2013-06-07T14:21Z', true],
                    ['2013-06-07T14:21+07:00', true],
                    ['2013-06-07T14:21+07:000', false],
                    ['2013-06-07T14:21-07:00', true],
                    ['2013-06-07T14:21Z+7:00', false],
                    ['2013-06-07', true],
                    ['2013-06-07T', false],
                    ['2013-06-07T14:21', true],
                    ['1-1-2013', false]
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

        describe('#format', () => {

            it('validates custom format', (done) => {

                Helper.validate(Joi.date().format('DD#YYYY$MM'), [
                    ['07#2013$06', true],
                    ['2013-06-07', false]
                ], done);
            });

            it('validates several custom formats', (done) => {

                Helper.validate(Joi.date().format(['DD#YYYY$MM', 'YY|DD|MM']), [
                    ['13|07|06', true],
                    ['2013-06-07', false]
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
