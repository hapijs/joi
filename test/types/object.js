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


describe('object', () => {

    it('converts a json string to an object', (done) => {

        Joi.object().validate('{"hi":true}', (err, value) => {

            expect(err).to.not.exist();
            expect(value.hi).to.equal(true);
            done();
        });
    });

    it('errors on non-object string', (done) => {

        Joi.object().validate('a string', (err, value) => {

            expect(err).to.be.an.error('"value" must be an object');
            expect(err.details).to.equal([{
                message: '"value" must be an object',
                path: [],
                type: 'object.base',
                context: { label: 'value', key: undefined }
            }]);
            expect(value).to.equal('a string');
            done();
        });
    });

    it('validates an object', (done) => {

        const schema = Joi.object().required();
        Helper.validate(schema, [
            [{}, true],
            [{ hi: true }, true],
            ['', false, null, {
                message: '"value" must be an object',
                details: [{
                    message: '"value" must be an object',
                    path: [],
                    type: 'object.base',
                    context: { label: 'value', key: undefined }
                }]
            }]
        ], done);
    });

    it('return object reference when no rules specified', (done) => {

        const schema = Joi.object({
            a: Joi.object()
        });

        const item = { x: 5 };
        schema.validate({ a: item }, (err, value) => {

            expect(err).not.to.exist();
            expect(value.a).to.equal(item);
            done();
        });
    });

    it('retains ignored values', (done) => {

        const schema = Joi.object();
        schema.validate({ a: 5 }, (err, value) => {

            expect(err).not.to.exist();
            expect(value.a).to.equal(5);
            done();
        });
    });

    it('retains skipped values', (done) => {

        const schema = Joi.object({ b: 5 }).unknown(true);
        schema.validate({ b: '5', a: 5 }, (err, value) => {

            expect(err).not.to.exist();
            expect(value.a).to.equal(5);
            expect(value.b).to.equal(5);
            done();
        });
    });

    it('allows any key when schema is undefined', (done) => {

        Joi.object().validate({ a: 4 }, (err, value) => {

            expect(err).to.not.exist();

            Joi.object(undefined).validate({ a: 4 }, (err2, value2) => {

                expect(err2).to.not.exist();
                done();
            });
        });
    });

    it('allows any key when schema is null', (done) => {

        Joi.object(null).validate({ a: 4 }, (err, value) => {

            expect(err).to.not.exist();
            done();
        });
    });

    it('throws on invalid object schema', (done) => {

        expect(() => {

            Joi.object(4);
        }).to.throw('Object schema must be a valid object');
        done();
    });

    it('throws on joi object schema', (done) => {

        expect(() => {

            Joi.object(Joi.object());
        }).to.throw('Object schema cannot be a joi schema');
        done();
    });

    it('skips conversion when value is undefined', (done) => {

        Joi.object({ a: Joi.object() }).validate(undefined, (err, value) => {

            expect(err).to.not.exist();
            expect(value).to.not.exist();
            done();
        });
    });

    it('errors on array', (done) => {

        Joi.object().validate([1, 2, 3], (err, value) => {

            expect(err).to.be.an.error('"value" must be an object');
            expect(err.details).to.equal([{
                message: '"value" must be an object',
                path: [],
                type: 'object.base',
                context: { label: 'value', key: undefined }
            }]);
            done();
        });
    });

    it('should prevent extra keys from existing by default', (done) => {

        const schema = Joi.object({ item: Joi.string().required() }).required();
        Helper.validate(schema, [
            [{ item: 'something' }, true],
            [{ item: 'something', item2: 'something else' }, false, null, {
                message: '"item2" is not allowed',
                details: [{
                    message: '"item2" is not allowed',
                    path: ['item2'],
                    type: 'object.allowUnknown',
                    context: { child: 'item2', label: 'item2', key: 'item2' }
                }]
            }],
            ['', false, null, {
                message: '"value" must be an object',
                details: [{
                    message: '"value" must be an object',
                    path: [],
                    type: 'object.base',
                    context: { label: 'value', key: undefined }
                }]
            }]
        ], done);
    });

    it('should validate count when min is set', (done) => {

        const schema = Joi.object().min(3);
        Helper.validate(schema, [
            [{ item: 'something' }, false, null, {
                message: '"value" must have at least 3 children',
                details: [{
                    message: '"value" must have at least 3 children',
                    path: [],
                    type: 'object.min',
                    context: { limit: 3, label: 'value', key: undefined }
                }]
            }],
            [{ item: 'something', item2: 'something else' }, false, null, {
                message: '"value" must have at least 3 children',
                details: [{
                    message: '"value" must have at least 3 children',
                    path: [],
                    type: 'object.min',
                    context: { limit: 3, label: 'value', key: undefined }
                }]
            }],
            [{ item: 'something', item2: 'something else', item3: 'something something else' }, true],
            ['', false, null, {
                message: '"value" must be an object',
                details: [{
                    message: '"value" must be an object',
                    path: [],
                    type: 'object.base',
                    context: { label: 'value', key: undefined }
                }]
            }]
        ], done);
    });

    it('should validate count when max is set', (done) => {

        const schema = Joi.object().max(2);
        Helper.validate(schema, [
            [{ item: 'something' }, true],
            [{ item: 'something', item2: 'something else' }, true],
            [{ item: 'something', item2: 'something else', item3: 'something something else' }, false, null, {
                message: '"value" must have less than or equal to 2 children',
                details: [{
                    message: '"value" must have less than or equal to 2 children',
                    path: [],
                    type: 'object.max',
                    context: { limit: 2, label: 'value', key: undefined }
                }]
            }],
            ['', false, null, {
                message: '"value" must be an object',
                details: [{
                    message: '"value" must be an object',
                    path: [],
                    type: 'object.base',
                    context: { label: 'value', key: undefined }
                }]
            }]
        ], done);
    });

    it('should validate count when min and max is set', (done) => {

        const schema = Joi.object().max(3).min(2);
        Helper.validate(schema, [
            [{ item: 'something' }, false, null, {
                message: '"value" must have at least 2 children',
                details: [{
                    message: '"value" must have at least 2 children',
                    path: [],
                    type: 'object.min',
                    context: { limit: 2, label: 'value', key: undefined }
                }]
            }],
            [{ item: 'something', item2: 'something else' }, true],
            [{ item: 'something', item2: 'something else', item3: 'something something else' }, true],
            [{ item: 'something', item2: 'something else', item3: 'something something else', item4: 'item4' }, false, null, {
                message: '"value" must have less than or equal to 3 children',
                details: [{
                    message: '"value" must have less than or equal to 3 children',
                    path: [],
                    type: 'object.max',
                    context: { limit: 3, label: 'value', key: undefined }
                }]
            }],
            ['', false, null, {
                message: '"value" must be an object',
                details: [{
                    message: '"value" must be an object',
                    path: [],
                    type: 'object.base',
                    context: { label: 'value', key: undefined }
                }]
            }]
        ], done);
    });

    it('should validate count when length is set', (done) => {

        const schema = Joi.object().length(2);
        Helper.validate(schema, [
            [{ item: 'something' }, false, null, {
                message: '"value" must have 2 children',
                details: [{
                    message: '"value" must have 2 children',
                    path: [],
                    type: 'object.length',
                    context: { limit: 2, label: 'value', key: undefined }
                }]
            }],
            [{ item: 'something', item2: 'something else' }, true],
            [{ item: 'something', item2: 'something else', item3: 'something something else' }, false, null, {
                message: '"value" must have 2 children',
                details: [{
                    message: '"value" must have 2 children',
                    path: [],
                    type: 'object.length',
                    context: { limit: 2, label: 'value', key: undefined }
                }]
            }],
            ['', false, null, {
                message: '"value" must be an object',
                details: [{
                    message: '"value" must be an object',
                    path: [],
                    type: 'object.base',
                    context: { label: 'value', key: undefined }
                }]
            }]
        ], done);
    });

    it('should validate constructor when type is set', (done) => {

        const schema = Joi.object().type(RegExp);
        Helper.validate(schema, [
            [{ item: 'something' }, false, null, {
                message: '"value" must be an instance of "RegExp"',
                details: [{
                    message: '"value" must be an instance of "RegExp"',
                    path: [],
                    type: 'object.type',
                    context: { type: 'RegExp', label: 'value', key: undefined }
                }]
            }],
            ['', false, null, {
                message: '"value" must be an object',
                details: [{
                    message: '"value" must be an object',
                    path: [],
                    type: 'object.base',
                    context: { label: 'value', key: undefined }
                }]
            }],
            [new Date(), false, null, {
                message: '"value" must be an instance of "RegExp"',
                details: [{
                    message: '"value" must be an instance of "RegExp"',
                    path: [],
                    type: 'object.type',
                    context: { type: 'RegExp', label: 'value', key: undefined }
                }]
            }],
            [/abcd/, true],
            [new RegExp(), true]
        ], done);
    });

    it('should traverse an object and validate all properties in the top level', (done) => {

        const schema = Joi.object({
            num: Joi.number()
        });

        Helper.validate(schema, [
            [{ num: 1 }, true],
            [{ num: [1, 2, 3] }, false, null, {
                message: 'child "num" fails because ["num" must be a number]',
                details: [{
                    message: '"num" must be a number',
                    path: ['num'],
                    type: 'number.base',
                    context: { label: 'num', key: 'num' }
                }]
            }]
        ], done);
    });

    it('should traverse an object and child objects and validate all properties', (done) => {

        const schema = Joi.object({
            num: Joi.number(),
            obj: Joi.object({
                item: Joi.string()
            })
        });

        Helper.validate(schema, [
            [{ num: 1 }, true],
            [{ num: [1, 2, 3] }, false, null, {
                message: 'child "num" fails because ["num" must be a number]',
                details: [{
                    message: '"num" must be a number',
                    path: ['num'],
                    type: 'number.base',
                    context: { label: 'num', key: 'num' }
                }]
            }],
            [{ num: 1, obj: { item: 'something' } }, true],
            [{ num: 1, obj: { item: 123 } }, false, null, {
                message: 'child "obj" fails because [child "item" fails because ["item" must be a string]]',
                details: [{
                    message: '"item" must be a string',
                    path: ['obj', 'item'],
                    type: 'string.base',
                    context: { value: 123, label: 'item', key: 'item' }
                }]
            }]
        ], done);
    });

    it('should traverse an object several levels', (done) => {

        const schema = Joi.object({
            obj: Joi.object({
                obj: Joi.object({
                    obj: Joi.object({
                        item: Joi.boolean()
                    })
                })
            })
        });

        Helper.validate(schema, [
            [{ num: 1 }, false, null, {
                message: '"num" is not allowed',
                details: [{
                    message: '"num" is not allowed',
                    path: ['num'],
                    type: 'object.allowUnknown',
                    context: { child: 'num', label: 'num', key: 'num' }
                }]
            }],
            [{ obj: {} }, true],
            [{ obj: { obj: {} } }, true],
            [{ obj: { obj: { obj: {} } } }, true],
            [{ obj: { obj: { obj: { item: true } } } }, true],
            [{ obj: { obj: { obj: { item: 10 } } } }, false, null, {
                message: 'child "obj" fails because [child "obj" fails because [child "obj" fails because [child "item" fails because ["item" must be a boolean]]]]',
                details: [{
                    message: '"item" must be a boolean',
                    path: ['obj', 'obj', 'obj', 'item'],
                    type: 'boolean.base',
                    context: { label: 'item', key: 'item' }
                }]
            }]
        ], done);
    });

    it('should traverse an object several levels with required levels', (done) => {

        const schema = Joi.object({
            obj: Joi.object({
                obj: Joi.object({
                    obj: Joi.object({
                        item: Joi.boolean()
                    })
                }).required()
            })
        });

        Helper.validate(schema, [
            [null, false, null, {
                message: '"value" must be an object',
                details: [{
                    message: '"value" must be an object',
                    path: [],
                    type: 'object.base',
                    context: { label: 'value', key: undefined }
                }]
            }],
            [undefined, true],
            [{}, true],
            [{ obj: {} }, false, null, {
                message: 'child "obj" fails because [child "obj" fails because ["obj" is required]]',
                details: [{
                    message: '"obj" is required',
                    path: ['obj', 'obj'],
                    type: 'any.required',
                    context: { label: 'obj', key: 'obj' }
                }]
            }],
            [{ obj: { obj: {} } }, true],
            [{ obj: { obj: { obj: {} } } }, true],
            [{ obj: { obj: { obj: { item: true } } } }, true],
            [{ obj: { obj: { obj: { item: 10 } } } }, false, null, {
                message: 'child "obj" fails because [child "obj" fails because [child "obj" fails because [child "item" fails because ["item" must be a boolean]]]]',
                details: [{
                    message: '"item" must be a boolean',
                    path: ['obj', 'obj', 'obj', 'item'],
                    type: 'boolean.base',
                    context: { label: 'item', key: 'item' }
                }]
            }]
        ], done);
    });

    it('should traverse an object several levels with required levels (without Joi.obj())', (done) => {

        const schema = {
            obj: {
                obj: {
                    obj: {
                        item: Joi.boolean().required()
                    }
                }
            }
        };

        Helper.validate(schema, [
            [null, false, null, {
                message: '"value" must be an object',
                details: [{
                    message: '"value" must be an object',
                    path: [],
                    type: 'object.base',
                    context: { label: 'value', key: undefined }
                }]
            }],
            [undefined, true],
            [{}, true],
            [{ obj: {} }, true],
            [{ obj: { obj: {} } }, true],
            [{ obj: { obj: { obj: {} } } }, false, null, {
                message: 'child "obj" fails because [child "obj" fails because [child "obj" fails because [child "item" fails because ["item" is required]]]]',
                details: [{
                    message: '"item" is required',
                    path: ['obj', 'obj', 'obj', 'item'],
                    type: 'any.required',
                    context: { label: 'item', key: 'item' }
                }]
            }],
            [{ obj: { obj: { obj: { item: true } } } }, true],
            [{ obj: { obj: { obj: { item: 10 } } } }, false, null, {
                message: 'child "obj" fails because [child "obj" fails because [child "obj" fails because [child "item" fails because ["item" must be a boolean]]]]',
                details: [{
                    message: '"item" must be a boolean',
                    path: ['obj', 'obj', 'obj', 'item'],
                    type: 'boolean.base',
                    context: { label: 'item', key: 'item' }
                }]
            }]
        ], done);
    });

    it('errors on unknown keys when functions allows', (done) => {

        const schema = Joi.object({ a: Joi.number() }).options({ skipFunctions: true });
        const obj = { a: 5, b: 'value' };
        schema.validate(obj, (err, value) => {

            expect(err).to.be.an.error('"b" is not allowed');
            expect(err.details).to.equal([{
                message: '"b" is not allowed',
                path: ['b'],
                type: 'object.allowUnknown',
                context: { child: 'b', label: 'b', key: 'b' }
            }]);
            done();
        });
    });

    it('validates both valid() and with()', (done) => {

        const schema = Joi.object({
            first: Joi.valid('value'),
            second: Joi.any()
        }).with('first', 'second');

        Helper.validate(schema, [
            [{ first: 'value' }, false, null, {
                message: '"first" missing required peer "second"',
                details: [{
                    message: '"first" missing required peer "second"',
                    path: ['first'],
                    type: 'object.with',
                    context: {
                        main: 'first',
                        mainWithLabel: 'first',
                        peer: 'second',
                        peerWithLabel: 'second',
                        label: 'first',
                        key: 'first'
                    }
                }]
            }]
        ], done);
    });

    it('validates referenced arrays in valid()', (done) => {

        const ref = Joi.ref('$x');
        const schema = Joi.object({
            foo: Joi.valid(ref)
        });

        Helper.validate(schema, [
            [{ foo: 'bar' }, true, { context: { x: 'bar' } }],
            [{ foo: 'bar' }, true, { context: { x: ['baz', 'bar'] } }],
            [{ foo: 'bar' }, false, { context: { x: 'baz' } }, {
                message: 'child "foo" fails because ["foo" must be one of [context:x]]',
                details: [{
                    message: '"foo" must be one of [context:x]',
                    path: ['foo'],
                    type: 'any.allowOnly',
                    context: { valids: [ref], label: 'foo', key: 'foo' }
                }]
            }],
            [{ foo: 'bar' }, false, { context: { x: ['baz', 'qux'] } }, {
                message: 'child "foo" fails because ["foo" must be one of [context:x]]',
                details: [{
                    message: '"foo" must be one of [context:x]',
                    path: ['foo'],
                    type: 'any.allowOnly',
                    context: { valids: [ref], label: 'foo', key: 'foo' }
                }]
            }],
            [{ foo: 'bar' }, false, null, {
                message: 'child "foo" fails because ["foo" must be one of [context:x]]',
                details: [{
                    message: '"foo" must be one of [context:x]',
                    path: ['foo'],
                    type: 'any.allowOnly',
                    context: { valids: [ref], label: 'foo', key: 'foo' }
                }]
            }]
        ], done);
    });

    it('errors on unknown nested keys with the correct path', (done) => {

        const schema = Joi.object({ a: Joi.object().keys({}) });
        const obj = { a: { b: 'value' } };
        schema.validate(obj, (err, value) => {

            expect(err).to.be.an.error('child "a" fails because ["b" is not allowed]');
            expect(err.details).to.equal([{
                message: '"b" is not allowed',
                path: ['a', 'b'],
                type: 'object.allowUnknown',
                context: { child: 'b', label: 'b', key: 'b' }
            }]);
            done();
        });
    });

    it('errors on unknown nested keys with the correct path at the root level', (done) => {

        const schema = Joi.object({ a: Joi.object().keys({}) });
        const obj = { c: 'hello' };
        schema.validate(obj, (err, value) => {

            expect(err).to.be.an.error('"c" is not allowed');
            expect(err.details).to.equal([{
                message: '"c" is not allowed',
                path: ['c'],
                type: 'object.allowUnknown',
                context: { child: 'c', label: 'c', key: 'c' }
            }]);
            done();
        });
    });

    it('should work on prototype-less objects', (done) => {

        const input = Object.create(null);
        const schema = Joi.object().keys({
            a: Joi.number()
        });

        input.a = 1337;

        Joi.validate(input, schema, (err) => {

            expect(err).to.not.exist();
            done();
        });
    });

    it('should be able to use rename safely with a fake hasOwnProperty', (done) => {

        const input = { a: 1, hasOwnProperty: 'foo' };
        const schema = Joi.object().rename('b', 'a');

        Joi.validate(input, schema, (err) => {

            expect(err).to.be.an.error('"value" cannot rename child "b" because override is disabled and target "a" exists');
            expect(err.details).to.equal([{
                message: '"value" cannot rename child "b" because override is disabled and target "a" exists',
                path: [],
                type: 'object.rename.override',
                context: { from: 'b', to: 'a', label: 'value', key: undefined }
            }]);
            done();
        });
    });

    it('should be able to use object.with() safely with a fake hasOwnProperty', (done) => {

        const input = { a: 1, hasOwnProperty: 'foo' };
        const schema = Joi.object({ a: 1 }).with('a', 'b');

        Joi.validate(input, schema, (err) => {

            expect(err).to.be.an.error('"hasOwnProperty" is not allowed. "a" missing required peer "b"');
            expect(err.details).to.equal([
                {
                    message: '"hasOwnProperty" is not allowed',
                    path: ['hasOwnProperty'],
                    type: 'object.allowUnknown',
                    context:
                        {
                            child: 'hasOwnProperty',
                            label: 'hasOwnProperty',
                            key: 'hasOwnProperty'
                        }
                },
                {
                    message: '"a" missing required peer "b"',
                    path: ['a'],
                    type: 'object.with',
                    context:
                        {
                            main: 'a',
                            mainWithLabel: 'a',
                            peer: 'b',
                            peerWithLabel: 'b',
                            label: 'a',
                            key: 'a'
                        }
                }
            ]);
            done();
        });
    });

    describe('keys()', () => {

        it('allows any key', (done) => {

            const a = Joi.object({ a: 4 });
            const b = a.keys();
            a.validate({ b: 3 }, (err, value) => {

                expect(err).to.be.an.error('"b" is not allowed');
                expect(err.details).to.equal([{
                    message: '"b" is not allowed',
                    path: ['b'],
                    type: 'object.allowUnknown',
                    context: { child: 'b', label: 'b', key: 'b' }
                }]);

                b.validate({ b: 3 }, (err2, value2) => {

                    expect(err2).to.not.exist();
                    done();
                });
            });
        });

        it('forbids all keys', (done) => {

            const a = Joi.object();
            const b = a.keys({});
            a.validate({ b: 3 }, (err, value) => {

                expect(err).to.not.exist();
                b.validate({ b: 3 }, (err2, value2) => {

                    expect(err2).to.be.an.error('"b" is not allowed');
                    expect(err2.details).to.equal([{
                        message: '"b" is not allowed',
                        path: ['b'],
                        type: 'object.allowUnknown',
                        context: { child: 'b', label: 'b', key: 'b' }
                    }]);
                    done();
                });
            });
        });

        it('adds to existing keys', (done) => {

            const a = Joi.object({ a: 1 });
            const b = a.keys({ b: 2 });
            a.validate({ a: 1, b: 2 }, (err, value) => {

                expect(err).to.be.an.error('"b" is not allowed');
                expect(err.details).to.equal([{
                    message: '"b" is not allowed',
                    path: ['b'],
                    type: 'object.allowUnknown',
                    context: { child: 'b', label: 'b', key: 'b' }
                }]);

                b.validate({ a: 1, b: 2 }, (err2, value2) => {

                    expect(err2).to.not.exist();
                    done();
                });
            });
        });

        it('overrides existing keys', (done) => {

            const a = Joi.object({ a: 1 });
            const b = a.keys({ a: Joi.string() });

            Helper.validate(a, [
                [{ a: 1 }, true, null, { a: 1 }],
                [{ a: '1' }, true, null, { a: 1 }],
                [{ a: '2' }, false, null, {
                    message: 'child "a" fails because ["a" must be one of [1]]',
                    details: [{
                        message: '"a" must be one of [1]',
                        path: ['a'],
                        type: 'any.allowOnly',
                        context: { valids: [1], label: 'a', key: 'a' }
                    }]
                }]
            ], () => {

                Helper.validate(b, [
                    [{ a: 1 }, false, null, {
                        message: 'child "a" fails because ["a" must be a string]',
                        details: [{
                            message: '"a" must be a string',
                            path: ['a'],
                            type: 'string.base',
                            context: { value: 1, label: 'a', key: 'a' }
                        }]
                    }],
                    [{ a: '1' }, true, null, { a: '1' }]
                ], done);
            });
        });

        it('strips keys flagged with strip', (done) => {

            const schema = Joi.object({
                a: Joi.string().strip(),
                b: Joi.string()
            });
            schema.validate({ a: 'test', b: 'test' }, (err, value) => {

                expect(err).to.not.exist();
                expect(value.a).to.not.exist();
                expect(value.b).to.equal('test');
                done();
            });
        });

        it('strips keys after validation', (done) => {

            const schema = Joi.object({
                a: Joi.string().strip(),
                b: Joi.string().default(Joi.ref('a'))
            });
            schema.validate({ a: 'test' }, (err, value) => {

                expect(err).to.not.exist();
                expect(value.a).to.not.exist();
                expect(value.b).to.equal('test');
                done();
            });
        });

        it('strips keys while preserving transformed values', (done) => {

            const schema = Joi.object({
                a: Joi.number().strip(),
                b: Joi.number().min(Joi.ref('a'))
            });

            const result = schema.validate({ a: '1', b: '2' });
            expect(result.error).to.not.exist();
            expect(result.value.a).to.not.exist();
            expect(result.value.b).to.equal(2);

            const result2 = schema.validate({ a: '1', b: '0' });
            expect(result2.error).to.be.an.error('child "b" fails because ["b" must be larger than or equal to 1]');
            expect(result2.error.details).to.equal([{
                message: '"b" must be larger than or equal to 1',
                path: ['b'],
                type: 'number.min',
                context: { limit: 1, value: 0, label: 'b', key: 'b' }
            }]);

            done();
        });

        it('does not alter the original object when stripping keys', (done) => {

            const schema = Joi.object({
                a: Joi.string().strip(),
                b: Joi.string()
            });

            const valid = {
                a: 'test',
                b: 'test'
            };

            schema.validate(valid, (err, value) => {

                expect(err).to.not.exist();
                expect(value.a).to.not.exist();
                expect(valid.a).to.equal('test');
                expect(value.b).to.equal('test');
                expect(valid.b).to.equal('test');
                done();
            });
        });

        it('should strip from an alternative', (done) => {

            const schema = Joi.object({
                a: [Joi.boolean().strip()]
            });

            const valid = {
                a: true
            };

            schema.validate(valid, (err, value) => {

                expect(err).to.not.exist();
                expect(value).to.equal({});
                done();
            });
        });
    });

    describe('unknown()', () => {

        it('avoids unnecessary cloning when called twice', (done) => {

            const schema = Joi.object().unknown();
            expect(schema.unknown()).to.shallow.equal(schema);
            done();
        });

        it('allows local unknown without applying to children', (done) => {

            const schema = Joi.object({
                a: {
                    b: Joi.number()
                }
            }).unknown();

            Helper.validate(schema, [
                [{ a: { b: 5 } }, true],
                [{ a: { b: 'x' } }, false, null, {
                    message: 'child "a" fails because [child "b" fails because ["b" must be a number]]',
                    details: [{
                        message: '"b" must be a number',
                        path: ['a', 'b'],
                        type: 'number.base',
                        context: { label: 'b', key: 'b' }
                    }]
                }],
                [{ a: { b: 5 }, c: 'ignore' }, true],
                [{ a: { b: 5, c: 'ignore' } }, false, null, {
                    message: 'child "a" fails because ["c" is not allowed]',
                    details: [{
                        message: '"c" is not allowed',
                        path: ['a', 'c'],
                        type: 'object.allowUnknown',
                        context: { child: 'c', label: 'c', key: 'c' }
                    }]
                }]
            ], done);
        });

        it('forbids local unknown without applying to children', (done) => {

            const schema = Joi.object({
                a: Joi.object({
                    b: Joi.number()
                }).unknown()
            }).options({ allowUnknown: false });

            Helper.validate(schema, [
                [{ a: { b: 5 } }, true],
                [{ a: { b: 'x' } }, false, null, {
                    message: 'child "a" fails because [child "b" fails because ["b" must be a number]]',
                    details: [{
                        message: '"b" must be a number',
                        path: ['a', 'b'],
                        type: 'number.base',
                        context: { label: 'b', key: 'b' }
                    }]
                }],
                [{ a: { b: 5 }, c: 'ignore' }, false, null, {
                    message: '"c" is not allowed',
                    details: [{
                        message: '"c" is not allowed',
                        path: ['c'],
                        type: 'object.allowUnknown',
                        context: { child: 'c', label: 'c', key: 'c' }
                    }]
                }],
                [{ a: { b: 5, c: 'ignore' } }, true]
            ], done);
        });

        it('overrides stripUnknown at a local level', (done) => {

            const schema = Joi.object({
                a: Joi.object({
                    b: Joi.number(),
                    c: Joi.object({
                        d: Joi.number()
                    })
                }).unknown()
            }).options({ allowUnknown: false, stripUnknown: true });

            Helper.validate(schema, [
                [{ a: { b: 5 } }, true, null, { a: { b: 5 } }],
                [{ a: { b: 'x' } }, false, null, {
                    message: 'child "a" fails because [child "b" fails because ["b" must be a number]]',
                    details: [{
                        message: '"b" must be a number',
                        path: ['a', 'b'],
                        type: 'number.base',
                        context: { label: 'b', key: 'b' }
                    }]
                }],
                [{ a: { b: 5 }, d: 'ignore' }, true, null, { a: { b: 5 } }],
                [{ a: { b: 5, d: 'ignore' } }, true, null, { a: { b: 5, d: 'ignore' } }],
                [{ a: { b: 5, c: { e: 'ignore' } } }, true, null, { a: { b: 5, c: {} } }]
            ], done);
        });
    });

    describe('rename()', () => {

        it('allows renaming multiple times with multiple enabled', (done) => {

            const schema = Joi.object({
                test: Joi.string()
            }).rename('test1', 'test').rename('test2', 'test', { multiple: true });

            Joi.compile(schema).validate({ test1: 'a', test2: 'b' }, (err, value) => {

                expect(err).to.not.exist();
                done();
            });
        });

        it('errors renaming multiple times with multiple disabled', (done) => {

            const schema = Joi.object({
                test: Joi.string()
            }).rename('test1', 'test').rename('test2', 'test');

            Joi.compile(schema).validate({ test1: 'a', test2: 'b' }, (err, value) => {

                expect(err).to.be.an.error('"value" cannot rename child "test2" because multiple renames are disabled and another key was already renamed to "test"');
                expect(err.details).to.equal([{
                    message: '"value" cannot rename child "test2" because multiple renames are disabled and another key was already renamed to "test"',
                    path: [],
                    type: 'object.rename.multiple',
                    context: { from: 'test2', to: 'test', label: 'value', key: undefined }
                }]);
                done();
            });
        });

        it('errors multiple times when abortEarly is false', (done) => {

            Joi.object().rename('a', 'b').rename('c', 'b').rename('d', 'b').options({ abortEarly: false }).validate({ a: 1, c: 1, d: 1 }, (err, value) => {

                expect(err).to.be.an.error('"value" cannot rename child "c" because multiple renames are disabled and another key was already renamed to "b". "value" cannot rename child "d" because multiple renames are disabled and another key was already renamed to "b"');
                expect(err.details).to.equal([
                    {
                        message: '"value" cannot rename child "c" because multiple renames are disabled and another key was already renamed to "b"',
                        path: [],
                        type: 'object.rename.multiple',
                        context: { from: 'c', to: 'b', label: 'value', key: undefined }
                    },
                    {
                        message: '"value" cannot rename child "d" because multiple renames are disabled and another key was already renamed to "b"',
                        path: [],
                        type: 'object.rename.multiple',
                        context: { from: 'd', to: 'b', label: 'value', key: undefined }
                    }
                ]);
                done();
            });
        });

        it('aliases a key', (done) => {

            const schema = Joi.object({
                a: Joi.number(),
                b: Joi.number()
            }).rename('a', 'b', { alias: true });

            const obj = { a: 10 };

            Joi.compile(schema).validate(obj, (err, value) => {

                expect(err).to.not.exist();
                expect(value.a).to.equal(10);
                expect(value.b).to.equal(10);
                done();
            });
        });

        it('with override disabled should not allow overwriting existing value', (done) => {

            const schema = Joi.object({
                test1: Joi.string()
            }).rename('test', 'test1');

            schema.validate({ test: 'b', test1: 'a' }, (err, value) => {

                expect(err).to.be.an.error('"value" cannot rename child "test" because override is disabled and target "test1" exists');
                expect(err.details).to.equal([{
                    message: '"value" cannot rename child "test" because override is disabled and target "test1" exists',
                    path: [],
                    type: 'object.rename.override',
                    context: { from: 'test', to: 'test1', label: 'value', key: undefined }
                }]);
                done();
            });
        });

        it('with override enabled should allow overwriting existing value', (done) => {

            const schema = Joi.object({
                test1: Joi.string()
            }).rename('test', 'test1', { override: true });

            schema.validate({ test: 'b', test1: 'a' }, (err, value) => {

                expect(err).to.not.exist();
                done();
            });
        });

        it('renames when data is nested in an array via items', (done) => {

            const schema = {
                arr: Joi.array().items(Joi.object({
                    one: Joi.string(),
                    two: Joi.string()
                }).rename('uno', 'one').rename('dos', 'two'))
            };

            const data = { arr: [{ uno: '1', dos: '2' }] };
            Joi.object(schema).validate(data, (err, value) => {

                expect(err).to.not.exist();
                expect(value.arr[0].one).to.equal('1');
                expect(value.arr[0].two).to.equal('2');
                done();
            });
        });

        it('applies rename and validation in the correct order regardless of key order', (done) => {

            const schema1 = Joi.object({
                a: Joi.number()
            }).rename('b', 'a');

            const input1 = { b: '5' };

            schema1.validate(input1, (err1, value1) => {

                expect(err1).to.not.exist();
                expect(value1.b).to.not.exist();
                expect(value1.a).to.equal(5);

                const schema2 = Joi.object({ a: Joi.number(), b: Joi.any() }).rename('b', 'a');
                const input2 = { b: '5' };

                schema2.validate(input2, (err2, value2) => {

                    expect(err2).to.not.exist();
                    expect(value2.b).to.not.exist();
                    expect(value2.a).to.equal(5);

                    done();
                });
            });
        });

        it('sets the default value after key is renamed', (done) => {

            const schema = Joi.object({
                foo2: Joi.string().default('test')
            }).rename('foo', 'foo2');

            const input = {};

            Joi.validate(input, schema, (err, value) => {

                expect(err).to.not.exist();
                expect(value.foo2).to.equal('test');

                done();
            });
        });

        it('should be able to rename keys that are empty strings', (done) => {

            const schema = Joi.object().rename('', 'notEmpty');
            const input = {
                '': 'something'
            };

            schema.validate(input, (err, value) => {

                expect(err).to.not.exist();
                expect(value['']).to.not.exist();
                expect(value.notEmpty).to.equal('something');
                done();
            });
        });

        it('should not create new keys when they key in question does not exist', (done) => {

            const schema = Joi.object().rename('b', '_b');

            const input = {
                a: 'something'
            };

            schema.validate(input, (err, value) => {

                expect(err).to.not.exist();
                expect(Object.keys(value)).to.include('a');
                expect(value.a).to.equal('something');
                done();
            });
        });

        it('should remove a key with override if from does not exist', (done) => {

            const schema = Joi.object().rename('b', 'a', { override: true });

            const input = {
                a: 'something'
            };

            schema.validate(input, (err, value) => {

                expect(err).to.not.exist();
                expect(value).to.equal({});
                done();
            });
        });

        it('should ignore a key with ignoredUndefined if from does not exist', (done) => {

            const schema = Joi.object().rename('b', 'a', { ignoreUndefined: true });

            const input = {
                a: 'something'
            };

            schema.validate(input, (err, value) => {

                expect(err).to.not.exist();
                expect(value).to.equal({ a: 'something' });
                done();
            });
        });

        it('shouldn\'t delete a key with override and ignoredUndefined if from does not exist', (done) => {

            const schema = Joi.object().rename('b', 'a', { ignoreUndefined: true, override: true });

            const input = {
                a: 'something'
            };

            schema.validate(input, (err, value) => {

                expect(err).to.not.exist();
                expect(value).to.equal({ a: 'something' });
                done();
            });
        });

        it('should fulfill describe() with defaults', (done) => {

            const schema = Joi.object().rename('b', 'a');
            const desc = schema.describe();

            expect(desc).to.equal({
                type: 'object',
                renames: [{
                    from: 'b',
                    to: 'a',
                    options: {
                        alias: false,
                        multiple: false,
                        override: false
                    }
                }]
            });
            done();
        });

        it('should fulfill describe() with non-defaults', (done) => {

            const schema = Joi.object().rename('b', 'a', { alias: true, multiple: true, override: true });
            const desc = schema.describe();

            expect(desc).to.equal({
                type: 'object',
                renames: [{
                    from: 'b',
                    to: 'a',
                    options: {
                        alias: true,
                        multiple: true,
                        override: true
                    }
                }]
            });
            done();
        });
    });

    describe('describe()', () => {

        it('return empty description when no schema defined', (done) => {

            const schema = Joi.object();
            const desc = schema.describe();
            expect(desc).to.equal({
                type: 'object'
            });
            done();
        });

        it('respects the shallow parameter', (done) => {

            const schema = Joi.object({
                name: Joi.string(),
                child: Joi.object({
                    name: Joi.string()
                })
            });

            expect(Object.keys(schema.describe(true))).to.not.include('children');
            expect(Object.keys(schema.describe())).to.include('children');

            done();
        });

        it('describes patterns', (done) => {

            const schema = Joi.object({
                a: Joi.string()
            }).pattern(/\w\d/i, Joi.boolean());

            expect(schema.describe()).to.equal({
                type: 'object',
                children: {
                    a: {
                        type: 'string',
                        invalids: ['']
                    }
                },
                patterns: [
                    {
                        regex: '/\\w\\d/i',
                        rule: {
                            type: 'boolean',
                            truthy: [true],
                            falsy: [false],
                            flags: {
                                insensitive: true
                            }
                        }
                    }
                ]
            });

            done();
        });
    });

    describe('length()', () => {

        it('throws when length is not a number', (done) => {

            expect(() => {

                Joi.object().length('a');
            }).to.throw('limit must be a positive integer');
            done();
        });
    });

    describe('min()', () => {

        it('throws when limit is not a number', (done) => {

            expect(() => {

                Joi.object().min('a');
            }).to.throw('limit must be a positive integer');
            done();
        });
    });

    describe('max()', () => {

        it('throws when limit is not a number', (done) => {

            expect(() => {

                Joi.object().max('a');
            }).to.throw('limit must be a positive integer');
            done();
        });
    });

    describe('pattern()', () => {

        it('shows path to errors in schema', (done) => {

            expect(() => {

                Joi.object().pattern(/.*/, {
                    a: {
                        b: {
                            c: {
                                d: undefined
                            }
                        }
                    }
                });
            }).to.throw(Error, 'Invalid schema content: (a.b.c.d)');

            expect(() => {

                Joi.object().pattern(/.*/, () => {

                });
            }).to.throw(Error, 'Invalid schema content: ');

            done();
        });

        it('validates unknown keys using a pattern', (done) => {

            const schema = Joi.object({
                a: Joi.number()
            }).pattern(/\d+/, Joi.boolean()).pattern(/\w\w+/, 'x');

            Joi.validate({ bb: 'y', 5: 'x' }, schema, { abortEarly: false }, (err, value) => {

                expect(err).to.be.an.error('child "5" fails because ["5" must be a boolean]. child "bb" fails because ["bb" must be one of [x]]');
                expect(err.details).to.equal([
                    {
                        message: '"5" must be a boolean',
                        path: ['5'],
                        type: 'boolean.base',
                        context: { label: '5', key: '5' }
                    },
                    {
                        message: '"bb" must be one of [x]',
                        path: ['bb'],
                        type: 'any.allowOnly',
                        context: { valids: ['x'], label: 'bb', key: 'bb' }
                    }
                ]);

                Helper.validate(schema, [
                    [{ a: 5 }, true],
                    [{ a: 'x' }, false, null, {
                        message: 'child "a" fails because ["a" must be a number]',
                        details: [{
                            message: '"a" must be a number',
                            path: ['a'],
                            type: 'number.base',
                            context: { label: 'a', key: 'a' }
                        }]
                    }],
                    [{ b: 'x' }, false, null, {
                        message: '"b" is not allowed',
                        details: [{
                            message: '"b" is not allowed',
                            path: ['b'],
                            type: 'object.allowUnknown',
                            context: { child: 'b', label: 'b', key: 'b' }
                        }]
                    }],
                    [{ bb: 'x' }, true],
                    [{ 5: 'x' }, false, null, {
                        message: 'child "5" fails because ["5" must be a boolean]',
                        details: [{
                            message: '"5" must be a boolean',
                            path: ['5'],
                            type: 'boolean.base',
                            context: { label: '5', key: '5' }
                        }]
                    }],
                    [{ 5: false }, true],
                    [{ 5: undefined }, true]
                ], done);
            });
        });

        it('validates unknown keys using a pattern (nested)', (done) => {

            const schema = {
                x: Joi.object({
                    a: Joi.number()
                }).pattern(/\d+/, Joi.boolean()).pattern(/\w\w+/, 'x')
            };

            Joi.validate({ x: { bb: 'y', 5: 'x' } }, schema, { abortEarly: false }, (err, value) => {

                expect(err).to.be.an.error('child "x" fails because [child "5" fails because ["5" must be a boolean], child "bb" fails because ["bb" must be one of [x]]]');
                expect(err.details).to.equal([
                    {
                        message: '"5" must be a boolean',
                        path: ['x', '5'],
                        type: 'boolean.base',
                        context: { label: '5', key: '5' }
                    },
                    {
                        message: '"bb" must be one of [x]',
                        path: ['x', 'bb'],
                        type: 'any.allowOnly',
                        context: { valids: ['x'], label: 'bb', key: 'bb' }
                    }
                ]);
                done();
            });
        });

        it('errors when using a pattern on empty schema with unknown(false) and pattern mismatch', (done) => {

            const schema = Joi.object().pattern(/\d/, Joi.number()).unknown(false);

            Joi.validate({ a: 5 }, schema, { abortEarly: false }, (err, value) => {

                expect(err).to.be.an.error('"a" is not allowed');
                expect(err.details).to.equal([{
                    message: '"a" is not allowed',
                    path: ['a'],
                    type: 'object.allowUnknown',
                    context: { child: 'a', label: 'a', key: 'a' }
                }]);
                done();
            });
        });

        it('removes global flag from patterns', (done) => {

            const schema = Joi.object().pattern(/a/g, Joi.number());

            Joi.validate({ a1: 5, a2: 6 }, schema, (err, value) => {

                expect(err).to.not.exist();
                done();
            });
        });
    });

    describe('with()', () => {

        it('should throw an error when a parameter is not a string', (done) => {

            let error;
            try {
                Joi.object().with({});
                error = false;
            }
            catch (e) {
                error = true;
            }
            expect(error).to.equal(true);

            try {
                Joi.object().with(123);
                error = false;
            }
            catch (e) {
                error = true;
            }
            expect(error).to.equal(true);
            done();
        });

        it('should validate correctly when key is an empty string', (done) => {

            const schema = Joi.object().with('', 'b');
            Helper.validate(schema, [
                [{ c: 'hi', d: 'there' }, true]
            ]);
            done();
        });

        it('should apply labels', (done) => {

            const schema = Joi.object({
                a: Joi.number().label('first'),
                b: Joi.string().label('second')
            }).with('a', ['b']);
            const error = schema.validate({ a: 1 }).error;
            expect(error).to.be.an.error('"first" missing required peer "second"');
            expect(error.details).to.equal([{
                message: '"first" missing required peer "second"',
                path: ['a'],
                type: 'object.with',
                context: {
                    main: 'a',
                    mainWithLabel: 'first',
                    peer: 'b',
                    peerWithLabel: 'second',
                    label: 'a',
                    key: 'a'
                }
            }]);
            done();
        });
    });

    describe('without()', () => {

        it('should throw an error when a parameter is not a string', (done) => {

            let error;
            try {
                Joi.object().without({});
                error = false;
            }
            catch (e) {
                error = true;
            }
            expect(error).to.equal(true);

            try {
                Joi.object().without(123);
                error = false;
            }
            catch (e) {
                error = true;
            }
            expect(error).to.equal(true);


            done();
        });

        it('should validate correctly when key is an empty string', (done) => {

            const schema = Joi.object().without('', 'b');
            Helper.validate(schema, [
                [{ a: 'hi', b: 'there' }, true]
            ]);
            done();
        });

        it('should validate correctly when key is stripped', (done) => {

            const schema = Joi.object({
                a: Joi.any().strip(),
                b: Joi.any()
            }).without('a', 'b');
            Helper.validate(schema, [
                [{ a: 'hi', b: 'there' }, true]
            ]);
            done();
        });

        it('should apply labels', (done) => {

            const schema = Joi.object({
                a: Joi.number().label('first'),
                b: Joi.string().label('second')
            }).without('a', ['b']);
            const error = schema.validate({ a: 1, b: 'b' }).error;
            expect(error).to.be.an.error('"first" conflict with forbidden peer "second"');
            expect(error.details).to.equal([{
                message: '"first" conflict with forbidden peer "second"',
                path: ['a'],
                type: 'object.without',
                context: {
                    main: 'a',
                    mainWithLabel: 'first',
                    peer: 'b',
                    peerWithLabel: 'second',
                    label: 'a',
                    key: 'a'
                }
            }]);
            done();
        });
    });

    describe('xor()', () => {

        it('should throw an error when a parameter is not a string', (done) => {

            let error;
            try {
                Joi.object().xor({});
                error = false;
            }
            catch (e) {
                error = true;
            }
            expect(error).to.equal(true);

            try {
                Joi.object().xor(123);
                error = false;
            }
            catch (e) {
                error = true;
            }
            expect(error).to.equal(true);
            done();
        });

        it('should apply labels without any peer', (done) => {

            const schema = Joi.object({
                a: Joi.number().label('first'),
                b: Joi.string().label('second')
            }).xor('a', 'b');
            const error = schema.validate({}).error;
            expect(error).to.be.an.error('"value" must contain at least one of [first, second]');
            expect(error.details).to.equal([{
                message: '"value" must contain at least one of [first, second]',
                path: [],
                type: 'object.missing',
                context: {
                    peers: ['a', 'b'],
                    peersWithLabels: ['first', 'second'],
                    label: 'value',
                    key: undefined
                }
            }] );
            done();
        });

        it('should apply labels with too many peers', (done) => {

            const schema = Joi.object({
                a: Joi.number().label('first'),
                b: Joi.string().label('second')
            }).xor('a', 'b');
            const error = schema.validate({ a: 1, b: 'b' }).error;
            expect(error).to.be.an.error('"value" contains a conflict between exclusive peers [first, second]');
            expect(error.details).to.equal([{
                message: '"value" contains a conflict between exclusive peers [first, second]',
                path: [],
                type: 'object.xor',
                context: {
                    peers: ['a', 'b'],
                    peersWithLabels: ['first', 'second'],
                    label: 'value',
                    key: undefined
                }
            }]);
            done();
        });
    });

    describe('or()', () => {

        it('should throw an error when a parameter is not a string', (done) => {

            let error;
            try {
                Joi.object().or({});
                error = false;
            }
            catch (e) {
                error = true;
            }
            expect(error).to.equal(true);

            try {
                Joi.object().or(123);
                error = false;
            }
            catch (e) {
                error = true;
            }
            expect(error).to.equal(true);
            done();
        });

        it('errors multiple levels deep', (done) => {

            Joi.object({
                a: {
                    b: Joi.object().or('x', 'y')
                }
            }).validate({ a: { b: { c: 1 } } }, (err, value) => {

                expect(err).to.be.an.error('child "a" fails because [child "b" fails because ["value" must contain at least one of [x, y]]]');
                expect(err.details).to.equal([{
                    message: '"value" must contain at least one of [x, y]',
                    path: ['a', 'b'],
                    type: 'object.missing',
                    context: {
                        peers: ['x', 'y'],
                        peersWithLabels: ['x', 'y'],
                        label: 'value',
                        key: 'b'
                    }
                }]);
                done();
            });
        });

        it('should apply labels', (done) => {

            const schema = Joi.object({
                a: Joi.number().label('first'),
                b: Joi.string().label('second')
            }).or('a', 'b');
            const error = schema.validate({}).error;
            expect(error).to.be.an.error('"value" must contain at least one of [first, second]');
            expect(error.details).to.equal([{
                message: '"value" must contain at least one of [first, second]',
                path: [],
                type: 'object.missing',
                context:
                    {
                        peers: ['a', 'b'],
                        peersWithLabels: ['first', 'second'],
                        label: 'value',
                        key: undefined
                    }
            }]);
            done();
        });
    });

    describe('and()', () => {

        it('should apply labels', (done) => {

            const schema = Joi.object({
                a: Joi.number().label('first'),
                b: Joi.string().label('second')
            }).and('a', 'b');
            const error = schema.validate({ a: 1 }).error;
            expect(error).to.be.an.error('"value" contains [first] without its required peers [second]');
            expect(error.details).to.equal([{
                message: '"value" contains [first] without its required peers [second]',
                path: [],
                type: 'object.and',
                context:
                    {
                        present: ['a'],
                        presentWithLabels: ['first'],
                        missing: ['b'],
                        missingWithLabels: ['second'],
                        label: 'value',
                        key: undefined
                    }
            }]);
            done();
        });
    });

    describe('nand()', () => {

        it('should apply labels', (done) => {

            const schema = Joi.object({
                a: Joi.number().label('first'),
                b: Joi.string().label('second')
            }).nand('a', 'b');
            const error = schema.validate({ a: 1, b: 'b' }).error;
            expect(error).to.be.an.error('"first" must not exist simultaneously with [second]');
            expect(error.details).to.equal([{
                message: '"first" must not exist simultaneously with [second]',
                path: [],
                type: 'object.nand',
                context: {
                    main: 'a',
                    mainWithLabel: 'first',
                    peers: ['b'],
                    peersWithLabels: ['second'],
                    label: 'value',
                    key: undefined
                }
            }]);
            done();
        });
    });

    describe('assert()', () => {

        it('shows path to errors in schema', (done) => {

            expect(() => {

                Joi.object().assert('a.b', {
                    a: {
                        b: {
                            c: {
                                d: undefined
                            }
                        }
                    }
                });
            }).to.throw(Error, 'Invalid schema content: (a.b.c.d)');
            done();
        });

        it('shows errors in schema', (done) => {

            expect(() => {

                Joi.object().assert('a.b', undefined);
            }).to.throw(Error, 'Invalid schema content: ');
            done();
        });

        it('validates upwards reference', (done) => {

            const schema = Joi.object({
                a: {
                    b: Joi.string(),
                    c: Joi.number()
                },
                d: {
                    e: Joi.any()
                }
            }).assert(Joi.ref('d/e', { separator: '/' }), Joi.ref('a.c'), 'equal to a.c');

            schema.validate({ a: { b: 'x', c: 5 }, d: { e: 6 } }, (err, value) => {

                expect(err).to.exist();
                expect(err.message).to.equal('"d.e" validation failed because "d.e" failed to equal to a.c');

                Helper.validate(schema, [
                    [{ a: { b: 'x', c: 5 }, d: { e: 5 } }, true]
                ], done);
            });
        });

        it('validates upwards reference with implicit context', (done) => {

            const schema = Joi.object({
                a: {
                    b: Joi.string(),
                    c: Joi.number()
                },
                d: {
                    e: Joi.any()
                }
            }).assert('d.e', Joi.ref('a.c'), 'equal to a.c');

            schema.validate({ a: { b: 'x', c: 5 }, d: { e: 6 } }, (err, value) => {

                expect(err).to.be.an.error('"d.e" validation failed because "d.e" failed to equal to a.c');
                expect(err.details).to.equal([{
                    message: '"d.e" validation failed because "d.e" failed to equal to a.c',
                    path: ['d', 'e'],
                    type: 'object.assert',
                    context: { ref: 'd.e', message: 'equal to a.c', label: 'e', key: 'e' }
                }]);

                Helper.validate(schema, [
                    [{ a: { b: 'x', c: 5 }, d: { e: 5 } }, true]
                ], done);
            });
        });

        it('throws when context is at root level', (done) => {

            expect(() => {

                Joi.object({
                    a: {
                        b: Joi.string(),
                        c: Joi.number()
                    },
                    d: {
                        e: Joi.any()
                    }
                }).assert('a', Joi.ref('d.e'), 'equal to d.e');
            }).to.throw('Cannot use assertions for root level references - use direct key rules instead');
            done();
        });

        it('allows root level context ref', (done) => {

            expect(() => {

                Joi.object({
                    a: {
                        b: Joi.string(),
                        c: Joi.number()
                    },
                    d: {
                        e: Joi.any()
                    }
                }).assert('$a', Joi.ref('d.e'), 'equal to d.e');
            }).to.not.throw();
            done();
        });

        it('provides a default message for failed assertions', (done) => {

            const schema = Joi.object({
                a: {
                    b: Joi.string(),
                    c: Joi.number()
                },
                d: {
                    e: Joi.any()
                }
            }).assert('d.e', Joi.boolean());

            schema.validate({ d: { e: [] } }, (err) => {

                expect(err).to.be.an.error('"d.e" validation failed because "d.e" failed to pass the assertion test');
                expect(err.details).to.equal([{
                    message: '"d.e" validation failed because "d.e" failed to pass the assertion test',
                    path: ['d', 'e'],
                    type: 'object.assert',
                    context: {
                        ref: 'd.e',
                        message: 'pass the assertion test',
                        label: 'e',
                        key: 'e'
                    }
                }]);
                done();
            });
        });
    });

    describe('type()', () => {

        it('uses constructor name for default type name', (done) => {

            const Foo = function Foo() { };

            const schema = Joi.object().type(Foo);
            schema.validate({}, (err) => {

                expect(err).to.be.an.error('"value" must be an instance of "Foo"');
                expect(err.details).to.equal([{
                    message: '"value" must be an instance of "Foo"',
                    path: [],
                    type: 'object.type',
                    context: { type: 'Foo', label: 'value', key: undefined }
                }]);
                done();
            });
        });

        it('uses custom type name if supplied', (done) => {

            const Foo = function () { };

            const schema = Joi.object().type(Foo, 'Bar');
            schema.validate({}, (err) => {

                expect(err).to.be.an.error('"value" must be an instance of "Bar"');
                expect(err.details).to.equal([{
                    message: '"value" must be an instance of "Bar"',
                    path: [],
                    type: 'object.type',
                    context: { type: 'Bar', label: 'value', key: undefined }
                }]);
                done();
            });
        });

        it('overrides constructor name with custom name', (done) => {

            const Foo = function Foo() { };

            const schema = Joi.object().type(Foo, 'Bar');
            schema.validate({}, (err) => {

                expect(err).to.be.an.error('"value" must be an instance of "Bar"');
                expect(err.details).to.equal([{
                    message: '"value" must be an instance of "Bar"',
                    path: [],
                    type: 'object.type',
                    context: { type: 'Bar', label: 'value', key: undefined }
                }]);
                done();
            });
        });

        it('throws when constructor is not a function', (done) => {

            expect(() => {

                Joi.object().type('');
            }).to.throw('type must be a constructor function');
            done();
        });

        it('uses the constructor name in the schema description', (done) => {

            const description = Joi.object().type(RegExp).describe();

            expect(description.rules).to.include({ name: 'type', arg: { name: 'RegExp', ctor: RegExp } });
            done();
        });

        it('uses the constructor reference in the schema description', (done) => {

            const Foo = function Foo() { };
            const description = Joi.object().type(Foo).describe();

            expect(new Foo()).to.be.an.instanceof(description.rules[0].arg.ctor);
            done();
        });
    });

    describe('schema()', () => {

        it('should detect joi instances', (done) => {

            const schema = Joi.object().schema();
            Helper.validate(schema, [
                [{}, false, null, {
                    message: '"value" must be a Joi instance',
                    details: [{
                        message: '"value" must be a Joi instance',
                        path: [],
                        type: 'object.schema',
                        context: { label: 'value', key: undefined }
                    }]
                }],
                [{ isJoi: true }, false, null, {
                    message: '"value" must be a Joi instance',
                    details: [{
                        message: '"value" must be a Joi instance',
                        path: [],
                        type: 'object.schema',
                        context: { label: 'value', key: undefined }
                    }]
                }],
                [Joi.number().max(2), true]
            ], done);
        });

    });

    describe('ES6 Classes', () => {

        it('should differentiate between ES6 classes and functions', (done) => {

            const classSchema = Joi.object({
                _class: Joi.class()
            });

            const funcSchema = Joi.object({
                _func: Joi.func()
            });

            const testFunc = function () {};
            const testClass = class MyClass {};

            classSchema.validate({ _class: testFunc }, (err, value) => {

                expect(err).to.exist();
                expect(err.message).to.equal('child "_class" fails because ["_class" must be an ES6 class]');

                funcSchema.validate({ _func: testClass }, (err, _value) => {

                    expect(err).to.exist();
                    expect(err.message).to.equal('child "_func" fails because ["_func" must be a Function]');
                    done();
                });
            });
        });

        it('validates an ES6 class', (done) => {

            const schema = Joi.object({
                _class: Joi.class()
            });

            const testClass = class MyClass {};

            schema.validate({ _class: testClass }, (err, value) => {

                expect(err).to.not.exist();
                done();
            });
        });

        it('works with default', (done) => {

            const defaultClass = class MyClass {};
            const defaultClassInstance = new defaultClass();

            const schema = Joi.object({
                _class: Joi.class().default(defaultClass)
            });

            schema.validate({}, (err, value) => {

                expect(err).to.not.exist();

                expect(value._class.constructor).to.equal(defaultClass.constructor);

                const valueClassInstance = new value._class();

                expect(valueClassInstance.constructor.name).to.equal(defaultClassInstance.constructor.name);

                schema.validate({ _class: class NewClass {} }, (err, _value) => {

                    expect(err).to.not.exist();

                    const _valueClassInstance = new _value._class();

                    expect(_valueClassInstance.constructor.name).to.not.equal(defaultClassInstance.constructor.name);

                    done();
                });
            });
        });
    });

    describe('requiredKeys()', () => {

        it('should set keys as required', (done) => {

            const schema = Joi.object({ a: 0, b: 0, c: { d: 0, e: { f: 0 } }, g: { h: 0 } })
                .requiredKeys('a', 'b', 'c.d', 'c.e.f', 'g');
            Helper.validate(schema, [
                [{}, false, null, {
                    message: 'child "a" fails because ["a" is required]',
                    details: [{
                        message: '"a" is required',
                        path: ['a'],
                        type: 'any.required',
                        context: { label: 'a', key: 'a' }
                    }]
                }],
                [{ a: 0 }, false, null, {
                    message: 'child "b" fails because ["b" is required]',
                    details: [{
                        message: '"b" is required',
                        path: ['b'],
                        type: 'any.required',
                        context: { label: 'b', key: 'b' }
                    }]
                }],
                [{ a: 0, b: 0 }, false, null, {
                    message: 'child "g" fails because ["g" is required]',
                    details: [{
                        message: '"g" is required',
                        path: ['g'],
                        type: 'any.required',
                        context: { label: 'g', key: 'g' }
                    }]
                }],
                [{ a: 0, b: 0, g: {} }, true],
                [{ a: 0, b: 0, c: {}, g: {} }, false, null, {
                    message: 'child "c" fails because [child "d" fails because ["d" is required]]',
                    details: [{
                        message: '"d" is required',
                        path: ['c', 'd'],
                        type: 'any.required',
                        context: { label: 'd', key: 'd' }
                    }]
                }],
                [{ a: 0, b: 0, c: { d: 0 }, g: {} }, true],
                [{ a: 0, b: 0, c: { d: 0, e: {} }, g: {} }, false, null, {
                    message: 'child "c" fails because [child "e" fails because [child "f" fails because ["f" is required]]]',
                    details: [{
                        message: '"f" is required',
                        path: ['c', 'e', 'f'],
                        type: 'any.required',
                        context: { label: 'f', key: 'f' }
                    }]
                }],
                [{ a: 0, b: 0, c: { d: 0, e: { f: 0 } }, g: {} }, true]
            ], done);
        });

        it('should work on types other than objects', (done) => {

            const schemas = [Joi.array(), Joi.binary(), Joi.boolean(), Joi.date(), Joi.func(), Joi.class(), Joi.number(), Joi.string()];
            schemas.forEach((schema) => {

                expect(() => {

                    schema.applyFunctionToChildren([''], 'required');
                }).to.not.throw();

                expect(() => {

                    schema.applyFunctionToChildren(['', 'a'], 'required');
                }).to.throw();

                expect(() => {

                    schema.applyFunctionToChildren(['a'], 'required');
                }).to.throw();
            });

            done();
        });

        it('should throw on unknown key', (done) => {

            expect(() => {

                Joi.object({ a: 0, b: 0 }).requiredKeys('a', 'c', 'b', 'd', 'd.e.f');
            }).to.throw(Error, 'unknown key(s) c, d');

            expect(() => {

                Joi.object({ a: 0, b: 0 }).requiredKeys('a', 'b', 'a.c.d');
            }).to.throw(Error, 'unknown key(s) a.c.d');

            done();
        });

        it('should throw on empty object', (done) => {

            expect(() => {

                Joi.object().requiredKeys('a', 'c', 'b', 'd');
            }).to.throw(Error, 'unknown key(s) a, b, c, d');
            done();
        });

        it('should not modify original object', (done) => {

            const schema = Joi.object({ a: 0 });
            const requiredSchema = schema.requiredKeys('a');
            schema.validate({}, (err) => {

                expect(err).to.not.exist();

                requiredSchema.validate({}, (err) => {

                    expect(err).to.be.an.error('child "a" fails because ["a" is required]');
                    expect(err.details).to.equal([{
                        message: '"a" is required',
                        path: ['a'],
                        type: 'any.required',
                        context: { label: 'a', key: 'a' }
                    }]);
                    done();
                });
            });
        });
    });

    describe('optionalKeys()', () => {

        it('should set keys as optional', (done) => {

            const schema = Joi.object({ a: Joi.number().required(), b: Joi.number().required() }).optionalKeys('a', 'b');
            Helper.validate(schema, [
                [{}, true],
                [{ a: 0 }, true],
                [{ a: 0, b: 0 }, true]
            ], done);
        });
    });

    describe('forbiddenKeys()', () => {

        it('should set keys as forbidden', (done) => {

            const schema = Joi.object({ a: Joi.number().required(), b: Joi.number().required() }).forbiddenKeys('a', 'b');
            Helper.validate(schema, [
                [{}, true],
                [{ a: undefined }, true],
                [{ a: undefined, b: undefined }, true],
                [{ a: 0 }, false, null, {
                    message: 'child "a" fails because ["a" is not allowed]',
                    details: [{
                        message: '"a" is not allowed',
                        path: ['a'],
                        type: 'any.unknown',
                        context: { label: 'a', key: 'a' }
                    }]
                }],
                [{ b: 0 }, false, null, {
                    message: 'child "b" fails because ["b" is not allowed]',
                    details: [{
                        message: '"b" is not allowed',
                        path: ['b'],
                        type: 'any.unknown',
                        context: { label: 'b', key: 'b' }
                    }]
                }]
            ], done);
        });
    });
});
