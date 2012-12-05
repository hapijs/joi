var Set = process.env.TEST_COV ? require('../lib-cov/set') : require('../lib/set');
var should = require('should');


describe('Set', function () {

    it('should throw an error when not using an array as the initial value', function (done) {

        (function () {
            var s = new Set('string');
        }).should.throw();

        done();
    });

    it('should allow an array as the initial value', function (done) {

        (function () {
            var s = new Set([1, 2, 3]);
        }).should.not.throw();

        done();
    });

    describe('#add', function () {

        it('should work with numbers', function (done) {

            var s = new Set();
            s.add(1);
            s.add(2);
            s.get().length.should.equal(2);
            s.remove(2);
            s.get().length.should.equal(1);
            done();
        });

        it('should work with undefined', function (done) {

            var s = new Set();
            s.add(undefined)
            s.has(undefined).should.equal(true);
            done();
        });

        it('should work with arrays', function (done) {

            var s = new Set();
            s.add([1, 2, 3]);
            s.has([1, 2, 3]).should.equal(true);
            done();
        });
    });

    describe('#valueOf', function () {

        it('should return list of values added', function (done) {

            var s = new Set();
            s.add(1);
            s.add(2);
            s.add(3);
            s.valueOf().should.include(1);
            s.valueOf().should.include(2);
            s.valueOf().should.include(3);
            done();
        });
    });

    describe('#toString', function () {

        it('should return JSON formatted array', function (done) {

            var s = new Set();
            s.add(1);
            s.add(2);
            s.add(3);
            s.toString().should.include(1);
            s.toString().should.include(2);
            s.toString().should.include(3);
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

                [1, 2, 3].should.include(value);
            });
            done();
        });
    });
});