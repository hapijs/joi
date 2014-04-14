// Load modules

var Lab = require('lab');
var Alternatives = require('../lib/alternatives');
var Joi = require('..');


// Declare internals

var internals = {};


// Test shortcuts

var expect = Lab.expect;
var before = Lab.before;
var after = Lab.after;
var describe = Lab.experiment;
var it = Lab.test;


describe('Types', function () {

    describe('Alternatives', function () {

        it('throws when missing alternatives', function (done) {

            expect(function () {

                new Alternatives();
            }).to.throw('Missing alternatives');
            done();
        });

        it('applies modifiers when higher priority converts', function (done) {

            var schema = {
                a: [
                    Joi.number(),
                    Joi.string()
                ]
            };

            var value = { a: '5' };
            var err = Joi.validate(value, schema, function (err) {

                expect(err).to.not.exist;
                expect(value.a).to.equal(5);
                done();
            });
        });

        it('applies modifiers when lower priority valid is a match', function (done) {

            var schema = {
                a: [
                    Joi.number(),
                    Joi.any().valid('5')
                ]
            };

            var value = { a: '5' };
            var err = Joi.validate(value, schema, function (err) {

                expect(err).to.not.exist;
                expect(value.a).to.equal(5);
                done();
            });
        });

        it('does not apply modifier if alternative fails', function (done) {

            var schema = {
                a: [
                    Joi.object({ b: Joi.any(), d: Joi.number() }).rename('b', 'c'),
                    { b: Joi.any(), d: Joi.string() }
                ]
            };

            var value = { a: { b: 'any', d: 'string' } };
            var err = Joi.validate(value, schema, function (err) {

                expect(err).to.not.exist;
                expect(value.a.b).to.equal('any');
                done();
            });
        });
    });
});
