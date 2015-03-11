// Load modules

var Net = require('net');
var Hoek = require('hoek');
var Isemail = require('isemail');
var Any = require('./any');
var JoiDate = require('./date');
var Errors = require('./errors');

// Declare internals

var internals = {
    createUriRegex: function (optionalScheme) {
        /**
         * DIGIT = %x30-39 ; 0-9
         */
        var digit = '0-9',
            digitOnly = '[' + digit + ']';

        /**
         * ALPHA = %x41-5A / %x61-7A   ; A-Z / a-z
         */
        var alpha = 'a-zA-Z',
            alphaOnly = '[' + alpha + ']';

        /**
         * HEXDIG = DIGIT / "A" / "B" / "C" / "D" / "E" / "F"
         */
        var hexDigit = digit + 'A-Fa-f',
            hexDigitOnly = '[' + hexDigit + ']';

        /**
         * unreserved = ALPHA / DIGIT / "-" / "." / "_" / "~"
         */
        var unreserved = alpha + digit + '-\\._~';

        /**
         * pct-encoded = "%" HEXDIG HEXDIG
         */
        var pctEncoded = '%' + hexDigit;

        /**
         * sub-delims = "!" / "$" / "&" / "'" / "(" / ")" / "*" / "+" / "," / ";" / "="
         */
        var subDelims = '!\\$&\'\\(\\)\\*\\+,;=';

        /**
         * pchar = unreserved / pct-encoded / sub-delims / ":" / "@"
         */
        var pchar = unreserved + pctEncoded + subDelims + ':@',
            pcharOnly = '[' + pchar + ']';

        /**
         * elements separated by forward slash ("/") are alternatives.
         */
        var or = '|';

        /**
         * Rule to support zero-padded addresses.
         */
        var zeroPad = '0?';

        /**
         * dec-octet   = DIGIT                 ; 0-9
         *            / %x31-39 DIGIT         ; 10-99
         *            / "1" 2DIGIT            ; 100-199
         *            / "2" %x30-34 DIGIT     ; 200-249
         *            / "25" %x30-35          ; 250-255
         */
        var decOctect = '(?:' + zeroPad + zeroPad + digitOnly + or + zeroPad + '[1-9]' + digitOnly + or + '1' + digitOnly + digitOnly + or + '2' + '[0-4]' + digitOnly + or + '25' + '[0-5])';

        /**
         * scheme = ALPHA *( ALPHA / DIGIT / "+" / "-" / "." )
         */
        var scheme = alphaOnly + '[' + alpha + digit + '+-\\.]*';

        // If we were passed a scheme, use it instead of the generic one
        if (optionalScheme) {
            // Have to put this in a non-capturing group to handle the OR statements
            scheme = '(?:' + optionalScheme + ')';
        }

        /**
         * userinfo = *( unreserved / pct-encoded / sub-delims / ":" )
         */
        var userinfo = '[' + unreserved + pctEncoded + subDelims + ':]*';

        /**
         * IPv4address = dec-octet "." dec-octet "." dec-octet "." dec-octet
         */
        var IPv4address = '(?:' + decOctect + '\\.){3}' + decOctect;

        /**
         * h16 = 1*4HEXDIG ; 16 bits of address represented in hexadecimal
         * ls32 = ( h16 ":" h16 ) / IPv4address ; least-significant 32 bits of address
         * IPv6address =                            6( h16 ":" ) ls32
         *             /                       "::" 5( h16 ":" ) ls32
         *             / [               h16 ] "::" 4( h16 ":" ) ls32
         *             / [ *1( h16 ":" ) h16 ] "::" 3( h16 ":" ) ls32
         *             / [ *2( h16 ":" ) h16 ] "::" 2( h16 ":" ) ls32
         *             / [ *3( h16 ":" ) h16 ] "::"    h16 ":"   ls32
         *             / [ *4( h16 ":" ) h16 ] "::"              ls32
         *             / [ *5( h16 ":" ) h16 ] "::"              h16
         *             / [ *6( h16 ":" ) h16 ] "::"
         */
        var h16 = hexDigitOnly + '{1,4}',
            ls32 = '(?:' + h16 + ':' + h16 + '|' + IPv4address + ')',
            IPv6SixHex = '(?:' + h16 + ':){6}' + ls32,
            IPv6FiveHex = '::(?:' + h16 + ':){5}' + ls32,
            IPv6FourHex = h16 + '::(?:' + h16 + ':){4}' + ls32,
            IPv6ThreeeHex = '(?:' + h16 + ':){0,1}' + h16 + '::(?:' + h16 + ':){3}' + ls32,
            IPv6TwoHex = '(?:' + h16 + ':){0,2}' + h16 + '::(?:' + h16 + ':){2}' + ls32,
            IPv6OneHex = '(?:' + h16 + ':){0,3}' + h16 + '::' + h16 + ':' + ls32,
            IPv6NoneHex = '(?:' + h16 + ':){0,4}' + h16 + '::' + ls32,
            IPv6NoneHex2 = '(?:' + h16 + ':){0,5}' + h16 + '::' + h16,
            IPv6NoneHex3 = '(?:' + h16 + ':){0,6}' + h16 + '::',
            IPv6address = '(?:' + IPv6SixHex + or + IPv6FiveHex + or + IPv6FourHex + or + IPv6ThreeeHex + or + IPv6TwoHex + or + IPv6OneHex + or + IPv6NoneHex + or + IPv6NoneHex2 + or + IPv6NoneHex3 + ')';

        /**
         * IPvFuture = "v" 1*HEXDIG "." 1*( unreserved / sub-delims / ":" )
         */
        var IPvFuture = 'v' + hexDigitOnly + '+\\.[' + unreserved + subDelims + ':]+';

        /**
         * IP-literal = "[" ( IPv6address / IPvFuture  ) "]"
         */
        var IPLiteral = '\\[(?:' + IPv6address + or + IPvFuture + ')\\]';

        /**
         * reg-name = *( unreserved / pct-encoded / sub-delims )
         */
        var regName = '[' + unreserved + pctEncoded + subDelims + ']{0,255}';

        /**
         * host = IP-literal / IPv4address / reg-name
         */
        var host = '(?:' + IPLiteral + or + IPv4address + or + regName + ')';

        /**
         * port = *DIGIT
         */
        var port = digitOnly + '*';

        /**
         * authority   = [ userinfo "@" ] host [ ":" port ]
         */
        var authority = '(?:' + userinfo + '@)?' + host + '(?::' + port + ')?';

        /**
         * segment       = *pchar
         * segment-nz    = 1*pchar
         * path          = path-abempty    ; begins with "/" or is empty
         *               / path-absolute   ; begins with "/" but not "//"
         *               / path-noscheme   ; begins with a non-colon segment
         *               / path-rootless   ; begins with a segment
         *               / path-empty      ; zero characters
         * path-abempty  = *( "/" segment )
         * path-absolute = "/" [ segment-nz *( "/" segment ) ]
         * path-rootless = segment-nz *( "/" segment )
         */
        var segment = pcharOnly + '*',
            segmentNz = pcharOnly + '+',
            pathAbEmpty = '(?:\\/' + segment + ')*',
            pathAbsolute = '\\/(?:' + segmentNz + pathAbEmpty + ')?',
            pathRootless = segmentNz + pathAbEmpty;

        /**
         * hier-part = "//" authority path
         */
        var hierPart = '(?:\\/\\/' + authority + pathAbEmpty + or + pathAbsolute + or + pathRootless + ')';

        /**
         * query = *( pchar / "/" / "?" )
         */
        var query = '[' + pchar + '\\/\\?]*(?=#|$)'; //Finish matching either at the fragment part or end of the line.

        /**
         * fragment = *( pchar / "/" / "?" )
         */
        var fragment = '[' + pchar + '\\/\\?]*';

        /**
         * URI = scheme ":" hier-part [ "?" query ] [ "#" fragment ]
         */
        return new RegExp('^' + scheme + ':' + hierPart + '(?:\\?' + query + ')?' + '(?:#' + fragment + ')?$');
    }
};

