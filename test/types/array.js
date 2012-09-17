var should = require("should");

var Types = require("../../lib/types/");

describe("Types.Array", function(){
  var A = Types.Array;
  var N = Types.Number;
  
  it('should instantiate separate copies on invocation', function(done){
    var result1 = A().required();
    var result2 = A();
    
    Object.keys(result1).should.not.equal(Object.keys(result2));
    done();
  })
  
  it("should inherit functions from BaseType", function(done){
    var fns = ["required", "add"];
    
    for(var i in fns){
      should.exist(A()[fns[i]]);
    }
    done();
  })
  
  it("should show resulting object with #valueOf", function(done){
    var result = A();
    should.exist(result.valueOf());
    done();
  })
  
  describe("#includes", function(done){
    it('should exist', function(done){
      should.exist(A().includes);
      done();
    })
  })
  
  describe("#_includes", function(done){
    it('should validate on known good input', function(done){
      var input = [10, 20];
      var validators = A()._includes(N().min(5));
      
      for(var j in validators) {
        var result = validators[j](input);
        should.exist(result);
        result.should.be(true);
      }
      done();
    })
    
    it('should invalidate on known bad input', function(done){
      var input = [3, 1];
      var len = input.length;
      var validators = A()._includes(N().min(5));
      var isValid = true;
      
      for(var j in validators) {
        var result = validators[j](input);
        should.exist(result);
        result.should.be(false);
      }
      done();
    })
  })
  
  // describe("#_excludes", function(done){
  //   it('should validate on known good input', function(done){
  //     var input = [3, 1];
  //     var validators = A()._excludes(N().min(5));
      
  //     for(var j in validators) {
  //       var result = validators[j](input);
  //       should.exist(result);
  //       result.should.be(true);
  //     }
  //     done();
  //   })
    
  //   it('should invalidate on known bad input', function(done){
  //     var input = [10, 20];
  //     var len = input.length;
  //     var validators = A()._excludes(N().min(5));
  //     var isValid = true;
      
  //     for(var j in validators) {
  //       var result = validators[j](input);
  //       should.exist(result);
  //       result.should.be(false);
  //     }
  //     done();
  //   })
  // })
  
});