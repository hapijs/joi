// Load modules

var Lab = require('lab');
var Joi = require('../../lib');
var Support = require('../support/meta');


// Declare internals

var internals = {};


// Test shortcuts

var expect = Lab.expect;
var before = Lab.before;
var after = Lab.after;
var describe = Lab.experiment;
var it = Lab.test;
var verifyBehavior = Support.verifyValidatorBehavior;

var RefClass = function() {};

var AnotherClass = function() {};

var anInstance = new RefClass();

var notAnInstance = new AnotherClass();


describe('InstanceOf', function () {

    var InstanceOf = Joi.Types.InstanceOf;

    it('should have mixins', function (done) {
        var result = InstanceOf(RefClass);

        expect(result.validate).to.exist;
        done();
    });

    it('should throw error when supplied a non-function', function (done) {
        expect(function () {
            InstanceOf('some string');
        }).to.throw();
        done();
    });

    describe('#validate', function () {

        it('should work', function (done) {

            expect(function () {
                var num = InstanceOf(RefClass);
                var result = num.validate(anInstance);
            }).to.not.throw;
            done();
        });

        it('should, by default, allow undefined', function (done) {

            verifyBehavior(InstanceOf(RefClass), [
                [undefined, true]
            ], done);
        });

        it('should, when .required(), deny undefined', function (done) {

            verifyBehavior(InstanceOf(RefClass).required(), [
                [undefined, false]
            ], done);
        });

        it('should return false for non instances', function (done) {

            var t = InstanceOf(RefClass);
            var result = t.validate(notAnInstance);
            expect(result).to.exist;
            expect(result).to.equal(false);
            done();
        });


    });

    it('should instantiate separate copies on invocation', function (done) {

        var result1 = InstanceOf(RefClass);
        var result2 = InstanceOf(RefClass);

        expect(Object.keys(result1)).to.not.equal(Object.keys(result2));
        done();
    });

    it('should inherit functions from BaseType', function (done) {

        var fns = ['required', 'add'];

        for (var i in fns) {
            expect(InstanceOf(RefClass)[fns[i]]).to.exist;
        }
        done();
    });

    it('should show resulting object with #valueOf', function (done) {

        var result = InstanceOf(RefClass);
        expect(result.valueOf()).to.exist;
        done();
    });
});