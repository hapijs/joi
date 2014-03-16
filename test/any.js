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

                expect(result.validate('test')).to.exist;
                done();
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

        describe('#xor', function () {

            it('fails when without set on root', function (done) {

                var b = Joi.any();
                var result = b.xor('test');

                expect(result.validate('test')).to.exist;
                done();
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

                expect(result.validate('test')).to.exist;
                done();
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
                expect(schema.validate('test')).to.exist;
                done();
            });

            it('allows renaming multiple times with multiple enabled', function (done) {

                var schema = {
                    test1: Joi.string().rename('test'),
                    test2: Joi.string().rename('test', { multiple: true })
                };

                var err = Joi.validate({ test1: 'a', test2: 'b' }, schema);
                expect(err).to.not.exist;
                done();
            });

            it('errors renaming multiple times with multiple disabled', function (done) {

                var schema = {
                    test1: Joi.string().rename('test'),
                    test2: Joi.string().rename('test')
                };

                var err = Joi.validate({ test1: 'a', test2: 'b' }, schema);
                expect(err).to.exist;
                done();
            });

            it('with override disabled should not allow overwriting existing value', function (done) {

                var schema = {
                    test: Joi.string().rename('test1')
                };

                expect(Joi.validate({ test: 'b', test1: 'a' }, schema)).to.exist;
                done();
            });

            it('with override enabled should allow overwriting existing value', function (done) {

                var schema = {
                    test: Joi.string().rename('test1', { override: true }),
                    test1: Joi.any()
                };

                var err = Joi.validate({ test: 'b', test1: 'a' }, schema);
                expect(err).to.not.exist;
                done();
            });

            it('renames when data is nested in an array via includes', function (done) {

                var schema = {
                    arr: Joi.array().includes(Joi.object({
                        uno: Joi.string().rename('one'),
                        dos: Joi.string().rename('two')
                    }))
                };

                var data = { arr: [{ uno: '1', dos: '2' }] };
                var err = Joi.validate(data, schema);

                expect(err).to.not.exist;
                expect(data.arr[0].one).to.equal('1');
                expect(data.arr[0].two).to.equal('2');
                done();
            });
        });

        describe('#default', function () {

            it('sets the value', function (done) {

                var schema = { foo: Joi.string().default('test') };
                var input = {};

                expect(Joi.validate(input, schema)).to.not.exist;
                expect(input.foo).to.equal('test');

                done();
            });

            it('sets the value after key is renamed', function (done) {

                var schema = { foo: Joi.string().rename('foo2').default('test') };
                var input = {};

                expect(Joi.validate(input, schema)).to.not.exist;
                expect(input.foo2).to.equal('test');

                done();
            });

            it('sets the value after key is renamed. Old key should not exist', function (done) {

                var schema = { foo: Joi.string().rename('foo2', { move: true }).default('test') };
                var input = {};

                expect(Joi.validate(input, schema)).to.not.exist;
                expect(input.foo2).to.equal('test');
                expect(input.foo).to.not.exist;

                done();
            });

            it('should not overide a value when value is given', function (done) {

                var schema = { foo: Joi.string().default('bar') };
                var input = { foo: 'test' };

                expect(Joi.validate(input, schema)).to.not.exist;
                expect(input.foo).to.equal('test');

                done();
            });

        });

        describe('#validateCallback', function () {

            it('validates using callback interface', function (done) {

                var schema = Joi.number();
                schema.validateCallback(4, {}, function (err) {

                    expect(err).to.not.exist;
                    done();
                });
            });
        });

        describe('#description', function () {

            it('sets the description', function (done) {

                var b = Joi.any();
                b.description('my description');
                expect(b._description).to.equal('my description');

                done();
            });
        });

        describe('#notes', function () {

            it('sets the notes', function (done) {

                var b = Joi.any();
                b.notes('my notes');
                expect(b._notes).to.deep.equal(['my notes']);

                done();
            });
        });

        describe('#tags', function () {

            it('sets the tags', function (done) {

                var b = Joi.any();
                b.tags(['tag1', 'tag2']);
                expect(b._tags).to.include('tag1');
                expect(b._tags).to.include('tag2');

                done();
            });
        });

        describe('Set', function () {

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

