// Load modules

var Net = require('net');
var Hoek = require('hoek');
var Isemail = require('isemail');
var Any = require('./any');
var Errors = require('./errors');
var ABAValidator = require('ABAValidator').ABAValidator;
var isoCountries = require('iso-countries');

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


internals.String.prototype.creditcard = function () {

    var isCardNumber = function(val) {
        var cards = [
            {
                type: 'visaelectron',
                pattern: /^4(026|17500|405|508|844|91[37])/,
                length: [16],
                cvcLength: [3],
                luhn: true
            }, {
                type: 'maestro',
                pattern: /^(5(018|0[23]|[68])|6(39|7))/,
                length: [12, 13, 14, 15, 16, 17, 18, 19],
                cvcLength: [3],
                luhn: true
            }, {
                type: 'forbrugsforeningen',
                pattern: /^600/,
                length: [16],
                cvcLength: [3],
                luhn: true
            }, {
                type: 'dankort',
                pattern: /^5019/,
                length: [16],
                cvcLength: [3],
                luhn: true
            }, {
                type: 'visa',
                pattern: /^4/,
                length: [13, 16],
                cvcLength: [3],
                luhn: true
            }, {
                type: 'mastercard',
                pattern: /^5[0-5]/,
                length: [16],
                cvcLength: [3],
                luhn: true
            }, {
                type: 'amex',
                pattern: /^3[47]/,
                length: [15],
                cvcLength: [3, 4],
                luhn: true
            }, {
                type: 'dinersclub',
                pattern: /^3[0689]/,
                length: [14],
                cvcLength: [3],
                luhn: true
            }, {
                type: 'discover',
                pattern: /^6([045]|22)/,
                length: [16],
                cvcLength: [3],
                luhn: true
            }, {
                type: 'unionpay',
                pattern: /^(62|88)/,
                length: [16, 17, 18, 19],
                cvcLength: [3],
                luhn: false
            }, {
                type: 'jcb',
                pattern: /^35/,
                length: [16],
                cvcLength: [3],
                luhn: true
            }
        ];

        var cardFromNumber = function(num) {
            var card, _i, _len;
            num = (num + '').replace(/\D/g, '');
            for (_i = 0, _len = cards.length; _i < _len; _i++) {
                card = cards[_i];
                if (card.pattern.test(num)) {
                    return card;
                }
            }
        };

        var luhnCheck = function(num) {
            var digit, digits, odd, sum, _i, _len;
            odd = true;
            sum = 0;
            digits = (num + '').split('').reverse();
            for (_i = 0, _len = digits.length; _i < _len; _i++) {
                digit = digits[_i];
                digit = parseInt(digit, 10);
                if ((odd = !odd)) {
                    digit *= 2;
                }
                if (digit > 9) {
                    digit -= 9;
                }
                sum += digit;
            }
            return sum % 10 === 0;
        };

        var validateCardNumber = function(num) {
            var card, _ref;
            num = (num + '').replace(/\s+|-/g, '');
            if (!/^\d+$/.test(num)) {
                return false;
            }
            card = cardFromNumber(num);
            if (!card) {
                return false;
            }
            _ref = num.length;
            return (card.length.indexOf(_ref) >= 0) &&
                   (card.luhn === false || luhnCheck(num));
        };

        return validateCardNumber(val);
    };

    return this._test('creditcard', undefined, function (value, state, options) {

        if (isCardNumber(value)) {
            return null;
        }

        return Errors.create('string.creditcard', null, state, options);
    });
};


internals.String.prototype.routingNumber = function () {

    return this._test('routingNumber', undefined, function (value, state, options) {

        if (ABAValidator.validate(value)) {
            return null;
        }

        return Errors.create('string.routingNumber', null, state, options);
    });
};


internals.String.prototype.isoCountryCode = function () {

    return this._test('isoCountryCode', undefined, function (value, state, options) {

        if (isoCountries.findCountryByCode(value)) {
            return null;
        }

        return Errors.create('string.isoCountryCode', null, state, options);
    });
};


internals.String.prototype.accountNumber = function () {

    var regex = /^\d{10,12}$/;

    return this._test('accountNumber', undefined, function (value, state, options) {

        if (regex.test(value)) {
            return null;
        }

        return Errors.create('string.accountNumber', null, state, options);
    });
};


internals.String.prototype.expiryMonth = function () {

    var regex = /^((0?[1-9])|(1[0-2]))$/;

    return this._test('expiryMonth', undefined, function (value, state, options) {

        if (regex.test(value)) {
            return null;
        }

        return Errors.create('string.expiryMonth', null, state, options);
    });
};


internals.String.prototype.expiryYear = function () {

    var regex = /^((\d{2})|(\d{4}))$/;

    var isExpired = function(year) {
        var thisYear = new Date().getFullYear();
        var last2 = parseInt(thisYear.toString().slice(-2), 10);
        thisYear = year.length === 2 ? last2 : thisYear;
        return parseInt(year, 10) < thisYear ||
               parseInt(year, 10) > thisYear +  50;
    };

    return this._test('expiryYear', undefined, function (value, state, options) {

        if (regex.test(value) && !isExpired(value)) {
            return null;
        }

        return Errors.create('string.expiryYear', null, state, options);
    });
};


internals.String.prototype.cvc = function () {

    var regex = /^((\d{3})|(\d{4}))$/;

    return this._test('cvc', undefined, function (value, state, options) {

        if (regex.test(value)) {
            return null;
        }

        return Errors.create('string.cvc', null, state, options);
    });
};


internals.String.prototype.isoCurrencyCode = function () {

    return this._test('isoCurrencyCode', undefined, function (value, state, options) {

        if (isoCountries.findCurrency(value.toUpperCase())) {
            return null;
        }

        return Errors.create('string.isoCurrencyCode', null, state, options);
    });
};


internals.String.prototype.SSN = function () {

    var regex = /^\d{9}$/;

    return this._test('SSN', undefined, function (value, state, options) {

        if (regex.test(value.replace(/-/g,''))) {
            return null;
        }

        return Errors.create('string.SSN', null, state, options);
    });
};


internals.String.prototype.EIN = function () {

    var regex = /^\d{9}$/;

    return this._test('EIN', undefined, function (value, state, options) {

        if (regex.test(value.replace(/-/g,''))) {
            return null;
        }

        return Errors.create('string.EIN', null, state, options);
    });
};


internals.String.prototype.objectid = function () {

    var regex = /^[0-9a-fA-F]{24}$/;

    return this._test('objectid', undefined, function (value, state, options) {

        if (regex.test(value)) {
            return null;
        }

        return Errors.create('string.objectid', null, state, options);
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
