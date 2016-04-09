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


describe('Joi', () => {

    it('validates object', (done) => {

        const schema = Joi.object({
            a: Joi.number().min(0).max(3),
            b: Joi.string().valid('a', 'b', 'c'),
            c: Joi.string().email().optional()
        }).without('a', 'none');

        const obj = {
            a: 1,
            b: 'a',
            c: 'joe@example.com'
        };

        schema.validate(obj, (err, value) => {

            expect(err).to.not.exist();
            done();
        });
    });

    it('keeps schema immutable', (done) => {

        const a = Joi.string();
        const b = a.valid('b');

        Helper.validate(a, [
            ['a', true],
            ['b', true],
            [5, false]
        ], () => {

            Helper.validate(b, [
                ['a', false],
                ['b', true],
                [5, false]
            ], done);
        });

    });

    it('validates null', (done) => {

        Joi.string().validate(null, (err, value) => {

            expect(err).to.exist();
            expect(err.annotate()).to.equal('{\n  \u001b[41m\"value\"\u001b[0m\u001b[31m [1]: -- missing --\u001b[0m\n}\n\u001b[31m\n[1] "value" must be a string\u001b[0m');
            done();
        });
    });

    it('validates null schema', (done) => {

        Helper.validate(null, [
            ['a', false],
            [null, true]
        ], done);
    });

    it('validates number literal', (done) => {

        Helper.validate(5, [
            [6, false],
            [5, true]
        ], done);
    });

    it('validates string literal', (done) => {

        Helper.validate('5', [
            ['6', false],
            ['5', true]
        ], done);
    });

    it('validates boolean literal', (done) => {

        Helper.validate(true, [
            [false, false],
            [true, true]
        ], done);
    });

    it('validates date literal', (done) => {

        const now = Date.now();
        Helper.validate(new Date(now), [
            [new Date(now), true],
            [now, true],
            [now * 2, false]
        ], done);
    });

    it('validates complex literal', (done) => {

        const schema = ['key', 5, { a: true, b: [/^a/, 'boom'] }];
        Helper.validate(schema, [
            ['key', true],
            [5, true],
            ['other', false],
            [6, false],
            [{ c: 5 }, false],
            [{}, true],
            [{ b: 'abc' }, true],
            [{ a: true, b: 'boom' }, true],
            [{ a: 5, b: 'a' }, false]
        ], done);
    });

    it('validates a compiled complex literal', (done) => {

        const schema = Joi.compile(['key', 5, { a: true, b: [/^a/, 'boom'] }]);
        Helper.validate(schema, [
            ['key', true],
            [5, true],
            ['other', false],
            [6, false],
            [{ c: 5 }, false],
            [{}, true],
            [{ b: 'abc' }, true],
            [{ a: true, b: 'boom' }, true],
            [{ a: 5, b: 'a' }, false]
        ], done);
    });

    it('validates regex directly', (done) => {

        Joi.compile(/^5$/).validate('5', (err, value) => {

            expect(err).to.not.exist();
            Joi.compile(/.{2}/).validate('6', (err2, value2) => {

                expect(err2).to.exist();
                done();
            });
        });
    });

    it('validated with', (done) => {

        const schema = Joi.object({
            txt: Joi.string(),
            upc: Joi.string()
        }).with('txt', 'upc');

        Joi.validate({ txt: 'a' }, schema, { abortEarly: false }, (err, value) => {

            expect(err.message).to.equal('"txt" missing required peer "upc"');

            Helper.validate(schema, [
                [{ upc: 'test' }, true],
                [{ txt: 'test' }, false],
                [{ txt: 'test', upc: null }, false],
                [{ txt: 'test', upc: '' }, false],
                [{ txt: 'test', upc: undefined }, false],
                [{ txt: 'test', upc: 'test' }, true]
            ], done);
        });
    });

    it('validated without', (done) => {

        const schema = Joi.object({
            txt: Joi.string(),
            upc: Joi.string()
        }).without('txt', 'upc');

        Joi.validate({ txt: 'a', upc: 'b' }, schema, { abortEarly: false }, (err, value) => {

            expect(err.message).to.equal('"txt" conflict with forbidden peer "upc"');

            Helper.validate(schema, [
                [{ upc: 'test' }, true],
                [{ txt: 'test' }, true],
                [{ txt: 'test', upc: null }, false],
                [{ txt: 'test', upc: '' }, false],
                [{ txt: 'test', upc: undefined }, true],
                [{ txt: 'test', upc: 'test' }, false]
            ], done);
        });
    });

    it('validates xor', (done) => {

        const schema = Joi.object({
            txt: Joi.string(),
            upc: Joi.string()
        }).xor('txt', 'upc');

        Joi.validate({}, schema, { abortEarly: false }, (err, value) => {

            expect(err.message).to.equal('"value" must contain at least one of [txt, upc]');

            Helper.validate(schema, [
                [{ upc: null }, false],
                [{ upc: 'test' }, true],
                [{ txt: null }, false],
                [{ txt: 'test' }, true],
                [{ txt: 'test', upc: null }, false],
                [{ txt: 'test', upc: '' }, false],
                [{ txt: '', upc: 'test' }, false],
                [{ txt: null, upc: 'test' }, false],
                [{ txt: undefined, upc: 'test' }, true],
                [{ txt: 'test', upc: undefined }, true],
                [{ txt: 'test', upc: '' }, false],
                [{ txt: 'test', upc: null }, false],
                [{ txt: '', upc: undefined }, false],
                [{ txt: '', upc: '' }, false],
                [{ txt: 'test', upc: 'test' }, false]
            ], done);
        });
    });

    it('validates multiple peers xor', (done) => {

        const schema = Joi.object({
            txt: Joi.string(),
            upc: Joi.string(),
            code: Joi.string()
        }).xor('txt', 'upc', 'code');

        Helper.validate(schema, [
            [{ upc: 'test' }, true],
            [{ txt: 'test' }, true],
            [{}, false]
        ], done);
    });

    it('validates xor with number types', (done) => {

        const schema = Joi.object({
            code: Joi.number(),
            upc: Joi.number()
        }).xor('code', 'upc');

        Helper.validate(schema, [
            [{ upc: 123 }, true],
            [{ code: 456 }, true],
            [{ code: 456, upc: 123 }, false],
            [{}, false]
        ], done);
    });

    it('validates xor when empty value of peer allowed', (done) => {

        const schema = Joi.object({
            code: Joi.string(),
            upc: Joi.string().allow('')
        }).xor('code', 'upc');

        Helper.validate(schema, [
            [{ upc: '' }, true],
            [{ upc: '123' }, true],
            [{ code: '456' }, true],
            [{ code: '456', upc: '' }, false],
            [{}, false]
        ], done);
    });

    it('validates or', (done) => {

        const schema = Joi.object({
            txt: Joi.string(),
            upc: Joi.string().allow(null, ''),
            code: Joi.number()
        }).or('txt', 'upc', 'code');

        Joi.validate({}, schema, { abortEarly: false }, (err, value) => {

            expect(err.message).to.equal('"value" must contain at least one of [txt, upc, code]');

            Helper.validate(schema, [
                [{ upc: null }, true],
                [{ upc: 'test' }, true],
                [{ txt: null }, false],
                [{ txt: 'test' }, true],
                [{ code: null }, false],
                [{ code: 123 }, true],
                [{ txt: 'test', upc: null }, true],
                [{ txt: 'test', upc: '' }, true],
                [{ txt: '', upc: 'test' }, false],
                [{ txt: null, upc: 'test' }, false],
                [{ txt: undefined, upc: 'test' }, true],
                [{ txt: 'test', upc: undefined }, true],
                [{ txt: 'test', upc: '' }, true],
                [{ txt: 'test', upc: null }, true],
                [{ txt: '', upc: undefined }, false],
                [{ txt: '', upc: undefined, code: 999 }, false],
                [{ txt: '', upc: undefined, code: undefined }, false],
                [{ txt: '', upc: '' }, false],
                [{ txt: 'test', upc: 'test' }, true],
                [{ txt: 'test', upc: 'test', code: 322 }, true]
            ], done);
        });
    });

    it('validates and', (done) => {

        const schema = Joi.object({
            txt: Joi.string(),
            upc: Joi.string().allow(null, ''),
            code: Joi.number()
        }).and('txt', 'upc', 'code');

        Joi.validate({ txt: 'x' }, schema, { abortEarly: false }, (err, value) => {

            expect(err.message).to.equal('"value" contains [txt] without its required peers [upc, code]');

            Helper.validate(schema, [
                [{}, true],
                [{ upc: null }, false],
                [{ upc: 'test' }, false],
                [{ txt: null }, false],
                [{ txt: 'test' }, false],
                [{ code: null }, false],
                [{ code: 123 }, false],
                [{ txt: 'test', upc: null }, false],
                [{ txt: 'test', upc: '' }, false],
                [{ txt: '', upc: 'test' }, false],
                [{ txt: null, upc: 'test' }, false],
                [{ txt: undefined, upc: 'test' }, false],
                [{ txt: 'test', upc: undefined }, false],
                [{ txt: 'test', upc: '' }, false],
                [{ txt: 'test', upc: null }, false],
                [{ txt: '', upc: undefined }, false],
                [{ txt: '', upc: undefined, code: 999 }, false],
                [{ txt: '', upc: undefined, code: undefined }, false],
                [{ txt: '', upc: '' }, false],
                [{ txt: 'test', upc: 'test' }, false],
                [{ txt: 'test', upc: 'test', code: 322 }, true],
                [{ txt: 'test', upc: null, code: 322 }, true]
            ], done);
        });
    });

    it('validates nand()', (done) => {

        const schema = Joi.object({
            txt: Joi.string(),
            upc: Joi.string().allow(null, ''),
            code: Joi.number()
        }).nand('txt', 'upc', 'code');

        Joi.validate({ txt: 'x', upc: 'y', code: 123 }, schema, { abortEarly: false }, (err, value) => {

            expect(err.message).to.equal('"txt" must not exist simultaneously with [upc, code]');

            Helper.validate(schema, [
                [{}, true],
                [{ upc: null }, true],
                [{ upc: 'test' }, true],
                [{ txt: 'test' }, true],
                [{ code: 123 }, true],
                [{ txt: 'test', upc: null }, true],
                [{ txt: 'test', upc: '' }, true],
                [{ txt: undefined, upc: 'test' }, true],
                [{ txt: 'test', upc: undefined }, true],
                [{ txt: 'test', upc: '' }, true],
                [{ txt: 'test', upc: null }, true],
                [{ txt: 'test', upc: undefined, code: 999 }, true],
                [{ txt: 'test', upc: 'test' }, true],
                [{ txt: 'test', upc: 'test', code: 322 }, false],
                [{ txt: 'test', upc: null, code: 322 }, false]
            ], done);
        });
    });

    it('validates an array of valid types', (done) => {

        const schema = Joi.object({
            auth: [
                Joi.object({
                    mode: Joi.string().valid('required', 'optional', 'try').allow(null)
                }).allow(null),
                Joi.string(),
                Joi.boolean()
            ]
        });

        schema.validate({ auth: { mode: 'none' } }, (err, value) => {

            expect(err).to.exist();
            expect(err.message).to.equal('child "auth" fails because [child "mode" fails because ["mode" must be one of [required, optional, try, null]], "auth" must be a string, "auth" must be a boolean]');

            Helper.validate(schema, [
                [{ auth: { mode: 'try' } }, true],
                [{ something: undefined }, false],
                [{ auth: { something: undefined } }, false],
                [{ auth: null }, true],
                [{ auth: undefined }, true],
                [{}, true],
                [{ auth: true }, true],
                [{ auth: 123 }, false]
            ], done);
        });
    });

    it('validates alternatives', (done) => {

        const schema = Joi.object({
            auth: Joi.alternatives(
                Joi.object({
                    mode: Joi.string().valid('required', 'optional', 'try').allow(null)
                }).allow(null),
                Joi.string(),
                Joi.boolean()
            )
        });

        schema.validate({ auth: { mode: 'none' } }, (err, value) => {

            expect(err).to.exist();
            expect(err.message).to.equal('child "auth" fails because [child "mode" fails because ["mode" must be one of [required, optional, try, null]], "auth" must be a string, "auth" must be a boolean]');

            Helper.validate(schema, [
                [{ auth: { mode: 'try' } }, true],
                [{ something: undefined }, false],
                [{ auth: { something: undefined } }, false],
                [{ auth: null }, true],
                [{ auth: undefined }, true],
                [{}, true],
                [{ auth: true }, true],
                [{ auth: 123 }, false]
            ], done);
        });
    });

    it('validates required alternatives', (done) => {

        const schema = {
            a: Joi.alternatives(
                Joi.string().required(),
                Joi.boolean().required()
            )
        };

        Helper.validate(schema, [
            [{ a: null }, false],
            [{ a: undefined }, true],
            [{}, true],
            [{ a: true }, true],
            [{ a: 'true' }, true],
            [{ a: 123 }, false],
            [{ a: { c: 1 } }, false],
            [{ b: undefined }, false]
        ], done);
    });

    it('validates required [] alternatives', (done) => {

        const schema = {
            a: [
                Joi.string().required(),
                Joi.boolean().required()
            ]
        };

        Helper.validate(schema, [
            [{ a: null }, false],
            [{ a: undefined }, true],
            [{}, true],
            [{ a: true }, true],
            [{ a: 'true' }, true],
            [{ a: 123 }, false],
            [{ a: { c: 1 } }, false],
            [{ b: undefined }, false]
        ], done);
    });

    it('validates an array of string with valid', (done) => {

        const schema = {
            brand: Joi.array().items(Joi.string().valid('amex', 'visa'))
        };

        Helper.validate(schema, [
            [{ brand: ['amex'] }, true],
            [{ brand: ['visa', 'mc'] }, false]
        ], done);
    });

    it('validates pre and post convert value', (done) => {

        const schema = Joi.number().valid(5);

        Helper.validate(schema, [
            [5, true],
            ['5', true]
        ], done);
    });

    it('does not change object when validation fails', (done) => {

        const schema = Joi.object({
            a: Joi.number().valid(2)
        });

        const obj = {
            a: '5'
        };

        schema.validate(obj, (err, value) => {

            expect(err).to.exist();
            expect(value.a).to.equal('5');
            done();
        });
    });

    it('does not set optional keys when missing', (done) => {

        const schema = Joi.object({
            a: Joi.number()
        });

        const obj = {};

        schema.validate(obj, (err, value) => {

            expect(err).to.not.exist();
            expect(value.hasOwnProperty('a')).to.equal(false);
            done();
        });
    });

    it('invalidates pre and post convert value', (done) => {

        const schema = Joi.number().invalid(5);

        Helper.validate(schema, [
            [5, false],
            ['5', false]
        ], done);
    });

    it('invalidates missing peers', (done) => {

        const schema = Joi.object({
            username: Joi.string(),
            password: Joi.string()
        }).with('username', 'password').without('password', 'access_token');

        schema.validate({ username: 'bob' }, (err, value) => {

            expect(err).to.exist();
            done();
        });
    });

    it('validates config where the root item is a joi type', (done) => {

        Joi.boolean().allow(null).validate(true, (err, value) => {

            expect(err).to.be.null();
            Joi.object().validate({ auth: { mode: 'try' } }, (err2, value2) => {

                expect(err2).to.be.null();

                Joi.object().validate(true, (err3, value3) => {

                    expect(err3.message).to.contain('"value" must be an object');

                    Joi.string().validate(true, (err4, value4) => {

                        expect(err4.message).to.contain('"value" must be a string');

                        Joi.string().email().validate('test@test.com', (err5, value5) => {

                            expect(err5).to.be.null();
                            Joi.object({ param: Joi.string().required() }).validate({ param: 'item' }, (err6, value6) => {

                                expect(err6).to.be.null();
                                done();
                            });
                        });
                    });
                });
            });
        });
    });

    it('converts string to number', (done) => {

        const schema = Joi.object({
            a: Joi.number()
        });

        const input = { a: '5' };
        schema.validate(input, (err, value) => {

            expect(err).to.be.null();
            expect(value.a).to.equal(5);
            expect(input.a).to.equal('5');
            done();
        });
    });

    it('allows unknown keys in objects if no schema was given', (done) => {

        Joi.object().validate({ foo: 'bar' }, (err, value) => {

            expect(err).to.not.exist();
            done();
        });
    });

    it('fails on unknown keys in objects if a schema was given', (done) => {

        Joi.object({}).validate({ foo: 'bar' }, (err, value) => {

            expect(err).to.exist();
            expect(err.message).to.equal('"foo" is not allowed');

            Joi.compile({}).validate({ foo: 'bar' }, (err2, value2) => {

                expect(err2).to.exist();
                expect(err2.message).to.equal('"foo" is not allowed');

                Joi.compile({ other: Joi.number() }).validate({ foo: 'bar' }, (err3, value3) => {

                    expect(err3).to.exist();
                    expect(err3.message).to.equal('"foo" is not allowed');

                    done();
                });
            });
        });
    });

    it('validates an unknown option', (done) => {

        const config = {
            auth: Joi.object({
                mode: Joi.string().valid('required', 'optional', 'try').allow(null)
            }).allow(null)
        };

        Joi.compile(config).validate({ auth: { unknown: true } }, (err, value) => {

            expect(err).to.not.be.null();
            expect(err.message).to.contain('"unknown" is not allowed');

            Joi.compile(config).validate({ something: false }, (err2, value2) => {

                expect(err2).to.not.be.null();
                expect(err2.message).to.contain('"something" is not allowed');

                done();
            });
        });
    });

    it('validates required key with multiple options', (done) => {

        const config = {
            module: Joi.alternatives([
                Joi.object({
                    compile: Joi.func().required(),
                    execute: Joi.func()
                }),
                Joi.string()
            ]).required()
        };

        Joi.compile(config).validate({}, (err, value) => {

            expect(err).to.exist();
            expect(err.message).to.contain('"module" is required');

            Joi.compile(config).validate({ module: 'test' }, (err2, value2) => {

                expect(err2).to.be.null();

                Joi.compile(config).validate({ module: {} }, (err3, value3) => {

                    expect(err3).to.not.be.null();
                    expect(err3.message).to.contain('"compile" is required');
                    expect(err3.message).to.contain('"module" must be a string');

                    Joi.compile(config).validate({ module: { compile: function () { } } }, (err4, value4) => {

                        expect(err4).to.be.null();
                        done();
                    });
                });
            });
        });
    });

    it('validates key with required alternatives', (done) => {

        const config = {
            module: Joi.alt().try(
                Joi.object({
                    compile: Joi.func().required(),
                    execute: Joi.func()
                }).required(),
                Joi.string().required()
            )
        };

        Joi.compile(config).validate({}, (err, value) => {

            expect(err).to.not.exist();
            done();
        });
    });

    it('validates required key with alternatives', (done) => {

        const config = {
            module: Joi.alt().try(
                Joi.object({
                    compile: Joi.func().required(),
                    execute: Joi.func()
                }),
                Joi.string()
            ).required()
        };

        Joi.compile(config).validate({}, (err, value) => {

            expect(err).to.exist();
            expect(err.message).to.contain('"module" is required');
            done();
        });
    });

    it('does not require optional numbers', (done) => {

        const config = {
            position: Joi.number(),
            suggestion: Joi.string()
        };

        Joi.compile(config).validate({ suggestion: 'something' }, (err, value) => {

            expect(err).to.be.null();

            Joi.compile(config).validate({ position: 1 }, (err2, value2) => {

                expect(err2).to.be.null();
                done();
            });
        });
    });

    it('does not require optional objects', (done) => {

        const config = {
            position: Joi.number(),
            suggestion: Joi.object()
        };

        Joi.compile(config).validate({ suggestion: {} }, (err, value) => {

            expect(err).to.be.null();

            Joi.compile(config).validate({ position: 1 }, (err2, value2) => {

                expect(err2).to.be.null();
                done();
            });
        });
    });

    it('validates object successfully when config has an array of types', (done) => {

        const schema = {
            f: [Joi.number(), Joi.boolean()],
            g: [Joi.string(), Joi.object()]
        };

        const obj = {
            f: true,
            g: 'test'
        };

        Joi.compile(schema).validate(obj, (err, value) => {

            expect(err).to.not.exist();
            done();
        });
    });

    it('validates object successfully when config allows for optional key and key is missing', (done) => {

        const schema = {
            h: Joi.number(),
            i: Joi.string(),
            j: Joi.object()
        };

        const obj = {
            h: 12,
            i: 'test'
        };

        Joi.compile(schema).validate(obj, (err, value) => {

            expect(err).to.not.exist();
            done();
        });
    });

    it('fails validation', (done) => {

        const schema = {
            a: Joi.number().min(0).max(3),
            b: Joi.string().valid('a', 'b', 'c'),
            c: Joi.string().email().optional()
        };

        const obj = {
            a: 10,
            b: 'a',
            c: 'joe@example.com'
        };

        Joi.compile(schema).validate(obj, (err, value) => {

            expect(err).to.exist();
            done();
        });
    });

    it('fails validation when the wrong types are supplied', (done) => {

        const schema = {
            a: Joi.number().min(0).max(3),
            b: Joi.string().valid('a', 'b', 'c'),
            c: Joi.string().email().optional()
        };

        const obj = {
            a: 'a',
            b: 'a',
            c: 'joe@example.com'
        };

        Joi.compile(schema).validate(obj, (err, value) => {

            expect(err).to.exist();
            done();
        });
    });

    it('fails validation when missing a required parameter', (done) => {

        const obj = {
            c: 10
        };

        Joi.compile({ a: Joi.string().required() }).validate(obj, (err, value) => {

            expect(err).to.exist();
            done();
        });
    });

    it('fails validation when missing a required parameter within an object config', (done) => {

        const obj = {
            a: {}
        };

        Joi.compile({ a: Joi.object({ b: Joi.string().required() }) }).validate(obj, (err, value) => {

            expect(err).to.exist();
            done();
        });
    });

    it('fails validation when parameter is required to be an object but is given as string', (done) => {

        const obj = {
            a: 'a string'
        };

        Joi.compile({ a: Joi.object({ b: Joi.string().required() }) }).validate(obj, (err, value) => {

            expect(err).to.exist();
            done();
        });
    });

    it('validates when parameter is required to be an object and is given correctly as a json string', (done) => {

        const schema = {
            a: Joi.object({
                b: Joi.string().required()
            })
        };

        const input = {
            a: '{"b":"string"}'
        };

        Joi.validate(input, schema, (err, value) => {

            expect(err).to.not.exist();
            expect(input.a).to.equal('{"b":"string"}');
            expect(value.a.b).to.equal('string');
            done();
        });
    });

    it('fails validation when parameter is required to be an object but is given as a json string that is incorrect (number instead of string)', (done) => {

        const obj = {
            a: '{"b":2}'
        };

        Joi.object({ a: Joi.object({ b: Joi.string().required() }) }).validate(obj, (err, value) => {

            expect(err).to.exist();
            done();
        });
    });

    it('fails validation when parameter is required to be an Array but is given as string', (done) => {

        const obj = {
            a: 'an array'
        };

        Joi.object({ a: Joi.array() }).validate(obj, (err, value) => {

            expect(err).to.exist();
            done();
        });
    });

    it('validates when parameter is required to be an Array and is given correctly as a json string', (done) => {

        const obj = {
            a: '[1,2]'
        };

        Joi.object({ a: Joi.array() }).validate(obj, (err, value) => {

            expect(err).to.be.null();
            done();
        });
    });

    it('fails validation when parameter is required to be an Array but is given as a json that is incorrect (object instead of array)', (done) => {

        const obj = {
            a: '{"b":2}'
        };

        Joi.object({ a: Joi.object({ b: Joi.string().required() }) }).validate(obj, (err, value) => {

            expect(err).to.exist();
            done();
        });
    });

    it('fails validation when config is an array and fails', (done) => {

        const schema = {
            d: [Joi.string(), Joi.boolean()],
            e: [Joi.number(), Joi.object()]
        };

        const obj = {
            d: 10,
            e: 'a'
        };

        Joi.compile(schema).validate(obj, (err, value) => {

            expect(err).to.exist();
            done();
        });
    });

    it('fails validation when config is an array and fails with extra keys', (done) => {

        const schema = {
            d: [Joi.string(), Joi.boolean()],
            e: [Joi.number(), Joi.object()]
        };

        const obj = {
            a: 10,
            b: 'a'
        };

        Joi.compile(schema).validate(obj, (err, value) => {

            expect(err).to.exist();
            done();
        });
    });

    it('fails validation with extra keys', (done) => {

        const schema = {
            a: Joi.number()
        };

        const obj = {
            a: 1,
            b: 'a'
        };

        Joi.compile(schema).validate(obj, (err, value) => {

            expect(err).to.exist();
            done();
        });
    });

    it('validates missing optional key with string condition', (done) => {

        const schema = {
            key: Joi.string().alphanum(false).min(8)
        };

        Joi.compile(schema).validate({}, (err, value) => {

            expect(err).to.not.exist();
            done();
        });
    });

    it('validates with extra keys and remove them when stripUnknown is set', (done) => {

        const schema = {
            a: Joi.number().min(0).max(3),
            b: Joi.string().valid('a', 'b', 'c'),
            c: Joi.string().email().optional()
        };

        const obj = {
            a: 1,
            b: 'a',
            d: 'c'
        };

        Joi.validate(obj, schema, { stripUnknown: true, allowUnknown: true }, (err, value) => {

            expect(err).to.be.null();
            expect(value).to.deep.equal({ a: 1, b: 'a' });
            done();
        });
    });

    it('validates dependencies when stripUnknown is set', (done) => {

        const schema = Joi.object({
            a: Joi.number(),
            b: Joi.string()
        }).and('a', 'b');

        const obj = {
            a: 1,
            foo: 'bar'
        };

        Joi.validate(obj, schema, { stripUnknown: true }, (err, value) => {

            expect(err).to.exist();
            expect(err.message).to.equal('"value" contains [a] without its required peers [b]');
            done();
        });
    });

    it('fails to validate with incorrect property when asked to strip unkown keys without aborting early', (done) => {

        const schema = {
            a: Joi.number().min(0).max(3),
            b: Joi.string().valid('a', 'b', 'c'),
            c: Joi.string().email().optional()
        };

        const obj = {
            a: 1,
            b: 'f',
            d: 'c'
        };

        Joi.validate(obj, schema, { stripUnknown: true, abortEarly: false }, (err, value) => {

            expect(err).to.exist();
            done();
        });
    });

    it('should pass validation with extra keys when allowUnknown is set', (done) => {

        const schema = {
            a: Joi.number().min(0).max(3),
            b: Joi.string().valid('a', 'b', 'c'),
            c: Joi.string().email().optional()
        };

        const obj = {
            a: 1,
            b: 'a',
            d: 'c'
        };

        Joi.validate(obj, schema, { allowUnknown: true }, (err, value) => {

            expect(err).to.be.null();
            expect(value).to.deep.equal({ a: 1, b: 'a', d: 'c' });
            done();
        });
    });

    it('should pass validation with extra keys set', (done) => {

        const localConfig = Joi.object({
            a: Joi.number().min(0).max(3),
            b: Joi.string().valid('a', 'b', 'c')
        }).options({ allowUnknown: true });

        const obj = {
            a: 1,
            b: 'a',
            d: 'c'
        };

        localConfig.validate(obj, (err, value) => {

            expect(err).to.be.null();
            expect(value).to.deep.equal({ a: 1, b: 'a', d: 'c' });

            localConfig.validate(value, (err2, value2) => {

                expect(err2).to.be.null();
                expect(value2).to.deep.equal({ a: 1, b: 'a', d: 'c' });
                done();
            });
        });
    });

    it('should pass validation with extra keys and remove them when skipExtraKeys is set locally', (done) => {

        const localConfig = Joi.object({
            a: Joi.number().min(0).max(3),
            b: Joi.string().valid('a', 'b', 'c')
        }).options({ stripUnknown: true, allowUnknown: true });

        const obj = {
            a: 1,
            b: 'a',
            d: 'c'
        };

        localConfig.validate(obj, (err, value) => {

            expect(err).to.be.null();
            expect(value).to.deep.equal({ a: 1, b: 'a' });

            localConfig.validate(value, (err2, value2) => {

                expect(err2).to.be.null();
                expect(value2).to.deep.equal({ a: 1, b: 'a' });
                done();
            });
        });
    });

    it('should work when the skipFunctions setting is enabled', (done) => {

        const schema = Joi.object({ username: Joi.string() }).options({ skipFunctions: true });
        const input = { username: 'test', func: function () { } };
        Joi.validate(input, schema, (err, value) => {

            expect(err).to.not.exist();
            done();
        });
    });

    it('should work when the skipFunctions setting is disabled', (done) => {

        const schema = { username: Joi.string() };
        const input = { username: 'test', func: function () { } };

        Joi.validate(input, schema, { skipFunctions: false }, (err, value) => {

            expect(err).to.exist();
            expect(err.message).to.contain('"func" is not allowed');
            done();
        });
    });

    it('should not convert values when convert is false', (done) => {

        const schema = {
            arr: Joi.array().items(Joi.string())
        };

        const input = { arr: 'foo' };
        Joi.validate(input, schema, { convert: false }, (err, value) => {

            expect(err).to.exist();
            done();
        });
    });

    it('full errors when abortEarly is false', (done) => {

        const schema = {
            a: Joi.string(),
            b: Joi.string()
        };

        const input = { a: 1, b: 2 };

        Joi.validate(input, schema, (errOne, valueOne) => {

            Joi.validate(input, schema, { abortEarly: false }, (errFull, valueFull) => {

                expect(errOne).to.exist();
                expect(errFull).to.exist();
                expect(errFull.details.length).to.be.greaterThan(errOne.details.length);
                done();
            });
        });
    });

    it('errors multiple times when abortEarly is false in a complex object', (done) => {

        const schema = Joi.object({
            test: Joi.array().items(Joi.object().keys({
                foo: Joi.string().required().max(3),
                bar: Joi.string().max(5)
            })),
            test2: Joi.object({
                test3: Joi.array().items(Joi.object().keys({
                    foo: Joi.string().required().max(3),
                    bar: Joi.string().max(5),
                    baz: Joi.object({
                        test4: Joi.array().items(Joi.object().keys({
                            foo: Joi.string().required().max(3),
                            bar: Joi.string().max(5)
                        }))
                    })
                }))
            })
        });

        const input = {
            test: [{
                foo: 'test1',
                bar: 'testfailed'
            }],
            test2: {
                test3: [{
                    foo: '123'
                }, {
                    foo: 'test1',
                    bar: 'testfailed'
                }, {
                    foo: '123',
                    baz: {
                        test4: [{
                            foo: 'test1',
                            baz: '123'
                        }]
                    }
                }]
            }
        };

        Joi.validate(input, schema, { abortEarly: false }, (err, value) => {

            expect(err).to.exist();
            expect(err.details).to.have.length(6);
            expect(err.details).to.deep.equal([{
                message: '"foo" length must be less than or equal to 3 characters long',
                path: 'test.0.foo',
                type: 'string.max',
                context: { limit: 3, value: 'test1', key: 'foo', encoding: undefined }
            }, {
                message: '"bar" length must be less than or equal to 5 characters long',
                path: 'test.0.bar',
                type: 'string.max',
                context: { limit: 5, value: 'testfailed', key: 'bar', encoding: undefined }
            }, {
                message: '"foo" length must be less than or equal to 3 characters long',
                path: 'test2.test3.1.foo',
                type: 'string.max',
                context: { limit: 3, value: 'test1', key: 'foo', encoding: undefined }
            }, {
                message: '"bar" length must be less than or equal to 5 characters long',
                path: 'test2.test3.1.bar',
                type: 'string.max',
                context: { limit: 5, value: 'testfailed', key: 'bar', encoding: undefined }
            }, {
                message: '"foo" length must be less than or equal to 3 characters long',
                path: 'test2.test3.2.baz.test4.0.foo',
                type: 'string.max',
                context: { limit: 3, value: 'test1', key: 'foo', encoding: undefined }
            }, {
                message: '"baz" is not allowed',
                path: 'test2.test3.2.baz.test4.0.baz',
                type: 'object.allowUnknown',
                context: { key: 'baz' }
            }]);
            done();
        });
    });

    it('validates using the root any object', (done) => {

        const any = Joi;
        any.validate('abc', (err, value) => {

            expect(err).to.not.exist();
            done();
        });
    });

    it('validates using the root any object (no callback)', (done) => {

        const any = Joi;
        const result = any.validate('abc');
        expect(result.error).to.not.exist();
        expect(result.value).to.equal('abc');
        done();
    });

    it('accepts no options', (done) => {

        Joi.validate('test', Joi.string(), (err, value) => {

            expect(err).to.not.exist();
            done();
        });
    });

    it('accepts no options (no callback)', (done) => {

        const result = Joi.validate('test', Joi.string());
        expect(result.error).to.not.exist();
        expect(result.value).to.equal('test');
        done();
    });

    it('accepts options', (done) => {

        Joi.validate('5', Joi.number(), { convert: false }, (err, value) => {

            expect(err).to.exist();
            done();
        });
    });

    it('accepts options (no callback)', (done) => {

        const result = Joi.validate('5', Joi.number(), { convert: false });
        expect(result.error).to.exist();
        done();
    });

    it('accepts null options', (done) => {

        Joi.validate('test', Joi.string(), null, (err, value) => {

            expect(err).to.not.exist();
            done();
        });
    });

    it('accepts undefined options', (done) => {

        Joi.validate('test', Joi.string(), undefined, (err, value) => {

            expect(err).to.not.exist();
            done();
        });
    });

    describe('describe()', () => {

        const defaultFn = function () {

            return 'test';
        };
        defaultFn.description = 'testing';

        const defaultDescribedFn = function () {

            return 'test';
        };

        const defaultRef = Joi.ref('xor');

        const schema = Joi.object({
            sub: {
                email: Joi.string().email(),
                date: Joi.date(),
                child: Joi.object({
                    alphanum: Joi.string().alphanum()
                })
            },
            min: [Joi.number(), Joi.string().min(3)],
            max: Joi.string().max(3).default(0),
            required: Joi.string().required(),
            xor: Joi.string(),
            renamed: Joi.string().valid('456'),
            notEmpty: Joi.string().required().description('a').notes('b').tags('c'),
            empty: Joi.string().empty('').strip(),
            defaultRef: Joi.string().default(defaultRef, 'not here'),
            defaultFn: Joi.string().default(defaultFn, 'not here'),
            defaultDescribedFn: Joi.string().default(defaultDescribedFn, 'described test')
        }).rename('renamed', 'required').without('required', 'xor').without('xor', 'required');

        const result = {
            type: 'object',
            children: {
                sub: {
                    type: 'object',
                    children: {
                        email: {
                            type: 'string',
                            invalids: [''],
                            rules: [{ name: 'email' }]
                        },
                        date: {
                            type: 'date'
                        },
                        child: {
                            type: 'object',
                            children: {
                                alphanum: {
                                    type: 'string',
                                    invalids: [''],
                                    rules: [{ name: 'alphanum' }]
                                }
                            }
                        }
                    }
                },
                min: {
                    type: 'alternatives',
                    alternatives: [
                        {
                            type: 'number',
                            invalids: [Infinity, -Infinity]
                        },
                        {
                            type: 'string',
                            invalids: [''],
                            rules: [{ name: 'min', arg: 3 }]
                        }
                    ]
                },
                max: {
                    type: 'string',
                    flags: {
                        default: 0
                    },
                    invalids: [''],
                    rules: [{ name: 'max', arg: 3 }]
                },
                required: {
                    type: 'string',
                    flags: {
                        presence: 'required'
                    },
                    invalids: ['']
                },
                xor: {
                    type: 'string',
                    invalids: ['']
                },
                renamed: {
                    type: 'string',
                    flags: {
                        allowOnly: true
                    },
                    valids: ['456'],
                    invalids: ['']
                },
                notEmpty: {
                    type: 'string',
                    flags: {
                        presence: 'required'
                    },
                    description: 'a',
                    notes: ['b'],
                    tags: ['c'],
                    invalids: ['']
                },
                empty: {
                    type: 'string',
                    flags: {
                        empty: {
                            type: 'string',
                            flags: {
                                allowOnly: true
                            },
                            valids: ['']
                        },
                        strip: true
                    },
                    invalids: ['']
                },
                defaultRef: {
                    type: 'string',
                    flags: {
                        default: 'ref:xor'
                    },
                    invalids: ['']
                },
                defaultFn: {
                    type: 'string',
                    flags: {
                        default: 'testing'
                    },
                    invalids: ['']
                },
                defaultDescribedFn: {
                    type: 'string',
                    flags: {
                        default: 'described test'
                    },
                    invalids: ['']
                }
            },
            dependencies: [
                {
                    type: 'without',
                    key: 'required',
                    peers: ['xor']
                },
                {
                    type: 'without',
                    key: 'xor',
                    peers: ['required']
                }
            ]
        };

        it('describes schema (direct)', (done) => {

            const description = schema.describe();
            expect(description).to.deep.equal(result);
            expect(description.children.defaultRef.flags.default).to.equal('ref:xor');
            expect(description.children.defaultFn.flags.default).to.equal('testing');
            expect(description.children.defaultDescribedFn.flags.default).to.equal('described test');
            done();
        });

        it('describes schema (root)', (done) => {

            const description = Joi.describe(schema);
            expect(description).to.deep.equal(result);
            done();
        });

        it('describes schema (any)', (done) => {

            const any = Joi;
            const description = any.describe();
            expect(description).to.deep.equal({
                type: 'any'
            });
            done();
        });

        it('describes schema without invalids', (done) => {

            const description = Joi.allow(null).describe();
            expect(description.invalids).to.not.exist();
            done();
        });
    });

    describe('assert()', () => {

        it('does not have a return value', (done) => {

            let result;
            expect(() => {

                result = Joi.assert('4', Joi.number());
            }).to.not.throw();
            expect(result).to.not.exist();
            done();
        });
    });

    describe('attempt()', () => {

        it('throws on invalid value', (done) => {

            expect(() => {

                Joi.attempt('x', Joi.number());
            }).to.throw('"value" must be a number');
            done();
        });

        it('does not throw on valid value', (done) => {

            expect(() => {

                Joi.attempt('4', Joi.number());
            }).to.not.throw();
            done();
        });

        it('returns validated structure', (done) => {

            let valid;
            expect(() => {

                valid = Joi.attempt('4', Joi.number());
            }).to.not.throw();
            expect(valid).to.equal(4);
            done();
        });

        it('throws on invalid value with message', (done) => {

            expect(() => {

                Joi.attempt('x', Joi.number(), 'the reason is');
            }).to.throw('the reason is "value" must be a number');
            done();
        });

        it('throws on invalid value with message as error', (done) => {

            expect(() => {

                Joi.attempt('x', Joi.number(), new Error('invalid value'));
            }).to.throw('invalid value');
            done();
        });
    });

    describe('compile()', () => {

        it('throws an error on invalid value', (done) => {

            expect(() => {

                Joi.compile(undefined);
            }).to.throw(Error, 'Invalid schema content: ');
            done();
        });

        it('shows path to errors in object', (done) => {

            const schema = {
                a: {
                    b: {
                        c: {
                            d: undefined
                        }
                    }
                }
            };

            expect(() => {

                Joi.compile(schema);
            }).to.throw(Error, 'Invalid schema content: (a.b.c.d)');
            done();
        });
    });

    describe('reach()', () => {

        it('should fail without any parameter', (done) => {

            expect(() => Joi.reach()).to.throw('you must provide a joi schema');
            done();
        });

        it('should fail when schema is not a joi object', (done) => {

            expect(() => Joi.reach({ foo: 'bar' }, 'foo')).to.throw('you must provide a joi schema');
            done();
        });

        it('should fail without a proper path', (done) => {

            const schema = Joi.object();
            expect(() => Joi.reach(schema)).to.throw('path must be a string');
            expect(() => Joi.reach(schema, true)).to.throw('path must be a string');
            done();
        });

        it('should return undefined when no keys are defined', (done) => {

            const schema = Joi.object();
            expect(Joi.reach(schema, 'a')).to.be.undefined();
            done();
        });

        it('should return undefined when key is not found', (done) => {

            const schema = Joi.object().keys({ a: Joi.number() });
            expect(Joi.reach(schema, 'foo')).to.be.undefined();
            done();
        });

        it('should return a schema when key is found', (done) => {

            const a = Joi.number();
            const schema = Joi.object().keys({ a });
            expect(Joi.reach(schema, 'a')).to.equal(a);
            done();
        });

        it('should return undefined on a schema that does not support reach', (done) => {

            const schema = Joi.number();
            expect(Joi.reach(schema, 'a')).to.be.undefined();
            done();
        });

        it('should return a schema when deep key is found', (done) => {

            const bar = Joi.number();
            const schema = Joi.object({ foo: Joi.object({ bar }) });
            expect(Joi.reach(schema, 'foo.bar')).to.equal(bar);
            done();
        });

        it('should return undefined when deep key is not found', (done) => {

            const schema = Joi.object({ foo: Joi.object({ bar: Joi.number() }) });
            expect(Joi.reach(schema, 'foo.baz')).to.be.undefined();
            done();
        });
    });

    describe('extend()', () => {

        describe('parameters', () => {

            it('must be an object or array of objects', (done) => {

                expect(() => Joi.extend(true)).to.throw(/"0" must be an object/);
                expect(() => Joi.extend(null)).to.throw(/"0" must be an object/);
                expect(() => Joi.extend([{ name: 'foo' }, true])).to.throw(/"1" must be an object/);
                expect(() => Joi.extend([{ name: 'foo' }, null])).to.throw(/"1" must be an object/);
                expect(() => Joi.extend()).to.throw('You need to provide at least one extension');
                done();
            });

            it('must have a valid string as name for the type', (done) => {

                expect(() => Joi.extend({ base: Joi.number() })).to.throw(/"name" is required/);
                expect(() => Joi.extend({ name: 123 })).to.throw(/"name" must be a string/);
                expect(() => Joi.extend({ name: '' })).to.throw(/"name" is not allowed to be empty/);
                done();
            });

            it('must have a Joi schema as base when present', (done) => {

                expect(() => Joi.extend({ base: true })).to.throw(/"base" must be an object/);
                expect(() => Joi.extend({ base: { isJoi: true } })).to.throw(/"base" must be an instance of "Joi object"/);
                done();
            });

            it('must have valid pre function', (done) => {

                expect(() => Joi.extend({ name: 'a', pre: true })).to.throw(/"pre" must be a Function/);
                expect(() => Joi.extend({ name: 'a', pre() {} })).to.throw(/"pre" must have an arity of 3/);
                expect(() => Joi.extend({ name: 'a', pre(a, b) {} })).to.throw(/"pre" must have an arity of 3/);
                expect(() => Joi.extend({ name: 'a', pre(a, b, c, d) {} })).to.throw(/"pre" must have an arity of 3/);
                done();
            });

            it('must have valid language object', (done) => {

                expect(() => Joi.extend({ name: 'a', language: true })).to.throw(/"language" must be an object/);
                expect(() => Joi.extend({ name: 'a', language() {} })).to.throw(/"language" must be an object/);
                expect(() => Joi.extend({ name: 'a', language: null })).to.throw(/"language" must be an object/);
                done();
            });

            it('must have valid rules', (done) => {

                expect(() => Joi.extend({ name: 'a', rules: true })).to.throw(/"rules" must be an array/);
                expect(() => Joi.extend({ name: 'a', rules: [true] })).to.throw(/"0" must be an object/);
                expect(() => Joi.extend({ name: 'a', rules: [{}] })).to.throw(/"name" is required/);
                expect(() => Joi.extend({ name: 'a', rules: [{ name: true }] })).to.throw(/"name" must be a string/);
                expect(() => Joi.extend({ name: 'a', rules: [{ name: 'foo' }] })).to.throw(/must contain at least one of \[setup, validate\]/);

                expect(() => {

                    Joi.extend({ name: 'a', rules: [{ name: 'foo', validate: true }] });
                }).to.throw(/"validate" must be a Function/);

                expect(() => {

                    Joi.extend({
                        name: 'a', rules: [{
                            name: 'foo',
                            validate() {}
                        }]
                    });
                }).to.throw(/"validate" must have an arity of 4/);

                expect(() => {

                    Joi.extend({ name: 'a', rules: [{ name: 'foo', setup: true }] });
                }).to.throw(/"setup" must be a Function/);

                expect(() => {

                    Joi.extend({
                        name: 'a', rules: [{
                            name: 'foo',
                            setup() {}
                        }]
                    });
                }).to.throw(/"setup" must have an arity of 1/);

                expect(() => {

                    Joi.extend({
                        name: 'a', rules: [{
                            name: 'foo',
                            validate(a, b, c, d) {},
                            params: {
                                foo: true
                            }
                        }]
                    });
                }).to.throw(/"foo" must be an object/);

                expect(() => {

                    Joi.extend({
                        name: 'a', rules: [{
                            name: 'foo',
                            validate(a, b, c, d) {},
                            params: {
                                foo: {}
                            }
                        }]
                    });
                }).to.throw(/"foo" must be an instance of "Joi object"/);

                expect(() => {

                    Joi.extend({
                        name: 'a', rules: [{
                            name: 'foo',
                            validate(a, b, c, d) {},
                            params: {
                                foo: { isJoi: true }
                            }
                        }]
                    });
                }).to.throw(/"foo" must be an instance of "Joi object"/);

                expect(() => {

                    Joi.extend({
                        name: 'a', rules: [{
                            name: 'foo',
                            validate(a, b, c, d) {},
                            params: Joi.number()
                        }]
                    });
                }).to.throw(/"params" must be an instance of "Joi object"/);

                done();
            });
        });

        it('defines a custom type with a default base', (done) => {

            const customJoi = Joi.extend({
                name: 'myType'
            });

            expect(Joi.myType).to.not.exist();
            expect(customJoi.myType).to.be.a.function();

            const schema = customJoi.myType();
            expect(schema._type).to.equal('myType');
            expect(schema.isJoi).to.be.true();

            done();
        });

        it('defines a custom type with a custom base', (done) => {

            const customJoi = Joi.extend({
                base: Joi.string().min(2),
                name: 'myType'
            });

            expect(Joi.myType).to.not.exist();
            expect(customJoi.myType).to.be.a.function();

            const schema = customJoi.myType();
            Helper.validate(schema, [
                [123, false, null, '"value" must be a string'],
                ['a', false, null, '"value" length must be at least 2 characters long'],
                ['abc', true]
            ], done);
        });

        it('defines a custom type with new rules', (done) => {

            const customJoi = Joi.extend({
                name: 'myType',
                language: {
                    bar: 'oh no bar !'
                },
                rules: [
                    {
                        name: 'foo',
                        validate(params, value, state, options) {

                            return null; // Valid
                        }
                    },
                    {
                        name: 'bar',
                        validate(params, value, state, options) {

                            return this.createError('myType.bar', null, state, options);
                        }
                    }
                ]
            });

            const original = Joi.any();
            expect(original.foo).to.not.exist();
            expect(original.bar).to.not.exist();

            const schema = customJoi.myType();
            const valid = schema.foo().validate({});
            const invalid = schema.bar().validate({});

            expect(valid.error).to.be.null();
            expect(invalid.error).to.be.an.instanceof(Error);
            expect(invalid.error.toString()).to.equal('ValidationError: "value" oh no bar !');

            done();
        });

        it('defines a custom type with a rule with setup', (done) => {

            const customJoi = Joi.extend({
                name: 'myType',
                pre(value, state, options) {

                    return this._flags.foo;
                },
                rules: [
                    {
                        name: 'foo',
                        params: {
                            first: Joi.string(),
                            second: Joi.func().ref()
                        },
                        setup(params) {

                            this._flags.foo = params;
                        }
                    }
                ]
            });

            const schema = customJoi.myType();
            expect(schema.foo('bar').validate(null).value).to.deep.equal({ first: 'bar', second: undefined });
            expect(schema.foo('bar', Joi.ref('a.b')).validate(null).value.first).to.equal('bar');
            expect(Joi.isRef(schema.foo('bar', Joi.ref('a.b')).validate(null).value.second)).to.be.true();
            done();
        });

        it('defines a custom type with a rule with both setup and validate', (done) => {

            const customJoi = Joi.extend({
                name: 'myType',
                pre(value, state, options) {

                    return value + this._flags.add;
                },
                rules: [
                    {
                        name: 'addTwice',
                        params: {
                            factor: Joi.number().required()
                        },
                        setup(params) {

                            this._flags.add = params.factor;
                        },
                        validate(params, value, state, options) {

                            return value + params.factor;
                        }
                    }
                ]
            });

            const schema = customJoi.myType();
            expect(schema.addTwice(3).validate(0).value).to.equal(6);
            done();
        });

        it('defines a rule that validates its parameters', (done) => {

            const customJoi = Joi.extend({
                base: Joi.number(),
                name: 'number',
                rules: [
                    {
                        name: 'multiply',
                        params: {
                            q: Joi.number().required(),
                            currency: Joi.string()
                        },
                        validate(params, value, state, options) {

                            const v = value * params.q;
                            return params.currency ? params.currency + v : v;
                        }
                    }
                ]
            });

            const original = Joi.number();
            expect(original.double).to.not.exist();

            expect(customJoi.number().multiply(2).validate(3)).to.deep.equal({ error: null, value: 6 });
            expect(customJoi.number().multiply(5, '$').validate(7)).to.deep.equal({ error: null, value: '$35' });
            expect(() => customJoi.number().multiply(5, '$', 'oops')).to.throw('Unexpected number of arguments');

            done();
        });

        it('defines a rule that validates its parameters when provided as a Joi schema', (done) => {

            const customJoi = Joi.extend({
                base: Joi.number(),
                name: 'number',
                rules: [
                    {
                        name: 'multiply',
                        params: Joi.object({
                            q: Joi.number().required(),
                            currency: Joi.string()
                        }),
                        validate(params, value, state, options) {

                            const v = value * params.q;
                            return params.currency ? params.currency + v : v;
                        }
                    }
                ]
            });

            const original = Joi.number();
            expect(original.double).to.not.exist();

            expect(customJoi.number().multiply(2).validate(3)).to.deep.equal({ error: null, value: 6 });
            expect(customJoi.number().multiply(5, '$').validate(7)).to.deep.equal({ error: null, value: '$35' });
            expect(() => customJoi.number().multiply(5, '$', 'oops')).to.throw('Unexpected number of arguments');

            done();
        });

        it('defines a rule that validates its parameters with references', (done) => {

            const customJoi = Joi.extend({
                base: Joi.number(),
                name: 'number',
                rules: [
                    {
                        name: 'multiply',
                        params: {
                            q: Joi.func().ref(),
                            currency: Joi.string()
                        },
                        validate(params, value, state, options) {

                            const q = params.q(state.parent, options) || 0;
                            const v = value * q;
                            return params.currency ? params.currency + v : v;
                        }
                    }
                ]
            });

            const schema = customJoi.object({
                a: customJoi.number(),
                b: customJoi.number().multiply(customJoi.ref('a'))
            });

            Helper.validate(schema, [
                [{ a: 3, b: 5 }, true, null, { a: 3, b: 15 }],
                [{ b: 42 }, true, null, { b: 0 }]
            ], done);
        });

        it('defines a rule that can change the value', (done) => {

            const customJoi = Joi.extend({
                base: Joi.number(),
                name: 'number',
                rules: [
                    {
                        name: 'double',
                        validate(params, value, state, options) {

                            return value * 2;
                        }
                    }
                ]
            });

            const original = Joi.number();
            expect(original.double).to.not.exist();

            const schema = customJoi.number().double();
            expect(schema.validate(3)).to.deep.equal({ error: null, value: 6 });

            done();
        });

        it('overrides a predefined language', (done) => {

            const base = Joi.any().options({
                language: {
                    myType: {
                        foo: 'original'
                    }
                }
            });

            const customJoi = Joi.extend({
                base,
                name: 'myType',
                language: {
                    foo: 'modified'
                },
                rules: [
                    {
                        name: 'foo',
                        validate(params, value, state, options) {

                            return this.createError('myType.foo', null, state, options);
                        }
                    }
                ]
            });

            const schema = customJoi.myType().foo();
            const result = schema.validate({});
            expect(result.error).to.be.an.instanceof(Error);
            expect(result.error.toString()).to.equal('ValidationError: "value" modified');

            done();
        });

        it('defines a custom type casting its input value', (done) => {

            const customJoi = Joi.extend({
                base: Joi.string(),
                pre(value, state, options) {

                    return Symbol(value);
                },
                name: 'myType'
            });

            const schema = customJoi.myType();
            const result = schema.validate('foo');
            expect(result.error).to.be.null();
            expect(typeof result.value).to.equal('symbol');
            expect(result.value.toString()).to.equal('Symbol(foo)');

            done();
        });

        it('defines a custom type with a failing pre', (done) => {

            const customJoi = Joi.extend({
                pre(value, state, options) {

                    return this.createError('any.invalid', null, state, options);
                },
                name: 'myType'
            });

            const schema = customJoi.myType();
            const result = schema.validate('foo');
            expect(result.error).to.exist();
            expect(result.error.toString()).to.equal('ValidationError: "value" contains an invalid value');

            done();
        });

        it('defines a custom type with a non-modifying pre', (done) => {

            const customJoi = Joi.extend({
                pre(value, state, options) {

                    return null;
                },
                name: 'myType'
            });

            const schema = customJoi.myType();
            const result = schema.validate('foo');
            expect(result.error).to.not.exist();
            expect(result.value).to.equal('foo');

            done();
        });

        it('never reaches a pre if the base is failing', (done) => {

            const customJoi = Joi.extend({
                base: Joi.number(),
                pre(value, state, options) {

                    throw new Error('should not reach here');
                },
                name: 'myType'
            });

            const schema = customJoi.myType();
            const result = schema.validate('foo');
            expect(result.error).to.exist();
            expect(result.error.toString()).to.equal('ValidationError: "value" must be a number');

            done();
        });

        describe('describe()', () => {

            it('should describe a basic schema', (done) => {

                const customJoi = Joi.extend({
                    name: 'myType'
                });

                const schema = customJoi.myType();
                expect(schema.describe()).to.deep.equal({
                    type: 'myType'
                });

                done();
            });

            it('should describe a schema with a base', (done) => {

                const customJoi = Joi.extend({
                    base: Joi.number(),
                    name: 'myType'
                });

                const schema = customJoi.myType();
                expect(schema.describe()).to.deep.equal({
                    type: 'myType',
                    invalids: [Infinity, -Infinity]
                });

                done();
            });

            it('should describe a schema with rules', (done) => {

                const customJoi = Joi.extend({
                    name: 'myType',
                    rules: [
                        {
                            name: 'foo',
                            validate(params, value, state, options) {}
                        },
                        {
                            name: 'bar',
                            validate(params, value, state, options) {}
                        }
                    ]
                });

                const schema = customJoi.myType().foo().bar();
                expect(schema.describe()).to.deep.equal({
                    type: 'myType',
                    rules: [
                        { name: 'foo', arg: {} },
                        { name: 'bar', arg: {} }
                    ]
                });

                done();
            });

            it('should describe a schema with rules and parameters', (done) => {

                const customJoi = Joi.extend({
                    name: 'myType',
                    rules: [
                        {
                            name: 'foo',
                            params: {
                                bar: Joi.string(),
                                baz: Joi.number(),
                                qux: Joi.func().ref(),
                                quux: Joi.func().ref()
                            },
                            validate(params, value, state, options) {}
                        }
                    ]
                });

                const schema = customJoi.myType().foo('bar', 42, Joi.ref('a.b'), Joi.ref('$c.d'));
                expect(schema.describe()).to.deep.equal({
                    type: 'myType',
                    rules: [
                        { name: 'foo', arg: { bar: 'bar', baz: 42, qux: 'ref:a.b', quux: 'context:c.d' } }
                    ]
                });

                done();
            });

            it('should describe a schema with rules and parameters with custom description', (done) => {

                const customJoi = Joi.extend({
                    name: 'myType',
                    rules: [
                        {
                            name: 'foo',
                            params: {
                                bar: Joi.string()
                            },
                            description: 'something',
                            validate(params, value, state, options) {}
                        },
                        {
                            name: 'bar',
                            params: {
                                baz: Joi.string()
                            },
                            description(params) {

                                expect(params).to.deep.equal({ baz: 'baz' });
                                return 'whatever';
                            },
                            validate(params, value, state, options) {}
                        }
                    ]
                });

                const schema = customJoi.myType().foo('bar').bar('baz');
                expect(schema.describe()).to.deep.equal({
                    type: 'myType',
                    rules: [
                        { name: 'foo', description: 'something', arg: { bar: 'bar' } },
                        { name: 'bar', description: 'whatever', arg: { baz: 'baz' } }
                    ]
                });

                done();
            });

            it('should describe a schema with rules and parameters with custom description', (done) => {

                const customJoi = Joi.extend({
                    name: 'myType',
                    describe(description) {

                        expect(description).to.deep.equal({
                            type: 'myType',
                            rules: [
                                { name: 'foo', description: 'something', arg: { bar: 'bar' } },
                                { name: 'bar', description: 'whatever', arg: { baz: 'baz' } }
                            ]
                        });

                        description.type = 'zalgo';
                        return description;
                    },
                    rules: [
                        {
                            name: 'foo',
                            params: {
                                bar: Joi.string()
                            },
                            description: 'something',
                            validate(params, value, state, options) {}
                        },
                        {
                            name: 'bar',
                            params: {
                                baz: Joi.string()
                            },
                            description(params) {

                                expect(params).to.deep.equal({ baz: 'baz' });
                                return 'whatever';
                            },
                            validate(params, value, state, options) {}
                        }
                    ]
                });

                const schema = customJoi.myType().foo('bar').bar('baz');
                expect(schema.describe()).to.deep.equal({
                    type: 'zalgo',
                    rules: [
                        { name: 'foo', description: 'something', arg: { bar: 'bar' } },
                        { name: 'bar', description: 'whatever', arg: { baz: 'baz' } }
                    ]
                });

                done();
            });
        });
    });
});
