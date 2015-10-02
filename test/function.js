// Load modules

var Lab = require('lab');
var Joi = require('../lib');
var Helper = require('./helper');


// Declare internals

var internals = {};


// Test shortcuts

var lab = exports.lab = Lab.script();
var describe = lab.describe;
var it = lab.it;


describe('func', function () {

    it('validates a function', function (done) {

        Helper.validate(Joi.func().required(), [
            [function () { }, true],
            ['', false]
        ], done);
    });

    it('validates a function with keys', function (done) {

        var a = function () { };
        a.a = 'abc';

        var b = function () { };
        b.a = 123;

        Helper.validate(Joi.func().keys({ a: Joi.string().required() }).required(), [
            [function () { }, false],
            [a, true],
            [b, false],
            ['', false]
        ], done);
    });
});
