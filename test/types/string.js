var Types = require("../../lib/types/");
var should = require("should");

describe("Types.String", function(){
  var S = Types.String;
  
  it('should instantiate separate copies on invocation', function(done){
    var result1 = S().min(5);
    var result2 = S().max(5);
    
    Object.keys(result1).should.not.equal(Object.keys(result2));
    done();
  })
  
  it("should inherit functions from BaseType", function(done){
    var fns = ["required", "add"];
    
    for(var i in fns){
      should.exist(S()[fns[i]]);
    }
    done();
  })
  
  it("should show resulting object with #valueOf", function(done){
    var result = S().min(5);
    should.exist(result.valueOf());
    done();
  })
  
  // describe("#_base", function(){
  //   it("should work", function(done){
  //     var fn = S()._base();
  //     fn._valids = []
  //     var result = fn()
  //     done();
  //   })
  // })
  
  describe("#min", function(done){
    it('should exist', function(done){
      should.exist(S().min);
      done();
    })
    
    it("should have corresponding validator function", function(done){
      should.exist(S()._min);
      done();
    })
    
    it('should have value on #valueOf', function(done){
      var result = S().min(5).valueOf();
      should.exist(result);
      (result.length).should.equal(2)
      done();
    })
  })
  
  describe("#_min", function(done){
    it('should validate on known valid input', function(done){
      var inputs = ["abcde", "fghij", "klmnopqrstuv"];
      var validator = S()._min(5);
      for(var i in inputs){
        var currentResult = validator(inputs[i]);
        should.exist(currentResult);
        currentResult.should.equal(true);
      }
      done();
    })
    
    it('should invalidate on known invalid inputs', function(done){
      var inputs = ["abc", "de", ""];
      var validator = S()._min(5);
      for(var i in inputs){
        var currentResult = validator(inputs[i]);
        should.exist(currentResult);
        currentResult.should.equal(false);
      }
      done();
    })
  })
  
  describe("#max", function(done){
    it('should exist', function(done){
      should.exist(S().max);
      done();
    })
    
    it("should have corresponding validator function", function(done){
      should.exist(S()._max);
      done();
    })
    
    it('should have correct length on #valueOf', function(done){
      var result = S().max(5).valueOf();
      should.exist(result);
      (result.length).should.equal(2)
      done();
    })
  })
  
  describe("#_max", function(done){
    it('should validate on known valid input', function(done){
      var inputs = ["abc", "de", ""];
      var validator = S()._max(4);
      for(var i in inputs){
        var currentResult = validator(inputs[i]);
        should.exist(currentResult);
        currentResult.should.equal(true);
      }
      done();
    })
    
    it('should invalidate on known invalid inputs', function(done){
      var inputs = ["abcde", "fghij", "klmnopqrstuv"];
      var validator = S()._max(4);
      for(var i in inputs){
        var currentResult = validator(inputs[i]);
        should.exist(currentResult);
        currentResult.should.equal(false);
      }
      done();
    })
  })
  
  describe("#regex", function(done){
    it('should exist', function(done){
      should.exist(S().regex);
      done();
    })
    
    it("should have corresponding validator function", function(done){
      should.exist(S()._regex);
      done();
    })
    
    it('should have correct length on #valueOf', function(done){
      var result = S().regex(/^[a-z]+$/).valueOf();
      should.exist(result);
      (result.length).should.equal(2)
      done();
    })
  })
  
  describe("#_regex", function(done){
    it('should validate on known valid input', function(done){
      var inputs = ["aaaaa", "abcdefghijklmnopqrstuvwxyz", "walmartlabs"];
      var validator = S()._regex(/^[a-z]+$/);
      for(var i in inputs){
        var currentResult = validator(inputs[i]);
        should.exist(currentResult);
        currentResult.should.equal(true);
      }
      done();
    })
    
    it('should invalidate on known invalid inputs', function(done){
      var inputs = ["abcd#f?h1j", "m3ch4", "m3g4"];
      var validator = S()._regex(/^[a-z]+$/);
      for(var i in inputs){
        var currentResult = validator(inputs[i]);
        should.exist(currentResult);
        currentResult.should.equal(false);
      }
      done();
    })
  })
})