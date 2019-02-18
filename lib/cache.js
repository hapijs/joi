'use strict';

const caches = {};

class Cache {
    constructor(params = {}) {

        const {
            identifier,
            type = 'string'
        } = params;

        this.data = {};
        this.params = {
            type,
            identifier
        };
    }

    get(key) {

        const accessor = this.stringify(key);
        if (!accessor) {
            return;
        }

        return this.data[accessor];
    }
    set(key, value) {

        const accessor = this.stringify(key);
        if (!accessor) {
            return;
        }

        this.data[accessor] = value;
    }
    del(key) {

        const accessor = this.stringify(key);
        if (!accessor) {
            return;
        }

        return delete this.data[accessor];
    }
    stringify(key) {

        if (typeof key !== this.params.type) {
            return false;
        }

        return stringify(key);
    }
}

const createIdentifier = function (params) {

    return `${params.type}_${params.identifier}`;
};

const findOrGenerate = function (params) {

    const identifier = createIdentifier(params);
    let cache = caches[identifier];
    if (!cache) {
        cache = new Cache(params);
        caches[identifier] = cache;
    }

    return cache;
};

const stringify = function (o) {

    const objectToString = Object.prototype.toString;
    const type = typeof o;
    if (type === 'string') {
        return '"' + o + '"';
    }
    else if (type === 'number') {
        return o + '';
    }
    else if (type === 'object') {
        let tmp = objectToString.call(o);
        if (tmp === '[object Object]') {
            tmp = '{';
            for (const k in o) {
                tmp += '"' + k + '":' + stringify(o[k]) + ',';
            }

            tmp = tmp.slice(0, -1) + '}';
            return tmp;
        }
        else if (tmp === '[object Array]') {
            const list = [];
            let k = o.length;
            while (k--) {
                list[k] = stringify(o[k]);
            }

            return '[' + list.join(',') + ']';
        }
    }

    return o + '';
};

module.exports = {
    Cache,
    stringify,
    findOrGenerate
};
