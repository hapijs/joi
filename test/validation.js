// var should = require("should");
// var qs = require("querystring");

// var Validation = require("../lib/joi");
// var Types = require("../lib/types");
// var S = Types.String,
//     N = Types.Number,
//     O = Types.Object,
//     B = Types.Boolean;

// var OhaiHandler = function (hapi, reply) {
//     reply('ohai');
// };

// var createRequestObject = function (query, route) {
//     var qstr = qs.stringify(query);
//     // return {
//     //   httpVersion: '1.1',
//     //   url: '/?' + qstr,
//     //   method: 'GET',
//     //   hapi: {
//     //     server: {},
//     //     url: '/?' + qstr,
//     //     query: query,
//     //     params: {}
//     //   }
//     // }
//     return {
//         url: {
//             search: '?' + qstr,
//             query: query,
//             pathname: route.path,
//             path: route.path + '?' + qstr,//'/config?choices=1&choices=2',
//             href: route.path + '?' + qstr //'/config?choices=1&choices=2'
//         },
//         query: query,
//         path: route.path,
//         method: route.method,
//         _route: { config: route.config }
//     }
// }

// describe("Validation", function () {
//     describe("#query", function () {
//         describe("using Types.String", function () {
//             describe("without constraints", function () {
//                 // does not match new default behaviors, replace this test later
//                 // it('should raise error if value submitted when key not defined in route query config', function(done){
//                 //   var route = {method: 'GET', path: '/', handler: OhaiHandler, query: {test: S()}};
//                 //   var query = {username: 'vnguyen'};
//                 //   var request = createRequestObject(query, route);

//                 //   Validation.query(request, function(err){
//                 //     should.exist(err);
//                 //     done();
//                 //   })
//                 // })

//                 // it('should not raise error on undefined OPTIONAL StringType parameter', function(done){
//                 //   var r = {method: 'GET', path: '/', handler: OhaiHandler, query: {test: S()}};
//                 //   var query = {};
//                 //   var request = createRequestObject(query, r);

//                 //   Validation.query(request, r, function(err){
//                 //     should.not.exist(err);
//                 //     done();
//                 //   })
//                 // })

//                 // it('should not raise error on undefined OPTIONAL NumberType parameter', function(done){
//                 //   var r = {method: 'GET', path: '/', handler: OhaiHandler, query: {test: N()}};
//                 //   var query = {};
//                 //   var request = createRequestObject(query, r);

//                 //   Validation.query(request, r, function(err){
//                 //     should.not.exist(err);
//                 //     done();
//                 //   })
//                 // })

//                 // it('should not raise error on undefined OPTIONAL StringType parameter', function(done){
//                 //   var r = {method: 'GET', path: '/', handler: OhaiHandler, query: {test: S()}};
//                 //   var query = {};
//                 //   var request = createRequestObject(query, r);

//                 //   Validation.query(request, r, function(err){
//                 //     should.not.exist(err);
//                 //     done();
//                 //   })
//                 // })

//                 // it('should not raise error on undefined OPTIONAL BooleanType parameter', function(done){
//                 //   var r = {method: 'GET', path: '/', handler: OhaiHandler, query: {test: B()}};
//                 //   var query = {};
//                 //   var request = createRequestObject(query, r);

//                 //   Validation.query(request, r, function(err){
//                 //     should.not.exist(err);
//                 //     done();
//                 //   })
//                 // })
//             })

//             describe("#required", function () {
//                 var route = { method: 'GET', path: '/', config: { handler: OhaiHandler, query: { username: S().required() } } };

//                 it("should raise error on undefined REQUIRED parameter", function (done) {
//                     var query = {}
//                     var request = createRequestObject(query, route);

//                     Validation.query(request, function (err) {
//                         should.exist(err);
//                         done();
//                     })
//                 })

//                 it('should not raise error on defined REQUIRED parameter', function (done) {
//                     var query = { username: "walmart" }
//                     var request = createRequestObject(query, route);

//                     Validation.query(request, function (err) {
//                         should.not.exist(err);
//                         done();
//                     })
//                 })

//                 it('should not raise error on undefined OPTIONAL parameter', function (done) {
//                     var modifiedRoute = { method: 'GET', path: '/', config: { handler: OhaiHandler, query: { username: S().required(), name: S() } } };
//                     var query = { username: "walmart" }
//                     var request = createRequestObject(query, modifiedRoute);

