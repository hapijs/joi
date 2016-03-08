'use strict';

// Load modules

const Hoek = require('hoek');


// Declare internals

const internals = {};


exports.create = function (key, options) {

    Hoek.assert(typeof key === 'string', 'Invalid reference key:', key);

    const settings = Hoek.clone(options);         // options can be reused and modified

    let ref = function (value, validationOptions) {

        return Hoek.reach(ref.isContext ? validationOptions.context : value, ref.key, settings);
    };

    if (options && options.defaultFor) {
        Hoek.assert(Array.isArray(options.defaultFor), 'defaultFor must be an array');

        const oldRef = ref;

        ref = function (value, validationOptions) {

            const result = oldRef(value, validationOptions);

            if (result !== settings.default && settings.defaultFor.indexOf(result) !== -1) {
                return Hoek.clone(settings.default);
            }

            return result;
        };
    }

    ref.isContext = (key[0] === ((settings && settings.contextPrefix) || '$'));
    ref.key = (ref.isContext ? key.slice(1) : key);
    ref.path = ref.key.split((settings && settings.separator) || '.');
    ref.depth = ref.path.length;
    ref.root = ref.path[0];
    ref.settings = settings;
    ref.isJoi = true;

    ref.toString = function () {

        return (ref.isContext ? 'context:' : 'ref:') + ref.key;
    };

    return ref;
};


exports.isRef = function (ref) {

    return typeof ref === 'function' && ref.isJoi;
};


exports.push = function (array, ref) {

    if (exports.isRef(ref) &&
        !ref.isContext) {

        array.push(ref.root);
    }
};
