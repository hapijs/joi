'use strict';

// Load modules

const Hoek = require('hoek');


// Declare internals

const internals = {};


exports.create = function (key, options) {

    Hoek.assert(typeof key === 'string', 'Invalid reference key:', key);

    const settings = options ? Hoek.clone(options) : {};        // options can be reused and modified

    const ref = function (value, ancestors, validationOptions) {

        Hoek.assert(!settings.ancestor || settings.ancestor <= ancestors.length, 'Invalid reference exceeds the schema root:', ref.display);

        const target = ref.isContext ? validationOptions.context : (settings.ancestor ? ancestors[settings.ancestor - 1] : value);
        return Hoek.reach(target, ref.key, settings);
    };

    const contextPrefix = settings.contextPrefix || '$';
    const separator = settings.separator || '.';

    ref.isContext = (key[0] === contextPrefix);
    if (ref.isContext) {
        key = key.slice(1);
        ref.display = `context:${key}`;
    }
    else {
        if (settings.ancestor !== undefined) {
            Hoek.assert(key[0] !== separator, 'Cannot combine prefix with ancestor option');
        }
        else {
            const [ancestor, slice] = internals.ancestor(key, separator);
            if (slice) {
                key = key.slice(slice);
            }

            settings.ancestor = ancestor;
        }

        ref.display = internals.display(key, separator, settings.ancestor);
    }

    ref.key = key;
    ref.ancestor = settings.ancestor;
    ref.path = ref.key.split(separator);
    ref.depth = ref.path.length;
    ref.root = ref.path[0];
    ref.isJoi = true;
    ref.toString = () => ref.display;

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


internals.ancestor = function (key, separator) {

    if (key[0] !== separator) {     // 'a.b' -> 1 (parent)
        return [1, 0];
    }

    if (key[1] !== separator) {     // '.a.b' -> 0 (self)
        return [0, 1];
    }

    let i = 2;
    while (key[i] === separator) {
        ++i;
    }

    return [i - 1, i];              // '...a.b.' -> 2 (grandparent)
};


internals.display = function (key, separator, ancestor) {

    if (!ancestor) {
        return `ref:${separator}${key}`;
    }

    if (ancestor === 1) {
        return `ref:${key}`;
    }

    return `ref:${new Array(3).fill('.').join('')}${key}`;
};
