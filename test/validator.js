'use strict';

const Code = require('@hapi/code');
const Hoek = require('@hapi/hoek');
const Joi = require('..');
const Lab = require('@hapi/lab');

const Helper = require('./helper');

const internals = {};


const { describe, it } = exports.lab = Lab.script();
const { expect } = Code;


describe('Validator', () => {

    describe('entryAsync()', () => {

        it('should work with a successful promise', async () => {

            expect(await Joi.string().validateAsync('foo')).to.equal('foo');
        });

        it('should work with a successful promise and a catch in between', () => {

            const promise = Joi.string().validateAsync('foo');

            return promise
                .catch(() => {

                    throw new Error('Should not go here');
                })
                .then((value) => {

                    expect(value).to.equal('foo');
                }, () => {

                    throw new Error('Should not go here');
                });
        });

        it('should work with a failing promise', () => {

            const promise = Joi.string().validateAsync(0);

            return promise.then((value) => {

                throw new Error('Should not go here');
            }, (err) => {

                expect(err).to.be.an.error('"value" must be a string');
                expect(err.details).to.equal([{
                    message: '"value" must be a string',
                    path: [],
                    type: 'string.base',
                    context: { value: 0, label: 'value' }
                }]);
            });
        });

        it('should work with a failing promise and a then in between', () => {

            const promise = Joi.string().validateAsync(0);

            return promise
                .then((value) => {

                    throw new Error('Should not go here');
                })
                .catch((err) => {

                    expect(err).to.be.an.error('"value" must be a string');
                    expect(err.details).to.equal([{
                        message: '"value" must be a string',
                        path: [],
                        type: 'string.base',
                        context: { value: 0, label: 'value' }
                    }]);
                });
        });

        it('should work with a failing promise (with catch)', () => {

            const promise = Joi.string().validateAsync(0);

            return promise.catch((err) => {

                expect(err).to.be.an.error('"value" must be a string');
                expect(err.details).to.equal([{
                    message: '"value" must be a string',
                    path: [],
                    type: 'string.base',
                    context: { value: 0, label: 'value' }
                }]);
            });
        });

        it('should catch errors in a successful promise callback', () => {

            const promise = Joi.string().validateAsync('foo');

            return promise.then((value) => {

                throw new Error('oops');
            }).then(() => {

                throw new Error('Should not go here');
            }, (err) => {

                expect(err).to.be.an.error('oops');
            });
        });

        it('should catch errors in a failing promise callback', () => {

            const promise = Joi.string().validateAsync(0);

            return promise.then((value) => {

                throw new Error('Should not go here');
            }, () => {

                throw new Error('oops');
            }).then(() => {

                throw new Error('Should not go here');
            }, (err) => {

                expect(err).to.be.an.error('oops');
            });
        });

        it('should catch errors in a failing promise callback (with catch)', () => {

            const promise = Joi.string().validateAsync(0);

            return promise.catch(() => {

                throw new Error('oops');
            }).then(() => {

                throw new Error('Should not go here');
            }, (err) => {

                expect(err).to.be.an.error('oops');
            });
        });

        it('validates schema', async () => {

            const schema = Joi.number();
            expect(await schema.validateAsync(5)).to.equal(5);
        });

        it('validates schema with warnings (empty)', async () => {

            const schema = Joi.number();
            expect(await schema.validateAsync(5, { warnings: true })).to.equal({ value: 5 });
        });
    });

    describe('externals()', () => {

        it('executes externals on object child', async () => {

            const check = async (id) => {

                await Hoek.wait();

                if (id === 'valid') {
                    return 'verified';
                }

                if (id === 'skip') {
                    return;
                }

                throw new Error('Invalid id');
            };

            const append = async (id) => {

                await Hoek.wait();
                return id + '!';
            };

            const schema = Joi.object({
                id: Joi.string().external(check).external(append)
            });

            expect(await schema.validateAsync({ id: 'valid' })).to.equal({ id: 'verified!' });
            expect(await schema.validateAsync({ id: 'skip' })).to.equal({ id: 'skip!' });
        });

        it('executes externals on nested object child', async () => {

            const check = async (id) => {

                await Hoek.wait();

                if (id === 'valid') {
                    return 'verified';
                }

                if (id === 'skip') {
                    return;
                }

                if (id === 'unchanged') {
                    return id;
                }

                throw new Error('Invalid id');
            };

            const append = async (id) => {

                await Hoek.wait();
                return id + '!';
            };

            const schema = Joi.object({
                user: {
                    id: Joi.string().external(check).external(append)
                }
            });

            expect(await schema.validateAsync({ user: { id: 'valid' } })).to.equal({ user: { id: 'verified!' } });
            expect(await schema.validateAsync({ user: { id: 'skip' } })).to.equal({ user: { id: 'skip!' } });
            expect(await schema.validateAsync({ user: { id: 'unchanged' } })).to.equal({ user: { id: 'unchanged!' } });
            await expect(schema.validateAsync({ user: { id: 'other' } })).to.reject('Invalid id (user.id)');
        });

        it('executes externals on root', async () => {

            const check = async (id) => {

                await Hoek.wait();
                if (id === 'valid') {
                    return 'verified';
                }

                throw new Error('Invalid id');
            };

            const append = async (id) => {

                await Hoek.wait();
                return id + '!';
            };

            const schema = Joi.string().external(check).external(append);

            const result = await schema.validateAsync('valid');
            expect(result).to.equal('verified!');
        });

        it('executes externals on array item', async () => {

            const check = async (id) => {

                await Hoek.wait();

                if (id === 'valid') {
                    return 'verified';
                }

                if (id === 'skip') {
                    return;
                }

                throw new Error('Invalid id');
            };

            const append = async (id) => {

                await Hoek.wait();
                return id + '!';
            };

            const schema = Joi.array().items(Joi.string().external(check).external(append));

            expect(await schema.validateAsync(['valid'])).to.equal(['verified!']);
            expect(await schema.validateAsync(['skip'])).to.equal(['skip!']);
        });

        it('executes externals on array', async () => {

            const schema = Joi.array().items(Joi.string()).external((value) => [...value, 'extra']);

            expect(await schema.validateAsync(['valid'])).to.equal(['valid', 'extra']);
        });

        it('skips externals when prefs is false', async () => {

            const check = (id) => {

                throw new Error('Invalid id');
            };

            const schema = Joi.object({
                id: Joi.string().external(check)
            });

            await expect(schema.validateAsync({ id: 'valid' })).to.reject('Invalid id (id)');
            expect(() => schema.validate({ id: 'valid' }, { externals: false })).to.not.throw();
            expect(() => schema.validate({ id: 'valid' })).to.throw('Schema with external rules must use validateAsync()');
        });

        it('skips externals when validation failed', async () => {

            let called = false;
            const check = (id) => {

                called = true;
            };

            const schema = Joi.object({
                id: Joi.string().min(10).external(check)
            });

            await expect(schema.validateAsync({ id: 'valid' })).to.reject('"id" length must be at least 10 characters long');
            expect(called).to.be.false();
        });

        it('supports describe', () => {

            const append = async (id) => {

                await Hoek.wait();
                return id + '!';
            };

            const schema = Joi.string().external(append);
            const description = schema.describe();
            expect(description).to.equal({ type: 'string', externals: [{ method: append }] });
        });

        it('skips when used to match', async () => {

            let called = false;
            const check = () => {

                called = true;
            };

            const schema = Joi.array().has(Joi.string().external(check));

            const result = await schema.validateAsync(['valid']);
            expect(result).to.equal(['valid']);
            expect(called).to.be.false();
        });

        it('does not modify original value on generic object', async () => {

            const tag = (obj) => {

                obj.x = true;
            };

            const schema = Joi.object().external(tag);
            const input = { x: false };

            const result = await schema.validateAsync(input);
            expect(result).to.equal({ x: true });
            expect(input).to.equal({ x: false });
        });

        it('does not modify original value on nested object', async () => {

            const tag = (obj) => {

                obj.x = true;
            };

            const schema = Joi.object({ a: Joi.object().external(tag) });
            const input = { a: { x: false } };

            const result = await schema.validateAsync(input);
            expect(result).to.equal({ a: { x: true } });
            expect(input).to.equal({ a: { x: false } });
        });

        it('does not modify original value on generic array', async () => {

            const tag = (array) => {

                array.push('x');
            };

            const schema = Joi.array().external(tag);
            const input = [1];

            const result = await schema.validateAsync(input);
            expect(result).to.equal([1, 'x']);
            expect(input).to.equal([1]);
        });

        it('does not modify original value on nested array', async () => {

            const tag = (array) => {

                array.push('x');
            };

            const schema = Joi.array().items(Joi.array().external(tag));
            const input = [[1]];

            const result = await schema.validateAsync(input);
            expect(result).to.equal([[1, 'x']]);
            expect(input).to.equal([[1]]);
        });

        it('has access to helpers', async () => {

            const context = { foo: 'bar' };

            const tag = (value, helpers) => {

                expect(value).to.equal('my stringmy string');
                expect(helpers).to.be.an.object();
                expect(Joi.isSchema(helpers.schema)).to.be.true();
                expect(helpers.schema.type).to.equal('string');
                expect(helpers.state).to.be.an.object();
                expect(helpers.state.ancestors).to.equal([]);
                expect(helpers.state.path).to.equal([]);
                expect(helpers.prefs.context).to.equal({ foo: 'bar' });
                expect(helpers.original).to.equal('my string');
                expect(helpers.warn).to.be.a.function();
                expect(helpers.message).to.be.a.function();
                return helpers.prefs.context.foo;
            };

            const schema = Joi.string().custom((v) => v + v).external(tag);
            const input = 'my string';

            const result = await schema.validateAsync(input, { context });
            expect(result).to.equal('bar');
        });

        it('has access to helpers on nested objects', async () => {

            const context = { foo: 'bar' };

            const ext = (value, helpers) => {

                expect(value).to.equal('my stringmy string');
                expect(helpers).to.be.an.object();
                expect(Joi.isSchema(helpers.schema)).to.be.true();
                expect(helpers.schema.type).to.equal('string');
                expect(helpers.state).to.be.an.object();
                expect(helpers.state.ancestors).to.equal([
                    { parent: 'my stringmy string' },
                    {
                        grandparent: { parent: 'my stringmy string' }
                    }
                ]);
                expect(helpers.state.path).to.equal(['grandparent', 'parent']);
                expect(helpers.prefs.context).to.equal({ foo: 'bar' });
                expect(helpers.original).to.equal('my string');
                expect(helpers.warn).to.be.a.function();
                expect(helpers.message).to.be.a.function();
                return helpers.prefs.context.foo;
            };

            const schema = Joi.object({
                grandparent: Joi.object({
                    parent: Joi.string().custom((v) => v + v).external(ext)
                })
            });
            const input = { grandparent: { parent: 'my string' } };

            const result = await schema.validateAsync(input, { context });
            expect(result).to.equal({ grandparent: { parent: 'bar' } });
        });

        it('changes the message depending on label\'s value', async () => {

            const context = { foo: 'bar' };

            const tag = (value, { prefs }) => {

                throw new Error('Oops');
            };

            const schema = Joi.string().external(tag);
            const input = 'my string';

            await expect(schema.validateAsync(input, { context })).to.reject('Oops (value)');
            await expect(schema.validateAsync(input, { context, errors: { label: false } })).to.reject('Oops');
        });

        it('should add warnings when warn helper is used', async () => {

            const ext = (value, { warn }) => {

                const newValue = value + value;

                warn('string.max', { limit: 10, value: newValue });
                warn('string.min', { limit: 1, value: newValue });

                return newValue;
            };

            const schema = Joi.string().external(ext);
            const input = 'my string';

            const result = await schema.validateAsync(input, { warnings: true });
            expect(result.value).to.equal('my stringmy string');
            expect(result.warning).to.equal({
                message: '"value" length must be less than or equal to 10 characters long. "value" length must be at least 1 characters long',
                details: [
                    {
                        message: '"value" length must be less than or equal to 10 characters long',
                        path: [],
                        type: 'string.max',
                        context: {
                            label: 'value',
                            limit: 10,
                            value: 'my stringmy string'
                        }
                    },
                    {
                        message: '"value" length must be at least 1 characters long',
                        path: [],
                        type: 'string.min',
                        context: {
                            label: 'value',
                            limit: 1,
                            value: 'my stringmy string'
                        }
                    }
                ]
            });
        });

        it('should add errors when error helper is used', async () => {

            const ext = (value, { error }) => {

                const newValue = value + value;

                return error('string.max', { limit: 10, value: newValue });
            };

            const schema = Joi.string().external(ext);
            const input = 'my string';

            const error = await expect(schema.validateAsync(input)).to.reject('"value" length must be less than or equal to 10 characters long');
            expect(error.details).to.equal([{
                message: '"value" length must be less than or equal to 10 characters long',
                path: [],
                type: 'string.max',
                context: {
                    label: 'value',
                    limit: 10,
                    value: 'my stringmy string'
                }
            }]);
        });

        it('should add multiple errors when errorsArray helper is used', async () => {

            const ext = (value, { error, errorsArray }) => {

                const newValue = value + value;

                const errors = errorsArray();
                errors.push(
                    error('string.max', { limit: 10, value: newValue }),
                    error('string.min', { limit: 1, value: newValue })
                );
                return errors;
            };

            const schema = Joi.string().external(ext);
            const input = 'my string';

            const error = await expect(schema.validateAsync(input)).to.reject('"value" length must be less than or equal to 10 characters long. "value" length must be at least 1 characters long');
            expect(error.details).to.equal([{
                message: '"value" length must be less than or equal to 10 characters long',
                path: [],
                type: 'string.max',
                context: {
                    label: 'value',
                    limit: 10,
                    value: 'my stringmy string'
                }
            }, {
                message: '"value" length must be at least 1 characters long',
                path: [],
                type: 'string.min',
                context: {
                    label: 'value',
                    limit: 1,
                    value: 'my stringmy string'
                }
            }]);
        });

        it('should add a custom error when message helper is used', async () => {

            const ext = (value, { message }) => {

                return message('{{#label}} has an invalid value {{#value}} ({{#custom}})', { custom: 'denied' });
            };

            const schema = Joi.string().external(ext);
            const input = 'my string';

            const error = await expect(schema.validateAsync(input)).to.reject('"value" has an invalid value my string (denied)');
            expect(error.details).to.equal([{
                message: '"value" has an invalid value my string (denied)',
                path: [],
                type: 'external',
                context: {
                    label: 'value',
                    value: 'my string',
                    custom: 'denied'
                }
            }]);
        });

        it('should add warnings when warn helper is used on a link', async () => {

            const schema = Joi.object({
                a: Joi.number(),
                b: Joi.link('a').external((value, helpers) => {

                    expect(helpers.schema.type).to.equal('link');
                    expect(helpers.linked.type).to.equal('number');
                    expect(helpers.state.schemas).to.have.length(2);
                    expect(helpers.state.schemas[0].schema.type).to.equal('link');
                    expect(helpers.state.schemas[1].schema.type).to.equal('object');
                    helpers.warn('number.max', { limit: 1, value });
                    return value * 2;
                })
            });

            const result = await schema.validateAsync({ a: 1, b: 4 }, { warnings: true });
            expect(result.value).to.equal({ a: 1, b: 8 });
            expect(result.warning).to.equal({
                message: '"b" must be less than or equal to 1',
                details: [{
                    context: {
                        key: 'b',
                        label: 'b',
                        limit: 1,
                        value: 4
                    },
                    message: '"b" must be less than or equal to 1',
                    path: ['b'],
                    type: 'number.max'
                }]
            });
        });

        it('should add errors when error helper is used on a link', async () => {

            const schema = Joi.object({
                a: Joi.number(),
                b: Joi.link('a').external((value, helpers) => {

                    expect(helpers.schema.type).to.equal('link');
                    expect(helpers.linked.type).to.equal('number');
                    expect(helpers.state.schemas).to.have.length(2);
                    expect(helpers.state.schemas[0].schema.type).to.equal('link');
                    expect(helpers.state.schemas[1].schema.type).to.equal('object');
                    return helpers.error('number.max', { limit: 1, value });
                })
            });

            const error = await expect(schema.validateAsync({ a: 1, b: 4 }, { warnings: true })).to.reject('"b" must be less than or equal to 1');
            expect(error.details).to.equal([{
                context: {
                    key: 'b',
                    label: 'b',
                    limit: 1,
                    value: 4
                },
                message: '"b" must be less than or equal to 1',
                path: ['b'],
                type: 'number.max'
            }]);
        });

        it('should add a custom error when message helper is used on a link', async () => {

            const schema = Joi.object({
                a: Joi.number(),
                b: Joi.link('a').external((value, helpers) => {

                    return helpers.message('{{#label}} should be {{#sign}} {{#value}}', { sign: '>' });
                })
            });

            const error = await expect(schema.validateAsync({ a: 1, b: 4 })).to.reject('"b" should be > 4');
            expect(error.details).to.equal([{
                message: '"b" should be > 4',
                path: ['b'],
                type: 'external',
                context: {
                    key: 'b',
                    label: 'b',
                    value: 4,
                    sign: '>'
                }
            }]);
        });

        it('should call multiple externals when abortEarly is false and error helper is used', async () => {

            const ext1 = (value, { error }) => {

                const newValue = value + value;

                return error('string.max', { limit: 10, value: newValue });
            };

            const ext2 = (value, { error, errorsArray }) => {

                const errors = errorsArray();
                errors.push(
                    error('string.min', { limit: 8, value }),
                    error('string.max', { limit: 15, value })
                );
                return errors;
            };

            const schema = Joi.string().external(ext1).external(ext2);
            const input = 'my string';

            const error = await expect(schema.validateAsync(input, { abortEarly: false })).to.reject('"value" length must be less than or equal to 10 characters long. "value" length must be at least 8 characters long. "value" length must be less than or equal to 15 characters long');
            expect(error.details).to.equal([
                {
                    message: '"value" length must be less than or equal to 10 characters long',
                    path: [],
                    type: 'string.max',
                    context: {
                        label: 'value',
                        limit: 10,
                        value: 'my stringmy string'
                    }
                },
                {
                    message: '"value" length must be at least 8 characters long',
                    path: [],
                    type: 'string.min',
                    context: {
                        label: 'value',
                        limit: 8,
                        value: 'my string'
                    }
                },
                {
                    message: '"value" length must be less than or equal to 15 characters long',
                    path: [],
                    type: 'string.max',
                    context: {
                        label: 'value',
                        limit: 15,
                        value: 'my string'
                    }
                }
            ]);
        });

        it('should add debug information', async () => {

            const ext1 = (value, { error }) => {

                const newValue = value + value;

                return newValue;
            };

            const ext2 = (value, { error, errorsArray }) => {

                const errors = errorsArray();
                errors.push(
                    error('string.min', { limit: 8, value }),
                    error('string.max', { limit: 15, value })
                );
                return errors;
            };

            const schema = Joi.string().external(ext1).external(ext2);
            const input = 'my string';

            const error = await expect(schema.validateAsync(input, { abortEarly: false, debug: true })).to.reject();
            expect(error.debug).to.equal( [
                { type: 'entry', path: [] },
                { type: 'value', by: 'rule', path: [], from: 'my string', name: 'external', to: 'my stringmy string' },
                { type: 'rule', name: 'external', result: 'error', path: [] },
                { type: 'resolve', ref: 'ref:local:label', to: 'value', path: [] },
                { type: 'resolve', ref: 'ref:local:limit', to: 8, path: [] },
                { type: 'resolve', ref: 'ref:local:label', to: 'value', path: [] },
                { type: 'resolve', ref: 'ref:local:limit', to: 15, path: [] }
            ]);
        });
    });

    describe('finalize()', () => {

        it('applies raw after validation', async () => {

            const schema = Joi.object({
                a: Joi.number().raw(),
                b: Joi.ref('a')
            });

            expect(await schema.validateAsync({ a: '5', b: 5 })).to.equal({ a: '5', b: 5 });
        });
    });

    describe('warnings', () => {

        it('reports warnings (sync)', () => {

            const schema = Joi.any().warning('custom.x', { w: 'world' }).message({ 'custom.x': 'hello {#w}!' });
            const { value, error, warning } = schema.validate('something');
            expect(value).to.equal('something');
            expect(error).to.not.exist();
            expect(warning).to.equal({
                message: 'hello world!',
                details: [
                    {
                        message: 'hello world!',
                        path: [],
                        type: 'custom.x',
                        context: {
                            w: 'world',
                            label: 'value',
                            value: 'something'
                        }
                    }
                ]
            });
        });

        it('reports warnings (async)', async () => {

            const schema = Joi.any().warning('custom.x', { w: 'world' }).message({ 'custom.x': 'hello {#w}!' });
            const { value, warning } = await schema.validateAsync('something', { warnings: true });
            expect(value).to.equal('something');
            expect(warning).to.equal({
                message: 'hello world!',
                details: [
                    {
                        message: 'hello world!',
                        path: [],
                        type: 'custom.x',
                        context: {
                            w: 'world',
                            label: 'value',
                            value: 'something'
                        }
                    }
                ]
            });
        });

        it('reports warnings with externals', async () => {

            const append = (value) => value + '!';
            const schema = Joi.string()
                .warning('custom.x').message('test')
                .external(append);

            expect(await schema.validateAsync('x', { externals: true, warnings: true })).to.equal({
                value: 'x!',
                warning: {
                    message: 'test',
                    details: [
                        {
                            message: 'test',
                            path: [],
                            type: 'custom.x',
                            context: {
                                label: 'value',
                                value: 'x'
                            }
                        }
                    ]
                }
            });
        });
    });

    describe('Shadow', () => {

        it('ignores result flags on root values', () => {

            const schema = Joi.string().strip();
            Helper.validate(schema, [['xyz', true, undefined]]);
        });

        it('reaches deep into shadow', async () => {

            const schema = Joi.object({
                a: {
                    b: {
                        c: {
                            d: {
                                e: Joi.number().raw()
                            },
                            g: Joi.boolean().raw()
                        }
                    }
                },
                f: Joi.ref('a.b.c.d.e'),
                h: Joi.ref('a.b.c.g')
            });

            const value = { a: { b: { c: { d: { e: '100' }, g: 'TRUE' } } }, f: 100, h: true };

            expect(await schema.validateAsync(value)).to.equal(value);
        });
    });
});
