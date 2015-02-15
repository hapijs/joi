// Load modules

var Net = require('net');
var Hoek = require('hoek');
var Isemail = require('isemail');
var Any = require('./any');
var Errors = require('./errors');

// Declare internals

var internals = {};


internals.String = function () {

    Any.call(this);
    this._type = 'string';
    this._invalids.add('');
};

Hoek.inherits(internals.String, Any);


internals.String.prototype._base = function (value, state, options) {

    if (typeof value === 'string' &&
        options.convert) {

        if (this._flags.case) {
            value = (this._flags.case === 'upper' ? value.toLocaleUpperCase() : value.toLocaleLowerCase());
        }

        if (this._flags.trim) {
            value = value.trim();
        }
    }

    return {
        value: value,
        errors: (typeof value === 'string') ? null : Errors.create('string.base', null, state, options)
    };
};


internals.String.prototype.insensitive = function () {

    var obj = this.clone();
    obj._flags.insensitive = true;
    return obj;
};


internals.String.prototype.min = function (limit, encoding) {

    Hoek.assert(Hoek.isInteger(limit) && limit >= 0, 'limit must be a positive integer');
    Hoek.assert(!encoding || Buffer.isEncoding(encoding), 'Invalid encoding:', encoding);

    return this._test('min', limit, function (value, state, options) {

        var length = encoding ? Buffer.byteLength(value, encoding) : value.length;
        if (length >= limit) {
            return null;
        }

        return Errors.create('string.min', { limit: limit }, state, options);
    });
};


internals.String.prototype.max = function (limit, encoding) {

    Hoek.assert(Hoek.isInteger(limit) && limit >= 0, 'limit must be a positive integer');
    Hoek.assert(!encoding || Buffer.isEncoding(encoding), 'Invalid encoding:', encoding);

    return this._test('max', limit, function (value, state, options) {

        var length = encoding ? Buffer.byteLength(value, encoding) : value.length;
        if (length <= limit) {
            return null;
        }

        return Errors.create('string.max', { limit: limit }, state, options);
    });
};


internals.String.prototype.length = function (limit, encoding) {

    Hoek.assert(Hoek.isInteger(limit) && limit >= 0, 'limit must be a positive integer');
    Hoek.assert(!encoding || Buffer.isEncoding(encoding), 'Invalid encoding:', encoding);

    return this._test('length', limit, function (value, state, options) {

        var length = encoding ? Buffer.byteLength(value, encoding) : value.length;
        if (length === limit) {
            return null;
        }

        return Errors.create('string.length', { limit: limit }, state, options);
    });
};


internals.String.prototype.regex = function (pattern) {

    Hoek.assert(pattern instanceof RegExp, 'pattern must be a RegExp');

    pattern = new RegExp(pattern.source, pattern.ignoreCase ? 'i' : undefined);         // Future version should break this and forbid unsupported regex flags

    return this._test('regex', pattern, function (value, state, options) {

        if (pattern.test(value)) {
            return null;
        }

        return Errors.create('string.regex', null, state, options);
    });
};


internals.String.prototype.alphanum = function () {

    return this._test('alphanum', undefined, function (value, state, options) {

        if (/^[a-zA-Z0-9]+$/.test(value)) {
            return null;
        }

        return Errors.create('string.alphanum', null, state, options);
    });
};


internals.String.prototype.token = function () {

    return this._test('token', undefined, function (value, state, options) {

        if (/^\w+$/.test(value)) {
            return null;
        }

        return Errors.create('string.token', null, state, options);
    });
};


internals.String.prototype.email = function () {

    return this._test('email', undefined, function (value, state, options) {

        if (Isemail(value)) {
            return null;
        }

        return Errors.create('string.email', null, state, options);
    });
};


