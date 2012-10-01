var Types = require("../../lib/types/");
var should = require("should");

describe("Types.Boolean", function(){
  var B = Types.Boolean;
  it("should have mixins", function(done){
    var result = B();
    
    should.exist(result.validate);
    done();
  })
})