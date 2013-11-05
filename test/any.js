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


describe('Types', function () {

    describe('Any', function () {

        var Any = Joi.types.Any;

        describe('#with', function () {

            it('returns error when related type not found', function (done) {

                var schema = Any().with('test');
                expect(schema.validate('test')).to.exist;
                done();
            });

            it('should throw an error when a parameter is not a string', function (done) {

                try {
                    b.with({});
                    var error = false;
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

            it('fails when without set on root', function (done) {

                var b = Any();
                var result = b.without('test');

                expect(result.validate('test')).to.exist;
                done();
            });

            it('should throw an error when a parameter is not a string', function (done) {

                try {
                    b.without({});
                    var error = false;
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

            it('fails when no parent object is provided', function (done) {

                var b = Any();
                var result = b.rename('test');

                expect(result.validate('test')).to.exist;
                done();
            });

            it('allows renaming multiple times with multiple enabled', function (done) {

                var schema = {
                    test1: Joi.types.String().rename('test'),
                    test2: Joi.types.String().rename('test', { multiple: true })
                };

                var err = Joi.validate({ test1: 'a', test2: 'b' }, schema);
                expect(err).to.not.exist;
                done();
            });

            it('errors renaming multiple times with multiple disabled', function (done) {

                var schema = {
                    test1: Joi.types.String().rename('test'),
                    test2: Joi.types.String().rename('test')
                };

                var err = Joi.validate({ test1: 'a', test2: 'b' }, schema);
                expect(err).to.exist;
                done();
            });

            it('with override disabled should not allow overwriting existing value', function (done) {

                var schema = {
                    test: Joi.types.String().rename('test1')
                };

                expect(Joi.validate({ test: 'b', test1: 'a' }, schema)).to.exist;
                done();
            });

            it('with override enabled should allow overwriting existing value', function (done) {

                var schema = {
                    test: Joi.types.String().rename('test1', { override: true }),
                    test1: Any()
                };

                var err = Joi.validate({ test: 'b', test1: 'a' }, schema);
                expect(err).to.not.exist;
                done();
            });
        });

        describe('#description', function () {

            it('sets the description', function (done) {

                var b = Any();
                b.description('my description');
                expect(b.description).to.equal('my description');

                done();
            });
        });

        describe('#notes', function () {

            it('sets the notes', function (done) {

                var b = Any();
                b.notes('my notes');
                expect(b.notes).to.deep.equal(['my notes']);

                done();
            });
        });

        describe('#tags', function () {

            it('sets the tags', function (done) {

                var b = Any();
                b.tags(['tag1', 'tag2']);
                expect(b.tags).to.include('tag1');
                expect(b.tags).to.include('tag2');

                done();
            });
        });
    });
});

