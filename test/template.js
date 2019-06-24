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
        const template = Joi.template(source);

        expect(template.source).to.equal(source);
        expect(template.isDynamic()).to.be.false();
        expect(template.render()).to.equal(source);
    });

    it('skips template without variables', () => {

        const source = 'text {{{ without }}} any }} variables';
        const template = Joi.template(source);

        expect(template.source).to.equal(source);
        expect(template.isDynamic()).to.be.false();
        expect(template.render()).to.equal(source);
    });

    it('skips template without variables (trailing {)', () => {

        const source = 'text {{{ without }}} any }} variables {';
        const template = Joi.template(source);

        expect(template.source).to.equal(source);
        expect(template.isDynamic()).to.be.false();
        expect(template.render()).to.equal(source);
    });

    it('skips template without variables (trailing {{)', () => {

        const source = 'text {{{ without }}} any }} variables {{';
        const template = Joi.template(source);

        expect(template.source).to.equal(source);
        expect(template.isDynamic()).to.be.false();
        expect(template.render()).to.equal(source);
    });

    it('skips template without reference variables (trailing {{)', () => {

        const source = 'text {"x"} {{{ without }}} any }} variables {{';
        const template = Joi.template(source);

        expect(template.source).to.equal(source);
        expect(template.isDynamic()).to.be.false();
        expect(template.render()).to.equal('text x {{{ without }}} any }} variables {{');
    });

    it('skips template without variables (escaped)', () => {

        const source = 'text {{{ without }}} any }} \\{{escaped}} variables';
        const template = Joi.template(source);

        expect(template.source).to.equal(source);
        expect(template.isDynamic()).to.be.false();
        expect(template.render()).to.equal('text {{{ without }}} any }} {{escaped}} variables');
    });

    it('parses template (escaped)', () => {

        const source = 'text {{$x}}{{$y}}{{$z}} \\{{escaped}} xxx abc {{{ignore}} 123 {{x';
        const template = Joi.template(source);

        expect(template.source).to.equal(source);
        expect(template.render({}, {}, { context: { x: 'hello', y: '!' } })).to.equal('text hello&#x21; {{escaped}} xxx abc {{{ignore}} 123 {{x');
        expect(template.render({}, {}, { context: { x: 'hello', y: '!' } }, {}, { escapeHtml: false })).to.equal('text hello! {{escaped}} xxx abc {{{ignore}} 123 {{x');
    });

    it('parses template with single variable', () => {

        const source = '{$x}';
        const template = Joi.template(source);

        expect(template.source).to.equal(source);
        expect(template.render({}, {}, { context: { x: 'hello' } })).to.equal('hello');
    });

    it('parses template (raw)', () => {

        const source = 'text {$x}{$y}{$z} \\{{escaped}} xxx abc {{{ignore}} 123 {{x';
        const template = Joi.template(source);

        expect(template.source).to.equal(source);
        expect(template.render({}, {}, { context: { x: 'hello', y: '!' } })).to.equal('text hello! {{escaped}} xxx abc {{{ignore}} 123 {{x');
    });

    it('parses template with odd {{ variables', () => {

        const source = 'text {{$\\{{\\}} }} \\{{boom}} {{!\\}}';
        const template = Joi.template(source);

        expect(template.source).to.equal(source);
        expect(template.render({}, {}, { context: { '{{}}': 'and' } })).to.equal('text and {{boom}} {{!}}');
    });

    it('throws on invalid characters', () => {

        expect(() => Joi.template('test\u0000')).to.throw('Template source cannot contain reserved control characters');
        expect(() => Joi.template('test\u0001')).to.throw('Template source cannot contain reserved control characters');
    });

    describe('isTemplate()', () => {

        it('checks if item is a joi template', () => {

            expect(Joi.isTemplate(null)).to.be.false();
            expect(Joi.isTemplate({})).to.be.false();
            expect(Joi.isTemplate('test')).to.be.false();
            expect(Joi.isTemplate(Joi.template('test'))).to.be.true();
        });
    });

    describe('_ref()', () => {

        it('errors on tempalte with invalid formula', () => {

            const source = '{x +}';
            expect(() => Joi.template(source)).to.throw('Invalid template variable "x +" fails due to: Formula contains invalid trailing operator');
        });
    });
});
