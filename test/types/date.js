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
            [true, false, {
                message: '"value" must be a valid date',
                path: [],
                type: 'date.base',
                context: { label: 'value', value: true }
            }],
            [false, false, {
                message: '"value" must be a valid date',
                path: [],
                type: 'date.base',
                context: { label: 'value', value: false }
            }]
        ]);
    });

    it('fails on non-finite numbers', () => {

        const schema = Joi.date();
        Helper.validate(schema, [
            [Infinity, false, {
                message: '"value" must be a valid date',
                path: [],
                type: 'date.base',
                context: { label: 'value', value: Infinity }
            }],
            [-Infinity, false, {
                message: '"value" must be a valid date',
                path: [],
                type: 'date.base',
                context: { label: 'value', value: -Infinity }
            }],
            [NaN, false, {
                message: '"value" must be a valid date',
                path: [],
                type: 'date.base',
                context: { label: 'value', value: NaN }
            }]
        ]);
    });

    it('matches specific date', () => {

        const now = Date.now();
        Helper.validate(Joi.date().valid(new Date(now)), [
            [new Date(now), true],
            [new Date(now).toISOString(), true, new Date(now)]
        ]);
    });

    it('errors on invalid input and convert disabled', () => {

        Helper.validate(Joi.date().prefs({ convert: false }), [['1-1-2013 UTC', false, {
            message: '"value" must be a valid date',
            path: [],
            type: 'date.base',
            context: { label: 'value', value: '1-1-2013 UTC' }
        }]]);
    });

    it('validates date', () => {

        Helper.validate(Joi.date(), [[new Date(), true]]);
    });

    it('validates millisecond date as a string', () => {

        const now = new Date();
        const mili = now.getTime();

        Helper.validate(Joi.date(), [[mili.toString(), true, now]]);
    });

    it('validates only valid dates', () => {

        const now = new Date();
        const invalidDate = new Date('not a valid date');

        Helper.validate(Joi.date(), [
            ['1-1-2013 UTC', true, new Date('1-1-2013 UTC')],
            [now.getTime(), true, now],
            [now.getTime().toFixed(4), true, now],
            ['not a valid date', false, {
                message: '"value" must be a valid date',
                path: [],
                type: 'date.base',
                context: { label: 'value', value: 'not a valid date' }
            }],
            [invalidDate, false, {
                message: '"value" must be a valid date',
                path: [],
                type: 'date.base',
                context: { label: 'value', value: invalidDate }
            }]
        ]);
    });

    describe('cast()', () => {

        it('casts value to number', () => {

            const schema = Joi.date().cast('number');
            Helper.validate(schema, [[new Date('1974-05-07'), true, 137116800000]]);
        });

        it('casts value to string', () => {

            const schema = Joi.date().cast('string');
            Helper.validate(schema, [[new Date('1974-05-07'), true, '1974-05-07T00:00:00.000Z']]);
        });

        it('casts value to string (custom format)', () => {

            const schema = Joi.date().prefs({ dateFormat: 'date' }).cast('string');
            Helper.validate(schema, [[new Date('1974-05-07'), true, 'Tue May 07 1974']]);
        });

        it('ignores null', () => {

            const schema = Joi.date().allow(null).cast('string');
            Helper.validate(schema, [[null, true, null]]);
        });

        it('ignores string', () => {

            const schema = Joi.date().allow('x').cast('string');
            Helper.validate(schema, [['x', true, 'x']]);
        });
    });

    describe('format()', () => {

        it('ignores unknown formats', () => {

            const custom = Joi.extend({
                type: 'date',
                base: Joi.date(),
                overrides: {
                    format(format) {

                        if (['iso', 'javascript', 'unix'].includes(format)) {
                            return this.$_super.format(format);
                        }

                        return this.$_setFlag('format', format);
                    }
                }
            });

            const now = Date.now();
            Helper.validate(custom.date().format('unknown'), [
                ['x', false, '"value" must be in unknown format'],
                [now, true, new Date(now)]
            ]);

            Helper.validate(custom.date().format(['unknown']), [
                ['x', false, '"value" must be in [unknown] format']
            ]);
        });

        it('enforces format when value is a string', () => {

            const schema = Joi.date().$_setFlag('format', 'MM-DD-YY');

            // Cannot use Helper since format is set to unknown value

            expect(schema.validate(new Date()).error).to.not.exist();
            expect(schema.validate(Date.now()).error).to.not.exist();
            expect(schema.validate('1').error).to.be.an.error('"value" must be in MM-DD-YY format');
        });
    });

    describe('greater()', () => {

        it('validates greater', () => {

            const d = new Date('1-1-2000 UTC');
            const message = `"value" must be greater than "${d.toISOString()}"`;
            Helper.validate(Joi.date().greater('1-1-2000 UTC'), [
                ['1-1-2001 UTC', true, new Date('1-1-2001 UTC')],
                ['1-1-2000 UTC', false, {
                    message,
                    path: [],
                    type: 'date.greater',
                    context: { limit: d, label: 'value', value: new Date('1-1-2000 UTC') }
                }],
                [0, false, {
                    message,
                    path: [],
                    type: 'date.greater',
                    context: { limit: d, label: 'value', value: new Date(0) }
                }],
                ['0', false, {
                    message,
                    path: [],
                    type: 'date.greater',
                    context: { limit: d, label: 'value', value: new Date(0) }
                }],
                ['-1', false, {
                    message,
                    path: [],
                    type: 'date.greater',
                    context: { limit: d, label: 'value', value: new Date(-1) }
                }],
                ['1-1-1999 UTC', false, {
                    message,
                    path: [],
                    type: 'date.greater',
                    context: { limit: d, label: 'value', value: new Date('1-1-1999 UTC') }
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

            Helper.validate(Joi.date().greater('now'), [
                [past, false, {
                    message: '"value" must be greater than "now"',
                    path: [],
                    type: 'date.greater',
                    context: { limit: 'now', label: 'value', value: past }
                }]
            ]);
        });

        it('accepts references as greater date', () => {

            const ref = Joi.ref('a');
            const schema = Joi.object({ a: Joi.date(), b: Joi.date().greater(ref) });
            const now = Date.now();

            Helper.validate(schema, [
                [{ a: now, b: now }, false, {
                    message: '"b" must be greater than "ref:a"',
                    path: ['b'],
                    type: 'date.greater',
                    context: { limit: ref, label: 'b', key: 'b', value: new Date(now) }
                }],
                [{ a: now, b: now + 1e3 }, true, { a: new Date(now), b: new Date(now + 1e3) }],
                [{ a: now, b: now - 1e3 }, false, {
                    message: '"b" must be greater than "ref:a"',
                    path: ['b'],
                    type: 'date.greater',
                    context: { limit: ref, label: 'b', key: 'b', value: new Date(now - 1e3) }
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
                [{ a: 123, b: 123, c: 0 }, true, { a: new Date(123), b: new Date(123), c: 0 }],
                [{ a: 123, b: 456, c: 42 }, true, { a: new Date(123), b: new Date(456), c: 42 }],
                [{ a: 456, b: 123, c: 0 }, true, { a: new Date(456), b: new Date(123), c: 0 }],
                [{ a: 123, b: 123, c: 42 }, true, { a: new Date(123), b: new Date(123), c: 42 }],
                [{ a: 456, b: 123, c: 42 }, false, {
                    message: '"c" must be [0]',
                    path: ['c'],
                    type: 'any.only',
                    context: { value: 42, valids: [0], label: 'c', key: 'c' }
                }]
            ]);
        });

        it('accepts context references as greater date', () => {

            const ref = Joi.ref('$a');
            const schema = Joi.object({ b: Joi.date().greater(ref) });
            const now = Date.now();

            Helper.validate(schema, { context: { a: now } }, [
                [{ b: now }, false, {
                    message: '"b" must be greater than "ref:global:a"',
                    path: ['b'],
                    type: 'date.greater',
                    context: { limit: ref, label: 'b', key: 'b', value: new Date(now) }
                }],
                [{ b: now + 1e3 }, true, { b: new Date(now + 1e3) }],
                [{ b: now - 1e3 }, false, {
                    message: '"b" must be greater than "ref:global:a"',
                    path: ['b'],
                    type: 'date.greater',
                    context: { limit: ref, label: 'b', key: 'b', value: new Date(now - 1e3) }
                }]
            ]);
        });

        it('errors if reference is not a date', () => {

            const ref = Joi.ref('a');
            const schema = Joi.object({ a: Joi.string(), b: Joi.date().greater(ref) });
            const now = Date.now();

            Helper.validate(schema, [
                [{ a: 'abc', b: now }, false, {
                    message: '"b" date references "ref:a" which must have a valid date format',
                    path: ['b'],
                    type: 'any.ref',
                    context: { ref, label: 'b', key: 'b', value: 'abc', arg: 'date', reason: 'must have a valid date format' }
                }],
                [{ a: '123', b: now }, true, { a: '123', b: new Date(now) }],
                [{ a: (now + 1e3).toString(), b: now }, false, {
                    message: '"b" must be greater than "ref:a"',
                    path: ['b'],
                    type: 'date.greater',
                    context: { limit: ref, label: 'b', key: 'b', value: new Date(now) }
                }]
            ]);
        });

        it('errors if context reference is not a date', () => {

            const ref = Joi.ref('$a');
            const schema = Joi.object({ b: Joi.date().greater(ref) });
            const now = Date.now();

            Helper.validate(schema, { context: { a: 'abc' } }, [
                [{ b: now }, false, {
                    message: '"b" date references "ref:global:a" which must have a valid date format',
                    path: ['b'],
                    type: 'any.ref',
                    context: { ref, label: 'b', key: 'b', value: 'abc', arg: 'date', reason: 'must have a valid date format' }
                }]
            ]);

            Helper.validate(schema, { context: { a: (now + 1e3).toString() } }, [
                [{ b: now }, false, {
                    message: '"b" must be greater than "ref:global:a"',
                    path: ['b'],
                    type: 'date.greater',
                    context: { limit: ref, label: 'b', key: 'b', value: new Date(now) }
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
                ['+002013-06-07T14:21:46.295Z', true, new Date('+002013-06-07T14:21:46.295Z')],
                ['-002013-06-07T14:21:46.295Z', true, new Date('-002013-06-07T14:21:46.295Z')],
                ['002013-06-07T14:21:46.295Z', false, {
                    message: '"value" must be in ISO 8601 date format',
                    path: [],
                    type: 'date.format',
                    context: { label: 'value', value: '002013-06-07T14:21:46.295Z', format: 'iso' }
                }],
                ['+2013-06-07T14:21:46.295Z', false, {
                    message: '"value" must be in ISO 8601 date format',
                    path: [],
                    type: 'date.format',
                    context: { label: 'value', value: '+2013-06-07T14:21:46.295Z', format: 'iso' }
                }],
                ['-2013-06-07T14:21:46.295Z', false, {
                    message: '"value" must be in ISO 8601 date format',
                    path: [],
                    type: 'date.format',
                    context: { label: 'value', value: '-2013-06-07T14:21:46.295Z', format: 'iso' }
                }],
                ['2013-06-07T14:21:46.295Z', true, new Date('2013-06-07T14:21:46.295Z')],
                ['2013-06-07T14:21:46.295Z0', false, {
                    message: '"value" must be in ISO 8601 date format',
                    path: [],
                    type: 'date.format',
                    context: { label: 'value', value: '2013-06-07T14:21:46.295Z0', format: 'iso' }
                }],
                ['2013-06-07T14:21:46.295+07:00', true, new Date('2013-06-07T14:21:46.295+07:00')],
                ['2013-06-07T14:21:46.295+07:000', false, {
                    message: '"value" must be in ISO 8601 date format',
                    path: [],
                    type: 'date.format',
                    context: { label: 'value', value: '2013-06-07T14:21:46.295+07:000', format: 'iso' }
                }],
                ['2013-06-07T14:21:46.295-07:00', true, new Date('2013-06-07T14:21:46.295-07:00')],
                ['2013-06-07T14:21:46Z', true, new Date('2013-06-07T14:21:46Z')],
                ['2013-06-07T14:21:46Z0', false, {
                    message: '"value" must be in ISO 8601 date format',
                    path: [],
                    type: 'date.format',
                    context: { label: 'value', value: '2013-06-07T14:21:46Z0', format: 'iso' }
                }],
                ['2013-06-07T14:21:46+07:00', true, new Date('2013-06-07T14:21:46+07:00')],
                ['2013-06-07T14:21:46-07:00', true, new Date('2013-06-07T14:21:46-07:00')],
                ['2013-06-07T14:21Z', true, new Date('2013-06-07T14:21Z')],
                ['2013-06-07T14:21+07:00', true, new Date('2013-06-07T14:21+07:00')],
                ['2013-06-07T14:21+07:000', false, {
                    message: '"value" must be in ISO 8601 date format',
                    path: [],
                    type: 'date.format',
                    context: { label: 'value', value: '2013-06-07T14:21+07:000', format: 'iso' }
                }],
                ['2013-06-07T14:21-07:00', true, new Date('2013-06-07T14:21-07:00')],
                ['2013-06-07T14:21Z+7:00', false, {
                    message: '"value" must be in ISO 8601 date format',
                    path: [],
                    type: 'date.format',
                    context: { label: 'value', value: '2013-06-07T14:21Z+7:00', format: 'iso' }
                }],
                ['2013-06-07', true, new Date('2013-06-07')],
                ['2013-06-07T', false, {
                    message: '"value" must be in ISO 8601 date format',
                    path: [],
                    type: 'date.format',
                    context: { label: 'value', value: '2013-06-07T', format: 'iso' }
                }],
                ['2013-06-07T14:21', true, new Date('2013-06-07T14:21')],
                ['1-1-2013', false, {
                    message: '"value" must be in ISO 8601 date format',
                    path: [],
                    type: 'date.format',
                    context: { label: 'value', value: '1-1-2013', format: 'iso' }
                }],
                ['2013', true, new Date('2013')]
            ]);
        });

        it('converts expanded isoDates', () => {

            const schema = { item: Joi.date().iso() };
            expect(Joi.compile(schema).validate({ item: '-002013-06-07T14:21:46.295Z' })).to.equal({ value: { item: new Date('-002013-06-07T14:21:46.295Z') } });
        });

        it('validates isoDate with a friendly error message', () => {

            const schema = { item: Joi.date().iso() };
            Helper.validate(Joi.compile(schema), [
                [{ item: 'something' }, false, {
                    message: '"item" must be in ISO 8601 date format',
                    path: ['item'],
                    type: 'date.format',
                    context: { label: 'item', key: 'item', value: 'something', format: 'iso' }
                }]
            ]);
        });

        it('validates isoDate after clone', () => {

            const schema = { item: Joi.date().iso().clone() };
            Helper.validate(Joi.compile(schema), [[{ item: '2013-06-07T14:21:46.295Z' }, true, { item: new Date('2013-06-07T14:21:46.295Z') }]]);
        });
    });

    describe('less()', () => {

        it('validates less', () => {

            const d = new Date('1-1-1970 UTC');
            const message = `"value" must be less than "${d}"`;
            Helper.validate(Joi.date().less('1-1-1970 UTC').prefs({ dateFormat: 'string' }), [
                ['1-1-1971 UTC', false, {
                    message,
                    path: [],
                    type: 'date.less',
                    context: { limit: d, label: 'value', value: new Date('1-1-1971 UTC') }
                }],
                ['1-1-1970 UTC', false, {
                    message,
                    path: [],
                    type: 'date.less',
                    context: { limit: d, label: 'value', value: new Date('1-1-1970 UTC') }
                }],
                [0, false, {
                    message,
                    path: [],
                    type: 'date.less',
                    context: { limit: d, label: 'value', value: new Date(0) }
                }],
                [1, false, {
                    message,
                    path: [],
                    type: 'date.less',
                    context: { limit: d, label: 'value', value: new Date(1) }
                }],
                ['0', false, {
                    message,
                    path: [],
                    type: 'date.less',
                    context: { limit: d, label: 'value', value: new Date(0) }
                }],
                ['-1', true, new Date(-1)],
                ['1-1-2014 UTC', false, {
                    message,
                    path: [],
                    type: 'date.less',
                    context: { limit: d, label: 'value', value: new Date('1-1-2014 UTC') }
                }]
            ]);
        });

        it('accepts "now" as the less date', () => {

            const past = new Date(Date.now() - 1000000);
            Helper.validate(Joi.date().less('now'), [[past, true, past]]);
        });

        it('errors if .less("now") is used with a future date', () => {

            const now = Date.now();
            const future = new Date(now + 1000000);

            Helper.validate(Joi.date().less('now'), [[future, false, {
                message: '"value" must be less than "now"',
                path: [],
                type: 'date.less',
                context: { limit: 'now', label: 'value', value: future }
            }]]);
        });

        it('accepts references as less date', () => {

            const ref = Joi.ref('a');
            const schema = Joi.object({ a: Joi.date(), b: Joi.date().less(ref) });
            const now = Date.now();

            Helper.validate(schema, [
                [{ a: now, b: now }, false, {
                    message: '"b" must be less than "ref:a"',
                    path: ['b'],
                    type: 'date.less',
                    context: { limit: ref, label: 'b', key: 'b', value: new Date(now) }
                }],
                [{ a: now, b: now + 1e3 }, false, {
                    message: '"b" must be less than "ref:a"',
                    path: ['b'],
                    type: 'date.less',
                    context: { limit: ref, label: 'b', key: 'b', value: new Date(now + 1e3) }
                }],
                [{ a: now, b: now - 1e3 }, true, { a: new Date(now), b: new Date(now - 1e3) }]
            ]);
        });

        it('accepts references as less date', () => {

            const ref = Joi.ref('$a');
            const schema = Joi.object({ b: Joi.date().less(ref) });
            const now = Date.now();

            Helper.validate(schema, { context: { a: now } }, [
                [{ b: now }, false, {
                    message: '"b" must be less than "ref:global:a"',
                    path: ['b'],
                    type: 'date.less',
                    context: { limit: ref, label: 'b', key: 'b', value: new Date(now) }
                }],
                [{ b: now + 1e3 }, false, {
                    message: '"b" must be less than "ref:global:a"',
                    path: ['b'],
                    type: 'date.less',
                    context: { limit: ref, label: 'b', key: 'b', value: new Date(now + 1e3) }
                }],
                [{ b: now - 1e3 }, true, { b: new Date(now - 1e3) }]
            ]);
        });

        it('errors if reference is not a date', () => {

            const ref = Joi.ref('a');
            const schema = Joi.object({ a: Joi.string(), b: Joi.date().less(ref) });
            const now = Date.now();

            Helper.validate(schema, [
                [{ a: 'abc', b: new Date() }, false, {
                    message: '"b" date references "ref:a" which must have a valid date format',
                    path: ['b'],
                    type: 'any.ref',
                    context: { ref, label: 'b', key: 'b', value: 'abc', arg: 'date', reason: 'must have a valid date format' }
                }],
                [{ a: '100000000000000', b: now }, true, { a: '100000000000000', b: new Date(now) }],
                [{ a: (now - 1e3).toString(), b: now }, false, {
                    message: '"b" must be less than "ref:a"',
                    path: ['b'],
                    type: 'date.less',
                    context: { limit: ref, label: 'b', key: 'b', value: new Date(now) }
                }]
            ]);
        });

        it('errors if context reference is not a date', () => {

            const ref = Joi.ref('$a');
            const schema = Joi.object({ b: Joi.date().less(ref) });
            const now = Date.now();

            Helper.validate(schema, { context: { a: 'abc' } }, [
                [{ b: now }, false, {
                    message: '"b" date references "ref:global:a" which must have a valid date format',
                    path: ['b'],
                    type: 'any.ref',
                    context: { ref, label: 'b', key: 'b', value: 'abc', arg: 'date', reason: 'must have a valid date format' }
                }]
            ]);

            Helper.validate(schema, { context: { a: '100000000000000' } }, [
                [{ b: now }, true, { b: new Date(now) }]
            ]);

            Helper.validate(schema, { context: { a: (now - 1e3).toString() } }, [
                [{ b: now }, false, {
                    message: '"b" must be less than "ref:global:a"',
                    path: ['b'],
                    type: 'date.less',
                    context: { limit: ref, label: 'b', key: 'b', value: new Date(now) }
                }]
            ]);
        });
    });

    describe('max()', () => {

        it('validates max', () => {

            const d = new Date('1-1-1970 UTC');
            const message = `"value" must be less than or equal to "${d.toISOString()}"`;
            Helper.validate(Joi.date().max('1-1-1970 UTC'), [
                ['1-1-1971 UTC', false, {
                    message,
                    path: [],
                    type: 'date.max',
                    context: { limit: d, label: 'value', value: new Date('1-1-1971 UTC') }
                }],
                ['1-1-1970 UTC', true, new Date('1-1-1970 UTC')],
                [0, true, new Date(0)],
                [1, false, {
                    message,
                    path: [],
                    type: 'date.max',
                    context: { limit: d, label: 'value', value: new Date(1) }
                }],
                ['0', true, new Date(0)],
                ['-1', true, new Date(-1)],
                ['1-1-2014 UTC', false, {
                    message,
                    path: [],
                    type: 'date.max',
                    context: { limit: d, label: 'value', value: new Date('1-1-2014 UTC') }
                }]
            ]);
        });

        it('accepts "now" as the max date', () => {

            const past = new Date(Date.now() - 1000000);
            Helper.validate(Joi.date().max('now'), [[past, true, past]]);
        });

        it('errors if .max("now") is used with a future date', () => {

            const now = Date.now();
            const future = new Date(now + 1000000);

            Helper.validate(Joi.date().max('now'), [[future, false, {
                message: '"value" must be less than or equal to "now"',
                path: [],
                type: 'date.max',
                context: { limit: 'now', label: 'value', value: future }
            }]]);
        });

        it('accepts references as max date', () => {

            const ref = Joi.ref('a');
            const schema = Joi.object({ a: Joi.date(), b: Joi.date().max(ref) });
            const now = Date.now();

            Helper.validate(schema, [
                [{ a: now, b: now }, true, { a: new Date(now), b: new Date(now) }],
                [{ a: now, b: now + 1e3 }, false, {
                    message: '"b" must be less than or equal to "ref:a"',
                    path: ['b'],
                    type: 'date.max',
                    context: { limit: ref, label: 'b', key: 'b', value: new Date(now + 1e3) }
                }],
                [{ a: now, b: now - 1e3 }, true, { a: new Date(now), b: new Date(now - 1e3) }]
            ]);
        });

        it('accepts context references as max date', () => {

            const ref = Joi.ref('$a');
            const schema = Joi.object({ b: Joi.date().max(ref) });
            const now = Date.now();

            Helper.validate(schema, { context: { a: now } }, [
                [{ b: now }, true, { b: new Date(now) }],
                [{ b: now + 1e3 }, false, {
                    message: '"b" must be less than or equal to "ref:global:a"',
                    path: ['b'],
                    type: 'date.max',
                    context: { limit: ref, label: 'b', key: 'b', value: new Date(now + 1e3) }
                }],
                [{ b: now - 1e3 }, true, { b: new Date(now - 1000) }]
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
                [{ annual: false, from: '2000-01-01', to: '2010-01-01' }, true, { annual: false, from: new Date('2000-01-01'), to: new Date('2010-01-01') }],
                [{ annual: true, from: '2000-01-01', to: '2000-12-30' }, true, { annual: true, from: new Date('2000-01-01'), to: new Date('2000-12-30') }],
                [{ annual: true, from: '2000-01-01', to: '2010-01-01' }, false, {
                    message: '"to" must be less than or equal to "{number(from) + 364 * day}"',
                    path: ['to'],
                    type: 'date.max',
                    context: { limit: ref, label: 'to', key: 'to', value: new Date('2010-01-01') }
                }]
            ]);
        });

        it('errors if reference is not a date', () => {

            const ref = Joi.ref('a');
            const schema = Joi.object({ a: Joi.string(), b: Joi.date().max(ref) });
            const now = Date.now();

            Helper.validate(schema, [
                [{ a: 'abc', b: new Date() }, false, {
                    message: '"b" date references "ref:a" which must have a valid date format',
                    path: ['b'],
                    type: 'any.ref',
                    context: { ref, label: 'b', key: 'b', value: 'abc', arg: 'date', reason: 'must have a valid date format' }
                }],
                [{ a: '100000000000000', b: now }, true, { a: '100000000000000', b: new Date(now) }],
                [{ a: (now - 1e3).toString(), b: now }, false, {
                    message: '"b" must be less than or equal to "ref:a"',
                    path: ['b'],
                    type: 'date.max',
                    context: { limit: ref, label: 'b', key: 'b', value: new Date(now) }
                }]
            ]);
        });

        it('errors if context reference is not a date', () => {

            const ref = Joi.ref('$a');
            const schema = Joi.object({ b: Joi.date().max(ref) });
            const now = Date.now();

            Helper.validate(schema, { context: { a: 'abc' } }, [
                [{ b: now }, false, {
                    message: '"b" date references "ref:global:a" which must have a valid date format',
                    path: ['b'],
                    type: 'any.ref',
                    context: { ref, label: 'b', key: 'b', value: 'abc', arg: 'date', reason: 'must have a valid date format' }
                }]
            ]);

            Helper.validate(schema, { context: { a: '100000000000000' } }, [
                [{ b: now }, true, { b: new Date(now) }]
            ]);

            Helper.validate(schema, { context: { a: (now - 1e3).toString() } }, [
                [{ b: now }, false, {
                    message: '"b" must be less than or equal to "ref:global:a"',
                    path: ['b'],
                    type: 'date.max',
                    context: { limit: ref, label: 'b', key: 'b', value: new Date(now) }
                }]
            ]);
        });
    });

    describe('min()', () => {

        it('validates min', () => {

            const d = new Date('1-1-2000 UTC');
            const message = `"value" must be greater than or equal to "${d.toISOString()}"`;
            Helper.validate(Joi.date().min('1-1-2000 UTC'), [
                ['1-1-2001 UTC', true, new Date('1-1-2001 UTC')],
                ['1-1-2000 UTC', true, d],
                [0, false, {
                    message,
                    path: [],
                    type: 'date.min',
                    context: { limit: d, label: 'value', value: new Date(0) }
                }],
                ['0', false, {
                    message,
                    path: [],
                    type: 'date.min',
                    context: { limit: d, label: 'value', value: new Date(0) }
                }],
                ['-1', false, {
                    message,
                    path: [],
                    type: 'date.min',
                    context: { limit: d, label: 'value', value: new Date(-1) }
                }],
                ['1-1-1999 UTC', false, {
                    message,
                    path: [],
                    type: 'date.min',
                    context: { limit: d, label: 'value', value: new Date('1-1-1999 UTC') }
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

            Helper.validate(Joi.date().min('now'), [[past, false, {
                message: '"value" must be greater than or equal to "now"',
                path: [],
                type: 'date.min',
                context: { limit: 'now', label: 'value', value: past }
            }]]);
        });

        it('accepts references as min date', () => {

            const ref = Joi.ref('a');
            const schema = Joi.object({ a: Joi.date(), b: Joi.date().min(ref) });
            const now = Date.now();

            Helper.validate(schema, [
                [{ a: now, b: now }, true, { a: new Date(now), b: new Date(now) }],
                [{ a: now, b: now + 1e3 }, true, { a: new Date(now), b: new Date(now + 1000) }],
                [{ a: now, b: now - 1e3 }, false, {
                    message: '"b" must be greater than or equal to "ref:a"',
                    path: ['b'],
                    type: 'date.min',
                    context: { limit: ref, label: 'b', key: 'b', value: new Date(now - 1e3) }
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
                [{ a: 123, b: 123, c: 0 }, true, { a: new Date(123), b: new Date(123), c: 0 }],
                [{ a: 123, b: 456, c: 42 }, true, { a: new Date(123), b: new Date(456), c: 42 }],
                [{ a: 456, b: 123, c: 0 }, true, { a: new Date(456), b: new Date(123), c: 0 }],
                [{ a: 123, b: 123, c: 42 }, false, {
                    message: '"c" must be [0]',
                    path: ['c'],
                    type: 'any.only',
                    context: { value: 42, valids: [0], label: 'c', key: 'c' }
                }],
                [{ a: 456, b: 123, c: 42 }, false, {
                    message: '"c" must be [0]',
                    path: ['c'],
                    type: 'any.only',
                    context: { value: 42, valids: [0], label: 'c', key: 'c' }
                }]
            ]);
        });

        it('accepts context references as min date', () => {

            const ref = Joi.ref('$a');
            const schema = Joi.object({ b: Joi.date().min(ref) });
            const now = Date.now();

            Helper.validate(schema, { context: { a: now } }, [
                [{ b: now }, true, { b: new Date(now) }],
                [{ b: now + 1e3 }, true, { b: new Date(now + 1000) }],
                [{ b: now - 1e3 }, false, {
                    message: '"b" must be greater than or equal to "ref:global:a"',
                    path: ['b'],
                    type: 'date.min',
                    context: { limit: ref, label: 'b', key: 'b', value: new Date(now - 1e3) }
                }]
            ]);
        });

        it('errors if reference is not a date', () => {

            const ref = Joi.ref('a');
            const schema = Joi.object({ a: Joi.string(), b: Joi.date().min(ref) });
            const now = Date.now();

            Helper.validate(schema, [
                [{ a: 'abc', b: now }, false, {
                    message: '"b" date references "ref:a" which must have a valid date format',
                    path: ['b'],
                    type: 'any.ref',
                    context: { ref, label: 'b', key: 'b', value: 'abc', arg: 'date', reason: 'must have a valid date format' }
                }],
                [{ a: '123', b: now }, true, { a: '123', b: new Date(now) }],
                [{ a: (now + 1e3).toString(), b: now }, false, {
                    message: '"b" must be greater than or equal to "ref:a"',
                    path: ['b'],
                    type: 'date.min',
                    context: { limit: ref, label: 'b', key: 'b', value: new Date(now) }
                }]
            ]);
        });

        it('errors if context reference is not a date', () => {

            const ref = Joi.ref('$a');
            const schema = Joi.object({ b: Joi.date().min(ref) });
            const now = Date.now();

            Helper.validate(schema, { context: { a: 'abc' } }, [
                [{ b: now }, false, {
                    message: '"b" date references "ref:global:a" which must have a valid date format',
                    path: ['b'],
                    type: 'any.ref',
                    context: { ref, label: 'b', key: 'b', value: 'abc', arg: 'date', reason: 'must have a valid date format' }
                }]
            ]);

            Helper.validate(schema, { context: { a: (now + 1e3).toString() } }, [
                [{ b: now }, false, {
                    message: '"b" must be greater than or equal to "ref:global:a"',
                    path: ['b'],
                    type: 'date.min',
                    context: { limit: ref, label: 'b', key: 'b', value: new Date(now) }
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
                ['', false, {
                    message: '"value" must be in timestamp or number of milliseconds format',
                    path: [],
                    type: 'date.format',
                    context: { label: 'value', value: '', format: 'javascript' }
                }],
                [' \t ', false, {
                    message: '"value" must be in timestamp or number of milliseconds format',
                    path: [],
                    type: 'date.format',
                    context: { label: 'value', value: ' \t ', format: 'javascript' }
                }]
            ]);
        });

        it('validates javascript timestamp', () => {

            const now = new Date();
            const milliseconds = now.getTime();

            Helper.validate(Joi.date().timestamp(), [[milliseconds, true, now]]);
            Helper.validate(Joi.date().timestamp('javascript'), [[milliseconds, true, now]]);
            Helper.validate(Joi.date().timestamp('unix').timestamp('javascript'), [[milliseconds, true, now]]);
        });

        it('validates unix timestamp', () => {

            const now = new Date();
            const seconds = now.getTime() / 1000;

            Helper.validate(Joi.date().timestamp('unix'), [[seconds, true, now]]);
            Helper.validate(Joi.date().timestamp().timestamp('unix'), [[seconds, true, now]]);
            Helper.validate(Joi.date().timestamp('javascript').timestamp('unix'), [[seconds, true, now]]);
        });

        it('validates timestamps with decimals', () => {

            const now = new Date();

            Helper.validate(Joi.date().timestamp(), [
                [now.getTime().toFixed(4), true, now]
            ]);

            Helper.validate(Joi.date().timestamp('javascript'), [
                [now.getTime().toFixed(4), true, now]
            ]);

            Helper.validate(Joi.date().timestamp('unix'), [
                [(now.getTime() / 1000).toFixed(4), true, now]
            ]);
        });

        it('validates only valid timestamps and returns a friendly error message', () => {

            const invalidDate = new Date('not a valid date');
            const now = new Date();

            Helper.validate(Joi.date().timestamp(), [
                [now.getTime(), true, now],
                [now.getTime().toFixed(4), true, now],
                ['1.452126061677e+12', true, new Date(1.452126061677e+12)],
                [1.452126061677e+12, true, new Date(1.452126061677e+12)],
                [1E3, true, new Date(1000)],
                ['1E3', true, new Date(1000)],
                [',', false, {
                    message: '"value" must be in timestamp or number of milliseconds format',
                    path: [],
                    type: 'date.format',
                    context: { label: 'value', value: ',', format: 'javascript' }
                }],
                ['123A,0xA', false, {
                    message: '"value" must be in timestamp or number of milliseconds format',
                    path: [],
                    type: 'date.format',
                    context: { label: 'value', value: '123A,0xA', format: 'javascript' }
                }],
                ['1-1-2013 UTC', false, {
                    message: '"value" must be in timestamp or number of milliseconds format',
                    path: [],
                    type: 'date.format',
                    context: { label: 'value', value: '1-1-2013 UTC', format: 'javascript' }
                }],
                ['not a valid timestamp', false, {
                    message: '"value" must be in timestamp or number of milliseconds format',
                    path: [],
                    type: 'date.format',
                    context: { label: 'value', value: 'not a valid timestamp', format: 'javascript' }
                }],
                [invalidDate, false, {
                    message: '"value" must be a valid date',
                    path: [],
                    type: 'date.base',
                    context: { label: 'value', value: invalidDate }
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
