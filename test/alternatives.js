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
            var err = Joi.validate(value, schema, { modify: true });
            expect(err).to.not.exist;
            expect(value.a).to.equal(5);
            done();
        });
    });
});
