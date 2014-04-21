// Load modules

var Lab = require('lab');
var Joi = require('..');


// Declare internals

var internals = {};


// Test shortcuts

var expect = Lab.expect;
var before = Lab.before;
var after = Lab.after;
var describe = Lab.experiment;
var it = Lab.test;


describe('alternatives', function () {

    it('fails when no alternatives are provided', function (done) {

        Joi.alternatives.validate('a', function (err, value) {

            expect(err).to.exist;
            expect(err.message).to.equal('no matching alternatives found');
            done();
        });
    });

    it('allows undefined when no alternatives are provided', function (done) {

        Joi.alternatives.validate(undefined, function (err, value) {

            expect(err).to.not.exist;
            done();
        });
    });

    it('applies modifiers when higher priority converts', function (done) {

        var schema = {
            a: [
                Joi.number,
                Joi.string
            ]
        };

        var err = Joi.validate({ a: '5' }, schema, function (err, value) {

            expect(err).to.not.exist;
            expect(value.a).to.equal(5);
            done();
        });
    });

    it('applies modifiers when lower priority valid is a match', function (done) {

        var schema = {
            a: [
                Joi.number,
                Joi.any.valid('5')
            ]
        };

        var err = Joi.validate({ a: '5' }, schema, function (err, value) {

            expect(err).to.not.exist;
            expect(value.a).to.equal(5);
            done();
        });
    });

    it('does not apply modifier if alternative fails', function (done) {

        var schema = {
            a: [
                Joi.object.keys({ c: Joi.any, d: Joi.number }).rename('b', 'c'),
                { b: Joi.any, d: Joi.string }
            ]
        };

        var input = { a: { b: 'any', d: 'string' } };
        var err = Joi.validate(input, schema, function (err, value) {

            expect(err).to.not.exist;
            expect(value.a.b).to.equal('any');
            done();
        });
    });

    describe('#try', function () {

        it('throws when missing alternatives', function (done) {

            expect(function () {

                Joi.alternatives.try();
            }).to.throw('Cannot add other alternatives without at least one schema');
            done();
        });
    });
});
