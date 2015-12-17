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
            ['', false]
        ], done);
    });

    it('validates a function with keys', (done) => {

        const a = function () { };
        a.a = 'abc';

        const b = function () { };
        b.a = 123;

        Helper.validate(Joi.func().keys({ a: Joi.string().required() }).required(), [
            [function () { }, false],
            [a, true],
            [b, false],
            ['', false]
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
