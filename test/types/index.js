// Load modules

var Lab = require('lab');
var Joi = require('../../lib');


// Declare internals

var internals = {};


// Test shortcuts

var expect = Lab.expect;
var before = Lab.before;
var after = Lab.after;
var describe = Lab.experiment;
var it = Lab.test;


describe('Types', function () {

    it('should have a String key', function (done) {

        expect(Joi.types.String).to.exist;
        done();
    });

    it('should have a Number key', function (done) {

        expect(Joi.types.Number).to.exist;
        done();
    });

    it('should have a Boolean key', function (done) {

        expect(Joi.types.Boolean).to.exist;
        done();
    });

    it('should have an Array key', function (done) {

        expect(Joi.types.Array).to.exist;
        done();
    });

    describe('#validate', function () {

        it('should validate a string value on an object', function (done) {

            var object = {
                testme: 'valid'
            };

            var validator = function () {

                return true;
            };

            expect(Joi.types.validate('testme', 'String', object, validator)).to.equal(true);
            done();
        });

        it('should convert a value and validate it', function (done) {

            var object = {
                testme: '1'
            };

            var validator = function (val) {

                return val;
            };

            expect(Joi.types.validate('testme', 'Number', object, validator)).to.equal(1);
            done();
        });

        it('should use a placeholder when its provided', function (done) {

            var called = false;
            var object = {
                testme: '1'
            };

            var placeholder = {
                add: function () {
                    called = true;
                }
            };

            var validator = function (value, object, key, errors) {

                errors.add();
                return true;
            };

            expect(Joi.types.validate('testme', 'Number', object, validator, placeholder)).to.equal(true);
            expect(called).to.be.true;
            done();
        });
    });
});