internals.uriRegex = internals.createUriRegex();


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
        errors: (typeof value === 'string') ? null : Errors.create('string.base', { value: value }, state, options)
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

        return Errors.create('string.min', { limit: limit, value: value }, state, options);
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

        return Errors.create('string.max', { limit: limit, value: value }, state, options);
    });
};


internals.String.prototype.creditCard = function () {

    return this._test('creditCard', undefined, function (value, state, options) {

        var i = value.length;
        var sum = 0;
        var mul = 1;
        var char;

        while (i--) {
            char = value.charAt(i) * mul;
            sum += char - (char > 9) * 9;
            mul ^= 3;
        }

        var check = (sum % 10 === 0) && (sum > 0);
        return check ? null : Errors.create('string.creditCard', { value: value }, state, options);
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

        return Errors.create('string.length', { limit: limit, value: value }, state, options);
    });
};


internals.String.prototype.regex = function (pattern, name) {

    Hoek.assert(pattern instanceof RegExp, 'pattern must be a RegExp');

    pattern = new RegExp(pattern.source, pattern.ignoreCase ? 'i' : undefined);         // Future version should break this and forbid unsupported regex flags

    return this._test('regex', pattern, function (value, state, options) {

        if (pattern.test(value)) {
            return null;
        }

        return Errors.create((name ? 'string.regex.name' : 'string.regex.base'), { name: name, pattern: pattern, value: value }, state, options);
    });
};


