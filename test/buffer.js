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

describe('Types', function () {
    describe('Buffer', function () {
        describe('#_convert', function () {
            it('should convert a string to a buffer', function (done) {
                var result = Joi.buffer()._convert('test');
                expect(result.length).to.equal(4);
                expect(result.toString('utf8')).to.equal('test');
                done();
            });
        });

        describe('#validate', function () {
            it('should return an error when a non-buffer is used', function (done) {
                var schema = {
                    num: Joi.buffer()
                };

                var input = { num: 5 };
                var err = Joi.validate(input, schema);

                expect(err).to.exist;
                expect(err.message).to.equal('the value of num must be a buffer');
                done();
            });

            it('should accept a buffer object', function (done) {
                var schema = {
                    buffer: Joi.buffer()
                };

                var input = { buffer: new Buffer('hello world') };
                var err = Joi.validate(input, schema);

                expect(err).to.not.exist;
                done();
            });
        });
    });
});
