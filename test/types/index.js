var Types = process.env.TEST_COV ? require('../../lib-cov/types') : require('../../lib/types');
var should = require("should");

describe("Types", function () {
    it("should have a String key", function(done) {
        Types.String.should.exist;
        done();
    });

    it("should have a Number key", function(done) {
        Types.Number.should.exist;
        done();
    });

    it("should have a Boolean key", function(done) {
        Types.Boolean.should.exist;
        done();
    });

    it("should have an Array key", function(done) {
        Types.Array.should.exist;
        done();
    });

    describe("#validate", function() {
        it("should validate a string value on an object", function(done) {
            var object = {
                testme: "valid"
            };
            var validator = function() { return true; };

            Types.validate("testme", "String", object, validator).should.equal(true);
            done();
        });
    });
});