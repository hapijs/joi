'use strict';

const utils = {};

/**
 * method to check for nested key pattern in an object.
 * Reference: https://stackoverflow.com/questions/2631001/test-for-existence-of-nested-javascript-object-key/24327152#24327152
 *
 * @param {object} obj         Object to examine
 * @param {Array}  keys        nested keys to check in the object
 * @returns                    boolean to represent keys existence
 */
utils.objHasKeys = function (obj, keys) {

    const next = keys.shift();
    return obj[next] && (!keys.length || utils.objHasKeys(obj[next], keys));
};

module.exports = utils;
