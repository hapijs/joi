'use strict';

const RFC3986 = require('./rfc3986');


const internals = {
    Ip: {
        cidrs: {
            ipv4: {
                required: '\\/(?:' + RFC3986.ipv4Cidr + ')',
                optional: '(?:\\/(?:' + RFC3986.ipv4Cidr + '))?',
                forbidden: ''
            },
            ipv6: {
                required: '\\/' + RFC3986.ipv6Cidr,
                optional: '(?:\\/' + RFC3986.ipv6Cidr + ')?',
                forbidden: ''
            },
            ipvfuture: {
                required: '\\/' + RFC3986.ipv6Cidr,
                optional: '(?:\\/' + RFC3986.ipv6Cidr + ')?',
                forbidden: ''
            }
        },
        versions: {
            ipv4: RFC3986.IPv4address,
            ipv6: RFC3986.IPv6address,
            ipvfuture: RFC3986.IPvFuture
        }
    }
};


internals.Ip.createIpRegex = function (versions, cidr) {

    const parts = versions.map((version) => internals.Ip.versions[version] + internals.Ip.cidrs[version][cidr]);
    return new RegExp('^(?:' + parts.join('|') + ')$');
};


module.exports = internals.Ip;