//                     Validation.query(request, function (err) {
//                         should.not.exist(err);
//                         done();
//                     })
//                 })
//             })

//             describe("#min", function () {
//                 var route = { method: 'GET', path: '/', config: { handler: OhaiHandler, query: { username: S().min(7) } } };

//                 it("should raise error on input length < min parameter", function (done) {
//                     var query = { username: "van" }
//                     var request = createRequestObject(query, route);

//                     Validation.query(request, function (err) {
//                         should.exist(err);
//                         done();
//                     })
//                 })

//                 it("should NOT raise error on input > min parameter", function (done) {
//                     var query = { username: "thegoleffect" }
//                     var request = createRequestObject(query, route);

//                     Validation.query(request, function (err) {
//                         should.not.exist(err);
//                         done();
//                     })
//                 })

//                 it("should NOT raise error on input == min parameter", function (done) {
//                     var query = { username: "walmart" }
//                     var request = createRequestObject(query, route);

//                     Validation.query(request, function (err) {
//                         should.not.exist(err);
//                         done();
//                     })
//                 })
//             })

//             describe("#max", function () {
//                 var route = { method: 'GET', path: '/', config: { handler: OhaiHandler, query: { username: S().max(7) } } };

//                 it("should raise error on input length > max parameter", function (done) {
//                     var query = { username: "thegoleffect" }
//                     var request = createRequestObject(query, route);

//                     Validation.query(request, function (err) {
//                         should.exist(err);
//                         done();
//                     })
//                 })

//                 it("should NOT raise error on input < max parameter", function (done) {
//                     var query = { username: "van" }
//                     var request = createRequestObject(query, route);

//                     Validation.query(request, function (err) {
//                         should.not.exist(err);
//                         done();
//                     })
//                 })

//                 it("should NOT raise error on input == max parameter", function (done) {
//                     var query = { username: "walmart" }
//                     var request = createRequestObject(query, route);

//                     Validation.query(request, function (err) {
//                         should.not.exist(err);
//                         done();
//                     })
//                 })
//             })


//             describe("#regex", function () {
//                 var route = { method: 'GET', path: '/', config: { handler: OhaiHandler, query: { username: S().regex(/^[0-9][-][a-z]+$/) } } };

//                 it("should raise error on input not matching regex parameter", function (done) {
//                     var query = { username: "van" }
//                     var request = createRequestObject(query, route);

//                     Validation.query(request, function (err) {
//                         should.exist(err);
//                         done();
//                     })
//                 })

//                 it("should NOT raise error on input matching regex parameter", function (done) {
//                     var query = { username: "1-aaaa" }
//                     var request = createRequestObject(query, route);

//                     Validation.query(request, function (err) {
//                         should.not.exist(err);
//                         done();
//                     })
//                 })
//             })

//             describe("combinations of #required, #min, #max", function () {
//                 var route = { method: 'GET', path: '/', config: { handler: OhaiHandler, query: { username: S().required().min(5).max(7) } } };

//                 it("should raise error when not supplied required input", function (done) {
//                     var query = { name: "van" }
//                     var request = createRequestObject(query, route);

//                     Validation.query(request, function (err) {
//                         should.exist(err);
//                         done();
//                     })
//                 })

//                 it("should raise error when input length not within min/max bounds", function (done) {
//                     var query = { username: "van" }
//                     var request = createRequestObject(query, route);

//                     Validation.query(request, function (err) {
//                         should.exist(err);
//                         done();
//                     })
//                 })

//                 it("should NOT raise error when input length is within min/max bounds", function (done) {
//                     var query = { username: "walmart" }
//                     var request = createRequestObject(query, route);

//                     Validation.query(request, function (err) {
//                         should.not.exist(err);
//                         done();
//                     })
//                 })
//             })

//             describe("#alphanum", function (done) {
//                 describe("with spacesEnabled", function () {
//                     var route = { method: 'GET', path: '/', config: { handler: OhaiHandler, query: { phrase: S().alphanum(true) } } };

//                     it('should validate on known valid input', function (done) {
//                         var query = { phrase: "w0rld of w4lm4rtl4bs" }
//                         var request = createRequestObject(query, route);

