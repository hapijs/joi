'use strict';

const Code = require('@hapi/code');
const Lab = require('@hapi/lab');
const Joi = require('../..');

const Helper = require('../helper');


const internals = {};


const { describe, it } = exports.lab = Lab.script();
const { expect } = Code;


describe('symbol', () => {

    it('cannot be called on its own', () => {

        const symbol = Joi.symbol;
        expect(() => symbol()).to.throw('Must be invoked on a Joi instance.');
    });

    it('should throw an exception if arguments were passed.', () => {

        expect(() => Joi.symbol('invalid argument.')).to.throw('The symbol type does not allow arguments');
    });

    describe('clone()', () => {

        it('clones a symbols type', () => {

            const schema = Joi.symbol();
            const clone = schema.clone();
            Helper.equal(schema, clone);
            expect(schema).to.not.shallow.equal(clone);
        });
    });

    describe('validate()', () => {

        it('handles plain symbols', () => {

            const symbols = [Symbol(1), Symbol(2)];
            const rule = Joi.symbol();
            Helper.validate(rule, [
                [symbols[0], true, symbols[0]],
                [symbols[1], true, symbols[1]],
                [1, false, {
                    message: '"value" must be a symbol',
                    path: [],
                    type: 'symbol.base',
                    context: { label: 'value', value: 1 }
                }]
            ]);
        });

        it('handles simple lookup', () => {

            const symbols = [Symbol(1), Symbol(2)];
            const otherSymbol = Symbol(1);
            const rule = Joi.symbol().valid(...symbols);
            Helper.validate(rule, [
                [symbols[0], true, symbols[0]],
                [symbols[1], true, symbols[1]],
                [otherSymbol, false, {
                    message: '"value" must be one of [Symbol(1), Symbol(2)]',
                    path: [],
                    type: 'any.only',
                    context: { value: otherSymbol, label: 'value', valids: symbols }
                }]
            ]);
        });

        describe('map', () => {

            it('converts keys to correct symbol', () => {

                const symbols = [Symbol(1), Symbol(2)];
                const otherSymbol = Symbol(1);
                const map = new Map([[1, symbols[0]], ['two', symbols[1]]]);
                const rule = Joi.symbol().map(map);
                Helper.validate(rule, [
                    [1, true, symbols[0]],
                    [symbols[0], true, symbols[0]],
                    ['1', false, {
                        message: `"value" must be one of [1 -> Symbol(1), two -> Symbol(2)]`,
                        path: [],
                        type: 'symbol.map',
                        context: { label: 'value', value: '1', map }
                    }],
                    ['two', true, symbols[1]],
                    [otherSymbol, false, {
                        message: '"value" must be one of [Symbol(1), Symbol(2)]',
                        path: [],
                        type: 'any.only',
                        context: { value: otherSymbol, label: 'value', valids: symbols }
                    }]
                ]);
            });

            it('converts keys from object', () => {

                const symbols = [Symbol('one'), Symbol('two')];
                const otherSymbol = Symbol('one');
                const rule = Joi.symbol().map({ one: symbols[0], two: symbols[1] });
                Helper.validate(rule, [
                    [symbols[0], true, symbols[0]],
                    ['one', true, symbols[0]],
                    ['two', true, symbols[1]],
                    [otherSymbol, false, {
                        message: '"value" must be one of [Symbol(one), Symbol(two)]',
                        path: [],
                        type: 'any.only',
                        context: { value: otherSymbol, label: 'value', valids: symbols }
                    }],
                    ['toString', false, {
                        message: `"value" must be one of [one -> Symbol(one), two -> Symbol(two)]`,
                        path: [],
                        type: 'symbol.map',
                        context: { label: 'value', value: 'toString', map: new Map([['one', symbols[0]], ['two', symbols[1]]]) }
                    }]
                ]);
            });

            it('appends to existing map', () => {

                const symbols = [Symbol(1), Symbol(2)];
                const otherSymbol = Symbol(1);
                const rule = Joi.symbol().map([[1, symbols[0]]]).map([[2, symbols[1]]]);
                Helper.validate(rule, [
                    [1, true, symbols[0]],
                    [2, true, symbols[1]],
                    [otherSymbol, false, {
                        message: '"value" must be one of [Symbol(1), Symbol(2)]',
                        path: [],
                        type: 'any.only',
                        context: { value: otherSymbol, label: 'value', valids: symbols }
                    }]
                ]);
            });

            it('throws on bad input', () => {

                expect(
                    () => Joi.symbol().map()
                ).to.throw('Iterable must be an iterable or object');

                expect(
                    () => Joi.symbol().map(Symbol())
                ).to.throw('Iterable must be an iterable or object');

                expect(
                    () => Joi.symbol().map([undefined])
                ).to.throw('Entry must be an iterable');

                expect(
                    () => Joi.symbol().map([123])
                ).to.throw('Entry must be an iterable');

                expect(
                    () => Joi.symbol().map([[123, 456]])
                ).to.throw('Value must be a Symbol');

                expect(
                    () => Joi.symbol().map([[{}, Symbol()]])
                ).to.throw('Key must not be of type object, function, or Symbol');

                expect(
                    () => Joi.symbol().map([[() => { }, Symbol()]])
                ).to.throw('Key must not be of type object, function, or Symbol');

                expect(
                    () => Joi.symbol().map([[Symbol(), Symbol()]])
                ).to.throw('Key must not be of type object, function, or Symbol');
            });
        });

        it('handles plain symbols when convert is disabled', () => {

            const symbols = [Symbol(1), Symbol(2)];
            const schema = Joi.symbol().map([[1, symbols[0]], ['two', symbols[1]]]).prefs({ convert: false });
            Helper.validate(schema, [[symbols[1], true, symbols[1]]]);
        });

        it('errors on mapped input and convert is disabled', () => {

            const symbols = [Symbol(1), Symbol(2)];
            const schema = Joi.symbol().map([[1, symbols[0]], ['two', symbols[1]]]).prefs({ convert: false });
            Helper.validate(schema, [[1, false, {
                message: '"value" must be one of [Symbol(1), Symbol(2)]',
                path: [],
                type: 'any.only',
                context: { value: 1, valids: symbols, label: 'value' }
            }]]);
        });
    });
});
