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

var RefClass = function () {};

var AnotherClass = function () {};

var ExtendedClass = function () {};
ExtendedClass.prototype = new RefClass();

describe('Extends', function () {

    var Extends = Joi.Types.Extends;

    it('should have mixins', function (done) {
        var result = Extends();

        expect(result.validate).to.exist;
        done();
    });

    describe('#validate', function () {

        it('should work', function (done) {

            expect(function () {
                var e = Extends(RefClass);
                var result = e.validate(ExtendedClass);
            }).to.not.throw;
            done();
        });

        it('should, by default, allow undefined', function (done) {

            verifyBehavior(Extends(), [
                [undefined, true]
            ], done);
        });

        it('should, when .required(), deny undefined', function (done) {

            verifyBehavior(Extends().required(), [
                [undefined, false]
            ], done);
        });

        it('should return false for non subclasses', function (done) {

            var t = Extends(RefClass);
            var result = t.validate(AnotherClass);
            expect(result).to.exist;
            expect(result).to.equal(false);
            done();
        });


    });

    it('should instantiate separate copies on invocation', function (done) {

        var result1 = Extends(RefClass);
        var result2 = Extends(RefClass);

        expect(Object.keys(result1)).to.not.equal(Object.keys(result2));
        done();
    });

    it('should inherit functions from BaseType', function (done) {

        var fns = ['required', 'add'];

        for (var i in fns) {
            expect(Extends(RefClass)[fns[i]]).to.exist;
        }
        done();
    });

    it('should show resulting object with #valueOf', function (done) {

        var result = Extends(RefClass);
        expect(result.valueOf()).to.exist;
        done();
    });
});