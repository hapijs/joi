'use strict';

const Ref = require('./ref');

module.exports = class InternalSet {

    constructor(from) {

        this._set = new Set(from);
    }

    add(value, refs) {

        if (!Ref.isRef(value) && this.has(value, null, null, false)) {

            return this;
        }

        if (refs !== undefined) { // If it's a merge, we don't have any refs
            Ref.push(refs, value);
        }

        this._set.add(value);
        return this;
    }

    merge(add, remove) {

        for (const item of add._set) {
            this.add(item);
        }

        for (const item of remove._set) {
            this.remove(item);
        }

        return this;
    }

    remove(value) {

        this._set.delete(value);
        return this;
    }

    has(value, state, options, insensitive) {

        const isSimpleValue = !(value instanceof Date) && !(insensitive && typeof value === 'string') && !Buffer.isBuffer(value);
        if (!state && isSimpleValue) {
            return this._set.has(value);
        }

        for (let items of this._set) {
            if (state && Ref.isRef(items)) { // Only resolve references if there is a state, otherwise it's a merge
                items = items(state.reference || state.parent, options);
            }

            if (!Array.isArray(items)) {
                items = [items];
            }

            for (const item of items) {
                if (typeof value !== typeof item) {
                    continue;
                }

                if (value === item ||
                    (value instanceof Date && item instanceof Date && value.getTime() === item.getTime()) ||
                    (insensitive && typeof value === 'string' && value.toLowerCase() === item.toLowerCase()) ||
                    (Buffer.isBuffer(value) && Buffer.isBuffer(item) && value.length === item.length && value.toString('binary') === item.toString('binary'))) {

                    return true;
                }
            }
        }

        return false;
    }

    values(options) {

        if (options && options.stripUndefined) {
            const values = [];

            for (const item of this._set) {
                if (item !== undefined) {
                    values.push(item);
                }
            }

            return values;
        }

        return [...this._set];
    }

    slice() {

        return new InternalSet(this._set);
    }

    concat(source) {

        return new InternalSet([...this._set, ...source._set]);
    }
};
