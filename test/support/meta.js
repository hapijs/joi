// Load modules

var Chai = require('chai');


// Declare internals

var internals = {};


// Test shortcuts

var expect = Chai.expect;


exports.verifyValidatorBehavior = function (typeObj, config, callback) {

    for (var i in config) {
        var result = typeObj.validate(config[i][0]);
        expect(result).to.exist;
        expect(result).to.equal(config[i][1]);
    }

    callback();
};

