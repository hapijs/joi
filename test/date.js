// Load modules

var Lab = require('lab');
var Joi = require('../lib');
var Validate = require('./helper');


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
        Validate(schema, [
            [true, false],
            [false, false]
        ]);

        done();
    });

    it('matches specific date', function (done) {

        var now = Date.now();
        Joi.date().valid(new Date(now)).validate(new Date(now), function (err, value) {

            expect(err).to.not.exist;
            done();
        });
    });

    it('errors on invalid input and convert disabled', function (done) {

        Joi.date().options({ convert: false }).validate('1-1-2013', function (err, value) {

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

    describe('#validate', function () {

        it('validates min', function (done) {

            Validate(Joi.date().min('1-1-2012'), [
                ['1-1-2013', true],
                ['1-1-2012', true],
                [0, false],
                ['1-1-2000', false]
            ]);
            done();
        });

        it('validates max', function (done) {

            Validate(Joi.date().max('1-1-2013'), [
                ['1-1-2013', true],
                ['1-1-2012', true],
                [0, true],
                ['1-1-2014', false]
            ]);
            done();
        });
    });
});