var Utils = require("../lib/utils");
var should = require("should");

describe("test/utils.js", function(){
  describe("Utils", function(){
    describe("Set", function(){
      var Set = Utils.Set;
      
      it('should work with numbers', function(done){
        var s = new Set();
        s.add(1)
        s.add(2)
        s.get().length.should.equal(2)
        s.remove(2);
        s.get().length.should.equal(1)
        done();
      })
      
      it('should work with undefined', function(done){
        var s = new Set();
        s.add(undefined)
        s.has(undefined).should.equal(true);
        done();
      })
      
      it('should work with arrays', function(done){
        var s = new Set();
        s.add([1,2,3])
        s.has([1,2,3]).should.equal(true);
        done();
      })
    })
  })
})