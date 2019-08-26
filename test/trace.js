'use strict';

const Code = require('@hapi/code');
const Lab = require('@hapi/lab');
const Joi = require('..');
const Pinpoint = require('@hapi/pinpoint');


const internals = {};


const { describe, it, afterEach } = exports.lab = Lab.script();
const { expect } = Code;


describe('Trace', () => {

    describe('trace()', () => {

        afterEach(() => Joi.untrace());

        it('reuses tracer', () => {

            const tracer = Joi.trace();
            expect(Joi.trace()).to.shallow.equal(tracer);
            Joi.untrace();

            expect(Joi.trace()).to.not.shallow.equal(tracer);
        });

        it('tracks rules', () => {

            const tracer = Joi.trace();

            const schema = Joi.string()
                .lowercase()
                .pattern(/\d/);

            schema.validate('a');
            schema.validate('4');

            expect(tracer.report()).to.be.null();
        });

        it('reports coverage', () => {

            const tracer = Joi.trace();

            const schema = Joi.string()
                .lowercase()
                .pattern(/\d/)
                .max(20)
                .min(10);

            schema.validate('123456789012345678901');

            expect(tracer.report(__filename)).to.equal([
                {
                    filename: __filename,
                    line: Pinpoint.location().line - 5,
                    message: 'Schema missing tests for pattern (always pass), max (always error), min (never used)',
                    missing: [
                        {
                            status: 'always pass',
                            rule: 'pattern'
                        },
                        {
                            status: 'always error',
                            rule: 'max'
                        },
                        {
                            status: 'never used',
                            rule: 'min'
                        }
                    ],
                    severity: 'error'
                }
            ]);

            expect(tracer.report('missing')).to.be.null();
        });

        it('reports nested coverage', () => {

            const tracer = Joi.trace();

            const schema = Joi.object({
                a: {
                    x: Joi.string()
                        .lowercase()
                        .pattern(/\d/)
                        .max(20)
                        .min(10)
                },

                b: Joi.number()
                    .min(100)
            });

            schema.validate({ a: { x: '123456789012345678901' }, b: 11 });

            expect(tracer.report(__filename)).to.equal([
                {
                    filename: __filename,
                    line: Pinpoint.location().line - 5,
                    severity: 'error',
                    message: 'Schema missing tests for a.x:pattern (always pass), a.x:max (always error), a.x:min (never used), b (never reached)',
                    missing: [
                        {
                            paths: [['a', 'x']],
                            status: 'always pass',
                            rule: 'pattern'
                        },
                        {
                            paths: [['a', 'x']],
                            status: 'always error',
                            rule: 'max'
                        },
                        {
                            paths: [['a', 'x']],
                            status: 'never used',
                            rule: 'min'
                        },
                        {
                            paths: [['b']],
                            status: 'never reached'
                        }
                    ]
                }
            ]);
        });

        it('uses schema id', () => {

            const tracer = Joi.trace();

            const schema = Joi.object({
                a: Joi.object({
                    x: Joi.string()
                        .lowercase()
                        .pattern(/\d/)
                        .max(20)
                        .min(10)
                })
                    .id('A'),

                b: Joi.number()
                    .min(100),

                c: Joi.any()
                    .empty(Joi.number().max(10))
            });

            schema.validate({ a: { x: '123456789012345678901' }, b: 11, c: 5 });

            expect(tracer.report(__filename)).to.equal([
                {
                    filename: __filename,
                    line: Pinpoint.location().line - 5,
                    severity: 'error',
                    message: 'Schema missing tests for A.x:pattern (always pass), A.x:max (always error), A.x:min (never used), b (never reached), c (never reached)',
                    missing: [
                        {
                            paths: [['A', 'x']],
                            status: 'always pass',
                            rule: 'pattern'
                        },
                        {
                            paths: [['A', 'x']],
                            status: 'always error',
                            rule: 'max'
                        },
                        {
                            paths: [['A', 'x']],
                            status: 'never used',
                            rule: 'min'
                        },
                        {
                            paths: [['b']],
                            status: 'never reached'
                        },
                        {
                            paths: [['c']],
                            status: 'never reached'
                        }
                    ]
                }
            ]);
        });

        it('handles reused schema', () => {

            const tracer = Joi.trace();

            const key = Joi.any().empty(Joi.number().max(10));
            const schema = Joi.object({
                a: key,
                b: key
            });

            schema.validate({ a: 5, b: 6 });

            expect(tracer.report(__filename)).to.equal([
                {
                    filename: __filename,
                    line: Pinpoint.location().line - 5,
                    message: 'Schema missing tests for a.@empty:max (always pass)',
                    severity: 'error',
                    missing: [
                        {
                            paths: [['a', '@empty'], ['b', '@empty']],
                            rule: 'max',
                            status: 'always pass'
                        }
                    ]
                }
            ]);
        });

        it('reports skipped schema without rule', () => {

            const tracer = Joi.trace();

            const schema = Joi.alternatives([
                Joi.string(),
                Joi.number()
            ]);

            schema.validate('x');

            expect(tracer.report(__filename)).to.equal([
                {
                    filename: __filename,
                    line: Pinpoint.location().line - 5,
                    message: 'Schema missing tests for @matches[1] (never reached)',
                    severity: 'error',
                    missing: [
                        {
                            paths: [['@matches', 1]],
                            status: 'never reached'
                        }
                    ]
                }
            ]);
        });

        it('tracks valid and invalid values', () => {

            const tracer = Joi.trace();

            const schema = Joi.string()
                .allow('a', 'b', 'c')
                .deny('x', 'y', 'z');

            schema.validate('a');
            schema.validate('b');
            schema.validate('x');
            schema.validate('y');

            expect(tracer.report(__filename)).to.equal([
                {
                    filename: __filename,
                    line: Pinpoint.location().line - 8,
                    message: 'Schema missing tests for valids (c), invalids (z)',
                    severity: 'error',
                    missing: [
                        {
                            rule: 'valids',
                            status: ['c']
                        },
                        {
                            rule: 'invalids',
                            status: ['z']
                        }
                    ]
                }
            ]);

            schema.validate('c');
            schema.validate('z');

            expect(tracer.report(__filename)).to.be.null();
        });

        it('tracks default and failover', () => {

            const tracer = Joi.trace();

            const schema = Joi.string()
                .default('x')
                .failover('y');

            schema.validate('test');

            expect(tracer.report(__filename)).to.equal([
                {
                    filename: __filename,
                    line: Pinpoint.location().line - 5,
                    message: 'Schema missing tests for default (never used), failover (never used)',
                    missing: [
                        {
                            rule: 'default',
                            status: 'never used'
                        },
                        {
                            rule: 'failover',
                            status: 'never used'
                        }
                    ],
                    severity: 'error'
                }
            ]);

            schema.validate();
            schema.validate({});

            expect(tracer.report(__filename)).to.be.null();
        });

        it('reports coverage with manual location', () => {

            const tracer = Joi.trace();

            const schema = Joi.string().tracer()
                .lowercase()
                .pattern(/\d/)
                .max(20)
                .min(10);

            schema.validate('123456789012345678901');

            expect(tracer.report(__filename)).to.equal([
                {
                    filename: __filename,
                    line: Pinpoint.location().line - 11,
                    message: 'Schema missing tests for pattern (always pass), max (always error), min (never used)',
                    missing: [
                        {
                            status: 'always pass',
                            rule: 'pattern'
                        },
                        {
                            status: 'always error',
                            rule: 'max'
                        },
                        {
                            status: 'never used',
                            rule: 'min'
                        }
                    ],
                    severity: 'error'
                }
            ]);
        });

        it('reports coverage with manual location (concat override)', () => {

            const tracer = Joi.trace();

            const base = Joi.string().lowercase()
                .pattern(/\d/)
                .tracer();

            const schema = Joi.any().concat(base).tracer()
                .max(20)
                .min(10);

            schema.validate('123456789012345678901');

            expect(tracer.report(__filename)).to.equal([
                {
                    filename: __filename,
                    line: Pinpoint.location().line - 9,
                    message: 'Schema missing tests for pattern (always pass), max (always error), min (never used)',
                    missing: [
                        {
                            status: 'always pass',
                            rule: 'pattern'
                        },
                        {
                            status: 'always error',
                            rule: 'max'
                        },
                        {
                            status: 'never used',
                            rule: 'min'
                        }
                    ],
                    severity: 'error'
                }
            ]);
        });

        it('reports coverage with manual location (concat)', () => {

            const tracer = Joi.trace();

            const base = Joi.string().lowercase()
                .pattern(/\d/)
                .tracer();

            const schema = Joi.any().concat(base)
                .max(20)
                .min(10);

            schema.validate('123456789012345678901');

            expect(tracer.report(__filename)).to.equal([
                {
                    filename: __filename,
                    line: Pinpoint.location().line - 11,
                    message: 'Schema missing tests for pattern (always pass), max (always error), min (never used)',
                    missing: [
                        {
                            status: 'always pass',
                            rule: 'pattern'
                        },
                        {
                            status: 'always error',
                            rule: 'max'
                        },
                        {
                            status: 'never used',
                            rule: 'min'
                        }
                    ],
                    severity: 'error'
                }
            ]);
        });

        it('handles when()', () => {

            const tracer = Joi.trace();

            const schema = Joi.object({
                a: Joi.boolean(),
                b: Joi.boolean(),
                c: Joi.string()
                    .when('a', { is: true, then: Joi.string().min(10).allow('y') })
                    .when('b', { is: true, then: Joi.string().max(100) })
            });

            schema.validate({ a: true, b: true, c: 'x' });
            schema.validate({ a: true, b: true, c: 'y' });

            expect(tracer.report(__filename)).to.equal([
                {
                    filename: __filename,
                    line: Pinpoint.location().line - 6,
                    message: 'Schema missing tests for c.@whens[0]:min (always error), c.@whens[1]:max (never used)',
                    severity: 'error',
                    missing: [
                        {
                            paths: [['c', '@whens', 0]],
                            rule: 'min',
                            status: 'always error'
                        },
                        {
                            paths: [['c', '@whens', 1]],
                            rule: 'max',
                            status: 'never used'
                        }
                    ]
                }
            ]);
        });
    });

    describe('debug', () => {

        it('creates debug log', () => {

            const schema = Joi.object({
                a: {
                    x: Joi.string()
                        .lowercase()
                        .pattern(/\d/)
                        .max(20)
                        .min(10)
                },

                b: Joi.number()
                    .min(100),

                c: Joi.not('y')
            });

            const debug = schema.validate({ a: { x: '12345678901234567890' }, b: 110, c: 'y' }, { debug: true }).debug;
            expect(debug).to.equal([
                { type: 'entry', path: [] },
                { type: 'entry', path: ['a'] },
                { type: 'entry', path: ['a', 'x'] },
                { type: 'rule', name: 'case', result: 'pass', path: ['a', 'x'] },
                { type: 'rule', name: 'pattern', result: 'pass', path: ['a', 'x'] },
                { type: 'rule', name: 'max', result: 'pass', path: ['a', 'x'] },
                { type: 'rule', name: 'min', result: 'pass', path: ['a', 'x'] },
                { type: 'entry', path: ['b'] },
                { type: 'rule', name: 'min', result: 'pass', path: ['b'] },
                { type: 'entry', path: ['c'] },
                { type: 'invalid', path: ['c'], value: 'y' }
            ]);
        });

        it('creates debug log (async)', async () => {

            const schema = Joi.object({
                a: {
                    x: Joi.string()
                        .lowercase()
                        .pattern(/\d/)
                        .max(20)
                        .min(10)
                },

                b: Joi.number()
                    .min(100),

                c: Joi.not('y')
            });

            const err = await expect(schema.validateAsync({ a: { x: '12345678901234567890' }, b: 110, c: 'y' }, { debug: true })).to.reject();
            expect(err.debug).to.equal([
                { type: 'entry', path: [] },
                { type: 'entry', path: ['a'] },
                { type: 'entry', path: ['a', 'x'] },
                { type: 'rule', name: 'case', result: 'pass', path: ['a', 'x'] },
                { type: 'rule', name: 'pattern', result: 'pass', path: ['a', 'x'] },
                { type: 'rule', name: 'max', result: 'pass', path: ['a', 'x'] },
                { type: 'rule', name: 'min', result: 'pass', path: ['a', 'x'] },
                { type: 'entry', path: ['b'] },
                { type: 'rule', name: 'min', result: 'pass', path: ['b'] },
                { type: 'entry', path: ['c'] },
                { type: 'invalid', path: ['c'], value: 'y' }
            ]);

            const { debug } = await schema.validateAsync({ a: { x: '12345678901234567890' }, b: 110, c: 'x' }, { debug: true });
            expect(debug).to.equal([
                { type: 'entry', path: [] },
                { type: 'entry', path: ['a'] },
                { type: 'entry', path: ['a', 'x'] },
                { type: 'rule', name: 'case', result: 'pass', path: ['a', 'x'] },
                { type: 'rule', name: 'pattern', result: 'pass', path: ['a', 'x'] },
                { type: 'rule', name: 'max', result: 'pass', path: ['a', 'x'] },
                { type: 'rule', name: 'min', result: 'pass', path: ['a', 'x'] },
                { type: 'entry', path: ['b'] },
                { type: 'rule', name: 'min', result: 'pass', path: ['b'] },
                { type: 'entry', path: ['c'] }
            ]);
        });
    });
});
