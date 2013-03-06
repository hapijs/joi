// Load modules

var Chai = require('chai');
var Joi = require('../lib');


// Declare internals

var internals = {};


// Test shortcuts

var expect = Chai.expect;
var T = Joi.Types;


describe('#validate', function () {

    var config = {
        a: Joi.types.Number().min(0).max(3),
        b: Joi.types.String().valid('a', 'b', 'c'),
        c: Joi.types.String().email()
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
        j: Joi.types.Object().optional()
    };

    it('should validate object successfully', function (done) {

        var obj = {
            a: 1,
            b: 'a',
            c: 'joe@example.com'
        };
        var err = Joi.validate(obj, config);

        expect(err).to.not.exist;
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
        var err = Joi.validate(obj, config);

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
            a: { }
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
        var input = { username: 'test', func: function() { } };
        var err = Joi.validate(input, schema);

        expect(err).to.not.exist;
        Joi.settings.skipFunctions = false;
        done();
    });

    it('should work when the skipFunctions setting is disabled', function (done) {

        Joi.settings.skipFunctions = false;
        var schema = { username: Joi.types.String() };
        var input = { username: 'test', func: function() { } };
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

    internals.routeSchema = {
        method: T.String().invalid('head').required(),
        path: T.String().required(),
        handler: [T.Object().optional(), T.Function().optional(), T.String().valid('notFound').optional()],
        config: T.Object({
            handler: [T.Object().optional(), T.Function().optional(), T.String().valid('notFound').optional()],
            payload: T.String().valid(['stream', 'raw', 'parse']).optional(),
            response: T.Object({
                schema: T.Object().nullOk().optional(),
                sample: T.Number().optional(),
                failAction: T.String().optional().valid(['error', 'log', 'ignore'])
            }).optional()
        })
    };
});


