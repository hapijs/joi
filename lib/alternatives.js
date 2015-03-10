// Load modules

var Hoek = require('hoek');
var Any = require('./any');
var Cast = require('./cast');
var Ref = require('./ref');
var Errors = require('./errors');


// Declare internals

var internals = {};


internals.Alternatives = function () {

    Any.call(this);
    this._type = 'alternatives';
    this._invalids.remove(null);

    this._inner.matches = [];
};

Hoek.inherits(internals.Alternatives, Any);


internals.Alternatives.prototype._base = function (value, state, options) {

    var errors = [];
    for (var i = 0, il = this._inner.matches.length; i < il; ++i) {
        var item = this._inner.matches[i];
        var schema = item.schema;
        if (!schema) {
            var failed,
                refToValidate = item.ref(state.parent, options);

            if (item.is !== undefined) {
                failed = item.is._validate(refToValidate, null, options, state.parent).errors;
            }

            if (item.isnt !== undefined) {
                var errs = item.isnt._validate(refToValidate, null, options, state.parent).errors;
                if (!errs) {
                    var isntError = Errors.create('alternative.isnt', { value: refToValidate }, state, options);
                    failed = failed ? failed.push(isntError) : [isntError];
                }
            }

            schema = failed ? item.otherwise : item.then;
            if (!schema) {
                continue;
            }
        }

        var result = schema._validate(value, state, options);
        if (!result.errors) {     // Found a valid match
            return result;
        }

        errors = errors.concat(result.errors);
    }

    return { errors: errors.length ? errors : Errors.create('alternatives.base', null, state, options) };
};


internals.Alternatives.prototype.try = function (/* schemas */) {


    var schemas = Hoek.flatten(Array.prototype.slice.call(arguments));
    Hoek.assert(schemas.length, 'Cannot add other alternatives without at least one schema');

    var obj = this.clone();

    for (var i = 0, il = schemas.length; i < il; ++i) {
        var cast = Cast.schema(schemas[i]);
        if (cast._refs.length) {
            obj._refs = obj._refs.concat(cast._refs)
        }
        obj._inner.matches.push({ schema: cast });
    }

    return obj;
};


internals.Alternatives.prototype.when = function (ref, options) {

    Hoek.assert(Ref.isRef(ref) || typeof ref === 'string', 'Invalid reference:', ref);
    Hoek.assert(options, 'Missing options');
    Hoek.assert(typeof options === 'object', 'Invalid options');
    Hoek.assert(options.hasOwnProperty('is') || options.hasOwnProperty('isnt'), 'Missing "is" or "isnt" directive');
    Hoek.assert(options.then !== undefined || options.otherwise !== undefined, 'options must have at least one of "then" or "otherwise"');

    var obj = this.clone();

    var item = {
        ref: Cast.ref(ref),
        is: options.hasOwnProperty('is') ? Cast.schema(options.is) : undefined,
        isnt: options.hasOwnProperty('isnt') ? Cast.schema(options.isnt) : undefined,
        then: options.then !== undefined ? Cast.schema(options.then) : undefined,
        otherwise: options.otherwise !== undefined ? Cast.schema(options.otherwise) : undefined
    };

    Ref.push(obj._refs, item.ref);

    if (item.is) {
        obj._refs = obj._refs.concat(item.is._refs);
    }

    if (item.isnt) {
        obj._refs = obj._refs.concat(item.isnt._refs);
    }

    if (item.then && item.then._refs) {
        obj._refs = obj._refs.concat(item.then._refs);
    }

    if (item.otherwise && item.otherwise._refs) {
        obj._refs = obj._refs.concat(item.otherwise._refs);
    }

    obj._inner.matches.push(item);

    return obj;
};


internals.Alternatives.prototype.describe = function () {

    var description = Any.prototype.describe.call(this);
    var alternatives = [];
    for (var i = 0, il = this._inner.matches.length; i < il; ++i) {
        var item = this._inner.matches[i];
        if (item.schema) {

            // try()

            alternatives.push(item.schema.describe());
        }
        else {

            // when()

            var when = {
                ref: item.ref.toString()
            };

            if (item.is) {
                when.is = item.is.describe();
            }

            if (item.isnt) {
                when.isnt = item.isnt.describe();
            }

            if (item.then) {
                when.then = item.then.describe();
            }

            if (item.otherwise) {
                when.otherwise = item.otherwise.describe();
            }

            alternatives.push(when);
        }
    }

    description.alternatives = alternatives;
    return description;
};


module.exports = new internals.Alternatives();
