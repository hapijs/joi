// Load modules

var Lab = require('lab');
var Joi = require('../lib');
var Helper = require('./helper');


// Declare internals

var internals = {};


// Test shortcuts

var lab = exports.lab = Lab.script();
var before = lab.before;
var after = lab.after;
var describe = lab.describe;
var it = lab.it;
var expect = Lab.expect;


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

            Helper.validate(Joi.date().min('1-1-2012'), [
                ['1-1-2013', true],
                ['1-1-2012', true],
                [0, false],
                ['1-1-2000', false]
            ], done);
        });

        it('validates max', function (done) {

            Helper.validate(Joi.date().max('1-1-2013'), [
                ['1-1-2013', true],
                ['1-1-2012', true],
                [0, true],
                ['1-1-2014', false]
            ], done);
        });

        it('validates only valid dates', function (done) {

            Helper.validate(Joi.date(), [
                ['1-1-2013', true],
                ['not a valid date', false],
                [new Date('not a valid date'), false]
            ], done);
        });

        describe('#iso', function() {

            it('validates isoDate', function (done) {

                Helper.validate(Joi.date().iso(), [
                    ['2013-06-07T14:21:46.295Z', true],
                    ['2013-06-07T14:21:46.295Z0', false],
                    ['2013-06-07T14:21:46.295+07:00', true],
                    ['2013-06-07T14:21:46.295+07:000', false],
                    ['2013-06-07T14:21:46.295-07:00', true],
                    ['2013-06-07T14:21:46Z', true],
                    ['2013-06-07T14:21:46Z0', false],
                    ['2013-06-07T14:21:46+07:00', true],
                    ['2013-06-07T14:21:46-07:00', true],
                    ['2013-06-07T14:21Z', true],
                    ['2013-06-07T14:21+07:00', true],
                    ['2013-06-07T14:21+07:000', false],
                    ['2013-06-07T14:21-07:00', true],
                    ['2013-06-07T14:21Z+7:00', false],
                    ['2013-06-07', true],
                    // ['2013-06-07T', false], // These 2 lines should be rejected but moment accepts it, see joi#428
                    // ['2013-06-07T14:21', false],
                    ['1-1-2013', false]
                ], done);
            });

            it('validates isoDate with a friendly error message', function (done) {

                var schema = { item: Joi.date().iso() };
                Joi.compile(schema).validate({ item: 'something' }, function (err, value) {

                    expect(err.message).to.contain('must be a valid ISO 8601 date');
                    done();
                });
            });
        });

        describe('#format', function () {

            it('validates custom format', function (done) {

                Helper.validate(Joi.date().format('DD#YYYY$MM'), [
                    ['07#2013$06', true],
                    ['2013-06-07', false]
                ], done);
            });

            it('validates several custom formats', function (done) {

                Helper.validate(Joi.date().format(['DD#YYYY$MM', 'YY|DD|MM']), [
                    ['13|07|06', true],
                    ['2013-06-07', false]
                ], done);
            });

            it('fails with bad formats', function (done) {

                expect(function () {

                    Joi.date().format(true);
                }).to.throw('Invalid format');

                expect(function () {

                    Joi.date().format(['YYYYMMDD', true]);
                }).to.throw('Invalid format');
                done();
            });
        });
    });
});
