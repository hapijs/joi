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
    
    it('should skip functions if skipFunctions is set to true', function (done) {
        var prev = Joi.settings.skipFunctions;
        Joi.settings.skipFunctions = true;
        
        var obj = {
            a: 10,
            b: 'a',
            c: 'joe@example.com',
            test: function(){}
        };

        Joi.validate(obj, config, function (err) {

            Joi.settings.skipFunctions = prev;
            expect(err).to.exist;
            done();
        });
    });
    
    it('should report multiple unspecified inputs using plural grammar', function (done) {

        var obj = {
            a: 10,
            b: 'a',
            c: 'joe@example.com',
            d: 'ohai',
            e: 'there'
        };

        Joi.validate(obj, config, function (err) {

            expect(err).to.exist;
            done();
        });
    });
    
    it('should return error using saveConversions', function (done) {

        var prev = Joi.settings.saveConversions;
        Joi.settings.saveConversions = true;
        
        var obj = {
            a: 10,
            b: 'a',
            c: 'joe@example.com'
        };

        Joi.validate(obj, config, function (err) {

            Joi.settings.saveConversions = prev;
            expect(err).to.exist;
            done();
        });
    });
    
    it('should return error on zero matching and one non-matching key', function (done) {

        var obj = {
            d: 1000
        };

        Joi.validate(obj, config, function (err) {

            expect(err).to.exist;
            done();
        });
    });
});


