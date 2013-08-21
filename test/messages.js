// Load modules

var Lab = require('lab');
var Messages = require('../lib/messages');


// Declare internals

var internals = {};


// Test shortcuts

var expect = Lab.expect;
var before = Lab.before;
var after = Lab.after;
var describe = Lab.experiment;
var it = Lab.test;


describe('Messages', function () {

    it('should throw when a language resource file is not found', function (done) {

        var fn = function () {
            var messages = new Messages({ languagePath: 'something' });
        };

        expect(fn).to.throw();
        done();
    });

    it('should default to en-US language', function (done) {

        var fn = function () {
            var messages = new Messages();
        };

        expect(fn).to.not.throw();
        done();
    });

    describe('#print', function () {

        it('should return undefined when a language resource chain is not found', function (done) {

            var messages = new Messages();
            var result = messages.print('something');

            expect(result).to.not.exist;
            done();
        });

        it('should return formatted resource when there are spaces in template', function (done) {

            var messages = new Messages();
            var result = messages.print('number.max', 'my key', {
                value: 'my value'
            });

            expect(result).to.contain('my key');
            expect(result).to.contain('my value');
            done();
        });
    });
});