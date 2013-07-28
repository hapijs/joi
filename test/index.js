// Load modules

var Lab = require('lab');
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


describe('#validate', function () {

    var config1 = {
        a: Joi.types.Number().min(0).max(3),
        b: Joi.types.String().valid('a', 'b', 'c'),
        c: Joi.types.String().email().optional()
    };

    var config2 = {
        d: [Joi.types.String(), Joi.types.Boolean()],
        e: [Joi.types.Number(), Joi.types.Object()]
    };

    var config3 = {
        f: [Joi.types.Number(), Joi.types.Boolean()],
        g: [Joi.types.String(), Joi.types.Object()]
    };

    var config4 = {
        h: Joi.types.Number(),
        i: Joi.types.String(),
        j: Joi.types.Object()
    };

    var config5 = {
        txt: Joi.types.String().xor('upc'),
        upc: Joi.types.String().xor('txt')
    };

    var config6 = {
        txt: Joi.types.String().required().without('upc'),
        upc: Joi.types.String().required().without('txt')
    };

    it('should validate object successfully', function (done) {

        var obj = {
            a: 1,
            b: 'a',
            c: 'joe@example.com'
        };
        var err = Joi.validate(obj, config1);

        expect(err).to.not.exist;
        done();
    });

    it('should validate null', function (done) {

        var err = Joi.validate(null, config1);

        expect(err).to.exist;
        done();
    });

    it('should validate xor statements', function (done) {

        expect(Joi.validate({ upc: null }, config5)).to.not.be.null;
        expect(Joi.validate({ upc: 'test' }, config5)).to.be.null;
        expect(Joi.validate({ txt: null }, config5)).to.not.be.null;
        expect(Joi.validate({ txt: 'test' }, config5)).to.be.null;
        expect(Joi.validate({ upc: null, txt: null }, config5)).to.not.be.null;
        expect(Joi.validate({ txt: 'test', upc: 'test' }, config5)).to.not.be.null;
        expect(Joi.validate({ txt: 'test', upc: null }, config5)).to.be.null;
        expect(Joi.validate({ txt: 'test', upc: '' }, config5)).to.be.null;
        expect(Joi.validate({ txt: '', upc: 'test' }, config5)).to.be.null;
        expect(Joi.validate({ txt: null, upc: 'test' }, config5)).to.be.null;
        expect(Joi.validate({ txt: undefined, upc: 'test' }, config5)).to.be.null;
        expect(Joi.validate({ txt: 'test', upc: undefined }, config5)).to.be.null;
        expect(Joi.validate({ txt: 'test', upc: '' }, config5)).to.be.null;
        expect(Joi.validate({ txt: 'test', upc: null }, config5)).to.be.null;
        expect(Joi.validate({ txt: '', upc: undefined }, config5)).to.not.be.null;
        expect(Joi.validate({ txt: '', upc: '' }, config5)).to.not.be.null;

        done();
    });

    it('should validate required without statements like xor', function (done) {

        expect(Joi.validate({ upc: null }, config6)).to.not.be.null;
        expect(Joi.validate({ upc: 'test' }, config6)).to.be.null;
        expect(Joi.validate({ txt: null }, config6)).to.not.be.null;
        expect(Joi.validate({ txt: 'test' }, config6)).to.be.null;
        expect(Joi.validate({ upc: null, txt: null }, config6)).to.not.be.null;
        expect(Joi.validate({ txt: 'test', upc: 'test' }, config6)).to.not.be.null;
        expect(Joi.validate({ txt: 'test', upc: null }, config6)).to.be.null;
        expect(Joi.validate({ txt: 'test', upc: '' }, config6)).to.be.null;
        expect(Joi.validate({ txt: '', upc: 'test' }, config6)).to.be.null;
        expect(Joi.validate({ txt: null, upc: 'test' }, config6)).to.be.null;
        expect(Joi.validate({ txt: undefined, upc: 'test' }, config6)).to.be.null;
        expect(Joi.validate({ txt: 'test', upc: undefined }, config6)).to.be.null;
        expect(Joi.validate({ txt: 'test', upc: '' }, config6)).to.be.null;
        expect(Joi.validate({ txt: 'test', upc: null }, config6)).to.be.null;
        expect(Joi.validate({ txt: '', upc: undefined }, config6)).to.not.be.null;
        expect(Joi.validate({ txt: '', upc: '' }, config6)).to.not.be.null;

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

        expect(Joi.validate({ auth: { mode: 'none' } }, config)).to.not.be.null;
        expect(Joi.validate({ auth: { mode: 'try' } }, config)).to.be.null;
        expect(Joi.validate({ something: undefined }, config)).to.be.null;
        expect(Joi.validate({ auth: { something: undefined } }, config)).to.be.null;

        done();
    });

    it('should validate config where the root item is a joi type', function (done) {

        expect(Joi.validate(true, T.Boolean().nullOk())).to.be.null;
        expect(Joi.validate({ auth: { mode: 'try' } }, T.Object())).to.be.null;
        expect(Joi.validate(true, T.Object())).to.not.be.null;
        expect(Joi.validate(true, T.String())).to.not.be.null;
        expect(Joi.validate('test@test.com', T.String().email())).to.be.null;

        done();
    });

    it('should validate config where the root item is a joi Object and saveConversions setting is enabled', function (done) {
        Joi.settings.saveConversions = true;
        
        var config = T.Object({
            a: T.String()
        });

        expect(Joi.validate({ a: 'okay' }, config)).to.be.null;

        Joi.settings.saveConversions = false;
        
        done();
    });

    it('should not alter valid top level objects when saveConversions setting is enabled', function (done) {
        Joi.settings.saveConversions = true;
        
        var config = T.Object({
            a: T.String()
        });

        var original  = { a: 'okay' };
        var validated = { a: 'okay' };
        
        expect(Joi.validate(validated, config)).to.be.null;
        expect(validated).to.deep.equal(original);

        Joi.settings.saveConversions = false;
        
        done();
    });

    it('should allow unknown keys in objects if no schema was given', function (done) {

        expect(Joi.validate({ foo: 'bar' }, T.Object())).to.not.exist;

        done();
    });

    it('should fail on unkown keys in objects if a schema was given', function (done) {

        expect(Joi.validate({ foo: 'bar' }, T.Object({}))).to.exist;
        expect(Joi.validate({ foo: 'bar' }, {})).to.exist;
        expect(Joi.validate({ foo: 'bar' }, { other: T.Number() })).to.exist;

        done();
    });

    it('should validate an unknown option', function (done) {

        var config = {
            auth: Joi.types.Object({
                mode: T.String().valid('required', 'optional', 'try').nullOk()
            }).nullOk()
        };

        expect(Joi.validate({ auth: { unknown: true } }, config)).to.not.be.null;
        expect(Joi.validate({ something: false }, config)).to.not.be.null;

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

        expect(Joi.validate({}, config)).to.not.be.null;
        expect(Joi.validate({ module: 'test' }, config)).to.be.null;
        expect(Joi.validate({ module: {} }, config)).to.not.be.null;
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

        var obj = {
            f: true,
            g: 'test'
        };
        var err = Joi.validate(obj, config3);

        expect(err).to.not.exist;
        done();
    });

    it('should validate object successfully when config allows for optional key and key is missing', function (done) {

        var obj = {
            h: 12,
            i: 'test'
        };
        var err = Joi.validate(obj, config4);

        expect(err).to.not.exist;
        done();
    });

    it('should fail validation', function (done) {

        var obj = {
            a: 10,
            b: 'a',
            c: 'joe@example.com'
        };
        var err = Joi.validate(obj, config1);

        expect(err).to.exist;
        done();
    });

    it('should fail validation when the wrong types are supplied', function (done) {

        var obj = {
            a: 'a',
            b: 'a',
            c: 'joe@example.com'
        };
        var err = Joi.validate(obj, config1);

        expect(err).to.exist;
        done();
    });

    it('should fail validation when the wrong types are supplied', function (done) {

        var obj = {
            a: 'a',
            b: 'a',
            c: 'joe@example.com'
        };
        var err = Joi.validate(obj, config1);

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

        var obj = {
            d: 10,
            e: 'a'
        };
        var err = Joi.validate(obj, config2);

        expect(err).to.exist;
        done();
    });

    it('should fail validation when config is an array and fails with extra keys', function (done) {

        var obj = {
            a: 10,
            b: 'a'
        };
        var err = Joi.validate(obj, config2);

        expect(err).to.exist;
        done();
    });

    it('should work when the skipFunctions setting is enabled', function (done) {

        Joi.settings.skipFunctions = true;
        var schema = { username: Joi.types.String() };
        var input = { username: 'test', func: function () { } };
        var err = Joi.validate(input, schema);

        expect(err).to.not.exist;
        Joi.settings.skipFunctions = false;
        done();
    });

    it('should work when the skipFunctions setting is disabled', function (done) {

        Joi.settings.skipFunctions = false;
        var schema = { username: Joi.types.String() };
        var input = { username: 'test', func: function () { } };
        var err = Joi.validate(input, schema);

        expect(err).to.exist;
        done();
    });

    it('should work when the saveConversions setting is enabled', function (done) {

        Joi.settings.saveConversions = true;
        var schema = { item: Joi.types.Number() };
        var input = { item: '1' };
        var err = Joi.validate(input, schema);

        expect(err).to.not.exist;
        expect(input.item).to.equal(1);
        Joi.settings.saveConversions = false;
        done();
    });

    it('should work when the saveConversions setting is disabled', function (done) {

        Joi.settings.saveConversions = false;
        var schema = { item: Joi.types.Number() };
        var input = { item: '1' };
        var err = Joi.validate(input, schema);

        expect(err).to.not.exist;
        expect(input.item).to.equal('1');
        done();
    });

    it('should display correct processed pluralization messsage when skipFunctions is enabled', function (done) {

        Joi.settings.skipFunctions = true;
        var schema = { username: Joi.types.String() };
        var input = { username: 'test', item1: 'test', 'item2': 'test' };
        var err = Joi.validate(input, schema);

        expect(err).to.exist;
        Joi.settings.skipFunctions = false;
        done();
    });

    it('should not convert values when skipConversions is set', function (done) {

        Joi.settings.skipConversions = true;
        var schema = {
            arr: Joi.types.Array().includes(Joi.types.String())
        };

        var input = { arr: 'foo' };
        var err = Joi.validate(input, schema);

        expect(err).to.exist;
        done();
    });

    it('should fail validation when a child object has an invalid string value but object traversal isn\'t complete', function (done) {

        var input = { method: 'GET', path: '/', config: { payload: 'something' } };
        var err = Joi.validate(input, internals.routeSchema);

        expect(err).to.exist;
        done();
    });

    it('validation errors should provide an annotated message when making the error annotated', function (done) {

        var input = { method: 'GET', path: '/', config: { payload: 'something' } };
        var err = Joi.validate(input, internals.routeSchema);

        err.annotated();
        expect(err.message).to.contain('\u001b[0m');
        done();
    });

    it('there should be more validation errors when short circuit is disabled', function (done) {

        var input = { a: 1, b: 2 };

        var resultWithShortCircuit = Joi.validate(input, T.Object({}));
        var resultWithoutShortCircuit = Joi.validate(input, T.Object({}).noShortCircuit());

        expect(resultWithShortCircuit).to.exist
        expect(resultWithoutShortCircuit).to.exist
        expect(resultWithoutShortCircuit._errors.length).to.be.greaterThan(resultWithShortCircuit._errors.length);

        done();
    });

    internals.routeSchema = {
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
});


