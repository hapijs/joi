'use strict';


const internals = {
    isoDate: /^(?:[-+]\d{2})?(?:\d{4}(?!\d{2}\b))(?:(-?)(?:(?:0[1-9]|1[0-2])(?:\1(?:[12]\d|0[1-9]|3[01]))?|W(?:[0-4]\d|5[0-2])(?:-?[1-7])?|(?:00[1-9]|0[1-9]\d|[12]\d{2}|3(?:[0-5]\d|6[1-6])))(?![T]$|[T][\d]+Z$)(?:[T\s](?:(?:(?:[01]\d|2[0-3])(?:(:?)[0-5]\d)?|24\:?00)(?:[.,]\d+(?!:))?)(?:\2[0-5]\d(?:[.,]\d+)?)?(?:[Z]|(?:[+-])(?:[01]\d|2[0-3])(?::?[0-5]\d)?)?)?)?$/,
    maxJs: 100e6 * 24 * 60 * 60 * 1000,        // 100 million days in ms (ECMA-262 §21.4.1.1)
    maxUnix: 100e6 * 24 * 60 * 60              // 100 million days in seconds
};


exports.emit = function (schema, res) {

    const format = schema._flags.format;

    if (format === 'javascript') {
        res.type = 'number';
        res.minimum = -internals.maxJs;
        res.maximum = internals.maxJs;
        return res;
    }

    if (format === 'unix') {
        res.type = 'number';
        res.minimum = -internals.maxUnix;
        res.maximum = internals.maxUnix;
        return res;
    }

    if (format === 'iso') {
        res.type = 'string';
        res.pattern = exports.isoPattern();
        return res;
    }

    res.type = ['string', 'number'];
    res.format = 'date-time';
    res.minimum = -internals.maxJs;
    res.maximum = internals.maxJs;

    return res;
};


exports.appendConstraint = function (res, name, date) {

    if (date instanceof Date) {
        res['x-constraint'] = { ...res['x-constraint'], [name]: date.toISOString() };
    }

    return res;
};


exports.isoPattern = function () {

    return internals.isoDate.source.replace(/\\:/g, ':');
};
