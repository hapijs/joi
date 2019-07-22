'use strict';

const Hoek = require('@hapi/hoek');

const Any = require('./any');
const Cast = require('../cast');
const Common = require('../common');


const internals = {};


internals.Link = class extends Any {

    constructor() {

        super('link');
    }

    _init(ref) {

        if (ref) {
            return this.ref(ref);
        }

        return this;
    }

    _base(value, state, prefs) {

        if (!this._inners.link) {
            return { value, errors: this.createError('link.uninitialized', value, null, state, prefs) };
        }

        const ref = this._inners.link[0].ref;
        const perspective = state.schemas[ref.ancestor];
        if (!perspective) {
            return { value, errors: this.createError('link.depth', value, { ref }, state, prefs) };
        }

        try {
            var schema = ref.path.length ? perspective._ids.reach(ref.path) : perspective;
        }
        catch (err) {
            return { value, errors: this.createError('link.ref', value, { ref }, state, prefs) };
        }

        if (schema._type === 'link') {
            return { value, errors: this.createError('link.loop', value, { ref }, state, prefs) };
        }

        return schema._validate(value, state, prefs);
    }

    // Rules

    ref(ref) {

        Hoek.assert(!this._inners.link, 'Cannot reinitialize schema');

        ref = Cast.ref(ref);

        Hoek.assert(ref.type === 'value', 'Invalid reference type');
        Hoek.assert(ref.ancestor > 0, 'Link cannot reference itself');

        const obj = this.clone();
        obj._inners.link = [{ ref }];
        return obj;
    }

    // Helpers

    concat(source) {

        Hoek.assert(this._inners.link, 'Uninitialized link schema');
        Hoek.assert(Common.isSchema(source), 'Invalid schema object');
        Hoek.assert(source._type === 'any', 'Cannot merge type link with another type:', source._type);

        return super.concat(source);
    }

    when(...args) {

        Hoek.assert(this._inners.link, 'Uninitialized link schema');

        const ref = this._inners.link[0].ref.clone();
        ++ref.ancestor;
        ref.updateDisplay();

        const obj = this.clone();
        obj._inners.link = [{ ref }];
        return super.when.call(obj, ...args);
    }
};


// Aliases

Common.alias(internals.Link, [

]);


// Casts

Common.extend(internals.Link, 'casts', {

});


// Rules

Common.extend(internals.Link, 'rules', {

});


module.exports = new internals.Link();