internals.String.prototype.alphanum = function () {

    return this._test('alphanum', undefined, function (value, state, options) {

        if (/^[a-zA-Z0-9]+$/.test(value)) {
            return null;
        }

        return Errors.create('string.alphanum', { value: value }, state, options);
    });
};


internals.String.prototype.token = function () {

    return this._test('token', undefined, function (value, state, options) {

        if (/^\w+$/.test(value)) {
            return null;
        }

        return Errors.create('string.token', { value: value }, state, options);
    });
};


internals.String.prototype.email = function (isEmailOptions) {

    if (isEmailOptions) {
        Hoek.assert(typeof isEmailOptions === 'object', 'email options must be an object');
        Hoek.assert(typeof isEmailOptions.checkDNS === 'undefined', 'checkDNS option is not supported');
        Hoek.assert(typeof isEmailOptions.tldWhitelist === 'undefined' ||
            typeof isEmailOptions.tldWhitelist === 'object', 'tldWhitelist must be an array or object');
        Hoek.assert(typeof isEmailOptions.minDomainAtoms === 'undefined' ||
            Hoek.isInteger(isEmailOptions.minDomainAtoms) && isEmailOptions.minDomainAtoms > 0,
            'minDomainAtoms must be a positive integer');
        Hoek.assert(typeof isEmailOptions.errorLevel === 'undefined' || typeof isEmailOptions.errorLevel === 'boolean' ||
            (Hoek.isInteger(isEmailOptions.errorLevel) && isEmailOptions.errorLevel >= 0),
            'errorLevel must be a non-negative integer or boolean');
    }

    return this._test('email', isEmailOptions, function (value, state, options) {

        try {
            var result = Isemail(value, isEmailOptions);
            if (result === true || result === 0) {
                return null;
            }
        }
        catch (e) {}

        return Errors.create('string.email', { value: value }, state, options);
    });
};


