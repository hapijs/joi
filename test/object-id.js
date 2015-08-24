// Load modules

var Lab = require('lab');
var Code = require('code');
var Joi = require('../lib');
var Helper = require('./helper');
var ObjectID = require('bson').ObjectID;


// Declare internals

var internals = {};


// Test shortcuts

var lab = exports.lab = Lab.script();
var before = lab.before;
var after = lab.after;
var describe = lab.describe;
var it = lab.it;
var expect = Code.expect;


describe('objectId', function () {

    it('converts a string to an ObjectID', function (done) {

        Joi.objectId().validate('5527c23610fe8c78deebdb4d', function (err, value) {

            expect(err).to.not.exist();

            expect(value).instanceof(ObjectID);
            expect(value.toString()).to.equal('5527c23610fe8c78deebdb4d');
            done();
        });
    });

    it('errors on a number', function (done) {

        Joi.objectId().validate(1, function (err, value) {

            expect(err).to.exist();
            expect(value).to.equal(1);
            done();
        });
    });

    describe('#validate', function () {

        it('converts string values and validates', function (done) {

            var rule = Joi.objectId();
            Helper.validate(rule, [
                ['551b37120fabf0c6e6000059', true],
                ['551b37120fabf0c6e6000060', true],
                ['a12b3c', false],
                ['123xyz', false],
                [1234, false],
                [true, false],
                [null, false]
            ], done);
        });

        it('should handle work with required', function (done) {

            var rule = Joi.objectId().required();
            Helper.validate(rule, [
                ['551b37120fabf0c6e6000059', true],
                ['551b37120fabf0c6e6000060', true],
                ['a12b3c', false],
                ['123xyz', false],
                [1234, false],
                [true, false],
                [null, false]
            ], done);
        });

        it('should handle work with allow', function (done) {

            var rule = Joi.objectId().allow('551b37120fabf0c6e6000060');
            Helper.validate(rule, [
                ['551b37120fabf0c6e6000059', true],
                ['551b37120fabf0c6e6000060', true],
                ['a12b3c', false],
                ['123xyz', false],
                [1234, false],
                [true, false],
                [null, false]
            ], done);
        });

        it('should handle work with invalid', function (done) {

            var rule = Joi.objectId().invalid('551b37120fabf0c6e6000059');
            Helper.validate(rule, [
                ['551b37120fabf0c6e6000059', false],
                ['551b37120fabf0c6e6000060', true],
                ['a12b3c', false],
                ['123xyz', false],
                [1234, false],
                [true, false],
                [null, false]
            ], done);
        });

        it('should handle work with invalid and null allowed', function (done) {

            var rule = Joi.objectId().invalid('551b37120fabf0c6e6000059').allow(null);
            Helper.validate(rule, [
                ['551b37120fabf0c6e6000059', false],
                ['551b37120fabf0c6e6000060', true],
                ['a12b3c', false],
                ['123xyz', false],
                [1234, false],
                [true, false],
                [null, true]
            ], done);
        });

        it('should handle work with allow and invalid', function (done) {

            var rule = Joi.objectId().invalid('551b37120fabf0c6e6000059').allow('551b37120fabf0c6e6000060');
            Helper.validate(rule, [
                ['551b37120fabf0c6e6000059', false],
                ['551b37120fabf0c6e6000060', true],
                ['a12b3c', false],
                ['123xyz', false],
                [1234, false],
                [true, false],
                [null, false]
            ], done);
        });

        it('should handle work with allow, invalid, and null allowed', function (done) {

            var rule = Joi.objectId().invalid('551b37120fabf0c6e6000059').allow('551b37120fabf0c6e6000060').allow(null);
            Helper.validate(rule, [
                ['551b37120fabf0c6e6000059', false],
                ['551b37120fabf0c6e6000060', true],
                ['a12b3c', false],
                ['123xyz', false],
                [1234, false],
                [true, false],
                [null, true]
            ], done);
        });
    });
});
