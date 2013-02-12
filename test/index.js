// Load modules

var Chai = require('chai');
var Joi = process.env.TEST_COV ? require('../lib-cov') : require('../lib');


// Declare internals

var internals = {};


// Test shortcuts

var expect = Chai.expect;


describe('#validate', function () {

    var config = {
        a: Joi.types.Number().min(0).max(3),
        b: Joi.types.String().valid('a', 'b', 'c'),
        c: Joi.types.String().email()
    };

    var config2 = {
        d: Joi.types.Number().min(3).max(6),
        e: Joi.types.String().valid('d', 'e', 'f')
    };

    var configArray = [
        config,
        config2
    ];

    it('should validate object successfully', function (done) {

        var obj = {
            a: 1,
            b: 'a',
            c: 'joe@example.com'
        };

        Joi.validate(obj, config, function (err) {

            expect(err).to.not.exist;
            done();
        });
    });

    it('should validate object successfully when config is an array', function (done) {

        var obj = {
            a: 1,
            b: 'a',
            c: 'joe@example.com'
        };

        Joi.validate(obj, configArray, function (err) {

            expect(err).to.not.exist;
            done();
        });
    });

    it('should validate object successfully when config is an array and the first config fails', function (done) {

        var obj = {
            d: 4,
            e: 'e'
        };

        Joi.validate(obj, configArray, function (err) {

            expect(err).to.not.exist;
            done();
        });
    });

    it('should fail validation', function (done) {

        var obj = {
            a: 10,
            b: 'a',
            c: 'joe@example.com'
        };

        Joi.validate(obj, config, function (err) {

            expect(err).to.exist;
            done();
        });
    });

    it('should fail validation when config is an array', function (done) {

        var obj = {
            a: 10,
            b: 'a'
        };

        Joi.validate(obj, configArray, function (err) {

            expect(err).to.exist;
            done();
        });
    });

    it('should work when the skipFunctions setting is enabled', function (done) {

        Joi.settings.skipFunctions = true;
        var schema = { username: Joi.types.String() };
        var input = { username: 'test', func: function() { } };

        Joi.validate(input, schema, function (err) {

            expect(err).to.not.exist;
            Joi.settings.skipFunctions = false;
            done();
        });
    });

    it('should work when the skipFunctions setting is disabled', function (done) {

        Joi.settings.skipFunctions = false;
        var schema = { username: Joi.types.String() };
        var input = { username: 'test', func: function() { } };

        Joi.validate(input, schema, function (err) {

            expect(err).to.exist;
            done();
        });
    });

    it('should work when the saveConversions setting is enabled', function (done) {

        Joi.settings.saveConversions = true;
        var schema = { item: Joi.types.Number() };
        var input = { item: '1' };

        Joi.validate(input, schema, function (err) {

            expect(err).to.not.exist;
            expect(input.item).to.equal(1);
            Joi.settings.saveConversions = false;
            done();
        });
    });

    it('should work when the saveConversions setting is disabled', function (done) {

        Joi.settings.saveConversions = false;
        var schema = { item: Joi.types.Number() };
        var input = { item: '1' };

        Joi.validate(input, schema, function (err) {

            expect(err).to.not.exist;
            expect(input.item).to.equal('1');
            done();
        });
    });

    it('should display correct processed pluralization messsage when skipFunctions is enabled', function (done) {

        Joi.settings.skipFunctions = true;
        var schema = { username: Joi.types.String() };
        var input = { username: 'test', item1: 'test', 'item2': 'test' };

        Joi.validate(input, schema, function (err) {

            expect(err).to.exist;
            expect(err.message).to.contain('keys');
            Joi.settings.skipFunctions = false;
            done();
        });
    });
});


