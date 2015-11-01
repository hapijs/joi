'use strict';

// Load modules

const Code = require('code');
const Joi = require('../');


// Declare internals

const internals = {};


// Test shortcuts

const expect = Code.expect;


exports.validate = function (schema, config, callback) {

    return exports.validateOptions(schema, config, null, callback);
};


exports.validateOptions = function (schema, config, options, callback) {

    const compiled = Joi.compile(schema);
    for (let i = 0; i < config.length; ++i) {

        const item = config[i];
        const result = Joi.validate(item[0], compiled, item[2] || options);

        const err = result.error;
        const value = result.value;

        if (err !== null && item[1]) {
            console.log(err);
        }

        if (err === null && !item[1]) {
            console.log(item[0]);
        }

        expect(err === null).to.equal(item[1]);

        if (item.length >= 4) {
            const comparator = item[3];
            if (item[1]) {
                expect(value).to.deep.equal(comparator);
            }
            else {
                if (comparator instanceof RegExp) {
                    expect(err.message).to.match(comparator);
                }
                else {
                    expect(err.message).to.deep.equal(comparator);
                }
            }
        }
    }

    if (callback) {
        callback();
    }
};
