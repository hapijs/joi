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

        var O = Joi.object;

        it('can convert a json string to an object', function (done) {

            var result = O()._convert('{"hi":true}');
            expect(result.hi).to.be.true;
            done();
        });

        it('should convert a non-json string as a string', function (done) {

            var result = O()._convert('a string');
            expect(result).to.be.equal('a string');
            done();
        });

        it('should validate an object', function (done) {

            var t = O().required();
            Validate(t, [
                [{ }, true],
                [{ hi: true }, true],
                ['', false]
            ]); done();
        });

        it('errors on array', function (done) {

            expect(Joi.validate([1, 2, 3], Joi.object())).to.exist;
            done();
        });

        it('should prevent extra keys from existing by default', function (done) {

            var t = O({ item: Joi.string().required() }).required();
            Validate(t, [
                [{ item: 'something' }, true],
                [{ item: 'something', item2: 'something else' }, false],
                ['', false]
            ]); done();
        });

        it('should traverse an object and validate all properties in the top level', function (done) {

            var t = O({
                num: Joi.number()
            });

            Validate(t, [
                [{ num: 1 }, true],
                [{ num: [1,2,3] }, false]
            ]); done();
        });

        it('should traverse an object and child objects and validate all properties', function (done) {

            var t = O({
                num: Joi.number(),
                obj: O({
                    item: Joi.string()
                })
            });

            Validate(t, [
                [{ num: 1 }, true],
                [{ num: [1,2,3] }, false],
                [{ num: 1, obj: { item: 'something' }}, true],
                [{ num: 1, obj: { item: 123 }}, false]
            ]); done();
        });

        it('should traverse an object several levels', function (done) {

            var t = O({
                obj: O({
                    obj: O({
                        obj: O({
                            item: Joi.boolean()
                        })
                    })
                })
            });

            Validate(t, [
                [{ num: 1 }, false],
                [{ obj: {} }, true],
                [{ obj: { obj: { }}}, true],
                [{ obj: { obj: { obj: { } }}}, true],
                [{ obj: { obj: { obj: { item: true } }}}, true],
                [{ obj: { obj: { obj: { item: 10 } }}}, false]
            ]); done();
        });

        it('should traverse an object several levels with required levels', function (done) {

            var t = O({
                obj: O({
                    obj: O({
                        obj: O({
                            item: Joi.boolean()
                        })
                    }).required()
                })
            });

            Validate(t, [
                [null, false],
                [undefined, true],
                [{}, true],
                [{ obj: {} }, false],
                [{ obj: { obj: {} } }, true],
                [{ obj: { obj: { obj: {} } } }, true],
                [{ obj: { obj: { obj: { item: true } } } }, true],
                [{ obj: { obj: { obj: { item: 10 } } } }, false]
            ]); done();
        });
    });
});

