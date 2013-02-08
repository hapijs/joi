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
                [{ }, true],
                [{ hi: true }, true],
                ['', false]
            ], done);
        });

        it('should traverse an object and validate all properties in the top level', function (done) {

            var t = O({
                num: Joi.Types.Number()
            });

            verifyBehavior(t, [
                [{ num: 1 }, true],
                [{ num: [1,2,3] }, false]
            ], done);
        });

        it('should traverse an object and child objects and validate all properties', function (done) {

            var t = O({
                num: Joi.Types.Number(),
                obj: Joi.Types.Object({
                    item: Joi.Types.String()
                })
            });

            verifyBehavior(t, [
                [{ num: 1 }, false],
                [{ num: [1,2,3] }, false],
                [{ num: 1, obj: { item: 'something' }}, true],
                [{ num: 1, obj: { item: 123 }}, false]
            ], done);
        });

        it('should traverse an object several levels', function (done) {

            var t = O({
                obj: Joi.Types.Object({
                    obj: Joi.Types.Object({
                        obj: Joi.Types.Object({
                            item: Joi.Types.Boolean()
                        })
                    })
                })
            });

            verifyBehavior(t, [
                [{ num: 1 }, false],
                [{ obj: {} }, false],
                [{ obj: { obj: { }}}, false],
                [{ obj: { obj: { obj: { } }}}, true],
                [{ obj: { obj: { obj: { item: true } }}}, true],
                [{ obj: { obj: { obj: { item: 10 } }}}, false]
            ], done);
        });
    });
});

