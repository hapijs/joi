'use strict';

const Code = require('@hapi/code');
const Lab = require('@hapi/lab');
const Joi = require('..');


const internals = {};


const { describe, it } = exports.lab = Lab.script();
const { expect } = Code;


describe('Manipulate', () => {

    describe('reach()', () => {

        it('should fail without any parameter', () => {

            expect(() => Joi.reach()).to.throw('you must provide a joi schema');
        });

        it('should fail when schema is not a joi object', () => {

            expect(() => Joi.reach({ foo: 'bar' }, 'foo')).to.throw('you must provide a joi schema');
        });

        it('should fail without a proper path', () => {

            const schema = Joi.object();
            expect(() => Joi.reach(schema)).to.throw('path must be a string or an array of strings');
            expect(() => Joi.reach(schema, true)).to.throw('path must be a string or an array of strings');
        });

        it('should return undefined when no keys are defined', () => {

            const schema = Joi.object();
            expect(Joi.reach(schema, 'a')).to.be.undefined();
        });

        it('should return undefined when key is not found', () => {

            const schema = Joi.object().keys({ a: Joi.number() });
            expect(Joi.reach(schema, 'foo')).to.be.undefined();
        });

        it('should return a schema when key is found', () => {

            const a = Joi.number();
            const schema = Joi.object().keys({ a });
            expect(Joi.reach(schema, 'a')).to.shallow.equal(a);
        });

        it('should return a schema when key as array is found', () => {

            const a = Joi.number();
            const schema = Joi.object().keys({ a });
            expect(Joi.reach(schema, ['a'])).to.shallow.equal(a);
        });

        it('throws on a schema that does not support reach', () => {

            const schema = Joi.number();
            expect(() => Joi.reach(schema, 'a')).to.throw('Cannot reach into number schema type');
        });

        it('should return a schema when deep key is found', () => {

            const bar = Joi.number();
            const schema = Joi.object({ foo: Joi.object({ bar }) });
            expect(Joi.reach(schema, 'foo.bar')).to.shallow.equal(bar);
        });

        it('should return a schema when deep key is found', () => {

            const bar = Joi.number();
            const schema = Joi.object({ foo: Joi.object({ bar }) });
            expect(Joi.reach(schema, ['foo', 'bar'])).to.shallow.equal(bar);
        });

        it('should return undefined when deep key is not found', () => {

            const schema = Joi.object({ foo: Joi.object({ bar: Joi.number() }) });
            expect(Joi.reach(schema, 'foo.baz')).to.be.undefined();
        });

        it('should return the same schema with an empty path', () => {

            const schema = Joi.object();
            expect(Joi.reach(schema, '')).to.shallow.equal(schema);
        });
    });
});
