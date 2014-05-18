<a href="https://github.com/spumko"><img src="https://raw.github.com/spumko/spumko/master/images/from.png" align="right" /></a>
![joi Logo](https://raw.github.com/spumko/joi/master/images/joi.png)

Object schema description language and validator for JavaScript objects.

Current version: **4.2.x**

[![Build Status](https://secure.travis-ci.org/spumko/joi.png)](http://travis-ci.org/spumko/joi)

[![Browser Support](https://ci.testling.com/spumko/joi.png)](https://ci.testling.com/spumko/joi)

## Table of Contents

<img src="https://raw.github.com/spumko/joi/master/images/validation.png" align="right" />
- [Example](#example)
- [Usage](#usage)
    - [`validate(value, schema, [options], callback)`](#validatevalue-schema-options-callback)
    - [`compile(schema)`](#compileschema)
    - [`any`](#any)
        - [`any.allow(value)`](#anyallowvalue)
        - [`any.valid(value)`](#anyvalidvalue)
        - [`any.invalid(value)`](#anyinvalidvalue)
        - [`any.required()`](#anyrequired)
        - [`any.optional()`](#anyoptional)
        - [`description(desc)`](#descriptiondesc)
        - [`any.notes(notes)`](#anynotesnotes)
        - [`any.tags(tags)`](#anytagstags)
        - [`any.example(value)`](#anyexamplevalue)
        - [`any.unit(name)`](#anyunitname)
        - [`any.options(options)`](#anyoptionsoptions)
        - [`any.strict()`](#anystrict)
        - [`any.default(value)`](#anydefault)
        - [`any.concat(schema)`](#anyconcatschema)
        - [`any.when(ref, options)`](#anywhenref-options)
    - [`array`](#array)
        - [`array.includes(type)`](#arrayincludestype)
        - [`array.excludes(type)`](#arrayexcludestype)
        - [`array.min(limit)`](#arrayminlimit)
        - [`array.max(limit)`](#arraymaxlimit)
        - [`array.length(limit)`](#arraylengthlimit)
    - [`binary`](#binary)
      - [`binary.encoding(encoding)`](#binaryencodingencoding)
      - [`binary.min(limit)`](#binaryminlimit)
      - [`binary.max(limit)`](#binarymaxlimit)
      - [`binary.length(limit)`](#binarylengthlimit)
    - [`boolean()`](#boolean)
    - [`date`](#date)
        - [`date.min(date)`](#datemindate)
        - [`date.max(date)`](#datemaxdate)
    - [`func`](#func)
    - [`number`](#number)
        - [`number.min(limit)`](#numberminlimit)
        - [`number.max(limit)`](#numbermaxlimit)
        - [`number.integer()`](#numberinteger)
    - [`object`](#object)
        - [`object.keys([schema])`](#objectkeysschema)
        - [`object.min(limit)`](#objectminlimit)
        - [`object.max(limit)`](#objectmaxlimit)
        - [`object.length(limit)`](#objectlengthlimit)
        - [`object.and(peers)`](#objectandpeers)
        - [`object.or(peers)`](#objectorpeers)
        - [`object.xor(peers)`](#objectxorpeers)
        - [`object.with(key, peers)`](#objectwithkey-peers)
        - [`object.without(key, peers)`](#objectwithoutkey-peers)
        - [`object.rename(from, to, [options])`](#objectrenamefrom-to-options)
        - [`object.assert(ref, schema, message)`](#objectassertref-schema-message)
        - [`object.unknown([allow])`](#objectunknownallow)
    - [`string`](#string)
        - [`string.insensitive()`](#stringinsensitive)
        - [`string.min(limit, [encoding])`](#stringminlimit-encoding)
        - [`string.max(limit, [encoding])`](#stringmaxlimit-encoding)
        - [`string.length(limit, [encoding])`](#stringlengthlimit-encoding)
        - [`string.regex(pattern)`](#stringregexpattern)
        - [`string.alphanum()`](#stringalphanum)
        - [`string.token()`](#stringtoken)
        - [`string.email()`](#stringemail)
        - [`string.guid()`](#stringguid)
        - [`string.isoDate()`](#stringisodate)
        - [`string.hostname()`](#stringhostname)
    - [`alternatives`](#alternatives)
        - [`alternatives.try(schemas)`](#alternativestryschemas)
        - [`alternatives.when(ref, options)`](#alternativeswhenref-options)
    - [`forbidden`](#forbidden)
    - [`ref(key, [options])`](#refkey-options)

# Example

```javascript
var Joi = require('joi');

var schema = Joi.object().keys({
    username: Joi.string().alphanum().min(3).max(30).required(),
    password: Joi.string().regex(/[a-zA-Z0-9]{3,30}/),
    access_token: [Joi.string(), Joi.number()],
    birthyear: Joi.number().integer().min(1900).max(2013),
    email: Joi.string().email()
}).with('username', 'birthyear').without('password', 'access_token');

Joi.validate({ username: 'abc', birthyear: 1994 }, schema, function (err, value) { });  // err === null -> valid
```

The above schema defines the following constraints:
* `username`
    * a required string
    * must contain only alphanumeric characters
    * at least 3 characters long but no more than 30
    * must be accompanied by `birthyear`
* `password`
    * an optional string
    * must satisfy the custom regex
    * cannot appear together with `access_token`
* `access_token`
    * an optional, unconstrained string or number
* `birthyear`
    * an integer between 1900 and 2013
* `email`
    * a valid email address string

# Usage

Usage is a two steps process. First, a schema is constructed using the provided types and constraints:

```javascript
var schema = {
    a: Joi.string()
};
```

Note that **joi** schema objects are immutable which means every additional rule added (e.g. `.min(5)`) will return a
new schema object.

Then the value is validated against the schema:

```javascript
Joi.validate({ a: 'a string' }, schema, function (err, value) { });
```

If the value is valid, `null` is returned, otherwise an `Error` object.

The schema can be a plain JavaScript object where every key is assigned a **joi** type, or it can be a **joi** type directly:

```javascript
var schema = Joi.string().min(10);
```

If the schema is a **joi** type, the `schema.validate(value, callback)` can be called directly on the type. When passing a non-type schema object,
the module converts it internally to an object() type equivalent to:

```javascript
var schema = Joi.object().keys({
    a: Joi.string()
});
```

When validating a schema:
* Keys are optional by default.
* Strings are utf-8 encoded by default.
* Rules are defined in an additive fashion and evaluated in order after whitelist and blacklist checks.

### `validate(value, schema, [options], callback)`

Validates a value using the given schema and options where:
- `value` - the value being validated.
- `schema` - the validation schema. Can be a **joi** type object or a plain object where every key is assigned a **joi** type object.
- `options` - an optional object with the following optional keys:
  - `abortEarly` - when `true`, stops validation on the first error, otherwise returns all the errors found. Defaults to `true`.
  - `convert` - when `true`, attempts to cast values to the required types (e.g. a string to a number). Defaults to `true`.
  - `allowUnknown` - when `true`, allows object to contain unknown keys which are ignored. Defaults to `false`.
  - `skipFunctions` - when `true`, ignores unknown keys with a function value. Defaults to `false`.
  - `stripUnknown` - when `true`, unknown keys are deleted (only when value is an object). Defaults to `false`.
  - `language` - overrides individual error messages. Defaults to no override (`{}`).
- `callback` - the synchronous callback method using the signature `function(err, value)` where:
  - `err` - if validation failed, the error reason, otherwise `null`.
  - `value` - the validated value with any type conversions and other modifiers applied (the input is left unchanged). `value` can be
    incomplete if validation failed and `abortEarly` is `true`.

```javascript
var schema = {
    a: Joi.number()
};

var value = {
    a: '123'
};

Joi.validate(value, schema, function (err, value) { });
// err -> null
// value.a -> 123 (number, not string)
```

### `compile(schema)`

Converts literal schema definition to **joi** schema object (or returns the same back if already a **joi** schema object) where:
- `schema` - the schema definition to compile.

```javascript
var definition = ['key', 5, { a: true, b: [/^a/, 'boom'] }];
var schema = Joi.compile(definition);

// Same as:

var schema = Joi.alternatives().try([
    Joi.string().valid('key'),
    Joi.number().valid(5),
    Joi.object().keys({
        a: Joi.boolean().valid(true),
        b: Joi.alternatives().try([
            Joi.string().regex(/^a/),
            Joi.string().valid('boom')
        ])
    })
]);
```

### `any`

Generates a schema object that matches any data type.

```javascript
var any = Joi.any();
any.validate('a', function (err, value) { });
```

#### `any.allow(value)`

Whitelists a value where:
- `value` - the allowed value which can be of any type and will be matched against the validated value before applying any other rules.
  `value` can be an array of values, or multiple values can be passed as individual arguments. `value` supports [references](#refkey-options).

```javascript
var schema = {
    a: Joi.any().allow('a'),
    b: Joi.any().allow('b', 'B'),
    c: Joi.any().allow(['c', 'C'])
};
```

#### `any.valid(value)`

Adds the provided values into the allowed whitelist and marks them as the only valid values allowed where:
- `value` - the allowed value which can be of any type and will be matched against the validated value before applying any other rules.
  `value` can be an array of values, or multiple values can be passed as individual arguments. `value` supports [references](#refkey-options).

```javascript
var schema = {
    a: Joi.any().valid('a'),
    b: Joi.any().valid('b', 'B'),
    c: Joi.any().valid(['c', 'C'])
};
```

#### `any.invalid(value)`

Blacklists a value where:
- `value` - the forbidden value which can be of any type and will be matched against the validated value before applying any other rules.
  `value` can be an array of values, or multiple values can be passed as individual arguments. `value` supports [references](#refkey-options).

```javascript
var schema = {
    a: Joi.any().invalid('a'),
    b: Joi.any().invalid('b', 'B'),
    c: Joi.any().invalid(['c', 'C'])
};
```

#### `any.required()`

Marks a key as required which will not allow `undefined` as value. All keys are optional by default.

```javascript
var schema = Joi.any().required();
```

#### `any.optional()`

Marks a key as optional which will allow `undefined` as values. Used to annotate the schema for readability as all keys are optional by default.

```javascript
var schema = Joi.any().optional();
```

#### `any.description(desc)`

Annotates the key where:
- `desc` - the description string.

```javascript
var schema = Joi.any().description('this key will match anything you give it');
```

#### `any.notes(notes)`

Annotates the key where:
- `notes` - the notes string or array of strings.

```javascript
var schema = Joi.any().notes(['this is special', 'this is important']);
```

#### `any.tags(tags)`

Annotates the key where:
- `tags` - the tag string or array of strings.

```javascript
var schema = Joi.any().tags(['api', 'user']);
```

#### `any.example(value)`

Annotates the key where:
- `value` - an example value.

If the example fails to pass validation, the function will throw.

```javascript
var schema = Joi.string().min(4).example('abcd');
```

#### `any.unit(name)`

Annotates the key where:
- `name` - the unit name of the value.

```javascript
var schema = Joi.number().unit('milliseconds');
```

#### `any.options(options)`

Overrides the global `validate()` options for the current key and any sub-key where:
- `options` - an object with the same optional keys as [`Joi.validate(value, schema, options, callback)`](#joivalidatevalue-schema-options-callback).

```javascript
var schema = Joi.any().options({ convert: false });
```

#### `any.strict()`

Sets the `options.convert` options to `false` which prevent type casting for the current key and any child keys.

```javascript
var schema = Joi.any().strict();
```

#### `any.default(value)`

Sets a default value if the original value is undefined where:
- `value` - the value. `value` supports [references](#refkey-options).

```javascript
var schema = {
    username: Joi.string().default('new_user')
};
Joi.validate({}, schema, function (err, value) { });
// value === { username: "new_user" }
```

#### `any.concat(schema)`

Returns a new type that is the result of adding the rules of one type to another where:
- `schema` - a **joi** type to merge into the current schema. Can only be of the same type as the context type or `any`.

```javascript
var a = Joi.string().valid('a');
var b = Joi.string().valid('b');
var ab = a.concat(b);
```

#### `any.when(ref, options)`

Converts the type into an [`alternatives`](#alternatives) type where the conditions are merged into the type definition where:
- `ref` - the key name or [reference](#refkey-options).
- `options` - an object with:
    - `is` - the required condition **joi** type.
    - `then` - the alternative schema type if the condition is true. Required if `otherwise` is missing.
    - `otherwise` - the alternative schema type if the condition is false. Required if `then` is missing.

```javascript
var schema = {
    a: Joi.any().valid('x').when('b', { is: 5, then: Joi.valid('y'), otherwise: Joi.valid('z') }),
    b: Joi.any()
};
```

### `array`

Generates a schema object that matches an array data type.

Supports the same methods of the [`any()`](#any) type.

```javascript
var array = Joi.array().includes(Joi.string().valid('a', 'b'));
array.validate(['a', 'b', 'a'], function (err, value) { });
```

#### `array.includes(type)`

List the types allowed for the array values where:
- `type` - a **joi** schema object to validate each array item against. `type` can be an array of values, or multiple values can be passed as individual arguments.

```javascript
var schema = Joi.array().includes(Joi.string(), Joi.number());
```

#### `array.excludes(type)`

List the types forbidden for the array values where:
- `type` - a **joi** schema object to validate each array item against. `type` can be an array of values, or multiple values can be passed as individual arguments.

```javascript
var schema = Joi.array().excludes(Joi.object());
```

#### `array.min(limit)`

Specifies the minimum number of items in the array where:
- `limit` - the lowest number of array items allowed.

```javascript
var schema = Joi.array().min(2);
```

#### `array.max(limit)`

Specifies the maximum number of items in the array where:
- `limit` - the highest number of array items allowed.

```javascript
var schema = Joi.array().max(10);
```

#### `array.length(limit)`

Specifies the exact number of items in the array where:
- `limit` - the number of array items allowed.

```javascript
var schema = Joi.array().length(5);
```

### `boolean`

Generates a schema object that matches a boolean data type (as well as the strings 'true', 'false', 'yes', and 'no'). Can also be called via `bool()`.

Supports the same methods of the [`any()`](#any) type.

```javascript
var boolean = Joi.boolean();
boolean.validate(true, function (err, value) { });
```

### `binary`

Generates a schema object that matches a Buffer data type (as well as the strings which will be converted to Buffers).

Supports the same methods of the [`any()`](#any) type.

```javascript
var schema = Joi.binary();
```

#### `binary.encoding(encoding)`

Sets the string encoding format if a string input is converted to a buffer where:
- `encoding` - the encoding scheme.

```javascript
var schema = Joi.binary().encoding('base64');
```

#### `binary.min(limit)`

Specifies the minimum length of the buffer where:
- `limit` - the lowest size of the buffer.

```javascript
var schema = Joi.binary().min(2);
```

#### `binary.max(limit)`

Specifies the maximum length of the buffer where:
- `limit` - the highest size of the buffer.

```javascript
var schema = Joi.binary().max(10);
```

#### `binary.length(limit)`

Specifies the exact length of the buffer:
- `limit` - the size of buffer allowed.

```javascript
var schema = Joi.binary().length(5);
```

### `date`

Generates a schema object that matches a date type (as well as a JavaScript date string or number of milliseconds).

Supports the same methods of the [`any()`](#any) type.

```javascript
var date = Joi.date();
date.validate('12-21-2012', function (err, value) { });
```

#### `date.min(date)`

Specifies the oldest date allowed where:
- `date` - the oldest date allowed.

```javascript
var schema = Joi.date().min('1-1-1974');
```

#### `date.max(date)`

Specifies the latest date allowed where:
- `date` - the latest date allowed.

```javascript
var schema = Joi.date().max('12-31-2020');
```

### `func`

Generates a schema object that matches a function type.

Supports the same methods of the [`any()`](#any) type.

```javascript
var func = Joi.func();
func.validate(function () {}, function (err, value) { });
```

### `number`

Generates a schema object that matches a number data type (as well as strings that can be converted to numbers).

Supports the same methods of the [`any()`](#any) type.

```javascript
var number = Joi.number();
number.validate(5, function (err, value) { });
```

#### `number.min(limit)`

Specifies the minimum value where:
- `limit` - the minimum value allowed.

```javascript
var schema = Joi.number().min(2);
```

#### `number.max(limit)`

Specifies the maximum value where:
- `limit` - the maximum value allowed.

```javascript
var schema = Joi.number().max(10);
```

#### `number.integer()`

Requires the number to be an integer (no floating point).

```javascript
var schema = Joi.number().integer();
```

### `object`

Generates a schema object that matches an object data type (as well as JSON strings that parsed into objects). Defaults
to allowing any child key.

Supports the same methods of the [`any()`](#any) type.

```javascript
var object = Joi.object().keys({
    a: Joi.number().min(1).max(10).integer(),
    b: 'some string'
});

object.validate({ a: 5 }, function (err, value) { });
```

#### `object.keys([schema])`

Sets the allowed object keys where:
- `schema` - optional object where each key is assinged a **joi** type object. If `schema` is `{}` no keys allowed.
  If `schema` is `null` or `undefined`, any key allowed. If `schema` is an object with keys, the keys are added to any
  previously defined keys (but narrows the selection if all keys previously allowed). Defaults to 'undefined' which
  allows any child key.

```javascript
var object = Joi.object().keys({
    a: Joi.number()
    b: Joi.string()
});
```

#### `object.min(limit)`

Specifies the minimum number of keys in the object where:
- `limit` - the lowest number of keys allowed.

```javascript
var schema = Joi.object().min(2);
```

#### `object.max(limit)`

Specifies the maximum number of keys in the object where:
- `limit` - the highest number of object keys allowed.

```javascript
var schema = Joi.object().max(10);
```

#### `object.length(limit)`

Specifies the exact number of keys in the object where:
- `limit` - the number of object keys allowed.

```javascript
var schema = Joi.object().length(5);
```

#### `object.and(peers)`

Defines an all-or-nothing relationship between keys where if one of the peers is present, all of them are required as
well where:
- `peers` - the key names of which if one present, all are required. `peers` can be a single string value, an
  array of string values, or each peer provided as an argument.

```javascript
var schema = Joi.object().keys({
    a: Joi.any(),
    b: Joi.any()
}).and('a', 'b');
```

#### `object.or(peers)`

Defines a relationship between keys where one of the peers is required (and more than one is allowed) where:
- `peers` - the key names of which at least one must appear. `peers` can be a single string value, an
  array of string values, or each peer provided as an argument.

```javascript
var schema = Joi.object().keys({
    a: Joi.any(),
    b: Joi.any()
}).or('a', 'b');
```

#### `object.xor(peers)`

Defines an exclusive relationship between a set of keys where one of them is required but not at the same time where:
- `peers` - the exclusive key names that must not appear together but where one of them is required. `peers` can be a single string value, an
  array of string values, or each peer provided as an argument.

```javascript
var schema = Joi.object().keys({
    a: Joi.any(),
    b: Joi.any()
}).xor('a', 'b');
```

#### `object.with(key, peers)`

Requires the presence of other keys whenever the specified key is present where:
- `key` - the reference key.
- `peers` - the required peer key names that must appear together with `key`. `peers` can be a single string value or an array of string values.

Note that unlike [`object.and()`](#objectandpeers), `with()` creates a dependency only between the `key` and each of the `peers`, not
between the `peers` themselves.

```javascript
var schema = Joi.object().keys({
    a: Joi.any(),
    b: Joi.any()
}).with('a', 'b');
```

#### `object.without(key, peers)`

Forbids the presence of other keys whenever the specified is present where:
- `key` - the reference key.
- `peers` - the forbidden peer key names that must not appear together with `key`. `peers` can be a single string value or an array of string values.

```javascript
var schema = Joi.object().keys({
    a: Joi.any(),
    b: Joi.any()
}).without('a', ['b']);
```

#### `object.rename(from, to, [options])`

Renames a key to another name (deletes the renamed key) where:
- `from` - the original key name.
- `to` - the new key name.
- `options` - an optional object with the following optional keys:
    - `alias` - if `true`, does not delete the old key name, keeping both the new and old keys in place. Defaults to `false`.
    - `multiple` - if `true`, allows renaming multiple keys to the same destination where the last rename wins. Defaults to `false`.
    - `override` - if `true`, allows renaming a key over an existing key. Defaults to `false`.

Keys are renamed before any other validation rules are applied.

```javascript
var object = Joi.object().keys({
    a: Joi.number()
}).rename('b', 'a');

object.validate({ b: 5 }, function (err, value) { });
```

#### `object.assert(ref, schema, message)`

Verifies an assertion where:
- `ref` - the key name or [reference](#refkey-options).
- `schema` - the validation rules required to satisfy the assertion. If the `schema` includes references, they are resolved against
  the object value, not the value of the `ref` target.
- `message` - human-readable message used when the assertion fails.

```javascript
var schema = Joi.object().keys({
    a: {
        b: Joi.string(),
        c: Joi.number()
    },
    d: {
        e: Joi.any()
    }
}).assert('d.e', Joi.ref('a.c'), 'equal to a.c');
```

#### `object.unknown([allow])`

Overrides the handling of unknown keys for the scope of the current object only (does not apply to children) where:
- `allow` - if `false`, unknown keys are not allowed, otherwise unknown keys are ignored.

```javascript
var schema = Joi.Object({ a: Joi.any() }).unknown();
```

### `string`

Generates a schema object that matches a string data type. Note that empty strings are not allowed by default and must be enabled with `allow('')`.

Supports the same methods of the [`any()`](#any) type.

```javascript
var schema = Joi.string().min(1).max(10);
schema.validate('12345', function (err, value) { });
```

#### `string.insensitive()`

Allows the value to match any whitelist of blacklist item in a case insensitive comparison.

```javascript
var schema = Joi.string().valid('a').insensitive();
```

#### `string.min(limit, [encoding])`

Specifies the minimum number string characters where:
- `limit` - the minimum number of string characters required.
- `encoding` - is specified, the string length is calculated in bytes using the provided encoding.

```javascript
var schema = Joi.string().min(2);
```

#### `string.max(limit, [encoding])`

Specifies the maximum number of string characters where:
- `limit` - the maximum number of string characters allowed.
- `encoding` - is specified, the string length is calculated in bytes using the provided encoding.

```javascript
var schema = Joi.string().max(10);
```

#### `string.length(limit, [encoding])`

Specifies the exact string length required where:
- `limit` - the required string length.
- `encoding` - is specified, the string length is calculated in bytes using the provided encoding.

```javascript
var schema = Joi.string().length(5);
```

#### `string.regex(pattern)`

Defines a regular expression rule where:
- `pattern` - a regular expression object the string value must match against.

```javascript
var schema = Joi.string().regex(/^[abc]+$/);
```

#### `string.alphanum()`

Requires the string value to only contain a-z, A-Z, and 0-9.

```javascript
var schema = Joi.string().alphanum();
```

#### `string.token()`

Requires the string value to only contain a-z, A-Z, 0-9, and underscore _.

```javascript
var schema = Joi.string().token();
```

#### `string.email()`

Requires the string value to be a valid email address.

```javascript
var schema = Joi.string().email();
```

#### `string.guid()`

Requires the string value to be a valid GUID.

```javascript
var schema = Joi.string().guid();
```

#### `string.isoDate()`

Requires the string value to be in valid ISO 8601 date format.

```javascript
var schema = Joi.string().isoDate();
```

#### `string.hostname()`

Requires the string value to be a valid hostname as per [RFC1123](http://tools.ietf.org/html/rfc1123).

```javascript
var schema = Joi.string().hostname();
```

### `alternatives`

Generates a type that will match one of the provided alternative schemas via the [`try()`](#alternativestryschemas)
method. If no schemas are added, the type will not match any value except for `undefined`.

Supports the same methods of the [`any()`](#any) type.

Alternatives can be expressed using the shorter `[]` notation.

```javascript
var alt = Joi.alternatives().try(Joi.number(), Joi.string());
// Same as [Joi.number(), Joi.string()]
```

#### `alternatives.try(schemas)``

Adds an alternative schema type for attempting to match against the validated value where:
- `schema` - an array of alternative **joi** types. Also supports providing each type as a separate argument.

```javascript
var alt = Joi.alternatives().try(Joi.number(), Joi.string());
alt.validate('a', function (err, value) { });
```

#### `alternatives.when(ref, options)`

Adds a conditional alternative schema type based on another key value where:
- `ref` - the key name or [reference](#refkey-options).
- `options` - an object with:
    - `is` - the required condition **joi** type.
    - `then` - the alternative schema type if the condition is true. Required if `otherwise` is missing.
    - `otherwise` - the alternative schema type if the condition is false. Required if `then` is missing.

```javascript
var schema = {
    a: Joi.alternatives().when('b', { is: 5, then: Joi.string(), otherwise: Joi.number() }),
    b: Joi.any()
};
```

### `forbidden()`

Generates a type that will not match any value except `undefined`. Used to explicitly forbid keys, or in combination with
`object.unknown(true)`.

```javascript
var schema = {
    a: Joi.forbidden()
};
```

### `ref(key, [options])`

Generates a reference to the value of the named key. References are resolved at validation time and in order of dependency
so that if one key validation depends on another, the dependent key is validated second after the reference is validated.
References support the following arguments:
- `key` - the reference target. References cannot point up the object tree, only to siebling keys, but they can point to
  children (e.g. 'a.b.c') using the `.` separator.
- `options` - optional settings:
    - `separator` - override the default `.` hierarchy separator.

Note that references can only be used where explicitly supported such as in `valid()` or `invalid()` rules. If upwards
(parents) references are needed, use [`object.assert()`](#objectassertref-schema-message).

```javascript
var schema = Joi.object().keys({
    a: Joi.ref('b.c'),
    b: {
        c: Joi.any()
    }
});

schema.validate({ a: 5, b: { c: 5 } }, function (err, value) {});
```
