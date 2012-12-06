// Load modules

var Chai = require('chai');
var Joi = process.env.TEST_COV ? require('../../lib-cov') : require('../../lib');


// Declare internals

var internals = {};


// Test shortcuts

var expect = Chai.expect;


describe('Types', function () {

    describe('Base', function () {

        var B = Joi.types.Base;

        describe('#toString', function () {

            it('should return JSON string of values', function (done) {

                var b = new B().valid('test');

                expect(b.toString()).to.include('test');
                done();
            });
        });

        describe('#add', function () {

            it('should throw an error when null is passed in', function (done) {

                expect(function () {

                    var b = new B();
                    var result = b.add(null);
                }).to.throw;
                done();
            });

            it('should not throw an error when valid values are provided', function (done) {

                expect(function () {

                    var b = new B();
                    var result = b.add('test', true);
                }).to.not.throw;
                done();
            });
        });

        describe('#exists', function () {

            it('should return false when null is passed in', function (done) {

                var b = new B();
                var result = b.exists(null);

                expect(result).to.equal(false);
                done();
            });

            it('should return true when passed true', function (done) {

                var b = new B();
                var result = b.exists(true);

                expect(result).to.equal(true);
                done();
            });
        });

        describe('#with', function () {

            it('should set related check', function (done) {

                var b1 = new B();
                var b2 = new B();
                var result = b1.with(b2);

                expect(result.__checks).to.include('with');
                done();
            });

            it('should return false when related type not found', function (done) {

                var b1 = new B();
                var b2 = new B();
                var result = b1.with(b2);

                expect(result.validate('test')).to.equal(false);
                done();
            });

            it('should return true when peers are null', function (done) {

                var b1 = new B();
                var result = b1._with(null);

                expect(result(null)).to.equal(true);
                done();
            });
        });

        describe('#without', function () {

            it('should set related check', function (done) {

                var b1 = new B();
                var b2 = new B();
                var result = b1.without(b2);

                expect(result.__checks).to.include('without');
                done();
            });

            it('should return true when related type not found', function (done) {

                var b1 = new B();
                var b2 = new B();
                var result = b1.without(b2);

                expect(result.validate('test')).to.equal(true);
                done();
            });
        });

        describe('#rename', function () {

            it('should rename the type', function (done) {

                var b = new B();
                var result = b.rename('test');

                expect(result.validate('test')).to.equal(true);
                done();
            });

            it('using allowMult enabled should allow renaming multiple times', function (done) {

                var b = new B();
                var result = b.rename('test1', { allowMult: true });

                expect(result.validate({ test: true }, { test: true }, 'test', { add: function () { }, _renamed: { test1: true } })).to.equal(true);
                done();
            });

            it('with allowMult disabled should not allow renaming multiple times', function (done) {

                var b = new B();
                var result = b.rename('test1', { allowMult: false });

                expect(result.validate({ test: true }, { test: true }, 'test', { add: function () { }, _renamed: { test1: true } })).to.equal(false);
                done();
            });

            it('with allowOverwrite disabled should not allow overwriting existing value', function (done) {

                var b = new B();
                var result = b.rename('test1', { allowOverwrite: false });

                expect(result.validate({ test1: true }, { test1: true }, { test1: true })).to.equal(false);
                done();
            });

            it('with allowOverwrite enabled should allow overwriting existing value', function (done) {

                var b = new B();
                var result = b.rename('test1', { allowOverwrite: true, deleteOrig: true });

                expect(result.validate({ test1: true }, { test1: true }, { test1: true })).to.equal(true);
                done();
            });
        });

        describe('#description', function () {

            it('sets the description', function (done) {

                var b = new B();
                b.description('my description');
                expect(b.description).to.equal('my description');

                done();
            });
        });

        describe('#notes', function () {

            it('sets the notes', function (done) {

                var b = new B();
                b.notes('my notes');
                expect(b.notes).to.equal('my notes');

                done();
            });
        });

        describe('#tags', function () {

            it('sets the tags', function (done) {

                var b = new B();
                b.tags(['tag1', 'tag2']);
                expect(b.tags).to.include('tag1');
                expect(b.tags).to.include('tag2');

                done();
            });
        });

        describe('#RequestErrorFactory', function () {

            it('adds the error to the request object', function (done) {

                var b = new B();
                var err = new Error('my message');
                var req = {};
                b.RequestErrorFactory(req)(err);

                expect(req.validationErrors).to.include('[ValidationError]: Error: my message');

                done();
            });
        });
    });
});

