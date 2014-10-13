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

        var items = [].concat(this._inner.matches[i]);

        for (var j = 0, jl = items.length; j < jl; ++j) {

            var item = items[j];

            var schema = item.schema;
            if (!schema) {
                var failed = item.is._validate(item.ref(state.parent, options), null, options, state.parent).errors;

                schema = failed ? item.otherwise : item.then;

                if (!schema) {
                    continue;
                }
            }

            var result = schema._validate(value, state, options);

            if (!result.errors) {
              // Found a valid match
                if (j === jl - 1) {

                    return result;

               } else {

                    continue;
               }

            }

            errors = errors.concat(result.errors);

        }
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

    Hoek.assert(Ref.isRef(ref) || typeof ref === 'string' || Array.isArray(ref), 'Invalid reference:', ref);
    Hoek.assert(options, 'Missing options');
    Hoek.assert(typeof options === 'object', 'Invalid options');
    Hoek.assert(options.hasOwnProperty('is'), 'Missing "is" directive');
    Hoek.assert(options.then !== undefined || options.otherwise !== undefined, 'options must have at least one of "then" or "otherwise"');
    var obj = this.clone();

    ref = [].concat(ref);

    var ref_constraints = [].concat(options.is);

    Hoek.assert(ref.length === ref_constraints.length, 'Reference and "is" directive must contain the same number of values');

    var items = [];

    for (var i = 0, il = ref.length; i < il; ++i) {
        var item = {
          ref: Cast.ref(ref[i]),
          is: Cast.schema(ref_constraints[i]),
          then: options.then !== undefined ? Cast.schema(options.then) : undefined,
          otherwise: options.otherwise !== undefined ? Cast.schema(options.otherwise) : undefined
        };

        items.push(item);

        Ref.push(obj._refs, item.ref);
        obj._refs = obj._refs.concat(item.is._refs);

        if (item.then && item.then._refs) {
            obj._refs = obj._refs.concat(item.then._refs);
        }

        if (item.otherwise && item.otherwise._refs) {
            obj._refs = obj._refs.concat(item.otherwise._refs);
        }
    }

    obj._inner.matches.push(items);

    return obj;

};


internals.Alternatives.prototype.describe = function () {

    var descriptions = [];
    for (var i = 0, il = this._inner.matches.length; i < il; ++i) {

        var items = [].concat(this._inner.matches[i]);
        // var item = this._inner.matches[i];

        for (var j = 0, jl = items.length; j < jl; ++j) {
            if (items[j].schema) {

                // try()

                descriptions.push(items[j].schema.describe());
            }
            else {

                // when()

                var when = {
                    ref: items[j].ref.toString(),
                    is: items[j].is.describe()
                };

                if (items[j].then) {
                    when.then = items[j].then.describe();
                }

                if (items[j].otherwise) {
                    when.otherwise = items[j].otherwise.describe();
                }

                descriptions.push(when);
            }
        }

    }

    return descriptions;
};


module.exports = new internals.Alternatives();