internals.String.prototype.uri = function () {
    /**
     *
     * `^[a-zA-Z][a-zA-Z0-9+\.-]*:` captures the scheme being used. A scheme has to begin
     * with a letter than it can be followed by letters, digits, plus ("+"), period ("."), or hyphen ("-").
     *
     * `(([\//]{2}[\//]?)|(?=[^/]))([a-zA-Z0-9-\._~%0-9A-F!$&'()*+,;=:]*@)?(\[(((([0-9A-F]){1,4}:){6}(([0-9A-F]){1,4}:([0-9A-F]){1,4}|((0?0?[0-9]|0?[1-9][0-9]|1[0-9][0-9]|2[0-4][0-9]|25[0-5])\.){3}(0?0?[0-9]|0?[1-9][0-9]|1[0-9][0-9]|2[0-4][0-9]|25[0-5]))|::(([0-9A-F]){1,4}:){5}(([0-9A-F]){1,4}:([0-9A-F]){1,4}|((0?0?[0-9]|0?[1-9][0-9]|1[0-9][0-9]|2[0-4][0-9]|25[0-5])\.){3}(0?0?[0-9]|0?[1-9][0-9]|1[0-9][0-9]|2[0-4][0-9]|25[0-5]))|([0-9A-F]){1,4}::(([0-9A-F]){1,4}:){4}(([0-9A-F]){1,4}:([0-9A-F]){1,4}|((0?0?[0-9]|0?[1-9][0-9]|1[0-9][0-9]|2[0-4][0-9]|25[0-5])\.){3}(0?0?[0-9]|0?[1-9][0-9]|1[0-9][0-9]|2[0-4][0-9]|25[0-5]))|(([0-9A-F]){1,4}:){0,1}([0-9A-F]){1,4}::(([0-9A-F]){1,4}:){3}(([0-9A-F]){1,4}:([0-9A-F]){1,4}|((0?0?[0-9]|0?[1-9][0-9]|1[0-9][0-9]|2[0-4][0-9]|25[0-5])\.){3}(0?0?[0-9]|0?[1-9][0-9]|1[0-9][0-9]|2[0-4][0-9]|25[0-5]))|(([0-9A-F]){1,4}:){0,2}([0-9A-F]){1,4}::(([0-9A-F]){1,4}:){2}(([0-9A-F]){1,4}:([0-9A-F]){1,4}|((0?0?[0-9]|0?[1-9][0-9]|1[0-9][0-9]|2[0-4][0-9]|25[0-5])\.){3}(0?0?[0-9]|0?[1-9][0-9]|1[0-9][0-9]|2[0-4][0-9]|25[0-5]))|(([0-9A-F]){1,4}:){0,3}([0-9A-F]){1,4}::([0-9A-F]){1,4}:(([0-9A-F]){1,4}:([0-9A-F]){1,4}|((0?0?[0-9]|0?[1-9][0-9]|1[0-9][0-9]|2[0-4][0-9]|25[0-5])\.){3}(0?0?[0-9]|0?[1-9][0-9]|1[0-9][0-9]|2[0-4][0-9]|25[0-5]))|(([0-9A-F]){1,4}:){0,4}([0-9A-F]){1,4}::(([0-9A-F]){1,4}:([0-9A-F]){1,4}|((0?0?[0-9]|0?[1-9][0-9]|1[0-9][0-9]|2[0-4][0-9]|25[0-5])\.){3}(0?0?[0-9]|0?[1-9][0-9]|1[0-9][0-9]|2[0-4][0-9]|25[0-5]))|(([0-9A-F]){1,4}:){0,5}([0-9A-F]){1,4}::([0-9A-F]){1,4}|(([0-9A-F]){1,4}:){0,6}([0-9A-F]){1,4}::)|(v[0-9A-F]+\.[a-zA-Z0-9-\._~!$&'()*+,;=:]+))\]|((0?0?[0-9]|0?[1-9][0-9]|1[0-9][0-9]|2[0-4][0-9]|25[0-5])\.){3}(0?0?[0-9]|0?[1-9][0-9]|1[0-9][0-9]|2[0-4][0-9]|25[0-5])|[a-zA-Z0-9-\._~%0-9A-F!$&'()*+,;=]{0,255})(:[0-9]*)?`
     *  is one of the more complicated parts which captures the authority which contains the user info (username/password), host, and port. It's broken down further below:
     *
     * - `(([\\//]{2}[\\//]?)|(?=[^\/]))` captures the preceding double slash and also URIs that have chosen to omit
     *   the double slashes (such as `mailto:`) and also those that omit the host, such as `file:///whatever`.
     *
     * - `([a-zA-Z0-9-\._~%0-9A-F!$&'()*+,;=:]*@)?` captures the user info which can be percent encoded and is in the
     *   format `username:password@` where `@` terminates the info. The entire piece is optional, but if provided the
     *   password is also optional, the `:` should just be omitted if there is no password but there is an username.
     *
     * - `(\[(((([0-9A-F]){1,4}:){6}(([0-9A-F]){1,4}:([0-9A-F]){1,4}|((0?0?[0-9]|0?[1-9][0-9]|1[0-9][0-9]|2[0-4][0-9]|25[0-5])\.){3}(0?0?[0-9]|0?[1-9][0-9]|1[0-9][0-9]|2[0-4][0-9]|25[0-5]))|::(([0-9A-F]){1,4}:){5}(([0-9A-F]){1,4}:([0-9A-F]){1,4}|((0?0?[0-9]|0?[1-9][0-9]|1[0-9][0-9]|2[0-4][0-9]|25[0-5])\.){3}(0?0?[0-9]|0?[1-9][0-9]|1[0-9][0-9]|2[0-4][0-9]|25[0-5]))|([0-9A-F]){1,4}::(([0-9A-F]){1,4}:){4}(([0-9A-F]){1,4}:([0-9A-F]){1,4}|((0?0?[0-9]|0?[1-9][0-9]|1[0-9][0-9]|2[0-4][0-9]|25[0-5])\.){3}(0?0?[0-9]|0?[1-9][0-9]|1[0-9][0-9]|2[0-4][0-9]|25[0-5]))|(([0-9A-F]){1,4}:){0,1}([0-9A-F]){1,4}::(([0-9A-F]){1,4}:){3}(([0-9A-F]){1,4}:([0-9A-F]){1,4}|((0?0?[0-9]|0?[1-9][0-9]|1[0-9][0-9]|2[0-4][0-9]|25[0-5])\.){3}(0?0?[0-9]|0?[1-9][0-9]|1[0-9][0-9]|2[0-4][0-9]|25[0-5]))|(([0-9A-F]){1,4}:){0,2}([0-9A-F]){1,4}::(([0-9A-F]){1,4}:){2}(([0-9A-F]){1,4}:([0-9A-F]){1,4}|((0?0?[0-9]|0?[1-9][0-9]|1[0-9][0-9]|2[0-4][0-9]|25[0-5])\.){3}(0?0?[0-9]|0?[1-9][0-9]|1[0-9][0-9]|2[0-4][0-9]|25[0-5]))|(([0-9A-F]){1,4}:){0,3}([0-9A-F]){1,4}::([0-9A-F]){1,4}:(([0-9A-F]){1,4}:([0-9A-F]){1,4}|((0?0?[0-9]|0?[1-9][0-9]|1[0-9][0-9]|2[0-4][0-9]|25[0-5])\.){3}(0?0?[0-9]|0?[1-9][0-9]|1[0-9][0-9]|2[0-4][0-9]|25[0-5]))|(([0-9A-F]){1,4}:){0,4}([0-9A-F]){1,4}::(([0-9A-F]){1,4}:([0-9A-F]){1,4}|((0?0?[0-9]|0?[1-9][0-9]|1[0-9][0-9]|2[0-4][0-9]|25[0-5])\.){3}(0?0?[0-9]|0?[1-9][0-9]|1[0-9][0-9]|2[0-4][0-9]|25[0-5]))|(([0-9A-F]){1,4}:){0,5}([0-9A-F]){1,4}::([0-9A-F]){1,4}|(([0-9A-F]){1,4}:){0,6}([0-9A-F]){1,4}::)|(v[0-9A-F]+\.[a-zA-Z0-9-\._~!$&'()*+,;=:]+))\]|((0?0?[0-9]|0?[1-9][0-9]|1[0-9][0-9]|2[0-4][0-9]|25[0-5])\.){3}(0?0?[0-9]|0?[1-9][0-9]|1[0-9][0-9]|2[0-4][0-9]|25[0-5])|[a-zA-Z0-9-\._~%0-9A-F!$&'()*+,;=]{0,255})` is the complicated part. This identifies the host and handles all formats of IP addresses as well as domain names.
     *
     *  - `\[(((([0-9A-F]){1,4}:){6}(([0-9A-F]){1,4}:([0-9A-F]){1,4}|((0?0?[0-9]|0?[1-9][0-9]|1[0-9][0-9]|2[0-4][0-9]|25[0-5])\.){3}(0?0?[0-9]|0?[1-9][0-9]|1[0-9][0-9]|2[0-4][0-9]|25[0-5]))|::(([0-9A-F]){1,4}:){5}(([0-9A-F]){1,4}:([0-9A-F]){1,4}|((0?0?[0-9]|0?[1-9][0-9]|1[0-9][0-9]|2[0-4][0-9]|25[0-5])\.){3}(0?0?[0-9]|0?[1-9][0-9]|1[0-9][0-9]|2[0-4][0-9]|25[0-5]))|([0-9A-F]){1,4}::(([0-9A-F]){1,4}:){4}(([0-9A-F]){1,4}:([0-9A-F]){1,4}|((0?0?[0-9]|0?[1-9][0-9]|1[0-9][0-9]|2[0-4][0-9]|25[0-5])\.){3}(0?0?[0-9]|0?[1-9][0-9]|1[0-9][0-9]|2[0-4][0-9]|25[0-5]))|(([0-9A-F]){1,4}:){0,1}([0-9A-F]){1,4}::(([0-9A-F]){1,4}:){3}(([0-9A-F]){1,4}:([0-9A-F]){1,4}|((0?0?[0-9]|0?[1-9][0-9]|1[0-9][0-9]|2[0-4][0-9]|25[0-5])\.){3}(0?0?[0-9]|0?[1-9][0-9]|1[0-9][0-9]|2[0-4][0-9]|25[0-5]))|(([0-9A-F]){1,4}:){0,2}([0-9A-F]){1,4}::(([0-9A-F]){1,4}:){2}(([0-9A-F]){1,4}:([0-9A-F]){1,4}|((0?0?[0-9]|0?[1-9][0-9]|1[0-9][0-9]|2[0-4][0-9]|25[0-5])\.){3}(0?0?[0-9]|0?[1-9][0-9]|1[0-9][0-9]|2[0-4][0-9]|25[0-5]))|(([0-9A-F]){1,4}:){0,3}([0-9A-F]){1,4}::([0-9A-F]){1,4}:(([0-9A-F]){1,4}:([0-9A-F]){1,4}|((0?0?[0-9]|0?[1-9][0-9]|1[0-9][0-9]|2[0-4][0-9]|25[0-5])\.){3}(0?0?[0-9]|0?[1-9][0-9]|1[0-9][0-9]|2[0-4][0-9]|25[0-5]))|(([0-9A-F]){1,4}:){0,4}([0-9A-F]){1,4}::(([0-9A-F]){1,4}:([0-9A-F]){1,4}|((0?0?[0-9]|0?[1-9][0-9]|1[0-9][0-9]|2[0-4][0-9]|25[0-5])\.){3}(0?0?[0-9]|0?[1-9][0-9]|1[0-9][0-9]|2[0-4][0-9]|25[0-5]))|(([0-9A-F]){1,4}:){0,5}([0-9A-F]){1,4}::([0-9A-F]){1,4}|(([0-9A-F]){1,4}:){0,6}([0-9A-F]){1,4}::)|(v[0-9A-F]+\.[a-zA-Z0-9-\._~!$&'()*+,;=:]+))\]` captures an IP address
     *    as the host name that is not an IPv4 address. This includes the IPv6 address, a composite of IPv6 and IPv4, or an IPvFuture address.
     *
     *    - `((([0-9A-F]){1,4}:){6}(([0-9A-F]){1,4}:([0-9A-F]){1,4}|((0?0?[0-9]|0?[1-9][0-9]|1[0-9][0-9]|2[0-4][0-9]|25[0-5])\.){3}(0?0?[0-9]|0?[1-9][0-9]|1[0-9][0-9]|2[0-4][0-9]|25[0-5]))|::(([0-9A-F]){1,4}:){5}(([0-9A-F]){1,4}:([0-9A-F]){1,4}|((0?0?[0-9]|0?[1-9][0-9]|1[0-9][0-9]|2[0-4][0-9]|25[0-5])\.){3}(0?0?[0-9]|0?[1-9][0-9]|1[0-9][0-9]|2[0-4][0-9]|25[0-5]))|([0-9A-F]){1,4}::(([0-9A-F]){1,4}:){4}(([0-9A-F]){1,4}:([0-9A-F]){1,4}|((0?0?[0-9]|0?[1-9][0-9]|1[0-9][0-9]|2[0-4][0-9]|25[0-5])\.){3}(0?0?[0-9]|0?[1-9][0-9]|1[0-9][0-9]|2[0-4][0-9]|25[0-5]))|(([0-9A-F]){1,4}:){0,1}([0-9A-F]){1,4}::(([0-9A-F]){1,4}:){3}(([0-9A-F]){1,4}:([0-9A-F]){1,4}|((0?0?[0-9]|0?[1-9][0-9]|1[0-9][0-9]|2[0-4][0-9]|25[0-5])\.){3}(0?0?[0-9]|0?[1-9][0-9]|1[0-9][0-9]|2[0-4][0-9]|25[0-5]))|(([0-9A-F]){1,4}:){0,2}([0-9A-F]){1,4}::(([0-9A-F]){1,4}:){2}(([0-9A-F]){1,4}:([0-9A-F]){1,4}|((0?0?[0-9]|0?[1-9][0-9]|1[0-9][0-9]|2[0-4][0-9]|25[0-5])\.){3}(0?0?[0-9]|0?[1-9][0-9]|1[0-9][0-9]|2[0-4][0-9]|25[0-5]))|(([0-9A-F]){1,4}:){0,3}([0-9A-F]){1,4}::([0-9A-F]){1,4}:(([0-9A-F]){1,4}:([0-9A-F]){1,4}|((0?0?[0-9]|0?[1-9][0-9]|1[0-9][0-9]|2[0-4][0-9]|25[0-5])\.){3}(0?0?[0-9]|0?[1-9][0-9]|1[0-9][0-9]|2[0-4][0-9]|25[0-5]))|(([0-9A-F]){1,4}:){0,4}([0-9A-F]){1,4}::(([0-9A-F]){1,4}:([0-9A-F]){1,4}|((0?0?[0-9]|0?[1-9][0-9]|1[0-9][0-9]|2[0-4][0-9]|25[0-5])\.){3}(0?0?[0-9]|0?[1-9][0-9]|1[0-9][0-9]|2[0-4][0-9]|25[0-5]))|(([0-9A-F]){1,4}:){0,5}([0-9A-F]){1,4}::([0-9A-F]){1,4}|(([0-9A-F]){1,4}:){0,6}([0-9A-F]){1,4}::)` captures all of
     *      the formats of an IPv6 address such as `2001:db8::7`, `FEDC:BA98:7654:3210:FEDC:BA98:7654:3210`, or `1080:0:0:0:8:800:200C:417A`.
     *
     *    - `(v[0-9A-F]+\.[a-zA-Z0-9-\._~!$&'()*+,;=:]+)` captures an IPvFuture address such as `v1.09azAZ-._~!$&\'()*+,;=:`
     *
     *    - `((0?0?[0-9]|0?[1-9][0-9]|1[0-9][0-9]|2[0-4][0-9]|25[0-5])\.){3}(0?0?[0-9]|0?[1-9][0-9]|1[0-9][0-9]|2[0-4][0-9]|25[0-5])` captures an
     *      IPv4 address such as `127.0.0.1`.
     *
     *    - `[a-zA-Z0-9-\._~%0-9A-F!$&'()*+,;=]{0,255}` captures the registered name, such as `google.com`
     *
     *  - `(:[0-9]*)?` captures the port, which is optional
     *
     *  - `(\/((\/[a-zA-Z0-9-\._~%0-9A-F!$&'()*+,;=:@]*)*|\/[a-zA-Z0-9-\._~%0-9A-F!$&'()*+,;=:@]+(\/[a-zA-Z0-9-\._~%0-9A-F!$&'()*+,;=:@]*)*|[a-zA-Z0-9-\._~%0-9A-F!$&'()*+,;=@]+(\/[a-zA-Z0-9-\._~%0-9A-F!$&'()*+,;=:@]*)*|[a-zA-Z0-9-\._~%0-9A-F!$&'()*+,;=:@]+(\/[a-zA-Z0-9-\._~%0-9A-F!$&'()*+,;=:@]*)*))?` captures the path,
     *    which is optional. The path could be of a few forms: begins with "/" or is empty, begins with "/" but not "//", begins with a non-colon segment, begins with a segment - and this covers all of them.
     *
     *    - `(\/[a-zA-Z0-9-\._~%0-9A-F!$&'()*+,;=:@]*)*` captures an absolute path which has a segment after it or is empty after the slash ("/"), such as `/login`.
     *
     *    - `\/[a-zA-Z0-9-\._~%0-9A-F!$&'()*+,;=:@]+(\/[a-zA-Z0-9-\._~%0-9A-F!$&'()*+,;=:@]*)*` captures an absolute path which has multiple segments, such as `/users/login`.
     *
     *    - `[a-zA-Z0-9-\._~%0-9A-F!$&'()*+,;=@]+(\/[a-zA-Z0-9-\._~%0-9A-F!$&'()*+,;=:@]*)*` captures the path when it has no scheme, such as `users/login`
     *
     *    - `[a-zA-Z0-9-\._~%0-9A-F!$&'()*+,;=:@]+(\/[a-zA-Z0-9-\._~%0-9A-F!$&'()*+,;=:@]*)*` captures the path when it is rootless, such as `:80/users/login`.
     *
     * - `(\?[a-zA-Z0-9-\._~%0-9A-F!$&'()*+,;=:@\/\?]*(?=#|$))?` captures the query string part of the URI, such as `?asdf=12345`.
     *
     * - `(#[a-zA-Z0-9-\._~%0-9A-F!$&'()*+,;=:@\/\?]*$)?` captures the fragment part of the URI, such as `#asdf12345`.
     *
     * @type {RegExp}
     */
    var regex = /^[a-zA-Z][a-zA-Z0-9+\.-]*:(([\//]{2}[\//]?)|(?=[^/]))([a-zA-Z0-9-\._~%0-9A-F!$&'()*+,;=:]*@)?(\[(((([0-9A-F]){1,4}:){6}(([0-9A-F]){1,4}:([0-9A-F]){1,4}|((0?0?[0-9]|0?[1-9][0-9]|1[0-9][0-9]|2[0-4][0-9]|25[0-5])\.){3}(0?0?[0-9]|0?[1-9][0-9]|1[0-9][0-9]|2[0-4][0-9]|25[0-5]))|::(([0-9A-F]){1,4}:){5}(([0-9A-F]){1,4}:([0-9A-F]){1,4}|((0?0?[0-9]|0?[1-9][0-9]|1[0-9][0-9]|2[0-4][0-9]|25[0-5])\.){3}(0?0?[0-9]|0?[1-9][0-9]|1[0-9][0-9]|2[0-4][0-9]|25[0-5]))|([0-9A-F]){1,4}::(([0-9A-F]){1,4}:){4}(([0-9A-F]){1,4}:([0-9A-F]){1,4}|((0?0?[0-9]|0?[1-9][0-9]|1[0-9][0-9]|2[0-4][0-9]|25[0-5])\.){3}(0?0?[0-9]|0?[1-9][0-9]|1[0-9][0-9]|2[0-4][0-9]|25[0-5]))|(([0-9A-F]){1,4}:){0,1}([0-9A-F]){1,4}::(([0-9A-F]){1,4}:){3}(([0-9A-F]){1,4}:([0-9A-F]){1,4}|((0?0?[0-9]|0?[1-9][0-9]|1[0-9][0-9]|2[0-4][0-9]|25[0-5])\.){3}(0?0?[0-9]|0?[1-9][0-9]|1[0-9][0-9]|2[0-4][0-9]|25[0-5]))|(([0-9A-F]){1,4}:){0,2}([0-9A-F]){1,4}::(([0-9A-F]){1,4}:){2}(([0-9A-F]){1,4}:([0-9A-F]){1,4}|((0?0?[0-9]|0?[1-9][0-9]|1[0-9][0-9]|2[0-4][0-9]|25[0-5])\.){3}(0?0?[0-9]|0?[1-9][0-9]|1[0-9][0-9]|2[0-4][0-9]|25[0-5]))|(([0-9A-F]){1,4}:){0,3}([0-9A-F]){1,4}::([0-9A-F]){1,4}:(([0-9A-F]){1,4}:([0-9A-F]){1,4}|((0?0?[0-9]|0?[1-9][0-9]|1[0-9][0-9]|2[0-4][0-9]|25[0-5])\.){3}(0?0?[0-9]|0?[1-9][0-9]|1[0-9][0-9]|2[0-4][0-9]|25[0-5]))|(([0-9A-F]){1,4}:){0,4}([0-9A-F]){1,4}::(([0-9A-F]){1,4}:([0-9A-F]){1,4}|((0?0?[0-9]|0?[1-9][0-9]|1[0-9][0-9]|2[0-4][0-9]|25[0-5])\.){3}(0?0?[0-9]|0?[1-9][0-9]|1[0-9][0-9]|2[0-4][0-9]|25[0-5]))|(([0-9A-F]){1,4}:){0,5}([0-9A-F]){1,4}::([0-9A-F]){1,4}|(([0-9A-F]){1,4}:){0,6}([0-9A-F]){1,4}::)|(v[0-9A-F]+\.[a-zA-Z0-9-\._~!$&'()*+,;=:]+))\]|((0?0?[0-9]|0?[1-9][0-9]|1[0-9][0-9]|2[0-4][0-9]|25[0-5])\.){3}(0?0?[0-9]|0?[1-9][0-9]|1[0-9][0-9]|2[0-4][0-9]|25[0-5])|[a-zA-Z0-9-\._~%0-9A-F!$&'()*+,;=]{0,255})(:[0-9]*)?(\/((\/[a-zA-Z0-9-\._~%0-9A-F!$&'()*+,;=:@]*)*|\/[a-zA-Z0-9-\._~%0-9A-F!$&'()*+,;=:@]+(\/[a-zA-Z0-9-\._~%0-9A-F!$&'()*+,;=:@]*)*|[a-zA-Z0-9-\._~%0-9A-F!$&'()*+,;=@]+(\/[a-zA-Z0-9-\._~%0-9A-F!$&'()*+,;=:@]*)*|[a-zA-Z0-9-\._~%0-9A-F!$&'()*+,;=:@]+(\/[a-zA-Z0-9-\._~%0-9A-F!$&'()*+,;=:@]*)*))?(\?[a-zA-Z0-9-\._~%0-9A-F!$&'()*+,;=:@\/\?]*(?=#|$))?(#[a-zA-Z0-9-\._~%0-9A-F!$&'()*+,;=:@\/\?]*$)?/;

    return this._test('uri', undefined, function (value, state, options) {

        if (regex.test(value)) {
            return null;
        }

        return Errors.create('string.uri', null, state, options);
    });
};


internals.String.prototype.isoDate = function () {

    var regex = /^(\d{4}-[01]\d-[0-3]\dT[0-2]\d:[0-5]\d:[0-5]\d\.\d+([+-][0-2]\d:[0-5]\d|Z))|(\d{4}-[01]\d-[0-3]\dT[0-2]\d:[0-5]\d:[0-5]\d([+-][0-2]\d:[0-5]\d|Z))|(\d{4}-[01]\d-[0-3]\dT[0-2]\d:[0-5]\d([+-][0-2]\d:[0-5]\d|Z))$/;

    return this._test('isoDate', undefined, function (value, state, options) {

        if (regex.test(value)) {
            return null;
        }

        return Errors.create('string.isoDate', null, state, options);
    });
};


internals.String.prototype.guid = function () {

    var regex = /^[A-F0-9]{8}(?:-?[A-F0-9]{4}){3}-?[A-F0-9]{12}$/i;
    var regex2 = /^\{[A-F0-9]{8}(?:-?[A-F0-9]{4}){3}-?[A-F0-9]{12}\}$/i;

    return this._test('guid', undefined, function (value, state, options) {

        if (regex.test(value) || regex2.test(value)) {
            return null;
        }

        return Errors.create('string.guid', null, state, options);
    });
};


internals.String.prototype.hostname = function () {

    var regex = /^(([a-zA-Z0-9]|[a-zA-Z0-9][a-zA-Z0-9\-]*[a-zA-Z0-9])\.)*([A-Za-z0-9]|[A-Za-z0-9][A-Za-z0-9\-]*[A-Za-z0-9])$/;

    return this._test('hostname', undefined, function (value, state, options) {

        if ((value.length <= 255 && regex.test(value)) ||
            Net.isIPv6(value)) {

            return null;
        }

        return Errors.create("string.hostname", null, state, options);
    });
};


internals.String.prototype.lowercase = function () {

    var obj = this._test('lowercase', undefined, function (value, state, options) {

        if (options.convert ||
            value === value.toLocaleLowerCase()) {

            return null;
        }

        return Errors.create('string.lowercase', null, state, options);
    });

    obj._flags.case = 'lower';
    return obj;
};


internals.String.prototype.uppercase = function (options) {

    var obj = this._test('uppercase', undefined, function (value, state, options) {

        if (options.convert ||
            value === value.toLocaleUpperCase()) {

            return null;
        }

        return Errors.create('string.uppercase', null, state, options);
    });

    obj._flags.case = 'upper';
    return obj;
};


internals.String.prototype.trim = function () {

    var obj = this._test('trim', undefined, function (value, state, options) {

        if (options.convert ||
            value === value.trim()) {

            return null;
        }

        return Errors.create('string.trim', null, state, options);
    });

    obj._flags.trim = true;
    return obj;
};


module.exports = new internals.String();
