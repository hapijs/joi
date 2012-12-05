var should = require("should");

var Types = process.env.TEST_COV ? require('../../lib-cov/types') : require('../../lib/types');
var BaseType = Types.Base;
var Utils = require("../../lib/utils");
var sys = require("sys");

describe("BaseType", function () {

    var B = Types.Base;

    describe('#toString', function () {

        it('should return JSON string of values', function (done) {

            var b = new B().valid('test');

            b.toString().should.include('test');
            done();
        });
    });

    describe('#add', function () {

        it('should throw an error when null is passed in', function (done) {

            (function () {

                var b = new B();
                var result = b.add(null);
            }).should.throw();
            done();
        });

        it('should not throw an error when valid values are provided', function (done) {

            (function () {

                var b = new B();
                var result = b.add('test', true);
            }).should.not.throw();
            done();
        });
    });

    describe('#exists', function () {

        it('should return false when null is passed in', function (done) {

            var b = new B();
            var result = b.exists(null);

            result.should.equal(false);
            done();
        });

        it('should return true when passed true', function (done) {

            var b = new B();
            var result = b.exists(true);

            result.should.equal(true);
            done();
        });
    });

    describe('#with', function () {

        it('should set related check', function (done) {

            var b1 = new B();
            var b2 = new B();
            var result = b1.with(b2);

            result.__checks.should.include('with');
            done();
        });

        it('should return false when related type not found', function (done) {

            var b1 = new B();
            var b2 = new B();
            var result = b1.with(b2);

            result.validate('test').should.equal(false);
            done();
        });

        it('should return true when peers are null', function (done) {

            var b1 = new B();
            var result = b1._with(null);

            result(null).should.equal(true);
            done();
        });
    });

    describe('#without', function () {

        it('should set related check', function (done) {

            var b1 = new B();
            var b2 = new B();
            var result = b1.without(b2);

            result.__checks.should.include('without');
            done();
        });

        it('should return true when related type not found', function (done) {

            var b1 = new B();
            var b2 = new B();
            var result = b1.without(b2);

            result.validate('test').should.equal(true);
            done();
        });
    });

    describe('#rename', function () {

        it('should rename the type', function (done) {

            var b = new B();
            var result = b.rename('test');

            result.validate('test').should.equal(true);
            done();
        });

        it('using allowMult enabled should allow renaming multiple times', function (done) {

            var b = new B();
            var result = b.rename('test1', { allowMult: true });

            result.validate({ test: true}, { test: true }, 'test', { add: function() {}, _renamed: { test1: true }}).should.equal(true);
            done();
        });

        it('with allowMult disabled should not allow renaming multiple times', function (done) {

            var b = new B();
            var result = b.rename('test1', { allowMult: false });

            result.validate({ test: true}, { test: true }, 'test', { add: function() {}, _renamed: { test1: true }}).should.equal(false);
            done();
        });

        it('with allowOverwrite disabled should not allow overwriting existing value', function (done) {

            var b = new B();
            var result = b.rename('test1', { allowOverwrite: false });

            result.validate({ test1: true}, { test1: true }, { test1: true}).should.equal(false);
            done();
        });

        it('with allowOverwrite enabled should allow overwriting existing value', function (done) {

            var b = new B();
            var result = b.rename('test1', { allowOverwrite: true, deleteOrig: true });

            result.validate({ test1: true}, { test1: true }, { test1: true}).should.equal(true);
            done();
        });
    });

    describe('#description', function () {

        it('sets the description', function (done) {

            var b = new B();
            b.description('my description');
            b.description.should.equal('my description');

            done();
        });
    });

    describe('#notes', function () {

        it('sets the notes', function (done) {

            var b = new B();
            b.notes('my notes');
            b.notes.should.equal('my notes');

            done();
        });
    });

    describe('#tags', function () {

        it('sets the tags', function (done) {

            var b = new B();
            b.tags(['tag1', 'tag2']);
            b.tags.should.include('tag1');
            b.tags.should.include('tag2');

            done();
        });
    });

    describe('#RequestErrorFactory', function () {

        it('adds the error to the request object', function (done) {

            var b = new B();
            var err = new Error('my message');
            var req = {};
            b.RequestErrorFactory(req)(err);

            req.validationErrors.should.include('[ValidationError]: Error: my message');

            done();
        });
    });
});