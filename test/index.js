// Load modules

var Lab = require('lab');
var Path = require('path');
var Joi = require('../lib');


// Declare internals

var internals = {};


// Test shortcuts

var expect = Lab.expect;
var before = Lab.before;
var after = Lab.after;
var describe = Lab.experiment;
var it = Lab.test;
var Validate = require('./helper');


describe('Joi', function () {

    it('validates object', function (done) {

        var schema = {
            a: Joi.number().min(0).max(3).without('none'),
            b: Joi.string().valid('a', 'b', 'c'),
            c: Joi.string().email().optional()
        };

        var obj = {
            a: 1,
            b: 'a',
            c: 'joe@example.com'
        };

        var err = Joi.validate(obj, schema);
        expect(err).to.not.exist;
        done();
    });

    it('validates null', function (done) {

        var err = Joi.validate(null, Joi.string());
        expect(err).to.exist;
        done();
    });

    it('validated with', function (done) {

        var schema = Joi.object({
            txt: Joi.string().with('upc'),
            upc: Joi.string()
        });

        Validate(schema, [
            [{ upc: 'test' }, true],
            [{ txt: 'test' }, false],
            [{ txt: 'test', upc: null }, false],
            [{ txt: 'test', upc: '' }, false],
            [{ txt: 'test', upc: undefined }, false],
            [{ txt: 'test', upc: 'test' }, true]
        ]);

        done();
    });

    it('validates xor', function (done) {

        var schema = Joi.object({
            txt: Joi.string().xor('upc'),
            upc: Joi.string().xor('txt')
        });

        var err = Joi.validate({ upc: null, txt: null }, schema, { abortEarly: false });
        expect(err.message).to.equal('at least one of txt upc is required. at least one of upc txt is required');

        Validate(schema, [
            [{ upc: null }, false],
            [{ upc: 'test' }, true],
            [{ txt: null }, false],
            [{ txt: 'test' }, true],
            [{ txt: 'test', upc: null }, true],
            [{ txt: 'test', upc: '' }, true],
            [{ txt: '', upc: 'test' }, true],
            [{ txt: null, upc: 'test' }, true],
            [{ txt: undefined, upc: 'test' }, true],
            [{ txt: 'test', upc: undefined }, true],
            [{ txt: 'test', upc: '' }, true],
            [{ txt: 'test', upc: null }, true],
            [{ txt: '', upc: undefined }, false],
            [{ txt: '', upc: '' }, false],
            [{ txt: 'test', upc: 'test' }, false]
        ]);

        done();
    });

    it('validates multiple peers xor', function (done) {

        var schema = Joi.object({
            txt: Joi.string().xor('upc', 'code'),
            upc: Joi.string(),
            code: Joi.string()
        });

        Validate(schema, [
            [{ upc: 'test' }, true],
            [{ txt: 'test' }, true],
            [{ }, false]
        ]);

        done();
    });

    it('validates or', function (done) {

        var schema = Joi.object({
            txt: Joi.string().or('upc', 'code'),
            upc: Joi.string().allow(null, ''),
            code: Joi.number()
        });

        var err = Joi.validate({}, schema, { abortEarly: false });
        expect(err.message).to.equal('missing alternative peers upc,code');

        Validate(schema, [
            [{ upc: null }, false],
            [{ upc: 'test' }, true],
            [{ txt: null }, false],
            [{ txt: 'test' }, true],
            [{ code: null }, false],
            [{ code: 123 }, true],
            [{ txt: 'test', upc: null }, true],
            [{ txt: 'test', upc: '' }, true],
            [{ txt: '', upc: 'test' }, true],
            [{ txt: null, upc: 'test' }, true],
            [{ txt: undefined, upc: 'test' }, true],
            [{ txt: 'test', upc: undefined }, true],
            [{ txt: 'test', upc: '' }, true],
            [{ txt: 'test', upc: null }, true],
            [{ txt: '', upc: undefined }, false],
            [{ txt: '', upc: undefined, code: 999 }, true],
            [{ txt: '', upc: undefined, code: undefined }, false],
            [{ txt: '', upc: '' }, false],
            [{ txt: 'test', upc: 'test' }, true],
            [{ txt: 'test', upc: 'test', code: 322 }, true]

        ]);

        done();
    });

    it('validates an array of valid types', function (done) {

        var schema = {
            auth: [
                Joi.object({
                    mode: Joi.string().valid('required', 'optional', 'try').nullOk()
                }).nullOk(),
                Joi.string(),
                Joi.boolean()
            ]
        };

        var err = Joi.validate({ auth: { mode: 'none' } }, schema);
        expect(err).to.exist;
        expect(err.message).to.equal('the value of mode must be one of required, optional, try, null. the value of auth must be a string. the value of auth must be a boolean');

        Validate(schema, [
            [{ auth: { mode: 'try' } }, true],
            [{ something: undefined }, false],
            [{ auth: { something: undefined } }, false],
            [{ auth: null }, true],
            [{ auth: true }, true],
            [{ auth: 123 }, false]
        ]);

        done();
    });

    it('validates an array of string with valid', function (done) {

        var schema = {
            brand: Joi.array().includes(Joi.string().valid('amex', 'visa'))
        };

        expect(Joi.validate({ brand: ['amex'] }, schema)).to.not.exist;
        expect(Joi.validate({ brand: ['visa', 'mc'] }, schema)).to.exist;
        done();
    });

    it('validates pre and post convert value', function (done) {

        var schema = Joi.number().valid(5);

        Validate(schema, [
            [5, true],
            ['5', true]
        ]);
        done();
    });

    it('does not change object when validation fails', function (done) {

        var schema = {
            a: Joi.number().valid(2)
        };

        var obj = {
            a: '5'
        };

        expect(Joi.validate(obj, schema, { modify: true })).to.exist;
        expect(obj.a).to.equal('5');
        done();
    });

    it('invalidates pre and post convert value', function (done) {

        var schema = Joi.number().invalid(5);

        Validate(schema, [
            [5, false],
            ['5', false]
        ]);
        done();
    });

    it('invalidates missing peers', function (done) {

        var schema = {
            username: Joi.string().with('password'),
            password: Joi.string().without('access_token')
        };

        var err = Joi.validate({ username: 'bob' }, schema);
        expect(err).to.exist;
        done();
    });

    it('validates config where the root item is a joi type', function (done) {

        expect(Joi.validate(true, Joi.boolean().nullOk())).to.be.null;
        expect(Joi.validate({ auth: { mode: 'try' } }, Joi.object())).to.be.null;

        var err = Joi.validate(true, Joi.object());
        expect(err.message).to.contain('the value of <root> must be an object');

        err = Joi.validate(true, Joi.string());
        expect(err.message).to.contain('the value of <root> must be a string');

        expect(Joi.validate('test@test.com', Joi.string().email())).to.be.null;
        expect(Joi.validate({ param: 'item' }, Joi.object({ param: Joi.string().required() }))).to.be.null;
        done();
    });

    it('validates config where the root item is a joi Object and modify setting is enabled', function (done) {

        var config = Joi.object({
            a: Joi.string()
        });

        expect(Joi.validate({ a: 'okay' }, config, { modify: true })).to.be.null;
        done();
    });

    it('converts string to number in a schema', function (done) {

        var config = {
            a: Joi.number()
        };

        var original = { a: '5' };
        var validated = { a: 5 };

        expect(Joi.validate(original, config, { modify: true })).to.be.null;
        expect(validated).to.deep.equal(original);
        done();
    });

    it('moves a key', function (done) {

        var schema = {
            a: Joi.number().rename('b', { move: true })
        };

        var obj = { a: 10 };

        var err = Joi.validate(obj, schema);
        expect(err).to.not.exist;
        expect(obj.a).to.not.exist;
        expect(obj.b).to.equal(10);
        done();
    });

    it('does not alter valid top level objects when modify setting is enabled', function (done) {

        var config = Joi.object({
            a: Joi.string()
        });

        var original = { a: 'okay' };
        var validated = { a: 'okay' };

        expect(Joi.validate(validated, config, { modify: true })).to.be.null;
        expect(validated).to.deep.equal(original);
        done();
    });

    it('allows unknown keys in objects if no schema was given', function (done) {

        expect(Joi.validate({ foo: 'bar' }, Joi.object())).to.not.exist;
        done();
    });

    it('fails on unknown keys in objects if a schema was given', function (done) {

        var err = Joi.validate({ foo: 'bar' }, Joi.object({}));
        expect(err).to.exist;
        expect(err.message).to.equal('the key foo is not allowed');

        err = Joi.validate({ foo: 'bar' }, {});
        expect(err).to.exist;
        expect(err.message).to.equal('the key foo is not allowed');

        err = Joi.validate({ foo: 'bar' }, { other: Joi.number() });
        expect(err).to.exist;
        expect(err.message).to.equal('the key foo is not allowed');

        done();
    });

    it('validates an unknown option', function (done) {

        var config = {
            auth: Joi.object({
                mode: Joi.string().valid('required', 'optional', 'try').nullOk()
            }).nullOk()
        };

        var err = Joi.validate({ auth: { unknown: true } }, config);
        expect(err).to.not.be.null;
        expect(err.message).to.contain('the key unknown is not allowed');

        err = Joi.validate({ something: false }, config);
        expect(err).to.not.be.null;
        expect(err.message).to.contain('the key something is not allowed');

        done();
    });

    it('validates required key with multiple options', function (done) {

        var config = {
            module: [
                Joi.object({
                    compile: Joi.func().required(),
                    execute: Joi.func()
                }).required(),
                Joi.string().required()
            ]
        };

        var err = Joi.validate({}, config);
        expect(err).to.not.be.null;
        expect(err.message).to.contain('the value of module is not allowed to be undefined');

        expect(Joi.validate({ module: 'test' }, config)).to.be.null;

        err = Joi.validate({ module: {} }, config);
        expect(err).to.not.be.null;
        expect(err.message).to.contain('the value of compile is not allowed to be undefined');
        expect(err.message).to.contain('the value of module must be a string');

        expect(Joi.validate({ module: { compile: function () { } } }, config)).to.be.null;

        done();
    });

    it('does not require optional numbers', function (done) {

        var config = {
            position: Joi.number(),
            suggestion: Joi.string()
        };

        expect(Joi.validate({ suggestion: 'something' }, config)).to.be.null;
        expect(Joi.validate({ position: 1 }, config)).to.be.null;

        done();
    });

    it('does not require optional objects', function (done) {

        var config = {
            position: Joi.number(),
            suggestion: Joi.object()
        };

        expect(Joi.validate({ suggestion: {} }, config)).to.be.null;
        expect(Joi.validate({ position: 1 }, config)).to.be.null;

        done();
    });

    it('validates object successfully when config has an array of types', function (done) {

        var schema = {
            f: [Joi.number(), Joi.boolean()],
            g: [Joi.string(), Joi.object()]
        };

        var obj = {
            f: true,
            g: 'test'
        };
        var err = Joi.validate(obj, schema);

        expect(err).to.not.exist;
        done();
    });

    it('validates object successfully when config allows for optional key and key is missing', function (done) {

        var schema = {
            h: Joi.number(),
            i: Joi.string(),
            j: Joi.object()
        };

        var obj = {
            h: 12,
            i: 'test'
        };
        var err = Joi.validate(obj, schema);

        expect(err).to.not.exist;
        done();
    });

    it('fails validation', function (done) {

        var schema = {
            a: Joi.number().min(0).max(3),
            b: Joi.string().valid('a', 'b', 'c'),
            c: Joi.string().email().optional()
        };

        var obj = {
            a: 10,
            b: 'a',
            c: 'joe@example.com'
        };
        var err = Joi.validate(obj, schema);

        expect(err).to.exist;
        done();
    });

    it('fails validation when the wrong types are supplied', function (done) {

        var schema = {
            a: Joi.number().min(0).max(3),
            b: Joi.string().valid('a', 'b', 'c'),
            c: Joi.string().email().optional()
        };

        var obj = {
            a: 'a',
            b: 'a',
            c: 'joe@example.com'
        };
        var err = Joi.validate(obj, schema);

        expect(err).to.exist;
        done();
    });

    it('fails validation when missing a required parameter', function (done) {

        var obj = {
            c: 10
        };
        var err = Joi.validate(obj, { a: Joi.string().required() });

        expect(err).to.exist;
        done();
    });

    it('fails validation when missing a required parameter within an object config', function (done) {

        var obj = {
            a: {}
        };
        var err = Joi.validate(obj, { a: Joi.object({ b: Joi.string().required() }) });

        expect(err).to.exist;
        done();
    });

    it('fails validation when parameter is required to be an object but is given as string', function (done) {

        var obj = {
            a: 'a string'
        };
        var err = Joi.validate(obj, { a: Joi.object({ b: Joi.string().required() }) });
        expect(err).to.exist;
        done();
    });

    it('validates when parameter is required to be an object and is given correctly as a json string', function (done) {

        var obj = {
            a: '{"b":"string"}'
        };
        var err = Joi.validate(obj, { a: Joi.object({ b: Joi.string().required() }) });
        expect(err).to.be.null;
        done();
    });

    it('fails validation when parameter is required to be an object but is given as a json string that is incorrect (number instead of string)', function (done) {

        var obj = {
            a: '{"b":2}'
        };
        var err = Joi.validate(obj, { a: Joi.object({ b: Joi.string().required() }) });
        expect(err).to.exist;
        done();
    });

    it('fails validation when parameter is required to be an Array but is given as string', function (done) {

        var obj = {
            a: "an array"
        };
        var err = Joi.validate(obj, { a: Joi.array() });
        expect(err).to.exist;
        done();
    });

    it('validates when parameter is required to be an Array and is given correctly as a json string', function (done) {

        var obj = {
            a: '[1,2]'
        };
        var err = Joi.validate(obj, { a: Joi.array() });
        expect(err).to.be.null;
        done();
    });

    it('fails validation when parameter is required to be an Array but is given as a json that is incorrect (object instead of array)', function (done) {

        var obj = {
            a: '{"b":2}'
        };
        var err = Joi.validate(obj, { a: Joi.object({ b: Joi.string().required() }) });
        expect(err).to.exist;
        done();
    });

    it('fails validation when config is an array and fails', function (done) {

        var schema = {
            d: [Joi.string(), Joi.boolean()],
            e: [Joi.number(), Joi.object()]
        };

        var obj = {
            d: 10,
            e: 'a'
        };
        var err = Joi.validate(obj, schema);

        expect(err).to.exist;
        done();
    });

    it('fails validation when config is an array and fails with extra keys', function (done) {

        var schema = {
            d: [Joi.string(), Joi.boolean()],
            e: [Joi.number(), Joi.object()]
        };

        var obj = {
            a: 10,
            b: 'a'
        };
        var err = Joi.validate(obj, schema);

        expect(err).to.exist;
        done();
    });

    it('fails validation with extra keys', function (done) {

        var schema = {
            a: Joi.number(),
        };

        var obj = {
            a: 1,
            b: 'a',
        };
        var err = Joi.validate(obj, schema);

        expect(err).to.exist;
        done();
    });

    it('validates missing optional key with string condition', function (done) {

        var schema = {
            key: Joi.string().alphanum(false).min(8)
        };

        var err = Joi.validate({}, schema);
        expect(err).to.not.exist;
        done();
    });

    it('validates with extra keys and remove them when stripUnknown is set', function (done) {

        var schema = {
            a: Joi.number().min(0).max(3),
            b: Joi.string().valid('a', 'b', 'c'),
            c: Joi.string().email().optional()
        };

        var obj = {
            a: 1,
            b: 'a',
            d: 'c'
        };
        var err = Joi.validate(obj, schema, { stripUnknown: true, allowUnknown: true });

        expect(err).to.be.null;
        expect(obj).to.deep.equal({ a: 1, b: 'a' });
        done();
    });

    it('should pass validation with extra keys when allowUnknown is set', function (done) {

        var schema = {
            a: Joi.number().min(0).max(3),
            b: Joi.string().valid('a', 'b', 'c'),
            c: Joi.string().email().optional()
        };

        var obj = {
            a: 1,
            b: 'a',
            d: 'c'
        };
        var err = Joi.validate(obj, schema, { allowUnknown: true });

        expect(err).to.be.null;
        expect(obj).to.deep.equal({ a: 1, b: 'a', d: 'c' });
        done();
    });

    it('should pass validation with extra keys set', function (done) {

        var localConfig = {
            a: Joi.number().min(0).max(3),
            b: Joi.string().valid('a', 'b', 'c'),
        };

        var obj = {
            a: 1,
            b: 'a',
            d: 'c'
        };
        var err = Joi.validate(obj, localConfig, { allowUnknown: true });

        expect(err).to.be.null;
        expect(obj).to.deep.equal({ a: 1, b: 'a', d: 'c' });

        err = Joi.validate(obj, localConfig, { allowUnknown: true });

        expect(err).to.be.null;
        expect(obj).to.deep.equal({ a: 1, b: 'a', d: 'c' });
        done();
    });


    it('should pass validation with extra keys and remove them when skipExtraKeys is set locally', function (done) {

        var localConfig = {
            a: Joi.number().min(0).max(3),
            b: Joi.string().valid('a', 'b', 'c')
        };

        var obj = {
            a: 1,
            b: 'a',
            d: 'c'
        };
        var err = Joi.validate(obj, localConfig, { stripUnknown: true, allowUnknown: true });

        expect(err).to.be.null;
        expect(obj).to.deep.equal({ a: 1, b: 'a' });

        err = Joi.validate(obj, localConfig, { stripUnknown: true, allowUnknown: true });

        expect(err).to.be.null;
        expect(obj).to.deep.equal({ a: 1, b: 'a' });

        done();
    });

    it('should work when the skipFunctions setting is enabled', function (done) {

        var schema = Joi.object({ username: Joi.string() }).options({ skipFunctions: true });
        var input = { username: 'test', func: function () { } };
        var err = Joi.validate(input, schema);

        expect(err).to.not.exist;
        done();
    });

    it('should work when the skipFunctions setting is disabled', function (done) {

        var schema = { username: Joi.string() };
        var input = { username: 'test', func: function () { } };
        var err = Joi.validate(input, schema, { skipFunctions: false });

        expect(err).to.exist;
        expect(err.message).to.contain('the key func is not allowed');
        done();
    });

    it('should work when the modify setting is enabled', function (done) {

        var schema = { item: Joi.number() };
        var input = { item: '1' };
        var err = Joi.validate(input, schema, { modify: true });

        expect(err).to.not.exist;
        expect(input.item).to.equal(1);
        done();
    });

    it('should work when the modify setting is disabled', function (done) {

        var schema = { item: Joi.number() };
        var input = { item: '1' };
        var err = Joi.validate(input, schema, { modify: false });

        expect(err).to.not.exist;
        expect(input.item).to.equal('1');
        done();
    });

    it('should not convert values when convert is false', function (done) {

        var schema = {
            arr: Joi.array().includes(Joi.string())
        };

        var input = { arr: 'foo' };
        var err = Joi.validate(input, schema, { convert: false });

        expect(err).to.exist;
        done();
    });

    it('full errors when abortEarly is false', function (done) {

        var schema = {
            a: Joi.string(),
            b: Joi.string()
        };

        var input = { a: 1, b: 2 };

        var errOne = Joi.validate(input, schema);
        var errFull = Joi.validate(input, schema, { abortEarly: false });

        expect(errOne).to.exist
        expect(errFull).to.exist
        expect(errFull._errors.length).to.be.greaterThan(errOne._errors.length);
        done();
    });

    it('supports custom errors when validating types', function (done) {

        var schema = {
            email: Joi.string().email(),
            date: Joi.date(),
            alphanum: Joi.string().alphanum(),
            min: Joi.string().min(3),
            max: Joi.string().max(3),
            required: Joi.string().required().without('xor'),
            xor: Joi.string().without('required'),
            renamed: Joi.string().rename('required').valid('456'),
            notEmpty: Joi.string().required()
        };

        var input = {
            email: 'invalid-email',
            date: 'invalid-date',
            alphanum: '\b\n\f\r\t',
            min: 'ab',
            max: 'abcd',
            required: 'hello',
            xor: '123',
            renamed: '456',
            notEmpty: ''
        };

        var err = Joi.validate(input, schema, { abortEarly: false, languagePath: Path.join(__dirname, 'languages', 'en-us.json') });

        expect(err).to.exist;
        expect(err.message).to.equal('19. 18. 16. 14. 15. 7. 7. 11. 3');
        done();
    });

    it('returns key when language file missing item', function (done) {

        var input = {
            notEmpty: ''
        };

        var schema = {
            notEmpty: Joi.string().required()
        };

        var err = Joi.validate(input, schema, { languagePath: Path.join(__dirname, 'languages', 'empty.json') });

        expect(err).to.exist;
        expect(err.message).to.equal('notEmpty');
        done();
    });

    it('annotates error', function (done) {

        var object = {
            a: 'm',
            y: {
                b: {
                    c: 10
                }
            }
        };

        var schema = {
            a: Joi.string().valid('a', 'b', 'c', 'd'),
            y: Joi.object({
                u: Joi.string().valid(['e', 'f', 'g', 'h']).required(),
                b: Joi.string().valid('i', 'j').allow(false),
                d: Joi.object({
                    x: Joi.string().valid('k', 'l').required(),
                    c: Joi.number()
                })
            })
        };

        var err = Joi.validate(object, schema, { abortEarly: false });
        expect(err).to.exist;
        err.annotated();
        expect(err.message).to.equal('{\n  \"y\": {\n    \"b\" \u001b[31m[5]\u001b[0m: {\n      \"c\": 10\n    },\n    \u001b[41m\"b\"\u001b[0m\u001b[31m [4]: -- missing --\u001b[0m,\n    \u001b[41m\"u\"\u001b[0m\u001b[31m [3]: -- missing --\u001b[0m,\n    \u001b[41m\"u\"\u001b[0m\u001b[31m [2]: -- missing --\u001b[0m\n  },\n  \"a\" \u001b[31m[1]\u001b[0m: \"m\"\n}\n\u001b[31m\n[1] the value of a must be one of a, b, c, d\n[2] the value of u is not allowed to be undefined\n[3] the value of u must be one of e, f, g, h\n[4] the value of b must be one of i, j, false\n[5] the value of b must be a string\u001b[0m');
        done();
    });

    describe('#describe', function () {

        var schema = {
            sub: {
                email: Joi.string().email(),
                date: Joi.date(),
                child: Joi.object({
                    alphanum: Joi.string().alphanum()
                }),
            },
            min: [Joi.number(), Joi.string().min(3)],
            max: Joi.string().max(3),
            required: Joi.string().required().without('xor'),
            xor: Joi.string().without('required'),
            renamed: Joi.string().rename('required').valid('456'),
            notEmpty: Joi.string().required().description('a').notes('b').tags('c')
        };

        var result = {
            type: 'object',
            flags: {
                insensitive: false,
                allowOnly: false
            },
            valids: [undefined],
            invalids: [null],
            children: {
                sub: {
                    type: 'object',
                    flags: {
                        insensitive: false,
                        allowOnly: false
                    },
                    valids: [undefined],
                    invalids: [null],
                    children: {
                        email: {
                            type: 'string',
                            flags: {
                                insensitive: false,
                                allowOnly: false
                            },
                            valids: [undefined],
                            invalids: [null, ''],
                            rules: [{ name: 'email' }]
                        },
                        date: {
                            type: 'date',
                            flags: {
                                insensitive: false,
                                allowOnly: false
                            },
                            valids: [undefined],
                            invalids: [null]
                        },
                        child: {
                            type: 'object',
                            flags: {
                                insensitive: false,
                                allowOnly: false
                            },
                            valids: [undefined],
                            invalids: [null],
                            children: {
                                alphanum: {
                                    type: 'string',
                                    flags: {
                                        insensitive: false,
                                        allowOnly: false
                                    },
                                    valids: [undefined],
                                    invalids: [null, ''],
                                    rules: [{ name: 'alphanum' }]
                                }
                            }
                        }
                    }
                },
                min: [
                    {
                        type: 'number',
                        flags: {
                            insensitive: false,
                            allowOnly: false
                        },
                        valids: [undefined],
                        invalids: [null]
                    },
                    {
                        type: 'string',
                        flags: {
                            insensitive: false,
                            allowOnly: false
                        },
                        valids: [undefined],
                        invalids: [null, ''],
                        rules: [{ name: 'min', arg: 3 }]
                    }
                ],
                max: {
                    type: 'string',
                    flags: {
                        insensitive: false,
                        allowOnly: false
                    },
                    valids: [undefined],
                    invalids: [null, ''],
                    rules: [{ name: 'max', arg: 3 }]
                },
                required: {
                    type: 'string',
                    flags: {
                        insensitive: false,
                        allowOnly: false
                    },
                    invalids: [null, '', undefined],
                    rules: [{ name: 'without', arg: ['xor'] }]
                },
                xor: {
                    type: 'string',
                    flags: {
                        insensitive: false,
                        allowOnly: false
                    },
                    valids: [undefined],
                    invalids: [null, ''],
                    rules: [{ name: 'without', arg: ['required'] }]
                },
                renamed: {
                    type: 'string',
                    flags: {
                        insensitive: false,
                        allowOnly: true
                    },
                    valids: [undefined, '456'],
                    invalids: [null, '']
                },
                notEmpty: {
                    type: 'string',
                    flags: {
                        insensitive: false,
                        allowOnly: false
                    },
                    invalids: [null, '', undefined],
                    description: 'a',
                    notes: ['b'],
                    tags: ['c']
                }
            }
        };

        it('describes schema', function (done) {

            var description = Joi.describe(schema);
            expect(description).to.deep.equal(result);
            done();
        });

        it('describes schema with object', function (done) {

            var description = Joi.describe(Joi.object(schema));
            expect(description).to.deep.equal(result);
            done();
        });
    });
});
