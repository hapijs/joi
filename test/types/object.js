// Load modules

var Chai = require('chai');
var Joi = process.env.TEST_COV ? require('../../lib-cov') : require('../../lib');
var Object = process.env.TEST_COV ? require('../../lib-cov/types/object') : require('../../lib/types/object');
var Support = require('../support/meta');


// Declare internals

var internals = {};


// Test shortcuts

var expect = Chai.expect;
var verifyBehavior = Support.verifyValidatorBehavior;


describe('Types', function () {

    describe('Object', function () {

        var O = Object; // Joi.types.Object;

        it('should have mixins', function (done) {

            var result = O();
            expect(result.validate).to.exist;
            done();
        });

        it('can convert a json string to an object', function (done) {

            var result = O().convert('{"hi":true}');
            expect(result.hi).to.be.true;
            done();
        });

        it('should validate an object', function (done) {

            var t = O().required();
            verifyBehavior(t, [
                [{ hi: true }, true],
                ['', false]
            ], done);
        });
    });
});

