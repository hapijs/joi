// Load modules

var Chai = require('chai');
var Joi = process.env.TEST_COV ? require('../../lib-cov') : require('../../lib');


// Declare internals

var internals = {};


// Test shortcuts

var expect = Chai.expect;


describe('Types', function () {

    describe('Boolean', function () {

        var B = Joi.types.Boolean;

        it('should have mixins', function (done) {

            var result = B();
            expect(result.validate).to.exist;
            done();
        });

        describe('#convert', function () {

            it('should convert a string to a boolean', function (done) {

                var result = B().convert('true');
                expect(result).to.equal(true);
                done();
            });

            it('should not convert a number to a boolean', function (done) {

                var result = B().convert(1);
                expect(result).to.equal(1);
                done();
            });
        });
    });
});

