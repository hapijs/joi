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
});