//                         Validation.query(request, function (err) {
//                             should.not.exist(err);
//                             done();
//                         })

//                         // var inputs = ["w0rld of w4lm4rtl4bs", "ev3ry day l0w prices", "wa1m4rt1abs"];
//                         // var validator = S().alphanum(true);
//                         // for(var i in inputs){
//                         //   var currentResult = validator(inputs[i]);
//                         //   should.exist(currentResult);
//                         //   currentResult.should.equal(true);
//                         // }
//                         // done();
//                     })

//                     it('should invalidate on known invalid inputs', function (done) {
//                         var query = { phrase: "abcd#f?h1j orly?" }
//                         var request = createRequestObject(query, route);

//                         Validation.query(request, function (err) {
//                             should.exist(err);
//                             done();
//                         })
//                         //   var inputs = ["abcd#f?h1j orly?", "t3r4_y7es", "m3g4^y7es"];
//                         //   var validator = S().alphanum(true);
//                         //   for(var i in inputs){
//                         //     var currentResult = validator(inputs[i]);
//                         //     should.exist(currentResult);
//                         //     currentResult.should.equal(false);
//                         //   }
//                         //   done();
//                     })
//                 })

//                 describe("without spacesEnabled", function () {
//                     var route = { method: 'GET', path: '/', config: { handler: OhaiHandler, query: { phrase: S().alphanum(false) } } };

//                     it('should validate on known valid input', function (done) {
//                         var query = { phrase: "walmartlabs" }
//                         var request = createRequestObject(query, route);

//                         Validation.query(request, function (err) {
//                             should.not.exist(err);
//                             done();
//                         })
//                         // var inputs = ["walmartlabs", "w0rldofw41m4rtlabs", "everydayl0wprices"];
//                         // var validator = S().alphanum(false);
//                         // for(var i in inputs){
//                         //   var currentResult = validator(inputs[i]);
//                         //   should.exist(currentResult);
//                         //   currentResult.should.equal(true);
//                         // }
//                         // done();
//                     })

//                     it('should invalidate on known invalid inputs', function (done) {
//                         var query = { phrase: "abcd#f?h1j" }
//                         var request = createRequestObject(query, route);

//                         Validation.query(request, function (err) {
//                             should.exist(err);
//                             done();
//                         })
//                         // var inputs = ["abcd#f?h1j", "m3ch4", "m3g4"];
//                         // var validator = S().alphanum(false);
//                         // for(var i in inputs){
//                         //   var currentResult = validator(inputs[i]);
//                         //   should.exist(currentResult);
//                         //   currentResult.should.equal(false);
//                         // }
//                         // done();
//                     })
//                 })
//             })

//             describe("#email", function () {
//                 var route = { method: 'GET', path: '/', config: { handler: OhaiHandler, query: { email: S().email() } } };

//                 it("should validate on known valid inputs", function (done) {
//                     var query = { email: "van@walmartlabs.com" }
//                     var request = createRequestObject(query, route);

//                     Validation.query(request, function (err) {
//                         should.not.exist(err);
//                         done();
//                     })
//                 })

//                 it("should invalidate on known invalid inputs", function (done) {
//                     var query = { email: "@iaminvalid.com" }
//                     var request = createRequestObject(query, route);

//                     Validation.query(request, function (err) {
//                         should.exist(err);
//                         done();
//                     })
//                 })
//             })

//             describe("#rename", function () {
//                 var route = { method: 'GET', path: '/', config: { handler: OhaiHandler, query: { username: S().rename("name", { deleteOrig: true }).min(7) } } };

//                 it("should apply subsequent validators on the new name AFTER a rename", function (done) {
//                     var query = { username: "thegoleffect" }
//                     var request = createRequestObject(query, route);

//                     Validation.query(request, function (err) {
//                         should.not.exist(err);
//                         done();
//                     })
//                 })
//             })

//             describe("#date", function () {
//                 var route = { method: 'GET', path: '/', config: { handler: OhaiHandler, query: { date: S().date() } } };

//                 it("should not raise error on Date string input given as toLocaleString", function (done) {
//                     var query = { date: "Mon Aug 20 2012 12:14:33 GMT-0700 (PDT)" };
//                     var request = createRequestObject(query, route);

