// Load modules

var Lab = require('lab');
var Code = require('code');
var Joi = require('../lib');
var ObjectID = require('bson').BSONPure.ObjectID;


// Declare internals

var internals = {};


// Test shortcuts

var lab = exports.lab = Lab.script();
var before = lab.before;
var after = lab.after;
var describe = lab.describe;
var it = lab.it;
var expect = Code.expect;


describe('objectId', function () {

    it('converts a hex string to an objectId', function (done) {

        var hexString = '507f1f77bcf86cd799439011';
        Joi.objectId().validate(hexString, function (err, value) {

            expect(err).to.not.exist();
            expect(value.toHexString()).to.equal(hexString);
            done();
        });
    });

    it('errors on non-hex string', function (done) {

        var invalidString = 'a string';
        Joi.objectId().validate(invalidString, function (err, value) {

            expect(err).to.exist();
            expect(value).to.equal(invalidString);
            done();
        });
    });

    it('validates an objectId', function (done) {

        var objectId = new ObjectID('507f1f77bcf86cd799439011');
        Joi.objectId().validate(objectId, function (err, value) {

            expect(err).to.not.exist();
            expect(value).to.equal(objectId);
            done();
        });
    });
});
