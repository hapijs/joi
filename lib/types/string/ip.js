'use strict';

const Uri = require('./uri');


const internals = {};


exports.cidrs = {
    ipv4: {
        required: '\\/(?:' + Uri.ipv4Cidr + ')',
        optional: '(?:\\/(?:' + Uri.ipv4Cidr + '))?',
        forbidden: ''
    },
    ipv6: {
        required: '\\/' + Uri.ipv6Cidr,
        optional: '(?:\\/' + Uri.ipv6Cidr + ')?',
        forbidden: ''
    },
    ipvfuture: {
        required: '\\/' + Uri.ipv6Cidr,
        optional: '(?:\\/' + Uri.ipv6Cidr + ')?',
        forbidden: ''
    }
};


exports.versions = {
    ipv4: Uri.ipv4address,
    ipv6: Uri.ipv6address,
    ipvfuture: Uri.ipvFuture
};


exports.createIpRegex = function (versions, cidr) {

    const parts = versions.map((version) => exports.versions[version] + exports.cidrs[version][cidr]);
    return new RegExp('^(?:' + parts.join('|') + ')$');
};
