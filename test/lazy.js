'use strict';

// Load modules

const Lab = require('lab');
const Code = require('code');
const Joi = require('../lib');
const Lazy = require('../lib/lazy');
const Helper = require('./helper');


// Declare internals

const internals = {};


// Test shortcuts

const lab = exports.lab = Lab.script();
const describe = lab.describe;
const it = lab.it;
const expect = Code.expect;


describe('lazy', () => {

    describe('set()', () => {

        it('should require a function', (done) => {

            expect(() => Joi.lazy()).to.throw('You must provide a function as first argument');
            expect(() => Joi.lazy(true)).to.throw('You must provide a function as first argument');
            done();
        });

        it('should validate a schema is set', (done) => {

            const schema = Lazy;
            schema.validate('bar', (err, value) => {

                expect(err).to.be.an.error('schema error: lazy schema must be set');
                done();
            });
        });

        it('should validate a schema is returned', (done) => {

            const schema = Joi.lazy(() => true, 'foo');
            schema.validate('bar', (err, value) => {

                expect(err).to.be.an.error('schema error: lazy schema function must return a schema');
                done();
            });
        });

    });

    describe('validate()', () => {

        it('should validate a recursive schema', (done) => {

            const schema = Joi.object({
                name: Joi.string().required(),
                children: Joi.array().items(Joi.lazy(() => schema))
            });

            Helper.validate(schema, [
                [{ name: 'foo' }, true],
                [{ name: 'foo', children: [] }, true],
                [{ name: 'foo', children: [{ name: 'bar' }] }, true],
                [{ name: 'foo', children: [{ name: 'bar', children: [{ name: 'baz' }] }] }, true],
                [{ name: 'foo', children: [{ name: 'bar', children: [{ name: 'baz', children: [{ name: 'qux' }] }] }] }, true],
                [{ name: 'foo', children: [{ name: 'bar', children: [{ name: 'baz', children: [{ name: 42 }] }] }] }, false, null, 'child "children" fails because ["children" at position 0 fails because [child "children" fails because ["children" at position 0 fails because [child "children" fails because ["children" at position 0 fails because [child "name" fails because ["name" must be a string]]]]]]]']
            ], done);
        });

    });

    describe('describe()', () => {

        it('should be able to describe with description', (done) => {

            const schema = Joi.object({
                name: Joi.string().required(),
                children: Joi.array().items(Joi.lazy(() => schema).description('person'))
            });

            expect(schema.describe()).to.equal({
                type: 'object',
                children: {
                    children: {
                        type: 'array',
                        flags: {
                            sparse: false
                        },
                        items: [
                            {
                                type: 'lazy',
                                description: 'person',
                                flags: {}
                            }
                        ]
                    },
                    name: {
                        type: 'string',
                        flags: { presence: 'required' },
                        invalids: ['']
                    }
                }
            });

            done();
        });

    });
});
