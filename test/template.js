'use strict';

const Code = require('@hapi/code');
const Lab = require('@hapi/lab');
const Joi = require('..');

const Helper = require('./helper');

const internals = {};


const { describe, it } = exports.lab = Lab.script();
const { expect } = Code;


describe('Template', () => {

    it('skips template without {', () => {

        const source = 'text without variables';
        const template = Joi.x(source);

        expect(template.source).to.equal(source);
        expect(template.isDynamic()).to.be.false();
        expect(template.render()).to.equal(source);
    });

    it('skips template without variables', () => {

        const source = 'text {{{ without }}} any }} variables';
        const template = Joi.x(source);

        expect(template.source).to.equal(source);
        expect(template.isDynamic()).to.be.false();
        expect(template.render()).to.equal(source);
    });

    it('skips template without variables (trailing {)', () => {

        const source = 'text {{{ without }}} any }} variables {';
        const template = Joi.x(source);

        expect(template.source).to.equal(source);
        expect(template.isDynamic()).to.be.false();
        expect(template.render()).to.equal(source);
    });

    it('skips template without variables (trailing {{)', () => {

        const source = 'text {{{ without }}} any }} variables {{';
        const template = Joi.x(source);

        expect(template.source).to.equal(source);
        expect(template.isDynamic()).to.be.false();
        expect(template.render()).to.equal(source);
    });

    it('skips template without reference variables (trailing {{)', () => {

        const source = 'text {"x"} {{{ without }}} any }} variables {{';
        const template = Joi.x(source);

        expect(template.source).to.equal(source);
        expect(template.isDynamic()).to.be.false();
        expect(template.render()).to.equal('text x {{{ without }}} any }} variables {{');
    });

    it('skips template without variables (escaped)', () => {

        const source = 'text {{{ without }}} any }} \\{{escaped}} variables';
        const template = Joi.x(source);

        expect(template.source).to.equal(source);
        expect(template.isDynamic()).to.be.false();
        expect(template.render()).to.equal('text {{{ without }}} any }} {{escaped}} variables');
    });

    it('parses template (escaped)', () => {

        const source = 'text {{$x}}{{$y}}{{$z}} \\{{escaped}} xxx abc {{{ignore}} 123 {{x';
        const template = Joi.x(source);

        expect(template.source).to.equal(source);
        expect(template.render({}, {}, { context: { x: 'hello', y: '!' } })).to.equal('text hello&#x21; {{escaped}} xxx abc {{{ignore}} 123 {{x');
        expect(template.render({}, {}, { context: { x: 'hello', y: '!' } }, {}, { errors: { escapeHtml: false } })).to.equal('text hello! {{escaped}} xxx abc {{{ignore}} 123 {{x');
    });

    it('parses template with single variable', () => {

        const source = '{$x}';
        const template = Joi.x(source);

        expect(template.source).to.equal(source);
        expect(template.render({}, {}, { context: { x: 'hello' } })).to.equal('hello');
    });

    it('parses template (raw)', () => {

        const source = 'text {$x}{$y}{$z} \\{{escaped}} xxx abc {{{ignore}} 123 {{x';
        const template = Joi.x(source);

        expect(template.source).to.equal(source);
        expect(template.render({}, {}, { context: { x: 'hello', y: '!' } })).to.equal('text hello! {{escaped}} xxx abc {{{ignore}} 123 {{x');
    });

    it('parses template with odd {{ variables', () => {

        const source = 'text {{$\\{{\\}} }} \\{{boom}} {{!\\}}';
        const template = Joi.x(source);

        expect(template.source).to.equal(source);
        expect(template.render({}, {}, { context: { '{{}}': 'and' } })).to.equal('text and {{boom}} {{!}}');
    });

    it('throws on invalid characters', () => {

        expect(() => Joi.x('test\u0000')).to.throw('Template source cannot contain reserved control characters');
        expect(() => Joi.x('test\u0001')).to.throw('Template source cannot contain reserved control characters');
    });

    describe('isExpression()', () => {

        it('checks if item is a joi template', () => {

            expect(Joi.isExpression(null)).to.be.false();
            expect(Joi.isExpression({})).to.be.false();
            expect(Joi.isExpression('test')).to.be.false();
            expect(Joi.isExpression(Joi.x('test'))).to.be.true();
        });
    });

    describe('_ref()', () => {

        it('errors on template with invalid formula', () => {

            const source = '{x +}';
            expect(() => Joi.x(source)).to.throw('Invalid template variable "x +" fails due to: Formula contains invalid trailing operator');
        });
    });

    describe('stringify()', () => {

        it('resolves ref', () => {

            const ref = Joi.ref('a', { render: 'true' });
            const schema = Joi.object({
                a: Joi.number(),
                b: Joi.number().min(ref)
            });

            expect(schema.validate({ a: 10, b: 5 }).error).to.be.an.error('"b" must be greater than or equal to 10');
        });

        it('resolves ref (in)', () => {

            const ref = Joi.in('a', { render: 'true' });
            const schema = Joi.object({
                a: Joi.array().items(Joi.number()),
                b: Joi.number().valid(ref)
            });

            expect(schema.validate({ a: [1, 2, 3], b: 5 }).error).to.be.an.error('"b" must be [1, 2, 3]');
        });
    });

    describe('functions', () => {

        describe('msg()', () => {

            it('ignores missing options', () => {

                const template = Joi.x('{msg("x")}');
                expect(template.render({}, {}, {}, {})).to.equal('');
            });

            it('ignores missing codes', () => {

                const template = Joi.x('{msg("x")}');
                expect(template.render({}, {}, {}, {}, { messages: [] })).to.equal('');
            });

            it('uses code in first set', () => {

                const template = Joi.x('{msg("x")}');
                expect(template.render({}, {}, { errors: {} }, {}, { messages: [{ x: Joi.x('X') }] })).to.equal('X');
            });

            it('uses code in second set', () => {

                const template = Joi.x('{msg("x")}');
                expect(template.render({}, {}, { errors: {} }, {}, { messages: [null, { x: Joi.x('X') }] })).to.equal('X');
            });
        });

        describe('number()', () => {

            it('casts values to numbers', () => {

                const schema = Joi.valid(Joi.x('{number(1) + number(true) + number(false) + number("1") + number($x)}'));
                Helper.validate(schema, { context: { x: {} } }, [[3, true]]);
                Helper.validate(schema, { context: { x: {} } }, [[4, false, '"value" must be [{number(1) + number(true) + number(false) + number("1") + number($x)}]']]);
            });
        });

        describe('length()', () => {

            it('calculates object size', () => {

                const schema = Joi.object({
                    a: Joi.array().length(Joi.x('{length(b)}')),
                    b: Joi.object()
                });

                Helper.validate(schema, [
                    [{ a: [1, 2], b: { a: true, b: true } }, true],
                    [{ a: [1, 2, 3], b: { a: true, b: true } }, false, '"a" must contain {length(b)} items']
                ]);
            });

            it('calcualtes array size', () => {

                const schema = Joi.object({
                    a: Joi.array().length(Joi.x('{length(b)}')),
                    b: Joi.array()
                });

                Helper.validate(schema, [
                    [{ a: [1, 2], b: [2, 3] }, true],
                    [{ a: [1, 2, 3], b: [1] }, false, '"a" must contain {length(b)} items']
                ]);
            });

            it('handles null', () => {

                const schema = Joi.object({
                    a: Joi.array().length(Joi.x('{length(b)}')),
                    b: Joi.array().allow(null)
                });

                Helper.validate(schema, [
                    [{ a: [1], b: null }, false, '"a" limit references "{length(b)}" which must be a positive integer']
                ]);
            });

            it('handles strings', () => {

                const schema = Joi.object({
                    a: Joi.array().length(Joi.x('{length(b)}')),
                    b: Joi.string()
                });

                Helper.validate(schema, [
                    [{ a: [1], b: 'x' }, true],
                    [{ a: [1], b: 'xx' }, false, '"a" must contain {length(b)} items']
                ]);
            });

            it('handles items without length', () => {

                const schema = Joi.object({
                    a: Joi.array().length(Joi.x('{length(b)}')),
                    b: Joi.number()
                });

                Helper.validate(schema, [
                    [{ a: [1], b: 1 }, false, '"a" limit references "{length(b)}" which must be a positive integer']
                ]);
            });
        });
    });



    describe('formula parsing for values that could either be a primitive or an object property which might have spaces in its key', () => {

        const schema = Joi.array().items(Joi.alternatives().conditional(Joi.object(), {
            then: Joi.object({
                'var with spaces': Joi.string().optional(),
                variable: Joi.string().optional()
            }).xor('variable', 'var with spaces').unknown(),
            otherwise: Joi.string().optional()
        })).min(1).unique((a, b) => {

            const aVal = typeof a === 'object' ? a['var with spaces'] ?? a.variable : a;
            const bVal = typeof b === 'object' ? b['var with spaces'] ?? b.variable : b;
            return aVal === bVal;
        }).messages({
            'array.unique': 'Duplicate values: "{#value.variable || #value.[var with spaces] || #value}", "{#dupeValue.variable || #dupeValue.[var with spaces] || #dupeValue}"'
        });

        it('shows correct error when the value is an object', () => {

            expect(schema.validate([
                { variable: 'value' },
                { variable: 'value' }
            ]).error.message).to.equal('Duplicate values: "value", "value"');

            expect(schema.validate([
                { 'var with spaces': 'value' },
                { 'var with spaces': 'value' }
            ]).error.message).to.equal('Duplicate values: "value", "value"');

            expect(schema.validate([
                { variable: 'value' },
                { 'var with spaces': 'value' }
            ]).error.message).to.equal('Duplicate values: "value", "value"');
        });

        describe('throws when value is a primitive', () => {
            it('', () => {

                expect(schema.validate([
                    'value',
                    'value'
                ]).error.message).to.equal('Duplicate values: "value", "value"');
            });

            it('', () => {

                expect(schema.validate([
                    'value',
                    { variable: 'value' }
                ]).error.message).to.equal('Duplicate values: "value", "value"');
            });

            it('', () => {

                expect(schema.validate([
                    { 'var with spaces': 'value' },
                    'value'
                ]).error.message).to.equal('Duplicate values: "value", "value"');
            });
        });
    });
});
