<a href="https://github.com/spumko"><img src="https://raw.github.com/spumko/spumko/master/images/from.png" align="right" /></a>
![joi Logo](https://raw.github.com/spumko/joi/master/images/joi.png)

Object schema description language and validator for JavaScript objects.

Current version: **2.9.x**

[![Build Status](https://secure.travis-ci.org/spumko/joi.png)](http://travis-ci.org/spumko/joi)


## Table of Contents

<img src="https://raw.github.com/spumko/joi/master/images/validation.png" align="right" />
- [Example](#example)
- [Usage](#usage)
    - [`validate(value, schema, options)`](#validatevalue-schema-options)
    - [`any()`](#any)
        - [`any.allow(value)`](#anyallowvalue)
        - [`any.valid(value)`](#anyvalidvalue)
        - [`any.invalid(value)`](#anyinvalidvalue)
        - [`any.required()`](#anyrequired)
        - [`any.optional()`](#anyoptional)
        - [`any.with(peer)`](#anywithpeer)
        - [`any.without(peer)`](#anywithoutpeer)
        - [`any.xor(peer)`](#anyxorpeer)
        - [`any.or(peer)`](#anyorpeer)
        - [`description(desc)`](#descriptiondesc)
        - [`any.notes(notes)`](#anynotesnotes)
        - [`any.tags(tags)`](#anytagstags)
        - [`any.options(options)`](#anyoptionsoptions)
        - [`any.strict()`](#anystrict)
        - [`any.rename(to, [options])`](#anyrenameto-options)
        - [`any.default(value)`](#anydefault)
    - [`array()`](#array)
        - [`array.includes(type)`](#arrayincludestype)
        - [`array.excludes(type)`](#arrayexcludestype)
        - [`array.min(limit)`](#arrayminlimit)
        - [`array.max(limit)`](#arraymaxlimit)
        - [`array.length(limit)`](#arraylengthlimit)
    - [`boolean()`](#boolean)
    - [`date()`](#date)
        - [`date.min(date)`](#datemindate)
        - [`date.max(date)`](#datemaxdate)
    - [`func()`](#func)
    - [`number()`](#number)
        - [`number.min(limit)`](#numberminlimit)
        - [`number.max(limit)`](#numbermaxlimit)
        - [`number.integer()`](#numberinteger)
    - [`object(schema)`](#objectschema)
    - [`string()`](#string)
        - [`string.insensitive()`](#stringinsensitive)
        - [`string.min(limit)`](#stringminlimit)
        - [`string.max(limit)`](#stringmaxlimit)
        - [`string.length(limit)`](#stringlengthlimit)
        - [`string.regex(pattern)`](#stringregexpattern)
        - [`string.alphanum()`](#stringalphanum)
        - [`string.token()`](#stringtoken)
        - [`string.email()`](#stringemail)
    - [`alternatives(types)`](#alternativestypes)
- [Migration notes](#migration-notes)


# Example

```javascript
var Joi = require('joi');

var schema = {
    username: Joi.string().alphanum().min(3).max(30).with('birthyear').required(),
    password: Joi.string().regex(/[a-zA-Z0-9]{3,30}/).without('access_token'),
    access_token: [Joi.string(), Joi.number()],
    birthyear: Joi.number().integer().min(1900).max(2013),
    email: Joi.string().email()
};

var err = Joi.validate({ username: 'abc', birthyear: 1994 }, schema);  // err === null -> valid
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

Then the value is validated against the schema:

```javascript
var err = Joi.validate({ a: 'a string' }, schema);
```

If the value is valid, `null` is returned, otherwise an `Error` object.

The schema can be a plain JavaScript object where every key is assigned a **joi** type, or it can be a **joi** type directly:

```javascript
var schema = Joi.string().min(10);
```

If the schema is a **joi** type, the `schema.validate(value)` can be called directly on the type. When passing a non-type schema object,
the module converts it internally to an object() type equivalent to:

```javascript
var schema = Joi.object({
    a: Joi.string()
});
```

When validating a schema:
* Keys are optional by default.
* Strings are utf-8 encoded by default.
* Rules are defined in an additive fashion and evaluated in order after whitelist and blacklist checks.

### `validate(value, schema, options)`

Validates a value using the given schema and options where:
- `value` - the value being validated.
- `schema` - the validation schema. Can be a **joi** type object or a plain object where every key is assigned a **joi** type object.
- `options` - an optional object with the following optional keys:
- `abortEarly` - when `true`, stops validation on the first error, otherwise returns all the errors found. Defaults to `true`.
- `convert` - when `true`, attempts to cast values to the required types (e.g. a string to a number). Defaults to `true`.
- `modify` - when `true`, converted values are written back to the provided value (only when value is an object). Defaults to `false`.
- `allowUnknown` - when `true`, allows object to contain unknown keys which are ignored. Defaults to `false`.
- `skipFunctions` - when `true`, ignores unknown keys with a function value. Defaults to `false`.
- `stripUnknown` - when `true`, unknown keys are deleted (only when value is an object). Defaults to `false`.
- `language` - a localized langugage object using the format of the `languagePath` file. Error formats are looked up in the `language`
  object first, and then in the `languagePath` file. Defaults to no override (`{}`).
- `languagePath` - the location of the language file used to localize error messages. Defaults to `'languages/en-us.json'`.

```javascript
var schema = {
    a: Joi.number()
};

var value = {
    a: '123'
};

var err = Joi.validate(value, schema, { modify: true });

// err -> null
// value.a -> 123 (number, not string)
```

### `any()`

Generates a schema object that matches any data type.

```javascript
var any = Joi.any();
any.valid('a');

var err = any.validate('a');
```

#### `any.allow(value)`

Whitelists a value where:
- `value` - the allowed value which can be of any type and will be matched against the validated value before applying any other rules.
  `value` can be an array of values, or multiple values can be passed as individual arguments.

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
  `value` can be an array of values, or multiple values can be passed as individual arguments.

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
  `value` can be an array of values, or multiple values can be passed as individual arguments.

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
    var schema = {
    a: Joi.any().required()
};
```

#### `any.optional()`

Marks a key as optional which will allow `undefined` as values. Used to annotate the schema for readability as all keys are optional by default.

```javascript
var schema = {
    a: Joi.any().optional()
};
```

#### `any.with(peer)`

Requires the presence of another key whenever this value is present where:
- `peer` - the required key name that must appear together with the current value. `peer` can be an array of values, or multiple values can be
  passed as individual arguments.

```javascript
var schema = {
    a: Joi.any().with('b'),
    b: Joi.any()
};
```

#### `any.without(peer)`

Forbids the presence of another key whenever this value is present where:
- `peer` - the forbidden key name that must not appear together with the current value. `peer` can be an array of values, or multiple values can be
  passed as individual arguments.

```javascript
var schema = {
    a: Joi.any().without('b'),
    b: Joi.any()
};
```

#### `any.xor(peer)`

Defines an exclusive relationship with another key where this or one of the peers is required but not at the same time where:
- `peer` - the exclusive key name that must not appear together with the current value but where one of them is required. `peer` can be an array
  of values, or multiple values can be passed as individual arguments.

```javascript
var schema = {
    a: Joi.any().xor('b'),
    b: Joi.any()
};
```

#### `any.or(peer)`

Defines a relationship with another key where this or one of the peers is required (and more than one is allowed) where:
- `peer` - the key name that must appear if the current value is missing. `peer` can be an array of values, or multiple
  values can be passed as individual arguments.

```javascript
var schema = {
    a: Joi.any().or('b'),
    b: Joi.any()
};
```

#### `description(desc)`

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

#### `any.options(options)`

Overrides the global `validate()` options for the current key and any sub-key where:
- `options` - an object with the same optional keys as [`Joi.validate(value, schema, options)`](#joivalidatevalue-schema-options).

```javascript
var schema = {
    a: Joi.any().options({ modify: true })
};
```

#### `any.strict()`

Sets the `options.convert` options to `false` which prevent type casting for the current key and any child keys.

```javascript
var schema = {
    a: Joi.any().strict()
};
```

#### `any.rename(to, [options])`

Renames a key to another name where:
- `to` - the new key name.
- `options` - an optional object with the following optional keys:
    - `move` - if `true`, deletes the old key name, otherwise both old and new keys are kept. Defaults to `false`.
    - `multiple` - if `true`, allows renaming multiple keys to the same destination where the last rename wins. Defaults to `false`.
    - `override` - if `true`, allows renaming a key over an existing key. Defaults to `false`.

#### `any.default(value)`

Sets a default value if the original value is undefined where:
- `value` - the value.

```javascript
var schema = {
    username: Joi.string().default('new_user')
};
var input = {};
Joi.validate(input, schema);
// input === { username: "new_user" }
```

### `array()`

Generates a schema object that matches an array data type.

Supports the same methods of the [`any()`](#any) type.

```javascript
var array = Joi.array();
array.includes(Joi.string().valid('a', 'b'));

var err = array.validate(['a', 'b', 'a']);
```

#### `array.includes(type)`

List the types allowed for the array values where:
- `type` - a **joi** schema object to validate each array item against. `type` can be an array of values, or multiple values can be passed as individual arguments.

```javascript
var schema = {
    a: Joi.array().includes(Joi.string(), Joi.number())
};
```

#### `array.excludes(type)`

List the types forbidden for the array values where:
- `type` - a **joi** schema object to validate each array item against. `type` can be an array of values, or multiple values can be passed as individual arguments.

```javascript
var schema = {
    a: Joi.array().excludes(Joi.object())
};
```

#### `array.min(limit)`

Specifies the minimum number of items in the array where:
- `limit` - the lowest number of array items allowed.

```javascript
var schema = {
    a: Joi.array().min(2)
};
```

#### `array.max(limit)`

Specifies the maximum number of items in the array where:
- `limit` - the highest number of array items allowed.

```javascript
var schema = {
    a: Joi.array().max(10)
};
```

#### `array.length(limit)`

Specifies the exact number of items in the array where:
- `limit` - the number of array items allowed.

```javascript
var schema = {
    a: Joi.array().length(5)
};
```

### `boolean()`

Generates a schema object that matches a boolean data type (as well as the strings 'true', 'false', 'yes', and 'no'). Can also be called via `bool()`.

Supports the same methods of the [`any()`](#any) type.

```javascript
var boolean = Joi.boolean();
boolean.allow(null);

var err = boolean.validate(true);
```

### `date()`

Generates a schema object that matches a date type (as well as a JavaScript date string or number of milliseconds).

Supports the same methods of the [`any()`](#any) type.

```javascript
var date = Joi.date();
date.min('12-20-2012');

var err = date.validate('12-21-2012');
```

#### `date.min(date)`

Specifies the oldest date allowed where:
- `date` - the oldest date allowed.

```javascript
var schema = {
    a: Joi.date().min('1-1-1974')
};
```

#### `date.max(date)`

Specifies the latest date allowed where:
- `date` - the latest date allowed.

```javascript
var schema = {
    a: Joi.date().max('12-31-2020')
};
```

### `func()`

Generates a schema object that matches a function type.

Supports the same methods of the [`any()`](#any) type.

```javascript
var func = Joi.func();
func.allow(null);

var err = func.validate(function () {});
```

### `number()`

Generates a schema object that matches a number data type (as well as strings that can be converted to numbers).

Supports the same methods of the [`any()`](#any) type.

```javascript
var number = Joi.number();
number.min(1).max(10).integer();

var err = number.validate(5);
```

#### `number.min(limit)`

Specifies the minimum value where:
- `limit` - the minimum value allowed.

```javascript
var schema = {
    a: Joi.number().min(2)
};
```

#### `number.max(limit)`

Specifies the maximum value where:
- `limit` - the maximum value allowed.

```javascript
var schema = {
    a: Joi.number().max(10)
};
```

#### `number.integer()`

Requires the number to be an integer (no floating point).

```javascript
var schema = {
    a: Joi.number().integer()
};
```

### `object(schema)`

Generates a schema object that matches an object data type (as well as JSON strings that parsed into objects) where:
- `schema` - optional object where each key is assinged a **joi** type object. If the schema is `{}` no keys allowed.
  Defaults to 'undefined' which allows any child key.

Supports the same methods of the [`any()`](#any) type.

```javascript
var object = Joi.object({
    a: Joi.number.min(1).max(10).integer()
});

var err = object.validate({ a: 5 });
```

### `string()`

Generates a schema object that matches a string data type. Note that empty strings are not allowed by default and must be enabled with `allow('')`.

Supports the same methods of the [`any()`](#any) type.

```javascript
var string = Joi.string();
string.min(1).max(10);

var err = string.validate('12345');
```

#### `string.insensitive()`

Allows the value to match any whitelist of blacklist item in a case insensitive comparison.

```javascript
var schema = {
    a: Joi.string().valid('a').insensitive()
};
```

#### `string.min(limit)`

Specifies the minimum number string characters where:
- `limit` - the minimum number of string characters required.

```javascript
var schema = {
    a: Joi.string().min(2)
};
```

#### `string.max(limit)`

Specifies the maximum number of string characters where:
- `limit` - the maximum number of string characters allowed.

```javascript
var schema = {
    a: Joi.string().max(10)
};
```

#### `string.length(limit)`

Specifies the exact string length required where:
- `limit` - the required string length.

```javascript
var schema = {
    a: Joi.string().length(5)
};
```

#### `string.regex(pattern)`

Defines a regular expression rule where:
- `pattern` - a regular expression object the string value must match against.

```javascript
var schema = {
    a: Joi.string().regex(/^[abc]+$/)
};
```

#### `string.alphanum()`

Requires the string value to only contain a-z, A-Z, and 0-9.

```javascript
var schema = {
    a: Joi.string().alphanum()
};
```

#### `string.token()`

Requires the string value to only contain a-z, A-Z, 0-9, and underscore _.

```javascript
var schema = {
    a: Joi.string().token()
};
```

#### `string.email()`

Requires the string value to be a valid email address.

```javascript
var schema = {
    a: Joi.string().email()
};
```

#### `string.guid()`

Requires the string value to be a valid GUID.

```javascript
var schema = {
    a: Joi.string().guid()
};
```

#### `string.isoDate()`

Requires the string value to be in valid ISO 8601 date format.

```javascript
var schema = {
    a: Joi.string().isoDate()
};
```

### `alternatives(types)`

Generates a type that will match one of the provided alternative schemas where:
- `types` - an array of alternaitve **joi** types. Also supports providing each type as a separate argument.

Supports the same methods of the [`any()`](#any) type.

```javascript
var alt = Joi.alternatives(Joi.number(), Joi.string());
var err = alt.validate('a');
```

Note that the `alternatives()` type does not behave the same way as passing multiple alternatives directly using an
array of types (e.g. `{ a: [Joi.number(), Joi.string()] }`). When passing an array directly, the value must match one
of the provided types while when using the `alternatives()` type, the key is optional by default.

# Migration notes

**joi** 2.0 is a complete rewrite of the previous version. While largely backward compatible, it includes a few changes that are
not as well as a large number of bug fixes that dramatically changes existing behavior. The following is an incomplete list of changes.
Please test your existing validation rules to ensure they behave as expected with this new version.

* `Joi.types` and `Joi.Types` deprecated - use `Joi.string()` etc. instead.
* Uppercase type names deprecated - use lowercase function names instead.
* Top level global config options no longer supported (e.g. `{ languagePath: './file.json' }`). Use the `.options()` method instead.
* `noShortCircuit()` no longer supported - use the `abortEarly` option instead.
* Options renamed:
    * `saveConversions` changed to `modify`.
    * `skipConversions` changed to `convert` (with reversed meaning).
    * `stripExtraKeys` changed to `stripUnknown`.
    * `allowExtraKeys` changed to `allowUnknown`.
    * In `rename()` options:
        * `deleteOrig` changed to `move`.
        * `allowMult` changed to `multiple`.
        * `allowOverwrite` changed to `override`.
* `nullOk()` and `emptyOk()` are deprecated - use `allow(null)` and `allow('')` instead.
* `number().float()` no longer supported.
* Completely new internal representation of the data. If you were accessing _variables, your code is most likely broken now. Use `describe()` instead.
* `string().alphanum()` no longer allows spaces and underscores and does not take an arguement.
* `string().date()` no longer supported - use new `date()` type.
* `deny()` deprecated - use `invalid()` instead.
* `array().includes()` and `array.excludes()` now validates correctly (not just the base type).
* `allow()`, `valid()`, and `invalid()` values are now compared against the original and converted values (not just after conversion).
* `string().min()` no longer implies `required()`.




