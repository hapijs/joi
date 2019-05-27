'use strict';

const Hoek = require('@hapi/hoek');


const internals = {};


exports.create = function (key, options) {

    Hoek.assert(typeof key === 'string', 'Invalid reference key:', key);

    const settings = options ? Hoek.clone(options) : {};        // options can be reused and modified

    const ref = function (parent, value, validationOptions) {

        const target = ref.isContext ? validationOptions.context : (settings.self ? value : parent);
        return Hoek.reach(target, ref.key, settings);
    };

    const contextPrefix = settings.contextPrefix || '$';
    const separator = settings.separator || '.';

    ref.isContext = (key[0] === contextPrefix);
    if (!ref.isContext &&
        key[0] === separator) {

        key = key.slice(1);
        settings.self = true;
    }

    ref.key = (ref.isContext ? key.slice(1) : key);
    ref.path = ref.key.split(separator);
    ref.depth = ref.path.length;
    ref.root = ref.path[0];
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
