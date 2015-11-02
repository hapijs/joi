'use strict';

// Load modules

const Lab = require('lab');
const Code = require('code');
const Joi = require('../lib');
const Helper = require('./helper');


// Declare internals

const internals = {};


// Test shortcuts

const lab = exports.lab = Lab.script();
const describe = lab.describe;
const it = lab.it;
const expect = Code.expect;


describe('number', () => {

    it('fails on boolean', (done) => {

        const schema = Joi.number();
        Helper.validate(schema, [
            [true, false],
            [false, false]
        ], done);
    });

    describe('validate()', () => {

        it('should, by default, allow undefined', (done) => {

            Helper.validate(Joi.number(), [
                [undefined, true]
            ], done);
        });

        it('should, when .required(), deny undefined', (done) => {

            Helper.validate(Joi.number().required(), [
                [undefined, false]
            ], done);
        });

        it('should return false for denied value', (done) => {

            const text = Joi.number().invalid(50);
            text.validate(50, (err, value) => {

                expect(err).to.exist();
                done();
            });
        });

        it('should validate integer', (done) => {

            const t = Joi.number().integer();
            Helper.validate(t, [
                [100, true],
                [0, true],
                [null, false],
                [1.02, false],
                [0.01, false]
            ], done);
        });

        it('should return false for Infinity', (done) => {

            const t = Joi.number();
            Helper.validate(t, [
                [Infinity, false],
                [-Infinity, false]
            ], done);
        });

        it('should return true for allowed Infinity', (done) => {

            const t = Joi.number().allow(Infinity, -Infinity);
            Helper.validate(t, [
                [Infinity, true],
                [-Infinity, true]
            ], done);
        });

        it('can accept string numbers', (done) => {

            const t = Joi.number();
            Helper.validate(t, [
                ['1', true],
                ['100', true],
                ['1e3', true],
                ['1 some text', false],
                ['\t\r', false],
                [' ', false],
                [' 2', true],
                ['\t\r43', true],
                ['43 ', true],
                ['', false]
            ], done);
        });

        it('required validates correctly', (done) => {

            const t = Joi.number().required();
            Helper.validate(t, [
                [NaN, false],
                ['100', true]
            ], done);
        });

        it('converts an object string to a number', (done) => {

            const config = { a: Joi.number() };
            const obj = { a: '123' };

            Joi.compile(config).validate(obj, (err, value) => {

                expect(err).to.not.exist();
                expect(value.a).to.equal(123);
                done();
            });
        });

        it('converts a string to a number', (done) => {

            Joi.number().validate('1', (err, value) => {

                expect(err).to.not.exist();
                expect(value).to.equal(1);
                done();
            });
        });

        it('errors on null', (done) => {

            Joi.number().validate(null, (err, value) => {

                expect(err).to.exist();
                expect(value).to.equal(null);
                done();
            });
        });

        it('should handle combination of min and max', (done) => {

            const rule = Joi.number().min(8).max(10);
            Helper.validate(rule, [
                [1, false],
                [11, false],
                [8, true],
                [9, true],
                [null, false]
            ], done);
        });

        it('should handle combination of min, max, and null allowed', (done) => {

            const rule = Joi.number().min(8).max(10).allow(null);
            Helper.validate(rule, [
                [1, false],
                [11, false],
                [8, true],
                [9, true],
                [null, true]
            ], done);
        });

        it('should handle combination of min and positive', (done) => {

            const rule = Joi.number().min(-3).positive();
            Helper.validate(rule, [
                [1, true],
                [-2, false],
                [8, true],
                [null, false]
            ], done);
        });

        it('should handle combination of max and positive', (done) => {

            const rule = Joi.number().max(5).positive();
            Helper.validate(rule, [
                [4, true],
                [-2, false],
                [8, false],
                [null, false]
            ], done);
        });

        it('should handle combination of min and negative', (done) => {

            const rule = Joi.number().min(-3).negative();
            Helper.validate(rule, [
                [4, false],
                [-2, true],
                [-4, false],
                [null, false]
            ], done);
        });

        it('should handle combination of negative and positive', (done) => {

            const rule = Joi.number().negative().positive();
            Helper.validate(rule, [
                [4, false],
                [-2, false],
                [0, false],
                [null, false]
            ], done);
        });

        it('should handle combination of negative and allow', (done) => {

            const rule = Joi.number().negative().allow(1);
            Helper.validate(rule, [
                [1, true],
                [-10, true],
                [8, false],
                [0, false],
                [null, false]
            ], done);
        });

        it('should handle combination of positive and allow', (done) => {

            const rule = Joi.number().positive().allow(-1);
            Helper.validate(rule, [
                [1, true],
                [-1, true],
                [8, true],
                [-10, false],
                [null, false]
            ], done);
        });

        it('should handle combination of positive, allow, and null allowed', (done) => {

            const rule = Joi.number().positive().allow(-1).allow(null);
            Helper.validate(rule, [
                [1, true],
                [-1, true],
                [8, true],
                [-10, false],
                [null, true]
            ], done);
        });

        it('should handle combination of negative, allow, and null allowed', (done) => {

            const rule = Joi.number().negative().allow(1).allow(null);
            Helper.validate(rule, [
                [1, true],
                [-10, true],
                [8, false],
                [0, false],
                [null, true]
            ], done);
        });

        it('should handle combination of positive, allow, null allowed, and invalid', (done) => {

            const rule = Joi.number().positive().allow(-1).allow(null).invalid(1);
            Helper.validate(rule, [
                [1, false],
                [-1, true],
                [8, true],
                [-10, false],
                [null, true]
            ], done);
        });

        it('should handle combination of negative, allow, null allowed, and invalid', (done) => {

            const rule = Joi.number().negative().allow(1).allow(null).invalid(-5);
            Helper.validate(rule, [
                [1, true],
                [-10, true],
                [-5, false],
                [8, false],
                [0, false],
                [null, true]
            ], done);
        });

        it('should handle combination of min, max, and allow', (done) => {

            const rule = Joi.number().min(8).max(10).allow(1);
            Helper.validate(rule, [
                [1, true],
                [11, false],
                [8, true],
                [9, true],
                [null, false]
            ], done);
        });

        it('should handle combination of min, max, allow, and null allowed', (done) => {

            const rule = Joi.number().min(8).max(10).allow(1).allow(null);
            Helper.validate(rule, [
                [1, true],
                [11, false],
                [8, true],
                [9, true],
                [null, true]
            ], done);
        });

        it('should handle combination of min, max, allow, and invalid', (done) => {

            const rule = Joi.number().min(8).max(10).allow(1).invalid(9);
            Helper.validate(rule, [
                [1, true],
                [11, false],
                [8, true],
                [9, false],
                [null, false]
            ], done);
        });

        it('should handle combination of min, max, allow, invalid, and null allowed', (done) => {

            const rule = Joi.number().min(8).max(10).allow(1).invalid(9).allow(null);
            Helper.validate(rule, [
                [1, true],
                [11, false],
                [8, true],
                [9, false],
                [null, true]
            ], done);
        });

        it('should handle combination of min, max, and integer', (done) => {

            const rule = Joi.number().min(8).max(10).integer();
            Helper.validate(rule, [
                [1, false],
                [11, false],
                [8, true],
                [9, true],
                [9.1, false],
                [null, false]
            ], done);
        });

        it('should handle combination of min, max, integer, and allow', (done) => {

            const rule = Joi.number().min(8).max(10).integer().allow(9.1);
            Helper.validate(rule, [
                [1, false],
                [11, false],
                [8, true],
                [9, true],
                [9.1, true],
                [9.2, false],
                [null, false]
            ], done);
        });

        it('should handle combination of min, max, integer, allow, and invalid', (done) => {

            const rule = Joi.number().min(8).max(10).integer().allow(9.1).invalid(8);
            Helper.validate(rule, [
                [1, false],
                [11, false],
                [8, false],
                [9, true],
                [9.1, true],
                [9.2, false],
                [null, false]
            ], done);
        });

        it('should handle combination of min, max, integer, allow, invalid, and null allowed', (done) => {

            const rule = Joi.number().min(8).max(10).integer().allow(9.1).invalid(8).allow(null);
            Helper.validate(rule, [
                [1, false],
                [11, false],
                [8, false],
                [9, true],
                [9.1, true],
                [9.2, false],
                [null, true]
            ], done);
        });

        it('should handle limiting the number of decimal places', (done) => {

            const rule = Joi.number().precision(1).options({ convert: false });
            Helper.validate(rule, [
                [1, true],
                [9.1, true],
                [9.21, false],
                [9.9999, false],
                [9.999e99, true],
                [9.9e-99, false],
                [9.9e3, true],
                [null, false]
            ], done);
        });

        it('should handle combination of min, max, integer, allow, invalid, null allowed and precision', (done) => {

            const rule = Joi.number().min(8).max(10).integer().allow(9.1).invalid(8).allow(null).precision(1).options({ convert: false });
            Helper.validate(rule, [
                [1, false],
                [11, false],
                [8, false],
                [9, true],
                [9.1, true],
                [9.11, false],
                [9.2, false],
                [9.22, false],
                [null, true]
            ], done);
        });

        it('should handle combination of greater and less', (done) => {

            const rule = Joi.number().greater(5).less(10);
            Helper.validate(rule, [
                [0, false],
                [11, false],
                [5, false],
                [10, false],
                [8, true],
                [5.01, true],
                [9.99, true],
                [null, false]
            ], done);
        });

        it('should handle combination of greater, less, and integer', (done) => {

            const rule = Joi.number().integer().greater(5).less(10);
            Helper.validate(rule, [
                [0, false],
                [11, false],
                [5, false],
                [10, false],
                [6, true],
                [9, true],
                [5.01, false],
                [9.99, false]
            ], done);
        });

        it('should handle combination of greater, less, and null allowed', (done) => {

            const rule = Joi.number().greater(5).less(10).allow(null);
            Helper.validate(rule, [
                [0, false],
                [11, false],
                [5, false],
                [10, false],
                [8, true],
                [5.01, true],
                [9.99, true],
                [null, true]
            ], done);
        });

        it('should handle combination of greater, less, invalid, and allow', (done) => {

            const rule = Joi.number().greater(5).less(10).invalid(6).allow(-3);
            Helper.validate(rule, [
                [0, false],
                [11, false],
                [5, false],
                [10, false],
                [6, false],
                [8, true],
                [5.01, true],
                [9.99, true],
                [-3, true],
                [null, false]
            ], done);
        });
    });

    it('should instantiate separate copies on invocation', (done) => {

        const result1 = Joi.number().min(5);
        const result2 = Joi.number().max(5);

        expect(Object.keys(result1)).to.not.equal(Object.keys(result2));
        done();
    });

    it('should show resulting object with #valueOf', (done) => {

        const result = Joi.number().min(5);
        expect(result.valueOf()).to.exist();
        done();
    });

    describe('error message', () => {

        it('should display correctly for int type', (done) => {

            const t = Joi.number().integer();
            Joi.compile(t).validate('1.1', (err, value) => {

                expect(err.message).to.contain('integer');
                done();
            });
        });
    });

    describe('min()', () => {

        it('throws when limit is not a number', (done) => {

            expect(() => {

                Joi.number().min('a');
            }).to.throw('limit must be a number or reference');
            done();
        });

        it('supports 64bit numbers', (done) => {

            const schema = Joi.number().min(1394035612500);
            const input = 1394035612552;

            schema.validate(input, (err, value) => {

                expect(err).to.not.exist();
                expect(value).to.equal(input);
                done();
            });
        });

        it('accepts references as min value', (done) => {

            const schema = Joi.object({ a: Joi.number(), b: Joi.number().min(Joi.ref('a')) });

            Helper.validate(schema, [
                [{ a: 42, b: 1337 }, true],
                [{ a: 1337, b: 42 }, false],
                [{ a: '1337', b: 42 }, false, null, 'child "b" fails because ["b" must be larger than or equal to 1337]'],
                [{ a: 2.4, b: 4.2 }, true],
                [{ a: 4.2, b: 4.20000001 }, true],
                [{ a: 4.20000001, b: 4.2 }, false],
                [{ a: 4.2, b: 2.4 }, false, null, 'child "b" fails because ["b" must be larger than or equal to 4.2]']
            ], done);
        });

        it('accepts context references as min value', (done) => {

            const schema = Joi.object({ b: Joi.number().min(Joi.ref('$a')) });

            Helper.validate(schema, [
                [{ b: 1337 }, true, { context: { a: 42 } }],
                [{ b: 42 }, false, { context: { a: 1337 } }],
                [{ b: 4.2 }, true, { context: { a: 2.4 } }],
                [{ b: 4.20000001 }, true, { context: { a: 4.2 } }],
                [{ b: 4.2 }, false, { context: { a: 4.20000001 } }],
                [{ b: 2.4 }, false, { context: { a: 4.2 } }, 'child "b" fails because ["b" must be larger than or equal to 4.2]']
            ], done);
        });

        it('errors if reference is not a number', (done) => {

            const schema = Joi.object({ a: Joi.string(), b: Joi.number().min(Joi.ref('a')) });

            Helper.validate(schema, [
                [{ a: 'abc', b: 42 }, false, null, 'child "b" fails because ["b" references "a" which is not a number]']
            ], done);
        });

        it('errors if context reference is not a number', (done) => {

            const schema = Joi.object({ b: Joi.number().min(Joi.ref('$a')) });

            Helper.validate(schema, [
                [{ b: 42 }, false, { context: { a: 'abc' } }, 'child "b" fails because ["b" references "a" which is not a number]']
            ], done);
        });
    });

    describe('max()', () => {

        it('throws when limit is not a number', (done) => {

            expect(() => {

                Joi.number().max('a');
            }).to.throw('limit must be a number or reference');
            done();
        });

        it('accepts references as max value', (done) => {

            const schema = Joi.object({ a: Joi.number(), b: Joi.number().max(Joi.ref('a')) });

            Helper.validate(schema, [
                [{ a: 1337, b: 42 }, true],
                [{ a: 42, b: 1337 }, false],
                [{ a: '42', b: 1337 }, false, null, 'child "b" fails because ["b" must be less than or equal to 42]'],
                [{ a: 4.2, b: 2.4 }, true],
                [{ a: 4.2, b: 4.20000001 }, false],
                [{ a: 4.20000001, b: 4.2 }, true],
                [{ a: 2.4, b: 4.2 }, false, null, 'child "b" fails because ["b" must be less than or equal to 2.4]']
            ], done);
        });

        it('accepts context references as max value', (done) => {

            const schema = Joi.object({ b: Joi.number().max(Joi.ref('$a')) });

            Helper.validate(schema, [
                [{ b: 42 }, true, { context: { a: 1337 } }],
                [{ b: 1337 }, false, { context: { a: 42 } }],
                [{ b: 2.4 }, true, { context: { a: 4.2 } }],
                [{ b: 4.20000001 }, false, { context: { a: 4.2 } }],
                [{ b: 4.2 }, true, { context: { a: 4.20000001 } }],
                [{ b: 4.2 }, false, { context: { a: 2.4 } }, 'child "b" fails because ["b" must be less than or equal to 2.4]']
            ], done);
        });

        it('errors if reference is not a number', (done) => {

            const schema = Joi.object({ a: Joi.string(), b: Joi.number().max(Joi.ref('a')) });

            Helper.validate(schema, [
                [{ a: 'abc', b: 42 }, false, null, 'child "b" fails because ["b" references "a" which is not a number]']
            ], done);
        });

        it('errors if context reference is not a number', (done) => {

            const schema = Joi.object({ b: Joi.number().max(Joi.ref('$a')) });

            Helper.validate(schema, [
                [{ b: 42 }, false, { context: { a: 'abc' } }, 'child "b" fails because ["b" references "a" which is not a number]']
            ], done);
        });
    });

    describe('less()', () => {

        it('throws when limit is not a number', (done) => {

            expect(() => {

                Joi.number().less('a');
            }).to.throw('limit must be a number or reference');
            done();
        });

        it('accepts references as less value', (done) => {

            const schema = Joi.object({ a: Joi.number(), b: Joi.number().less(Joi.ref('a')) });

            Helper.validate(schema, [
                [{ a: 1337, b: 42 }, true],
                [{ a: 42, b: 1337 }, false],
                [{ a: '42', b: 1337 }, false, null, 'child "b" fails because ["b" must be less than 42]'],
                [{ a: 4.2, b: 2.4 }, true],
                [{ a: 4.2, b: 4.20000001 }, false],
                [{ a: 4.20000001, b: 4.2 }, true],
                [{ a: 2.4, b: 4.2 }, false, null, 'child "b" fails because ["b" must be less than 2.4]']
            ], done);
        });

        it('accepts context references as less value', (done) => {

            const schema = Joi.object({ b: Joi.number().less(Joi.ref('$a')) });

            Helper.validate(schema, [
                [{ b: 42 }, true, { context: { a: 1337 } }],
                [{ b: 1337 }, false, { context: { a: 42 } }],
                [{ b: 2.4 }, true, { context: { a: 4.2 } }],
                [{ b: 4.20000001 }, false, { context: { a: 4.2 } }],
                [{ b: 4.2 }, true, { context: { a: 4.20000001 } }],
                [{ b: 4.2 }, false, { context: { a: 2.4 } }, 'child "b" fails because ["b" must be less than 2.4]']
            ], done);
        });

        it('errors if reference is not a number', (done) => {

            const schema = Joi.object({ a: Joi.string(), b: Joi.number().less(Joi.ref('a')) });

            Helper.validate(schema, [
                [{ a: 'abc', b: 42 }, false, null, 'child "b" fails because ["b" references "a" which is not a number]']
            ], done);
        });

        it('errors if context reference is not a number', (done) => {

            const schema = Joi.object({ a: Joi.string(), b: Joi.number().less(Joi.ref('$a')) });

            Helper.validate(schema, [
                [{ b: 42 }, false, { context: { a: 'abc' } }, 'child "b" fails because ["b" references "a" which is not a number]']
            ], done);
        });
    });

    describe('greater()', () => {

        it('throws when limit is not a number', (done) => {

            expect(() => {

                Joi.number().greater('a');
            }).to.throw('limit must be a number or reference');
            done();
        });

        it('accepts references as greater value', (done) => {

            const schema = Joi.object({ a: Joi.number(), b: Joi.number().greater(Joi.ref('a')) });

            Helper.validate(schema, [
                [{ a: 42, b: 1337 }, true],
                [{ a: 1337, b: 42 }, false],
                [{ a: '1337', b: 42 }, false, null, 'child "b" fails because ["b" must be greater than 1337]'],
                [{ a: 2.4, b: 4.2 }, true],
                [{ a: 4.2, b: 4.20000001 }, true],
                [{ a: 4.20000001, b: 4.2 }, false],
                [{ a: 4.2, b: 2.4 }, false, null, 'child "b" fails because ["b" must be greater than 4.2]']
            ], done);
        });

        it('accepts context references as greater value', (done) => {

            const schema = Joi.object({ b: Joi.number().greater(Joi.ref('$a')) });

            Helper.validate(schema, [
                [{ b: 1337 }, true, { context: { a: 42 } }],
                [{ b: 42 }, false, { context: { a: 1337 } }],
                [{ b: 4.2 }, true, { context: { a: 2.4 } }],
                [{ b: 4.20000001 }, true, { context: { a: 4.2 } }],
                [{ b: 4.2 }, false, { context: { a: 4.20000001 } }],
                [{ b: 2.4 }, false, { context: { a: 4.2 } }, 'child "b" fails because ["b" must be greater than 4.2]']
            ], done);
        });

        it('errors if reference is not a number', (done) => {

            const schema = Joi.object({ a: Joi.string(), b: Joi.number().greater(Joi.ref('a')) });

            Helper.validate(schema, [
                [{ a: 'abc', b: 42 }, false, null, 'child "b" fails because ["b" references "a" which is not a number]']
            ], done);
        });

        it('errors if context reference is not a number', (done) => {

            const schema = Joi.object({ b: Joi.number().greater(Joi.ref('$a')) });

            Helper.validate(schema, [
                [{ b: 42 }, false, { context: { a: 'abc' } }, 'child "b" fails because ["b" references "a" which is not a number]']
            ], done);
        });
    });

    describe('precision()', () => {

        it('converts numbers', (done) => {

            const rule = Joi.number().precision(4);
            Helper.validate(rule, [
                [1.5, true, null, 1.5],
                [0.12345, true, null, 0.1235],
                [123456, true, null, 123456],
                [123456.123456, true, null, 123456.1235],
                ['123456.123456', true, null, 123456.1235],
                ['abc', false],
                [NaN, false]
            ], done);
        });
    });

    describe('describe()', () => {

        it('should describe a minimum of 0', (done) => {

            const schema = Joi.number().min(0);
            expect(schema.describe()).to.deep.equal({
                type: 'number',
                invalids: [Infinity, -Infinity],
                rules: [
                    {
                        name: 'min',
                        arg: 0
                    }
                ]
            });
            done();
        });
    });

    describe('multiple()', () => {

        it('throws when multiple is not a number', (done) => {

            expect(() => {

                Joi.number().multiple('a');
            }).to.throw('multiple must be an integer');
            done();
        });

        it('throws when multiple is 0', (done) => {

            expect(() => {

                Joi.number().multiple(0);
            }).to.throw('multiple must be greater than 0');
            done();
        });

        it('should handle multiples correctly', (done) => {

            const rule = Joi.number().multiple(3);
            Helper.validate(rule, [
                [0, true], // 0 is a multiple of every integer
                [3, true],
                [4, false],
                [9, true],
                ['a', false],
                [9.1, false],
                [8.9, false]
            ], done);
        });
    });
});
