// Load modules

var Lab = require('lab');
var Joi = require('../../lib');


// Declare internals

var internals = {};


// Test shortcuts

var expect = Lab.expect;
var before = Lab.before;
var after = Lab.after;
var describe = Lab.experiment;
var it = Lab.test;


describe('Types', function () {

    describe('Base', function () {

        var Base = Joi.types.Base;

        describe('#_test', function () {

            it('should throw an error when null is passed in', function (done) {

                expect(function () {

                    var b = new Base();
                    var result = b._test(null);
                }).to.throw;
                done();
            });

            it('should not throw an error when valid values are provided', function (done) {

                expect(function () {

                    var b = new Base();
                    var result = b._test('test', true);
                }).to.not.throw;
                done();
            });
        });

        describe('#with', function () {

            it('should return false when related type not found', function (done) {

                var b = new Base();
                var result = b.with('test');

                expect(result.validate('test')).to.equal(false);
                done();
            });

            it('should throw an error when a parameter is not a string', function (done) {

                var b = new Base();
                var error = false;
                try {
                    b.with([]);
                    error = false;
                } catch (e) {
                    error = true;
                }
                expect(error).to.equal(true);

                try {
                    b.with({});
                    error = false;
                } catch (e) {
                    error = true;
                }
                expect(error).to.equal(true);

                try {
                    b.with(123);
                    error = false;
                } catch (e) {
                    error = true;
                }
                expect(error).to.equal(true);
                done();
            });
        });

        describe('#without', function () {

            it('should return true when related type not found', function (done) {

                var b = new Base();
                var result = b.without('test');

                expect(result.validate('test')).to.equal(true);
                done();
            });

            it('should throw an error when a parameter is not a string', function (done) {

                var b = new Base();
                var error = false;
                try {
                    b.without([]);
                    error = false;
                } catch (e) {
                    error = true;
                }
                expect(error).to.equal(true);

                try {
                    b.without({});
                    error = false;
                } catch (e) {
                    error = true;
                }
                expect(error).to.equal(true);

                try {
                    b.without(123);
                    error = false;
                } catch (e) {
                    error = true;
                }
                expect(error).to.equal(true);
                done();
            });
        });

        describe('#rename', function () {

            it('should skip rename when no parent object is provided', function (done) {

                var b = new Base();
                var result = b.rename('test');

                expect(result.validate('test')).to.equal(false);
                done();
            });

            it('using allowMult enabled should allow renaming multiple times', function (done) {

                var b = new Base();
                var result = b.rename('test1', { allowMult: true });

                expect(result.validate({ test: true }, { test: true }, 'test', { add: function () { }, _renamed: { test1: true } })).to.equal(true);
                done();
            });

            it('with allowMult disabled should not allow renaming multiple times', function (done) {

                var b = new Base();
                var result = b.rename('test1', { allowMult: false });

                expect(result.validate({ test: true }, { test: true }, 'test', { add: function () { }, addLocalized: function () {}, _renamed: { test1: true } })).to.equal(false);
                done();
            });

            it('with allowOverwrite disabled should not allow overwriting existing value', function (done) {

                var b = new Base();
                var result = b.rename('test1', { allowOverwrite: false });

                expect(result.validate({ test1: true }, { test1: true }, { test1: true })).to.equal(false);
                done();
            });

            it('with allowOverwrite enabled should allow overwriting existing value', function (done) {

                var b = new Base();
                var result = b.rename('test1', { allowOverwrite: true, deleteOrig: true });

                expect(result.validate({ test1: true }, { test1: true }, { test1: true })).to.equal(true);
                done();
            });
        });

        describe('#description', function () {

            it('sets the description', function (done) {

                var b = new Base();
                b.description('my description');
                expect(b.description).to.equal('my description');

                done();
            });
        });

        describe('#notes', function () {

            it('sets the notes', function (done) {

                var b = new Base();
                b.notes('my notes');
                expect(b.notes).to.equal('my notes');

                done();
            });
        });

        describe('#tags', function () {

            it('sets the tags', function (done) {

                var b = new Base();
                b.tags(['tag1', 'tag2']);
                expect(b.tags).to.include('tag1');
                expect(b.tags).to.include('tag2');

                done();
            });
        });
    });
});

