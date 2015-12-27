'use strict';

// Load modules

const Code = require('code');
const Lab = require('lab');
const Joi = require('../lib');
const Helper = require('./helper');


// Declare internals

const internals = {};


// Test shortcuts

const lab = exports.lab = Lab.script();
const describe = lab.describe;
const it = lab.it;
const expect = Code.expect;


describe('func', () => {

    it('validates a function', (done) => {

        Helper.validate(Joi.func().required(), [
            [function () { }, true],
            ['', false, null, '"value" must be a Function']
        ], done);
    });

    it('validates a function arity', (done) => {

        Helper.validate(Joi.func().arity(2).required(), [
            [function (a,b) { }, true],
            [function (a,b,c) { }, false, null, '"value" must have an arity of 2'],
            [function (a) { }, false, null, '"value" must have an arity of 2'],
            [(a,b) => { }, true],
            [(a,b,c) => { }, false, null, '"value" must have an arity of 2'],
            [(a) => { }, false, null, '"value" must have an arity of 2'],
            ['', false, null, '"value" must be a Function']
        ], done);
    });

    it('validates a function arity unless values are illegal', (done) => {

        const schemaWithStringArity = function (){

            return Joi.func().arity('deux');
        };

        const schemaWithNegativeArity = function (){

            return Joi.func().arity(-2);
        };

        expect(schemaWithStringArity).to.throw(Error, 'n must be a positive integer');
        expect(schemaWithNegativeArity).to.throw(Error, 'n must be a positive integer');
        done();
    });

    it('validates a function min arity', (done) => {

        Helper.validate(Joi.func().minArity(2).required(), [
            [function (a,b) { }, true],
            [function (a,b,c) { }, true],
            [function (a) { }, false, null, '"value" must have an arity greater or equal to 2'],
            [(a,b) => { }, true],
            [(a,b,c) => { }, true],
            [(a) => { }, false, null, '"value" must have an arity greater or equal to 2'],
            ['', false, null, '"value" must be a Function']
        ], done);
    });

    it('validates a function arity unless values are illegal', (done) => {

        const schemaWithStringMinArity = function (){

            return Joi.func().minArity('deux');
        };

        const schemaWithNegativeMinArity = function (){

            return Joi.func().minArity(-2);
        };

        const schemaWithZeroArity = function (){

            return Joi.func().minArity(0);
        };

        expect(schemaWithStringMinArity).to.throw(Error, 'n must be a strict positive integer');
        expect(schemaWithNegativeMinArity).to.throw(Error, 'n must be a strict positive integer');
        expect(schemaWithZeroArity).to.throw(Error, 'n must be a strict positive integer');
        done();
    });

    it('validates a function max arity', (done) => {

        Helper.validate(Joi.func().maxArity(2).required(), [
            [function (a,b) { }, true],
            [function (a,b,c) { }, false, null, '"value" must have an arity lesser or equal to 2'],
            [function (a) { }, true],
            [(a,b) => { }, true],
            [(a,b,c) => { }, false, null, '"value" must have an arity lesser or equal to 2'],
            [(a) => { }, true],
            ['', false, null, '"value" must be a Function']
        ], done);
    });

    it('validates a function arity unless values are illegal', (done) => {

        const schemaWithStringMaxArity = function (){

            return Joi.func().maxArity('deux');
        };

        const schemaWithNegativeMaxArity = function (){

            return Joi.func().maxArity(-2);
        };
        expect(schemaWithStringMaxArity).to.throw('n must be a positive integer');
        expect(schemaWithNegativeMaxArity).to.throw('n must be a positive integer');
        done();
    });

    it('validates a function with keys', (done) => {

        const a = function () { };
        a.a = 'abc';

        const b = function () { };
        b.a = 123;

        Helper.validate(Joi.func().keys({ a: Joi.string().required() }).required(), [
            [function () { }, false],
            [a, true],
            [b, false, null, 'child "a" fails because ["a" must be a string]'],
            ['', false, null, '"value" must be a Function']
        ], done);
    });

    it('keeps validated value as a function', (done) => {

        const schema = Joi.func().keys({ a: Joi.number() });

        const b = 'abc';
        const value = function () {

            return b;
        };

        value.a = '123';

        schema.validate(value, (err, validated) => {

            expect(err).not.to.exist();
            expect(validated).to.be.a.function();
            expect(validated()).to.equal('abc');
            expect(validated).to.not.equal(value);
            done();
        });
    });

    it('retains validated value prototype', (done) => {

        const schema = Joi.func().keys({ a: Joi.number() });

        const value = function () {

            this.x = 'o';
        };

        value.prototype.get = function () {

            return this.x;
        };

        schema.validate(value, (err, validated) => {

            expect(err).not.to.exist();
            expect(validated).to.be.a.function();
            const p = new validated();
            expect(p.get()).to.equal('o');
            expect(validated).to.not.equal(value);
            done();
        });
    });

    it('keeps validated value as a function (no clone)', (done) => {

        const schema = Joi.func();

        const b = 'abc';
        const value = function () {

            return b;
        };

        value.a = '123';

        schema.validate(value, (err, validated) => {

            expect(err).not.to.exist();
            expect(validated).to.be.a.function();
            expect(validated()).to.equal('abc');
            expect(validated).to.equal(value);
            done();
        });
    });
});
