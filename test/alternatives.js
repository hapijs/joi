// Load modules

var Lab = require('lab');
var Alternatives = require('../lib/alternatives');


// Declare internals

var internals = {};


// Test shortcuts

var expect = Lab.expect;
var before = Lab.before;
var after = Lab.after;
var describe = Lab.experiment;
var it = Lab.test;


describe('Types', function () {

    describe('Alternatives', function () {

        it('throws when missing alternatives', function (done) {

            expect(function () {

                new Alternatives();
            }).to.throw('Missing alternatives');
            done();
        });
    });
});
