var Types = process.env.TEST_COV ? require('../../lib-cov/types') : require('../../lib/types');
var should = require("should");

describe("Boolean", function () {

    var B = Types.Boolean;

    it("should have mixins", function (done) {

        var result = B();

        should.exist(result.validate);
        done();
    });

    describe('#convert', function () {

        it("should convert a string to a boolean", function (done) {

            var result = B().convert('true');

            result.should.equal(true);
            done();
        });

        it("should not convert a number to a boolean", function (done) {

            var result = B().convert(1);

            result.should.equal(1);
            done();
        });
    });
});