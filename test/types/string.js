var Types = require("../../lib/types/");
var should = require("should");
var verifyBehavior = require("../support/meta").verifyValidatorBehavior;


describe("test/types/string.js", function(){
  describe("Types.String", function(){
    var S = Types.String;
    
    it("should instantiate separate copies on invocation", function(done){
      var result1 = S().min(5);
      var result2 = S().max(5);
      
      Object.keys(result1).should.not.equal(Object.keys(result2));
      done();
    })
    
    describe("#valid", function(){
      it("should throw error on input not matching type", function(done){
        (function(){
          S().valid(1);
        }).should.throw();
        done()
      })
      
      it("should not throw on input matching type", function(done){
        (function(){
          S().valid("walmart");
        }).should.not.throw();
        done()
      })
    })
    
    describe("#invalid", function(){
      it("should throw error on input not matching type", function(done){
        (function(){
          S().invalid(1);
        }).should.throw();
        done()
      })
      
      it("should not throw on input matching type", function(done){
        (function(){
          S().invalid("walmart");
        }).should.not.throw();
        done()
      })
    })
    
    describe("#validate", function(){
      it('should work', function(done){
        (function(){
          var text = S();
          var result = text.validate("joi");
        }).should.not.throw();
        done();
      })
      
      it('should, by default, allow undefined, deny empty string', function(done){
        var conditions = [
          [undefined, true],
          ["", false]
        ];
        verifyBehavior(S(), conditions, done);
      })
      
      it("should, when .required(), deny undefined, deny empty string", function(done){
        var t = S().required();
        verifyBehavior(t, [
          [undefined, false],
          ["", false]
        ], done);
      })
      
      it("should return false for denied value", function(done){
        var text = S().deny("joi");
        var result = text.validate("joi");
        should.exist(result);
        result.should.equal(false);
        done();
      })
      
      it("should return true for allowed value", function(done){
        var text = S().allow("hapi");
        var result = text.validate("result");
        should.exist(result);
        result.should.equal(true);
        done();
      })
      
      it("should validate with one validator (min)", function(done){
        var text = S().min(3);
        var result = text.validate("walmart");
        should.exist(result);
        result.should.equal(true);
        done();
      })
      
      it("should validate with two validators (min, required)", function(done){
        var text = S().min(3).required();
        var result = text.validate("walmart")
        should.exist(result);
        result.should.equal(true);
        
        var result2 = text.validate();
        should.exist(result2);
        result2.should.equal(false);
        
        done();
      })
      
      it("should validate null with nullOk()", function(done){
        verifyBehavior(S().nullOk(), [
          [null, true]
        ], done);
      })
      
      it("should validate '' (empty string) with emptyOk()", function(done){
        verifyBehavior(S().emptyOk(), [
          ['', true],
          ["", true]
        ], done);
      })
    })
  })
})

// describe("Types.String", function(){
//   var S = Types.String;
  
//   it('should instantiate separate copies on invocation', function(done){
//     var result1 = S().min(5);
//     var result2 = S().max(5);
    
//     Object.keys(result1).should.not.equal(Object.keys(result2));
//     done();
//   })
  
//   it("should inherit functions from BaseType", function(done){
//     var fns = ["required", "add"];
    
//     for(var i in fns){
//       should.exist(S()[fns[i]]);
//     }
//     done();
//   })
  
//   it("should show resulting object with #valueOf", function(done){
//     var result = S().min(5);
//     should.exist(result.valueOf());
//     done();
//   })
  
//   // describe("#_base", function(){
//   //   it("should work", function(done){
//   //     var fn = S()._base();
//   //     fn._valids = []
//   //     var result = fn()
//   //     done();
//   //   })
//   // })
  
//   describe("#min", function(done){
//     it('should exist', function(done){
//       should.exist(S().min);
//       done();
//     })
    
//     it("should have corresponding validator function", function(done){
//       should.exist(S()._min);
//       done();
//     })
    
//     it('should have value on #valueOf', function(done){
//       var result = S().min(5).valueOf();
//       should.exist(result);
//       (result.length).should.equal(2)
//       done();
//     })
//   })
  
//   describe("#_min", function(done){
//     it('should validate on known valid input', function(done){
//       var inputs = ["abcde", "fghij", "klmnopqrstuv"];
//       var validator = S()._min(5);
//       for(var i in inputs){
//         var currentResult = validator(inputs[i]);
//         should.exist(currentResult);
//         currentResult.should.equal(true);
//       }
//       done();
//     })
    
//     it('should invalidate on known invalid inputs', function(done){
//       var inputs = ["abc", "de", ""];
//       var validator = S()._min(5);
//       for(var i in inputs){
//         var currentResult = validator(inputs[i]);
//         should.exist(currentResult);
//         currentResult.should.equal(false);
//       }
//       done();
//     })
//   })
  
//   describe("#max", function(done){
//     it('should exist', function(done){
//       should.exist(S().max);
//       done();
//     })
    
//     it("should have corresponding validator function", function(done){
//       should.exist(S()._max);
//       done();
//     })
    
//     it('should have correct length on #valueOf', function(done){
//       var result = S().max(5).valueOf();
//       should.exist(result);
//       (result.length).should.equal(2)
//       done();
//     })
//   })
  
//   describe("#_max", function(done){
//     it('should validate on known valid input', function(done){
//       var inputs = ["abc", "de", ""];
//       var validator = S()._max(4);
//       for(var i in inputs){
//         var currentResult = validator(inputs[i]);
//         should.exist(currentResult);
//         currentResult.should.equal(true);
//       }
//       done();
//     })
    
//     it('should invalidate on known invalid inputs', function(done){
//       var inputs = ["abcde", "fghij", "klmnopqrstuv"];
//       var validator = S()._max(4);
//       for(var i in inputs){
//         var currentResult = validator(inputs[i]);
//         should.exist(currentResult);
//         currentResult.should.equal(false);
//       }
//       done();
//     })
//   })
  
//   describe("#regex", function(done){
//     it('should exist', function(done){
//       should.exist(S().regex);
//       done();
//     })
    
//     it("should have corresponding validator function", function(done){
//       should.exist(S()._regex);
//       done();
//     })
    
//     it('should have correct length on #valueOf', function(done){
//       var result = S().regex(/^[a-z]+$/).valueOf();
//       should.exist(result);
//       (result.length).should.equal(2)
//       done();
//     })
//   })
  
//   describe("#_regex", function(done){
//     it('should validate on known valid input', function(done){
//       var inputs = ["aaaaa", "abcdefghijklmnopqrstuvwxyz", "walmartlabs"];
//       var validator = S()._regex(/^[a-z]+$/);
//       for(var i in inputs){
//         var currentResult = validator(inputs[i]);
//         should.exist(currentResult);
//         currentResult.should.equal(true);
//       }
//       done();
//     })
    
//     it('should invalidate on known invalid inputs', function(done){
//       var inputs = ["abcd#f?h1j", "m3ch4", "m3g4"];
//       var validator = S()._regex(/^[a-z]+$/);
//       for(var i in inputs){
//         var currentResult = validator(inputs[i]);
//         should.exist(currentResult);
//         currentResult.should.equal(false);
//       }
//       done();
//     })
//   })
// })