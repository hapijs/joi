'use strict';

const Common = require('./common');


const internals = {};


module.exports = internals.Values = class {

    constructor(from) {

        this._set = new Set(from);
        this._resolve = false;
    }

    get length() {

        return this._set.size;
    }

    add(value, refs) {

        if (this.has(value, null, null, false)) {
            return;
        }

        if (refs !== undefined) {       // If it's a merge, we don't have any refs
            refs.register(value);
        }

        this._set.add(value);

        if (Common.isResolvable(value)) {
            this._resolve = true;
        }
    }

    static merge(target, add, remove) {

        target = target || new internals.Values();

        if (add) {
            for (const item of add._set) {
                target.add(item);
            }
        }

        if (remove) {
            for (const item of remove._set) {
                target.remove(item);
            }
        }

        return target.length ? target : null;
    }

    remove(value) {

        this._set.delete(value);
    }

    has(value, state, prefs, insensitive) {

        return !!this.get(value, state, prefs, insensitive);
    }

    get(value, state, prefs, insensitive) {

        if (!this._set.size) {
            return false;
        }

        const hasValue = this._set.has(value);
        if (hasValue) {
            return { value };
        }

        if (!this._resolve &&
            !insensitive &&
            typeof value !== 'object') {

            return false;
        }

        const extendedCheck = internals.extendedCheckForValue(value, insensitive);
        if (!extendedCheck) {
            if (state &&
                this._resolve) {

                for (let item of this._set) {
                    if (Common.isResolvable(item)) {
                        item = [].concat(item.resolve(value, state, prefs));
                        const found = item.indexOf(value);
                        if (found >= 0) {
                            return { value: item[found] };
                        }
                    }
                }
            }

            return false;
        }

        return this._has(value, state, prefs, extendedCheck);
    }

    _has(value, state, prefs, check) {

        const checkRef = !!(state && this._resolve);

        const isReallyEqual = function (item) {

            if (value === item) {
                return true;
            }

            return check(item);
        };

        for (let item of this._set) {
            if (checkRef &&
                Common.isResolvable(item)) {                // Only resolve references if there is a state, otherwise it's a merge

                item = item.resolve(value, state, prefs);

                if (Array.isArray(item)) {
                    const found = item.findIndex(isReallyEqual);
                    if (found >= 0) {
                        return {
                            value: item[found]
                        };
                    }

                    continue;
                }
            }

            if (isReallyEqual(item)) {
                return {
                    value: item
                };
            }
        }

        return false;
    }

    values(options) {

        if (options &&
            options.stripUndefined) {

            const values = [];

            for (const item of this._set) {
                if (item !== undefined) {
                    values.push(item);
                }
            }

            return values;
        }

        return Array.from(this._set);
    }

    clone() {

        const set = new internals.Values(this._set);
        set._resolve = this._resolve;
        return set;
    }

    concat(source) {

        const set = new internals.Values([...this._set, ...source._set]);
        set._resolve = this._resolve || source._resolve;
        return set;
    }

    describe() {

        const normalized = [];
        for (const value of this._set.values()) {
            normalized.push(Common.isResolvable(value) ? value.describe() : (value && typeof value === 'object' ? { value } : value));
        }

        return normalized;
    }
};


internals.Values.prototype[Common.symbols.values] = true;


// Aliases

internals.Values.prototype.slice = internals.Values.prototype.clone;



internals.extendedCheckForValue = function (value, insensitive) {

    const valueType = typeof value;

    if (valueType === 'object') {
        if (value instanceof Date) {
            return (item) => {

                return item instanceof Date && value.getTime() === item.getTime();
            };
        }

        if (Buffer.isBuffer(value)) {
            return (item) => {

                return Buffer.isBuffer(item) && value.length === item.length && value.toString('binary') === item.toString('binary');
            };
        }
    }
    else if (insensitive && valueType === 'string') {
        const lowercaseValue = value.toLowerCase();
        return (item) => {

            return typeof item === 'string' && lowercaseValue === item.toLowerCase();
        };
    }

    return null;
};