//                     Validation.query(request, function (err) {
//                         should.not.exist(err);
//                         done();
//                     })
//                 })

//                 it("should not raise error on Date string input given as ISOString", function (done) {
//                     var query = { date: "2012-08-20T19:14:33.000Z" };
//                     var request = createRequestObject(query, route);

//                     Validation.query(request, function (err) {
//                         should.not.exist(err);
//                         done();
//                     })
//                 })

//                 // it("should not raise error on Date string input given as unix timestamp", function(done){
//                 //   var query = {date: "1345490073000"};
//                 //   var request = createRequestObject(query, route);

//                 //   Validation.query(request, function(err){
//                 //     should.not.exist(err);
//                 //     done();
//                 //   })
//                 // })

//                 it("should raise on Date string input as invalid string", function (done) {
//                     var query = { date: "worldofwalmartlabs" };
//                     var request = createRequestObject(query, route);

//                     Validation.query(request, function (err) {
//                         should.exist(err);
//                         done();
//                     })
//                 })
//             })

//             describe("#with", function () {
//                 var route = { method: 'GET', path: '/', config: { handler: OhaiHandler, query: { username: S().with("password"), password: S() } } };

//                 it('should not return error if `with` parameter included', function (done) {
//                     var query = { username: "walmart", password: "worldofwalmartlabs" };
//                     var request = createRequestObject(query, route);

//                     Validation.query(request, function (err) {
//                         should.not.exist(err);
//                         done();
//                     })
//                 })

//                 it('should return error if `with` parameter not included', function (done) {
//                     var query = { username: "walmart" };
//                     var request = createRequestObject(query, route);

//                     Validation.query(request, function (err) {
//                         should.exist(err);
//                         done();
//                     })
//                 })
//             })

//             describe("#without", function () {
//                 var route = { method: 'GET', path: '/', config: { handler: OhaiHandler, query: { username: S().without("password") } } };

//                 it('should not return error if `without` parameter not included', function (done) {
//                     var query = { username: "walmart" };
//                     var request = createRequestObject(query, route);

//                     Validation.query(request, function (err) {
//                         should.not.exist(err);
//                         done();
//                     })
//                 })

//                 it('should return error if `without` parameter included', function (done) {
//                     var query = { username: "walmart", password: "worldofwalmartlabs" };
//                     var request = createRequestObject(query, route);

//                     Validation.query(request, function (err) {
//                         should.exist(err);
//                         done();
//                     })
//                 })
//             })

//             describe("#valid", function () {
//                 var route = { method: 'GET', path: '/', config: { handler: OhaiHandler, query: { color: S().valid("blue", "orange", "white") } } };

//                 it('should not return error if value in `valid` parameter input', function (done) {
//                     var query = { color: "white" };
//                     var request = createRequestObject(query, route);

//                     Validation.query(request, function (err) {
//                         should.not.exist(err);
//                         done();
//                     })
//                 })

//                 it('should return error if value not in `valid` parameter input', function (done) {
//                     var query = { color: "beige" };
//                     var request = createRequestObject(query, route);

//                     Validation.query(request, function (err) {
//                         should.exist(err);
//                         done();
//                     })
//                 })
//             })

//             describe("#invalid", function () {
//                 var route = { method: 'GET', path: '/', config: { handler: OhaiHandler, query: { color: S().invalid("beige") } } };

//                 it('should not return error if value not in `invalid` parameter input', function (done) {
//                     var query = { color: "white" };
//                     var request = createRequestObject(query, route);

//                     Validation.query(request, function (err) {
//                         should.not.exist(err);
//                         done();
//                     })
//                 })

//                 it('should return error if value in `invalid` parameter input', function (done) {
//                     var query = { color: "beige" };
//                     var request = createRequestObject(query, route);

//                     Validation.query(request, function (err) {
//                         should.exist(err);
//                         done();
//                     })
//                 })
//             })
//         })

//         describe("using Types.Number", function () {
//             describe("#integer", function () {
//                 var route = { method: 'GET', path: '/', config: { handler: OhaiHandler, query: { num: N().integer() } } };

//                 it("should raise error on non-integer input", function (done) {
//                     var query = { num: "1.02" }
//                     var request = createRequestObject(query, route);

//                     Validation.query(request, function (err) {
//                         should.exist(err);
//                         done();
//                     })
//                 })