internals.String.prototype.uri = function (uriOptions) {
    var customScheme,
        regex = internals.uriRegex;

    if (uriOptions) {
        Hoek.assert(typeof uriOptions === 'object', 'uri options must be an object');

        if (uriOptions.scheme) {
            Hoek.assert(uriOptions.scheme instanceof RegExp || typeof uriOptions.scheme === 'string' || Array.isArray(uriOptions.scheme), 'scheme must be a RegExp, String, or Array');

            if (!Array.isArray(uriOptions.scheme)) {
                uriOptions.scheme = [uriOptions.scheme];
            }

            // Flatten the array into a string to be used to match the schemes.
            customScheme = uriOptions.scheme.reduce(function(accumulator, scheme, index) {

                Hoek.assert(scheme instanceof RegExp || typeof scheme === 'string', 'scheme at position ' + index + ' must be a RegExp or String');

                // Add OR separators if a value already exists
                accumulator = accumulator ? accumulator + '|' : '';

                // If someone wants to match HTTP or HTTPS for example then we need to support both RegExp and String so we don't escape their pattern unknowingly.
                if (scheme instanceof RegExp) {
                    return accumulator + scheme.source;
                }

                Hoek.assert(/[a-zA-Z][a-zA-Z0-9+-\.]*/.test(scheme), 'scheme at position ' + index + ' must be a valid scheme');
                return accumulator + Hoek.escapeRegex(scheme);
            }, '');
        }
    }

    if (customScheme) {
        regex = internals.createUriRegex(customScheme);
    }

    return this._test('uri', uriOptions, function (value, state, options) {

        if (regex.test(value)) {
            return null;
        }

        if (customScheme) {
            return Errors.create('string.uriCustomScheme', {scheme: customScheme, value: value}, state, options);
        }

        return Errors.create('string.uri', {value: value}, state, options);
    });
};


internals.String.prototype.isoDate = function () {

    return this._test('isoDate', undefined, function (value, state, options) {

        if (JoiDate._isIsoDate(value)) {
            return null;
        }

        return Errors.create('string.isoDate', { value: value }, state, options);
    });
};


internals.String.prototype.guid = function () {

    var regex = /^[A-F0-9]{8}(?:-?[A-F0-9]{4}){3}-?[A-F0-9]{12}$/i;
    var regex2 = /^\{[A-F0-9]{8}(?:-?[A-F0-9]{4}){3}-?[A-F0-9]{12}\}$/i;

    return this._test('guid', undefined, function (value, state, options) {

        if (regex.test(value) || regex2.test(value)) {
            return null;
        }

        return Errors.create('string.guid', { value: value }, state, options);
    });
};


internals.String.prototype.hex = function () {

    var regex = /^[a-f0-9]+$/i;

    return this._test('guid', regex, function (value, state, options) {

        if (regex.test(value)) {
            return null;
        }

        return Errors.create('string.hex', { value: value }, state, options);
    });
};


internals.String.prototype.hostname = function () {

    var regex = /^(([a-zA-Z0-9]|[a-zA-Z0-9][a-zA-Z0-9\-]*[a-zA-Z0-9])\.)*([A-Za-z0-9]|[A-Za-z0-9][A-Za-z0-9\-]*[A-Za-z0-9])$/;

    return this._test('hostname', undefined, function (value, state, options) {

        if ((value.length <= 255 && regex.test(value)) ||
            Net.isIPv6(value)) {

            return null;
        }

        return Errors.create('string.hostname', { value: value }, state, options);
    });
};


internals.String.prototype.lowercase = function () {

    var obj = this._test('lowercase', undefined, function (value, state, options) {

        if (options.convert ||
            value === value.toLocaleLowerCase()) {

            return null;
        }

        return Errors.create('string.lowercase', { value: value }, state, options);
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

        return Errors.create('string.uppercase', { value: value }, state, options);
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

        return Errors.create('string.trim', { value: value }, state, options);
    });

    obj._flags.trim = true;
    return obj;
};

module.exports = new internals.String();
