'use strict';

const Hoek = require('@hapi/hoek');

const Ref = require('./ref');


const internals = {};


exports.schema = function (Joi, config, options = {}) {

    if (options.appendPath) {
        return internals.appendPath(Joi, config);
    }

    if (config !== undefined &&
        config !== null &&
        typeof config === 'object') {

        if (config.isJoi) {
            return config;
        }

        if (Array.isArray(config)) {
            return Joi.alternatives().try(config);
        }

        if (config instanceof RegExp) {
            return Joi.string().regex(config);
        }

        if (config instanceof Date) {
            return Joi.date().valid(config);
        }

        return Joi.object().keys(config);
    }

    if (typeof config === 'string') {
        return Joi.string().valid(config);
    }

    if (typeof config === 'number') {
        return Joi.number().valid(config);
    }

    if (typeof config === 'boolean') {
        return Joi.boolean().valid(config);
    }

    if (Ref.isRef(config)) {
        return Joi.valid(config);
    }

    Hoek.assert(config === null, 'Invalid schema content:', config);

    return Joi.valid(null);
};


internals.appendPath = function (Joi, config) {

    try {
        return exports.schema(Joi, config);
    }
    catch (err) {
        if (err.path !== undefined) {
            err.message = `${err.message}(${err.path})`;
        }

        throw err;
    }
};


exports.ref = function (id) {

    return Ref.isRef(id) ? id : Ref.create(id);
};
