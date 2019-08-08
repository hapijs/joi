'use strict';

const Keys = require('./keys');


const internals = {};


module.exports = Keys.extend({

    type: 'object',

    // Cast

    cast: {
        map: {
            from: (value) => value && typeof value === 'object',
            to: function (value, helpers) {

                return new Map(Object.entries(value));
            }
        }
    }
});
