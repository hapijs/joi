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


describe('ref', () => {

    it('detects references', (done) => {

        expect(Joi.isRef(Joi.ref('a.b'))).to.be.true();
        done();
    });

    it('uses ref as a valid value', (done) => {

        const schema = Joi.object({
            a: Joi.ref('b'),
            b: Joi.any()
        });

        schema.validate({ a: 5, b: 6 }, (err, value) => {

            expect(err).to.exist();
            expect(err.message).to.equal('child "a" fails because ["a" must be one of [ref:b]]');

            Helper.validate(schema, [
                [{ a: 5 }, false, null, 'child "a" fails because ["a" must be one of [ref:b]]'],
                [{ b: 5 }, true],
                [{ a: 5, b: 5 }, true],
                [{ a: '5', b: '5' }, true]
            ], done);
        });
    });

    it('uses ref as a valid value (empty key)', (done) => {

        const schema = Joi.object({
            a: Joi.ref(''),
            '': Joi.any()
        });

        schema.validate({ a: 5, '': 6 }, (err, value) => {

            expect(err).to.exist();
            expect(err.message).to.equal('child "a" fails because ["a" must be one of [ref:]]');

            Helper.validate(schema, [
                [{ a: 5 }, false, null, 'child "a" fails because ["a" must be one of [ref:]]'],
                [{ '': 5 }, true],
                [{ a: 5, '': 5 }, true],
                [{ a: '5', '': '5' }, true]
            ], done);
        });
    });

    it('uses ref with nested keys as a valid value', (done) => {

        const schema = Joi.object({
            a: Joi.ref('b.c'),
            b: {
                c: Joi.any()
            }
        });

        schema.validate({ a: 5, b: { c: 6 } }, (err, value) => {

            expect(err).to.exist();
            expect(err.message).to.equal('child "a" fails because ["a" must be one of [ref:b.c]]');

            Helper.validate(schema, [
                [{ a: 5 }, false, null, 'child "a" fails because ["a" must be one of [ref:b.c]]'],
                [{ b: { c: 5 } }, true],
                [{ a: 5, b: 5 }, false, null, 'child "b" fails because ["b" must be an object]'],
                [{ a: '5', b: { c: '5' } }, true]
            ], done);
        });
    });

    it('uses ref with combined nested keys in sub child', (done) => {

        const ref = Joi.ref('b.c');
        expect(ref.root).to.equal('b');

        const schema = Joi.object({
            a: ref,
            b: {
                c: Joi.any()
            }
        });

        const input = { a: 5, b: { c: 5 } };
        schema.validate(input, (err, value) => {

            expect(err).to.not.exist();

            const parent = Joi.object({
                e: schema
            });

            parent.validate({ e: input }, (err2, value2) => {

                expect(err2).to.not.exist();
                done();
            });
        });
    });

    it('uses ref reach options', (done) => {

        const ref = Joi.ref('b/c', { separator: '/' });
        expect(ref.root).to.equal('b');

        const schema = Joi.object({
            a: ref,
            b: {
                c: Joi.any()
            }
        });

        schema.validate({ a: 5, b: { c: 5 } }, (err, value) => {

            expect(err).to.not.exist();
            done();
        });
    });

    it('ignores the order in which keys are defined', (done) => {

        const ab = Joi.object({
            a: {
                c: Joi.number()
            },
            b: Joi.ref('a.c')
        });

        ab.validate({ a: { c: '5' }, b: 5 }, (err, value) => {

            expect(err).to.not.exist();

            const ba = Joi.object({
                b: Joi.ref('a.c'),
                a: {
                    c: Joi.number()
                }
            });

            ba.validate({ a: { c: '5' }, b: 5 }, (err2, value2) => {

                expect(err2).to.not.exist();
                done();
            });
        });
    });

    it('uses ref as default value', (done) => {

        const schema = Joi.object({
            a: Joi.default(Joi.ref('b')),
            b: Joi.any()
        });

        schema.validate({ b: 6 }, (err, value) => {

            expect(err).to.not.exist();
            expect(value).to.equal({ a: 6, b: 6 });
            done();
        });
    });

    it('uses ref as default value regardless of order', (done) => {

        const ab = Joi.object({
            a: Joi.default(Joi.ref('b')),
            b: Joi.number()
        });

        ab.validate({ b: '6' }, (err, value) => {

            expect(err).to.not.exist();
            expect(value).to.equal({ a: 6, b: 6 });

            const ba = Joi.object({
                b: Joi.number(),
                a: Joi.default(Joi.ref('b'))
            });

            ba.validate({ b: '6' }, (err2, value2) => {

                expect(err2).to.not.exist();
                expect(value2).to.equal({ a: 6, b: 6 });
                done();
            });
        });
    });

    it('ignores the order in which keys are defined with alternatives', (done) => {

        const a = { c: Joi.number() };
        const b = [Joi.ref('a.c'), Joi.ref('c')];
        const c = Joi.number();

        Helper.validate({ a, b, c }, [
            [{ a: {} }, true],
            [{ a: { c: '5' }, b: 5 }, true],
            [{ a: { c: '5' }, b: 6, c: '6' }, true],
            [{ a: { c: '5' }, b: 7, c: '6' }, false, null, 'child "b" fails because ["b" must be one of [ref:a.c], "b" must be one of [ref:c]]']
        ]);

        Helper.validate({ b, a, c }, [
            [{ a: {} }, true],
            [{ a: { c: '5' }, b: 5 }, true],
            [{ a: { c: '5' }, b: 6, c: '6' }, true],
            [{ a: { c: '5' }, b: 7, c: '6' }, false, null, 'child "b" fails because ["b" must be one of [ref:a.c], "b" must be one of [ref:c]]']
        ]);

        Helper.validate({ b, c, a }, [
            [{ a: {} }, true],
            [{ a: { c: '5' }, b: 5 }, true],
            [{ a: { c: '5' }, b: 6, c: '6' }, true],
            [{ a: { c: '5' }, b: 7, c: '6' }, false, null, 'child "b" fails because ["b" must be one of [ref:a.c], "b" must be one of [ref:c]]']
        ]);

        Helper.validate({ a, c, b }, [
            [{ a: {} }, true],
            [{ a: { c: '5' }, b: 5 }, true],
            [{ a: { c: '5' }, b: 6, c: '6' }, true],
            [{ a: { c: '5' }, b: 7, c: '6' }, false, null, 'child "b" fails because ["b" must be one of [ref:a.c], "b" must be one of [ref:c]]']
        ]);

        Helper.validate({ c, a, b }, [
            [{ a: {} }, true],
            [{ a: { c: '5' }, b: 5 }, true],
            [{ a: { c: '5' }, b: 6, c: '6' }, true],
            [{ a: { c: '5' }, b: 7, c: '6' }, false, null, 'child "b" fails because ["b" must be one of [ref:a.c], "b" must be one of [ref:c]]']
        ]);

        Helper.validate({ c, b, a }, [
            [{ a: {} }, true],
            [{ a: { c: '5' }, b: 5 }, true],
            [{ a: { c: '5' }, b: 6, c: '6' }, true],
            [{ a: { c: '5' }, b: 7, c: '6' }, false, null, 'child "b" fails because ["b" must be one of [ref:a.c], "b" must be one of [ref:c]]']
        ], done);
    });

    it('uses context as default value', (done) => {

        const schema = Joi.object({
            a: Joi.default(Joi.ref('$x')),
            b: Joi.any()
        });

        Joi.validate({ b: 6 }, schema, { context: { x: 22 } }, (err, value) => {

            expect(err).to.not.exist();
            expect(value).to.equal({ a: 22, b: 6 });
            done();
        });
    });

    it('uses context as default value with custom prefix', (done) => {

        const schema = Joi.object({
            a: Joi.default(Joi.ref('%x', { contextPrefix: '%' })),
            b: Joi.any()
        });

        Joi.validate({ b: 6 }, schema, { context: { x: 22 } }, (err, value) => {

            expect(err).to.not.exist();
            expect(value).to.equal({ a: 22, b: 6 });
            done();
        });
    });

    it('uses context as a valid value', (done) => {

        const schema = Joi.object({
            a: Joi.ref('$x'),
            b: Joi.any()
        });

        Joi.validate({ a: 5, b: 6 }, schema, { context: { x: 22 } }, (err, value) => {

            expect(err).to.exist();
            expect(err.message).to.equal('child "a" fails because ["a" must be one of [context:x]]');

            Helper.validateOptions(schema, [
                [{ a: 5 }, false, null, 'child "a" fails because ["a" must be one of [context:x]]'],
                [{ a: 22 }, true],
                [{ b: 5 }, true],
                [{ a: 22, b: 5 }, true],
                [{ a: '22', b: '5' }, false, null, 'child "a" fails because ["a" must be one of [context:x]]']
            ], { context: { x: 22 } }, done);
        });
    });

    it('uses context in when condition', (done) => {

        const schema = {
            a: Joi.boolean().when('$x', { is: Joi.exist(), otherwise: Joi.forbidden() })
        };

        Helper.validate(schema, [
            [{}, true],
            [{ a: 'x' }, false, null, 'child "a" fails because ["a" is not allowed]'],
            [{ a: true }, false, null, 'child "a" fails because ["a" is not allowed]'],
            [{}, true, { context: {} }],
            [{ a: 'x' }, false, { context: {} }, 'child "a" fails because ["a" is not allowed]'],
            [{ a: true }, false, { context: {} }, 'child "a" fails because ["a" is not allowed]'],
            [{}, true, { context: { x: 1 } }],
            [{ a: 'x' }, false, { context: { x: 1 } }, 'child "a" fails because ["a" must be a boolean]'],
            [{ a: true }, true, { context: { x: 1 } }]
        ], done);
    });

    it('uses nested context in when condition', (done) => {

        const schema = {
            a: Joi.boolean().when('$x.y', { is: Joi.exist(), otherwise: Joi.forbidden() })
        };

        Helper.validate(schema, [
            [{}, true],
            [{ a: 'x' }, false, null, 'child "a" fails because ["a" is not allowed]'],
            [{ a: true }, false, null, 'child "a" fails because ["a" is not allowed]'],
            [{}, true, { context: {} }],
            [{ a: 'x' }, false, { context: {} }, 'child "a" fails because ["a" is not allowed]'],
            [{ a: true }, false, { context: {} }, 'child "a" fails because ["a" is not allowed]'],
            [{}, true, { context: { x: 1 } }],
            [{ a: 'x' }, false, { context: { x: 1 } }, 'child "a" fails because ["a" is not allowed]'],
            [{ a: true }, false, { context: { x: 1 } }, 'child "a" fails because ["a" is not allowed]'],
            [{}, true, { context: { x: {} } }],
            [{ a: 'x' }, false, { context: { x: {} } }, 'child "a" fails because ["a" is not allowed]'],
            [{ a: true }, false, { context: { x: {} } }, 'child "a" fails because ["a" is not allowed]'],
            [{}, true, { context: { x: { y: 1 } } }],
            [{ a: 'x' }, false, { context: { x: { y: 1 } } }, 'child "a" fails because ["a" must be a boolean]'],
            [{ a: true }, true, { context: { x: { y: 1 } } }]
        ], done);
    });

    it('describes schema with ref', (done) => {

        const desc = Joi
            .valid(Joi.ref('a.b'))
            .invalid(Joi.ref('$b.c'))
            .default(Joi.ref('a.b'))
            .when('a.b', {
                is: Joi.date().min(Joi.ref('a.b')).max(Joi.ref('a.b')),
                then: Joi.number().min(Joi.ref('a.b')).max(Joi.ref('a.b')).greater(Joi.ref('a.b')).less(Joi.ref('a.b')),
                otherwise: Joi.object({
                    a: Joi.string().min(Joi.ref('a.b')).max(Joi.ref('a.b')).length(Joi.ref('a.b'))
                }).with('a', 'b').without('b', 'c').assert('a.b', Joi.ref('a.b'))
            })
            .describe();

        expect(desc).to.equal({
            type: 'alternatives',
            flags: { presence: 'ignore' },
            alternatives: [{
                ref: 'ref:a.b',
                is: {
                    type: 'date',
                    rules: [
                        { name: 'min', arg: 'ref:a.b' },
                        { name: 'max', arg: 'ref:a.b' }
                    ]
                },
                then: {
                    type: 'number',
                    flags: { allowOnly: true, default: 'ref:a.b' },
                    valids: ['ref:a.b'],
                    invalids: ['context:b.c', Infinity, -Infinity],
                    rules: [
                        { name: 'min', arg: 'ref:a.b' },
                        { name: 'max', arg: 'ref:a.b' },
                        { name: 'greater', arg: 'ref:a.b' },
                        { name: 'less', arg: 'ref:a.b' }
                    ]
                },
                otherwise: {
                    type: 'object',
                    flags: { allowOnly: true, default: 'ref:a.b' },
                    valids: ['ref:a.b'],
                    invalids: ['context:b.c'],
                    rules: [{
                        name: 'assert',
                        arg: {
                            schema: {
                                type: 'any',
                                flags: { allowOnly: true },
                                valids: ['ref:a.b']
                            },
                            ref: 'ref:a.b'
                        }
                    }],
                    children: {
                        a: {
                            type: 'string',
                            invalids: [''],
                            rules: [
                                { name: 'min', arg: 'ref:a.b' },
                                { name: 'max', arg: 'ref:a.b' },
                                { name: 'length', arg: 'ref:a.b' }
                            ]
                        }
                    },
                    dependencies: [{
                        type: 'with',
                        key: 'a',
                        peers: ['b']
                    },
                    {
                        type: 'without',
                        key: 'b',
                        peers: ['c']
                    }]
                }
            }]
        });
        done();
    });

    describe('create()', () => {

        it('throws when key is missing', (done) => {

            expect(() => {

                Joi.ref(5);
            }).to.throw('Invalid reference key: 5');
            done();
        });

        it('finds root with default separator', (done) => {

            expect(Joi.ref('a.b.c').root).to.equal('a');
            done();
        });

        it('finds root with default separator and options', (done) => {

            expect(Joi.ref('a.b.c', {}).root).to.equal('a');
            done();
        });

        it('finds root with custom separator', (done) => {

            expect(Joi.ref('a+b+c', { separator: '+' }).root).to.equal('a');
            done();
        });
    });
});
