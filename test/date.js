// Load modules

var Lab = require('lab');
var Joi = require('../lib');
var Helper = require('./helper');


// Declare internals

var internals = {};


// Test shortcuts

var expect = Lab.expect;
var before = Lab.before;
var after = Lab.after;
var describe = Lab.experiment;
var it = Lab.test;


describe('date', function () {

    it('fails on boolean', function (done) {

        var schema = Joi.date();
        Helper.validate(schema, [
            [true, false],
            [false, false]
        ], done);
    });

    it('matches specific date', function (done) {

        var now = Date.now();
        Joi.date().valid(new Date(now)).validate(new Date(now), function (err, value) {

            expect(err).to.not.exist;
            done();
        });
    });

    it('errors on invalid input and convert disabled', function (done) {

        Joi.date().options({ convert: false }).validate('1-1-2013 UTC', function (err, value) {

            expect(err).to.exist;
            expect(err.message).to.equal('value must be a number of milliseconds or valid date string');
            done();
        });
    });

    it('validates date', function (done) {

        Joi.date().validate(new Date(), function (err, value) {

            expect(err).to.not.exist;
            done();
        });
    });

    it('validates millisecond date as a string', function (done) {

        var now = new Date();
        var mili = now.getTime();

        Joi.date().validate(mili.toString(), function (err, value) {

            expect(err).to.not.exist;
            expect(value).to.be.eql(now);
            done();
        });
    });

    describe('#validate', function () {

        it('validates min', function (done) {

            Helper.validate(Joi.date().min('1-1-2000 UTC'), [
                ['1-1-2001 UTC', true],
                ['1-1-2000 UTC', true],
                [0, false],
                ["0", false],
                ["-1", false],
                ['1-1-1999 UTC', false]
            ], done);
        });

        it('validates max', function (done) {

            Helper.validate(Joi.date().max('1-1-1970 UTC'), [
                ['1-1-1971 UTC', false],
                ['1-1-1970 UTC', true],
                [0, true],
                [1, false],
                ["0", true],
                ["-1", true],
                ['1-1-2014 UTC', false]
            ], done);
        });

        it('validates only valid dates', function (done) {

            Helper.validate(Joi.date(), [
                ['1-1-2013 UTC', true],
                ['not a valid date', false],
                [new Date('not a valid date'), false]
            ], done);
        });
    });
});
