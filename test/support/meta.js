var should = require("should");

module.exports.verifyValidatorBehavior = function(typeObj, config, callback) {
  for(var i in config){
    var result = typeObj.validate(config[i][0]);
    should.exist(result);
    result.should.equal(config[i][1]);
  }
  callback();
}