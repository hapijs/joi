// Load modules

var Lab = require('lab');


// Declare internals

var internals = {};


// Test shortcuts

var expect = Lab.expect;
var before = Lab.before;
var after = Lab.after;
var describe = Lab.experiment;
var it = Lab.test;


exports.verifyValidatorBehavior = function (typeObj, config, callback) {

    for (var i in config) {
        var result = typeObj.validate(config[i][0]);
        expect(result).to.exist;
        expect(result).to.equal(config[i][1]);
    }

    callback();
};

