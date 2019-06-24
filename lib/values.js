'use strict';

const Common = require('./common');


const internals = {};


module.exports = internals.Values = class {

    constructor(from) {

        this._set = new Set(from);
        this._hasRef = false;
    }

    get length() {

        return this._set.size;
    }

    add(value, refs) {

        const isRef = Common.isResolvable(value);
        if (!isRef &&
            this.has(value, null, null, false)) {

            return this;
        }

        if (refs !== undefined) {       // If it's a merge, we don't have any refs
            refs.register(value);
        }

        this._set.add(value);

        if (isRef) {
            this._hasRef = true;
        }

        return this;
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
        return this;
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

        const extendedCheck = internals.extendedCheckForValue(value, insensitive);
        if (!extendedCheck) {
            if (state &&
                this._hasRef) {

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

        const checkRef = !!(state && this._hasRef);

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
        set._hasRef = this._hasRef;
        return set;
    }

    concat(source) {

        const set = new internals.Values([...this._set, ...source._set]);
        set._hasRef = this._hasRef || source._hasRef;
        return set;
    }
};


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