//                 it("should NOT raise error on integer input", function (done) {
//                     var query = { num: "100" }
//                     var request = createRequestObject(query, route);

//                     Validation.query(request, function (err) {
//                         should.not.exist(err);
//                         done();
//                     })
//                 })
//             })

//             describe("#float", function () {
//                 var route = { method: 'GET', path: '/', config: { handler: OhaiHandler, query: { num: N().float() } } };

//                 it("should raise error on non-float input", function (done) {
//                     var query = { num: "100" }
//                     var request = createRequestObject(query, route);

//                     Validation.query(request, function (err) {
//                         should.exist(err);
//                         done();
//                     })
//                 })

//                 it("should NOT raise error on float input", function (done) {
//                     var query = { num: "1.02" }
//                     var request = createRequestObject(query, route);

//                     Validation.query(request, function (err) {
//                         should.not.exist(err);
//                         done();
//                     })
//                 })
//             })

//             describe("#min", function () {
//                 var route = { method: 'GET', path: '/', config: { handler: OhaiHandler, query: { num: N().min(100) } } };

//                 it("should raise error on input < min", function (done) {
//                     var query = { num: "50" }
//                     var request = createRequestObject(query, route);

//                     Validation.query(request, function (err) {
//                         should.exist(err);
//                         done();
//                     })
//                 })

//                 it("should NOT raise error on input > min", function (done) {
//                     var query = { num: "102000" }
//                     var request = createRequestObject(query, route);

//                     Validation.query(request, function (err) {
//                         should.not.exist(err);
//                         done();
//                     })
//                 })

//                 it("should NOT raise error on input == min", function (done) {
//                     var query = { num: "100" }
//                     var request = createRequestObject(query, route);

//                     Validation.query(request, function (err) {
//                         should.not.exist(err);
//                         done();
//                     })
//                 })
//             })

//             describe("#max", function () {
//                 var route = { method: 'GET', path: '/', config: { handler: OhaiHandler, query: { num: N().max(100) } } };

//                 it("should raise error on input > max", function (done) {
//                     var query = { num: "120000" }
//                     var request = createRequestObject(query, route);

//                     Validation.query(request, function (err) {
//                         should.exist(err);
//                         done();
//                     })
//                 })

//                 it("should NOT raise error on input < max", function (done) {
//                     var query = { num: "50" }
//                     var request = createRequestObject(query, route);

//                     Validation.query(request, function (err) {
//                         should.not.exist(err);
//                         done();
//                     })
//                 })

//                 it("should NOT raise error on input == max", function (done) {
//                     var query = { num: "100" }
//                     var request = createRequestObject(query, route);

//                     Validation.query(request, function (err) {
//                         should.not.exist(err);
//                         done();
//                     })
//                 })
//             })

//             describe("#min & #max", function () {
//                 var route = { method: 'GET', path: '/', config: { handler: OhaiHandler, query: { num: N().min(50).max(100) } } };

//                 it("should raise error on input > max", function (done) {
//                     var query = { num: "120000" }
//                     var request = createRequestObject(query, route);

//                     Validation.query(request, function (err) {
//                         should.exist(err);
//                         done();
//                     })
//                 })

//                 it("should raise error on input < min", function (done) {
//                     var query = { num: "25" }
//                     var request = createRequestObject(query, route);

//                     Validation.query(request, function (err) {
//                         should.exist(err);
//                         done();
//                     })
//                 })

//                 it("should NOT raise error on min < input < max", function (done) {
//                     var query = { num: "75" }
//                     var request = createRequestObject(query, route);

//                     Validation.query(request, function (err) {
//                         should.not.exist(err);
//                         done();
//                     })
//                 })
//             })
//         })

//         describe("using Types.Boolean", function () {
//             //   describe("#integer", function(){
//             //     var route = {method: 'GET', path: '/', handler: OhaiHandler, query: {num: N().integer()}};

//             //     it("should raise error on non-integer input", function(done){
//             //       var query = {num: "1.02"}
//             //       var request = createRequestObject(query, route);

//             //       Validation.query(request, function(err){
//             //         should.exist(err);
//             //         done();
//             //       })
//             //     })
//             //   })
//         })

//         describe("using Types.Object", function () {

//         })
//     })
// })