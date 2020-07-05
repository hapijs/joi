'use strict';

const Code = require('@hapi/code');
const Joi = require('..');
const Lab = require('@hapi/lab');

const Helper = require('./helper');


const internals = {};


const { describe, it } = exports.lab = Lab.script();
const { expect } = Code;


describe('errors', () => {

    it('has an isJoi property', () => {

        const err = Joi.valid('foo').validate('bar').error;
        expect(err).to.be.an.error();
        expect(err.isJoi).to.be.true();
        expect(Joi.isError(err)).to.be.true();
    });


    it('has no stack by default', () => {

        const err = Joi.valid('foo').validate('bar').error;
        expect(err).to.be.an.error();
        expect(err.isJoi).to.be.true();
        expect(err.stack).to.not.contain('\n');
    });

    it('has a stack when enabled', () => {

        const err = Joi.valid('foo').validate('bar', { errors: { stack: true } }).error;
        expect(err).to.be.an.error();
        expect(err.isJoi).to.be.true();
        expect(err.stack).to.contain('at Object.exports.process');
    });

    it('supports custom errors when validating types', () => {

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
        })
            .rename('renamed', 'required')
            .without('required', 'xor')
            .without('xor', 'required');

        const value = {
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

        const messages = {
            'string.empty': '{#label} 3',
            'date.base': '{#label} 18',
            'string.base': '{#label} 13',
            'string.min': '{#label} 14',
            'string.max': '{#label} 15',
            'string.alphanum': '{#label} 16',
            'string.email': '{#label} 19',
            'object.without': '{#label} 7',
            'object.rename.override': '{#label} 11'
        };

        const error = schema.validate(value, { abortEarly: false, messages }).error;

        value.required = value.renamed;
        delete value.renamed;

        expect(error).to.be.an.error('"value" 11. "email" 19. "date" 18. "alphanum" 16. "min" 14. "max" 15. "notEmpty" 3. "value" 7');
        expect(error.name).to.equal('ValidationError');
        expect(error.details).to.equal([
            {
                message: '"value" 11',
                path: [],
                type: 'object.rename.override',
                context: { from: 'renamed', to: 'required', label: 'value', pattern: false, value }
            },
            {
                message: '"email" 19',
                path: ['email'],
                type: 'string.email',
                context: { value: 'invalid-email', invalids: ['invalid-email'], label: 'email', key: 'email' }
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
                type: 'string.empty',
                context: { value: '', label: 'notEmpty', key: 'notEmpty' }
            },
            {
                message: '"value" 7',
                path: [],
                type: 'object.without',
                context: {
                    main: 'required',
                    mainWithLabel: 'required',
                    peer: 'xor',
                    peerWithLabel: 'xor',
                    label: 'value',
                    value
                }
            },
            {
                message: '"value" 7',
                path: [],
                type: 'object.without',
                context: {
                    main: 'xor',
                    mainWithLabel: 'xor',
                    peer: 'required',
                    peerWithLabel: 'required',
                    label: 'value',
                    value
                }
            }
        ]);
    });

    it('supports language preference', () => {

        const schema = Joi.number().min(10);

        const messages = {
            english: {
                root: 'value',
                'number.min': '{#label} too small'
            },
            latin: {
                root: 'valorem',
                'number.min': Joi.x('{@label} angustus', { prefix: { local: '@' } })
            },
            empty: {}
        };

        expect(schema.validate(1, { messages, errors: { language: 'english' } }).error).to.be.an.error('"value" too small');
        expect(schema.validate(1, { messages, errors: { language: 'latin' } }).error).to.be.an.error('"valorem" angustus');
        expect(schema.validate(1, { messages, errors: { language: 'unknown' } }).error).to.be.an.error('"value" must be greater than or equal to 10');
        expect(schema.validate(1, { messages, errors: { language: 'empty' } }).error).to.be.an.error('"value" must be greater than or equal to 10');
    });

    it('supports language preference (fallthrough)', () => {

        const messages = {
            english: {
                root: 'value',
                'number.min': '{#label} too small'
            },
            root: 'valorem',
            'number.min': '{#label} angustus'
        };

        const schema = Joi.number().min(10).prefs({ messages });

        expect(schema.validate(1, { errors: { language: 'english' } }).error).to.be.an.error('"value" too small');
        expect(schema.validate(1, { errors: { language: 'latin' } }).error).to.be.an.error('"valorem" angustus');

        expect(schema.describe().preferences.messages).to.equal(messages);
    });

    it('supports language preference combination', () => {

        const code = {
            english: {
                'number.min': '{#label} too small'
            },
            latin: {
                'number.min': Joi.x('{@label} angustus', { prefix: { local: '@' } })
            },
            empty: {}
        };

        const root = {
            english: {
                root: 'value'
            },
            latin: {
                root: 'valorem'
            }
        };

        const schema = Joi.number().min(10).prefs({ messages: code }).prefs({ messages: root });

        expect(schema.validate(1, { errors: { language: 'english' } }).error).to.be.an.error('"value" too small');
        expect(schema.validate(1, { errors: { language: 'latin' } }).error).to.be.an.error('"valorem" angustus');
        expect(schema.validate(1, { errors: { language: 'unknown' } }).error).to.be.an.error('"value" must be greater than or equal to 10');
        expect(schema.validate(1, { errors: { language: 'empty' } }).error).to.be.an.error('"value" must be greater than or equal to 10');
    });

    it('supports language ref preference', () => {

        const messages = {
            english: {
                'number.min': '{#label} too small'
            },
            latin: {
                'number.min': Joi.x('{@label} angustus', { prefix: { local: '@' } })
            },
            empty: {}
        };

        const schema = Joi.object({
            a: Joi.number().min(10),
            lang: Joi.string().required()
        })
            .prefs({
                messages,
                errors: {
                    language: Joi.ref('/lang'),
                    wrap: {
                        label: false
                    }
                }
            });

        expect(schema.validate({ a: 1, lang: 'english' }).error).to.be.an.error('a too small');
        expect(schema.validate({ a: 1, lang: 'latin' }).error).to.be.an.error('a angustus');
        expect(schema.validate({ a: 1, lang: 'unknown' }).error).to.be.an.error('a must be greater than or equal to 10');
        expect(schema.validate({ a: 1, lang: 'empty' }).error).to.be.an.error('a must be greater than or equal to 10');
    });

    it('supports custom wrap characters', () => {

        const messages = {
            english: {
                'number.min': '{#label} too small'
            },
            latin: {
                'number.min': Joi.x('{@label} angustus', { prefix: { local: '@' } })
            },
            empty: {}
        };

        const schema = Joi.object({
            a: Joi.number().min(10),
            lang: Joi.string().required()
        })
            .prefs({
                messages,
                errors: {
                    language: Joi.ref('/lang'),
                    wrap: {
                        label: '{}'
                    }
                }
            });

        expect(schema.validate({ a: 1, lang: 'english' }).error).to.be.an.error('{a} too small');
        expect(schema.validate({ a: 1, lang: 'latin' }).error).to.be.an.error('{a} angustus');
        expect(schema.validate({ a: 1, lang: 'unknown' }).error).to.be.an.error('{a} must be greater than or equal to 10');
        expect(schema.validate({ a: 1, lang: 'empty' }).error).to.be.an.error('{a} must be greater than or equal to 10');
    });

    it('supports render preference', () => {

        expect(Joi.number().min(10).validate(1, { errors: { render: false } }).error).to.be.an.error('number.min');
    });

    it('does not prefix with key when messages uses context.key', () => {

        const schema = Joi.valid('sad').prefs({ messages: { 'any.only': 'my hero {{#label}} is not {{#valids}}' } });
        const err = schema.validate(5).error;
        expect(err).to.be.an.error('my hero "value" is not [sad]');
        expect(err.details).to.equal([{
            message: 'my hero "value" is not [sad]',
            path: [],
            type: 'any.only',
            context: { value: 5, valids: ['sad'], label: 'value' }
        }]);
    });

    it('escapes unsafe keys', () => {

        const schema = Joi.object({
            'a()': Joi.number()
        });

        const err = schema.validate({ 'a()': 'x' }, { errors: { escapeHtml: true } }).error;
        expect(err).to.be.an.error('"a&#x28;&#x29;" must be a number');
        expect(err.details).to.equal([{
            message: '"a&#x28;&#x29;" must be a number',
            path: ['a()'],
            type: 'number.base',
            context: { label: 'a()', key: 'a()', value: 'x' }
        }]);

        const err2 = schema.validate({ 'b()': 'x' }, { errors: { escapeHtml: true } }).error;
        expect(err2).to.be.an.error('"b&#x28;&#x29;" is not allowed');
        expect(err2.details).to.equal([{
            message: '"b&#x28;&#x29;" is not allowed',
            path: ['b()'],
            type: 'object.unknown',
            context: { child: 'b()', label: 'b()', key: 'b()', value: 'x' }
        }]);
    });

    it('does not escape unsafe keys by default', () => {

        const schema = Joi.object({
            'a()': Joi.number()
        });

        const err = schema.validate({ 'a()': 'x' }).error;
        expect(err).to.be.an.error('"a()" must be a number');
        expect(err.details).to.equal([{
            message: '"a()" must be a number',
            path: ['a()'],
            type: 'number.base',
            context: { label: 'a()', key: 'a()', value: 'x' }
        }]);

        const err2 = schema.validate({ 'b()': 'x' }).error;
        expect(err2).to.be.an.error('"b()" is not allowed');
        expect(err2.details).to.equal([{
            message: '"b()" is not allowed',
            path: ['b()'],
            type: 'object.unknown',
            context: { child: 'b()', label: 'b()', key: 'b()', value: 'x' }
        }]);
    });

    it('returns error type in validation error', () => {

        const input = {
            notNumber: '',
            notString: true,
            notBoolean: 9
        };

        const schema = Joi.object({
            notNumber: Joi.number().required(),
            notString: Joi.string().required(),
            notBoolean: Joi.boolean().required()
        });

        const err = schema.validate(input, { abortEarly: false }).error;
        expect(err).to.be.an.error('"notNumber" must be a number. "notString" must be a string. "notBoolean" must be a boolean');
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

    it('returns a full path to an error value on an array (items)', () => {

        const schema = Joi.array().items(Joi.array().items({ x: Joi.number() }));
        const input = [
            [{ x: 1 }],
            [{ x: 1 }, { x: 'a' }]
        ];

        const err = schema.validate(input).error;
        expect(err).to.be.an.error('"[1][1].x" must be a number');
        expect(err.details).to.equal([{
            message: '"[1][1].x" must be a number',
            path: [1, 1, 'x'],
            type: 'number.base',
            context: { label: '[1][1].x', key: 'x', value: 'a' }
        }]);
    });

    it('returns a full path to an error value on an array (items forbidden)', () => {

        const schema = Joi.array().items(Joi.array().items(Joi.object({ x: Joi.string() }).forbidden()));
        const input = [
            [{ x: 1 }],
            [{ x: 1 }, { x: 'a' }]
        ];

        const err = schema.validate(input).error;
        expect(err).to.be.an.error('"[1][1]" contains an excluded value');
        expect(err.details).to.equal([{
            message: '"[1][1]" contains an excluded value',
            path: [1, 1],
            type: 'array.excludes',
            context: { pos: 1, value: { x: 'a' }, label: '[1][1]', key: 1 }
        }]);
    });

    it('returns a full path to an error value on an object', () => {

        const schema = Joi.object({
            x: Joi.array().items({ x: Joi.number() })
        });

        const input = {
            x: [{ x: 1 }, { x: 'a' }]
        };

        const err = schema.validate(input).error;
        expect(err).to.be.an.error('"x[1].x" must be a number');
        expect(err.details).to.equal([{
            message: '"x[1].x" must be a number',
            path: ['x', 1, 'x'],
            type: 'number.base',
            context: { label: 'x[1].x', key: 'x', value: 'a' }
        }]);
    });

    it('overrides root key messages', () => {

        const schema = Joi.string().prefs({ messages: { root: 'blah' } });
        const err = schema.validate(4).error;
        expect(err).to.be.an.error('"blah" must be a string');
        expect(err.details).to.equal([{
            message: '"blah" must be a string',
            path: [],
            type: 'string.base',
            context: { value: 4, label: 'blah' }
        }]);
    });

    it('disables wrap.array', () => {

        const schema = Joi.alternatives(Joi.number(), Joi.string()).prefs({ errors: { wrap: { array: false } } });

        Helper.validate(schema, [
            [1, true],
            ['x', true],
            [true, false, '"value" must be one of number, string']
        ]);
    });

    it('overrides wrap.array', () => {

        const schema = Joi.alternatives(Joi.number(), Joi.string()).prefs({ errors: { wrap: { array: '{}' } } });

        Helper.validate(schema, [
            [1, true],
            ['x', true],
            [true, false, '"value" must be one of {number, string}']
        ]);
    });

    it('allows html escaping', () => {

        const schema = Joi.string().prefs({ messages: { root: 'blah' } }).label('bleh');
        const err = schema.validate(4).error;
        expect(err).to.be.an.error('"bleh" must be a string');
        expect(err.details).to.equal([{
            message: '"bleh" must be a string',
            path: [],
            type: 'string.base',
            context: { value: 4, label: 'bleh' }
        }]);
    });

    it('provides context with the error', () => {

        const schema = Joi.object({ length: Joi.number().min(3).required() });
        const err = schema.validate({ length: 1 }).error;
        expect(err.details).to.equal([{
            message: '"length" must be greater than or equal to 3',
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

    it('has a name that is ValidationError', () => {

        const schema = Joi.number();
        const validateErr = schema.validate('a').error;
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

    it('changes label value', () => {

        const schema = Joi.object({
            x: Joi.object({
                y: Joi.object({
                    z: Joi.valid('z'),
                    a: Joi.array().items(Joi.string())
                })
            })
        });

        expect(schema.validate({ x: { y: { z: 'o' } } }).error).to.be.an.error('"x.y.z" must be [z]');
        expect(schema.validate({ x: { y: { z: 'o' } } }, { errors: { label: false } }).error).to.be.an.error('must be [z]');
        expect(schema.validate({ x: { y: { z: 'o' } } }, { errors: { label: 'key' } }).error).to.be.an.error('"z" must be [z]');
        expect(schema.validate(1, { errors: { label: 'key' } }).error).to.be.an.error('"value" must be of type object');
        expect(schema.validate({ x: { y: { a: [1] } } }, { errors: { label: 'key' } }).error).to.be.an.error('"[0]" must be a string');
    });

    describe('annotate()', () => {

        it('annotates error', () => {

            const object = {
                a: 'm',
                y: {
                    b: {
                        c: 10
                    }
                }
            };

            const schema = Joi.object({
                a: Joi.string().valid('a', 'b', 'c', 'd'),
                y: Joi.object({
                    u: Joi.string().valid('e', 'f', 'g', 'h').required(),
                    b: Joi.string().valid('i', 'j').allow(false),
                    d: Joi.object({
                        x: Joi.string().valid('k', 'l').required(),
                        c: Joi.number()
                    })
                })
            });

            const err = schema.validate(object, { abortEarly: false }).error;
            expect(err).to.be.an.error('"a" must be one of [a, b, c, d]. "y.u" is required. "y.b" must be one of [i, j, false]. "y.b" must be a string');
            expect(err.details).to.equal([
                {
                    message: '"a" must be one of [a, b, c, d]',
                    path: ['a'],
                    type: 'any.only',
                    context: { value: 'm', valids: ['a', 'b', 'c', 'd'], label: 'a', key: 'a' }
                },
                {
                    message: '"y.u" is required',
                    path: ['y', 'u'],
                    type: 'any.required',
                    context: { label: 'y.u', key: 'u' }
                },
                {
                    message: '"y.b" must be one of [i, j, false]',
                    path: ['y', 'b'],
                    type: 'any.only',
                    context: { value: { c: 10 }, label: 'y.b', key: 'b', valids: ['i', 'j', false] }
                },
                {
                    message: '"y.b" must be a string',
                    path: ['y', 'b'],
                    type: 'string.base',
                    context: { value: { c: 10 }, label: 'y.b', key: 'b' }
                }
            ]);

            expect(err.annotate()).to.equal('{\n  "y": {\n    "b" \u001b[31m[3, 4]\u001b[0m: {\n      "c": 10\n    },\n    \u001b[41m"u"\u001b[0m\u001b[31m [2]: -- missing --\u001b[0m\n  },\n  "a" \u001b[31m[1]\u001b[0m: "m"\n}\n\u001b[31m\n[1] "a" must be one of [a, b, c, d]\n[2] "y.u" is required\n[3] "y.b" must be one of [i, j, false]\n[4] "y.b" must be a string\u001b[0m');
        });

        it('annotates error without colors if requested', () => {

            const object = {
                a: 'm'
            };

            const schema = Joi.object({
                a: Joi.string().valid('a', 'b', 'c', 'd')
            });

            const err = schema.validate(object, { abortEarly: false }).error;
            expect(err).to.be.an.error('"a" must be one of [a, b, c, d]');
            expect(err.details).to.equal([{
                message: '"a" must be one of [a, b, c, d]',
                path: ['a'],
                type: 'any.only',
                context: { value: 'm', valids: ['a', 'b', 'c', 'd'], label: 'a', key: 'a' }
            }]);
            expect(err.annotate(true)).to.equal('{\n  "a" [1]: "m"\n}\n\n[1] "a" must be one of [a, b, c, d]');
        });

        it('annotates error within array', () => {

            const object = {
                a: [1, 2, 3, 4, 2, 5]
            };

            const schema = Joi.object({
                a: Joi.array().items(Joi.valid(1, 2))
            });

            const err = schema.validate(object, { abortEarly: false }).error;
            expect(err).to.be.an.error('"a[2]" must be one of [1, 2]. "a[3]" must be one of [1, 2]. "a[5]" must be one of [1, 2]');
            expect(err.details).to.equal([
                {
                    message: '"a[2]" must be one of [1, 2]',
                    path: ['a', 2],
                    type: 'any.only',
                    context: { value: 3, valids: [1, 2], label: 'a[2]', key: 2 }
                },
                {
                    message: '"a[3]" must be one of [1, 2]',
                    path: ['a', 3],
                    type: 'any.only',
                    context: { value: 4, valids: [1, 2], label: 'a[3]', key: 3 }
                },
                {
                    message: '"a[5]" must be one of [1, 2]',
                    path: ['a', 5],
                    type: 'any.only',
                    context: { value: 5, valids: [1, 2], label: 'a[5]', key: 5 }
                }
            ]);
            expect(err.annotate()).to.equal('{\n  "a": [\n    1,\n    2,\n    3, \u001b[31m[1]\u001b[0m\n    4, \u001b[31m[2]\u001b[0m\n    2,\n    5 \u001b[31m[3]\u001b[0m\n  ]\n}\n\u001b[31m\n[1] "a[2]" must be one of [1, 2]\n[2] "a[3]" must be one of [1, 2]\n[3] "a[5]" must be one of [1, 2]\u001b[0m');
        });

        it('annotates error within array multiple times on the same element', () => {

            const object = {
                a: [2, 3, 4]
            };

            const schema = Joi.object({
                a: Joi.array().items(Joi.number().min(4).max(2))
            });

            const err = schema.validate(object, { abortEarly: false }).error;
            expect(err).to.be.an.error('"a[0]" must be greater than or equal to 4. "a[1]" must be greater than or equal to 4. "a[1]" must be less than or equal to 2. "a[2]" must be less than or equal to 2');
            expect(err.details).to.equal([
                {
                    message: '"a[0]" must be greater than or equal to 4',
                    path: ['a', 0],
                    type: 'number.min',
                    context: { limit: 4, value: 2, label: 'a[0]', key: 0 }
                },
                {
                    message: '"a[1]" must be greater than or equal to 4',
                    path: ['a', 1],
                    type: 'number.min',
                    context: { limit: 4, value: 3, label: 'a[1]', key: 1 }
                },
                {
                    message: '"a[1]" must be less than or equal to 2',
                    path: ['a', 1],
                    type: 'number.max',
                    context: { limit: 2, value: 3, label: 'a[1]', key: 1 }
                },
                {
                    message: '"a[2]" must be less than or equal to 2',
                    path: ['a', 2],
                    type: 'number.max',
                    context: { limit: 2, value: 4, label: 'a[2]', key: 2 }
                }
            ]);

            expect(err.annotate()).to.equal('{\n  "a": [\n    2, \u001b[31m[1]\u001b[0m\n    3, \u001b[31m[2, 3]\u001b[0m\n    4 \u001b[31m[4]\u001b[0m\n  ]\n}\n\u001b[31m\n[1] "a[0]" must be greater than or equal to 4\n[2] "a[1]" must be greater than or equal to 4\n[3] "a[1]" must be less than or equal to 2\n[4] "a[2]" must be less than or equal to 2\u001b[0m');
        });

        it('annotates error within array when it is an object', () => {

            const object = {
                a: [{ b: 2 }]
            };

            const schema = Joi.object({
                a: Joi.array().items(Joi.number())
            });

            const err = schema.validate(object, { abortEarly: false }).error;
            expect(err).to.be.an.error('"a[0]" must be a number');
            expect(err.details).to.equal([{
                message: '"a[0]" must be a number',
                path: ['a', 0],
                type: 'number.base',
                context: { label: 'a[0]', key: 0, value: { b: 2 } }
            }]);
            expect(err.annotate()).to.equal('{\n  "a": [\n    { \u001b[31m[1]\u001b[0m\n      "b": 2\n    }\n  ]\n}\n\u001b[31m\n[1] "a[0]" must be a number\u001b[0m');
        });

        it('annotates error within multiple arrays and multiple times on the same element', () => {

            const object = {
                a: [2, 3, 4],
                b: [2, 3, 4]
            };

            const schema = Joi.object({
                a: Joi.array().items(Joi.number().min(4).max(2)),
                b: Joi.array().items(Joi.number().min(4).max(2))
            });

            const err = schema.validate(object, { abortEarly: false }).error;
            expect(err).to.be.an.error('"a[0]" must be greater than or equal to 4. "a[1]" must be greater than or equal to 4. "a[1]" must be less than or equal to 2. "a[2]" must be less than or equal to 2. "b[0]" must be greater than or equal to 4. "b[1]" must be greater than or equal to 4. "b[1]" must be less than or equal to 2. "b[2]" must be less than or equal to 2');
            expect(err.details).to.equal([
                {
                    message: '"a[0]" must be greater than or equal to 4',
                    path: ['a', 0],
                    type: 'number.min',
                    context: { limit: 4, value: 2, label: 'a[0]', key: 0 }
                },
                {
                    message: '"a[1]" must be greater than or equal to 4',
                    path: ['a', 1],
                    type: 'number.min',
                    context: { limit: 4, value: 3, label: 'a[1]', key: 1 }
                },
                {
                    message: '"a[1]" must be less than or equal to 2',
                    path: ['a', 1],
                    type: 'number.max',
                    context: { limit: 2, value: 3, label: 'a[1]', key: 1 }
                },
                {
                    message: '"a[2]" must be less than or equal to 2',
                    path: ['a', 2],
                    type: 'number.max',
                    context: { limit: 2, value: 4, label: 'a[2]', key: 2 }
                },
                {
                    message: '"b[0]" must be greater than or equal to 4',
                    path: ['b', 0],
                    type: 'number.min',
                    context: { limit: 4, value: 2, label: 'b[0]', key: 0 }
                },
                {
                    message: '"b[1]" must be greater than or equal to 4',
                    path: ['b', 1],
                    type: 'number.min',
                    context: { limit: 4, value: 3, label: 'b[1]', key: 1 }
                },
                {
                    message: '"b[1]" must be less than or equal to 2',
                    path: ['b', 1],
                    type: 'number.max',
                    context: { limit: 2, value: 3, label: 'b[1]', key: 1 }
                },
                {
                    message: '"b[2]" must be less than or equal to 2',
                    path: ['b', 2],
                    type: 'number.max',
                    context: { limit: 2, value: 4, label: 'b[2]', key: 2 }
                }
            ]);
            expect(err.annotate()).to.equal('{\n  "a": [\n    2, \u001b[31m[1]\u001b[0m\n    3, \u001b[31m[2, 3]\u001b[0m\n    4 \u001b[31m[4]\u001b[0m\n  ],\n  "b": [\n    2, \u001b[31m[5]\u001b[0m\n    3, \u001b[31m[6, 7]\u001b[0m\n    4 \u001b[31m[8]\u001b[0m\n  ]\n}\n\u001b[31m\n[1] "a[0]" must be greater than or equal to 4\n[2] "a[1]" must be greater than or equal to 4\n[3] "a[1]" must be less than or equal to 2\n[4] "a[2]" must be less than or equal to 2\n[5] "b[0]" must be greater than or equal to 4\n[6] "b[1]" must be greater than or equal to 4\n[7] "b[1]" must be less than or equal to 2\n[8] "b[2]" must be less than or equal to 2\u001b[0m');
        });

        it('displays alternatives fail as a single line', () => {

            const schema = Joi.object({
                x: [
                    Joi.string(),
                    Joi.number(),
                    Joi.date()
                ]
            });

            const err = schema.validate({ x: true }).error;
            expect(err).to.be.an.error('"x" must be one of [string, number, date]');
            expect(err.details).to.equal([
                {
                    message: '"x" must be one of [string, number, date]',
                    path: ['x'],
                    type: 'alternatives.types',
                    context: { types: ['string', 'number', 'date'], label: 'x', key: 'x', value: true }
                }
            ]);

            expect(err.annotate()).to.equal('{\n  "x" \u001b[31m[1]\u001b[0m: true\n}\n\u001b[31m\n[1] "x" must be one of [string, number, date]\u001b[0m');
        });

        it('annotates circular input', () => {

            const schema = Joi.object({
                x: Joi.object({
                    y: Joi.object({
                        z: Joi.number()
                    })
                })
            });

            const input = {};
            input.x = input;

            const err = schema.validate(input).error;
            expect(err).to.be.an.error('"x.x" is not allowed');
            expect(err.details).to.equal([{
                message: '"x.x" is not allowed',
                path: ['x', 'x'],
                type: 'object.unknown',
                context: { child: 'x', label: 'x.x', key: 'x', value: input.x }
            }]);
            expect(err.annotate()).to.equal('{\n  "x" \u001b[31m[1]\u001b[0m: "[Circular ~]"\n}\n\u001b[31m\n[1] "x.x" is not allowed\u001b[0m');
        });

        it('annotates deep circular input', () => {

            const schema = Joi.object({
                x: Joi.object({
                    y: Joi.object({
                        z: Joi.number()
                    })
                })
            });

            const input = { x: { y: {} } };
            input.x.y.z = input.x.y;

            const err = schema.validate(input).error;
            expect(err).to.be.an.error('"x.y.z" must be a number');
            expect(err.details).to.equal([{
                message: '"x.y.z" must be a number',
                path: ['x', 'y', 'z'],
                type: 'number.base',
                context: { label: 'x.y.z', key: 'z', value: input.x.y }
            }]);
            expect(err.annotate()).to.equal('{\n  "x": {\n    "y": {\n      "z" \u001b[31m[1]\u001b[0m: "[Circular ~.x.y]"\n    }\n  }\n}\n\u001b[31m\n[1] "x.y.z" must be a number\u001b[0m');
        });

        it('annotates deep circular input with extra keys', () => {

            const schema = Joi.object({
                x: Joi.object({
                    y: Joi.object({
                        z: Joi.number()
                    })
                })
            });

            const input = { x: { y: { z: 1, foo: {} } } };
            input.x.y.foo = input.x.y;

            const err = schema.validate(input).error;
            expect(err).to.be.an.error('"x.y.foo" is not allowed');
            expect(err.details).to.equal([{
                message: '"x.y.foo" is not allowed',
                path: ['x', 'y', 'foo'],
                type: 'object.unknown',
                context: { child: 'foo', label: 'x.y.foo', key: 'foo', value: input.x.y.foo }
            }]);
            expect(err.annotate()).to.equal('{\n  "x": {\n    "y": {\n      "z": 1,\n      "foo" \u001b[31m[1]\u001b[0m: "[Circular ~.x.y]"\n    }\n  }\n}\n\u001b[31m\n[1] "x.y.foo" is not allowed\u001b[0m');
        });

        it('prints NaN, Infinity and -Infinity correctly in errors', () => {

            const schema = Joi.object({
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
            });

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

            const err = schema.validate(input).error;
            expect(err).to.be.an.error('"x.y" must be a valid date');
            expect(err.details).to.equal([{
                message: '"x.y" must be a valid date',
                path: ['x', 'y'],
                type: 'date.base',
                context: { label: 'x.y', key: 'y', value: NaN }
            }]);
            expect(err.annotate().replace(/\\r/g, '')).to.equal('{\n  "x": {\n    "z": Infinity,\n    "u": -Infinity,\n    "g": Symbol(foo),\n    "h": -Infinity,\n    "i": Infinity,\n    "k": (a) => a,\n    "p": Symbol(bar),\n    "f": function (x) {\\n\\n                        return [{ y: 2 }];\\n                    },\n    "y" \u001b[31m[1]\u001b[0m: NaN\n  }\n}\n\u001b[31m\n[1] "x.y" must be a valid date\u001b[0m');
        });

        it('handles child to uncle relationship inside a child', () => {

            const object = {
                response: {
                    options: {
                        stripUnknown: true
                    }
                }
            };

            const ref = Joi.ref('.options.stripUnknown');
            const schema = Joi.object({
                response: Joi.object({
                    modify: Joi.boolean(),
                    options: Joi.object()
                })
                    .assert(ref, Joi.ref('modify'), 'meet requirement of having peer modify set to true')
            });

            const err = schema.validate(object, { abortEarly: false }).error;
            expect(err).to.be.an.error('"response" is invalid because "options.stripUnknown" failed to meet requirement of having peer modify set to true');
            expect(err.details).to.equal([{
                message: '"response" is invalid because "options.stripUnknown" failed to meet requirement of having peer modify set to true',
                path: ['response'],
                type: 'object.assert',
                context: {
                    subject: ref,
                    message: 'meet requirement of having peer modify set to true',
                    label: 'response',
                    key: 'response',
                    value: object.response
                }
            }]);

            expect(() => err.annotate(true)).to.not.throw();
        });

        it('annotates joi schema error', () => {

            const schema = Joi.object({
                type: 'string'
            })
                .unknown();

            const value = Joi.number().min(1);
            const err = schema.validate(value).error;
            expect(err.message).equal('"type" must be [string]');
            expect(err.annotate()).to.contain('"type" must be [string]');
            Helper.equal(value, Joi.number().min(1));
        });
    });
});
