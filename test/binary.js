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


describe('binary', function () {

    it('converts a string to a buffer', function (done) {

        Joi.binary().validate('test', function (err, value) {

            expect(err).to.not.exist;
            expect(value instanceof Buffer).to.equal(true);
            expect(value.length).to.equal(4);
            expect(value.toString('utf8')).to.equal('test');
            done();
        });
    });

    it('validates allowed buffer content', function (done) {

        var hello = new Buffer('hello');
        var schema = Joi.binary().valid(hello);

        Validate(schema, [
            ['hello', true],
            [hello, true],
            [new Buffer('hello'), true],
            ['goodbye', false],
            [new Buffer('goodbye'), false],
            [new Buffer('HELLO'), false]
        ]);

        done();
    });

    describe('#validate', function () {

        it('returns an error when a non-buffer or non-string is used', function (done) {

            Joi.binary().validate(5, function (err, value) {

                expect(err).to.exist;
                expect(err.message).to.equal('value must be a buffer or a string');
                done();
            });
        });

        it('accepts a buffer object', function (done) {

            var schema = {
                buffer: Joi.binary
            };

            Joi.binary().validate(new Buffer('hello world'), function (err, value) {

                expect(err).to.not.exist;
                expect(value.toString('utf8')).to.equal('hello world');
                done();
            });
        });
    });

    describe('#encoding', function () {

        it('applies encoding', function (done) {

            var schema = Joi.binary().encoding('base64');
            var input = new Buffer('abcdef');
            schema.validate(input.toString('base64'), function (err, value) {

                expect(err).to.not.exist;
                expect(value instanceof Buffer).to.equal(true);
                expect(value.toString()).to.equal('abcdef');
                done();
            });
        });

        it('throws when encoding is not a string', function (done) {

            expect(function () {

                Joi.binary().encoding(1.2);
            }).to.throw('encoding must be a string');
            done();
        });
    });

    describe('#min', function () {

        it('validates buffer size', function (done) {

            var schema = Joi.binary().min(5);
            Validate(schema, [
                [new Buffer('testing'), true],
                [new Buffer('test'), false]
            ]);
            done();
        });

        it('throws when min is not a number', function (done) {

            expect(function () {

                Joi.binary().min('a');
            }).to.throw('limit must be a positive integer');
            done();
        });

        it('throws when min is not an integer', function (done) {

            expect(function () {

                Joi.binary().min(1.2);
            }).to.throw('limit must be a positive integer');
            done();
        });
    });

    describe('#max', function () {

        it('validates buffer size', function (done) {

            var schema = Joi.binary().max(5);
            Validate(schema, [
                [new Buffer('testing'), false],
                [new Buffer('test'), true]
            ]);
            done();
        });

        it('throws when max is not a number', function (done) {

            expect(function () {

                Joi.binary().max('a');
            }).to.throw('limit must be a positive integer');
            done();
        });

        it('throws when max is not an integer', function (done) {

            expect(function () {

                Joi.binary().max(1.2);
            }).to.throw('limit must be a positive integer');
            done();
        });
    });

    describe('#length', function () {

        it('validates buffer size', function (done) {

            var schema = Joi.binary().length(4);
            Validate(schema, [
                [new Buffer('test'), true],
                [new Buffer('testing'), false]
            ]);
            done();
        });

        it('throws when length is not a number', function (done) {

            expect(function () {

                Joi.binary().length('a');
            }).to.throw('limit must be a positive integer');
            done();
        });

        it('throws when length is not an integer', function (done) {

            expect(function () {

                Joi.binary().length(1.2);
            }).to.throw('limit must be a positive integer');
            done();
        });
    });
});
