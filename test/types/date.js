'use strict';

const Code = require('@hapi/code');
const Lab = require('@hapi/lab');
const Joi = require('../..');

const Helper = require('../helper');


const internals = {};


const { describe, it, before, after } = exports.lab = Lab.script();
const { expect } = Code;


describe('date', () => {

    before(() => {

        // Mock Date.now so we don't have to deal with sub-second differences in the tests

        const original = Date.now;

        Date.now = function () {

            return 1485907200000;   // Random date
        };

        Date.now.restore = function () {

            Date.now = original;
        };
    });

    after(() => {

        Date.now.restore();
    });

    it('should throw an exception if arguments were passed.', () => {

        expect(() => Joi.date('invalid argument.')).to.throw('The date type does not allow arguments');
    });

    it('fails on boolean', () => {

        const schema = Joi.date();
        Helper.validate(schema, [
            [true, false, null, {
                message: '"value" must be a number of milliseconds or valid date string',
                details: [{
                    message: '"value" must be a number of milliseconds or valid date string',
                    path: [],
                    type: 'date.base',
                    context: { label: 'value', value: true }
                }]
            }],
            [false, false, null, {
                message: '"value" must be a number of milliseconds or valid date string',
                details: [{
                    message: '"value" must be a number of milliseconds or valid date string',
                    path: [],
                    type: 'date.base',
                    context: { label: 'value', value: false }
                }]
            }]
        ]);
    });

    it('fails on non-finite numbers', () => {

        const schema = Joi.date();
        Helper.validate(schema, [
            [Infinity, false, null, {
                message: '"value" must be a number of milliseconds or valid date string',
                details: [{
                    message: '"value" must be a number of milliseconds or valid date string',
                    path: [],
                    type: 'date.base',
                    context: { label: 'value', value: Infinity }
                }]
            }],
            [-Infinity, false, null, {
                message: '"value" must be a number of milliseconds or valid date string',
                details: [{
                    message: '"value" must be a number of milliseconds or valid date string',
                    path: [],
                    type: 'date.base',
                    context: { label: 'value', value: -Infinity }
                }]
            }],
            [NaN, false, null, {
                message: '"value" must be a number of milliseconds or valid date string',
                details: [{
                    message: '"value" must be a number of milliseconds or valid date string',
                    path: [],
                    type: 'date.base',
                    context: { label: 'value', value: NaN }
                }]
            }]
        ]);
    });

    it('matches specific date', () => {

        const now = Date.now();
        expect(Joi.date().valid(new Date(now)).validate(new Date(now)).error).to.not.exist();
        expect(Joi.date().valid(new Date(now)).validate(new Date(now).toISOString()).error).to.not.exist();
    });

    it('errors on invalid input and convert disabled', () => {

        const err = Joi.date().prefs({ convert: false }).validate('1-1-2013 UTC').error;
        expect(err).to.be.an.error('"value" must be a valid date');
        expect(err.details).to.equal([{
            message: '"value" must be a valid date',
            path: [],
            type: 'date.strict',
            context: { label: 'value', value: '1-1-2013 UTC' }
        }]);
    });

    it('validates date', () => {

        expect(Joi.date().validate(new Date()).error).to.not.exist();
    });

    it('validates millisecond date as a string', () => {

        const now = new Date();
        const mili = now.getTime();

        expect(Joi.date().validate(mili.toString())).to.equal({ value: now });
    });

    it('validates only valid dates', () => {

        const invalidDate = new Date('not a valid date');
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
                    context: { label: 'value', value: 'not a valid date' }
                }]
            }],
            [invalidDate, false, null, {
                message: '"value" must be a number of milliseconds or valid date string',
                details: [{
                    message: '"value" must be a number of milliseconds or valid date string',
                    path: [],
                    type: 'date.base',
                    context: { label: 'value', value: invalidDate }
                }]
            }]
        ]);
    });

    describe('cast()', () => {

        it('casts value to number', () => {

            const schema = Joi.date().cast('number');
            expect(schema.validate(new Date('1974-05-07')).value).to.equal(137116800000);
        });

        it('casts value to string', () => {

            const schema = Joi.date().cast('string');
            expect(schema.validate(new Date('1974-05-07')).value).to.equal('1974-05-07T00:00:00.000Z');
        });

        it('casts value to string (custom format)', () => {

            const schema = Joi.date().prefs({ dateFormat: 'date' }).cast('string');
            expect(schema.validate(new Date('1974-05-07')).value).to.equal('Tue May 07 1974');
        });

        it('ignores null', () => {

            const schema = Joi.date().allow(null).cast('string');
            expect(schema.validate(null).value).to.be.null();
        });

        it('ignores string', () => {

            const schema = Joi.date().allow('x').cast('string');
            expect(schema.validate('x').value).to.equal('x');
        });
    });

    describe('greater()', () => {

        it('validates greater', () => {

            const d = new Date('1-1-2000 UTC');
            const message = `"value" must be greater than "${d.toISOString()}"`;
            Helper.validate(Joi.date().greater('1-1-2000 UTC'), [
                ['1-1-2001 UTC', true],
                ['1-1-2000 UTC', false, null, {
                    message,
                    details: [{
                        message,
                        path: [],
                        type: 'date.greater',
                        context: { limit: d, label: 'value', value: new Date('1-1-2000 UTC') }
                    }]
                }],
                [0, false, null, {
                    message,
                    details: [{
                        message,
                        path: [],
                        type: 'date.greater',
                        context: { limit: d, label: 'value', value: new Date(0) }
                    }]
                }],
                ['0', false, null, {
                    message,
                    details: [{
                        message,
                        path: [],
                        type: 'date.greater',
                        context: { limit: d, label: 'value', value: new Date(0) }
                    }]
                }],
                ['-1', false, null, {
                    message,
                    details: [{
                        message,
                        path: [],
                        type: 'date.greater',
                        context: { limit: d, label: 'value', value: new Date(-1) }
                    }]
                }],
                ['1-1-1999 UTC', false, null, {
                    message,
                    details: [{
                        message,
                        path: [],
                        type: 'date.greater',
                        context: { limit: d, label: 'value', value: new Date('1-1-1999 UTC') }
                    }]
                }]
            ]);
        });

        it('accepts "now" as the greater date', () => {

            const future = new Date(Date.now() + 1000000);
            expect(Joi.date().greater('now').validate(future)).to.equal({ value: future });
        });

        it('errors if .greater("now") is used with a past date', () => {

            const now = Date.now();
            const past = new Date(now - 1000000);

            const err = Joi.date().greater('now').validate(past).error;
            const message = '"value" must be greater than "now"';
            expect(err).to.be.an.error(message);
            expect(err.details).to.equal([{
                message: '"value" must be greater than "now"',
                path: [],
                type: 'date.greater',
                context: { limit: 'now', label: 'value', value: past }
            }]);
        });

        it('accepts references as greater date', () => {

            const ref = Joi.ref('a');
            const schema = Joi.object({ a: Joi.date(), b: Joi.date().greater(ref) });
            const now = Date.now();

            Helper.validate(schema, [
                [{ a: now, b: now }, false, null, {
                    message: '"b" must be greater than "ref:a"',
                    details: [{
                        message: '"b" must be greater than "ref:a"',
                        path: ['b'],
                        type: 'date.greater',
                        context: { limit: ref, label: 'b', key: 'b', value: new Date(now) }
                    }]
                }],
                [{ a: now, b: now + 1e3 }, true],
                [{ a: now, b: now - 1e3 }, false, null, {
                    message: '"b" must be greater than "ref:a"',
                    details: [{
                        message: '"b" must be greater than "ref:a"',
                        path: ['b'],
                        type: 'date.greater',
                        context: { limit: ref, label: 'b', key: 'b', value: new Date(now - 1e3) }
                    }]
                }]
            ]);
        });

        it('accepts references as greater date within a when', () => {

            const ref = Joi.ref('b');
            const schema = Joi.object({
                a: Joi.date().required(),
                b: Joi.date().required(),
                c: Joi.number().required().when('a', {
                    is: Joi.date().greater(ref), // a > b
                    then: Joi.number().valid(0)
                })
            });

            Helper.validate(schema, [
                [{ a: 123, b: 123, c: 0 }, true],
                [{ a: 123, b: 456, c: 42 }, true],
                [{ a: 456, b: 123, c: 0 }, true],
                [{ a: 123, b: 123, c: 42 }, true],
                [{ a: 456, b: 123, c: 42 }, false, null, {
                    message: '"c" must be one of [0]',
                    details: [{
                        message: '"c" must be one of [0]',
                        path: ['c'],
                        type: 'any.only',
                        context: { value: 42, valids: [0], label: 'c', key: 'c' }
                    }]
                }]
            ]);
        });

        it('accepts context references as greater date', () => {

            const ref = Joi.ref('$a');
            const schema = Joi.object({ b: Joi.date().greater(ref) });
            const now = Date.now();

            Helper.validate(schema, [
                [{ b: now }, false, { context: { a: now } }, {
                    message: '"b" must be greater than "ref:global:a"',
                    details: [{
                        message: '"b" must be greater than "ref:global:a"',
                        path: ['b'],
                        type: 'date.greater',
                        context: { limit: ref, label: 'b', key: 'b', value: new Date(now) }
                    }]
                }],
                [{ b: now + 1e3 }, true, { context: { a: now } }],
                [{ b: now - 1e3 }, false, { context: { a: now } }, {
                    message: '"b" must be greater than "ref:global:a"',
                    details: [{
                        message: '"b" must be greater than "ref:global:a"',
                        path: ['b'],
                        type: 'date.greater',
                        context: { limit: ref, label: 'b', key: 'b', value: new Date(now - 1e3) }
                    }]
                }]
            ]);
        });

        it('errors if reference is not a date', () => {

            const ref = Joi.ref('a');
            const schema = Joi.object({ a: Joi.string(), b: Joi.date().greater(ref) });
            const now = Date.now();

            Helper.validate(schema, [
                [{ a: 'abc', b: now }, false, null, {
                    message: '"b" date references "ref:a" which must have a valid date format',
                    details: [{
                        message: '"b" date references "ref:a" which must have a valid date format',
                        path: ['b'],
                        type: 'any.ref',
                        context: { ref, label: 'b', key: 'b', value: 'abc', arg: 'date', reason: 'must have a valid date format' }
                    }]
                }],
                [{ a: '123', b: now }, true],
                [{ a: (now + 1e3).toString(), b: now }, false, null, {
                    message: '"b" must be greater than "ref:a"',
                    details: [{
                        message: '"b" must be greater than "ref:a"',
                        path: ['b'],
                        type: 'date.greater',
                        context: { limit: ref, label: 'b', key: 'b', value: new Date(now) }
                    }]
                }]
            ]);
        });

        it('errors if context reference is not a date', () => {

            const ref = Joi.ref('$a');
            const schema = Joi.object({ b: Joi.date().greater(ref) });
            const now = Date.now();

            Helper.validate(schema, [
                [{ b: now }, false, { context: { a: 'abc' } }, {
                    message: '"b" date references "ref:global:a" which must have a valid date format',
                    details: [{
                        message: '"b" date references "ref:global:a" which must have a valid date format',
                        path: ['b'],
                        type: 'any.ref',
                        context: { ref, label: 'b', key: 'b', value: 'abc', arg: 'date', reason: 'must have a valid date format' }
                    }]
                }],
                [{ b: now }, false, { context: { a: (now + 1e3).toString() } }, {
                    message: '"b" must be greater than "ref:global:a"',
                    details: [{
                        message: '"b" must be greater than "ref:global:a"',
                        path: ['b'],
                        type: 'date.greater',
                        context: { limit: ref, label: 'b', key: 'b', value: new Date(now) }
                    }]
                }]
            ]);
        });
    });

    describe('iso()', () => {

        it('avoids unnecessary cloning when called twice', () => {

            const schema = Joi.date().iso();
            expect(schema.iso()).to.shallow.equal(schema);
        });

        it('validates isoDate', () => {

            Helper.validate(Joi.date().iso(), [
                ['+002013-06-07T14:21:46.295Z', true],
                ['-002013-06-07T14:21:46.295Z', true],
                ['002013-06-07T14:21:46.295Z', false, null, {
                    message: '"value" must be a valid ISO 8601 date',
                    details: [{
                        message: '"value" must be a valid ISO 8601 date',
                        path: [],
                        type: 'date.isoDate',
                        context: { label: 'value', value: '002013-06-07T14:21:46.295Z' }
                    }]
                }],
                ['+2013-06-07T14:21:46.295Z', false, null, {
                    message: '"value" must be a valid ISO 8601 date',
                    details: [{
                        message: '"value" must be a valid ISO 8601 date',
                        path: [],
                        type: 'date.isoDate',
                        context: { label: 'value', value: '+2013-06-07T14:21:46.295Z' }
                    }]
                }],
                ['-2013-06-07T14:21:46.295Z', false, null, {
                    message: '"value" must be a valid ISO 8601 date',
                    details: [{
                        message: '"value" must be a valid ISO 8601 date',
                        path: [],
                        type: 'date.isoDate',
                        context: { label: 'value', value: '-2013-06-07T14:21:46.295Z' }
                    }]
                }],
                ['2013-06-07T14:21:46.295Z', true],
                ['2013-06-07T14:21:46.295Z0', false, null, {
                    message: '"value" must be a valid ISO 8601 date',
                    details: [{
                        message: '"value" must be a valid ISO 8601 date',
                        path: [],
                        type: 'date.isoDate',
                        context: { label: 'value', value: '2013-06-07T14:21:46.295Z0' }
                    }]
                }],
                ['2013-06-07T14:21:46.295+07:00', true],
                ['2013-06-07T14:21:46.295+07:000', false, null, {
                    message: '"value" must be a valid ISO 8601 date',
                    details: [{
                        message: '"value" must be a valid ISO 8601 date',
                        path: [],
                        type: 'date.isoDate',
                        context: { label: 'value', value: '2013-06-07T14:21:46.295+07:000' }
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
                        context: { label: 'value', value: '2013-06-07T14:21:46Z0' }
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
                        context: { label: 'value', value: '2013-06-07T14:21+07:000' }
                    }]
                }],
                ['2013-06-07T14:21-07:00', true],
                ['2013-06-07T14:21Z+7:00', false, null, {
                    message: '"value" must be a valid ISO 8601 date',
                    details: [{
                        message: '"value" must be a valid ISO 8601 date',
                        path: [],
                        type: 'date.isoDate',
                        context: { label: 'value', value: '2013-06-07T14:21Z+7:00' }
                    }]
                }],
                ['2013-06-07', true],
                ['2013-06-07T', false, null, {
                    message: '"value" must be a valid ISO 8601 date',
                    details: [{
                        message: '"value" must be a valid ISO 8601 date',
                        path: [],
                        type: 'date.isoDate',
                        context: { label: 'value', value: '2013-06-07T' }
                    }]
                }],
                ['2013-06-07T14:21', true],
                ['1-1-2013', false, null, {
                    message: '"value" must be a valid ISO 8601 date',
                    details: [{
                        message: '"value" must be a valid ISO 8601 date',
                        path: [],
                        type: 'date.isoDate',
                        context: { label: 'value', value: '1-1-2013' }
                    }]
                }],
                ['2013', true, null, new Date('2013')]
            ]);
        });

        it('converts expanded isoDates', () => {

            const schema = { item: Joi.date().iso() };
            expect(Joi.compile(schema).validate({ item: '-002013-06-07T14:21:46.295Z' })).to.equal({ value: { item: new Date('-002013-06-07T14:21:46.295Z') } });
        });

        it('validates isoDate with a friendly error message', () => {

            const schema = { item: Joi.date().iso() };
            const err = Joi.compile(schema).validate({ item: 'something' }).error;
            expect(err.message).to.equal('"item" must be a valid ISO 8601 date');
            expect(err.details).to.equal([{
                message: '"item" must be a valid ISO 8601 date',
                path: ['item'],
                type: 'date.isoDate',
                context: { label: 'item', key: 'item', value: 'something' }
            }]);
        });

        it('validates isoDate after clone', () => {

            const schema = { item: Joi.date().iso().clone() };
            expect(Joi.compile(schema).validate({ item: '2013-06-07T14:21:46.295Z' }).error).to.not.exist();
        });
    });

    describe('less()', () => {

        it('validates less', () => {

            const d = new Date('1-1-1970 UTC');
            const message = `"value" must be less than "${d}"`;
            Helper.validate(Joi.date().less('1-1-1970 UTC').prefs({ dateFormat: 'string' }), [
                ['1-1-1971 UTC', false, null, {
                    message,
                    details: [{
                        message,
                        path: [],
                        type: 'date.less',
                        context: { limit: d, label: 'value', value: new Date('1-1-1971 UTC') }
                    }]
                }],
                ['1-1-1970 UTC', false, null, {
                    message,
                    details: [{
                        message,
                        path: [],
                        type: 'date.less',
                        context: { limit: d, label: 'value', value: new Date('1-1-1970 UTC') }
                    }]
                }],
                [0, false, null, {
                    message,
                    details: [{
                        message,
                        path: [],
                        type: 'date.less',
                        context: { limit: d, label: 'value', value: new Date(0) }
                    }]
                }],
                [1, false, null, {
                    message,
                    details: [{
                        message,
                        path: [],
                        type: 'date.less',
                        context: { limit: d, label: 'value', value: new Date(1) }
                    }]
                }],
                ['0', false, null, {
                    message,
                    details: [{
                        message,
                        path: [],
                        type: 'date.less',
                        context: { limit: d, label: 'value', value: new Date(0) }
                    }]
                }],
                ['-1', true],
                ['1-1-2014 UTC', false, null, {
                    message,
                    details: [{
                        message,
                        path: [],
                        type: 'date.less',
                        context: { limit: d, label: 'value', value: new Date('1-1-2014 UTC') }
                    }]
                }]
            ]);
        });

        it('accepts "now" as the less date', () => {

            const past = new Date(Date.now() - 1000000);
            expect(Joi.date().less('now').validate(past)).to.equal({ value: past });
        });

        it('errors if .less("now") is used with a future date', () => {

            const now = Date.now();
            const future = new Date(now + 1000000);

            const err = Joi.date().less('now').validate(future).error;
            const message = '"value" must be less than "now"';
            expect(err).to.be.an.error(message);
            expect(err.details).to.equal([{
                message: '"value" must be less than "now"',
                path: [],
                type: 'date.less',
                context: { limit: 'now', label: 'value', value: future }
            }]);
        });

        it('accepts references as less date', () => {

            const ref = Joi.ref('a');
            const schema = Joi.object({ a: Joi.date(), b: Joi.date().less(ref) });
            const now = Date.now();

            Helper.validate(schema, [
                [{ a: now, b: now }, false, null, {
                    message: '"b" must be less than "ref:a"',
                    details: [{
                        message: '"b" must be less than "ref:a"',
                        path: ['b'],
                        type: 'date.less',
                        context: { limit: ref, label: 'b', key: 'b', value: new Date(now) }
                    }]
                }],
                [{ a: now, b: now + 1e3 }, false, null, {
                    message: '"b" must be less than "ref:a"',
                    details: [{
                        message: '"b" must be less than "ref:a"',
                        path: ['b'],
                        type: 'date.less',
                        context: { limit: ref, label: 'b', key: 'b', value: new Date(now + 1e3) }
                    }]
                }],
                [{ a: now, b: now - 1e3 }, true]
            ]);
        });

        it('accepts references as less date', () => {

            const ref = Joi.ref('$a');
            const schema = Joi.object({ b: Joi.date().less(ref) });
            const now = Date.now();

            Helper.validate(schema, [
                [{ b: now }, false, { context: { a: now } }, {
                    message: '"b" must be less than "ref:global:a"',
                    details: [{
                        message: '"b" must be less than "ref:global:a"',
                        path: ['b'],
                        type: 'date.less',
                        context: { limit: ref, label: 'b', key: 'b', value: new Date(now) }
                    }]
                }],
                [{ b: now + 1e3 }, false, { context: { a: now } }, {
                    message: '"b" must be less than "ref:global:a"',
                    details: [{
                        message: '"b" must be less than "ref:global:a"',
                        path: ['b'],
                        type: 'date.less',
                        context: { limit: ref, label: 'b', key: 'b', value: new Date(now + 1e3) }
                    }]
                }],
                [{ b: now - 1e3 }, true, { context: { a: now } }]
            ]);
        });

        it('errors if reference is not a date', () => {

            const ref = Joi.ref('a');
            const schema = Joi.object({ a: Joi.string(), b: Joi.date().less(ref) });
            const now = Date.now();

            Helper.validate(schema, [
                [{ a: 'abc', b: new Date() }, false, null, {
                    message: '"b" date references "ref:a" which must have a valid date format',
                    details: [{
                        message: '"b" date references "ref:a" which must have a valid date format',
                        path: ['b'],
                        type: 'any.ref',
                        context: { ref, label: 'b', key: 'b', value: 'abc', arg: 'date', reason: 'must have a valid date format' }
                    }]
                }],
                [{ a: '100000000000000', b: now }, true],
                [{ a: (now - 1e3).toString(), b: now }, false, null, {
                    message: '"b" must be less than "ref:a"',
                    details: [{
                        message: '"b" must be less than "ref:a"',
                        path: ['b'],
                        type: 'date.less',
                        context: { limit: ref, label: 'b', key: 'b', value: new Date(now) }
                    }]
                }]
            ]);
        });

        it('errors if context reference is not a date', () => {

            const ref = Joi.ref('$a');
            const schema = Joi.object({ b: Joi.date().less(ref) });
            const now = Date.now();

            Helper.validate(schema, [
                [{ b: now }, false, { context: { a: 'abc' } }, {
                    message: '"b" date references "ref:global:a" which must have a valid date format',
                    details: [{
                        message: '"b" date references "ref:global:a" which must have a valid date format',
                        path: ['b'],
                        type: 'any.ref',
                        context: { ref, label: 'b', key: 'b', value: 'abc', arg: 'date', reason: 'must have a valid date format' }
                    }]
                }],
                [{ b: now }, true, { context: { a: '100000000000000' } }],
                [{ b: now }, false, { context: { a: (now - 1e3).toString() } }, {
                    message: '"b" must be less than "ref:global:a"',
                    details: [{
                        message: '"b" must be less than "ref:global:a"',
                        path: ['b'],
                        type: 'date.less',
                        context: { limit: ref, label: 'b', key: 'b', value: new Date(now) }
                    }]
                }]
            ]);
        });
    });

    describe('max()', () => {

        it('validates max', () => {

            const d = new Date('1-1-1970 UTC');
            const message = `"value" must be less than or equal to "${d.toISOString()}"`;
            Helper.validate(Joi.date().max('1-1-1970 UTC'), [
                ['1-1-1971 UTC', false, null, {
                    message,
                    details: [{
                        message,
                        path: [],
                        type: 'date.max',
                        context: { limit: d, label: 'value', value: new Date('1-1-1971 UTC') }
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
                        context: { limit: d, label: 'value', value: new Date(1) }
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
                        context: { limit: d, label: 'value', value: new Date('1-1-2014 UTC') }
                    }]
                }]
            ]);
        });

        it('accepts "now" as the max date', () => {

            const past = new Date(Date.now() - 1000000);
            expect(Joi.date().max('now').validate(past)).to.equal({ value: past });
        });

        it('errors if .max("now") is used with a future date', () => {

            const now = Date.now();
            const future = new Date(now + 1000000);

            const err = Joi.date().max('now').validate(future).error;
            const message = '"value" must be less than or equal to "now"';
            expect(err).to.be.an.error(message);
            expect(err.details).to.equal([{
                message,
                path: [],
                type: 'date.max',
                context: { limit: 'now', label: 'value', value: future }
            }]);
        });

        it('accepts references as max date', () => {

            const ref = Joi.ref('a');
            const schema = Joi.object({ a: Joi.date(), b: Joi.date().max(ref) });
            const now = Date.now();

            Helper.validate(schema, [
                [{ a: now, b: now }, true],
                [{ a: now, b: now + 1e3 }, false, null, {
                    message: '"b" must be less than or equal to "ref:a"',
                    details: [{
                        message: '"b" must be less than or equal to "ref:a"',
                        path: ['b'],
                        type: 'date.max',
                        context: { limit: ref, label: 'b', key: 'b', value: new Date(now + 1e3) }
                    }]
                }],
                [{ a: now, b: now - 1e3 }, true]
            ]);
        });

        it('accepts context references as max date', () => {

            const ref = Joi.ref('$a');
            const schema = Joi.object({ b: Joi.date().max(ref) });
            const now = Date.now();

            Helper.validate(schema, [
                [{ b: now }, true, { context: { a: now } }],
                [{ b: now + 1e3 }, false, { context: { a: now } }, {
                    message: '"b" must be less than or equal to "ref:global:a"',
                    details: [{
                        message: '"b" must be less than or equal to "ref:global:a"',
                        path: ['b'],
                        type: 'date.max',
                        context: { limit: ref, label: 'b', key: 'b', value: new Date(now + 1e3) }
                    }]
                }],
                [{ b: now - 1e3 }, true, { context: { a: now } }]
            ]);
        });

        it('supports template operations', () => {

            const ref = Joi.x('{number(from) + 364 * day}');
            const schema = Joi.object({
                annual: Joi.boolean().required(),
                from: Joi.date().required(),
                to: Joi.date().required()
                    .when('annual', { is: true, then: Joi.date().max(ref) })
            });

            Helper.validate(schema, [
                [{ annual: false, from: '2000-01-01', to: '2010-01-01' }, true],
                [{ annual: true, from: '2000-01-01', to: '2000-12-30' }, true],
                [{ annual: true, from: '2000-01-01', to: '2010-01-01' }, false, null, {
                    message: '"to" must be less than or equal to "{number(from) + 364 * day}"',
                    details: [{
                        message: '"to" must be less than or equal to "{number(from) + 364 * day}"',
                        path: ['to'],
                        type: 'date.max',
                        context: { limit: ref, label: 'to', key: 'to', value: new Date('2010-01-01') }
                    }]
                }]
            ]);
        });

        it('errors if reference is not a date', () => {

            const ref = Joi.ref('a');
            const schema = Joi.object({ a: Joi.string(), b: Joi.date().max(ref) });
            const now = Date.now();

            Helper.validate(schema, [
                [{ a: 'abc', b: new Date() }, false, null, {
                    message: '"b" date references "ref:a" which must have a valid date format',
                    details: [{
                        message: '"b" date references "ref:a" which must have a valid date format',
                        path: ['b'],
                        type: 'any.ref',
                        context: { ref, label: 'b', key: 'b', value: 'abc', arg: 'date', reason: 'must have a valid date format' }
                    }]
                }],
                [{ a: '100000000000000', b: now }, true],
                [{ a: (now - 1e3).toString(), b: now }, false, null, {
                    message: '"b" must be less than or equal to "ref:a"',
                    details: [{
                        message: '"b" must be less than or equal to "ref:a"',
                        path: ['b'],
                        type: 'date.max',
                        context: { limit: ref, label: 'b', key: 'b', value: new Date(now) }
                    }]
                }]
            ]);
        });

        it('errors if context reference is not a date', () => {

            const ref = Joi.ref('$a');
            const schema = Joi.object({ b: Joi.date().max(ref) });
            const now = Date.now();

            Helper.validate(schema, [
                [{ b: now }, false, { context: { a: 'abc' } }, {
                    message: '"b" date references "ref:global:a" which must have a valid date format',
                    details: [{
                        message: '"b" date references "ref:global:a" which must have a valid date format',
                        path: ['b'],
                        type: 'any.ref',
                        context: { ref, label: 'b', key: 'b', value: 'abc', arg: 'date', reason: 'must have a valid date format' }
                    }]
                }],
                [{ b: now }, true, { context: { a: '100000000000000' } }],
                [{ b: now }, false, { context: { a: (now - 1e3).toString() } }, {
                    message: '"b" must be less than or equal to "ref:global:a"',
                    details: [{
                        message: '"b" must be less than or equal to "ref:global:a"',
                        path: ['b'],
                        type: 'date.max',
                        context: { limit: ref, label: 'b', key: 'b', value: new Date(now) }
                    }]
                }]
            ]);
        });
    });

    describe('min()', () => {

        it('validates min', () => {

            const d = new Date('1-1-2000 UTC');
            const message = `"value" must be larger than or equal to "${d.toISOString()}"`;
            Helper.validate(Joi.date().min('1-1-2000 UTC'), [
                ['1-1-2001 UTC', true],
                ['1-1-2000 UTC', true],
                [0, false, null, {
                    message,
                    details: [{
                        message,
                        path: [],
                        type: 'date.min',
                        context: { limit: d, label: 'value', value: new Date(0) }
                    }]
                }],
                ['0', false, null, {
                    message,
                    details: [{
                        message,
                        path: [],
                        type: 'date.min',
                        context: { limit: d, label: 'value', value: new Date(0) }
                    }]
                }],
                ['-1', false, null, {
                    message,
                    details: [{
                        message,
                        path: [],
                        type: 'date.min',
                        context: { limit: d, label: 'value', value: new Date(-1) }
                    }]
                }],
                ['1-1-1999 UTC', false, null, {
                    message,
                    details: [{
                        message,
                        path: [],
                        type: 'date.min',
                        context: { limit: d, label: 'value', value: new Date('1-1-1999 UTC') }
                    }]
                }]
            ]);
        });

        it('accepts "now" as the min date', () => {

            const future = new Date(Date.now() + 1000000);
            expect(Joi.date().min('now').validate(future)).to.equal({ value: future });
        });

        it('errors if .min("now") is used with a past date', () => {

            const now = Date.now();
            const past = new Date(now - 1000000);

            const err = Joi.date().min('now').validate(past).error;
            const message = '"value" must be larger than or equal to "now"';
            expect(err).to.be.an.error(message);
            expect(err.details).to.equal([{
                message,
                path: [],
                type: 'date.min',
                context: { limit: 'now', label: 'value', value: past }
            }]);
        });

        it('accepts references as min date', () => {

            const ref = Joi.ref('a');
            const schema = Joi.object({ a: Joi.date(), b: Joi.date().min(ref) });
            const now = Date.now();

            Helper.validate(schema, [
                [{ a: now, b: now }, true],
                [{ a: now, b: now + 1e3 }, true],
                [{ a: now, b: now - 1e3 }, false, null, {
                    message: '"b" must be larger than or equal to "ref:a"',
                    details: [{
                        message: '"b" must be larger than or equal to "ref:a"',
                        path: ['b'],
                        type: 'date.min',
                        context: { limit: ref, label: 'b', key: 'b', value: new Date(now - 1e3) }
                    }]
                }]
            ]);
        });

        it('accepts references as min date within a when', () => {

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
                    message: '"c" must be one of [0]',
                    details: [{
                        message: '"c" must be one of [0]',
                        path: ['c'],
                        type: 'any.only',
                        context: { value: 42, valids: [0], label: 'c', key: 'c' }
                    }]
                }],
                [{ a: 456, b: 123, c: 42 }, false, null, {
                    message: '"c" must be one of [0]',
                    details: [{
                        message: '"c" must be one of [0]',
                        path: ['c'],
                        type: 'any.only',
                        context: { value: 42, valids: [0], label: 'c', key: 'c' }
                    }]
                }]
            ]);
        });

        it('accepts context references as min date', () => {

            const ref = Joi.ref('$a');
            const schema = Joi.object({ b: Joi.date().min(ref) });
            const now = Date.now();

            Helper.validate(schema, [
                [{ b: now }, true, { context: { a: now } }],
                [{ b: now + 1e3 }, true, { context: { a: now } }],
                [{ b: now - 1e3 }, false, { context: { a: now } }, {
                    message: '"b" must be larger than or equal to "ref:global:a"',
                    details: [{
                        message: '"b" must be larger than or equal to "ref:global:a"',
                        path: ['b'],
                        type: 'date.min',
                        context: { limit: ref, label: 'b', key: 'b', value: new Date(now - 1e3) }
                    }]
                }]
            ]);
        });

        it('errors if reference is not a date', () => {

            const ref = Joi.ref('a');
            const schema = Joi.object({ a: Joi.string(), b: Joi.date().min(ref) });
            const now = Date.now();

            Helper.validate(schema, [
                [{ a: 'abc', b: now }, false, null, {
                    message: '"b" date references "ref:a" which must have a valid date format',
                    details: [{
                        message: '"b" date references "ref:a" which must have a valid date format',
                        path: ['b'],
                        type: 'any.ref',
                        context: { ref, label: 'b', key: 'b', value: 'abc', arg: 'date', reason: 'must have a valid date format' }
                    }]
                }],
                [{ a: '123', b: now }, true],
                [{ a: (now + 1e3).toString(), b: now }, false, null, {
                    message: '"b" must be larger than or equal to "ref:a"',
                    details: [{
                        message: '"b" must be larger than or equal to "ref:a"',
                        path: ['b'],
                        type: 'date.min',
                        context: { limit: ref, label: 'b', key: 'b', value: new Date(now) }
                    }]
                }]
            ]);
        });

        it('errors if context reference is not a date', () => {

            const ref = Joi.ref('$a');
            const schema = Joi.object({ b: Joi.date().min(ref) });
            const now = Date.now();

            Helper.validate(schema, [
                [{ b: now }, false, { context: { a: 'abc' } }, {
                    message: '"b" date references "ref:global:a" which must have a valid date format',
                    details: [{
                        message: '"b" date references "ref:global:a" which must have a valid date format',
                        path: ['b'],
                        type: 'any.ref',
                        context: { ref, label: 'b', key: 'b', value: 'abc', arg: 'date', reason: 'must have a valid date format' }
                    }]
                }],
                [{ b: now }, false, { context: { a: (now + 1e3).toString() } }, {
                    message: '"b" must be larger than or equal to "ref:global:a"',
                    details: [{
                        message: '"b" must be larger than or equal to "ref:global:a"',
                        path: ['b'],
                        type: 'date.min',
                        context: { limit: ref, label: 'b', key: 'b', value: new Date(now) }
                    }]
                }]
            ]);
        });
    });

    describe('timestamp()', () => {

        it('avoids unnecessary cloning when called twice', () => {

            const schema = Joi.date().timestamp('unix');
            expect(schema.timestamp('unix')).to.shallow.equal(schema);
        });

        it('fails on empty strings', () => {

            const schema = Joi.date().timestamp();
            Helper.validate(schema, [
                ['', false, null, {
                    message: '"value" must be a valid timestamp or number of milliseconds',
                    details: [{
                        message: '"value" must be a valid timestamp or number of milliseconds',
                        path: [],
                        type: 'date.timestamp.javascript',
                        context: { label: 'value', value: '' }
                    }]
                }],
                [' \t ', false, null, {
                    message: '"value" must be a valid timestamp or number of milliseconds',
                    details: [{
                        message: '"value" must be a valid timestamp or number of milliseconds',
                        path: [],
                        type: 'date.timestamp.javascript',
                        context: { label: 'value', value: ' \t ' }
                    }]
                }]
            ]);
        });

        it('validates javascript timestamp', () => {

            const now = new Date();
            const milliseconds = now.getTime();

            expect(Joi.date().timestamp().validate(milliseconds)).to.equal({ value: now });
            expect(Joi.date().timestamp('javascript').validate(milliseconds)).to.equal({ value: now });
            expect(Joi.date().timestamp('unix').timestamp('javascript').validate(milliseconds)).to.equal({ value: now });
        });

        it('validates unix timestamp', () => {

            const now = new Date();
            const seconds = now.getTime() / 1000;

            expect(Joi.date().timestamp('unix').validate(seconds)).to.equal({ value: now });
            expect(Joi.date().timestamp().timestamp('unix').validate(seconds)).to.equal({ value: now });
            expect(Joi.date().timestamp('javascript').timestamp('unix').validate(seconds)).to.equal({ value: now });
        });

        it('validates timestamps with decimals', () => {

            Helper.validate(Joi.date().timestamp(), [
                [new Date().getTime().toFixed(4), true]
            ]);
            Helper.validate(Joi.date().timestamp('javascript'), [
                [new Date().getTime().toFixed(4), true]
            ]);
            Helper.validate(Joi.date().timestamp('unix'), [
                [(new Date().getTime() / 1000).toFixed(4), true]
            ]);
        });

        it('validates only valid timestamps and returns a friendly error message', () => {

            const invalidDate = new Date('not a valid date');
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
                        context: { label: 'value', value: ',' }
                    }]
                }],
                ['123A,0xA', false, null, {
                    message: '"value" must be a valid timestamp or number of milliseconds',
                    details: [{
                        message: '"value" must be a valid timestamp or number of milliseconds',
                        path: [],
                        type: 'date.timestamp.javascript',
                        context: { label: 'value', value: '123A,0xA' }
                    }]
                }],
                ['1-1-2013 UTC', false, null, {
                    message: '"value" must be a valid timestamp or number of milliseconds',
                    details: [{
                        message: '"value" must be a valid timestamp or number of milliseconds',
                        path: [],
                        type: 'date.timestamp.javascript',
                        context: { label: 'value', value: '1-1-2013 UTC' }
                    }]
                }],
                ['not a valid timestamp', false, null, {
                    message: '"value" must be a valid timestamp or number of milliseconds',
                    details: [{
                        message: '"value" must be a valid timestamp or number of milliseconds',
                        path: [],
                        type: 'date.timestamp.javascript',
                        context: { label: 'value', value: 'not a valid timestamp' }
                    }]
                }],
                [invalidDate, false, null, {
                    message: '"value" must be a valid timestamp or number of milliseconds',
                    details: [{
                        message: '"value" must be a valid timestamp or number of milliseconds',
                        path: [],
                        type: 'date.timestamp.javascript',
                        context: { label: 'value', value: invalidDate }
                    }]
                }]
            ]);
        });

        it('fails with not allowed type', () => {

            expect(() => {

                Joi.date().timestamp('not allowed');
            }).to.throw(Error, /"type" must be one of/);
        });
    });
});
