// Load modules

var Lab = require('lab');
var Joi = require('../lib');
var Set = require('../lib/set');


// Declare internals

var internals = {};


// Test shortcuts

var expect = Lab.expect;
var before = Lab.before;
var after = Lab.after;
var describe = Lab.experiment;
var it = Lab.test;


describe('Set', function () {

    it('should throw an error when not using an array as the initial value', function (done) {

        expect(function () {
            var s = new Set('string');
        }).to.throw;

        done();
    });

    it('should allow an array as the initial value', function (done) {

        expect(function () {
            var s = new Set([1, 2, 3]);
        }).to.not.throw;

        done();
    });

    describe('#add', function () {

        it('should work with numbers', function (done) {

            var s = new Set();
            s.add(1);
            s.add(2);
            expect(s.get().length).to.equal(2);
            s.remove(2);
            expect(s.get().length).to.equal(1);
            done();
        });

        it('should work with undefined', function (done) {

            var s = new Set();
            s.add(undefined)
            expect(s.has(undefined)).to.equal(true);
            done();
        });

        it('should work with arrays', function (done) {

            var s = new Set();
            s.add([1, 2, 3]);
            expect(s.has([1, 2, 3])).to.equal(true);
            done();
        });
    });

    describe('#valueOf', function () {

        it('should return list of values added', function (done) {

            var s = new Set();
            s.add(1);
            s.add(2);
            s.add(3);
            expect(s.valueOf()).to.include(1);
            expect(s.valueOf()).to.include(2);
            expect(s.valueOf()).to.include(3);
            done();
        });
    });

    describe('#toString', function () {

        it('should return JSON formatted array', function (done) {

            var s = new Set();
            s.add(1);
            s.add(2);
            s.add(3);
            expect(s.toString()).to.include(1);
            expect(s.toString()).to.include(2);
            expect(s.toString()).to.include(3);
            done();
        });
    });

    describe('#map', function () {

        it('should map values over a function', function (done) {

            var s = new Set();
            s.add(1);
            s.add(2);
            s.add(3);
            s.map(function (value) {

                expect([1, 2, 3]).to.include(value);
            });
            done();
        });
    });
});