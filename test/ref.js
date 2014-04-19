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


describe('ref', function () {

    it('uses ref as a valid value', function (done) {

        var schema = Joi.object({
            a: Joi.ref('b'),
            b: Joi.any()
        });

        schema.validate({ a: 5, b: 6 }, function (err, value) {

            expect(err).to.exist;
            expect(err.message).to.equal('the value of a must be one of ref:b');

            Validate(schema, [
                [{ a: 5 }, false],
                [{ b: 5 }, true],
                [{ a: 5, b: 5 }, true],
                [{ a: '5', b: '5' }, true]
            ]);

            done();
        });
    });

    it('uses ref with nested keys as a valid value', function (done) {

        var schema = Joi.object({
            a: Joi.ref('b.c'),
            b: {
                c: Joi.any()
            }
        });

        schema.validate({ a: 5, b: 5 }, function (err, value) {

            expect(err).to.exist;
            expect(err.message).to.equal('the value of a must be one of ref:b.c');

            Validate(schema, [
                [{ a: 5 }, false],
                [{ b: { c: 5 } }, true],
                [{ a: 5, b: { c: 6 } }, false],
                [{ a: '5', b: { c: '5' } }, true]
            ]);

            done();
        });
    });
});