'use strict';

// Load Modules

const RFC3986 = require('./rfc3986');


// Declare internals

const internals = {
    Host: {
        createHostRegex: function () {

            const host = RFC3986.host;

            /**
             * host = IP-literal / IPv4address / reg-name
             */
            return new RegExp('^' + host + '$');
        }
    }
};


module.exports = internals.Host;
