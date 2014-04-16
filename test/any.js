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


describe('Joi', function () {

    describe('any', function () {

        describe('#strict', function () {

            it('validates without converting', function (done) {

                var schema = Joi.object({
                    array: Joi.array().includes(Joi.string().min(5), Joi.number().min(3))
                }).strict();

                Validate(schema, [
                    [{ array: ['12345'] }, true],
                    [{ array: ['1'] }, false],
                    [{ array: [3] }, true],
                    [{ array: ['12345', 3] }, true]
                ]); done();
            });
        });

        describe('#with', function () {

            it('should throw an error when a parameter is not a string', function (done) {

                try {
                    Joi.object().with({});
                    var error = false;
                } catch (e) {
                    error = true;
                }
                expect(error).to.equal(true);

                try {
                    Joi.object().with(123);
                    error = false;
                } catch (e) {
                    error = true;
                }
                expect(error).to.equal(true);
                done();
            });
        });

        describe('#without', function () {

            it('should throw an error when a parameter is not a string', function (done) {

                try {
                    Joi.object().without({});
                    var error = false;
                } catch (e) {
                    error = true;
                }
                expect(error).to.equal(true);

                try {
                    Joi.object().without(123);
                    error = false;
                } catch (e) {
                    error = true;
                }
                expect(error).to.equal(true);
                done();
            });
        });

        describe('#xor', function () {

            it('should throw an error when a parameter is not a string', function (done) {

                try {
                    Joi.object().xor({});
                    var error = false;
                } catch (e) {
                    error = true;
                }
                expect(error).to.equal(true);

                try {
                    Joi.object().xor(123);
                    error = false;
                } catch (e) {
                    error = true;
                }
                expect(error).to.equal(true);
                done();
            });
        });

        describe('#or', function () {

            it('should throw an error when a parameter is not a string', function (done) {

                try {
                    Joi.object().or({});
                    var error = false;
                } catch (e) {
                    error = true;
                }
                expect(error).to.equal(true);

                try {
                    Joi.object().or(123);
                    error = false;
                } catch (e) {
                    error = true;
                }
                expect(error).to.equal(true);
                done();
            });
        });

        describe('#options', function () {

            it('adds to existing options', function (done) {

                var a = { b: Joi.number().strict().options({ convert: true }) };
                var c = { b: '2' };
                Joi.validate(c, a, function (err, value) {

                    expect(err).to.not.exist;
                    expect(value.b).to.equal(2);
                    done();
                });
            });
        });

        describe('#strict', function () {

            it('adds to existing options', function (done) {

                var a = { b: Joi.number().options({ convert: true }).strict() };
                var c = { b: '2' };
                Joi.validate(c, a, function (err, value) {

                    expect(err).to.exist;
                    expect(value.b).to.equal('2');
                    done();
                });
            });
        });

        describe('#default', function () {

            it('sets the value', function (done) {

                var schema = { foo: Joi.string().default('test') };
                var input = {};

                Joi.validate(input, schema, function (err, value) {

                    expect(err).to.not.exist;
                    expect(value.foo).to.equal('test');

                    done();
                });
            });

            it('should not overide a value when value is given', function (done) {

                var schema = { foo: Joi.string().default('bar') };
                var input = { foo: 'test' };

                Joi.validate(input, schema, function (err, value) {

                    expect(err).to.not.exist;
                    expect(value.foo).to.equal('test');

                    done();
                });
            });
        });

        describe('#description', function () {

            it('sets the description', function (done) {

                var b = Joi.any().description('my description');
                expect(b._description).to.equal('my description');

                done();
            });

            it('throws when description is missing', function (done) {

                expect(function () {

                    Joi.any().description();
                }).to.throw('Description must be a non-empty string');
                done();
            });
        });

        describe('#notes', function () {

            it('sets the notes', function (done) {

                var b = Joi.any().notes(['a']).notes('my notes');
                expect(b._notes).to.deep.equal(['a', 'my notes']);

                done();
            });

            it('throws when notes are missing', function (done) {

                expect(function () {

                    Joi.any().notes();
                }).to.throw('Notes must be a non-empty string or array');
                done();
            });

            it('throws when notes are invalid', function (done) {

                expect(function () {

                    Joi.any().notes(5);
                }).to.throw('Notes must be a non-empty string or array');
                done();
            });
        });

        describe('#tags', function () {

            it('sets the tags', function (done) {

                var b = Joi.any().tags(['tag1', 'tag2']).tags('tag3');
                expect(b._tags).to.include('tag1');
                expect(b._tags).to.include('tag2');
                expect(b._tags).to.include('tag3');

                done();
            });

            it('throws when tags are missing', function (done) {

                expect(function () {

                    Joi.any().tags();
                }).to.throw('Tags must be a non-empty string or array');
                done();
            });

            it('throws when tags are invalid', function (done) {

                expect(function () {

                    Joi.any().tags(5);
                }).to.throw('Tags must be a non-empty string or array');
                done();
            });
        });

        describe('#_validate', function () {

            it('checks value after conversion', function (done) {

                var schema = Joi.number().invalid(2);
                schema.validate('2', { abortEarly: false }, function (err, value) {

                    expect(err).to.exist;
                    done();
                });
            });
        });

        describe('Set', function () {

            describe('#values', function (){

                it('returns array', function (done) {

                    var a = Joi.any();
                    var b = a.required();
                    expect(a._valids.values().length).to.equal(1);
                    expect(b._valids.values().length).to.equal(0);
                    expect(a._invalids.values().length).to.equal(1);
                    expect(b._invalids.values().length).to.equal(2);
                    done();
                });
            });

            describe('#toString', function () {

                it('includes undefined', function (done) {

                    var b = Joi.any();
                    expect(b._valids.toString(true)).to.equal('undefined');
                    done();
                });
            });
        });
    });
});

