var should = require("should");

var Types = process.env.TEST_COV ? require('../../lib-cov/types') : require('../../lib/types');
var BaseType = Types.Base;
var Utils = require("../../lib/utils");
var sys = require("sys");

describe("types/base.js", function () {
    describe("BaseType", function () {
        it('should', function (done) {
            var B = new BaseType();
            var r = B.allow(undefined);
            // console.log("after allow", r);
            done();
        })
    })
})

// describe("BaseType", function(){
//   describe("#_required", function(){
//     it('should return true if non-null input is given and required', function(done){
//       var base = new BaseType();
//       var result = base._required()("walmart");
//       should.exist(result);
//       result.should.equal(true);
//       done();
//     })

//     it('should return true if null input is given and allowNull is true', function(done){
//       var base = new BaseType();
//       var result = base._required(true)(null);
//       should.exist(result);
//       result.should.equal(true);
//       done();
//     })

//     it('should return false if null input is given and allowNull is false', function(done){
//       var base = new BaseType();
//       var result = base._required(false)(null);
//       should.exist(result);
//       result.should.equal(false);
//       done();
//     })

//     it('should return false if no input is given and allowNull is false', function(done){
//       var base = new BaseType();
//       var result = base._required(false)();
//       should.exist(result);
//       result.should.equal(false);
//       done();
//     })
//   })

//   describe("#_rename", function(){
//     var key = "name";
//     var key2 = "note";
//     var key3 = "username";
//     var qstr = {name: "van", note: "author"};
//     var value = qstr[key];
//     var value2 = qstr[key2];

//     it("should alias a variable with default options", function(done){
//       var base = new BaseType();
//       var validator = base._rename(key3);
//       var q = Utils.clone(qstr);
//       var result = validator(value, q, key);

//       should.exist(q[key3]);
//       q[key3].should.equal(value);
//       done();
//     })

//     it("should move variable if deleteOrig set", function(done){
//       var base = new BaseType();
//       var validator = base._rename(key3, {deleteOrig: true});
//       var q = Utils.clone(qstr);
//       var result = validator(value, q, key);

//       should.exist(q[key3]);
//       should.not.exist(q[key]);
//       q[key3].should.equal(value);
//       done();
//     })

//     it("should overwrite existing variable if allowOverwrite set", function(done){
//       var base = new BaseType();
//       var key2 = "note";
//       var validator = base._rename(key2, {allowOverwrite: true});
//       var q = Utils.clone(qstr);
//       var result = validator(value, q, key)

//       should.exist(q[key2]);
//       q[key2].should.equal(value);
//       q[key].should.equal(value);
//       done();
//     })

//     it("should not overwrite existing variable if allowOverwrite not set", function(done){
//       var base = new BaseType();
//       var validator = base._rename(key2, {allowOverwrite: false});
//       var q = Utils.clone(qstr);
//       var result = validator(value, q, key);

//       should.exist(result);
//       result.should.equal(false);

//       should.exist(q[key2]);
//       q[key2].should.equal(value2);
//       q[key].should.equal(value); // Original value not deleted
//       done();
//     })

//     it("should not allow two renames to set the same key if allowMult not set", function(done){
//       var base = new BaseType();
//       var q = Utils.clone(qstr);
//       var validator = base._rename(key3, {allowMult: false})
//       var result = validator(value, q, key);

//       var validator = base._rename(key3, {allowMult: false})
//       var result = validator(value2, q, key2);

//       result.should.equal(false);

//       // first _rename will not be rolled back
//       should.exist(q[key3]);
//       q[key3].should.equal(value);
//       done();
//     })
//   })

//   describe("#description", function(){
//     it('should set description', function(done){
//       var value = "walmart";
//       var base = new BaseType();
//       var result;
//       (function(){
//         result = base.description(value);
//       }).should.not.throw();
//       should.exist(result);
//       result.description.should.equal(value);
//       done();
//     })

//     it('should return error if description is not a string', function(done){
//       var value = 1;
//       var base = new BaseType();
//       var result;
//       (function(){
//         result = base.description(value);
//       }).should.throw();
//       // should.exist(result);
//       // result.description.should.equal(value);
//       done();
//     })
//   })

//   describe("#notes", function(){
//     it('should set notes if given as string', function(done){
//       var value = "walmart";
//       var base = new BaseType();
//       var result;
//       (function(){
//         result = base.notes(value);
//       }).should.not.throw();
//       should.exist(result);
//       result.notes.should.equal(value);
//       done();
//     })

//     it('should set notes if given as array', function(done){
//       var value = ["walmart", "@walmartlabs"];
//       var base = new BaseType();
//       var result;
//       (function(){
//         result = base.notes(value);
//       }).should.not.throw();
//       should.exist(result);
//       result.notes.should.equal(value);
//       done();
//     })

//     it('should return error if not given as string or array', function(done){
//       var value = 1;
//       var base = new BaseType();
//       var result;
//       (function(){
//         result = base.notes(value);
//       }).should.throw();
//       done();
//     })
//   })

//   describe("#tags", function(){
//     it('should set tags if given as array', function(done){
//       var value = ["walmart", "@walmartlabs"];
//       var base = new BaseType();
//       var result;
//       (function(){
//         result = base.tags(value);
//       }).should.not.throw();
//       should.exist(result);
//       result.tags.should.equal(value);
//       done();
//     })

//     it('should return error if not given as array', function(done){
//       var value = 1;
//       var base = new BaseType();
//       var result;
//       (function(){
//         result = base.notes(value);
//       }).should.throw();
//       done();
//     })
//   })
// })