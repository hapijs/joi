var Types = process.env.TEST_COV ? require('../../lib-cov/types') : require('../../lib/types');
var should = require("should");

describe("Types", function () {

    it("should have a String key", function (done) {

        Types.String.should.exist;
        done();
    });

    it("should have a Number key", function (done) {

        Types.Number.should.exist;
        done();
    });

    it("should have a Boolean key", function (done) {

        Types.Boolean.should.exist;
        done();
    });

    it("should have an Array key", function (done) {

        Types.Array.should.exist;
        done();
    });

    describe("#validate", function () {

        it("should validate a string value on an object", function (done) {

            var object = {
                testme:"valid"
            };
            var validator = function () {
                return true;
            };

            Types.validate("testme", "String", object, validator).should.equal(true);
            done();
        });

        it("should convert a value and validate it", function (done) {

            var object = {
                testme: "1"
            };

            var validator = function (val) {

                return val;
            };

            Types.validate("testme", "Number", object, validator).should.equal(1);
            done();
        });

        it("should use a placeholder when its provided", function (done) {

            var object = {
                testme: "1"
            };

            var placeholder = {};

            var validator = function (val) {

                return val;
            };

            Types.validate("testme", "Number", object, validator, placeholder).should.equal(1);
            placeholder.validationErrors.should.exist;
            done();
        });
    });
});