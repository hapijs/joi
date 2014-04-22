// Load modules

var Lab = require('lab');
var Joi = require('../lib');


// Declare internals

var internals = {};


// Test shortcuts

var expect = Lab.expect;
var before = Lab.before;
var after = Lab.after;
var describe = Lab.experiment;
var it = Lab.test;


describe('errors', function () {

    it('returns a full path to an error value on an array', function (done) {

        var schema = Joi.array().includes(Joi.array().includes({ x: Joi.number() }));
        var input = [
            [{ x: 1 }],
            [{ x: 1 }, { x: 'a' }]
        ];

        schema.validate(input, function (err, value) {

            expect(err).to.exist;
            expect(err.details[0].path).to.equal('1');
            done();
        });
    });

    it('returns a full path to an error value on an object', function (done) {

        var schema = {
            x: Joi.array().includes({ x: Joi.number() })
        };

        var input = {
            x: [{ x: 1 }, { x: 'a' }]
        };

        Joi.validate(input, schema, function (err, value) {

            expect(err).to.exist;
            expect(err.details[0].path).to.equal('x.1');
            done();
        });
    });
});
