'use strict';

const Code = require('@hapi/code');
const Lab = require('@hapi/lab');
const Joi = require('..');

const Helper = require('./helper');


const internals = {};


const { describe, it } = exports.lab = Lab.script();
const { expect } = Code;


describe('Modify', () => {

    describe('extract()', () => {

        it('extracts nested schema with keys', () => {

            const d = Joi.number();
            const c = Joi.object({ d });
            const b = Joi.object({ c });
            const a = Joi.object({ b });

            expect(a.extract('b')).to.shallow.equal(b);
            expect(a.extract('b.c.d')).to.shallow.equal(d);
            expect(a.extract(['b', 'c', 'd'])).to.shallow.equal(d);
        });

        it('extracts nested schema with ids', () => {

            const d = Joi.number().id('D');
            const c = Joi.object({ d }).id('C');
            const b = Joi.object({ c }).id('B');
            const a = Joi.object({ b });

            expect(a.extract('B')).to.shallow.equal(b);
            expect(a.extract('B.C.D')).to.shallow.equal(d);
        });

        it('extracts nested schema with ids by keys', () => {

            const d = Joi.number().id('D');
            const c = Joi.object({ d }).id('C');
            const b = Joi.object({ c }).id('B');
            const a = Joi.object({ b });

            expect(a.extract('b')).to.shallow.equal(b);
            expect(a.extract('b.c.d')).to.shallow.equal(d);
        });

        it('extracts nested schema with duplicate ids', () => {

            const d = Joi.number().id('D');
            const c = Joi.object({ d }).id('C');
            const b = Joi.object({ c }).id('B');
            const a = Joi.object({ b, x: b });

            expect(a.extract('b')).to.shallow.equal(b);
            expect(a.extract('x')).to.shallow.equal(b);
            expect(a.extract('b.c.d')).to.shallow.equal(d);
        });

        it('extracts nested schema from array', () => {

            const d = Joi.number().id('D');
            const c = Joi.object({ d }).id('C');
            const b = Joi.object({ c }).id('b');
            const a = Joi.array().items(b);

            expect(a.extract('b')).to.shallow.equal(b);
            expect(a.extract('b.c.d')).to.shallow.equal(d);
        });

        it('extracts nested schema from alternatives', () => {

            const d = Joi.number().id('D');
            const c = Joi.object({ d }).id('C');
            const b = Joi.object({ c }).id('b');
            const a = Joi.alternatives(b);

            expect(a.extract('b')).to.shallow.equal(b);
            expect(a.extract('b.c.d')).to.shallow.equal(d);
        });

        it('extracts nested schema after object key override', () => {

            const d = Joi.number();
            const c = Joi.object({ d });
            const b = Joi.object({ c });
            const a = Joi.object({ b });
            const x = a.keys({ b: c });

            expect(x.extract('b')).to.shallow.equal(c);
            expect(x.extract('b.d')).to.shallow.equal(d);
        });

        it('extracts nested schema after object key override and custom ids', () => {

            const d = Joi.number().id('D');
            const c = Joi.object({ d }).id('C');
            const b = Joi.object({ c }).id('B');
            const a = Joi.object({ b }).id('A');
            const x = a.keys({ b: c });

            expect(x.extract('C')).to.shallow.equal(c);
            expect(x.extract('C.D')).to.shallow.equal(d);
        });

        it('extracts nested schema after object concat (keys)', () => {

            const d = Joi.number();
            const c = Joi.object({ d });
            const b = Joi.object({ c });
            const a = Joi.object({ b });
            const x = a.concat(b);

            expect(x.extract('b')).to.shallow.equal(b);
            expect(x.extract('c')).to.shallow.equal(c);
        });

        it('extracts nested schema after object concat (ids)', () => {

            const d = Joi.number().id('D');
            const c = Joi.object({ d }).id('C');
            const b = Joi.object({ c }).id('B');
            const a = Joi.object({ b }).id('A');
            const x = a.concat(b);

            expect(x.extract('B')).to.shallow.equal(b);
            expect(x.extract('C')).to.shallow.equal(c);
        });

        it('errors on missing schema', () => {

            const d = Joi.number();
            const c = Joi.object({ d });
            const b = Joi.object({ c });
            const a = Joi.object({ b });

            expect(() => a.extract(['b', 'c', 'x'])).to.throw('Schema does not contain path b.c.x');
        });

        it('errors on conflicting schema ids', () => {

            const a = Joi.number().id('A');
            const b = Joi.string().id('A');

            expect(() => Joi.object({ a, b })).to.throw('Cannot add different schemas with the same id: A');
        });
    });

    describe('fork()', () => {

        it('adjusts empty', () => {

            const before = Joi.string().empty(Joi.number().id('x'));
            const after = Joi.string().empty(Joi.number().min(10).id('x'));

            Helper.equal(before.fork('x', (schema) => schema.min(10)), after);
        });

        it('preserves unchanged schemas', () => {

            const before = Joi.object({ x: Joi.string().optional() });
            const after = Joi.object({ x: Joi.string().optional() });

            Helper.equal(before.fork('x', (schema) => schema.optional()), after);
        });

        it('adjusts reused schema in multiple places', () => {

            const shared = Joi.number().id('x');

            const before = Joi.object({
                a: shared,
                b: shared
            });

            expect(before.extract('a')).to.shallow.equal(before.extract('b'));

            const sharedAfter = shared.min(10);
            const after = Joi.object({
                a: sharedAfter,
                b: sharedAfter
            });

            expect(after.extract('a')).to.shallow.equal(after.extract('b'));

            const modified = before.fork('x', (schema) => schema.min(10));
            Helper.equal(modified, after);
            expect(modified.extract('a')).to.shallow.equal(modified.extract('b'));
        });

        describe('alternatives', () => {

            it('adjusts nested schema', () => {

                const before = Joi.alternatives([
                    Joi.number().positive().id('numbers'),
                    Joi.object({
                        c: Joi.object({
                            d: Joi.number().positive()
                        })
                    }).id('objects')
                ]);

                const first = before.fork('objects.c.d', (schema) => schema.max(5));

                const after1 = Joi.alternatives([
                    Joi.number().positive().id('numbers'),
                    Joi.object({
                        c: Joi.object({
                            d: Joi.number().positive().max(5)
                        })
                    }).id('objects')
                ]);

                Helper.equal(first, after1);

                const second = first.fork('numbers', (schema) => schema.min(10));

                const after2 = Joi.alternatives([
                    Joi.number().positive().id('numbers').min(10),
                    Joi.object({
                        c: Joi.object({
                            d: Joi.number().positive().max(5)
                        })
                    }).id('objects')
                ]);

                Helper.equal(second, after2);
            });

            it('adjusts when schema', () => {

                const before = Joi.object({
                    a: Joi.number(),
                    b: Joi.boolean()
                        .when('a', [
                            { is: 0, then: Joi.valid(0).id('zero') },
                            { is: 1, then: Joi.valid(1).id('one') }
                        ])
                });

                const forked = before.fork('b.one', (schema) => schema.allow(2));

                const after = Joi.object({
                    a: Joi.number(),
                    b: Joi.boolean()
                        .when('a', [
                            { is: 0, then: Joi.valid(0).id('zero') },
                            { is: 1, then: Joi.valid(1, 2).id('one') }
                        ])
                });

                Helper.equal(forked, after);
            });

            it('adjusts alternatives schema', () => {

                const before = Joi.object({
                    a: Joi.number(),
                    b: Joi.alternatives()
                        .conditional('a', {
                            switch: [
                                { is: 0, then: Joi.valid(0).id('zero') },
                                { is: 1, then: Joi.valid(1).id('one'), otherwise: Joi.boolean() }
                            ]
                        })
                });

                const forked = before.fork('b.one', (schema) => schema.allow(2));

                const after = Joi.object({
                    a: Joi.number(),
                    b: Joi.alternatives()
                        .conditional('a', {
                            switch: [
                                { is: 0, then: Joi.valid(0).id('zero') },
                                { is: 1, then: Joi.valid(1, 2).id('one'), otherwise: Joi.boolean() }
                            ]
                        })
                });

                Helper.equal(forked, after);
            });
        });

        describe('array', () => {

            it('adjusts nested schema', () => {

                const before = Joi.array().items(
                    Joi.number().positive().id('numbers'),
                    Joi.object({
                        c: Joi.object({
                            d: Joi.number().positive()
                        })
                    })
                        .id('objects')
                )
                    .has(Joi.object())
                    .has(Joi.valid(5).id('five'));

                const first = before.fork('objects.c.d', (schema) => schema.max(5));

                const after1 = Joi.array().items(
                    Joi.number().positive().id('numbers'),
                    Joi.object({
                        c: Joi.object({
                            d: Joi.number().positive().max(5)
                        })
                    })
                        .id('objects')
                )
                    .has(Joi.object())
                    .has(Joi.valid(5).id('five'));

                Helper.equal(first, after1);

                const second = first.fork('numbers', (schema) => schema.min(10));

                const after2 = Joi.array().items(
                    Joi.number().positive().id('numbers').min(10),
                    Joi.object({
                        c: Joi.object({
                            d: Joi.number().positive().max(5)
                        })
                    })
                        .id('objects')
                )
                    .has(Joi.object())
                    .has(Joi.valid(5).id('five'));

                Helper.equal(second, after2);

                const third = second.fork('five', (schema) => schema.allow(-5));

                const after3 = Joi.array().items(
                    Joi.number().positive().id('numbers').min(10),
                    Joi.object({
                        c: Joi.object({
                            d: Joi.number().positive().max(5)
                        })
                    })
                        .id('objects')
                )
                    .has(Joi.object())
                    .has(Joi.valid(5, -5).id('five'));

                Helper.equal(third, after3);
            });
        });

        describe('object', () => {

            it('adjusts nested schema', () => {

                const before = Joi.object({
                    a: Joi.number(),
                    b: Joi.object({
                        c: Joi.object({
                            d: Joi.number()
                        })
                    })
                });

                const after = Joi.object({
                    a: Joi.number(),
                    b: Joi.object({
                        c: Joi.object({
                            d: Joi.number().min(10)
                        })
                    })
                });

                Helper.equal(before.fork('b.c.d', (schema) => schema.min(10)), after);
                Helper.equal(before.fork([['b', 'c', 'd']], (schema) => schema.min(10)), after);
            });

            it('forks multiple times', () => {

                const before = Joi.object({
                    b: Joi.object({
                        c: Joi.object({
                            d: Joi.number()
                        })
                    }),
                    x: Joi.number()
                });

                const bd = before.describe();

                const first = before.fork('b.c.d', (schema) => schema.min(10));
                const fd = first.describe();

                const second = first.fork('b.c.d', (schema) => schema.max(20));
                const sd = second.describe();

                const third = second.fork('b.c.d', (schema) => schema.min(5));
                const td = third.describe();

                const fourth = third.fork('x', (schema) => schema.required());

                const after = Joi.object({
                    b: Joi.object({
                        c: Joi.object({
                            d: Joi.number().max(20).min(5)
                        })
                    }),
                    x: Joi.number().required()
                });

                Helper.equal(fourth, after);

                expect(before.describe()).to.equal(bd);
                expect(first.describe()).to.equal(fd);
                expect(second.describe()).to.equal(sd);
                expect(third.describe()).to.equal(td);
            });

            it('forks same schema multiple times', () => {

                const before = Joi.object({
                    x: Joi.number(),
                    b: Joi.object({
                        c: Joi.object({
                            d: Joi.number()
                        })
                    })
                });

                const bd = before.describe();

                const first = before.fork('b.c.d', (schema) => schema.min(10));
                const fd = first.describe();

                const second = before.fork('b.c.d', (schema) => schema.max(20));
                const sd = second.describe();

                const third = before.fork('b.c.d', (schema) => schema.min(5));
                const td = third.describe();

                const fourth = before.fork('x', (schema) => schema.required());

                const a1 = Joi.object({
                    x: Joi.number(),
                    b: Joi.object({
                        c: Joi.object({
                            d: Joi.number().min(10)
                        })
                    })
                });

                Helper.equal(first, a1);

                const a2 = Joi.object({
                    x: Joi.number(),
                    b: Joi.object({
                        c: Joi.object({
                            d: Joi.number().max(20)
                        })
                    })
                });

                Helper.equal(second, a2);

                const a3 = Joi.object({
                    x: Joi.number(),
                    b: Joi.object({
                        c: Joi.object({
                            d: Joi.number().min(5)
                        })
                    })
                });

                Helper.equal(third, a3);

                const a4 = Joi.object({
                    x: Joi.number().required(),
                    b: Joi.object({
                        c: Joi.object({
                            d: Joi.number()
                        })
                    })
                });

                Helper.equal(fourth, a4);

                expect(before.describe()).to.equal(bd);
                expect(first.describe()).to.equal(fd);
                expect(second.describe()).to.equal(sd);
                expect(third.describe()).to.equal(td);
            });

            it('adjusts nested schema with ids', () => {

                const before = Joi.object({
                    a: Joi.number().id('A'),
                    b: Joi.object({
                        c: Joi.object({
                            d: Joi.number().id('D')
                        })
                    })
                });

                const after = Joi.object({
                    a: Joi.number().id('A'),
                    b: Joi.object({
                        c: Joi.object({
                            d: Joi.number().id('D').min(10)
                        })
                    })
                });

                Helper.equal(before.fork('b.c.D', (schema) => schema.min(10)), after);
                Helper.equal(before.fork([['b', 'c', 'D']], (schema) => schema.min(10)), after);
            });

            it('sets keys as required', () => {

                const orig = Joi.object({ a: 0, b: 0, c: { d: 0, e: { f: 0 } }, g: { h: 0 } });
                const schema = orig.fork(['a', 'b', 'c.d', 'c.e.f', 'g'], (x) => x.required());

                Helper.validate(orig, [
                    [{}, true]
                ]);

                Helper.validate(schema, [
                    [{}, false, {
                        message: '"a" is required',
                        path: ['a'],
                        type: 'any.required',
                        context: { label: 'a', key: 'a' }
                    }],
                    [{ a: 0 }, false, {
                        message: '"b" is required',
                        path: ['b'],
                        type: 'any.required',
                        context: { label: 'b', key: 'b' }
                    }],
                    [{ a: 0, b: 0 }, false, {
                        message: '"g" is required',
                        path: ['g'],
                        type: 'any.required',
                        context: { label: 'g', key: 'g' }
                    }],
                    [{ a: 0, b: 0, g: {} }, true],
                    [{ a: 0, b: 0, c: {}, g: {} }, false, {
                        message: '"c.d" is required',
                        path: ['c', 'd'],
                        type: 'any.required',
                        context: { label: 'c.d', key: 'd' }
                    }],
                    [{ a: 0, b: 0, c: { d: 0 }, g: {} }, true],
                    [{ a: 0, b: 0, c: { d: 0, e: {} }, g: {} }, false, {
                        message: '"c.e.f" is required',
                        path: ['c', 'e', 'f'],
                        type: 'any.required',
                        context: { label: 'c.e.f', key: 'f' }
                    }],
                    [{ a: 0, b: 0, c: { d: 0, e: { f: 0 } }, g: {} }, true]
                ]);
            });

            it('sets keys as optional', () => {

                const schema = Joi.object({
                    a: Joi.number().required(),
                    b: Joi.number().required()
                }).
                    fork(['a', 'b'], (x) => x.optional());

                Helper.validate(schema, [
                    [{}, true],
                    [{ a: 0 }, true],
                    [{ a: 0, b: 0 }, true]
                ]);
            });

            it('sets keys as forbidden', () => {

                const schema = Joi.object({
                    a: Joi.number().required(),
                    b: Joi.number().required()
                }).
                    fork(['a', 'b'], (x) => x.forbidden());

                Helper.validate(schema, [
                    [{}, true],
                    [{ a: undefined }, true],
                    [{ a: undefined, b: undefined }, true],
                    [{ a: 0 }, false, {
                        message: '"a" is not allowed',
                        path: ['a'],
                        type: 'any.unknown',
                        context: { label: 'a', key: 'a', value: 0 }
                    }],
                    [{ b: 0 }, false, {
                        message: '"b" is not allowed',
                        path: ['b'],
                        type: 'any.unknown',
                        context: { label: 'b', key: 'b', value: 0 }
                    }]
                ]);
            });

            it('adjusts object assert', () => {

                const before = Joi.object({
                    a: Joi.object({
                        b: Joi.number()
                    }),
                    b: Joi.object({
                        d: Joi.number()
                    })
                })
                    .assert('b.d', Joi.valid(1))
                    .assert('a.b', Joi.valid(Joi.ref('b.d')).id('assert'));

                const after = Joi.object({
                    a: Joi.object({
                        b: Joi.number()
                    }),
                    b: Joi.object({
                        d: Joi.number()
                    })
                })
                    .assert('b.d', Joi.valid(1))
                    .assert('a.b', Joi.valid(Joi.ref('b.d'), 'x').id('assert'));

                expect(before.fork('assert', (schema) => schema.valid('x')).describe()).to.equal(after.describe());
            });

            it('adjusts object assert (with pattern)', () => {

                const before = Joi.object({
                    a: Joi.object({
                        b: Joi.number()
                    }),
                    b: Joi.object({
                        d: Joi.number()
                    })
                })
                    .min(2)
                    .pattern(/\d/, Joi.any())
                    .assert('a.b', Joi.valid(Joi.ref('b.d')).id('assert'));

                const after = Joi.object({
                    a: Joi.object({
                        b: Joi.number()
                    }),
                    b: Joi.object({
                        d: Joi.number()
                    })
                })
                    .min(2)
                    .pattern(/\d/, Joi.any())
                    .assert('a.b', Joi.valid(Joi.ref('b.d'), 'x').id('assert'));

                expect(before.fork('assert', (schema) => schema.valid('x')).describe()).to.equal(after.describe());
            });

            it('adjusts object pattern', () => {

                const before = Joi.object()
                    .pattern(/.*/, Joi.valid('x').id('pattern'));

                const after = Joi.object()
                    .pattern(/.*/, Joi.valid('x', 'y').id('pattern'));

                expect(before.fork('pattern', (schema) => schema.valid('y')).describe()).to.equal(after.describe());
            });
        });
    });

    describe('id()', () => {

        it('unsets id', () => {

            const schema = Joi.any().id('x');
            Helper.equal(schema.id(), Joi.any());
        });

        it('errors on invalid id', () => {

            expect(() => Joi.any().id('a.b')).to.throw('id cannot contain period character');
        });

        it('overrides id', () => {

            const schema = Joi.any().id('x');
            Helper.equal(schema.id('y'), Joi.any().id('y'));
        });
    });

    describe('labels()', () => {

        it('extracts nested schema', () => {

            const d = Joi.number();
            const c = Joi.object({ d });
            const b = Joi.object({ c });
            const a = Joi.object({ b });

            expect(a.$_mapLabels('b')).to.equal('b');
            expect(a.$_mapLabels('b.c.d')).to.equal('b.c.d');
            expect(a.$_mapLabels(['b', 'c', 'd'])).to.equal('b.c.d');
        });

        it('extracts nested schema with ids', () => {

            const d = Joi.number().label('D');
            const c = Joi.object({ d }).label('C');
            const b = Joi.object({ c }).label('B');
            const a = Joi.object({ b });

            expect(a.$_mapLabels('b')).to.equal('B');
            expect(a.$_mapLabels('b.c.d')).to.equal('B.C.D');
        });
    });

    describe('schema()', () => {

        it('changes multiple schemas in different sources', () => {

            const custom = Joi.extend({
                type: 'special',
                coerce(value, helpers) {

                    const swap = helpers.schema.$_getFlag('swap');
                    if (swap &&
                        swap.$_match(value, helpers.state.nest(swap), helpers.prefs)) {

                        return { value: ['swapped'] };
                    }
                },
                terms: {
                    x: { init: [] }
                },
                rules: {
                    swap: {
                        method(schema) {

                            return this.$_setFlag('swap', this.$_compile(schema));
                        }
                    },
                    pattern: {
                        method(schema) {

                            return this.$_addRule({ name: 'pattern', args: { schema: this.$_compile(schema) } });
                        },
                        validate() { }
                    },
                    term: {
                        method(schema) {

                            this.$_terms.x.push(schema);
                            return this;
                        }
                    }
                }
            });

            const schema = custom.special()
                .swap(Joi.number())
                .empty(Joi.object())
                .pattern(Joi.binary())
                .term(Joi.number());

            const each = (item) => item.min(10);

            expect(schema.$_modify({ each, ref: false, schema: false })).to.equal(schema);

            const modified = schema.$_modify({ each, ref: false });

            expect(modified.describe()).to.equal({
                type: 'special',
                flags: {
                    empty: {
                        rules: [{ args: { limit: 10 }, name: 'min' }],
                        type: 'object'
                    },
                    swap: {
                        rules: [{ args: { limit: 10 }, name: 'min' }],
                        type: 'number'
                    }
                },
                rules: [{
                    args: {
                        schema: {
                            rules: [{ args: { limit: 10 }, name: 'min' }],
                            type: 'binary'
                        }
                    },
                    name: 'pattern'
                }],
                x: [
                    {
                        rules: [{ args: { limit: 10 }, name: 'min' }],
                        type: 'number'
                    }
                ]
            });
        });
    });
});
