var O = process.env.TEST_COV ? require('../../lib-cov/types/object') : require('../../lib/types/object');
var should = require("should");
var verifyBehavior = require("../support/meta").verifyValidatorBehavior;


describe("Types.Object", function () {

    it("should have mixins", function (done) {
        var result = O();

        should.exist(result.validate);
        done();
    });

    it("can convert a json string to an object", function (done) {
        var result = O().convert('{"hi":true}');

        result.hi.should.be.true;
        done();
    });

    it("should validate an object", function (done) {
        var t = O().required();
        verifyBehavior(t, [
            [{hi: true}, true],
            ["", false]
        ], done);
    });
});