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


describe('any', function () {

    describe('#equal', function () {

        it('validates valid values', function (done) {

            Validate(Joi.equal(4), [
                [4, true],
                [5, false]
            ]);

            done();
        });
    });

    describe('#not', function () {

        it('validates invalid values', function (done) {

            Validate(Joi.not(5), [
                [4, true],
                [5, false]
            ]);

            done();
        });
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

    describe('#options', function () {

        it('adds to existing options', function (done) {

            var schema = Joi.object({ b: Joi.number().strict().options({ convert: true }) });
            var input = { b: '2' };
            schema.validate(input, function (err, value) {

                expect(err).to.not.exist;
                expect(value.b).to.equal(2);
                done();
            });
        });
    });

    describe('#strict', function () {

        it('adds to existing options', function (done) {

            var schema = Joi.object({ b: Joi.number().options({ convert: true }).strict() });
            var input = { b: '2' };
            schema.validate(input, function (err, value) {

                expect(err).to.exist;
                expect(value.b).to.equal('2');
                done();
            });
        });
    });

    describe('#default', function () {

        it('sets the value', function (done) {

            var schema = Joi.object({ foo: Joi.string().default('test') });
            var input = {};

            schema.validate(input, function (err, value) {

                expect(err).to.not.exist;
                expect(value.foo).to.equal('test');

                done();
            });
        });

        it('should not overide a value when value is given', function (done) {

            var schema = Joi.object({ foo: Joi.string().default('bar') });
            var input = { foo: 'test' };

            schema.validate(input, function (err, value) {

                expect(err).to.not.exist;
                expect(value.foo).to.equal('test');

                done();
            });
        });
    });

    describe('#description', function () {

        it('sets the description', function (done) {

            var b = Joi.description('my description');
            expect(b._description).to.equal('my description');

            done();
        });

        it('throws when description is missing', function (done) {

            expect(function () {

                Joi.description();
            }).to.throw('Description must be a non-empty string');
            done();
        });
    });

    describe('#notes', function () {

        it('sets the notes', function (done) {

            var b = Joi.notes(['a']).notes('my notes');
            expect(b._notes).to.deep.equal(['a', 'my notes']);

            done();
        });

        it('throws when notes are missing', function (done) {

            expect(function () {

                Joi.notes();
            }).to.throw('Notes must be a non-empty string or array');
            done();
        });

        it('throws when notes are invalid', function (done) {

            expect(function () {

                Joi.notes(5);
            }).to.throw('Notes must be a non-empty string or array');
            done();
        });
    });

    describe('#tags', function () {

        it('sets the tags', function (done) {

            var b = Joi.tags(['tag1', 'tag2']).tags('tag3');
            expect(b._tags).to.include('tag1');
            expect(b._tags).to.include('tag2');
            expect(b._tags).to.include('tag3');

            done();
        });

        it('throws when tags are missing', function (done) {

            expect(function () {

                Joi.tags();
            }).to.throw('Tags must be a non-empty string or array');
            done();
        });

        it('throws when tags are invalid', function (done) {

            expect(function () {

                Joi.tags(5);
            }).to.throw('Tags must be a non-empty string or array');
            done();
        });
    });

    describe('#example', function () {

        it('sets an example', function (done) {

            var schema = Joi.valid(5, 6, 7).example(5);
            expect(schema._examples).to.include(5);
            expect(schema.describe().examples).to.deep.equal([5]);
            done();
        });

        it('throws when tags are missing', function (done) {

            expect(function () {

                Joi.example();
            }).to.throw('Missing example');
            done();
        });

        it('throws when example fails own rules', function (done) {

            expect(function () {

                var schema = Joi.valid(5, 6, 7).example(4);
            }).to.throw('Bad example: value must be one of 5, 6, 7');
            done();
        });
    });

    describe('#unit', function () {

        it('sets the unit', function (done) {

            var b = Joi.unit('milliseconds');
            expect(b._unit).to.equal('milliseconds');
            expect(b.describe().unit).to.equal('milliseconds');
            done();
        });

        it('throws when unit is missing', function (done) {

            expect(function () {

                Joi.unit();
            }).to.throw('Unit name must be a non-empty string');
            done();
        });
    });

    describe('#_validate', function () {

        it('checks value after conversion', function (done) {

            var schema = Joi.number().invalid(2);
            Joi.validate('2', schema, { abortEarly: false }, function (err, value) {

                expect(err).to.exist;
                done();
            });
        });
    });

    describe('#concat', function () {

        it('throws when schema is not any', function (done) {

            expect(function () {

                Joi.string().concat(Joi.number());
            }).to.throw('Cannot merge with another type: number');
            done();
        });

        it('throws when schema is missing', function (done) {

            expect(function () {

                Joi.string().concat();
            }).to.throw('Invalid schema object');
            done();
        });

        it('throws when schema is invalid', function (done) {

            expect(function () {

                Joi.string().concat(1);
            }).to.throw('Invalid schema object');
            done();
        });

        it('merges two schemas (settings)', function (done) {

            var a = Joi.number().options({ convert: true });
            var b = Joi.options({ convert: false });

            Validate(a, [[1, true], ['1', true]]);
            Validate(a.concat(b), [[1, true], ['1', false]]);
            done();
        });

        it('merges two schemas (invalid)', function (done) {

            var a = Joi.string().valid('a');
            var b = Joi.string().valid('b');

            Validate(a, [['a', true], ['b', false]]);
            Validate(b, [['b', true], ['a', false]]);
            Validate(a.concat(b), [['a', true], ['b', true]]);
            done();
        });

        it('merges two schemas (invalid)', function (done) {

            var a = Joi.string().invalid('a');
            var b = Joi.invalid('b');

            Validate(a, [['b', true], ['a', false]]);
            Validate(b, [['a', true], ['b', false]]);
            Validate(a.concat(b), [['a', false], ['b', false]]);
            done();
        });

        it('merges two schemas (tests)', function (done) {

            var a = Joi.number().min(5);
            var b = Joi.number().max(10);

            Validate(a, [[4, false], [11, true]]);
            Validate(b, [[6, true], [11, false]]);
            Validate(a.concat(b), [[4, false], [6, true], [11, false]]);
            done();
        });

        it('merges two schemas (flags)', function (done) {

            var a = Joi.string().valid('a');
            var b = Joi.string().insensitive();

            Validate(a, [['a', true], ['A', false], ['b', false]]);
            Validate(a.concat(b), [['a', true], ['A', true], ['b', false]]);
            done();
        });

        it('overrides and append information', function (done) {

            var a = Joi.description('a').unit('a').tags('a').example('a');
            var b = Joi.description('b').unit('b').tags('b').example('b');

            var desc = a.concat(b).describe();
            expect(desc).to.deep.equal({
                type: 'any',
                description: 'b',
                tags: ['a', 'b'],
                examples: ['a', 'b'],
                unit: 'b',
                valids: [undefined],
                invalids: [null]
            });
            done();
        });

        it('merges two objects (any key + specific key)', function (done) {

            var a = Joi.object();
            var b = Joi.object({ b: 1 });

            Validate(a, [[{ b: 1 }, true], [{ b: 2 }, true]]);
            Validate(b, [[{ b: 1 }, true], [{ b: 2 }, false]]);
            Validate(a.concat(b), [[{ b: 1 }, true], [{ b: 2 }, false]]);
            Validate(b.concat(a), [[{ b: 1 }, true], [{ b: 2 }, false]]);
            done();
        });

        it('merges two objects (no key + any key)', function (done) {

            var a = Joi.object({});
            var b = Joi.object();

            Validate(a, [[{}, true], [{ b: 2 }, false]]);
            Validate(b, [[{}, true], [{ b: 2 }, true]]);
            Validate(a.concat(b), [[{}, true], [{ b: 2 }, false]]);
            Validate(b.concat(a), [[{}, true], [{ b: 2 }, false]]);
            done();
        });

        it('merges two objects (key + key)', function (done) {

            var a = Joi.object({ a: 1 });
            var b = Joi.object({ b: 2 });

            Validate(a, [[{ a: 1 }, true], [{ b: 2 }, false]]);
            Validate(b, [[{ a: 1 }, false], [{ b: 2 }, true]]);
            Validate(a.concat(b), [[{ a: 1 }, true], [{ b: 2 }, true]]);
            Validate(b.concat(a), [[{ a: 1 }, true], [{ b: 2 }, true]]);
            done();
        });

        it('merges two objects (renames)', function (done) {

            var a = Joi.object({ a: 1 }).rename('c', 'a');
            var b = Joi.object({ b: 2 }).rename('d', 'b');

            a.concat(b).validate({ c: 1, d: 2 }, function (err, value) {

                expect(err).to.not.exist;
                expect(value).to.deep.equal({ a: 1, b: 2 });
            });
            done();
        });

        it('merges two objects (deps)', function (done) {

            var a = Joi.object({ a: 1 });
            var b = Joi.object({ b: 2 }).and('b', 'a');

            a.concat(b).validate({ a: 1, b: 2 }, function (err, value) {

                expect(err).to.not.exist;
            });
            done();
        });

        it('merges two alternatives with references', function (done) {

            var schema = {
                a: { c: Joi.number() },
                b: Joi.alternatives(Joi.ref('a.c')).concat(Joi.alternatives(Joi.ref('c'))),
                c: Joi.number()
            };

            Validate(schema, [
                [{ a: {} }, true],
                [{ a: { c: '5' }, b: 5 }, true],
                [{ a: { c: '5' }, b: 6, c: '6' }, true],
                [{ a: { c: '5' }, b: 7, c: '6' }, false]
            ]);

            done();
        });
    });

    describe('#when', function () {

        it('throws when options are invalid', function (done) {

            expect(function () {

                Joi.when('a');
            }).to.throw('Invalid options');

            done();
        });

        it('forks type into alternatives', function (done) {

            var schema = {
                a: Joi.any(),
                b: Joi.string().valid('x').when('a', { is: 5, then: Joi.valid('y'), otherwise: Joi.valid('z') })
            };

            Validate(schema, [
                [{ a: 5, b: 'x' }, true],
                [{ a: 5, b: 'y' }, true],
                [{ a: 5, b: 'z' }, false],
                [{ a: 1, b: 'x' }, true],
                [{ a: 1, b: 'y' }, false],
                [{ a: 1, b: 'z' }, true],
                [{ a: 5, b: 'a' }, false],
                [{ b: 'a' }, false]
            ]);

            done();
        });

        it('forks type into alternatives (only then)', function (done) {

            var schema = {
                a: Joi.any(),
                b: Joi.string().valid('x').when('a', { is: 5, then: Joi.valid('y') })
            };

            Validate(schema, [
                [{ a: 5, b: 'x' }, true],
                [{ a: 5, b: 'y' }, true],
                [{ a: 5, b: 'z' }, false],
                [{ a: 1, b: 'x' }, true],
                [{ a: 1, b: 'y' }, false],
                [{ a: 1, b: 'z' }, false],
                [{ a: 5, b: 'a' }, false],
                [{ b: 'a' }, false]
            ]);

            done();
        });

        it('forks type into alternatives (only otherwise)', function (done) {

            var schema = {
                a: Joi.any(),
                b: Joi.string().valid('x').when('a', { is: 5, otherwise: Joi.valid('z') })
            };

            Validate(schema, [
                [{ a: 5, b: 'x' }, true],
                [{ a: 5, b: 'y' }, false],
                [{ a: 5, b: 'z' }, false],
                [{ a: 1, b: 'x' }, true],
                [{ a: 1, b: 'y' }, false],
                [{ a: 1, b: 'z' }, true],
                [{ a: 5, b: 'a' }, false],
                [{ b: 'a' }, false]
            ]);

            done();
        });
    });

    describe('Set', function () {

        describe('#add', function () {

            it('throws when adding a non ref function', function (done) {

                expect(function () {

                    Joi.valid(function () { });
                }).to.throw('Value cannot be an object or function');
                done();
            });

            it('throws when adding an object function', function (done) {

                expect(function () {

                    Joi.valid({});
                }).to.throw('Value cannot be an object or function');
                done();
            });
        });

        describe('#values', function () {

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

