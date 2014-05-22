// Load modules

var Lab = require('lab');
var Joi = require('..');
var Helper = require('./helper');


// Declare internals

var internals = {};


// Test shortcuts

var expect = Lab.expect;
var before = Lab.before;
var after = Lab.after;
var describe = Lab.experiment;
var it = Lab.test;


describe('alternatives', function () {

    it('fails when no alternatives are provided', function (done) {

        Joi.alternatives().validate('a', function (err, value) {

            expect(err).to.exist;
            expect(err.message).to.equal('value not matching any of the allowed alternatives');
            done();
        });
    });

    it('allows undefined when no alternatives are provided', function (done) {

        Joi.alternatives().validate(undefined, function (err, value) {

            expect(err).to.not.exist;
            done();
        });
    });

    it('applies modifiers when higher priority converts', function (done) {

        var schema = Joi.object({
            a: [
                Joi.number(),
                Joi.string()
            ]
        });

        schema.validate({ a: '5' }, function (err, value) {

            expect(err).to.not.exist;
            expect(value.a).to.equal(5);
            done();
        });
    });

    it('applies modifiers when lower priority valid is a match', function (done) {

        var schema = Joi.object({
            a: [
                Joi.number(),
                Joi.valid('5')
            ]
        });

        schema.validate({ a: '5' }, function (err, value) {

            expect(err).to.not.exist;
            expect(value.a).to.equal(5);
            done();
        });
    });

    it('does not apply modifier if alternative fails', function (done) {

        var schema = Joi.object({
            a: [
                Joi.object({ c: Joi.any(), d: Joi.number() }).rename('b', 'c'),
                { b: Joi.any(), d: Joi.string() }
            ]
        });

        var input = { a: { b: 'any', d: 'string' } };
        schema.validate(input, function (err, value) {

            expect(err).to.not.exist;
            expect(value.a.b).to.equal('any');
            done();
        });
    });

    describe('#try', function () {

        it('throws when missing alternatives', function (done) {

            expect(function () {

                Joi.alternatives().try();
            }).to.throw('Cannot add other alternatives without at least one schema');
            done();
        });
    });

    describe('#when', function () {

        it('validates conditional alternatives', function (done) {

            var schema = {
                a: Joi.alternatives().when('b', { is: 5, then: 'x', otherwise: 'y' })
                                     .try('z'),
                b: Joi.any()
            };

            Helper.validate(schema, [
                [{ a: 'x', b: 5 }, true],
                [{ a: 'x', b: 6 }, false],
                [{ a: 'y', b: 5 }, false],
                [{ a: 'y', b: 6 }, true],
                [{ a: 'z', b: 5 }, true],
                [{ a: 'z', b: 6 }, true]
            ], done);
        });

        it('validates only then', function (done) {

            var schema = {
                a: Joi.alternatives().when('b', { is: 5, then: 'x' })
                                     .try('z'),
                b: Joi.any()
            };

            Helper.validate(schema, [
                [{ a: 'x', b: 5 }, true],
                [{ a: 'x', b: 6 }, false],
                [{ a: 'y', b: 5 }, false],
                [{ a: 'y', b: 6 }, false],
                [{ a: 'z', b: 5 }, true],
                [{ a: 'z', b: 6 }, true]
            ], done);
        });

        it('validates only otherwise', function (done) {

            var schema = {
                a: Joi.alternatives().when('b', { is: 5, otherwise: 'y' })
                                     .try('z'),
                b: Joi.any()
            };

            Helper.validate(schema, [
                [{ a: 'x', b: 5 }, false],
                [{ a: 'x', b: 6 }, false],
                [{ a: 'y', b: 5 }, false],
                [{ a: 'y', b: 6 }, true],
                [{ a: 'z', b: 5 }, true],
                [{ a: 'z', b: 6 }, true]
            ], done);
        });

        it('validates when is has ref', function (done) {

            var schema = {
                a: Joi.alternatives().when('b', { is: Joi.ref('c'), then: 'x' }),
                b: Joi.any(),
                c: Joi.number()
            };

            Helper.validate(schema, [
                [{ a: 'x', b: 5, c: '5' }, true],
                [{ a: 'x', b: 5, c: '1' }, false],
                [{ a: 'x', b: '5', c: '5' }, false],
                [{ a: 'y', b: 5, c: 5 }, false],
                [{ a: 'y' }, false]
            ], done);
        });

        it('validates when then has ref', function (done) {

            var schema = {
                a: Joi.alternatives().when('b', { is: 5, then: Joi.ref('c') }),
                b: Joi.any(),
                c: Joi.number()
            };

            Helper.validate(schema, [
                [{ a: 'x', b: 5, c: '1' }, false],
                [{ a: 1, b: 5, c: '1' }, true],
                [{ a: '1', b: 5, c: '1' }, false]
            ], done);
        });

        it('validates when otherwise has ref', function (done) {

            var schema = {
                a: Joi.alternatives().when('b', { is: 6, otherwise: Joi.ref('c') }),
                b: Joi.any(),
                c: Joi.number()
            };

            Helper.validate(schema, [
                [{ a: 'x', b: 5, c: '1' }, false],
                [{ a: 1, b: 5, c: '1' }, true],
                [{ a: '1', b: 5, c: '1' }, false]
            ], done);
        });

        it('validates when empty value', function (done) {

            var schema = {
                a: Joi.alternatives().when('b', { is: true, then: Joi.required() }),
                b: Joi.boolean().default(false)
            };

            Helper.validate(schema, [
              [{ b: false }, true],
              [{ b: true }, true]           // true because required() only applies to the one alternative
            ], done);
        });

        it('validates when is an empty string', function (done) {

            var schema = Joi.object({
                a: Joi.alternatives().when('', { is: 5, then: Joi.valid('y') }),
                '': Joi.any()
            });

            var input = {
                a: 'y',
                '': 5
            };

            Helper.validate(schema, [
                [input, true]
            ], done);
        });
    });

    describe('#describe', function () {

        it('describes when', function (done) {

            var schema = {
                a: Joi.alternatives().when('b', { is: 5, then: 'x', otherwise: 'y' })
                                     .try('z'),
                b: Joi.any()
            };

            var outcome = {
                type: 'object',
                children: {
                    b: {
                        type: 'any'
                    },
                    a: [
                      {
                          ref: 'ref:b',
                          is: {
                              type: 'number',
                              flags: {
                                  allowOnly: true
                              },
                              valids: [5]
                          },
                          then: {
                              type: 'string',
                              flags: {
                                  allowOnly: true
                              },
                              valids: ['x'],
                              invalids: ['']
                          },
                          otherwise: {
                              type: 'string',
                              flags: {
                                  allowOnly: true
                              },
                              valids: ['y'],
                              invalids: ['']
                          }
                      },
                      {
                          type: 'string',
                          flags: {
                              allowOnly: true
                          },
                          valids: ['z'],
                          invalids: ['']
                      }
                    ]
                }
            };

            expect(Joi.describe(schema)).to.deep.equal(outcome);
            done();
        });

        it('describes when (only then)', function (done) {

            var schema = {
                a: Joi.alternatives().when('b', { is: 5, then: 'x' })
                                     .try('z'),
                b: Joi.any()
            };

            var outcome = {
                type: 'object',
                children: {
                    b: {
                        type: 'any'
                    },
                    a: [
                      {
                          ref: 'ref:b',
                          is: {
                              type: 'number',
                              flags: {
                                  allowOnly: true
                              },
                              valids: [5]
                          },
                          then: {
                              type: 'string',
                              flags: {
                                  allowOnly: true
                              },
                              valids: ['x'],
                              invalids: ['']
                          }
                      },
                      {
                          type: 'string',
                          flags: {
                              allowOnly: true
                          },
                          valids: ['z'],
                          invalids: ['']
                      }
                    ]
                }
            };

            expect(Joi.describe(schema)).to.deep.equal(outcome);
            done();
        });

        it('describes when (only otherwise)', function (done) {

            var schema = {
                a: Joi.alternatives().when('b', { is: 5, otherwise: 'y' })
                                     .try('z'),
                b: Joi.any()
            };

            var outcome = {
                type: 'object',
                children: {
                    b: {
                        type: 'any'
                    },
                    a: [
                      {
                          ref: 'ref:b',
                          is: {
                              type: 'number',
                              flags: {
                                  allowOnly: true
                              },
                              valids: [5]
                          },
                          otherwise: {
                              type: 'string',
                              flags: {
                                  allowOnly: true
                              },
                              valids: ['y'],
                              invalids: ['']
                          }
                      },
                      {
                          type: 'string',
                          flags: {
                              allowOnly: true
                          },
                          valids: ['z'],
                          invalids: ['']
                      }
                    ]
                }
            };

            expect(Joi.describe(schema)).to.deep.equal(outcome);
            done();
        });
    });
});
