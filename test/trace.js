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

        it('tracks valid values (refs)', () => {

            const tracer = Joi.trace();

            const schema = Joi.object({
                a: Joi.string(),
                b: Joi.string(),
                c: Joi.string()
                    .allow(Joi.ref('a'), Joi.ref('b'))
            });

            schema.validate({ a: 'a', b: 'b', c: 'a' });

            expect(tracer.report(__filename)).to.equal([
                {
                    filename: __filename,
                    line: 296,
                    message: 'Schema missing tests for valids (ref:b)',
                    missing: [
                        {
                            rule: 'valids',
                            status: ['ref:b']
                        }
                    ],
                    severity: 'error'
                }
            ]);

            schema.validate({ a: 'a', b: 'b', c: 'b' });

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
                { type: 'invalid', value: 'y', path: ['c'] },
                { type: 'resolve', ref: 'ref:local:label', to: 'c', path: ['c'] }
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
                { type: 'invalid', value: 'y', path: ['c'] },
                { type: 'resolve', ref: 'ref:local:label', to: 'c', path: ['c'] }
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

        it('logs when forks', () => {

            const schema = Joi.object({
                a: Joi.number(),

                b: Joi.number()
                    .when('a', { is: 1, then: 2, otherwise: 3 })
                    .when('a', { is: 4, then: 5, otherwise: 6 }),       // This conflicts with the first when()

                c: Joi.number()
                    .when('a', [
                        { is: 1, then: 2 },
                        { is: 3, then: 4 }
                    ])
            });

            const debug = schema.validate({ a: 1, b: 6 }, { debug: true }).debug;
            expect(debug).to.equal([
                { type: 'entry', path: [] },
                { type: 'entry', path: ['a'] },
                { type: 'resolve', ref: 'ref:a', to: 1, path: ['b'] },
                { type: 'entry', path: ['b', '0.is'] },
                { type: 'valid', value: 1, path: ['b', '0.is'] },
                { type: 'resolve', ref: 'ref:a', to: 1, path: ['b'] },
                { type: 'entry', path: ['b', '1.is'] },
                { type: 'rule', name: 'when', result: '0.then, 1.otherwise', path: ['b'] },
                { type: 'entry', path: ['b'] },
                { type: 'valid', value: 6, path: ['b'] },
                { type: 'resolve', ref: 'ref:a', to: 1, path: ['c'] },
                { type: 'entry', path: ['c', '0.0.is'] },
                { type: 'valid', value: 1, path: ['c', '0.0.is'] },
                { type: 'rule', name: 'when', result: '0.0.then', path: ['c'] },
                { type: 'entry', path: ['c'] }
            ]);
        });

        it('logs when on sub key', () => {

            const building = Joi.object({
                a: Joi.object({
                    name: Joi.string().cache(),
                    lucky: Joi.string()
                        .when('name', { is: 'thirteen', then: Joi.valid('no') })
                })
            });

            const structure = {
                a: { name: 'first' }
            };

            const debug = building.validate(structure, { debug: true }).debug;
            expect(debug).to.equal([
                { type: 'entry', path: [] },
                { type: 'entry', path: ['a'] },
                { type: 'validate', name: 'cached', result: false, path: ['a', 'name'] },
                { type: 'entry', path: ['a', 'name'] },
                { type: 'resolve', ref: 'ref:name', to: 'first', path: ['a', 'lucky'] },
                { type: 'entry', path: ['a', 'lucky', '0.is'] },
                { type: 'rule', name: 'when', result: '', path: ['a', 'lucky'] },
                { type: 'entry', path: ['a', 'lucky'] }
            ]);
        });

        it('logs sub when condition (then)', () => {

            const sub = Joi.when('b', { is: true, then: 2, otherwise: 3 });
            const schema = Joi.object({
                a: Joi.boolean().required(),
                b: Joi.boolean().required(),
                c: Joi.number()
                    .when('a', { is: true, then: sub, otherwise: 1 })
            });

            const debug = schema.validate({ a: true, b: true, c: 2 }, { debug: true }).debug;
            expect(debug).to.equal([
                { type: 'entry', path: [] },
                { type: 'entry', path: ['a'] },
                { type: 'entry', path: ['b'] },
                { type: 'resolve', ref: 'ref:a', to: true, path: ['c'] },
                { type: 'entry', path: ['c', '0.is'] },
                { type: 'valid', value: true, path: ['c', '0.is'] },
                { type: 'resolve', ref: 'ref:b', to: true, path: ['c', '0.then'] },
                { type: 'entry', path: ['c', '0.then', '0.is'] },
                { type: 'valid', value: true, path: ['c', '0.then', '0.is'] },
                { type: 'rule', name: 'when', result: '0.then', path: ['c', '0.then'] },
                { type: 'rule', name: 'when', result: '0.then(0.then)', path: ['c'] },
                { type: 'entry', path: ['c'] },
                { type: 'valid', value: 2, path: ['c'] }
            ]);
        });

        it('logs sub when condition (otherwise)', () => {

            const sub = Joi.when('b', { is: true, then: 2, otherwise: 3 });
            const schema = Joi.object({
                a: Joi.boolean().required(),
                b: Joi.boolean().required(),
                c: Joi.number()
                    .when('a', { is: true, then: 1, otherwise: sub })
            });

            const debug = schema.validate({ a: false, b: true, c: 2 }, { debug: true }).debug;
            expect(debug).to.equal([
                { type: 'entry', path: [] },
                { type: 'entry', path: ['a'] },
                { type: 'entry', path: ['b'] },
                { type: 'resolve', ref: 'ref:a', to: false, path: ['c'] },
                { type: 'entry', path: ['c', '0.is'] },
                { type: 'resolve', ref: 'ref:b', to: true, path: ['c', '0.otherwise'] },
                { type: 'entry', path: ['c', '0.otherwise', '0.is'] },
                { type: 'valid', value: true, path: ['c', '0.otherwise', '0.is'] },
                { type: 'rule', name: 'when', result: '0.then', path: ['c', '0.otherwise'] },
                { type: 'rule', name: 'when', result: '0.otherwise(0.then)', path: ['c'] },
                { type: 'entry', path: ['c'] },
                { type: 'valid', value: 2, path: ['c'] }
            ]);
        });

        it('logs changes in value', () => {

            const schema = Joi.number().raw();

            const debug = schema.validate('123', { debug: true }).debug;
            expect(debug).to.equal([
                { type: 'entry', path: [] },
                { type: 'value', by: 'coerced', from: '123', to: 123, path: [] },
                { type: 'value', by: 'raw', from: 123, to: '123', path: [] }
            ]);
        });

        it('logs changes in value (with name)', () => {

            const schema = Joi.number().cast('string');

            const debug = schema.validate('123', { debug: true }).debug;
            expect(debug).to.equal([
                { type: 'entry', path: [] },
                { type: 'value', by: 'coerced', from: '123', to: 123, path: [] },
                { type: 'value', by: 'cast', name: 'string', from: 123, to: '123', path: [] }
            ]);
        });

        it('debug multiple time same schema', () => {

            const schema = Joi.object({
                a: Joi.boolean(),
                b: Joi.link('a')
                    .when('a', { then: Joi.forbidden() })
            });

            const debug1 = schema.validate({ a: true, b: true }, { debug: true }).debug;
            expect(debug1).to.equal([
                { type: 'entry', path: [] },
                { type: 'entry', path: ['a'] },
                { type: 'resolve', ref: 'ref:a', to: true, path: ['b'] },
                { type: 'entry', path: ['b', '0.is'] },
                { type: 'rule', name: 'when', result: '0.then', path: ['b'] },
                { type: 'entry', path: ['b'] },
                { type: 'resolve', ref: 'ref:local:label', to: 'b', path: ['b'] }
            ]);

            const debug2 = schema.validate({ a: false, b: false }, { debug: true }).debug;
            expect(debug2).to.equal([
                { type: 'entry', path: [] },
                { type: 'entry', path: ['a'] },
                { type: 'resolve', ref: 'ref:a', to: false, path: ['b'] },
                { type: 'entry', path: ['b', '0.is'] },
                { type: 'invalid', value: false, path: ['b', '0.is'] },
                { type: 'rule', name: 'when', result: '', path: ['b'] },
                { type: 'entry', path: ['b'] },
                { type: 'entry', path: ['b', 'link:ref:a:boolean'] }
            ]);
        });
    });
});
