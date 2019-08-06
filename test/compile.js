'use strict';

const Code = require('@hapi/code');
const Joi = require('..');
const Lab = require('@hapi/lab');
const Legacy = require('@hapi/joi-legacy-test');


const internals = {};


const { describe, it } = exports.lab = Lab.script();
const { expect } = Code;


describe('cast', () => {

    describe('schema()', () => {

        it('casts templates', () => {

            const schema = Joi.object({
                a: Joi.number(),
                b: Joi.x('{a + 1}')
            });

            expect(schema.validate({ a: 5, b: 6 }).error).to.not.exist();
        });
    });

    describe('compile()', () => {

        it('compiles object with plain keys', () => {

            const schema = {
                a: 1
            };

            expect(Joi.isSchema(schema)).to.be.false();

            const compiled = Joi.compile(schema);
            expect(Joi.isSchema(compiled)).to.be.true();
        });

        it('compiles object with schema keys', () => {

            const schema = {
                a: Joi.number()
            };

            expect(Joi.isSchema(schema)).to.be.false();

            const compiled = Joi.compile(schema);
            expect(Joi.isSchema(compiled)).to.be.true();
        });

        it('errors on legacy schema', () => {

            const schema = Legacy.number();
            expect(() => Joi.compile(schema)).to.throw('Cannot mix different versions of joi schemas');
            expect(() => Joi.compile(schema, { legacy: true })).to.not.throw();
        });

        it('errors on legacy keys', () => {

            const schema = {
                a: Legacy.number()
            };

            expect(() => Joi.compile(schema)).to.throw('Cannot mix different versions of joi schemas (a)');
        });

        describe('legacy', () => {

            it('compiles object with plain keys', () => {

                const schema = {
                    a: 1,
                    b: [2, 3]
                };

                expect(Joi.isSchema(schema)).to.be.false();

                const compiled = Joi.compile(schema, { legacy: true });
                expect(Joi.isSchema(compiled)).to.be.true();
            });

            it('compiles object with schema keys (v16)', () => {

                const schema = {
                    a: Joi.number()
                };

                expect(Joi.isSchema(schema)).to.be.false();

                const compiled = Joi.compile(schema, { legacy: true });
                expect(Joi.isSchema(compiled)).to.be.true();
            });

            it('compiles object with schema array items (v16)', () => {

                const schema = {
                    a: [Joi.number()]
                };

                expect(Joi.isSchema(schema)).to.be.false();

                const compiled = Joi.compile(schema, { legacy: true });
                expect(Joi.isSchema(compiled)).to.be.true();
            });

            it('compiles object with schema keys (v15)', () => {

                const schema = {
                    a: Legacy.number()
                };

                expect(Joi.isSchema(schema)).to.be.false();

                const compiled = Joi.compile(schema, { legacy: true });
                expect(Joi.isSchema(compiled, { legacy: true })).to.be.true();
                expect(() => Joi.isSchema(compiled)).to.throw('Cannot mix different versions of joi schemas');
            });

            it('compiles object with schema keys (v15)', () => {

                const schema = {
                    a: [Legacy.number()]
                };

                expect(Joi.isSchema(schema)).to.be.false();

                const compiled = Joi.compile(schema, { legacy: true });
                expect(Joi.isSchema(compiled, { legacy: true })).to.be.true();
                expect(() => Joi.isSchema(compiled)).to.throw('Cannot mix different versions of joi schemas');
            });
        });
    });
});
