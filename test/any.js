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

        it('validates both valid() and with()', function (done) {

            var b = Joi.object({
                first: Joi.any().valid('value').with('second'),
                second: Joi.any()
            });
            Validate(b, [[{ first: 'value' }, false]]);

            done();
        });

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

            it('fails when with set on root', function (done) {

                var b = Joi.any();
                var result = b.with('test');

                result.validate('test', function (err) {

                    expect(err).to.exist;
                    done();
                });
            });

            it('returns error when related type not found', function (done) {

                Validate(Joi.any().with('test'), [['test', false]])
                done();
            });

            it('should throw an error when a parameter is not a string', function (done) {

                try {
                    Joi.any().with({});
                    var error = false;
                } catch (e) {
                    error = true;
                }
                expect(error).to.equal(true);

                try {
                    Joi.any().with(123);
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

                var b = Joi.any();
                var result = b.without('test');

                result.validate('test', function (err) {

                    expect(err).to.exist;
                    done();
                });
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

        describe('#xor', function () {

            it('fails when without set on root', function (done) {

                var b = Joi.any();
                var result = b.xor('test');

                result.validate('test', function (err) {

                    expect(err).to.exist;
                    done();
                });
            });

            it('should throw an error when a parameter is not a string', function (done) {

                try {
                    b.xor({});
                    var error = false;
                } catch (e) {
                    error = true;
                }
                expect(error).to.equal(true);

                try {
                    b.xor(123);
                    error = false;
                } catch (e) {
                    error = true;
                }
                expect(error).to.equal(true);
                done();
            });
        });

        describe('#or', function () {

            it('fails when without set on root', function (done) {

                var b = Joi.any();
                var result = b.or('test');

                result.validate('test', function (err) {

                    expect(err).to.exist;
                    done();
                });
            });

            it('should throw an error when a parameter is not a string', function (done) {

                try {
                    b.or({});
                    var error = false;
                } catch (e) {
                    error = true;
                }
                expect(error).to.equal(true);

                try {
                    b.or(123);
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

                var schema = Joi.any().rename('test');
                schema.validate('test', function (err) {

                    expect(err).to.exist;
                    done();
                });
            });

            it('allows renaming multiple times with multiple enabled', function (done) {

                var schema = {
                    test1: Joi.string().rename('test'),
                    test2: Joi.string().rename('test', { multiple: true })
                };

                Joi.validate({ test1: 'a', test2: 'b' }, schema, function (err) {

                    expect(err).to.not.exist;
                    done();
                });
            });

            it('errors renaming multiple times with multiple disabled', function (done) {

                var schema = {
                    test1: Joi.string().rename('test'),
                    test2: Joi.string().rename('test')
                };

                Joi.validate({ test1: 'a', test2: 'b' }, schema, function (err) {

                    expect(err).to.exist;
                    done();
                });
            });

            it('with override disabled should not allow overwriting existing value', function (done) {

                var schema = {
                    test: Joi.string().rename('test1')
                };

                Joi.validate({ test: 'b', test1: 'a' }, schema, function (err) {

                    expect(err).to.exist;
                    done();
                });
            });

            it('with override enabled should allow overwriting existing value', function (done) {

                var schema = {
                    test: Joi.string().rename('test1', { override: true }),
                    test1: Joi.any()
                };

                Joi.validate({ test: 'b', test1: 'a' }, schema, function (err) {

                    expect(err).to.not.exist;
                    done();
                });
            });

            it('renames when data is nested in an array via includes', function (done) {

                var schema = {
                    arr: Joi.array().includes(Joi.object({
                        uno: Joi.string().rename('one'),
                        dos: Joi.string().rename('two')
                    }))
                };

                var data = { arr: [{ uno: '1', dos: '2' }] };
                Joi.validate(data, schema, function (err) {

                    expect(err).to.not.exist;
                    expect(data.arr[0].one).to.equal('1');
                    expect(data.arr[0].two).to.equal('2');
                    done();
                });
            });

            it('applies rename and validation in the correct order regardless of key order', function (done) {

                var schema1 = { b: Joi.any().rename('a', { move: true }), a: Joi.number() };
                var value1 = { b: '5' };

                Joi.validate(value1, schema1, { modify: true }, function (err1) {

                    expect(err1).to.not.exist;
                    expect(value1.b).to.not.exist;
                    expect(value1.a).to.equal(5);

                    var schema2 = { a: Joi.number(), b: Joi.any().rename('a', { move: true }) };
                    var value2 = { b: '5' };

                    Joi.validate(value2, schema2, { modify: true }, function (err2) {

                        expect(err2).to.not.exist;
                        expect(value2.b).to.not.exist;
                        expect(value2.a).to.equal(5);

                        done();
                    });
                });
            });

            it('does not modify when false', function (done) {

                var schema = { b: Joi.any().rename('a', { move: true }) };
                var value = { b: '5' };

                Joi.validate(value, schema, { modify: false }, function (err) {

                    expect(err).to.not.exist;
                    expect(value.a).to.not.exist;
                    expect(value.b).to.equal('5');
                    done();
                });
            });
        });

        describe('#options', function () {

            it('adds to existing options', function (done) {

                var a = { b: Joi.number().strict().options({ convert: true, modify: true }) };
                var c = { b: '2' };
                Joi.validate(c, a, function (err) {

                    expect(err).to.not.exist;
                    expect(c.b).to.equal(2);
                    done();
                });
            });
        });

        describe('#strict', function () {

            it('adds to existing options', function (done) {

                var a = { b: Joi.number().options({ convert: true }).strict() };
                var c = { b: '2' };
                Joi.validate(c, a, function (err) {

                    expect(err).to.exist;
                    expect(c.b).to.equal('2');
                    done();
                });
            });
        });

        describe('#default', function () {

            it('sets the value', function (done) {

                var schema = { foo: Joi.string().default('test') };
                var input = {};

                Joi.validate(input, schema, function (err) {

                    expect(err).to.not.exist;
                    expect(input.foo).to.equal('test');

                    done();
                });
            });

            it('sets the value after key is renamed', function (done) {

                var schema = { foo: Joi.string().rename('foo2').default('test') };
                var input = {};

                Joi.validate(input, schema, function (err) {

                    expect(err).to.not.exist;
                    expect(input.foo2).to.equal('test');

                    done();
                });
            });

            it('sets the value after key is renamed. Old key should not exist', function (done) {

                var schema = { foo: Joi.string().rename('foo2', { move: true }).default('test') };
                var input = {};

                Joi.validate(input, schema, function (err) {

                    expect(err).to.not.exist;
                    expect(input.foo2).to.equal('test');
                    expect(input.foo).to.not.exist;

                    done();
                });
            });

            it('should not overide a value when value is given', function (done) {

                var schema = { foo: Joi.string().default('bar') };
                var input = { foo: 'test' };

                Joi.validate(input, schema, function (err) {

                    expect(err).to.not.exist;
                    expect(input.foo).to.equal('test');

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

                var a = Joi.number().invalid(2);
                Joi.validate('2', a, { abortEarly: false }, function (err) {

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

