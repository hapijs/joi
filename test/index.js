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
var T = Joi.types;


describe('Joi', function () {

    it('validates object successfully', function (done) {

        var schema = {
            a: Joi.types.Number().min(0).max(3),
            b: Joi.types.String().valid('a', 'b', 'c'),
            c: Joi.types.String().email().optional()
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

        var schema = {
            c: Joi.types.String().email().optional()
        };

        var err = Joi.validate(null, schema);

        expect(err).to.exist;
        done();
    });

    it('validates xor statements', function (done) {

        var schema = T.Object({
            txt: Joi.types.String().xor('upc'),
            upc: Joi.types.String().xor('txt')
        });

        expect(Joi.validate({ upc: null }, schema)).to.not.be.null;
        expect(Joi.validate({ upc: 'test' }, schema)).to.be.null;
        expect(Joi.validate({ txt: null }, schema)).to.not.be.null;
        expect(Joi.validate({ txt: 'test' }, schema)).to.be.null;

        var err = Joi.validate({ upc: null, txt: null }, schema, { earlyAbort: false });
        expect(err).to.not.be.null;
        expect(err.message).to.contain('the value of txt must exist without upc');
        expect(err.message).to.contain('the value of upc must exist without txt');

        expect(Joi.validate({ txt: 'test', upc: null }, schema)).to.be.null;
        expect(Joi.validate({ txt: 'test', upc: '' }, schema)).to.be.null;
        expect(Joi.validate({ txt: '', upc: 'test' }, schema)).to.be.null;
        expect(Joi.validate({ txt: null, upc: 'test' }, schema)).to.be.null;
        expect(Joi.validate({ txt: undefined, upc: 'test' }, schema)).to.be.null;
        expect(Joi.validate({ txt: 'test', upc: undefined }, schema)).to.be.null;
        expect(Joi.validate({ txt: 'test', upc: '' }, schema)).to.be.null;
        expect(Joi.validate({ txt: 'test', upc: null }, schema)).to.be.null;
        expect(Joi.validate({ txt: '', upc: undefined }, schema)).to.not.be.null;
        expect(Joi.validate({ txt: '', upc: '' }, schema)).to.not.be.null;
        expect(Joi.validate({ txt: 'test', upc: 'test' }, schema)).to.not.be.null;

        done();
    });

    it('should validate required without statements like xor', function (done) {

        var schema = T.Object({
            txt: Joi.types.String().required().without('upc'),
            upc: Joi.types.String().required().without('txt')
        });

        expect(Joi.validate({ upc: null }, schema)).to.not.be.null;
        expect(Joi.validate({ upc: 'test' }, schema)).to.be.null;
        expect(Joi.validate({ txt: null }, schema)).to.not.be.null;
        expect(Joi.validate({ txt: 'test' }, schema)).to.be.null;
        expect(Joi.validate({ upc: null, txt: null }, schema)).to.not.be.null;

        var err = Joi.validate({ txt: 'test', upc: 'test' }, schema, { earlyAbort: false });
        expect(err).to.not.be.null;
        expect(err.message).to.contain('the value of txt must exist without upc');
        expect(err.message).to.contain('the value of upc must exist without txt');

        expect(Joi.validate({ txt: 'test', upc: null }, schema)).to.be.null;
        expect(Joi.validate({ txt: 'test', upc: '' }, schema)).to.be.null;
        expect(Joi.validate({ txt: '', upc: 'test' }, schema)).to.be.null;
        expect(Joi.validate({ txt: null, upc: 'test' }, schema)).to.be.null;
        expect(Joi.validate({ txt: undefined, upc: 'test' }, schema)).to.be.null;
        expect(Joi.validate({ txt: 'test', upc: undefined }, schema)).to.be.null;
        expect(Joi.validate({ txt: 'test', upc: '' }, schema)).to.be.null;
        expect(Joi.validate({ txt: 'test', upc: null }, schema)).to.be.null;
        expect(Joi.validate({ txt: '', upc: undefined }, schema)).to.not.be.null;
        expect(Joi.validate({ txt: '', upc: '' }, schema)).to.not.be.null;

        done();
    });

    it('should validate an array of valid types', function (done) {

        var config = {
            auth: [
                Joi.types.Object({
                    mode: T.String().valid('required', 'optional', 'try').nullOk()
                }).nullOk(),
                T.String().nullOk(),
                T.Boolean().nullOk()
            ]
        };

        var err = Joi.validate({ auth: { mode: 'none' } }, config);
        expect(err).to.not.be.null;

        expect(err.message).to.contain('the value of mode must be one of undefined, required, optional, try, null');
        expect(err.message).to.contain('the value of auth must be a string');
        expect(err.message).to.contain('the value of auth must be a boolean');

        expect(Joi.validate({ auth: { mode: 'try' } }, config)).to.be.null;
        expect(Joi.validate({ something: undefined }, config)).to.be.null;
        expect(Joi.validate({ auth: { something: undefined } }, config)).to.be.null;

        done();
    });

    it('should validate config where the root item is a joi type', function (done) {

        expect(Joi.validate(true, T.Boolean().nullOk())).to.be.null;
        expect(Joi.validate({ auth: { mode: 'try' } }, T.Object())).to.be.null;

        var err = Joi.validate(true, T.Object());
        expect(err).to.not.be.null;
        expect(err.message).to.contain('the value of <root> must be an object');

        err = Joi.validate(true, T.String());
        expect(err).to.not.be.null;
        expect(err.message).to.contain('the value of <root> must be a string');

        expect(Joi.validate('test@test.com', T.String().email())).to.be.null;
        expect(Joi.validate({ param: 'item' }, T.Object({ param: T.String().required() }))).to.be.null;

        done();
    });

    it('should validate config where the root item is a joi Object and saveConversions setting is enabled', function (done) {

        var config = T.Object({
            a: T.String()
        });

        expect(Joi.validate({ a: 'okay' }, config, { saveConversions: true })).to.be.null;
        done();
    });

    it('convers string to number in a schema', function (done) {

        var config = {
            a: T.Number()
        };

        var original = { a: '5' };
        var validated = { a: 5 };

        expect(Joi.validate(original, config, { saveConversions: true })).to.be.null;
        expect(validated).to.deep.equal(original);
        done();
    });

    it('should not alter valid top level objects when saveConversions setting is enabled', function (done) {

        var config = T.Object({
            a: T.String()
        });

        var original = { a: 'okay' };
        var validated = { a: 'okay' };

        expect(Joi.validate(validated, config, { saveConversions: true })).to.be.null;
        expect(validated).to.deep.equal(original);
        done();
    });

    it('should allow unknown keys in objects if no schema was given', function (done) {

        expect(Joi.validate({ foo: 'bar' }, T.Object())).to.not.exist;

        done();
    });

    it('should fail on unkown keys in objects if a schema was given', function (done) {

        var err = Joi.validate({ foo: 'bar' }, T.Object({}));
        expect(err).to.exist;
        expect(err.message).to.contain('the key (foo) is not allowed');

        err = Joi.validate({ foo: 'bar' }, {});
        expect(err).to.exist;
        expect(err.message).to.contain('the key (foo) is not allowed');

        err = Joi.validate({ foo: 'bar' }, { other: T.Number() });
        expect(err).to.exist;
        expect(err.message).to.contain('the key (foo) is not allowed');

        done();
    });

    it('should validate an unknown option', function (done) {

        var config = {
            auth: Joi.types.Object({
                mode: T.String().valid('required', 'optional', 'try').nullOk()
            }).nullOk()
        };

        var err = Joi.validate({ auth: { unknown: true } }, config);
        expect(err).to.not.be.null;
        expect(err.message).to.contain('the key (unknown) is not allowed');

        err = Joi.validate({ something: false }, config);
        expect(err).to.not.be.null;
        expect(err.message).to.contain('the key (something) is not allowed');

        done();
    });

    it('should work with complex configs', function (done) {

        var config = {
            handler: [T.Object(), T.Function(), T.String().valid('notFound')],
            payload: T.String().valid('stream', 'raw', 'parse').nullOk(),
            response: T.Object({
                schema: T.Object().nullOk(),
                sample: T.Number(),
                failAction: T.String().valid('error', 'log', 'ignore')
            }).nullOk().allow(true).allow(false),
            auth: [
                T.Object({
                    mode: T.String().valid(['required', 'optional', 'try']).nullOk(),
                    scope: T.String().nullOk(),
                    tos: T.Number().nullOk(),
                    entity: T.String().nullOk(),
                    strategy: T.String().nullOk(),
                    strategies: T.Array().nullOk(),
                    payload: T.String().nullOk()
                }).nullOk(),
                T.Boolean().allow(false).nullOk(),
                T.String().nullOk()
            ],
            cache: T.Object({
                mode: T.String().valid(['server+client', 'client+server', 'client', 'server']),
                segment: T.String(),
                privacy: T.String().valid('default', 'public', 'private'),
                expiresIn: T.Number().xor('expiresAt'),
                expiresAt: T.String(),
                staleIn: T.Number().with('staleTimeout'),
                staleTimeout: T.Number().with('staleIn')
            }).nullOk()
        };

        expect(Joi.validate({ payload: 'raw' }, config)).to.be.null;
        expect(Joi.validate({ auth: { mode: 'required', payload: 'required' }, payload: 'raw' }, config)).to.be.null;
        expect(Joi.validate({ handler: internals.item, cache: { expiresIn: 20000, staleIn: 10000, staleTimeout: 500 } }, config)).to.be.null;
        done();
    });

    it('validates required key with multiple options', function (done) {

        var config = {
            module: [
                T.Object({
                    compile: T.Function().required(),
                    execute: T.Function()
                }).required(),
                T.String().required()
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

    it('should not require optional numbers', function (done) {

        var config = {
            position: T.Number(),
            suggestion: T.String()
        };

        expect(Joi.validate({ suggestion: 'something' }, config)).to.be.null;
        expect(Joi.validate({ position: 1 }, config)).to.be.null;

        done();
    });

    it('should not require optional objects', function (done) {

        var config = {
            position: T.Number(),
            suggestion: T.Object()
        };

        expect(Joi.validate({ suggestion: {} }, config)).to.be.null;
        expect(Joi.validate({ position: 1 }, config)).to.be.null;

        done();
    });

    it('should validate object successfully when config has an array of types', function (done) {

        var schema = {
            f: [Joi.types.Number(), Joi.types.Boolean()],
            g: [Joi.types.String(), Joi.types.Object()]
        };

        var obj = {
            f: true,
            g: 'test'
        };
        var err = Joi.validate(obj, schema);

        expect(err).to.not.exist;
        done();
    });

    it('should validate object successfully when config allows for optional key and key is missing', function (done) {

        var schema = {
            h: Joi.types.Number(),
            i: Joi.types.String(),
            j: Joi.types.Object()
        };

        var obj = {
            h: 12,
            i: 'test'
        };
        var err = Joi.validate(obj, schema);

        expect(err).to.not.exist;
        done();
    });

    it('should fail validation', function (done) {

        var schema = {
            a: Joi.types.Number().min(0).max(3),
            b: Joi.types.String().valid('a', 'b', 'c'),
            c: Joi.types.String().email().optional()
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

    it('should fail validation when the wrong types are supplied', function (done) {

        var schema = {
            a: Joi.types.Number().min(0).max(3),
            b: Joi.types.String().valid('a', 'b', 'c'),
            c: Joi.types.String().email().optional()
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

    it('should fail validation when missing a required parameter', function (done) {

        var obj = {
            c: 10
        };
        var err = Joi.validate(obj, { a: Joi.types.String().required() });

        expect(err).to.exist;
        done();
    });

    it('should fail validation when missing a required parameter within an object config', function (done) {

        var obj = {
            a: {}
        };
        var err = Joi.validate(obj, { a: Joi.types.Object({ b: Joi.types.String().required() }) });

        expect(err).to.exist;
        done();
    });

    it('should fail validation when parameter is required to be an object but is given as string', function (done) {

        var obj = {
            a: "a string"
        };
        var err = Joi.validate(obj, { a: Joi.types.Object({ b: Joi.types.String().required() }) });
        expect(err).to.exist;
        done();
    });

    it('should pass validation when parameter is required to be an object and is given correctly as a json string', function (done) {

        var obj = {
            a: '{"b":"string"}'
        };
        var err = Joi.validate(obj, { a: Joi.types.Object({ b: Joi.types.String().required() }) });
        expect(err).to.be.null;
        done();
    });

    it('should fail validation when parameter is required to be an object but is given as a json string that is incorrect (number instead of string)', function (done) {

        var obj = {
            a: '{"b":2}'
        };
        var err = Joi.validate(obj, { a: Joi.types.Object({ b: Joi.types.String().required() }) });
        expect(err).to.exist;
        done();
    });

    it('should fail validation when parameter is required to be an Array but is given as string', function (done) {

        var obj = {
            a: "an array"
        };
        var err = Joi.validate(obj, { a: Joi.types.Array() });
        expect(err).to.exist;
        done();
    });

    it('should pass validation when parameter is required to be an Array and is given correctly as a json string', function (done) {

        var obj = {
            a: '[1,2]'
        };
        var err = Joi.validate(obj, { a: Joi.types.Array() });
        expect(err).to.be.null;
        done();
    });

    it('should fail validation when parameter is required to be an Array but is given as a json that is incorrect (object instead of array)', function (done) {

        var obj = {
            a: '{"b":2}'
        };
        var err = Joi.validate(obj, { a: Joi.types.Object({ b: Joi.types.String().required() }) });
        expect(err).to.exist;
        done();
    });

    it('should fail validation when config is an array and fails', function (done) {

        var schema = {
            d: [Joi.types.String(), Joi.types.Boolean()],
            e: [Joi.types.Number(), Joi.types.Object()]
        };

        var obj = {
            d: 10,
            e: 'a'
        };
        var err = Joi.validate(obj, schema);

        expect(err).to.exist;
        done();
    });

    it('should fail validation when config is an array and fails with extra keys', function (done) {

        var schema = {
            d: [Joi.types.String(), Joi.types.Boolean()],
            e: [Joi.types.Number(), Joi.types.Object()]
        };

        var obj = {
            a: 10,
            b: 'a'
        };
        var err = Joi.validate(obj, schema);

        expect(err).to.exist;
        done();
    });

    it('should fail validation with extra keys', function (done) {

        var schema = {
            a: Joi.types.Number(),
        };

        var obj = {
            a: 1,
            b: 'a',
        };
        var err = Joi.validate(obj, schema);

        expect(err).to.exist;
        done();
    });

    it('should pass string validation of missing optional key with regex string condition', function (done) {

        var rules = {
            key: Joi.types.String().alphanum(false).min(8)
        };

        var err = Joi.validate({}, rules);
        expect(err).to.not.exist;
        done();
    });

    it('should pass validation with extra keys and remove them when stripExtraKeys is set', function (done) {

        var schema = {
            a: Joi.types.Number().min(0).max(3),
            b: Joi.types.String().valid('a', 'b', 'c'),
            c: Joi.types.String().email().optional()
        };

        var obj = {
            a: 1,
            b: 'a',
            d: 'c'
        };
        var err = Joi.validate(obj, schema, { stripExtraKeys: true, allowExtraKeys: true });

        expect(err).to.be.null;
        expect(obj).to.deep.equal({ a: 1, b: 'a' });
        done();
    });

    it('should pass validation with extra keys when allowExtraKeys is set', function (done) {

        var schema = {
            a: Joi.types.Number().min(0).max(3),
            b: Joi.types.String().valid('a', 'b', 'c'),
            c: Joi.types.String().email().optional()
        };

        var obj = {
            a: 1,
            b: 'a',
            d: 'c'
        };
        var err = Joi.validate(obj, schema, { allowExtraKeys: true });

        expect(err).to.be.null;
        expect(obj).to.deep.equal({ a: 1, b: 'a', d: 'c' });
        done();
    });

    it('should pass validation with extra keys set', function (done) {

        var localConfig = {
            a: Joi.types.Number().min(0).max(3),
            b: Joi.types.String().valid('a', 'b', 'c'),
        };

        var obj = {
            a: 1,
            b: 'a',
            d: 'c'
        };
        var err = Joi.validate(obj, localConfig, { allowExtraKeys: true });

        expect(err).to.be.null;
        expect(obj).to.deep.equal({ a: 1, b: 'a', d: 'c' });

        err = Joi.validate(obj, localConfig, { allowExtraKeys: true });

        expect(err).to.be.null;
        expect(obj).to.deep.equal({ a: 1, b: 'a', d: 'c' });
        done();
    });


    it('should pass validation with extra keys and remove them when skipExtraKeys is set locally', function (done) {

        var localConfig = {
            a: Joi.types.Number().min(0).max(3),
            b: Joi.types.String().valid('a', 'b', 'c')
        };

        var obj = {
            a: 1,
            b: 'a',
            d: 'c'
        };
        var err = Joi.validate(obj, localConfig, { stripExtraKeys: true, allowExtraKeys: true });

        expect(err).to.be.null;
        expect(obj).to.deep.equal({ a: 1, b: 'a' });

        err = Joi.validate(obj, localConfig, { stripExtraKeys: true, allowExtraKeys: true });

        expect(err).to.be.null;
        expect(obj).to.deep.equal({ a: 1, b: 'a' });

        done();
    });

    it('should work when the skipFunctions setting is enabled', function (done) {

        var schema = { username: Joi.types.String() };
        var input = { username: 'test', func: function () { } };
        var err = Joi.validate(input, schema, { skipFunctions: true });

        expect(err).to.not.exist;
        done();
    });

    it('should work when the skipFunctions setting is disabled', function (done) {

        var schema = { username: Joi.types.String() };
        var input = { username: 'test', func: function () { } };
        var err = Joi.validate(input, schema, { skipFunctions: false });

        expect(err).to.exist;
        expect(err.message).to.contain('the key (func) is not allowed');
        done();
    });

    it('should work when the saveConversions setting is enabled', function (done) {

        var schema = { item: Joi.types.Number() };
        var input = { item: '1' };
        var err = Joi.validate(input, schema, { saveConversions: true });

        expect(err).to.not.exist;
        expect(input.item).to.equal(1);
        done();
    });

    it('should work when the saveConversions setting is disabled', function (done) {

        var schema = { item: Joi.types.Number() };
        var input = { item: '1' };
        var err = Joi.validate(input, schema, { saveConversions: false });

        expect(err).to.not.exist;
        expect(input.item).to.equal('1');
        done();
    });

    it('should display correct processed pluralization messsage when skipFunctions is enabled', function (done) {

        var schema = { username: Joi.types.String() };
        var input = { username: 'test', item1: 'test', 'item2': 'test' };
        var err = Joi.validate(input, schema, { skipFunctions: true });

        expect(err).to.exist;
        done();
    });

    it('should not convert values when skipConversions is set', function (done) {

        var schema = {
            arr: Joi.types.Array().includes(Joi.types.String())
        };

        var input = { arr: 'foo' };
        var err = Joi.validate(input, schema, { skipConversions: true });

        expect(err).to.exist;
        done();
    });

    var routeSchema = {
        method: T.String().invalid('head').required(),
        path: T.String().required(),
        handler: [T.Object(), T.Function(), T.String().valid('notFound')],
        config: T.Object({
            handler: [T.Object(), T.Function(), T.String().valid('notFound')],
            payload: T.String().valid(['stream', 'raw', 'parse']),
            response: T.Object({
                schema: T.Object().nullOk(),
                sample: T.Number(),
                failAction: T.String().valid(['error', 'log', 'ignore'])
            })
        })
    };

    it('should fail validation when a child object has an invalid string value but object traversal isn\'t complete', function (done) {

        var input = { method: 'GET', path: '/', config: { payload: 'something' } };
        var err = Joi.validate(input, routeSchema);

        expect(err).to.exist;
        done();
    });

    it('validation errors should provide an annotated message when making the error annotated', function (done) {

        var input = { method: 'GET', path: '/', config: { payload: 'something' } };
        var err = Joi.validate(input, routeSchema);

        err.annotated();
        expect(err.message).to.contain('\u001b[0m');
        done();
    });

    it('there should be more validation errors when short circuit is disabled', function (done) {

        var input = { a: 1, b: 2 };

        var resultWithShortCircuit = Joi.validate(input, T.Object({}));
        var resultWithoutShortCircuit = Joi.validate(input, T.Object({}), { earlyAbort: false });

        expect(resultWithShortCircuit).to.exist
        expect(resultWithoutShortCircuit).to.exist
        expect(resultWithoutShortCircuit._errors.length).to.be.greaterThan(resultWithShortCircuit._errors.length);

        done();
    });

    it('lists all errors', function (done) {

        var config = {
            a: Joi.types.String().valid('b').invalid('a')
        };

        var obj = {
            a: 'a'
        };
        var err = Joi.validate(obj, config, { earlyAbort: false });

        expect(err.message).to.not.equal('');
        done();
    });

    it('should support custom errors when validating types', function (done) {

        var schema = {
            email: T.String().email(),
            date: T.String().date(),
            alphanum: T.String().alphanum(),
            min: T.String().min(3),
            max: T.String().max(3),
            required: T.String().required().without('xor'),
            xor: T.String().without('required'),
            renamed: T.String().rename('required').valid('456'),
            notEmpty: T.String().required()
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

        var err = Joi.validate(input, schema, { earlyAbort: false, languagePath: Path.join(__dirname, 'languages', 'en-us.json') });

        expect(err).to.exist;
        expect(err.message).to.contain('The `email` field must be a valid e-mail address..');
        expect(err.message).to.contain('The `date` field must be a valid date..');
        expect(err.message).to.contain('The `alphanum` field failed one or more validation constraints..');
        expect(err.message).to.contain('The `min` field must be at least 3 characters long..');
        expect(err.message).to.contain('The `max` field may not exceed 3 characters..');
        expect(err.message).to.contain('The `required` field must be omitted if `xor` is specified..');
        expect(err.message).to.contain('`required` is already assigned to the `renamed` field..');
        expect(err.message).to.contain('Invalid value for `notEmpty`: `empty`.');
        done();
    });

    it('returns key when language file missing item', function (done) {

        var input = {
            notEmpty: ''
        };

        var schema = {
            notEmpty: T.String().required()
        };

        var err = Joi.validate(input, schema, { languagePath: Path.join(__dirname, 'languages', 'empty.json') });

        expect(err).to.exist;
        expect(err.message).to.equal('notEmpty');
        done();
    });
});
