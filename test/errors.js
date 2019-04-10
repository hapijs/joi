'use strict';

const Code = require('@hapi/code');
const Lab = require('@hapi/lab');
const Joi = require('..');


const internals = {};


const { describe, it } = exports.lab = Lab.script();
const { expect } = Code;


describe('errors', () => {

    it('has an isJoi property', async () => {

        const err = await expect(Joi.validate('bar', Joi.valid('foo'))).to.reject();
        expect(err).to.be.an.error();
        expect(err.isJoi).to.be.true();
    });

    it('supports custom errors when validating types', async () => {

        const schema = Joi.object({
            email: Joi.string().email(),
            date: Joi.date(),
            alphanum: Joi.string().alphanum(),
            min: Joi.string().min(3),
            max: Joi.string().max(3),
            required: Joi.string().required(),
            xor: Joi.string(),
            renamed: Joi.string().valid('456'),
            notEmpty: Joi.string().required()
        }).rename('renamed', 'required').without('required', 'xor').without('xor', 'required');

        const input = {
            email: 'invalid-email',
            date: 'invalid-date',
            alphanum: '\b\n\f\r\t',
            min: 'ab',
            max: 'abcd',
            required: 'hello',
            xor: '123',
            renamed: '456',
            notEmpty: ''
        };

        const lang = {
            any: {
                empty: '3'
            },
            date: {
                base: '18'
            },
            string: {
                base: '13',
                min: '14',
                max: '15',
                alphanum: '16',
                email: '19'
            },
            object: {
                without: '7',
                rename: {
                    override: '11'
                }
            }
        };

        const error = await expect(Joi.validate(input, schema, { abortEarly: false, language: lang })).to.reject();
        expect(error).to.be.an.error('"value" 11. child "email" fails because ["email" 19]. child "date" fails because ["date" 18]. child "alphanum" fails because ["alphanum" 16]. child "min" fails because ["min" 14]. child "max" fails because ["max" 15]. child "notEmpty" fails because ["notEmpty" 3]. "required" 7. "xor" 7');
        expect(error.name).to.equal('ValidationError');
        expect(error.details).to.equal([
            {
                message: '"value" 11',
                path: [],
                type: 'object.rename.override',
                context: { from: 'renamed', to: 'required', label: 'value', key: undefined }
            },
            {
                message: '"email" 19',
                path: ['email'],
                type: 'string.email',
                context: { value: 'invalid-email', label: 'email', key: 'email' }
            },
            {
                message: '"date" 18',
                path: ['date'],
                type: 'date.base',
                context: { label: 'date', key: 'date', value: 'invalid-date' }
            },
            {
                message: '"alphanum" 16',
                path: ['alphanum'],
                type: 'string.alphanum',
                context: { value: '\b\n\f\r\t', label: 'alphanum', key: 'alphanum' }
            },
            {
                message: '"min" 14',
                path: ['min'],
                type: 'string.min',
                context: {
                    limit: 3,
                    value: 'ab',
                    encoding: undefined,
                    label: 'min',
                    key: 'min'
                }
            },
            {
                message: '"max" 15',
                path: ['max'],
                type: 'string.max',
                context: {
                    limit: 3,
                    value: 'abcd',
                    encoding: undefined,
                    label: 'max',
                    key: 'max'
                }
            },
            {
                message: '"notEmpty" 3',
                path: ['notEmpty'],
                type: 'any.empty',
                context: { value: '', invalids: [''], label: 'notEmpty', key: 'notEmpty' }
            },
            {
                message: '"required" 7',
                path: ['required'],
                type: 'object.without',
                context: {
                    main: 'required',
                    mainWithLabel: 'required',
                    peer: 'xor',
                    peerWithLabel: 'xor',
                    label: 'required',
                    key: 'required'
                }
            },
            {
                message: '"xor" 7',
                path: ['xor'],
                type: 'object.without',
                context: {
                    main: 'xor',
                    mainWithLabel: 'xor',
                    peer: 'required',
                    peerWithLabel: 'required',
                    label: 'xor',
                    key: 'xor'
                }
            }
        ]);
    });

    it('does not prefix with key when language uses context.key', async () => {

        const schema = Joi.valid('sad').options({ language: { any: { allowOnly: 'my hero "{{label}}" is not {{valids}}' } } });
        const err = await expect(schema.validate(5)).to.reject();
        expect(err).to.be.an.error('my hero "value" is not [sad]');
        expect(err.details).to.equal([{
            message: 'my hero "value" is not [sad]',
            path: [],
            type: 'any.allowOnly',
            context: { value: 5, valids: ['sad'], label: 'value', key: undefined }
        }]);
    });

    it('accepts an empty key', async () => {

        const schema = Joi.valid('sad').options({ language: { key: '' } });
        const err = await expect(schema.validate(5)).to.reject();
        expect(err).to.be.an.error('must be one of [sad]');
        expect(err.details).to.equal([{
            message: 'must be one of [sad]',
            path: [],
            type: 'any.allowOnly',
            context: { value: 5, valids: ['sad'], label: 'value', key: undefined }
        }]);
    });

    it('escapes unsafe keys', async () => {

        const schema = {
            'a()': Joi.number()
        };

        const err = await expect(Joi.validate({ 'a()': 'x' }, schema, { escapeHtml: true })).to.reject();
        expect(err).to.be.an.error('child "a&#x28;&#x29;" fails because ["a&#x28;&#x29;" must be a number]');
        expect(err.details).to.equal([{
            message: '"a&#x28;&#x29;" must be a number',
            path: ['a()'],
            type: 'number.base',
            context: { label: 'a()', key: 'a()', value: 'x' }
        }]);

        const err2 = await expect(Joi.validate({ 'b()': 'x' }, schema, { escapeHtml: true })).to.reject();
        expect(err2).to.be.an.error('"b&#x28;&#x29;" is not allowed');
        expect(err2.details).to.equal([{
            message: '"b&#x28;&#x29;" is not allowed',
            path: ['b()'],
            type: 'object.allowUnknown',
            context: { child: 'b()', label: 'b()', key: 'b()', value: 'x' }
        }]);
    });

    it('does not escape unsafe keys by default', async () => {

        const schema = {
            'a()': Joi.number()
        };

        const err = await expect(Joi.validate({ 'a()': 'x' }, schema)).to.reject();
        expect(err).to.be.an.error('child "a()" fails because ["a()" must be a number]');
        expect(err.details).to.equal([{
            message: '"a()" must be a number',
            path: ['a()'],
            type: 'number.base',
            context: { label: 'a()', key: 'a()', value: 'x' }
        }]);

        const err2 = await expect(Joi.validate({ 'b()': 'x' }, schema)).to.reject();
        expect(err2).to.be.an.error('"b()" is not allowed');
        expect(err2.details).to.equal([{
            message: '"b()" is not allowed',
            path: ['b()'],
            type: 'object.allowUnknown',
            context: { child: 'b()', label: 'b()', key: 'b()', value: 'x' }
        }]);
    });

    it('returns error type in validation error', async () => {

        const input = {
            notNumber: '',
            notString: true,
            notBoolean: 9
        };

        const schema = {
            notNumber: Joi.number().required(),
            notString: Joi.string().required(),
            notBoolean: Joi.boolean().required()
        };

        const err = await expect(Joi.validate(input, schema, { abortEarly: false })).to.reject();
        expect(err).to.be.an.error('child "notNumber" fails because ["notNumber" must be a number]. child "notString" fails because ["notString" must be a string]. child "notBoolean" fails because ["notBoolean" must be a boolean]');
        expect(err.details).to.equal([
            {
                message: '"notNumber" must be a number',
                path: ['notNumber'],
                type: 'number.base',
                context: { label: 'notNumber', key: 'notNumber', value: '' }
            },
            {
                message: '"notString" must be a string',
                path: ['notString'],
                type: 'string.base',
                context: { value: true, label: 'notString', key: 'notString' }
            },
            {
                message: '"notBoolean" must be a boolean',
                path: ['notBoolean'],
                type: 'boolean.base',
                context: { label: 'notBoolean', key: 'notBoolean', value: 9 }
            }
        ]);
    });

    it('returns a full path to an error value on an array (items)', async () => {

        const schema = Joi.array().items(Joi.array().items({ x: Joi.number() }));
        const input = [
            [{ x: 1 }],
            [{ x: 1 }, { x: 'a' }]
        ];

        const err = await expect(schema.validate(input)).to.reject();
        expect(err).to.be.an.error('"value" at position 1 fails because ["1" at position 1 fails because [child "x" fails because ["x" must be a number]]]');
        expect(err.details).to.equal([{
            message: '"x" must be a number',
            path: [1, 1, 'x'],
            type: 'number.base',
            context: { label: 'x', key: 'x', value: 'a' }
        }]);
    });

    it('returns a full path to an error value on an array (items forbidden)', async () => {

        const schema = Joi.array().items(Joi.array().items(Joi.object({ x: Joi.string() }).forbidden()));
        const input = [
            [{ x: 1 }],
            [{ x: 1 }, { x: 'a' }]
        ];

        const err = await expect(schema.validate(input)).to.reject();
        expect(err).to.be.an.error('"value" at position 1 fails because ["1" at position 1 contains an excluded value]');
        expect(err.details).to.equal([{
            message: '"1" at position 1 contains an excluded value',
            path: [1, 1],
            type: 'array.excludes',
            context: { pos: 1, value: { x: 'a' }, label: 1, key: 1 }
        }]);
    });

    it('returns a full path to an error value on an object', async () => {

        const schema = {
            x: Joi.array().items({ x: Joi.number() })
        };

        const input = {
            x: [{ x: 1 }, { x: 'a' }]
        };

        const err = await expect(Joi.validate(input, schema)).to.reject();
        expect(err).to.be.an.error('child "x" fails because ["x" at position 1 fails because [child "x" fails because ["x" must be a number]]]');
        expect(err.details).to.equal([{
            message: '"x" must be a number',
            path: ['x', 1, 'x'],
            type: 'number.base',
            context: { label: 'x', key: 'x', value: 'a' }
        }]);
    });

    it('overrides root key language', async () => {

        const schema = Joi.string().options({ language: { root: 'blah' } });
        const err = await expect(schema.validate(4)).to.reject();
        expect(err).to.be.an.error('"blah" must be a string');
        expect(err.details).to.equal([{
            message: '"blah" must be a string',
            path: [],
            type: 'string.base',
            context: { value: 4, label: 'blah', key: undefined }
        }]);
    });

    it('overrides label key language', async () => {

        const schema = Joi.string().options({ language: { key: 'my own {{!label}} ' } });
        const err = await expect(schema.validate(4)).to.reject();
        expect(err).to.be.an.error('my own value must be a string');
        expect(err.details).to.equal([{
            message: 'my own value must be a string',
            path: [],
            type: 'string.base',
            context: { value: 4, label: 'value', key: undefined }
        }]);
    });

    it('overrides wrapArrays', async () => {

        const schema = Joi.array().items(Joi.boolean()).options({ language: { messages: { wrapArrays: false } } });
        const err = await expect(schema.validate([4])).to.reject();
        expect(err).to.be.an.error('"value" at position 0 fails because "0" must be a boolean');
        expect(err.details).to.equal([{
            message: '"0" must be a boolean',
            path: [0],
            type: 'boolean.base',
            context: { label: 0, key: 0, value: 4 }
        }]);
    });

    it('allows html escaping', async () => {

        const schema = Joi.string().options({ language: { root: 'blah' } }).label('bleh');
        const err = await expect(schema.validate(4)).to.reject();
        expect(err).to.be.an.error('"bleh" must be a string');
        expect(err.details).to.equal([{
            message: '"bleh" must be a string',
            path: [],
            type: 'string.base',
            context: { value: 4, label: 'bleh', key: undefined }
        }]);
    });

    it('provides context with the error', async () => {

        const schema = Joi.object({ length: Joi.number().min(3).required() });
        const err = await expect(schema.validate({ length: 1 })).to.reject();
        expect(err.details).to.equal([{
            message: '"length" must be larger than or equal to 3',
            path: ['length'],
            type: 'number.min',
            context: {
                limit: 3,
                key: 'length',
                label: 'length',
                value: 1
            }
        }]);
    });

    it('has a name that is ValidationError', async () => {

        const schema = Joi.number();
        const validateErr = await expect(schema.validate('a')).to.reject();
        expect(validateErr.name).to.be.equal('ValidationError');

        try {
            Joi.assert('a', schema);
            throw new Error('should not reach that');
        }
        catch (assertErr) {
            expect(assertErr.name).to.be.equal('ValidationError');
        }

        try {
            Joi.assert('a', schema, 'foo');
            throw new Error('should not reach that');
        }
        catch (assertErr) {
            expect(assertErr.name).to.be.equal('ValidationError');
        }

        try {
            Joi.assert('a', schema, new Error('foo'));
            throw new Error('should not reach that');
        }
        catch (assertErr) {
            expect(assertErr.name).to.equal('Error');
        }
    });

    describe('annotate()', () => {

        it('annotates error', async () => {

            const object = {
                a: 'm',
                y: {
                    b: {
                        c: 10
                    }
                }
            };

            const schema = {
                a: Joi.string().valid('a', 'b', 'c', 'd'),
                y: Joi.object({
                    u: Joi.string().valid(['e', 'f', 'g', 'h']).required(),
                    b: Joi.string().valid('i', 'j').allow(false),
                    d: Joi.object({
                        x: Joi.string().valid('k', 'l').required(),
                        c: Joi.number()
                    })
                })
            };

            const err = await expect(Joi.validate(object, schema, { abortEarly: false })).to.reject();
            expect(err).to.be.an.error('child "a" fails because ["a" must be one of [a, b, c, d]]. child "y" fails because [child "u" fails because ["u" is required], child "b" fails because ["b" must be a string]]');
            expect(err.details).to.equal([
                {
                    message: '"a" must be one of [a, b, c, d]',
                    path: ['a'],
                    type: 'any.allowOnly',
                    context: { value: 'm', valids: ['a', 'b', 'c', 'd'], label: 'a', key: 'a' }
                },
                {
                    message: '"u" is required',
                    path: ['y', 'u'],
                    type: 'any.required',
                    context: { label: 'u', key: 'u' }
                },
                {
                    message: '"b" must be a string',
                    path: ['y', 'b'],
                    type: 'string.base',
                    context: { value: { c: 10 }, label: 'b', key: 'b' }
                }
            ]);
            expect(err.annotate()).to.equal('{\n  \"y\": {\n    \"b\" \u001b[31m[3]\u001b[0m: {\n      \"c\": 10\n    },\n    \u001b[41m\"u\"\u001b[0m\u001b[31m [2]: -- missing --\u001b[0m\n  },\n  "a" \u001b[31m[1]\u001b[0m: \"m\"\n}\n\u001b[31m\n[1] "a" must be one of [a, b, c, d]\n[2] "u" is required\n[3] "b" must be a string\u001b[0m');
        });

        it('annotates error without colors if requested', async () => {

            const object = {
                a: 'm'
            };

            const schema = {
                a: Joi.string().valid('a', 'b', 'c', 'd')
            };

            const err = await expect(Joi.validate(object, schema, { abortEarly: false })).to.reject();
            expect(err).to.be.an.error('child "a" fails because ["a" must be one of [a, b, c, d]]');
            expect(err.details).to.equal([{
                message: '"a" must be one of [a, b, c, d]',
                path: ['a'],
                type: 'any.allowOnly',
                context: { value: 'm', valids: ['a', 'b', 'c', 'd'], label: 'a', key: 'a' }
            }]);
            expect(err.annotate(true)).to.equal('{\n  "a" [1]: \"m\"\n}\n\n[1] "a" must be one of [a, b, c, d]');
        });

        it('annotates error within array', async () => {

            const object = {
                a: [1, 2, 3, 4, 2, 5]
            };

            const schema = {
                a: Joi.array().items(Joi.valid(1, 2))
            };

            const err = await expect(Joi.validate(object, schema, { abortEarly: false })).to.reject();
            expect(err).to.be.an.error('child "a" fails because ["a" at position 2 fails because ["2" must be one of [1, 2]], "a" at position 3 fails because ["3" must be one of [1, 2]], "a" at position 5 fails because ["5" must be one of [1, 2]]]');
            expect(err.details).to.equal([
                {
                    message: '"2" must be one of [1, 2]',
                    path: ['a', 2],
                    type: 'any.allowOnly',
                    context: { value: 3, valids: [1, 2], label: 2, key: 2 }
                },
                {
                    message: '"3" must be one of [1, 2]',
                    path: ['a', 3],
                    type: 'any.allowOnly',
                    context: { value: 4, valids: [1, 2], label: 3, key: 3 }
                },
                {
                    message: '"5" must be one of [1, 2]',
                    path: ['a', 5],
                    type: 'any.allowOnly',
                    context: { value: 5, valids: [1, 2], label: 5, key: 5 }
                }
            ]);
            expect(err.annotate()).to.equal('{\n  \"a\": [\n    1,\n    2,\n    3, \u001b[31m[1]\u001b[0m\n    4, \u001b[31m[2]\u001b[0m\n    2,\n    5 \u001b[31m[3]\u001b[0m\n  ]\n}\n\u001b[31m\n[1] \"2\" must be one of [1, 2]\n[2] \"3\" must be one of [1, 2]\n[3] \"5\" must be one of [1, 2]\u001b[0m');
        });

        it('annotates error within array multiple times on the same element', async () => {

            const object = {
                a: [2, 3, 4]
            };

            const schema = {
                a: Joi.array().items(Joi.number().min(4).max(2))
            };

            const err = await expect(Joi.validate(object, schema, { abortEarly: false })).to.reject();
            expect(err).to.be.an.error('child "a" fails because ["a" at position 0 fails because ["0" must be larger than or equal to 4], "a" at position 1 fails because ["1" must be larger than or equal to 4, "1" must be less than or equal to 2], "a" at position 2 fails because ["2" must be less than or equal to 2]]');
            expect(err.details).to.equal([
                {
                    message: '"0" must be larger than or equal to 4',
                    path: ['a', 0],
                    type: 'number.min',
                    context: { limit: 4, value: 2, label: 0, key: 0 }
                },
                {
                    message: '"1" must be larger than or equal to 4',
                    path: ['a', 1],
                    type: 'number.min',
                    context: { limit: 4, value: 3, label: 1, key: 1 }
                },
                {
                    message: '"1" must be less than or equal to 2',
                    path: ['a', 1],
                    type: 'number.max',
                    context: { limit: 2, value: 3, label: 1, key: 1 }
                },
                {
                    message: '"2" must be less than or equal to 2',
                    path: ['a', 2],
                    type: 'number.max',
                    context: { limit: 2, value: 4, label: 2, key: 2 }
                }
            ]);
            expect(err.annotate()).to.equal('{\n  \"a\": [\n    2, \u001b[31m[1]\u001b[0m\n    3, \u001b[31m[2, 3]\u001b[0m\n    4 \u001b[31m[4]\u001b[0m\n  ]\n}\n\u001b[31m\n[1] \"0\" must be larger than or equal to 4\n[2] \"1\" must be larger than or equal to 4\n[3] \"1\" must be less than or equal to 2\n[4] \"2\" must be less than or equal to 2\u001b[0m');
        });

        it('annotates error within array when it is an object', async () => {

            const object = {
                a: [{ b: 2 }]
            };

            const schema = {
                a: Joi.array().items(Joi.number())
            };

            const err = await expect(Joi.validate(object, schema, { abortEarly: false })).to.reject();
            expect(err).to.be.an.error('child "a" fails because ["a" at position 0 fails because ["0" must be a number]]');
            expect(err.details).to.equal([{
                message: '"0" must be a number',
                path: ['a', 0],
                type: 'number.base',
                context: { label: 0, key: 0, value: { b: 2 } }
            }]);
            expect(err.annotate()).to.equal('{\n  \"a\": [\n    { \u001b[31m[1]\u001b[0m\n      \"b\": 2\n    }\n  ]\n}\n\u001b[31m\n[1] \"0\" must be a number\u001b[0m');
        });

        it('annotates error within multiple arrays and multiple times on the same element', async () => {

            const object = {
                a: [2, 3, 4],
                b: [2, 3, 4]
            };

            const schema = {
                a: Joi.array().items(Joi.number().min(4).max(2)),
                b: Joi.array().items(Joi.number().min(4).max(2))
            };

            const err = await expect(Joi.validate(object, schema, { abortEarly: false })).to.reject();
            expect(err).to.be.an.error('child "a" fails because ["a" at position 0 fails because ["0" must be larger than or equal to 4], "a" at position 1 fails because ["1" must be larger than or equal to 4, "1" must be less than or equal to 2], "a" at position 2 fails because ["2" must be less than or equal to 2]]. child "b" fails because ["b" at position 0 fails because ["0" must be larger than or equal to 4], "b" at position 1 fails because ["1" must be larger than or equal to 4, "1" must be less than or equal to 2], "b" at position 2 fails because ["2" must be less than or equal to 2]]');
            expect(err.details).to.equal([
                {
                    message: '"0" must be larger than or equal to 4',
                    path: ['a', 0],
                    type: 'number.min',
                    context: { limit: 4, value: 2, label: 0, key: 0 }
                },
                {
                    message: '"1" must be larger than or equal to 4',
                    path: ['a', 1],
                    type: 'number.min',
                    context: { limit: 4, value: 3, label: 1, key: 1 }
                },
                {
                    message: '"1" must be less than or equal to 2',
                    path: ['a', 1],
                    type: 'number.max',
                    context: { limit: 2, value: 3, label: 1, key: 1 }
                },
                {
                    message: '"2" must be less than or equal to 2',
                    path: ['a', 2],
                    type: 'number.max',
                    context: { limit: 2, value: 4, label: 2, key: 2 }
                },
                {
                    message: '"0" must be larger than or equal to 4',
                    path: ['b', 0],
                    type: 'number.min',
                    context: { limit: 4, value: 2, label: 0, key: 0 }
                },
                {
                    message: '"1" must be larger than or equal to 4',
                    path: ['b', 1],
                    type: 'number.min',
                    context: { limit: 4, value: 3, label: 1, key: 1 }
                },
                {
                    message: '"1" must be less than or equal to 2',
                    path: ['b', 1],
                    type: 'number.max',
                    context: { limit: 2, value: 3, label: 1, key: 1 }
                },
                {
                    message: '"2" must be less than or equal to 2',
                    path: ['b', 2],
                    type: 'number.max',
                    context: { limit: 2, value: 4, label: 2, key: 2 }
                }
            ]);
            expect(err.annotate()).to.equal('{\n  \"a\": [\n    2, \u001b[31m[1]\u001b[0m\n    3, \u001b[31m[2, 3]\u001b[0m\n    4 \u001b[31m[4]\u001b[0m\n  ],\n  \"b\": [\n    2, \u001b[31m[5]\u001b[0m\n    3, \u001b[31m[6, 7]\u001b[0m\n    4 \u001b[31m[8]\u001b[0m\n  ]\n}\n\u001b[31m\n[1] \"0\" must be larger than or equal to 4\n[2] \"1\" must be larger than or equal to 4\n[3] \"1\" must be less than or equal to 2\n[4] \"2\" must be less than or equal to 2\n[5] \"0\" must be larger than or equal to 4\n[6] \"1\" must be larger than or equal to 4\n[7] \"1\" must be less than or equal to 2\n[8] \"2\" must be less than or equal to 2\u001b[0m');
        });

        it('displays alternatives fail as a single line', async () => {

            const schema = {
                x: [
                    Joi.string(),
                    Joi.number(),
                    Joi.date()
                ]
            };

            const err = await expect(Joi.validate({ x: true }, schema)).to.reject();
            expect(err).to.be.an.error('child "x" fails because ["x" must be a string, "x" must be a number, "x" must be a number of milliseconds or valid date string]');
            expect(err.details).to.equal([
                {
                    message: '"x" must be a string',
                    path: ['x'],
                    type: 'string.base',
                    context: { value: true, label: 'x', key: 'x' }
                },
                {
                    message: '"x" must be a number',
                    path: ['x'],
                    type: 'number.base',
                    context: { label: 'x', key: 'x', value: true }
                },
                {
                    message: '"x" must be a number of milliseconds or valid date string',
                    path: ['x'],
                    type: 'date.base',
                    context: { label: 'x', key: 'x', value: true }
                }
            ]);
            expect(err.annotate()).to.equal('{\n  \"x\" \u001b[31m[1, 2, 3]\u001b[0m: true\n}\n\u001b[31m\n[1] "x" must be a string\n[2] "x" must be a number\n[3] "x" must be a number of milliseconds or valid date string\u001b[0m');
        });

        it('annotates circular input', async () => {

            const schema = {
                x: Joi.object({
                    y: Joi.object({
                        z: Joi.number()
                    })
                })
            };

            const input = {};
            input.x = input;

            const err = await expect(Joi.validate(input, schema)).to.reject();
            expect(err).to.be.an.error('child "x" fails because ["x" is not allowed]');
            expect(err.details).to.equal([{
                message: '"x" is not allowed',
                path: ['x', 'x'],
                type: 'object.allowUnknown',
                context: { child: 'x', label: 'x', key: 'x', value: input.x }
            }]);
            expect(err.annotate()).to.equal('{\n  \"x\" \u001b[31m[1]\u001b[0m: \"[Circular ~]\"\n}\n\u001b[31m\n[1] \"x\" is not allowed\u001b[0m');
        });

        it('annotates deep circular input', async () => {

            const schema = {
                x: Joi.object({
                    y: Joi.object({
                        z: Joi.number()
                    })
                })
            };

            const input = { x: { y: {} } };
            input.x.y.z = input.x.y;

            const err = await expect(Joi.validate(input, schema)).to.reject();
            expect(err).to.be.an.error('child "x" fails because [child "y" fails because [child "z" fails because ["z" must be a number]]]');
            expect(err.details).to.equal([{
                message: '"z" must be a number',
                path: ['x', 'y', 'z'],
                type: 'number.base',
                context: { label: 'z', key: 'z', value: input.x.y }
            }]);
            expect(err.annotate()).to.equal('{\n  \"x\": {\n    \"y\": {\n      \"z\" \u001b[31m[1]\u001b[0m: \"[Circular ~.x.y]\"\n    }\n  }\n}\n\u001b[31m\n[1] \"z\" must be a number\u001b[0m');
        });

        it('annotates deep circular input with extra keys', async () => {

            const schema = {
                x: Joi.object({
                    y: Joi.object({
                        z: Joi.number()
                    })
                })
            };

            const input = { x: { y: { z: 1, foo: {} } } };
            input.x.y.foo = input.x.y;

            const err = await expect(Joi.validate(input, schema)).to.reject();
            expect(err).to.be.an.error('child "x" fails because [child "y" fails because ["foo" is not allowed]]');
            expect(err.details).to.equal([{
                message: '"foo" is not allowed',
                path: ['x', 'y', 'foo'],
                type: 'object.allowUnknown',
                context: { child: 'foo', label: 'foo', key: 'foo', value: input.x.y.foo }
            }]);
            expect(err.annotate()).to.equal('{\n  \"x\": {\n    \"y\": {\n      \"z\": 1,\n      \"foo\" \u001b[31m[1]\u001b[0m: \"[Circular ~.x.y]\"\n    }\n  }\n}\n\u001b[31m\n[1] \"foo\" is not allowed\u001b[0m');
        });

        it('prints NaN, Infinity and -Infinity correctly in errors', async () => {

            const schema = {
                x: Joi.object({
                    y: Joi.date().allow(null),
                    z: Joi.date().allow(null),
                    u: Joi.date().allow(null),
                    g: Joi.date().allow(null),
                    h: Joi.date().allow(null),
                    i: Joi.date().allow(null),
                    k: Joi.date().allow(null),
                    p: Joi.date().allow(null),
                    f: Joi.date().allow(null)
                })
            };

            const input = {
                x: {
                    y: NaN,
                    z: Infinity,
                    u: -Infinity,
                    g: Symbol('foo'),
                    h: -Infinity,
                    i: Infinity,
                    k: (a) => a,
                    p: Symbol('bar'),
                    f: function (x) {

                        return [{ y: 2 }];
                    }
                }
            };

            const err = await expect(Joi.validate(input, schema)).to.reject();
            expect(err).to.be.an.error('child "x" fails because [child "y" fails because ["y" must be a number of milliseconds or valid date string]]');
            expect(err.details).to.equal([{
                message: '"y" must be a number of milliseconds or valid date string',
                path: ['x', 'y'],
                type: 'date.base',
                context: { label: 'y', key: 'y', value: NaN }
            }]);
            expect(err.annotate().replace(/\\r/g, '')).to.equal('{\n  \"x\": {\n    \"z\": Infinity,\n    \"u\": -Infinity,\n    \"g\": Symbol(foo),\n    \"h\": -Infinity,\n    \"i\": Infinity,\n    \"k\": (a) => a,\n    \"p\": Symbol(bar),\n    \"f\": function (x) {\\n\\n                        return [{ y: 2 }];\\n                    },\n    \"y\" \u001b[31m[1]\u001b[0m: NaN\n  }\n}\n\u001b[31m\n[1] \"y\" must be a number of milliseconds or valid date string\u001b[0m');
        });

        it('pinpoints an error in a stringified JSON object', async () => {

            const object = {
                a: '{"c":"string"}'
            };

            const schema = {
                a: Joi.object({
                    b: Joi.string()
                })
            };

            const err = await expect(Joi.validate(object, schema, { abortEarly: false })).to.reject();
            expect(err).to.be.an.error('child "a" fails because ["c" is not allowed]');
            expect(err.details).to.equal([{
                message: '"c" is not allowed',
                path: ['a', 'c'],
                type: 'object.allowUnknown',
                context: { child: 'c', label: 'c', key: 'c', value: 'string' }
            }]);
            expect(err.annotate(true)).to.equal('{\n  \"a\" [1]: \"{\\\"c\\\":\\\"string\\\"}\"\n}\n\n[1] \"c\" is not allowed');
        });

        it('pinpoints several errors in a stringified JSON object', async () => {

            const object = {
                a: '{"b":-1.5}'
            };

            const schema = {
                a: Joi.object({
                    b: Joi.number().integer().positive()
                })
            };

            const err = await expect(Joi.validate(object, schema, { abortEarly: false })).to.reject();
            expect(err).to.be.an.error('child "a" fails because [child "b" fails because ["b" must be an integer, "b" must be a positive number]]');
            expect(err.details).to.equal([
                {
                    message: '"b" must be an integer',
                    path: ['a', 'b'],
                    type: 'number.integer',
                    context: { value: -1.5, label: 'b', key: 'b' }
                },
                {
                    message: '"b" must be a positive number',
                    path: ['a', 'b'],
                    type: 'number.positive',
                    context: { value: -1.5, label: 'b', key: 'b' }
                }
            ]);
            expect(err.annotate(true)).to.equal('{\n  "a" [1, 2]: "{\\"b\\":-1.5}"\n}\n\n[1] "b" must be an integer\n[2] "b" must be a positive number');
        });

        it('pinpoints an error in a stringified JSON object (deep)', async () => {

            const object = {
                a: '{"b":{"c":{"d":1}}}'
            };

            const schema = Joi.object({
                a: Joi.object({
                    b: Joi.object({
                        c: {
                            d: Joi.string()
                        }
                    })
                })
            });

            const err = await expect(Joi.validate(object, schema, { abortEarly: false })).to.reject();
            expect(err).to.be.an.error('child "a" fails because [child "b" fails because [child "c" fails because [child "d" fails because ["d" must be a string]]]]');
            expect(err.details).to.equal([{
                message: '"d" must be a string',
                path: ['a', 'b', 'c', 'd'],
                type: 'string.base',
                context: { value: 1, label: 'd', key: 'd' }
            }]);
            expect(err.annotate(true)).to.equal('{\n  "a" [1]: "{\\"b\\":{\\"c\\":{\\"d\\":1}}}"\n}\n\n[1] "d" must be a string');
        });

        it('handles child to uncle relationship inside a child', async () => {

            const object = {
                response: {
                    options: {
                        stripUnknown: true
                    }
                }
            };

            const schema = Joi.object({
                response: Joi.object({
                    modify: Joi.boolean(),
                    options: Joi.object()
                })
                    .assert('options.stripUnknown', Joi.ref('modify'), 'meet requirement of having peer modify set to true')
            });

            const err = await expect(Joi.validate(object, schema, { abortEarly: false })).to.reject();
            expect(err).to.be.an.error('child "response" fails because ["options.stripUnknown" validation failed because "options.stripUnknown" failed to meet requirement of having peer modify set to true]');
            expect(err.details).to.equal([{
                message: '"options.stripUnknown" validation failed because "options.stripUnknown" failed to meet requirement of having peer modify set to true',
                path: ['options', 'stripUnknown'],
                type: 'object.assert',
                context: {
                    ref: 'options.stripUnknown',
                    message: 'meet requirement of having peer modify set to true',
                    label: 'stripUnknown',
                    key: 'stripUnknown'
                }
            }]);
            expect(() => {

                err.annotate(true);
            }).to.not.throw();
        });
    });
});
