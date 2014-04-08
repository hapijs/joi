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

        describe('#min', function () {

            it('validates buffer size', function (done) {

                var schema = Joi.buffer().min(5);
                Validate(schema, [
                    [new Buffer('testing'), true],
                    [new Buffer('test'), false]
                ]);
                done();
            });

            it('throws when limit is not a number', function (done) {

                expect(function () {

                    Joi.buffer().min('a');
                }).to.throw('limit must be a positive integer');
                done();
            });

            it('throws when limit is not an integer', function (done) {

                expect(function () {

                    Joi.buffer().min(1.2);
                }).to.throw('limit must be a positive integer');
                done();
            });
        });

        describe('#max', function () {

            it('validates buffer size', function (done) {

                var schema = Joi.buffer().max(5);
                Validate(schema, [
                    [new Buffer('testing'), false],
                    [new Buffer('test'), true]
                ]);
                done();
            });

            it('throws when limit is not a number', function (done) {

                expect(function () {

                    Joi.buffer().max('a');
                }).to.throw('limit must be a positive integer');
                done();
            });

            it('throws when limit is not an integer', function (done) {

                expect(function () {

                    Joi.buffer().max(1.2);
                }).to.throw('limit must be a positive integer');
                done();
            });
        });

        describe('#length', function () {

            it('validates buffer size', function (done) {

                var schema = Joi.buffer().length(4);
                Validate(schema, [
                    [new Buffer('test'), true],
                    [new Buffer('testing'), false]
                ]);
                done();
            });

            it('throws when limit is not a number', function (done) {

                expect(function () {

                    Joi.buffer().length('a');
                }).to.throw('limit must be a positive integer');
                done();
            });

            it('throws when limit is not an integer', function (done) {

                expect(function () {

                    Joi.buffer().length(1.2);
                }).to.throw('limit must be a positive integer');
                done();
            });
        });
    });
});
