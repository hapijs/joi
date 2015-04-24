// Load modules

var Lab = require('lab');
var Code = require('code');
var Joi = require('../lib');
var Hoek = require('hoek');

// Test shortcuts

var lab = exports.lab = Lab.script();
var describe = lab.describe;
var it = lab.it;
var before = lab.before;
var after = lab.after;
var expect = Code.expect;
var deepEqual = Hoek.deepEqual;

var common = function () {

    var options = this.options;
    var schema = this.schema;
    var expected = this.expected;
    var F = function () {

        return  function () {

        };
    };

    it('should validate without options', function (done) {

        Joi.validate(expected, schema);
        done();
    });

    it('should validate with global.Promise', function (done) {

        global.Promise = require('bluebird');
        Joi.validate(expected, schema, { asPromise: true })
            .then(function (actual) {

                expect(actual).to.equal(expected);
                delete global.Promise;
                done();
            });
    });

    it('should not fail without a withPromises', function (done) {

        Joi.validate(expected, schema, { asPromise: true })
            .then(function (actual) {

                expect(actual).to.equal(expected);
                done();
            });
    });

    it('should fail with a non-function withPromises', function (done) {

        expect(function () {

            Joi.validate(expected, schema, { asPromise: true, withPromises: null });
        }).to.throw();
        done();
    });

    it('should fail without Promises.resolve() and Promises.reject()', function (done) {

        var Promises = F();
        expect(function () {

            Joi.validate(expected, schema, {
                asPromise: true,
                withPromises: Promises
            });
        }).to.throw(Error, /options\.asPromise/);
        done();
    });

    it('fails without Promises.resolve()', function (done) {

        var Promises = F();
        Promises.reject = F();
        expect(function () {

            Joi.validate(expected, schema, {
                asPromise: true,
                withPromises: Promises
            });
        }).to.throw(Error, /options\.asPromise/);
        done();
    });

    it('fails without Promises.reject()', function (done) {

        var Promises = F();
        Promises.resolve = F();
        expect(function () {

            Joi.validate(expected, schema, {
                asPromise: true,
                withPromises: Promises
            });
        }).to.throw(Error, /options\.asPromise/);
        done();
    });

    it('resolves', function (done) {

        Joi.validate(expected, schema, options)
            .then(function (actual) {

                expect(actual).to.equal(expected);
                done();
            })
            .catch(function (err) {

                expect(err).to.be.null();
                done();
            });
    });

    it('resolves', function (done) {

        var expected = 100;
        Joi.validate(expected, schema, options)
            .then(function (actual) {

                expect(actual).to.equal(expected);
                done();
            })
            .catch(function (err) {

                expect(err).to.not.be.null();
                done();
            });
    });

};

describe('asPromise (bluebird)', function () {

    var Promise = require('bluebird');
    var options = {
        asPromise: true,
        withPromises: Promise
    };
    var schema = Joi.number().min(1).max(10);
    var expected = 1;

    it('provides a promise when requested', function (done) {

        var result = Joi.validate(expected, schema, options);
        expect(result).to.be.an.instanceof(Promise);
        done();
    });

    it('does not unexpectedly provide a promise', function (done) {

        var result = Joi.validate(expected, schema, {});
        expect(result).to.not.be.a.function();
        done();
    });

    common.call({ expected: 1, schema: schema, options: options });
});

describe('asPromise (q)', function () {

    var Promise = require('q');
    var options = {
        asPromise: true,
        withPromises: Promise
    };
    var schema = Joi.number().min(1).max(10);

    it('provides a promise when requested', function (done) {

        var result = Joi.validate(1, schema, options);
        expect(Promise.isPromise(result)).to.be.true();
        done();
    });

    it('does not unexpectedly provide a promise', function (done) {

        var result = Joi.validate(1, schema, {});
        expect(Promise.isPromise(result)).to.be.false();
        done();
    });

    common.call({ schema: schema, options: options });
});

describe('asPromise (when)', function () {

    var Promise = require('when/es6-shim/Promise');
    var options = {
        asPromise: true,
        withPromises: Promise
    };
    var schema = Joi.number().min(1).max(10);

    it('provides a promise when requested', function (done) {

        var result = Joi.validate(1, schema, options);
        expect(result).to.be.an.instanceof(Promise);
        done();
    });

    it('does not unexpectedly provide a promise', function (done) {

        var result = Joi.validate(1, schema, {});
        expect(result).to.not.be.an.instanceof(Promise);
        done();
    });

    common.call({ schema: schema, options: options });
});

describe('asPromise (vow)', function () {

    var Promise = require('vow').Promise;
    var options = {
        asPromise: true,
        withPromises: Promise
    };
    var schema = Joi.number().min(1).max(10);

    it('provides a promise when requested', function (done) {

        var result = Joi.validate(1, schema, options);
        expect(result).to.be.an.instanceof(Promise);
        done();
    });

    it('does not unexpectedly provide a promise', function (done) {

        var result = Joi.validate(1, schema, {});
        expect(result).to.not.be.an.instanceof(Promise);
        done();
    });

    common.call({ schema: schema, options: options });
});

describe('asPromise (es6-promise)', function () {

    var Promise = require('es6-promise').Promise;
    var options = {
        asPromise: true,
        withPromises: Promise
    };
    var schema = Joi.number().min(1).max(10);

    it('provides a promise when requested', function (done) {

        var result = Joi.validate(1, schema, options);
        expect(result).to.be.an.instanceof(Promise);
        done();
    });

    it('does not unexpectedly provide a promise', function (done) {

        var result = Joi.validate(1, schema, {});
        expect(result).to.not.be.an.instanceof(Promise);
        done();
    });

    common.call({ schema: schema, options: options });
});


describe('asPromise (es6-promise/polyfill)', function () {

    before(function (done) {

        delete global.Promise;
        require('es6-promise').polyfill();
        done();
    });

    var options = {
        asPromise: true,
        withPromises: Promise
    };
    var schema = Joi.number().min(1).max(10);

    it('provides a promise when requested', function (done) {

        var result = Joi.validate(1, schema, options);
        expect(result).to.be.an.instanceof(Promise);
        done();
    });

    it('does not unexpectedly provide a promise', function (done) {

        var result = Joi.validate(1, schema, {});
        expect(result).to.not.be.an.instanceof(Promise);
        done();
    });

    common.call({ schema: schema, options: options });

    after(function (done) {

        delete global.Promise;
        done();
    });
});
