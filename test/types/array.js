var Types = require("../../lib/types/");
var should = require("should");
var verifyBehavior = require("../support/meta").verifyValidatorBehavior;

describe("tests/types/array.js", function(){
  
  describe("Types.Array", function(){
    var A = Types.Array,
        N = Types.Number,
        S = Types.String;
    
    describe("#validate", function(){
      it('should work', function(done){
        (function(){
          var arr = A();
          var result = arr.validate([1]);
        }).should.not.throw();
        done();
      })
      
      it('should, by default, allow undefined, allow empty array', function(done){
        verifyBehavior(A(), [
          [undefined, true],
          [[], true]
        ], done);
      })
      
      it("should, when .required(), deny undefined", function(done){
        verifyBehavior(A().required(), [
          [undefined, false]
        ], done);
      })
      
      it("should validate array of Numbers", function(done){
        verifyBehavior(A().includes(N()), [
          [[1,2,3], true],
          [[50, 100, 1000], true],
          [["a", 1, 2], false]
        ], done);
      })
      
      it("should validate array of mixed Numbers & Strings", function(done){
        verifyBehavior(A().includes(N(), S()), [
          [[1,2,3], true],
          [[50, 100, 1000], true],
          [[1, "a", 5, 10], true],
          [["walmart", "everydaylowprices", 5000], true]
        ], done);
      })
      
      it("should not validate array of unallowed mixed types (Array)", function(done){
        verifyBehavior(A().includes(N()), [
          [[1,2,3], true],
          [[1, 2, [1]], false]
        ], done)
      })
    })

    describe("#_exclude", function(){
      it("should work", function(done){
        var validator = A()._excludes(N());
        
        var n = [1,2,"hippo"];
        var result = validator(n);
        
        result.should.equal(false);
        
        var m = ['x', 'y', 'z'];
        var result2 = validator(m);
        
        result2.should.equal(true);
        
        
        done();
        
        // var validator = A()._includes(N())
        // var val2 = A()._includes(S())
        
        // // var n = [1,2,"hippo"];
        // var n = [[1],[2],[3]];
        
        // var result = validator(n);
        // var result2 = val2(n)
        
        // console.log(result, result2);
        // done();
      })
    })
  })
})

// describe("Types.Array", function(){
//   var A = Types.Array;
//   var N = Types.Number;
  
//   // it('should instantiate separate copies on invocation', function(done){
//   //   var result1 = A().required();
//   //   var result2 = A();
    
//   //   Object.keys(result1).should.not.equal(Object.keys(result2));
//   //   done();
//   // })
  
//   it("should inherit functions from BaseType", function(done){
//     var fns = ["required", "add"];
    
//     for(var i in fns){
//       should.exist(A()[fns[i]]);
//     }
//     done();
//   })
  
//   it("should show resulting object with #valueOf", function(done){
//     var result = A();
//     should.exist(result.valueOf());
//     done();
//   })
  
//   describe("#includes", function(done){
//     it('should exist', function(done){
//       should.exist(A().includes);
//       done();
//     })
//   })
  
//   describe("#_includes", function(done){
//     it('should validate on known good input', function(done){
//       var input = [10, 20];
//       var validators = A()._includes(N().min(5));
      
//       for(var j in validators) {
//         var result = validators[j](input);
//         should.exist(result);
//         result.should.be(true);
//       }
//       done();
//     })
    
//     it('should invalidate on known bad input', function(done){
//       var input = [3, 1];
//       var len = input.length;
//       var validators = A()._includes(N().min(5));
//       var isValid = true;
      
//       for(var j in validators) {
//         var result = validators[j](input);
//         should.exist(result);
//         result.should.be(false);
//       }
//       done();
//     })
//   })
  
//   // describe("#_excludes", function(done){
//   //   it('should validate on known good input', function(done){
//   //     var input = [3, 1];
//   //     var validators = A()._excludes(N().min(5));
      
//   //     for(var j in validators) {
//   //       var result = validators[j](input);
//   //       should.exist(result);
//   //       result.should.be(true);
//   //     }
//   //     done();
//   //   })
    
//   //   it('should invalidate on known bad input', function(done){
//   //     var input = [10, 20];
//   //     var len = input.length;
//   //     var validators = A()._excludes(N().min(5));
//   //     var isValid = true;
      
//   //     for(var j in validators) {
//   //       var result = validators[j](input);
//   //       should.exist(result);
//   //       result.should.be(false);
//   //     }
//   //     done();
//   //   })
//   // })
  
// });