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


describe('Types', function () {

    describe('Object', function () {

        it('can convert a json string to an object', function (done) {

            var result = Joi.object()._convert('{"hi":true}');
            expect(result.hi).to.be.true;
            done();
        });

        it('should convert a non-json string as a string', function (done) {

            var result = Joi.object()._convert('a string');
            expect(result).to.be.equal('a string');
            done();
        });

        it('should validate an object', function (done) {

            var schema = Joi.object().required();
            Validate(schema, [
                [{ }, true],
                [{ hi: true }, true],
                ['', false]
            ]);
            done();
        });

        it('errors on array', function (done) {

            expect(Joi.validate([1, 2, 3], Joi.object())).to.exist;
            done();
        });

        it('should prevent extra keys from existing by default', function (done) {

            var schema = Joi.object({ item: Joi.string().required() }).required();
            Validate(schema, [
                [{ item: 'something' }, true],
                [{ item: 'something', item2: 'something else' }, false],
                ['', false]
            ]);
            done();
        });

        it('should validate the key count when min is set', function (done) {

            var schema = Joi.object().min(3);
            Validate(schema, [
                [{ item: 'something' }, false],
                [{ item: 'something', item2: 'something else' }, false],
                [{ item: 'something', item2: 'something else', item3: 'something something else' }, true],
                ['', false]
            ]);
            done();
        });

        it('should validate the key count when max is set', function (done) {

            var schema = Joi.object().max(2);
            Validate(schema, [
                [{ item: 'something' }, true],
                [{ item: 'something', item2: 'something else' }, true],
                [{ item: 'something', item2: 'something else', item3: 'something something else' }, false],
                ['', false]
            ]);
            done();
        });

        it('should validate the key count when min and max is set', function (done) {

            var schema = Joi.object().max(3).min(2);
            Validate(schema, [
                [{ item: 'something' }, false],
                [{ item: 'something', item2: 'something else' }, true],
                [{ item: 'something', item2: 'something else', item3: 'something something else' }, true],
                [{ item: 'something', item2: 'something else', item3: 'something something else', item4: 'item4' }, false],
                ['', false]
            ]);
            done();
        });

        it('should validate the key count when length is set', function (done) {

            var schema = Joi.object().length(2);
            Validate(schema, [
                [{ item: 'something' }, false],
                [{ item: 'something', item2: 'something else' }, true],
                [{ item: 'something', item2: 'something else', item3: 'something something else' }, false],
                ['', false]
            ]);
            done();
        });

        it('should traverse an object and validate all properties in the top level', function (done) {

            var schema = Joi.object({
                num: Joi.number()
            });

            Validate(schema, [
                [{ num: 1 }, true],
                [{ num: [1,2,3] }, false]
            ]);
            done();
        });

        it('should traverse an object and child objects and validate all properties', function (done) {

            var schema = Joi.object({
                num: Joi.number(),
                obj: Joi.object({
                    item: Joi.string()
                })
            });

            Validate(schema, [
                [{ num: 1 }, true],
                [{ num: [1,2,3] }, false],
                [{ num: 1, obj: { item: 'something' }}, true],
                [{ num: 1, obj: { item: 123 }}, false]
            ]);
            done();
        });

        it('should traverse an object several levels', function (done) {

            var schema = Joi.object({
                obj: Joi.object({
                    obj: Joi.object({
                        obj: Joi.object({
                            item: Joi.boolean()
                        })
                    })
                })
            });

            Validate(schema, [
                [{ num: 1 }, false],
                [{ obj: {} }, true],
                [{ obj: { obj: { }}}, true],
                [{ obj: { obj: { obj: { } }}}, true],
                [{ obj: { obj: { obj: { item: true } }}}, true],
                [{ obj: { obj: { obj: { item: 10 } }}}, false]
            ]);
            done();
        });

        it('should traverse an object several levels with required levels', function (done) {

            var schema = Joi.object({
                obj: Joi.object({
                    obj: Joi.object({
                        obj: Joi.object({
                            item: Joi.boolean()
                        })
                    }).required()
                })
            });

            Validate(schema, [
                [null, false],
                [undefined, true],
                [{}, true],
                [{ obj: {} }, false],
                [{ obj: { obj: {} } }, true],
                [{ obj: { obj: { obj: {} } } }, true],
                [{ obj: { obj: { obj: { item: true } } } }, true],
                [{ obj: { obj: { obj: { item: 10 } } } }, false]
            ]);
            done();
        });

        it('should traverse an object several levels with required levels (without Joi.obj())', function (done) {

            var schema = {
                obj: {
                    obj: {
                        obj: {
                            item: Joi.boolean().required()
                        }
                    }
                }
            };

            Validate(schema, [
                [null, false],
                [undefined, true],
                [{}, true],
                [{ obj: {} }, true],
                [{ obj: { obj: {} } }, true],
                [{ obj: { obj: { obj: {} } } }, false],
                [{ obj: { obj: { obj: { item: true } } } }, true],
                [{ obj: { obj: { obj: { item: 10 } } } }, false]
            ]);
            done();
        });
    });
});

