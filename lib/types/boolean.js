'use strict';

const Hoek = require('@hapi/hoek');

const Any = require('./any');
const Common = require('../common');
const Values = require('../values');


const internals = {};


internals.Boolean = class extends Any {

    constructor() {

        super('boolean');

        this._flags.insensitive = true;
        this._inners.truthy = new Values();
        this._inners.falsy = new Values();
    }

    _coerce(value, state, prefs) {

        if (typeof value === 'boolean') {
            return;
        }

        if (typeof value === 'string') {
            const normalized = this._flags.insensitive ? value.toLowerCase() : value;
            value = normalized === 'true' ? true : (normalized === 'false' ? false : value);
        }

        if (typeof value !== 'boolean') {
            value = this._inners.truthy.has(value, null, null, this._flags.insensitive) ||
                (this._inners.falsy.has(value, null, null, this._flags.insensitive) ? false : value);
        }

        return { value };
    }

    _base(value, state, prefs) {

        if (typeof value !== 'boolean') {
            return { value, errors: this.createError('boolean.base', value, null, state, prefs) };
        }
    }

    _build(desc) {

        let obj = this;                                     // eslint-disable-line consistent-this

        if (desc.truthy) {
            obj = obj.truthy(...desc.truthy);
        }

        if (desc.falsy) {
            obj = obj.falsy(...desc.falsy);
        }

        return obj;
    }

    // Rules

    truthy(...values) {

        Common.verifyFlat(values, 'truthy');

        const obj = this.clone();
        for (let i = 0; i < values.length; ++i) {
            const value = values[i];

            Hoek.assert(value !== undefined, 'Cannot call truthy with undefined');
            obj._inners.truthy.add(value);
        }

        return obj;
    }

    falsy(...values) {

        Common.verifyFlat(values, 'falsy');

        const obj = this.clone();
        for (let i = 0; i < values.length; ++i) {
            const value = values[i];

            Hoek.assert(value !== undefined, 'Cannot call falsy with undefined');
            obj._inners.falsy.add(value);
        }

        return obj;
    }

    insensitive(enabled) {

        return this._flag('insensitive', enabled !== false);
    }
};


// Aliases

Common.alias(internals.Boolean, [

]);


// Casts

Common.extend(internals.Boolean, 'casts', {

    [Common.symbols.castFrom]: (value) => typeof value === 'boolean',

    number: function (value) {

        return value ? 1 : 0;
    },

    string: function (value, options) {

        return value ? 'true' : 'false';
    }
});


// Rules

Common.extend(internals.Boolean, 'rules', {

});


module.exports = new internals.Boolean();
