'use strict';

const Code = require('@hapi/code');
const Lab = require('@hapi/lab');
const Joi = require('..');


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
        expect(template.render({}, {}, { context: { x: 'hello', y: '!' } }, {}, { escapeHtml: false })).to.equal('text hello! {{escaped}} xxx abc {{{ignore}} 123 {{x');
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

        it('errors on tempalte with invalid formula', () => {

            const source = '{x +}';
            expect(() => Joi.x(source)).to.throw('Invalid template variable "x +" fails due to: Formula contains invalid trailing operator');
        });
    });

    describe('functions', () => {

        describe('number()', () => {

            it('casts values to numbers', () => {

                const schema = Joi.valid(Joi.x('{number(1) + number(true) + number(false) + number("1") + number($x)}'));
                expect(schema.validate(3, { context: { x: {} } }).error).to.not.exist();
                expect(schema.validate(4, { context: { x: {} } }).error).to.be.an.error('"value" must be one of [{number(1) + number(true) + number(false) + number("1") + number($x)}]');
            });
        });
    });
});
