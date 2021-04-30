
### Introduction

**joi** lets you describe your data using a simple, intuitive, and readable language.

#### Example

```js
const Joi = require('joi');

const schema = Joi.object({
    username: Joi.string()
        .alphanum()
        .min(3)
        .max(30)
        .required(),

    password: Joi.string()
        .pattern(new RegExp('^[a-zA-Z0-9]{3,30}$')),

    repeat_password: Joi.ref('password'),

    access_token: [
        Joi.string(),
        Joi.number()
    ],

    birth_year: Joi.number()
        .integer()
        .min(1900)
        .max(2013),

    email: Joi.string()
        .email({ minDomainSegments: 2, tlds: { allow: ['com', 'net'] } })
})
    .with('username', 'birth_year')
    .xor('password', 'access_token')
    .with('password', 'repeat_password');


schema.validate({ username: 'abc', birth_year: 1994 });
// -> { value: { username: 'abc', birth_year: 1994 } }

schema.validate({});
// -> { value: {}, error: '"username" is required' }

// Also -

try {
    const value = await schema.validateAsync({ username: 'abc', birth_year: 1994 });
}
catch (err) { }
```

The above schema defines the following constraints:
* `username`
    * a required string
    * must contain only alphanumeric characters
    * at least 3 characters long but no more than 30
    * must be accompanied by `birth_year`
* `password`
    * an optional string
    * must satisfy the custom regex pattern
    * cannot appear together with `access_token`
    * must be accompanied by `repeat_password` and equal to it
* `access_token`
    * an optional, unconstrained string or number
* `birth_year`
    * an integer between 1900 and 2013
* `email`
    * a valid email address string
    * must have two domain parts e.g. `example.com`
    * TLD must be `.com` or `.net`

### General Usage

Usage is a two steps process:

First, a schema is constructed using the provided types and constraints:

```js
const schema = Joi.object({
    a: Joi.string()
});
```

Note that **joi** schema objects are immutable which means every additional rule added (e.g.
`.min(5)`) will return a new schema object.

Second, the value is validated against the defined schema:

```js
const { error, value } = schema.validate({ a: 'a string' });
```

If the input is valid, then the `error` will be `undefined`. If the input is invalid, `error` is assigned
a [`ValidationError`](https://github.com/sideway/joi/blob/master/API.md#validationerror) object
providing more information.

The schema can be a plain JavaScript object where every key is assigned a **joi** type, or it can be a **joi** type directly:

```js
const schema = Joi.string().min(10);
```

If the schema is a **joi** type, the `schema.validate(value)` can be called directly on the type. When passing a non-type schema object,
the module converts it internally to an object() type equivalent to:

```js
const schema = Joi.object().keys({
    a: Joi.string()
});
```

When validating a schema:

* Values (or keys in case of objects) are optional by default.

    ```js
    Joi.string().validate(undefined); // validates fine
    ```

    To disallow this behavior, you can either set the schema as `required()`, or set `presence` to `"required"` when passing `options`:

    ```js
    Joi.string().required().validate(undefined);
    // or
    Joi.string().validate(undefined, /* options */ { presence: "required" });
    ```

* Strings are utf-8 encoded by default.
* Rules are defined in an additive fashion and evaluated in order, first the inclusive rules, then the exclusive rules.

### `assert(value, schema, [message], [options])`

Validates a value against a schema and [throws](#errors) if validation fails where:
- `value` - the value to validate.
- `schema` - the validation schema. Can be a **joi** type object or a plain object where every key is assigned a **joi** type object using [`Joi.compile`](#compileschema-options) (be careful of the cost of compiling repeatedly the same schemas).
- `message` - optional message string prefix added in front of the error message. may also be an Error object.
- `options` - optional options object, passed in to [`any.validate`](#anyvalidatevalue-options)

```js
Joi.assert('x', Joi.number());
```

### `attempt(value, schema, [message], [options])`

Validates a value against a schema, returns valid object, and [throws](#errors) if validation fails where:
- `value` - the value to validate.
- `schema` - the validation schema. Can be a **joi** type object or a plain object where every key is assigned a **joi** type object using [`Joi.compile`](#compileschema-options) (be careful of the cost of compiling repeatedly the same schemas).
- `message` - optional message string prefix added in front of the error message. may also be an Error object.
- `options` - optional options object, passed in to [`any.validate`](#anyvalidatevalue-options)

```js
Joi.attempt('x', Joi.number()); // throws error
const result = Joi.attempt('4', Joi.number()); // result -> 4
```

### `cache.provision([options])`

Provisions a simple LRU cache for caching simple inputs (`undefined`, `null`, strings, numbers, and
booleans) where:
- `options` - optional settings:
    - `max` - number of items to store in the cache before the least used items are dropped.
      Defaults to `1000`.

### `checkPreferences(prefs)`

Checks if the provided preferences are valid where:
- `prefs` - the preferences object to validate.

Throws an exception if the `prefs` object is invalid.

The method is provided to perform inputs validation for the [`any.validate()`](#anyvalidatevalue-options)
and [`any.validateAsync()`](#anyvalidateasyncvalue-options) methods. Validation is not performed
automatically for performance reasons. Instead, manually validate the preferences passed once and
reuse.

### `compile(schema, [options])`

Converts literal schema definition to **joi** schema object (or returns the same back if already a
**joi** schema object) where:
- `schema` - the schema definition to compile.
- `options` - optional settings:
    - `legacy` - if `true` and the provided schema is (or contains parts) using an older version of
      **joi**, will return a compiled schema that is compatible with the older version. If `false`,
      the schema is always compiled using the current version and if older schema components are
      found, an error is thrown.

```js
const definition = ['key', 5, { a: true, b: [/^a/, 'boom'] }];
const schema = Joi.compile(definition);

// Same as:

const schema = Joi.alternatives().try(
    Joi.string().valid('key'),
    Joi.number().valid(5),
    Joi.object({
        a: Joi.boolean().valid(true),
        b: Joi.alternatives().try(
            Joi.string().pattern(/^a/),
            Joi.string().valid('boom')
        )
    })
);
```

### `defaults(modifier)`

Creates a new **joi** instance that applies the provided modifier function to every new schemas
where:
- `modifier` - a function with signature `function(schema)` that must return a schema object.

```js
const custom = Joi.defaults((schema) => {

    switch (schema.type) {
        case 'string':
            return schema.allow('');
        case 'object':
            return schema.min(1);
        default:
            return schema;
    }
});

const schema = custom.object();   // Returns Joi.object().min(1)
```

### `expression(template, [options])` - aliases: `x`

Generates a dynamic expression using a template string where:
- `template` - the template string using the [template syntax](#template-syntax).
- `options` - optional settings used when creating internal references. Supports the same options
  as [`ref()`](#refkey-options).

#### Template syntax

The template syntax uses `{}` and `{{}}` enclosed formulas to reference values as well as perform number and string operations. Single braces `{}` leave the formula result as-is, while double braces `{{}}` HTML-escape the formula result (unless the template is used for error messages and the `errors.escapeHtml` preference flag is set to `false`).

If the formula is a single reference prefixed with `:` (e.g. `{:#ref}` or `{{:#ref}}`), its values will be wrapped according to the [`wrap`](#anyvalidatevalue-options) validation setting. The `#label` variable is always wrapped according to the `wrap` setting.

The formula uses a simple mathematical syntax such as `a + b * 2` where the named formula variables are references. Most references can be used as-is but some can create ambiguity with the formula syntax and must be enclosed in `[]` braces (e.g. `[.]`).

The formulas can only operate on `null`, booleans, numbers, and strings. If any operation involves a string, all other numbers will be casted to strings (as the internal implementation uses simple JavaScript operators). The supported operators are: `^`, `*`, `/`, `%`, `+`, `-`, `<`, `<=`, `>`, `>=`, `==`, `!=`, `&&`, `||`, and `??` (in this order of precedence).

The reference names can have one of the following prefixes:
- `#` - indicates the variable references a local context value. For example, in errors this is the error context, while in rename operations, it is the regular expression matching groups.
- `$` - indicates the variable references a global context value from the `context` preference object provided as an option to the validation function or set using [`any.prefs()`](#anyprefsoptions--aliases-preferences-options).
- any other variable references a key within the current value being validated.

The formula syntax also supports built-in functions:
- `if(condition, then, otherwise)` - returns `then` when `condition` is truthy, otherwise `otherwise`.
- `msg(code)` - embeds another error code message.
- `number(value)` - cast value to a number.

And the following constants:
- `null`
- `true`
- `false`

### `extend(...extensions)`

Creates a new customized instance of the **joi** module where:
- `extensions` - the extensions configurations as described in [Extensions](#extensions).

Note that the original **joi** module is not modified by this.

### `in(ref, [options])`

Creates a [reference](#refkey-options) that when resolved, is used as an array of values to match against the rule, where:
- `ref` - same as [`Joi.ref()`](#refkey-options).
- `options` - same as [`Joi.ref()`](#refkey-options).

Can only be used in rules that support in-references.

```js
const schema = Joi.object({
    a: Joi.array().items(Joi.number()),
    b: Joi.number().valid(Joi.in('a'))
});
```

### `isError(err)`

Checks whether or not the provided argument is a validation error.

```js
Joi.isError(new Error()); // returns false
```

### `isExpression(expression)`

Checks whether or not the provided argument is an expression.

```js
const expression = Joi.x('{a}');
Joi.isExpression(expression); // returns true
```

### `isRef(ref)`

Checks whether or not the provided argument is a reference. Useful if you want to post-process error messages.

```js
const ref = Joi.ref('a');
Joi.isRef(ref); // returns true
```

### `isSchema(schema, [options])`

Checks whether or not the provided argument is a **joi** schema where:
- `schema` - the value being checked.
- `options` - optional settings:
    - `legacy` - if `true`, will identify schemas from older versions of joi, otherwise will throw an error. Defaults to `false`.

```js
const schema = Joi.any();
Joi.isSchema(schema); // returns true
```

### `override`

A special value used with `any.allow()`, `any.invalid()`, and `any.valid()` as the first value to reset any previously set values.

```js
Joi.valid(1).valid(Joi.override, 2);

// Same as:

Joi.valid(2);

// Whereas:

Joi.valid(1).valid(2);

// Is the same as:

Joi.valid(1, 2);
```

### `ref(key, [options])`

Generates a reference to the value of the named key. References are resolved at validation time and in order of dependency so that if one key validation depends on another, the dependent key is validated second after the reference is validated.

References support the following arguments:
- `key` - the reference target. References can point to sibling keys (`a.b`) or ancestor keys (`...a.b`) using the `.` separator. If a `key` starts with `$` is signifies a context reference which is looked up in the `context` option object. The `key` can start with one or more separator characters to indicate a [relative starting point](#Relative-references).
- `options` - optional settings:
    - `adjust` - a function with the signature `function(value)` where `value` is the resolved reference value and the return value is the adjusted value to use. For example `(value) => value + 5` will add 5 to the resolved value. Note that the `adjust` feature will not perform any type validation on the adjusted value and it must match the value expected by the rule it is used in. Cannot be used with `map`.
    - `map` - an array of array pairs using the format `[[key, value], [key, value]]` used to maps the resolved reference value to another value. If the resolved value is not in the map, it is returned as-is. Cannot be used with `adjust`.
    - `prefix` - overrides default prefix characters key string prefix. Can be set to `false` to disable all prefix parsing (treat keys as literal strings), or an object with specific overrides for:
      - `global` - references to the globally provided `context` preference. Defaults to `'$'`.
      - `local` - references to error-specific or rule specific context. Defaults to `'#'`.
      - `root` - references to the root value being validated. Defaults to `'/'`.
    - `separator` - overrides the default `.` hierarchy separator. Set to `false` to treat the `key` as a literal value.
    - `ancestor` - if set to a number, sets the reference [relative starting point](#Relative-references). Cannot be combined with separator prefix characters. Defaults to the reference key prefix (or `1` if none present).
    - `in` - creates an [in-reference](#inref-options).
    - `iterables` - when `true`, the reference resolves by reaching into maps and sets.
    - `render` - when `true`, the value of the reference is used instead of its name in error messages and template rendering. Defaults to `false`.

Note that references can only be used where explicitly supported such as in `valid()` or `invalid()` rules. If upwards (parents) references are needed, use [`object.assert()`](#objectassertref-schema-message).

```js
const schema = Joi.object({
    a: Joi.ref('b.c'),
    b: {
        c: Joi.any()
    },
    c: Joi.ref('$x')
});

await schema.validateAsync({ a: 5, b: { c: 5 } }, { context: { x: 5 } });
```

#### Relative references

By default, a reference is relative to the parent of the current value (the reference key is lookup
up inside the parent). This means that in the schema:

```js
{
    x: {
        a: Joi.any(),
        b: {
            c: Joi.any(),
            d: Joi.ref('c')
        }
    },
    y: Joi.any()
}
```

The reference `Joi.ref('c')` points to `c` which is a sibling of `d` - the reference starting point
is `d`'s parent which is `b`. This schema means that `d` must be equal to `c`.

In order to reference a parent peer, you can use a separator prefix where (using `.` as separator):
- `.` - self
- `..` - parent (same as no prefix)
- `...` - grandparent
- `....` - great-grandparent
- etc.

For example:

```js
{
    x: {
        a: Joi.any(),
        b: {
            c: Joi.any(),
            d: Joi.ref('c'),
            e: Joi.ref('...a'),
            f: Joi.ref('....y')
        }
    },
    y: Joi.any()
}
```

Another way to specify the relative starting point is using the `ancestor` option where:
- 0 - self
- 1 - parent (this is the default value if no key prefix is present)
- 2 - grandparent
- 3 - great-grandparent
- etc.

For example:

```js
{
    x: {
        a: Joi.any(),
        b: {
            c: Joi.any(),
            d: Joi.ref('c', { ancestor: 1 }),
            e: Joi.ref('a', { ancestor: 2 }),
            f: Joi.ref('y', { ancestor: 3 })
        }
    },
    y: Joi.any()
}
```

Note that if a reference tries to reach beyond the value root, validation fails.

To specify an absolute path from the value root, use the `/` prefix:

```js
{
    x: {
        a: Joi.any(),
        b: {
            c: Joi.ref('/x.a')
        }
    }
}
```

### `version`

Property showing the current version of **joi** being used.

### `types()`

Returns an object where each key is a plain joi schema type. Useful for creating type shortcuts
using deconstruction. Note that the types are already formed and do not need to be called as
functions (e.g. `string`, not `string()`).

```js
const Joi = require('joi');
const { object, string } = Joi.types();

const schema = object.keys({
  property: string.min(4)
});
```

### `any`

Generates a schema object that matches any data type.

```js
const any = Joi.any();
await any.validateAsync('a');
```

#### `any.type`

Gets the type of the schema.

```js
const schema = Joi.string();

schema.type === 'string';   // === true
```

#### `any.allow(...values)`

Allows values where:
- `values` - one or more allowed values which can be of any type and will be matched against the validated value before applying any other rules. Supports [references](#refkey-options) and [in-references](#inref-options). If the first value is [`Joi.override`](#override), will override any previously set values.

Note that this list of allowed values is in *addition* to any other permitted values.
To create an exclusive list of values, see [`any.valid(value)`](#anyvalidvalues---aliases-equal).

```js
const schema = {
    a: Joi.any().allow('a'),
    b: Joi.any().allow('b', 'B')
};
```

#### `any.alter(targets)`

Assign target alteration options to a schema that are applied when [`any.tailor()`](#anytailortargets)
is called where:
- `targets` - an object where each key is a target name, and each value is a function with signature
  `function(schema)` that returns a schema.

```js
const schema = Joi.object({
    key: Joi.string()
        .alter({
            get: (schema) => schema.required(),
            post: (schema) => schema.forbidden()
        })  
});

const getSchema = schema.tailor('get');
const postSchema = schema.tailor('post');
```

#### `any.artifact(id)`

Assigns the schema an artifact id which is included in the validation result if the rule passed validation where:
- `id` - any value other than `undefined` which will be returned as-is in the result `artifacts` map.

```js
const schema = {
    a: [
        Joi.number().max(10).artifact('under'),
        Joi.number().min(11).artifact('over')
    ]
};
```

#### `any.cache([cache])`

Adds caching to the schema which will attempt to cache the validation results (success and
failures) of incoming inputs where:
- `cache` - an optional cache implementation compatible with the built-in cache provided by
  [`cache.provision()`](#cacheprovisionoptions). If no `cache` is passed, a default cache
  is provisioned by using [`cache.provision()`](#cacheprovisionoptions) internally.

Note that deciding which inputs to cache is left to the cache implementation. The built-in
cache will only store simple values such as `undefined`, `null`, strings, numbers, and booleans.
Any changes to the schema after `any.cache()` is called will disable caching on the resulting
schema. this means that if `.cache()` is not the last statement in a schema definition, caching
will be disabled.

To disable caching for an entire schema in runtime, pass the `cache` preference set to `false`.

Caching ignores changes to runtime preference. This means that if you run `schema.validate()`
onces using one set of preferences, and then again using another set (for example, changing the
language), the cached results will be based on the first set of preferences.

Before using caching, it is recommended to consider the performance gain as it will not speed up
every schema. Schemas using `.valid()` list will not benefit from caching.

Caching will be ignored when the schema uses references outside of the value scope.

##### Cache interface

Custom cache implementation must implement the following interface:

```js
class {
    set(key, value) {}
    get(key) { return found ? value : undefined; }
}
```

Note that `key` and `value` can be anything including objects, array, etc. It is recommended to limit the size of the cache when validating external data in order to prevent an attacker from increasing the process memory usage by sending large amount of different data to validate.

#### `any.cast(to)`

Casts the validated value to the specified type where:
- `to` - the value target type. Each **joi** schema type supports its own set of cast targets:
    - `'map'` - supported by the `Joi.object()` type, converts the result to a `Map` object containing the object key-value pairs.
    - `'number'` - supported by `Joi.boolean()` and `Joi.date()`, converts the result to a number. For dates, number of milliseconds since the epoch and for booleans, `0` for `false` and `1` for `true`.
    - `'set'` - supported by the `Joi.array()` type, converts the result to a `Set` object containing the array values.
    - `'string'` - supported by `Joi.binary()`, `Joi.boolean()`, `Joi.date()`, and `Joi.number()`, converts the result to a string.

#### `any.concat(schema)`

Returns a new type that is the result of adding the rules of one type to another where:
- `schema` - a **joi** type to merge into the current schema. Can only be of the same type as the context type or `any`. If applied to an `any` type, the schema can be any other schema.

```js
const a = Joi.string().valid('a');
const b = Joi.string().valid('b');
const ab = a.concat(b);
```

#### `any.custom(method, [description])`

Adds a custom validation function to execute arbitrary code where:
- `method` - the custom (synchronous only) validation function using signature `function(value, helpers)` where:
    - `value` - the value being validated.
    - `helpers` - an object with the following helpers:
        - `schema` - the current schema.
        - `state` - the current validation state.
        - `prefs` - the current preferences.
        - `original` - the original value passed into validation before any conversions.
        - `error(code, [local])` - a method to generate error codes using a message code and optional local context.
        - `message(messages, [local])` - a method to generate an error with an internal `'custom'` error code and the provided messages object to use as override. Note that this is much slower than using the preferences `messages` option but is much simpler to write when performance is not important.
        - `warn(code, [local])` - a method to add a warning using a message code and optional local context.

Note: if the method fails to return a value, the value will be unset or returned as `undefined`.

```js
const method = (value, helpers) => {

    // Throw an error (will be replaced with 'any.custom' error)
    if (value === '1') {
        throw new Error('nope');
    }

    // Replace value with a new value
    if (value === '2') {
        return '3';
    }

    // Use error to return an existing error code
    if (value === '4') {
        return helpers.error('any.invalid');
    }

    // Override value with undefined to unset
    if (value === '5') {
        return undefined;
    }

    // Return the value unchanged
    return value;
};

const schema = Joi.string().custom(method, 'custom validation');
```

Possible validation errors: [`any.custom`](#anycustom)

#### `any.default([value])`

Sets a default value if the original value is `undefined` where:
- `value` - the default value. One of:
    - a literal value (string, number, object, etc.).
    - a [references](#refkey-options).
    - a function which returns the default value using the signature `function(parent, helpers)` where:
        - `parent` - a clone of the object containing the value being validated. Note that since specifying a `parent` argument performs cloning, do not declare format arguments if you are not using them.
        - `helpers` - same as those described in [`any.custom()`](#anycustommethod_description).

When called without any `value` on an object schema type, a default value will be automatically generated based on the default values of the object keys.

Note that if `value` is an object, any changes to the object after `default()` is called will change the reference and any future assignment. Use a function when setting a dynamic value (e.g. the current time).

```js
const generateUsername = (parent, helpers) => {

  return parent.firstname.toLowerCase() + '-' + parent.lastname.toLowerCase();
};

generateUsername.description = 'generated username';

const schema = Joi.object({
    username: Joi.string().default(generateUsername),
    firstname: Joi.string(),
    lastname: Joi.string(),
    created: Joi.date().default(Date.now),
    status: Joi.string().default('registered')
});

const { value } = schema.validate({
    firstname: 'Jane',
    lastname: 'Doe'
});

// value.status === 'registered'
// value.username === 'jane-doe'
// value.created will be the time of validation
```

Possible validation errors: [`any.default`](#anydefault)

#### `any.describe()`

Returns an object that represents the internal configuration of the schema. Useful for debugging
and exposing a schema's configuration to other systems, like valid values in a user interface.

```js
const schema = Joi.any().valid('foo', 'bar');
console.log(schema.describe());
```

Results in:

```
{ type: 'any',
  flags: { only: true },
  valids: [ 'foo', 'bar' ] }
```

#### `any.description(desc)`

Annotates the key where:
- `desc` - the description string.

```js
const schema = Joi.any().description('this key will match anything you give it');
```

#### `any.empty(schema)`

Considers anything that matches the schema to be empty (`undefined`).
- `schema` - any object or **joi** schema to match. An undefined schema unsets that rule.

```js
let schema = Joi.string().empty('');
schema.validate(''); // returns { error: null, value: undefined }
schema = schema.empty();
schema.validate(''); // returns { error: "value" is not allowed to be empty, value: '' }
```

#### `any.error(err)`

Overrides the default **joi** error with a custom error if the rule fails where:
- `err` can be:
  - an instance of `Error` - the override error.
  - a function with the signature `function(errors)`, where `errors` is an array of validation reports and it returns either a single `Error` or an array of validation reports.

Do not use this method if you are simply trying to override the error message - use `any.message()` or `any.messages()` instead. This method is designed to override the **joi** validation error and return the exact override provided. It is useful when you want to return the result of validation directly (e.g. when using with a **hapi** server) and want to return a different HTTP error code than 400.

Note that if you provide an `Error`, it will be returned as-is, unmodified and undecorated with any of the normal error properties. If validation fails and another error is found before the error override, that error will be returned and the override will be ignored (unless the `abortEarly` option has been set to `false`). If you set multiple errors on a single schema, only the last error is used.

```js
const schema = Joi.string().error(new Error('Was REALLY expecting a string'));
schema.validate(3);     // returns Error('Was REALLY expecting a string')
```

```js
const schema = Joi.object({
    foo: Joi.number().min(0).error((errors) => new Error('"foo" requires a positive number'))
});
schema.validate({ foo: -2 });    // returns new Error('"foo" requires a positive number')
```

```js
const schema = Joi.object({
    foo: Joi.number().min(0).error((errors) => {

        return new Error('found errors with ' + errors.map((err) => `${err.local.key}(${err.local.limit}) with value ${err.local.value}`).join(' and '));
    })
});
schema.validate({ foo: -2 });    // returns new Error('found errors with foo(0) with value -2')
```

#### `any.example(example, [options])`

Adds examples to the schema where:
- `example` - adds an example. Note that no validation is performed on the value.
- `options` - optional settings:
    - `override` - if `true`, replaces any existing examples. Defaults to `false`.

```js
const schema = Joi.string().min(4).example('abcd');
```

#### `any.external(method, [description])`

Adds an external validation rule where:
- `method` - an async or sync function with signature `function(value, helpers)` which can either
  return a replacement value, `undefined` to indicate no change, or throw an error, where:
    - `value` - a clone of the object containing the value being validated.
    - `helpers` - an object with the following helpers:
        - `prefs` - the current preferences.
- `description` - optional string used to document the purpose of the method.

Note that external validation rules are only called after the all other validation rules for the
entire schema (from the value root) are checked. This means that any changes made to the value by
the external rules are not available to any other validation rules during the non-external
validation phase.

If schema validation failed, no external validation rules are called.

#### `any.extract(path)`

Returns a sub-schema based on a path of object keys or schema ids where:
- `path` - a dot `.` separated path string or a pre-split array of path keys. The keys must match
  the sub-schema id or object key (if no id was explicitly set).

```js
const schema = Joi.object({ foo: Joi.object({ bar: Joi.number() }) });
const number = schema.extract('foo.bar');

//or
const result = schema.extract(['foo', 'bar']); //same as number
```

#### `any.failover(value)`

Sets a failover value if the original value fails passing validation where:
- `value` - the failover value. `value` supports [references](#refkey-options). `value` may be
  assigned a function which returns the default value. If `value` is specified as a function
  that accepts a single parameter, that parameter will be a context object that can be used to
  derive the resulting value.

Note that if `value` is an object, any changes to the object after `failover()` is called will change
the reference and any future assignment. Use a function when setting a dynamic value (e.g. the
current time).

Using a function with a single argument performs some internal cloning which has a performance
impact. If you do not need access to the context, define the function without any arguments.

Possible validation errors: [`any.failover`](#anyfailover)

#### `any.forbidden()`

Marks a key as forbidden which will not allow any value except `undefined`. Used to explicitly forbid keys.

```js
const schema = {
    a: Joi.any().forbidden()
};
```

Possible validation errors: [`any.unknown`](#anyunknown)

#### `any.fork(paths, adjuster)`

Returns a new schema where each of the path keys listed have been modified where:
- `paths` - an array of key strings, a single key string, or an array of arrays of pre-split
  key strings. Key string paths use dot `.` to indicate key hierarchy.
- `adjuster` - a function using the signature `function(schema)` which must return a modified
  schema. For example, `(schema) => schema.required()`.

The method does not modify the original schema.

#### `any.id(id)`

Sets a schema id for reaching into the schema via [`any.extract()`](#anyextractpath) where:
- `id` - an alphanumeric string (plus `_`) used to identify the schema.

If no id is set, the schema id defaults to the object key it is associated with. If the schema is
used in an array or alternatives type and no id is set, the schema is unreachable.

#### `any.invalid(...values)` - aliases: `disallow`, `not`

Disallows values where:
- `values` - the forbidden values which can be of any type and will be matched against the validated value before applying any other rules. Supports [references](#refkey-options) and [in-references](#inref-options). If the first value is [`Joi.override`](#override), will override any previously set values.

```js
const schema = {
    a: Joi.any().invalid('a'),
    b: Joi.any().invalid('b', 'B')
};
```

Possible validation errors: [`any.invalid`](#anyinvalid)

#### `any.keep()`

Same as [`rule({ keep: true })`](#anyruleoptions).

Note that `keep()` will terminate the current ruleset and cannot be followed by another
rule option. Use [`rule()`](#anyruleoptions) to apply multiple rule options.

#### `any.label(name)`

Overrides the key name in error messages.
- `name` - the name of the key.

```js
const schema = {
    first_name: Joi.string().label('First Name')
};
```

#### `any.message(message)`

Same as [`rule({ message })`](#anyruleoptions).

Note that `message()` will terminate the current ruleset and cannot be followed by another
rule option. Use [`rule()`](#anyruleoptions) to apply multiple rule options.

#### `any.messages(messages)`

Same as [`any.prefs({ messages })`](#anyprefsoptions---aliases-preferences-options).

Note that while [`any.message()`](#anymessagemessage) applies only to the last rule or ruleset, `any.messages()` applies to the entire schema.

#### `any.meta(meta)`

Attaches metadata to the key where:
- `meta` - the meta object to attach.

```js
const schema = Joi.any().meta({ index: true });
```

#### `any.note(...notes)`

Annotates the key where:
- `notes` - the note string or multiple notes as individual arguments.

```js
const schema = Joi.any().note('this is special', 'this is important');
```

#### `any.only()`

Requires the validated value to match of the provided `any.allow()` values. It has no effect when
called together with `any.valid()` since it already sets the requirements. When used with
`any.allow()` it converts it to an `any.valid()`.

#### `any.optional()`

Marks a key as optional which will allow `undefined` as values. Used to annotate the schema for readability as all keys are optional by default.

Note: this does not allow a `null` value. To do that, use [`any.allow(value)`](#anyallowvalue). Or both!

```js
const schema = Joi.any().optional();
```

#### `any.prefs(options)` - aliases: `preferences`, `options`

Overrides the global `validate()` options for the current key and any sub-key where:
- `options` - an object with the same optional keys as [`any.validate()`](#anyvalidatevalue-options).

```js
const schema = Joi.any().prefs({ convert: false });
```

#### `any.presence(mode)`

Sets the presence mode for the schema where:
- `mode` - can be one of `'optional'`, `'required'`, or `'forbidden'`

Same as calling `any.optional()`, `any.required()`, or `any.forbidden()`.

#### `any.raw([enabled])`

Outputs the original untouched value instead of the casted value where:
- `enabled` - if `true`, the original result is returned, otherwise the validated value. Defaults to `true`.

Note that the raw value is only applied after validation and any references to the value use the
validated value, not the raw value.

```js
const timestampSchema = Joi.date().timestamp();
timestampSchema.validate('12376834097810'); // { error: null, value: Sat Mar 17 2362 04:28:17 GMT-0500 (CDT) }

const rawTimestampSchema = Joi.date().timestamp().raw();
rawTimestampSchema.validate('12376834097810'); // { error: null, value: '12376834097810' }
```

#### `any.required()` - aliases: `exist`

Marks a key as required which will not allow `undefined` as value. All keys are optional by default.

```js
const schema = Joi.any().required();
```

Possible validation errors: [`any.required`](#anyrequired)

#### `any.result(mode)`

Set the result mode where:
- `mode` - one of `'raw'` (same as `any.raw()`) or `'strip'` (same as `any.strip()`).

#### `any.rule(options)`

Applies a set of rule options to the current ruleset or last rule added where:
- `options` - the rules to apply where:
  - `keep` - if `true`, the rules will not be replaced by the same unique rule later. For example, `Joi.number().min(1).rule({ keep: true }).min(2)` will keep both `min()` rules instead of the later rule overriding the first. Defaults to `false`.
  - `message` - a single message string or a messages object where each key is an error code and corresponding message string as value. The object is the same as the `messages` used as an option in [`any.validate()`](#anyvalidatevalue-options). The strings can be plain messages or a message template.
  - `warn` - if `true`, turns any error generated by the ruleset to warnings.

When applying rule options, the last rule (e.g. `min()`) is used unless there is an active ruleset defined (e.g. `$.min().max()`) in which case the options are applied to all the provided rules. Once `rule()` is called, the previous rules can no longer be modified and any active ruleset is terminated.

Rule modifications can only be applied to supported rules. Most of the `any` methods do not support rule modifications because they are implemented using schema flags (e.g. `required()`) or special internal implementation (e.g. `valid()`). In those cases, use the `any.messages()` method to override the error codes for the errors you want to customize.

#### `any.ruleset` - aliases: `$`

Starts a ruleset in order to apply multiple [rule options](#anyruleoptions). The set ends when
[`rule()`](#anyruleoptions), [`keep()`](#anykeep), [`message()`](#anymessagemessage), or [`warn()`](#anywarn) is called.

```js
const schema = Joi.number().ruleset.min(1).max(10).rule({ message: 'Number must be between 1 and 10' });
```

```js
const schema = Joi.number().$.min(1).max(10).rule({ message: 'Number must be between 1 and 10' });
```

#### `any.shared(schema)`

Registers a schema to be used by decendents of the current schema in named link references, where:
- `schema` - a **joi** schema with an id.

```js
  const schema = Joi.object({
      a: [Joi.string(), Joi.link('#x')],
      b: Joi.link('#type.a')
  })
      .shared(Joi.number().id('x'))
      .id('type');
```

#### `any.strict(isStrict)`

Strict mode sets the `options.convert` options to `false` which prevent type casting for the current key and any child keys.
- `isStrict` - whether strict mode is enabled or not. Defaults to true.

```js
const schema = Joi.any().strict();
```

#### `any.strip([enabled])`

Marks a key to be removed from a resulting object or array after validation to sanitize the output
where:
- `enabled` - if `true`, the value is stripped, otherwise the validated value is retained. Defaults
  to `true`.

```js
const schema = Joi.object({
    username: Joi.string(),
    password: Joi.string().strip()
});

schema.validate({ username: 'test', password: 'hunter2' }); // result.value = { username: 'test' }

const schema = Joi.array().items(Joi.string(), Joi.any().strip());

schema.validate(['one', 'two', true, false, 1, 2]); // result.value = ['one', 'two']
```

#### `any.tag(...tags)`

Annotates the key where:
- `tags` - the tag string or multiple tags (each as an argument).

```js
const schema = Joi.any().tag('api', 'user');
```

#### `any.tailor(targets)`

Applies any assigned target alterations to a copy of the schema that were applied via
[`any.alter()`](#anyaltertargets) where:
- `targets` - a single target string or array or target strings to apply.

```js
const schema = Joi.object({
    key: Joi.string()
        .alter({
            get: (schema) => schema.required(),
            post: (schema) => schema.forbidden()
        })  
});

const getSchema = schema.tailor('get');
const postSchema = schema.tailor(['post']);
```

#### `any.unit(name)`

Annotates the key where:
- `name` - the unit name of the value.

```js
const schema = Joi.number().unit('milliseconds');
```

#### `any.valid(...values)` - aliases: `equal`

Adds the provided values into the allowed values list and marks them as the only valid values allowed where:
- `values` - one or more allowed values which can be of any type and will be matched against the validated value before applying any other rules. Supports [references](#refkey-options) and [in-references](#inref-options). If the first value is [`Joi.override`](#override), will override any previously set values. If the only value is [`Joi.override`](#override), will also remove the `only` flag from the schema.

```js
const schema = {
    a: Joi.any().valid('a'),
    b: Joi.any().valid('b', 'B')
};
```

Possible validation errors: [`any.only`](#anyonly)

#### `any.validate(value, [options])`

Validates a value using the current schema and options where:
- `value` - the value being validated.
- `options` - an optional object with the following optional keys:
  - `abortEarly` - when `true`, stops validation on the first error, otherwise returns all the errors found. Defaults to `true`.
  - `allowUnknown` - when `true`, allows object to contain unknown keys which are ignored. Defaults to `false`.
  - `cache` - when `true`, schema caching is enabled (for schemas with explicit caching rules). Default to `true`.
  - `context` - provides an external data set to be used in [references](#refkey-options). Can only be set as an external option to `validate()` and not using `any.prefs()`.
  - `convert` - when `true`, attempts to cast values to the required types (e.g. a string to a number). Defaults to `true`.
  - `dateFormat` - sets the string format used when converting dates to strings in error messages and casting. Options are:
    - `'date'` - date string.
    - `'iso'` - date time ISO string. This is the default.
    - `'string'` - JS default date time string.
    - `'time'` - time string.
    - `'utc'` - UTC date time string.
  - `debug` - when `true`, valid results and throw errors are decorated with a `debug` property which includes an array of the validation steps used to generate the returned result. Defaults to `false`.
  - `errors` - error formatting settings:
    - `escapeHtml` - when `true`, error message templates will escape special characters to HTML entities, for security purposes. Defaults to `false`.
    - `label` - defines the value used to set the `label` context variable:
      - `'path'` - the full path to the value being validated. This is the default value.
      - `'key'` - the key of the value being validated.
      - `false` - remove any label prefix from error message, including the `""`.
    - `language` - the preferred language code for error messages. The value is matched against keys at the root of the `messages` object, and then the error code as a child key of that. Can be a reference to the value, global context, or local context which is the root value passed to the validation function. Note that references to the value are usually not what you want as they move around the value structure relative to where the error happens. Instead, either use the global  context, or the absolute value (e.g. `Joi.ref('/variable')`);
    - `render` - when `false`, skips rendering error templates. Useful when error messages are generated elsewhere to save processing time. Defaults to `true`.
    - `stack` - when `true`, the main error will possess a stack trace, otherwise it will be disabled. Defaults to `false` for performance reasons. Has no effect on platforms other than V8/node.js as it uses the [Stack trace API](https://v8.dev/docs/stack-trace-api).
    - `wrap` - overrides the way values are wrapped (e.g. `[]` around arrays, `""` around labels and variables prefixed with `:`). Each key can be set to a string with one (same character before and after the value) or two characters (first character before and second character after), or `false` to disable wrapping:
        - `label` - the characters used around `{#label}` references. Defaults to `'"'`.
        - `array` - the characters used around array values. Defaults to `'[]'`.
    - `wrapArrays` - if `true`, array values in error messages are wrapped in `[]`. Defaults to `true`.
  - `externals` - if `false`, the external rules set with [`any.external()`](#anyexternalmethod-description) are ignored, which is required to ignore any external validations in synchronous mode (or an exception is thrown). Defaults to `true`.
  - `messages` - overrides individual error messages. Defaults to no override (`{}`). Messages use the same rules as [templates](#template-syntax). Variables in double braces `{{var}}` are HTML escaped if the option `errors.escapeHtml` is set to `true`.
  - `noDefaults` - when `true`, do not apply default values. Defaults to `false`.
  - `nonEnumerables` - when `true`, inputs are shallow cloned to include non-enumerables properties. Defaults to `false`.
  - `presence` - sets the default presence requirements. Supported modes: `'optional'`, `'required'`, and `'forbidden'`. Defaults to `'optional'`.
  - `skipFunctions` - when `true`, ignores unknown keys with a function value. Defaults to `false`.
  - `stripUnknown` - remove unknown elements from objects and arrays. Defaults to `false`.
    - when an `object` :
      - `arrays` - set to `true` to remove unknown items from arrays.
      - `objects` - set to `true` to remove unknown keys from objects.
    - when `true`, it is equivalent to having `{ arrays: false, objects: true }`.

Returns an object with the following keys:
- `value` - the validated and normalized value.
- `error` - the validation errors if found.
- `warning` - the generated warnings if any.
- `artifacts` - a `Map` containing any passing rules' artifacts and their corresponding array of paths.

```js
const schema = Joi.object({
    a: Joi.number()
});

const value = {
    a: '123'
};

const result = schema.validate(value);
// result -> { value: { "a" : 123 } }
```

#### `any.validateAsync(value, [options])`

Validates a value asynchronously using the current schema and options where:
- `value` - the value being validated.
- `options` - an optional object as described in [`any.validate()`](#anyvalidatevalue-options), with the following additional settings:
    - `artifacts` - when `true`, artifacts are returned alongside the value (i.e. `{ value, artifacts }`). Defaults to `false`.
    - `warnings` - when `true`, warnings are returned alongside the value (i.e. `{ value, warning }`). Defaults to `false`.

Returns a Promise that resolves into the validated value when the value is valid. If the value is valid and the `warnings` or `debug` options are set to `true`, returns an object `{ value, warning, debug }`. If validation fails, the promise rejects with the validation error.

```js
const schema = Joi.object({
    a: Joi.number()
});

const value = {
    a: '123'
};

try {
  const value = await schema.validateAsync(value);
  // value -> { "a" : 123 }
}
catch (err) {
}
```

#### `any.warn()`

Same as [`rule({ warn: true })`](#anyruleoptions).

Note that `warn()` will terminate the current ruleset and cannot be followed by another rule option. Use [`rule()`](#anyruleoptions) to apply multiple rule options.

#### `any.warning(code, [context])`

Generates a warning where:
- `code` - the warning code. Can be an existing error code or a custom code. If a custom code is used, a matching error message definition must be configured via [`any.message()`](#anymessagemessage), [`any.prefs()`](#anyprefsoptions--aliases-preferences-options), or validation `messages` option.
- `context` - optional context object.

When calling [`any.validateAsync()`](#anyvalidateasyncvalue-options), set the `warning` option to `true` to enable warnings. Warnings are reported separately from errors alongside the result value via the `warning` key (i.e. `{ value, warning }`). Warning are always included when calling [`any.validate()`](#anyvalidatevalue-options).

```js
const schema = Joi.any()
    .warning('custom.x', { w: 'world' })
    .message({ 'custom.x': 'hello {#w}!' });

const { value, error, warning } = schema.validate('anything');

// value -> 'anything';
// error -> null
// warning -> { message: 'hello world!', details: [...] }

// or

try {
    const { value, warning } = await schema.validateAsync('anything', { warnings: true });
    // value -> 'anything';
    // warning -> { message: 'hello world!', details: [...] }
}
catch (err) { }
```

#### `any.when([condition], options)`

Adds conditions that are evaluated during validation and modify the schema before it is applied to the value, where:
- `condition` - a key name, [reference](#refkey-options), or a schema. If omitted, defaults to `Joi.ref('.')`.
- `options` - an object with:
    - `is` - the condition expressed as a **joi** schema. Anything that is not a **joi** schema will be converted using [Joi.compile](#compileschema-options). By default, the `is` condition schema allows for `undefined` values. Use `.required()` to override. For example, use `is: Joi.number().required()` to guarantee that a **joi** reference exists and is a number.
    - `not` - the negative version of `is` (`then` and `otherwise` have reverse roles).
    - `then` - if the condition is true, the **joi** schema to use.
    - `otherwise` - if the condition is false, the **joi** schema to use.
    - `switch` - an array of `{ is, then }` conditions that are evaluated against the `condition`. The last item in the array may also contain `otherwise`.
    - `break` - stops processing all other conditions if the rule results in a `then`, `otherwise`, of `switch` match.

If `condition` is a reference:
- if `is`, `not`, and `switch` are missing, `is` defaults to `Joi.invalid(null, false, 0, '').required()` (value must be a truthy).
- `is` and `not` cannot be used together.
- one of `then`, `otherwise`, or `switch` is required.
- cannot use `is` or `then` with `switch`.
- cannot specify `otherwise` both inside the last `switch` statement and outside.

If `condition` is a schema:
- cannot specify `is` or `switch`.
- one of `then` or `otherwise` is required.

When `is`, `then`, or `otherwise` are assigned literal values, the values are compiled into override schemas (`'x'` is compiled into `Joi.valid(Joi.override, 'x')`). This means they will override any base schema the rule is applied to. To append a literal value, use the explicit `Joi.valid('x')` format.

Notes:
- an invalid combination of schema modifications (e.g. trying to add string rules or a number type) will cause validation to throw an error.
- because the schema is constructed at validation time, it can have a significant performance impact. Run-time generated schemas are cached, but the first time of each generation will take longer than once it is cached.

```js
const schema = {
    a: Joi.any()
        .valid('x')
        .when('b', { is: Joi.exist(), then: Joi.valid('y'), otherwise: Joi.valid('z') })
        .when('c', { is: Joi.number().min(10), then: Joi.forbidden() }),
    b: Joi.any(),
    c: Joi.number()
};
```

Or with a schema:
```js
const schema = Joi.object({
    a: Joi.any().valid('x'),
    b: Joi.any()
})
    .when(Joi.object({ b: Joi.exist() }).unknown(), {
        then: Joi.object({
            a: Joi.valid('y')
        }),
        otherwise: Joi.object({
            a: Joi.valid('z')
        })
});
```

Note that this style is much more useful when your whole schema depends on the value of one of its
property, or if you find yourself repeating the check for many keys of an object. For example to
validate this logic:

```js
const schema = Joi.object({
    type: Joi.string()
        .valid('A', 'B', 'C')
        .required(),              // required if type == 'A'
        
    foo: Joi.when('type', {
        is: 'A',
        then: Joi.string()
        .valid('X', 'Y', 'Z')
        .required()
    }),                           // required if type === 'A' and foo !== 'Z'
    
    bar: Joi.string()
})
    .when(Joi.object({ type: Joi.valid('A'), foo: Joi.not('Z') }).unknown(), {
        then: Joi.object({ bar: Joi.required() })
    });
```

Alternatively, if you want to specify a specific type such as `string`, `array`, etc, you can do so
like this:

```js
const schema = {
    a: Joi.valid('a', 'b', 'other'),
    other: Joi.string()
        .when('a', { is: 'other', then: Joi.required() }),
};
```

If you need to validate a child key inside a nested object based on a sibling's value, you can do
so like this:

```js
const schema = Joi.object({
    a: Joi.boolean().required(),
    b: Joi.object()
        .keys({
            c: Joi.string(),
            d: Joi.number().required()
        })
        .required()
        .when('a', {
            is: true,
            then: Joi.object({ c: Joi.required() })		// b.c is required only when a is true
        })
});
```

If you want to validate one key based on the existence of another key, you can do so like the
following (notice the use of `required()`):

```js
const schema = Joi.object({
    min: Joi.number(),
    max: Joi.number().when('min', {
        is: Joi.number().required(),
        then: Joi.number().greater(Joi.ref('min')),
    }),
});
```

To evaluate multiple values on a single reference:

```js
const schema = Joi.object({
    a: Joi.number().required(),
    b: Joi.number()
        .when('a', {
            switch: [
                { is: 0, then: Joi.valid(1) },
                { is: 1, then: Joi.valid(2) },
                { is: 2, then: Joi.valid(3) }
            ],
            otherwise: Joi.valid(4)
        })
});
```

Or shorter:

```js
const schema = Joi.object({
    a: Joi.number().required(),
    b: Joi.number()
        .when('a', [
            { is: 0, then: 1 },
            { is: 1, then: 2 },
            { is: 2, then: 3, otherwise: 4 }
        ])
});
```

### `alternatives`

Generates a type that will match one of the provided alternative schemas via the [`try()`](#alternativestryschemas)
method. If no schemas are added, the type will not match any value except for `undefined`.

Supports the same methods of the [`any()`](#any) type.

Alternatives can be expressed using the shorter `[]` notation.

```js
const alt = Joi.alternatives().try(Joi.number(), Joi.string());
// Same as [Joi.number(), Joi.string()]
```

Note that numeric strings would be casted to numbers in the example above (see [any.strict()](#anystrictisstrict)).

Possible validation errors: [`alternatives.any`](#alternativesany), [`alternatives.all`](#alternativesall), [`alternatives.one`](#alternativesone), [`alternatives.types`](#alternativestypes), [`alternatives.match`](#alternativesmatch)

#### `alternatives.conditional(condition, options)`

Adds a conditional alternative schema type, either based on another key value, or a schema peeking into the current value, where:
- `condition` - the key name or [reference](#refkey-options), or a schema.
- `options` - an object with:
    - `is` - the condition expressed as a **joi** schema. Anything that is not a **joi** schema will be converted using [Joi.compile](#compileschema-options).
    - `not` - the negative version of `is` (`then` and `otherwise` have reverse roles).
    - `then` - if the condition is true, the **joi** schema to use.
    - `otherwise` - if the condition is false, the **joi** schema to use.
    - `switch` - an array of `{ is, then }` conditions that are evaluated against the `condition`. The last item in the array may also contain `otherwise`.

If `condition` is a reference:
- if `is`, `not`, and `switch` are missing, `is` defaults to `Joi.invalid(null, false, 0, '').required()` (value must be a truthy).
- `is` and `not` cannot be used together.
- one of `then`, `otherwise`, or `switch` is required.
- cannot use `is` or `then` with `switch`.
- cannot specify `otherwise` both inside the last `switch` statement and outside.

If `condition` is a schema:
- cannot specify `is` or `switch`.
- one of `then` or `otherwise` is required.

When `is`, `then`, or `otherwise` are assigned literal values, the values are compiled into override schemas (`'x'` is compiled into `Joi.valid(Joi.override, 'x')`). This means they will override any base schema the rule is applied to. To append a literal value, use the explicit `Joi.valid('x')` format.

Note that `alternatives.conditional()` is different than `any.when()`. When you use `any.when()` you end up with composite schema of all the matching conditions while `alternatives.conditional()` will use the first matching schema, ignoring other conditional statements.

```js
const schema = {
    a: Joi.alternatives().conditional('b', { is: 5, then: Joi.string(), otherwise: Joi.number() }),
    b: Joi.any()
};
```

```js
const schema = Joi.alternatives().conditional(Joi.object({ b: 5 }).unknown(), {
    then: Joi.object({
        a: Joi.string(),
        b: Joi.any()
    }),
    otherwise: Joi.object({
        a: Joi.number(),
        b: Joi.any()
    })
});
```

Note that `conditional()` only adds additional alternatives to try and does not impact the overall type. Setting
a `required()` rule on a single alternative will not apply to the overall key. For example,
this definition of `a`:

```js
const schema = {
    a: Joi.alternatives().conditional('b', { is: true, then: Joi.required() }),
    b: Joi.boolean()
};
```

Does not turn `a` into a required key when `b` is `true`. Instead, it tells the validator to try and match the
value to anything that's not `undefined`. However, since `Joi.alternatives()` by itself allows `undefined`, the rule
does not accomplish turning `a` to a required value. This rule is the same as `Joi.alternatives([Joi.required()])`
when `b` is `true` which will allow any value including `undefined`.

To accomplish the desired result above use:

```js
const schema = {
    a: Joi.when('b', { is: true, then: Joi.required() }),
    b: Joi.boolean()
};
```

#### `alternatives.match(mode)`

Requires the validated value to match a specific set of the provided `alternative.try()` schemas where:
- `mode` - the match mode which can be one of:
    - `'any'` - match any provided schema. This is the default value.
    - `'all'` - match all of the provided schemas. Note that this will ignore any conversions performed by the matchin schemas and return the raw value provided regardless of the `convert` preference set.
    - `'one'` - match one and only one of the provided schemas.

Note: Cannot be combined with `alternatives.conditional()`.

Possible validation errors: [`alternatives.any`](#alternativesany), [`alternatives.all`](#alternativesall), [`alternatives.one`](#alternativesone)

#### `alternatives.try(...schemas)`

Adds an alternative schema type for attempting to match against the validated value where:
- `schemas` - alternative **joi** types, each as a separate argument.

```js
const alt = Joi.alternatives().try(Joi.number(), Joi.string());
await alt.validateAsync('a');
```

### `array`

Generates a schema object that matches an array data type. Note that undefined values inside arrays are not allowed by
default but can be by using `sparse()`.

Supports the same methods of the [`any()`](#any) type.

```js
const array = Joi.array().items(Joi.string().valid('a', 'b'));
await array.validateAsync(['a', 'b', 'a']);
```

Possible validation errors: [`array.base`](#arraybase)

#### `array.has(schema)`

Verifies that a schema validates at least one of the values in the array, where:
- `schema` - the validation rules required to satisfy the check. If the `schema` includes references, they are resolved against
  the array item being tested, not the value of the `ref` target.

```js
const schema = Joi.array().items(
  Joi.object({
    a: Joi.string(),
    b: Joi.number()
  })
).has(Joi.object({ a: Joi.string().valid('a'), b: Joi.number() }))
```

Possible validation errors: [`array.hasKnown`](#arrayhasknown), [`array.hasUnknown`](#arrayhasunknown)

#### `array.items(...types)`

Lists the types allowed for the array values where:
- `types` - one or more **joi** schema objects to validate each array item against.

If a given type is `.required()` then there must be a matching item in the array.
If a type is `.forbidden()` then it cannot appear in the array.
Required items can be added multiple times to signify that multiple items must be found.
Errors will contain the number of items that didn't match. Any unmatched item having a [label](#anylabelname) will be mentioned explicitly.

```js
const schema = Joi.array().items(Joi.string(), Joi.number()); // array may contain strings and numbers
const schema = Joi.array().items(Joi.string().required(), Joi.string().required()); // array must contain at least two strings
const schema = Joi.array().items(Joi.string().valid('not allowed').forbidden(), Joi.string()); // array may contain strings, but none of those strings can match 'not allowed'
const schema = Joi.array().items(Joi.string().label('My string').required(), Joi.number().required()); // If this fails it can result in `[ValidationError: "value" does not contain [My string] and 1 other required value(s)]`
```

Possible validation errors: [`array.excludes`](#arrayexcludes), [`array.includesRequiredBoth`](#arrayincludesrequiredboth), [`array.includesRequiredKnowns`](#arrayincludesrequiredknowns), [`array.includesRequiredUnknowns`](#arrayincludesrequiredunknowns), [`array.includes`](#arrayincludes)

#### `array.length(limit)`

Specifies the exact number of items in the array where:
- `limit` - the number of array items allowed or a reference.

```js
const schema = Joi.array().length(5);
```

```js
const schema = Joi.object({
  limit: Joi.number().integer().required(),
  numbers: Joi.array().length(Joi.ref('limit')).required()
});
```

Possible validation errors: [`array.length`](#arraylength), [`array.ref`](#arrayref)

#### `array.max(limit)`

Specifies the maximum number of items in the array where:
- `limit` - the highest number of array items allowed or a reference.

```js
const schema = Joi.array().max(10);
```

```js
const schema = Joi.object({
  limit: Joi.number().integer().required(),
  numbers: Joi.array().max(Joi.ref('limit')).required()
});
```

Possible validation errors: [`array.max`](#arraymax), [`array.ref`](#arrayref)

#### `array.min(limit)`

Specifies the minimum number of items in the array where:
- `limit` - the lowest number of array items allowed or a reference.

```js
const schema = Joi.array().min(2);
```

```js
const schema = Joi.object({
  limit: Joi.number().integer().required(),
  numbers: Joi.array().min(Joi.ref('limit')).required()
});
```

Possible validation errors: [`array.min`](#arraymin), [`array.ref`](#arrayref)

#### `array.ordered(...type)`

Lists the types in sequence order for the array values where:
- `types` - one or more **joi** schema objects to validate against each array item in sequence order.

If a given type is `.required()` then there must be a matching item with the same index position in the array.
Errors will contain the number of items that didn't match. Any unmatched item having a [label](#anylabelname) will be mentioned explicitly.

```js
const schema = Joi.array().ordered(Joi.string().required(), Joi.number().required()); // array must have first item as string and second item as number
const schema = Joi.array().ordered(Joi.string().required()).items(Joi.number().required()); // array must have first item as string and 1 or more subsequent items as number
const schema = Joi.array().ordered(Joi.string().required(), Joi.number()); // array must have first item as string and optionally second item as number
```

Possible validation errors: [`array.excludes`](#arrayexcludes), [`array.includes`](#arrayincludes), [`array.orderedLength`](#arrayorderedlength)

#### `array.single([enabled])`

Allows single values to be checked against rules as if it were provided as an array.

`enabled` can be used with a falsy value to go back to the default behavior.

```js
const schema = Joi.array().items(Joi.number()).single();
schema.validate([4]); // returns `{ error: null, value: [ 4 ] }`
schema.validate(4); // returns `{ error: null, value: [ 4 ] }`
```

Possible validation errors: [`array.excludes`](#arrayexcludes), [`array.includes`](#arrayincludes)

#### `array.sort([options])`

Requires the array to comply with the specified sort order where:
- `options` - optional settings:
    - `order` - the sort order. Allowed values:
        - `'ascending'` - sort the array in ascending order. This is the default.
        - `'descending'` - sort the array in descending order.
    - `by` - a key name or reference to sort array objects by. Defaults to the entire value.

Notes:
- if the `convert` preference is `true`, the array is modified to match the required sort order.
- `undefined` values are always placed at the end of the array regardless of the sort order.
- can only sort string and number items or item key values.

Possible validation errors: [`array.sort`](#arraysort), [`array.sort.unsupported`](#arraysortunsupported), [`array.sort.mismatching`](#arraysortmismatching)

#### `array.sparse([enabled])`

Allows this array to be sparse. `enabled` can be used with a falsy value to go back to the default behavior.

```js
let schema = Joi.array().sparse(); // undefined values are now allowed
schema = schema.sparse(false); // undefined values are now denied
```

Possible validation errors: [`array.sparse`](#arraysparse)

#### `array.unique([comparator, [options]])`

Requires the array values to be unique where:
- `comparator` - an optional custom `comparator` that is either:
    - a function that takes 2 parameters to compare. This function should return whether the 2
      parameters are equal or not, you are also **responsible** for this function not to fail, any
      `Error` would bubble out of Joi.
    - a string in dot notation representing the path of the element to do uniqueness check on. Any
      missing path will be considered undefined, and can as well only exist once.
- `options` - optional settings:
    - `ignoreUndefined` - if `true`, undefined values for the dot notation string comparator will
      not cause the array to fail on uniqueness. Defaults to `false`.
    - `separator` - overrides the default `.` hierarchy separator. Set to `false` to treat the
      `key` as a literal value.

Note: remember that if you provide a custom comparator function, different types can be passed as parameter depending on the rules you set on items.

Be aware that a deep equality is performed on elements of the array having a type of `object`, a performance penalty is to be expected for this kind of operation.

```js
const schema = Joi.array().unique();
```

```js
const schema = Joi.array().unique((a, b) => a.property === b.property);
```

```js
const schema = Joi.array().unique('customer.id');
```

```js
let schema = Joi.array().unique('identifier');

schema.validate([{}, {}]);
// ValidationError: "value" position 1 contains a duplicate value

schema = Joi.array().unique('identifier', { ignoreUndefined: true });

schema.validate([{}, {}]);
// error: null
```

Possible validation errors: [`array.unique`](#arrayunique)

### `binary`

Generates a schema object that matches a Buffer data type. If the validation `convert` option is on (enabled by default), a string
will be converted to a Buffer if specified.

Supports the same methods of the [`any()`](#any) type.

```js
const schema = Joi.binary();
```

Possible validation errors: [`binary.base`](#binarybase)

#### `binary.encoding(encoding)`

Sets the string encoding format if a string input is converted to a buffer where:
- `encoding` - the encoding scheme.

```js
const schema = Joi.binary().encoding('base64');
```

#### `binary.length(limit)`

Specifies the exact length of the buffer:
- `limit` - the size of buffer allowed or a reference.

```js
const schema = Joi.binary().length(5);
```

Possible validation errors: [`binary.length`](#binarylength), [`binary.ref`](#binaryref)

#### `binary.max(limit)`

Specifies the maximum length of the buffer where:
- `limit` - the highest size of the buffer or a reference.

```js
const schema = Joi.binary().max(10);
```

Possible validation errors: [`binary.max`](#binarymax), [`binary.ref`](#binaryref)

#### `binary.min(limit)`

Specifies the minimum length of the buffer where:
- `limit` - the lowest size of the buffer or a reference.

```js
const schema = Joi.binary().min(2);
```

Possible validation errors: [`binary.min`](#binarymin), [`binary.ref`](#binaryref)

### `boolean`

Generates a schema object that matches a boolean data type. Can also be called via `bool()`. If the validation `convert`
option is on (enabled by default), a string (either "true" or "false") will be converted to a `boolean` if specified.

Supports the same methods of the [`any()`](#any) type.

```js
const boolean = Joi.boolean();

await boolean.validateAsync(true); // Valid
await boolean.validateAsync(1);    // Throws
```

Possible validation errors: [`boolean.base`](#booleanbase)

#### `boolean.falsy(...values)`

Allows for additional values to be considered valid booleans by converting them to `false` during validation.
Requires the validation `convert` option to be `true`.

String comparisons are by default case insensitive, see [`boolean.sensitive()`](#booleansensitiveenabled) to change this behavior.

```js
const boolean = Joi.boolean().falsy('N');
await boolean.validateAsync('N'); // Valid
```

#### `boolean.sensitive([enabled])`

Restrict the values provided to `truthy` and `falsy` as well as the `'true'` and `'false'` default conversions (when not in `strict()` mode) to be matched in a case sensitive manner, where:
- `enabled` - when `false`, allows insensitive comparison. Defaults to `true`.

```js
const schema = Joi.boolean().truthy('yes').falsy('no').sensitive();
```

#### `boolean.truthy(...values)`

Allows for additional values to be considered valid booleans by converting them to `true` during validation.
Requires the validation `convert` option to be `true`.

String comparisons are by default case insensitive, see [`boolean.sensitive()`](#booleansensitiveenabled) to change this behavior.

```js
const boolean = Joi.boolean().truthy('Y');
await boolean.validateAsync('Y'); // Valid
```

### `date`

Generates a schema object that matches a date type (as well as a JavaScript date string or number of milliseconds). If the validation `convert` option is on (enabled by default), a string or number will be converted to a Date if specified. Note that some invalid date strings will be accepted if they can be adjusted to valid dates (e.g. `'2/31/2019'` will be converted to `'3/3/2019'`) by the internal JS `Date.parse()` implementation.

Supports the same methods of the [`any()`](#any) type.

```js
const date = Joi.date();
await date.validateAsync('12-21-2012');
```

Possible validation errors: [`date.base`](#datebase), [`date.strict`](#datestrict)

#### `date.greater(date)`

Specifies that the value must be greater than `date` (or a reference).

```js
const schema = Joi.date().greater('1-1-1974');
```

Notes: `'now'` can be passed in lieu of `date` so as to always compare relatively to the current date, allowing to explicitly ensure a date is either in the past or in the future. When using `'now'` note that is includes the current time and the two values are compared based on their UTC milliseconds timestamp.

```js
const schema = Joi.date().greater('now');
```

```js
const schema = Joi.object({
  from: Joi.date().required(),
  to: Joi.date().greater(Joi.ref('from')).required()
});
```

Possible validation errors: [`date.greater`](#dategreater), [`date.ref`](#dateref)

#### `date.iso()`

Requires the string value to be in valid ISO 8601 date format.

```js
const schema = Joi.date().iso();
```

Possible validation errors: [`date.format`](#dateformat)

#### `date.less(date)`

Specifies that the value must be less than `date` (or a reference).

```js
const schema = Joi.date().less('12-31-2020');
```

Notes: `'now'` can be passed in lieu of `date` so as to always compare relatively to the current date, allowing to explicitly ensure a date is either in the past or in the future.

```js
const schema = Joi.date().less('now');
```

```js
const schema = Joi.object({
  from: Joi.date().less(Joi.ref('to')).required(),
  to: Joi.date().required()
});
```

Possible validation errors: [`date.less`](#dateless), [`date.ref`](#dateref)

#### `date.max(date)`

Specifies the latest date allowed where:
- `date` - the latest date allowed or a reference.

```js
const schema = Joi.date().max('12-31-2020');
```

Notes: `'now'` can be passed in lieu of `date` so as to always compare relatively to the current date, allowing to explicitly ensure a date is either in the past or in the future.

```js
const schema = Joi.date().max('now');
```

```js
const schema = Joi.object({
  from: Joi.date().max(Joi.ref('to')).required(),
  to: Joi.date().required()
});
```

Possible validation errors: [`date.max`](#datemax), [`date.ref`](#dateref)

#### `date.min(date)`

Specifies the oldest date allowed where:
- `date` - the oldest date allowed or a reference.

```js
const schema = Joi.date().min('1-1-1974');
```

Notes: `'now'` can be passed in lieu of `date` so as to always compare relatively to the current date, allowing to explicitly ensure a date is either in the past or in the future.

```js
const schema = Joi.date().min('now');
```

```js
const schema = Joi.object({
  from: Joi.date().required(),
  to: Joi.date().min(Joi.ref('from')).required()
});
```

Possible validation errors: [`date.min`](#datemin), [`date.ref`](#dateref)

#### `date.timestamp([type])`

Requires the value to be a timestamp interval from [Unix Time](https://en.wikipedia.org/wiki/Unix_time).

- `type` - the type of timestamp (allowed values are `unix` or `javascript` [default])

```js
const schema = Joi.date().timestamp(); // defaults to javascript timestamp
const schema = Joi.date().timestamp('javascript'); // also, for javascript timestamp (milliseconds)
const schema = Joi.date().timestamp('unix'); // for unix timestamp (seconds)
```

Possible validation errors: [`date.format`](#dateformat)

### `function` - inherits from `object`

Generates a schema object that matches a function type.

Supports the same methods of the [`object()`](#object) type. Note that validating a function keys will cause the function
to be cloned. While the function will retain its prototype and closure, it will lose its `length` property value (will be
set to `0`).

```js
const func = Joi.function();
await func.validateAsync(function () {});
```

Possible validation errors: [`object.base`](#objectbase)

#### `function.arity(n)`

Specifies the arity of the function where:
- `n` - the arity expected.

```js
const schema = Joi.function().arity(2);
```

Possible validation errors: [`function.arity`](#functionarity)

#### <a /> `function.class()`

Requires the function to be a class.

```js
const schema = Joi.function().class();
```

Possible validation errors: [`function.class`](#functionclass)

#### <a></a> `function.maxArity(n)`

Specifies the maximal arity of the function where:
- `n` - the maximum arity expected.

```js
const schema = Joi.function().maxArity(3);
```

Possible validation errors: [`function.maxArity`](#functionmaxarity)

#### <a /> `function.minArity(n)`

Specifies the minimal arity of the function where:
- `n` - the minimal arity expected.

```js
const schema = Joi.function().minArity(1);
```

Possible validation errors: [`function.minArity`](#functionminarity)

### `link(ref)`

Links to another schema node and reuses it for validation, typically for creative recursive schemas, where:
- `ref` - the reference to the linked schema node. Cannot reference itself or its children as well as other links. Links can be expressed in relative terms like value references (`Joi.link('...')`), in absolute terms from the schema run-time root (`Joi.link('/a')`), or using schema ids implicitly using object keys or explicitly using `any.id()` (`Joi.link('#a.b.c')`).

Supports the methods of the [`any()`](#any) type.

When links are combined with `any.when()` rules, the rules are applied after the link is resolved to the linked schema.

Names links are recommended for most use cases as they are easy to reason and understand, and when mistakes are made, they simply error with invalid link message. Relative links are often hard to follow, especially when they are nested in array or alternatives rules. Absolute links are useful only when the schema is never reused inside another schema as the root is the run-time root of the schema being validated, not the current schema root.

Note that named links must be found in a direct ancestor of the link. The names are searched by iterating over the chain of schemas from the current schema to the root. To reach an uncle or cousin, you must use the name of a common ancestor such as a grandparent and then walk down the tree.

Links are resolved once (per runtime) and the result schema cached. If you reuse a link in different places, the first time it is resolved at run-time, the result will be used by all other instances. If you want each link to resolve relative to the place it is used, use a separate `Joi.link()` statement in each place or set the `relative()` flag.

Named links:

```js
const person = Joi.object({
    firstName: Joi.string().required(),
    lastName: Joi.string().required(),
    children: Joi.array()
        .items(Joi.link('#person'))
})
  .id('person');
```

Relative links:

```js
const person = Joi.object({
    firstName: Joi.string().required(),
    lastName: Joi.string().required(),
    children: Joi.array()
        .items(Joi.link('...'))
        // . - the link
        // .. - the children array
        // ... - the person object
});
```

Absolute links:

```js
const person = Joi.object({
    firstName: Joi.string().required(),
    lastName: Joi.string().required(),
    children: Joi.array()
        .items(Joi.link('/'))
});
```

#### `link.ref(ref)`

Initializes the schema after constructions for cases where the schema has to be constructed first and
then initialized. If `ref` was not passed to the constructor, `link.ref()` must be called prior to usaged.

Will throw an error during validation if left uninitialized (e.g. `Joi.link()` called without a link and `link.ref()` not called).

```js
const schema = Joi.object({
    a: [Joi.string(), Joi.number()],
    b: Joi.link().ref('#type.a')
})
    .id('type');
```

#### `link.concat(schema)`

Same as [`any.concat()`](#anyconcatschema) but the schema is merged after the link is resolved which allows merging with schemas of the same type as the resolved link. Will throw an exception during validation if the merged types are not compatible.

### `number`

Generates a schema object that matches a number data type (as well as strings that can be converted to numbers).

By default, it only allows safe numbers, see [`number.unsafe()`](#numberunsafeenabled).

If the validation `convert` option is on (enabled by default), a string will be converted to a `number` if specified. Also, if
`convert` is on and `number.precision()` is used, the value will be converted to the specified `precision` as well.

`Infinity` and `-Infinity` are invalid by default, you can change that behavior by calling `allow(Infinity, -Infinity)`.

Supports the same methods of the [`any()`](#any) type.

```js
const number = Joi.number();
await number.validateAsync(5);
```

Possible validation errors: [`number.base`](#numberbase), [`number.infinity`](#numberinfinity)

#### `number.greater(limit)`

Specifies that the value must be greater than `limit` or a reference.

```js
const schema = Joi.number().greater(5);
```

```js
const schema = Joi.object({
  min: Joi.number().required(),
  max: Joi.number().greater(Joi.ref('min')).required()
});
```

Possible validation errors: [`number.greater`](#numbergreater), [`number.ref`](#numberref)

#### `number.integer()`

Requires the number to be an integer (no floating point).

```js
const schema = Joi.number().integer();
```

Possible validation errors: [`number.base`](#numberbase)

#### `number.less(limit)`

Specifies that the value must be less than `limit` or a reference.

```js
const schema = Joi.number().less(10);
```

```js
const schema = Joi.object({
  min: Joi.number().less(Joi.ref('max')).required(),
  max: Joi.number().required()
});
```

Possible validation errors: [`number.less`](#numberless), [`number.ref`](#numberref)

#### `number.max(limit)`

Specifies the maximum value where:
- `limit` - the maximum value allowed or a reference.

```js
const schema = Joi.number().max(10);
```

```js
const schema = Joi.object({
  min: Joi.number().max(Joi.ref('max')).required(),
  max: Joi.number().required()
});
```

Possible validation errors: [`number.max`](#numbermax), [`number.ref`](#numberref)

#### `number.min(limit)`

Specifies the minimum value where:
- `limit` - the minimum value allowed or a reference.

```js
const schema = Joi.number().min(2);
```

```js
const schema = Joi.object({
  min: Joi.number().required(),
  max: Joi.number().min(Joi.ref('min')).required()
});
```

Possible validation errors: [`number.min`](#numbermin), [`number.ref`](#numberref)

#### `number.multiple(base)`

Specifies that the value must be a multiple of `base` (or a reference):

```js
const schema = Joi.number().multiple(3);
```

Notes: `Joi.number.multiple(base)` _uses the modulo operator (%) to determine if a number is multiple of another number.
Therefore, it has the normal limitations of Javascript modulo operator. The results with decimal/floats may be incorrect._

Possible validation errors: [`number.multiple`](#numbermultiple), [`number.ref`](#numberref)

#### `number.negative()`

Requires the number to be negative.

```js
const schema = Joi.number().negative();
```

Possible validation errors: [`number.negative`](#numbernegative-1)

#### `number.port()`

Requires the number to be a TCP port, so between 0 and 65535.

```js
const schema = Joi.number().port();
```

Possible validation errors: [`number.port`](#numberport-1)

#### `number.positive()`

Requires the number to be positive.

```js
const schema = Joi.number().positive();
```

Possible validation errors: [`number.positive`](#numberpositive-1)

#### `number.precision(limit)`

Specifies the maximum number of decimal places where:
- `limit` - the maximum number of decimal places allowed.

```js
const schema = Joi.number().precision(2);
```

Possible validation errors: [`number.integer`](#numberinteger-1)

#### `number.sign(sign)`

Requires the number to be negative or positive where:
`sign` - one of `'negative'` or `'positive'`.

Possible validation errors: [`number.negative`](#numbernegative-1), [`number.positive`](#numberpositive-1)

#### `number.unsafe([enabled])`

By default, numbers must be within JavaScript's safety range (`Number.MIN_SAFE_INTEGER` & `Number.MAX_SAFE_INTEGER`), and when given a string, should be converted without loss of information. You can allow unsafe numbers at your own risks by calling `number.unsafe()`.

Parameters are:
- `enabled` - optional parameter defaulting to `true` which allows you to reset the behavior of unsafe by providing a falsy value.

```js
const safeNumber = Joi.number();
safeNumber.validate(90071992547409924);
// error -> "value" must be a safe number

const unsafeNumber = Joi.number().unsafe();
unsafeNumber.validate(90071992547409924);
// error -> null
// value -> 90071992547409920
```

Possible validation errors: [`number.unsafe`](#numberunsafe)

### `object`

Generates a schema object that matches an object data type. Defaults to allowing any child key.

Supports the same methods of the [`any()`](#any) type.

```js
const object = Joi.object({
    a: Joi.number().min(1).max(10).integer(),
    b: 'some string'
});

await object.validateAsync({ a: 5 });
```

Note that when an object schema type is passed as an input to another joi method (e.g. array
item) or is set as a key definition, the `Joi.object()` constructor may be omitted. For example:

```js
const schema = Joi.array().items({ a: Joi.string() });
```

Possible validation errors: [`object.base`](#objectbase)

#### `object.and(...peers, [options])`

Defines an all-or-nothing relationship between keys where if one of the peers is present, all of
them are required as well where:
- `peers` - the string key names of which if one present, all are required.
- `options` - optional settings:
    - `separator` - overrides the default `.` hierarchy separator. Set to `false` to treat the `key` as a literal value.

```js
const schema = Joi.object({
    a: Joi.any(),
    b: Joi.any()
}).and('a', 'b');
```

Possible validation errors: [`object.and`](#objectand)

#### `object.append([schema])`

Appends the allowed object keys where:
- `schema` - optional object where each key is assigned a **joi** type object. If `schema` is `null`,`undefined` or `{}` no changes will be applied. Uses object.keys([schema]) to append keys.

```js
// Validate key a
const base = Joi.object({
    a: Joi.number()
});
// Validate keys a, b.
const extended = base.append({
    b: Joi.string()
});
```

#### `object.assert(subject, schema, [message])`

Verifies an assertion where:
- `subject` - the key name, [reference](#refkey-options), or template expression to validate. Note that the reference is resolved against the object itself as value, which means if you want to reference a key of the object being validated, you have to prefix the reference path with `.`.
- `schema` - the validation rules required to satisfy the assertion. If the `schema` includes references, they are resolved against
  the object value, not the value of the `subject` target.
- `message` - optional human-readable message used when the assertion fails. Defaults to 'failed to pass the assertion test'.

```js
const schema = Joi.object({
    a: {
        b: Joi.string(),
        c: Joi.number()
    },
    d: {
        e: Joi.any()
    }
}).assert('.d.e', Joi.ref('a.c'), 'equal to a.c');
```

Possible validation errors: [`object.assert`](#objectassert)

#### `object.instance(constructor, [name])`

Requires the object to be an instance of a given constructor where:
- `constructor` - the constructor function that the object must be an instance of.
- `name` - an alternate name to use in validation errors. This is useful when the constructor function does not have a name.

```js
const schema = Joi.object().instance(RegExp);
```

Possible validation errors: [`object.instance`](#objectinstance)

#### `object.keys([schema])`

Sets or extends the allowed object keys where:
- `schema` - optional object where each key is assigned a **joi** type object. If `schema` is `{}` no keys allowed.
  If `schema` is `null` or `undefined`, any key allowed. If `schema` is an object with keys, the keys are added to any
  previously defined keys (but narrows the selection if all keys previously allowed). Defaults to 'undefined' which
  allows any child key.

```js
const base = Joi.object().keys({
    a: Joi.number(),
    b: Joi.string()
});
// Validate keys a, b and c.
const extended = base.keys({
    c: Joi.boolean()
});
```

Possible validation errors: [`object.unknown`](#objectunknown)

#### `object.length(limit)`

Specifies the exact number of keys in the object where or a reference:
- `limit` - the number of object keys allowed.

```js
const schema = Joi.object().length(5);
```

Possible validation errors: [`object.length`](#objectlength), [`object.ref`](#objectref)

#### `object.max(limit)`

Specifies the maximum number of keys in the object where:
- `limit` - the highest number of object keys allowed or a reference.

```js
const schema = Joi.object().max(10);
```

Possible validation errors: [`object.max`](#objectmax), [`object.ref`](#objectref)

#### `object.min(limit)`

Specifies the minimum number of keys in the object where:
- `limit` - the lowest number of keys allowed or a reference.

```js
const schema = Joi.object().min(2);
```

Possible validation errors: [`object.min`](#objectmin), [`object.ref`](#objectref)

#### `object.nand(...peers, [options])`

Defines a relationship between keys where not all peers can be present at the same time where:
- `peers` - the key names of which if one present, the others may not all be present.
- `options` - optional settings:
    - `separator` - overrides the default `.` hierarchy separator. Set to `false` to treat the `key` as a literal value.

```js
const schema = Joi.object({
    a: Joi.any(),
    b: Joi.any()
}).nand('a', 'b');
```

Possible validation errors: [`object.nand`](#objectnand)

#### `object.or(...peers, [options])`

Defines a relationship between keys where one of the peers is required (and more than one is
allowed) where:
- `peers` - the key names of which at least one must appear.
- `options` - optional settings:
    - `separator` - overrides the default `.` hierarchy separator. Set to `false` to treat the `key` as a literal value.

```js
const schema = Joi.object({
    a: Joi.any(),
    b: Joi.any()
}).or('a', 'b');
```

Possible validation errors: [`object.missing`](#objectmissing)

#### `object.oxor(...peers, [options])`

Defines an exclusive relationship between a set of keys where only one is allowed but none are
required where:
- `peers` - the exclusive key names that must not appear together but where none are required.
- `options` - optional settings:
    - `separator` - overrides the default `.` hierarchy separator. Set to `false` to treat the `key` as a literal value.

```js
const schema = Joi.object({
    a: Joi.any(),
    b: Joi.any()
}).oxor('a', 'b');
```

Possible validation errors: [`object.oxor`](#objectoxor)

#### `object.pattern(pattern, schema, [options])`

Specify validation rules for unknown keys matching a pattern where:
- `pattern` - a pattern that can be either a regular expression or a **joi** schema that will be tested against the unknown key names. Note that if the pattern is a regular expression, for it to match the entire key name, it must begin with `^` and end with `$`.
- `schema` - the schema object matching keys must validate against.
- `options` - options settings:
    - `fallthrough` - if `true`, multiple matching patterns are tested against the key, otherwise once a pattern match is found, no other patterns are compared. Defaults to `false`.
    - `matches` - a joi array schema used to validated the array of matching keys. For example, `Joi.object().pattern(/\d/, Joi.boolean(), { matches: Joi.array().length(2) })` will require two matching keys. If the `matches` schema is not an array type schema, it will be converted to `Joi.array().items(matches)`. If the `matches` schema contains references, they are resolved against the ancestors as follows:
        - self - the array of matching keys (`Joi.ref('.length')`)
        - parent - the object value containing the keys (`Joi.ref('a')`)

```js
const schema = Joi.object({
    a: Joi.string()
}).pattern(/\w\d/, Joi.boolean());

// OR

const schema = Joi.object({
    a: Joi.string()
}).pattern(Joi.string().min(2).max(5), Joi.boolean());
```

Possible validation errors: [`object.pattern.match`](#objectpatternmatch)

#### `object.ref()`

Requires the object to be a **joi** reference.

```js
const schema = Joi.object().ref();
```

Possible validation errors: [`object.refType`](#objectreftype)

#### `object.regex()`

Requires the object to be a `RegExp` object.

```js
const schema = Joi.object().regex();
```

Possible validation errors: [`object.regex`](#objectregex)

#### `object.rename(from, to, [options])`

Renames a key to another name (deletes the renamed key) where:
- `from` - the original key name or a regular expression matching keys.
- `to` - the new key name. `to` can be set to a [`template`](#templatetemplate-options) which is rendered at runtime using the current value, global context, and local context if `from` is a regular expression (e.g. the expression `/^(\d+)$/` will match any all-digits keys with a capture group that is accessible in the template via `{#1}`).
- `options` - an optional object with the following optional keys:
    - `alias` - if `true`, does not delete the old key name, keeping both the new and old keys in place. Defaults to `false`.
    - `multiple` - if `true`, allows renaming multiple keys to the same destination where the last rename wins. Defaults to `false`.
    - `override` - if `true`, allows renaming a key over an existing key. Defaults to `false`.
    - `ignoreUndefined` - if `true`, skip renaming of a key if it's undefined. Defaults to `false`.

Keys are renamed before any other validation rules are applied. If `to` is a template that references the object own keys (e.g. `'{.prefix}-{#1}'`), the value of these keys is the raw input value, not the value generated after validation. If a key is renamed and then its value fails to pass a validation rule, the error message will use the renamed key, not the original key which may be confusing for users (labels can help in some cases).

```js
const object = Joi.object({
    a: Joi.number()
}).rename('b', 'a');

await object.validateAsync({ b: 5 });
```

Using a regular expression:

```js
const regex = /^foobar$/i;

const schema = Joi.object({
  fooBar: Joi.string()
}).rename(regex, 'fooBar');

await schema.validateAsync({ FooBar: 'a'});
```

Using a regular expression with template:

```js
const schema = Joi.object()
    .rename(/^(\d+)$/, Joi.template('x{#1}x'))
    .pattern(/^x\d+x$/, Joi.any());

const input = {
    123: 'x',
    1: 'y',
    0: 'z',
    x4x: 'test'
};

const value = await Joi.compile(schema).validateAsync(input);
// value === { x123x: 'x', x1x: 'y', x0x: 'z', x4x: 'test' }
```

Possible validation errors: [`object.rename.multiple`](#objectrenamemultiple), [`object.rename.override`](#objectrenameoverride)

#### `object.schema([type])`

Requires the object to be a **joi** schema instance where:
- `type` - optional **joi** schema to require.

```js
const schema = Joi.object().schema();
```

Possible validation errors: [`object.schema`](#objectschema-1)

#### `object.unknown([allow])`

Overrides the handling of unknown keys for the scope of the current object only (does not apply to children) where:
- `allow` - if `false`, unknown keys are not allowed, otherwise unknown keys are ignored.

```js
const schema = Joi.object({ a: Joi.any() }).unknown();
```

Possible validation errors: [`object.unknown`](#objectunknown)

#### `object.with(key, peers, [options])`

Requires the presence of other keys whenever the specified key is present where:
- `key` - the reference key.
- `peers` - the required peer key names that must appear together with `key`. `peers` can be a
  single string value or an array of string values.
- `options` - optional settings:
    - `separator` - overrides the default `.` hierarchy separator. Set to `false` to treat the `key` as a literal value.

Note that unlike [`object.and()`](#objectandpeers-options), `with()` creates a dependency only between the `key` and each of the `peers`, not
between the `peers` themselves.

```js
const schema = Joi.object({
    a: Joi.any(),
    b: Joi.any()
}).with('a', 'b');
```

Possible validation errors: [`object.with`](#objectwith)

#### `object.without(key, peers, [options])`

Forbids the presence of other keys whenever the specified is present where:
- `key` - the reference key.
- `peers` - the forbidden peer key names that must not appear together with `key`. `peers` can be a
  single string value or an array of string values.
- `options` - optional settings:
    - `separator` - overrides the default `.` hierarchy separator. Set to `false` to treat the `key` as a literal value.

```js
const schema = Joi.object({
    a: Joi.any(),
    b: Joi.any()
}).without('a', ['b']);
```

Possible validation errors: [`object.without`](#objectwithout)

#### `object.xor(...peers, [options])`

Defines an exclusive relationship between a set of keys where one of them is required but not at
the same time where:
- `peers` - the exclusive key names that must not appear together but where one of them is required.
- `options` - optional settings:
    - `separator` - overrides the default `.` hierarchy separator. Set to `false` to treat the `key` as a literal value.

```js
const schema = Joi.object({
    a: Joi.any(),
    b: Joi.any()
}).xor('a', 'b');
```

Possible validation errors: [`object.xor`](#objectxor), [`object.missing`](#objectmissing)

### `string`

Generates a schema object that matches a string data type.

**Note that the empty string is not allowed by default and must be enabled with `allow('')`. Don't over think, just remember that the empty string is not a valid string by default. Also, don't ask to change it or argue why it doesn't make sense. This topic is closed.**

To specify a default value in case of the empty string use:

```js
Joi.string()
    .empty('')
    .default('default value');
```

If the `convert` preference is `true` (the default value), a string will be converted using the specified modifiers
for `string.lowercase()`, `string.uppercase()`, `string.trim()`, and each replacement specified with `string.replace()`.

Supports the same methods of the [`any()`](#any) type.

```js
const schema = Joi.string().min(1).max(10);
await schema.validateAsync('12345');
```

Possible validation errors: [`string.base`](#stringbase), [`string.empty`](#stringempty)

#### `string.alphanum()`

Requires the string value to only contain a-z, A-Z, and 0-9.

```js
const schema = Joi.string().alphanum();
```

Possible validation errors: [`string.alphanum`](#stringalphanum-1)

#### `string.base64([options])`

Requires the string value to be a valid base64 string; does not check the decoded value.

- `options` - optional settings:
    - `paddingRequired` - if `true`, the string must be properly padded with the `=` characters. Defaults to `true`.
    - `urlSafe` - if `true`, uses the URI-safe base64 format which replaces `+` with `-` and `\` with `_`. Defaults to `false`.

Padding characters are not required for decoding, as the number of missing bytes can be inferred from the number of digits. With that said, try to use padding if at all possible.

```js
const schema = Joi.string().base64();
schema.validate('VE9PTUFOWVNFQ1JFVFM'); // ValidationError: "value" must be a valid base64 string
schema.validate('VE9PTUFOWVNFQ1JFVFM='); // No Error

const paddingRequiredSchema = Joi.string().base64({ paddingRequired: true });
paddingRequiredSchema.validate('VE9PTUFOWVNFQ1JFVFM'); // ValidationError: "value" must be a valid base64 string
paddingRequiredSchema.validate('VE9PTUFOWVNFQ1JFVFM='); // No Error

const paddingOptionalSchema = Joi.string().base64({ paddingRequired: false });
paddingOptionalSchema.validate('VE9PTUFOWVNFQ1JFVFM'); // No Error
paddingOptionalSchema.validate('VE9PTUFOWVNFQ1JFVFM='); // No Error
```

Possible validation errors: [`string.base64`](#stringbase64)

#### `string.case(direction)`

Sets the required string case where:
- `direction` - can be either `'upper'` or `'lower'`.

```js
const schema = Joi.string().case('lower');
```

Possible validation errors: [`string.lowercase`](#stringlowercase-1) [`string.uppercase`](#stringuppercase-1)

#### `string.creditCard()`

Requires the number to be a credit card number (Using [Luhn
Algorithm](http://en.wikipedia.org/wiki/Luhn_algorithm)).

```js
const schema = Joi.string().creditCard();
```

Possible validation errors: [`string.creditCard`](#stringcreditcard-1)

#### `string.dataUri([options])`

Requires the string value to be a valid data URI string.

- `options` - optional settings:
    - `paddingRequired` - optional parameter defaulting to `true` which will require `=` padding if `true` or make padding optional if `false`.

```js
const schema = Joi.string().dataUri();
schema.validate('VE9PTUFOWVNFQ1JFVFM='); // ValidationError: "value" must be a valid dataUri string
schema.validate('data:image/png;base64,VE9PTUFOWVNFQ1JFVFM='); // No Error
```

Possible validation errors: [`string.dataUri`](#stringdatauri)

#### `string.domain([options])`

Requires the string value to be a valid domain name.

- `options` - optional settings:
    - `allowUnicode` - if `true`, Unicode characters are permitted. Defaults to `true`.
    - `minDomainSegments` - number of segments required for the domain. Defaults to `2`.
    - `maxDomainSegments` - maximum number of allowed domain segments. Default to no limit.
    - `tlds` - options for TLD (top level domain) validation. By default, the TLD must be a valid
      name listed on the [IANA registry](http://data.iana.org/TLD/tlds-alpha-by-domain.txt). To
      disable validation, set `tlds` to `false`. To customize how TLDs are validated, set one of
      these:
        - `allow` - one of:
            - `true` to use the IANA list of registered TLDs. This is the default value.
            - `false` to allow any TLD not listed in the `deny` list, if present.
            - a `Set` or array of the allowed TLDs. Cannot be used together with `deny`.
        - `deny` - one of:
            - a `Set` or array of the forbidden TLDs. Cannot be used together with a custom `allow`
              list.

```js
const schema = Joi.string().domain();
```

Possible validation errors: [`string.domain`](#stringdomain)

#### `string.email([options])`

Requires the string value to be a valid email address.

- `options` - optional settings:
    - `allowUnicode` - if `true`, Unicode characters are permitted. Defaults to `true`.
    - `ignoreLength` - if `true`, ignore invalid email length errors. Defaults to `false`.
    - `minDomainSegments` - number of segments required for the domain. The default setting excludes
      single segment domains such as `example@io` which is a valid email but very uncommon. Defaults
      to `2`.
    - `maxDomainSegments` - maximum number of allowed domain segments. Default to no limit.
    - `multiple` - if `true`, allows multiple email addresses in a single string, separated by `,`
      or the `separator` characters. Defaults to `false`.
    - `separator` - when `multiple` is `true`, overrides the default `,` separator. String can be
      a single character or multiple separator characters. Defaults to `','`.
    - `tlds` - options for TLD (top level domain) validation. By default, the TLD must be a valid
      name listed on the [IANA registry](http://data.iana.org/TLD/tlds-alpha-by-domain.txt). To
      disable validation, set `tlds` to `false`. To customize how TLDs are validated, set one of
      these:
        - `allow` - one of:
            - `true` to use the IANA list of registered TLDs. This is the default value.
            - `false` to allow any TLD not listed in the `deny` list, if present.
            - a `Set` or array of the allowed TLDs. Cannot be used together with `deny`.
        - `deny` - one of:
            - a `Set` or array of the forbidden TLDs. Cannot be used together with a custom `allow`
              list.

```js
const schema = Joi.string().email();
```

Note that quoted email addresses (e.g. `"test"@example.com`) are not supported and will fail validation.

Possible validation errors: [`string.email`](#stringemail)

#### `string.guid()` - aliases: `uuid`

Requires the string value to be a valid GUID.

- `options` - optional settings:
    - `version` - specifies one or more acceptable versions. Can be an Array or String with the following values:
      `uuidv1`, `uuidv2`, `uuidv3`, `uuidv4`, or `uuidv5`. If no `version` is specified then it is assumed to be a generic `guid`
      which will not validate the version or variant of the guid and just check for general structure format.
    - `separator` - defines the allowed or required GUID separator where:
        - `true` - a separator is required, can be either `:` or `-`.
        - `false` - separator is not allowed.
        - `'-'` - a dash separator is required.
        - `':'` - a colon separator is required.
        - defaults to optional `:` or `-` separator.

```js
const schema = Joi.string().guid({
    version: [
        'uuidv4',
        'uuidv5'
    ]
});
```

Possible validation errors: [`string.guid`](#stringguid)

#### `string.hex([options])`

Requires the string value to be a valid hexadecimal string.

- `options` - optional settings:
  - `byteAligned` - Boolean specifying whether you want to check that the hexadecimal string is byte aligned. If `convert` is `true`, a `0` will be added in front of the string in case it needs to be aligned. Defaults to `false`.
```js
const schema = Joi.string().hex();
```

Possible validation errors: [`string.hex`](#stringhex), [`string.hexAlign`](#stringhexalign)

#### `string.hostname()`

Requires the string value to be a valid hostname as per [RFC1123](http://tools.ietf.org/html/rfc1123).

```js
const schema = Joi.string().hostname();
```

Possible validation errors: [`string.hostname`](#stringhostname-1)

#### `string.insensitive()`

Allows the value to match any value in the allowed list or disallowed list in a case insensitive comparison.

```js
const schema = Joi.string().valid('a').insensitive();
```

#### `string.ip([options])`

Requires the string value to be a valid ip address.

- `options` - optional settings:
    - `version` - One or more IP address versions to validate against. Valid values: `ipv4`, `ipv6`, `ipvfuture`
    - `cidr` - Used to determine if a CIDR is allowed or not. Valid values: `optional`, `required`, `forbidden`

```js
// Accept only ipv4 and ipv6 addresses with a CIDR
const schema = Joi.string().ip({
  version: [
    'ipv4',
    'ipv6'
  ],
  cidr: 'required'
});
```

Possible validation errors: [`string.ip`](#stringip), [`string.ipVersion`](#stringipversion)

#### `string.isoDate()`

Requires the string value to be in valid ISO 8601 date format.

If the validation `convert` option is on (enabled by default), the string will be forced to
simplified extended ISO format (ISO 8601). Be aware that this operation uses javascript Date
object, which does not support the full ISO format, so a few formats might not pass when using
`convert`.

```js
const schema = Joi.string().isoDate();
schema.validate('2018-11-28T18:25:32+00:00'); // No Error
schema.validate('20181-11-28T18:25:32+00:00'); // ValidationError: must be a valid 8601 date
schema.validate(''); // ValidationError: must be a valid 8601 date
```

Possible validation errors: [`string.isoDate`](#stringisodate-1)

#### `string.isoDuration()`

Requires the string value to be in valid ISO 8601 duration format.

```js
const schema = Joi.string().isoDuration();
schema.validate('P3Y6M4DT12H30M5S'); // No Error
schema.validate('2018-11-28T18:25:32+00:00'); // ValidationError: must be a valid ISO 8601 duration
schema.validate(''); // ValidationError: must be a valid ISO 8601 duration
```

Possible validation errors: [`string.isoDuration`](#stringisoduration-1)

#### `string.length(limit, [encoding])`

Specifies the exact string length required where:
- `limit` - the required string length or a reference.
- `encoding` - if specified, the string length is calculated in bytes using the provided encoding.

```js
const schema = Joi.string().length(5);
```

```js
const schema = Joi.object({
  length: Joi.string().required(),
  value: Joi.string().length(Joi.ref('length'), 'utf8').required()
});
```

Possible validation errors: [`string.length`](#stringlength), [`string.ref`](#stringref)

#### `string.lowercase()`

Requires the string value to be all lowercase. If the validation `convert` option is on (enabled by default), the string
will be forced to lowercase.

```js
const schema = Joi.string().lowercase();
```

Possible validation errors: [`string.lowercase`](#stringlowercase-1)

#### `string.max(limit, [encoding])`

Specifies the maximum number of string characters where:
- `limit` - the maximum number of string characters allowed or a reference.
- `encoding` - if specified, the string length is calculated in bytes using the provided encoding.

```js
const schema = Joi.string().max(10);
```

```js
const schema = Joi.object({
  max: Joi.string().required(),
  value: Joi.string().max(Joi.ref('max'), 'utf8').required()
});
```

Possible validation errors: [`string.max`](#stringmax), [`string.ref`](#stringref)

#### `string.min(limit, [encoding])`

Specifies the minimum number string characters where:
- `limit` - the minimum number of string characters required or a reference.
- `encoding` - if specified, the string length is calculated in bytes using the provided encoding.

```js
const schema = Joi.string().min(2);
```

```js
const schema = Joi.object({
  min: Joi.string().required(),
  value: Joi.string().min(Joi.ref('min'), 'utf8').required()
});
```

Possible validation errors: [`string.min`](#stringmin), [`string.ref`](#stringref)

#### `string.normalize([form])`

Requires the string value to be in a [Unicode normalized](https://developer.mozilla.org/en/docs/Web/JavaScript/Reference/Global_Objects/String/normalize)
form. If the validation `convert` option is on (enabled by default), the string will be normalized.

- `form` - The Unicode normalization form to use. Valid values: `NFC` [default], `NFD`, `NFKC`, `NFKD`

```js
const schema = Joi.string().normalize(); // defaults to NFC
const schema = Joi.string().normalize('NFC'); // canonical composition
const schema = Joi.string().normalize('NFD'); // canonical decomposition
const schema = Joi.string().normalize('NFKC'); // compatibility composition
const schema = Joi.string().normalize('NFKD'); // compatibility decomposition
```

Possible validation errors: [`string.normalize`](#stringnormalize)

#### `string.pattern(regex, [name | options])` - aliases: `regex`

Defines a pattern rule where:
- `regex` - a regular expression object the string value must match against. Note that if the pattern is a regular expression, for it to match the entire key name, it must begin with `^` and end with `$`.
- `name` - optional name for patterns (useful with multiple patterns).
- `options` - an optional configuration object with the following supported properties:
  - `name` - optional pattern name.
  - `invert` - optional boolean flag. Defaults to `false` behavior. If specified as `true`, the
    provided pattern will be disallowed instead of required.

```js
const schema = Joi.string().pattern(/^[abc]+$/);

const inlineNamedSchema = Joi.string().pattern(/^[0-9]+$/, 'numbers');
inlineNamedSchema.validate('alpha'); // ValidationError: "value" with value "alpha" fails to match the numbers pattern

const namedSchema = Joi.string().pattern(/^[0-9]+$/, { name: 'numbers'});
namedSchema.validate('alpha'); // ValidationError: "value" with value "alpha" fails to match the numbers pattern

const invertedSchema = Joi.string().pattern(/^[a-z]+$/, { invert: true });
invertedSchema.validate('lowercase'); // ValidationError: "value" with value "lowercase" matches the inverted pattern: [a-z]

const invertedNamedSchema = Joi.string().pattern(/^[a-z]+$/, { name: 'alpha', invert: true });
invertedNamedSchema.validate('lowercase'); // ValidationError: "value" with value "lowercase" matches the inverted alpha pattern
```

Possible validation errors: [`string.pattern.base`](#stringpatternbase), [`string.pattern.invert.base`](#stringpatterninvertbase), [`string.pattern.invert.name`](#stringpatterninvertname), [`string.pattern.name`](#stringpatternname)

#### `string.replace(pattern, replacement)`

Replace characters matching the given _pattern_ with the specified
_replacement_ string where:
- `pattern` - a regular expression object to match against, or a string of which _all_ occurrences will be replaced.
- `replacement` - the string that will replace the pattern.


```js
const schema = Joi.string().replace(/b/gi, 'x');
await schema.validateAsync('abBc');  // return value will be 'axxc'
```

When `pattern` is a _string_ all its occurrences will be replaced.

#### `string.token()`

Requires the string value to only contain a-z, A-Z, 0-9, and underscore _.

```js
const schema = Joi.string().token();
```

Possible validation errors: [`string.token`](#stringtoken-1)

#### `string.trim([enabled])`

Requires the string value to contain no whitespace before or after. If the validation `convert` option is on (enabled by
default), the string will be trimmed.

Parameters are:
- `enabled` - optional parameter defaulting to `true` which allows you to reset the behavior of trim by providing a falsy value.

```js
const schema = Joi.string().trim();
const schema = Joi.string().trim(false); // disable trim flag
```

Possible validation errors: [`string.trim`](#stringtrim)

#### `string.truncate([enabled])`

Specifies whether the `string.max()` limit should be used as a truncation.

Parameters are:
- `enabled` - optional parameter defaulting to `true` which allows you to reset the behavior of truncate by providing a falsy value.

```js
const schema = Joi.string().max(5).truncate();
```

#### `string.uppercase()`

Requires the string value to be all uppercase. If the validation `convert` option is on (enabled by default), the string
will be forced to uppercase.

```js
const schema = Joi.string().uppercase();
```

Possible validation errors: [`string.uppercase`](#stringuppercase-1)

#### `string.uri([options])`

Requires the string value to be a valid [RFC 3986](http://tools.ietf.org/html/rfc3986) URI.

- `options` - optional settings:
    - `scheme` - Specifies one or more acceptable Schemes, should only include the scheme name. Can be an Array or String (strings are automatically escaped for use in a Regular Expression).
    - `allowRelative` - Allow relative URIs. Defaults to `false`.
    - `relativeOnly` - Restrict only relative URIs.  Defaults to `false`.
    - `allowQuerySquareBrackets` - Allows unencoded square brackets inside the query string. This is **NOT** RFC 3986 compliant but query strings like `abc[]=123&abc[]=456` are very common these days. Defaults to `false`.
    - `domain` - Validate the domain component using the options specified in [`string.domain()`](#stringdomainoptions).

```js
// Accept git or git http/https
const schema = Joi.string().uri({
  scheme: [
    'git',
    /git\+https?/
  ]
});
```

Possible validation errors: [`string.uri`](#stringuri), [`string.uriCustomScheme`](#stringuricustomscheme), [`string.uriRelativeOnly`](#stringurirelativeonly), [`string.domain`](#stringdomain)

### `symbol`

Generates a schema object that matches a `Symbol` data type.

If the validation `convert` option is on (enabled by default), the mappings declared in `map()` will be tried for an eventual match.

Supports the same methods of the [`any()`](#any) type.

```js
const schema = Joi.symbol().map({ 'foo': Symbol('foo'), 'bar': Symbol('bar') });
await schema.validateAsync('foo');
```

Possible validation errors: [`symbol.base`](#symbolbase)

#### `symbol.map(map)`

Allows values to be transformed into `Symbol`s, where:
- `map` - mapping declaration that can be:
  - an object, where keys are strings, and values are `Symbol`s
  - an array of arrays of length 2, where for each sub-array, the 1st element must be anything but an object, a function or a `Symbol`, and the 2nd element must be a Symbol
  - a `Map`, following the same principles as the array above

```js
const schema = Joi.symbol().map([
    [1, Symbol('one')],
    ['two', Symbol('two')]
]);
```

Possible validation errors: [`symbol.map`](#symbolmap)

## Extensions

Before writing your own extensions, it is useful to understand how input values are processed. When `validate()` is called, Joi does the following:

- Generates a new schema if the current one contains dynamic construction rules such as `when()` or `link()`.
- Merges the validation options with the ones passed via [`any.prefs()`](#anyprefsoptions---aliases-preferences-options).
- Returns the result if caching is enabled and the input value is found in the cache. 
- Runs the `prepare` method defined below. If a validation error is returned, the process will be aborted regardless of `abortEarly`.
- Coerces the input value using the `coerce` method defined below if `convert` is enabled. If a validation error is returned, the process will be aborted regardless of `abortEarly`.
- If the input alue matches the schema passed to [`any.empty()`](#anyemptyschema)), it is converted to `undefined`.
- Validates presences.
- Validates allowed/valid/invalid values.
- Runs base validation using the `validate` method defined below. If a validation error is returned, the process will be aborted regardless of `abortEarly`.
- Runs validation rules.

**Note that extending schemas do not change the order in which Joi performs the above steps**

The [`extend()`](#extendextensions) method adds custom types to **joi**. Extensions can be:
- a single extension object.
- a factory function generating an extension object.

Where:
- `type`: The type of schema. Can be a string, or a regular expression that matches multiple types. 
- `base`: The base schema to extend from. This key is forbidden when `type` is a regular expression.
- `messages`: A hash of error codes and their messages. To interpolate dynamic values, use the [template syntax](#template-syntax). 
- `flags`: A hash of flag names and their definitions where:
    - `default`: The default value of the flag. When `describe()` is called and the current flag matches this default value, it will be omitted entirely from the description.
- `prepare`: A function with signature `function (value, helpers) {}` that prepares the input value (for example, converts `,` to `.` to support multiple decimal representations) where:
    - `value`: The input value.
    - `helpers`: [Validation helpers](#validation-helpers)

    Must return an object with one of the following keys:
    - `value`: The modified value.
    - `errors`: Validation error(s) generated by `$_createError()` or `helpers.error()`.

    If `errors` is defined, validation will abort regardless of `abortEarly`. Refer to the validation process above for further information.
- `coerce`: A function with signature `function (value, helpers) {}` that coerces the input value where:
    - `value`: The input value.
    - `helpers`: [Validation helpers](#validation-helpers)

    You can also pass an object where:
    - `from`: The type(s) to convert from. Can be a single string or an array of strings. Joi will only run `method` if the value `typeof` of the input value is equal to one of the provided values.
    - `method`: A function with signature `function (value, helpers)` that coerces the input value where:
        - `value`: The input value.
        - `helpers`: [Validation helpers](#validation-helpers)

    Must return an object with one of the following keys:
    - `value`: The modified value.
    - `errors`: Validation error(s) generated by `$_createError()` or `helpers.error()`.

    If `errors` is defined, validation will abort regardless of `abortEarly`. Refer to the validation process above for further information.
- `validate`: A function with signature `function (value, helpers) {}` that performs base validation on the input value where:
    - `value`: The input value.
    - `helpers`: [Validation helpers](#validation-helpers)

    Must return an object with one of the following keys:
    - `value`: The modified value.
    - `errors`: Validation error(s) generated by `$_createError()` or `helpers.error()`.

    If `errors` is defined, validation will abort regardless of `abortEarly`. Refer to the validation process above for further information.
- `rules`: A hash of validation rule names and their implementation where:
    - `alias`: Aliases of the rule. Can be a string or an array of strings.
    - `args`: An array of argument names or an object that define the parameters the rule will accept where:
        - `name`: The argument name.
        - `ref`: Whether this argument allows references. Joi will resolve them before passing to `validate`. Defaults to `false`.
        - `assert`: A function of signature `function (value) {}` that validates the argument by returning a boolean. Also accepts a Joi schema. This key is required if `ref` is set to `true`.
        - `normalize`: A function of signature `function (value) {}` that normalizes the argument before passing it to `assert`.
        - `message`: A message to throw if `assert` is a function. This key is forbidden if `assert` is a schema.
    - `convert`: Whether this is a dual rule that converts the input value and validates it at the same time. Defaults to `false`.
    - `manifest`: Whether this rule should be outputted in the schema's description. Defaults to `true`.
    - `method`: The method that will be attached onto the schema instance. Useful when you need to set flags. If set to `undefined`, Joi will default to a function that when called will add the rule to the rules queue. If set to `false`, the no method will be added to the instance.
    - `multi`: Whether this rule can be invoked multiple times. Defaults to `false`.
    - `validate`: A function of signature `function (value, helpers, args, rule)` that validates the input value where:
        - `value`: The input value.
        - `helpers`: [Validation helpers](#validation-helpers)
        - `args`: Resolved and validated arguments mapped by their names.
        - `rule`: The rule definitions passed to `$_addRule` left untouched. Useful if you need access to the raw arguments before validation. 
- `overrides`: A hash of method names and their overridden implementation. To refer to the parent method, use [`$_parent()`](#_parentmethod-args)

```js
const Joi = require('joi');

const custom = Joi.extend((joi) => {

    return {
        type: 'million',
        base: joi.number(),
        messages: {
            'million.base': '{{#label}} must be at least a million',
            'million.big': '{{#label}} must be at least five millions',
            'million.round': '{{#label}} must be a round number',
            'million.dividable': '{{#label}} must be dividable by {{#q}}'
        },
        coerce(value, helpers) {

            // Only called when prefs.convert is true

            if (helpers.schema.$_getRule('round')) {
                return { value: Math.round(value) };
            }
        },
        validate(value, helpers) {

            // Base validation regardless of the rules applied

            if (value < 1000000) {
                return { value, errors: helpers.error('million.base') };
            }

            // Check flags for global state

            if (helpers.schema.$_getFlag('big') &&
                value < 5000000) {

                return { value, errors: helpers.error('million.big') };
            }
        },
        rules: {
            big: {
                alias: 'large',
                method() {

                    return this.$_setFlag('big', true);
                }
            },
            round: {
                convert: true,              // Dual rule: converts or validates
                method() {

                    return this.$_addRule('round');
                },
                validate(value, helpers, args, options) {

                    // Only called when prefs.convert is false (due to rule convert option)

                    if (value % 1 !== 0) {
                        return helpers.error('million.round');
                    }
                }
            },
            dividable: {
                multi: true,                // Rule supports multiple invocations
                method(q) {

                    return this.$_addRule({ name: 'dividable', args: { q } });
                },
                args: [
                    {
                        name: 'q',
                        ref: true,
                        assert: (value) => typeof value === 'number' && !isNaN(value),
                        message: 'must be a number'
                    }
                ],
                validate(value, helpers, args, options) {

                    if (value % args.q === 0) {
                        return value;       // Value is valid
                    }

                    return helpers.error('million.dividable', { q: args.q });
                }
            },
            even: {
                method() {

                    // Rule with only method used to alias another rule

                    return this.dividable(2);
                }
            }
        }
    };
});

const schema = custom.object({
    a: custom.million().round().dividable(Joi.ref('b')),
    b: custom.number(),
    c: custom.million().even().dividable(7),
    d: custom.million().round().prefs({ convert: false }),
    e: custom.million().large()
});
```

### Validation helpers

- `original`: The original value passed untouched to `validate()`.
- `prefs`: The prepared validation options.
- `schema`: The reference to the current schema. Useful if you need to use any of the [Advanced functions](#advanced-functions).
- `state`: The current validation state. See [Validation state](#state)
- `error`: A function with signature `function (code, local, localState = currentState) {}` similar to [`$_createError()`](#_createerrorcode-value-local-state-prefs-options) but with the current value, validation options, current state passed where:
    - `code`: The error code. 
    - `local`: Local context used to interpolate the message.
    - `localState`: The localized state.
- `errorsArray`: A function that creates an array that can be recognised by Joi as a valid error array. **Note that using a native JS array can cause Joi to output incorrect results.**
- `warn`: TODO
- `message`: TODO

### Validation state

The validation state is an object that contains information about the validation process such as the current key name of the value and its ancestors. The following methods are supported:

- `localize()`: TODO
- `nest()`: TODO
- `shadow()`: TODO
- `snapshot()`: TODO
- `restore()`: TODO

### Advanced functions

#### $_root

A reference to the current Joi instance. Useful when you want access to the **extended instance**, not the default Joi module.

#### $_parent(method, ...args)

Calls the original method before overriding, similar to `super.method()` when overriding class methods where:
- `method`: The name of the parent method.
- `...args`: The arguments passed directly to the parent method.

#### $_temp

TODO

#### $_terms

TODO

#### $_addRule(options)

Adds a rule to the rules queue where:

- `options`: A rule name string or rule options where:
    - `name`: The name of the rule.
    - `args`: The arguments to be processed.
    - `method`: The name of another rule to reuse.
    
    You can also pass extra properties and they will be accessible within the `rule` argument of the `validate` method.

#### $_compile(schema, options)

Compiles a literal schema definition to a Joi schema object where:
- `schema`: The schema to compile.
- `options`: TODO

#### $_createError(code, value, local, state, prefs, options)

Creates a Joi validation error where:
- `code`: The error code.
- `value`: The current value being validated.
- `local`: Local context used to interpolate the message.
- `state`: [Validation state](#validation-state).
- `prefs`: Prepared validation options.
- `options`: Error options. TODO

#### $_getFlag(name)

Gets a flag named `name`.

#### $_getRule(name)

Gets a single (`multi` set to `false`) rule named `name`.

#### $_mapLabels(path)

TODO

#### $_match(value, state, prefs, overrides)

TODO

#### $_modify(options)

TODO

#### $_mutateRebuild()

TODO

#### $_mutateRegister(schema, options)

TODO

#### $_property(name)

TODO

#### $_reach(path)

TODO

#### $_rootReferences()

TODO

#### $_setFlag(name, value, options)

Sets a flag where:
- `name`: The flag name to set.
- `value`: The value to set the flag to.
- `options`: Optional options where:
    - `clone`: Whether to clone the schema. Defaults to `true`. Only set to `false` if the schema has already been cloned before. 

#### $_validate(value, state, prefs)

Performs validation against the current schema without the extra overhead of merging validation options to a default set of values where:
- `value`: The input value to validate.
- `state`: [Validation state](#validation-state)
- `prefs`: The prepared validation options.

**Use this method to perform validation against nested schemas instead of `validate()`**


## Errors

### `ValidationError`

**joi** throws or returns `ValidationError` objects containing :
- `name` - `'ValidationError'`.
- `isJoi` - `true`.
- `details` - an array of errors :
    - `message` - string with a description of the error.
    - `path` - ordered array where each element is the accessor to the value where the error happened.
    - `type` - type of the error.
    - `context` - object providing context of the error containing:
        - `key` - key of the value that erred, equivalent to the last element of `details.path`.
        - `label` - label of the value that erred, or the `key` if any, or the default `messages.root`.
        - `value` - the value that failed validation.
        - other error specific properties as described for each error code.
- `annotate()` - function that returns a string with an annotated version of the object pointing at
  the places where errors occurred. Takes an optional parameter that, if truthy, will strip the
  colors out of the output.

### List of errors

#### `alternatives.all`

The value did not match all of the alternative schemas.

#### `alternatives.any`

No alternative was found to test against the input due to try criteria.

#### `alternatives.match`

No alternative matched the input due to specific matching rules for at least one of the alternatives.

Additional local context properties:
```ts
{
    details: Array<object>, // An array of details for each error found while trying to match to each of the alternatives
    message: string // The combined error messages
}
```

#### `alternatives.one`

The value matched more than one alternative schema.

#### `alternatives.types`

The provided input did not match any of the allowed types.

Additional local context properties:
```ts
{
    types: Array<string> // The list of expected types
}
```

#### `any.custom`

A custom validation method threw an exception.

Additional local context properties:
```ts
{
    error: Error // The error thrown
}
```

#### `any.default`

If your [`any.default()`](#anydefaultvalue-description) generator function throws error, you will have it here.

Additional local context properties:
```ts
{
    error: Error // Error generated during the default value function call
}
```

#### `any.failover`

If your [`any.failover()`](#anyfailovervalue-description) generator function throws error, you will have it here.

Additional local context properties:
```ts
{
    error: Error // Error generated during the failover value function call
}
```

#### `any.invalid`

The value matched a value listed in the invalid values.

Additional local context properties:
```ts
{
    invalids: Array<any> // Contains the list of the invalid values that should be rejected
}
```

#### `any.only`

Only some values were allowed, the input didn't match any of them.

Additional local context properties:
```ts
{
    valids: Array<any> // Contains the list of the valid values that were expected
}
```

#### `any.ref`

A reference was used in rule argument and the value pointed to by that reference in the input is not valid.

Additional local context properties:
```ts
{
    arg: string, // The argument name
    reason: string, // The reason the referenced value is invalid
    ref: Reference // Reference used
}
```

#### `any.required`

A required value wasn't present.

#### `any.unknown`

A value was present while it wasn't expected.

#### `array.base`

The value is not of Array type or could not be cast to an Array from a string.

#### `array.excludes`

The array contains a value that is part of the exclusion list.

Additional local context properties:
```ts
{
    pos: number // Index where the value was found in the array
}
```

#### `array.includesRequiredBoth`

Some values were expected to be present in the array and are missing. This error happens when we have a mix of labeled and unlabeled schemas.

Additional local context properties:
```ts
{
    knownMisses: Array<string>, // Labels of all the missing values
    unknownMisees: number // Count of missing values that didn't have a label
}
```

#### `array.includesRequiredKnowns`

Some values were expected to be present in the array and are missing. This error happens when we only have labeled schemas.

Additional local context properties:
```ts
{
    knownMisses: Array<string> // Labels of all the missing values
}
```

#### `array.includesRequiredUnknowns`

Some values were expected to be present in the array and are missing. This error happens when we only have unlabeled schemas.

Additional local context properties:
```ts
{
    unknownMisees: number // Count of missing values that didn't have a label
}
```

#### `array.includes`

The value didn't match any of the allowed types for that array.

Additional local context properties:
```ts
{
    pos: number // Index where the value was found in the array
}
```

#### `array.length`

The array is not of the expected length.

Additional local context properties:
```ts
{
    limit: number // Length that was expected for this array
}
```

#### `array.max`

The array has more elements than the maximum allowed.

Additional local context properties:
```ts
{
    limit: number // Maximum length that was expected for this array
}
```

#### `array.min`

The array has less elements than the minimum allowed.

Additional local context properties:
```ts
{
    limit: number // Minimum length that was expected for this array
}
```

#### `array.orderedLength`

Given an [`array.ordered()`](#arrayorderedtype), that array has more elements than it should.

Additional local context properties:
```ts
{
    pos: number, // Index where the value was found in the array
    limit: number // Maximum length that was expected for this array
}
```

#### `array.sort`

The array did not match the required sort order.

Additional local context properties:
```ts
{
    order: string, // 'ascending' or 'descending'
    by: string // The object key used for comparison
}
```

#### `array.sort.mismatching`

Failed sorting the array due to mismatching item types.

#### `array.sort.unsupported`

Failed sorting the array due to unsupported item types.

Additional local context properties:
```ts
{
    type: string // The unsupported array item type
}
```

#### `array.sparse`

An `undefined` value was found in an array that shouldn't be sparse.

Additional local context properties:
```ts
{
    pos: number // Index where an undefined value was found in the array
}
```

#### `array.unique`

A duplicate value was found in an array.

Additional local context properties:
```ts
{
    pos: number, // Index where the duplicate value was found in the array
    dupePos: number, // Index where the first appearance of the duplicate value was found in the array
    dupeValue: any // Value with which the duplicate was met
}
```

#### `array.hasKnown`

The schema on an [`array.has()`](#arrayhas) was not found in the array. This error happens when the schema is labeled.

Additional local context properties:
```ts
{
    patternLabel: string // Label of assertion schema
}
```

#### `array.hasUnknown`

The schema on an [`array.has()`](#arrayhas) was not found in the array. This error happens when the schema is unlabeled.

#### `binary.base`

The value is either not a Buffer or could not be cast to a Buffer from a string.

#### `binary.length`

The buffer was not of the specified length.

Additional local context properties:
```ts
{
    limit: number // Length that was expected for this buffer
}
```

#### `binary.max`

The buffer contains more bytes than expected.

Additional local context properties:
```ts
{
    limit: number // Maximum length that was expected for this buffer
}
```

#### `binary.min`

The buffer contains less bytes than expected.

Additional local context properties:
```ts
{
    limit: number // Minimum length that was expected for this buffer
}
```

#### `boolean.base`

The value is either not a boolean or could not be cast to a boolean from one of the truthy or falsy values.

#### `date.base`

The value is either not a date or could not be cast to a date from a string or a number.

#### `date.format`

The date does not match the required format.

Additional local context properties:
```ts
{
    format: string // The required format
}
```

#### `date.greater`

The date is over the limit that you set.

Additional local context properties:
```ts
{
    limit: Date // Maximum date
}
```

#### `date.less`

The date is under the limit that you set.

Additional local context properties:
```ts
{
    limit: Date // Minimum date
}
```

#### `date.max`

The date is over or equal to the limit that you set.

Additional local context properties:
```ts
{
    limit: Date // Maximum date
}
```

#### `date.min`

The date is under or equal to the limit that you set.

Additional local context properties:
```ts
{
    limit: Date // Minimum date
}
```

#### `date.strict`

Occurs when the input is not a Date type and `convert` is disabled.

#### `function.arity`

The number of arguments for the function doesn't match the required number.

Additional local context properties:
```ts
{
    n: number // Expected arity
}
```

#### `function.class`

The input is not a JavaScript class.

#### `function.maxArity`

The number of arguments for the function is over the required number.

Additional local context properties:
```ts
{
    n: number // Maximum expected arity
}
```

#### `function.minArity`

The number of arguments for the function is under the required number.

Additional local context properties:
```ts
{
    n: number // Minimum expected arity
}
```

#### `number.base`

The value is not a number or could not be cast to a number.

#### `number.greater`

The number is lower or equal to the limit that you set.

Additional local context properties:
```ts
{
    limit: number // Minimum value that was expected for this number
}
```

#### `number.infinity`

The number is `Infinity` or `-Infinity`.

#### `number.integer`

The number is not a valid integer.

#### `number.less`

The number is higher or equal to the limit that you set.

Additional local context properties:
```ts
{
    limit: number // Maximum value that was expected for this number
}
```

#### `number.max`

The number is higher than the limit that you set.

Additional local context properties:
```ts
{
    limit: number // Maximum value that was expected for this number
}
```

#### `number.min`

The number is lower than the limit that you set.

Additional local context properties:
```ts
{
    limit: number // Minimum value that was expected for this number
}
```

#### `number.multiple`

The number could not be divided by the multiple you provided.

Additional local context properties:
```ts
{
    multiple: number // The number of which the input is supposed to be a multiple of
}
```

#### `number.negative`

The number was positive.

#### `number.port`

The number didn't look like a port number.

#### `number.positive`

The number was negative.

#### `number.precision`

The number didn't have the required precision.

Additional local context properties:
```ts
{
    limit: number // The precision that it should have had
}
```

#### `number.unsafe`

The number is not within the safe range of JavaScript numbers.

#### `object.unknown`

An unexpected property was found in the object.

Additional local context properties:
```ts
{
    child: string // Property that is unexpected
}
```

#### `object.and`

The AND condition between the properties you specified was not satisfied in that object.

Additional local context properties:
```ts
{
    present: Array<string>, // List of properties that are set
    presentWithLabels: Array<string>, // List of labels for the properties that are set
    missing: Array<string>, // List of properties that are not set
    missingWithLabels: Array<string> // List of labels for the properties that are not set
}
```

#### `object.assert`

The schema on an [`object.assert()`](#objectassertref-schema-message) failed to validate.

Additional local context properties:
```ts
{
    subject: object, // The assertion subject. When it is a reference, use subject.key for the display path.
    message: string // Custom message when provided
}
```

#### `object.base`

The value is not of the expected type.

Additional local context properties:
```ts
{
    type: string // The expected type
}
```

#### `object.length`

The number of keys for this object is not of the expected length.

Additional local context properties:
```ts
{
    limit: number // Number of keys that was expected for this object
}
```

#### `object.max`

The number of keys for this object is over or equal to the limit that you set.

Additional local context properties:
```ts
{
    limit: number // Maximum number of keys
}
```

#### `object.min`

The number of keys for this object is under or equal to the limit that you set.

Additional local context properties:
```ts
{
    limit: number // Minimum number of keys
}
```

#### `object.missing`

The OR or XOR condition between the properties you specified was not satisfied in that object, none of them were set.

Additional local context properties:
```ts
{
    peers: Array<string>, // List of properties where none of them were set
    peersWithLabels: Array<string> // List of labels for the properties where none of them were set
}
```

#### `object.nand`

The NAND condition between the properties you specified was not satisfied in that object.

Additional local context properties:
```ts
{
    main: string, // One of the properties that was present
    mainWithLabel: string, // The label of the `main` property
    peers: Array<string>, // List of the other properties that were present
    peersWithLabels: Array<string> // List of the labels of the other properties that were present
}
```

#### `object.pattern.match`

The object keys failed to match a pattern's matches requirement.

Additional local context properties:
```ts
{
    details: Array<object>, // An array of details for each error found while trying to match to each of the alternatives
    message: string, // The combined error messages
    matches: Array<string>  // The matching keys
}
```

#### `object.refType`

The object is not a [`Joi.ref()`](#refkey-options).

#### `object.regex`

The object is not a `RegExp` object.

#### `object.rename.multiple`

Another rename was already done to the same target property.

Additional local context properties:
```ts
{
    from: string, // Origin property name of the rename
    to: string, // Target property of the rename
    pattern: boolean // Indicates if the rename source was a pattern (regular expression)
}
```

#### `object.rename.override`

The target property already exists and you disallowed overrides.

Additional local context properties:
```ts
{
    from: string, // Origin property name of the rename
    to: string, // Target property of the rename
    pattern: boolean // Indicates if the rename source was a pattern (regular expression)
}
```

#### `object.schema`

The object was not a **joi** schema.

Additional local context properties:
```ts
{
    type: string // The required schema
}
```

#### `object.instance`

The object is not of the type you specified.

Additional local context properties:
```ts
{
    type: string // Type name the object should have been
}
```

#### `object.with`

Property that should have been present at the same time as another one was missing.

Additional local context properties:
```ts
{
    main: string, // Property that triggered the check
    mainWithLabel: string, // Label of the property that triggered the check
    peer: string, // Property that was missing
    peerWithLabels: string // Label of the other property that was missing
}
```

#### `object.without`

Property that should have been absent at the same time as another one was present.

Additional local context properties:
```ts
{
    main: string, // Property that triggered the check
    mainWithLabel: string, // Label of the property that triggered the check
    peer: string, // Property that was present
    peerWithLabels: string // Label of the other property that was present
}
```

#### `object.xor`

The XOR condition between the properties you specified was not satisfied in that object.

Additional local context properties:
```ts
{
    peers: Array<string>, // List of properties where none of it or too many of it was set
    peersWithLabels: Array<string> // List of labels for the properties where none of it or too many of it was set
}
```

#### `object.oxor`

The optional XOR condition between the properties you specified was not satisfied in that object.

Additional local context properties:
```ts
{
    peers: Array<string>, // List of properties where too many of it was set
    peersWithLabels: Array<string> // List of labels for the properties where too many of it was set
}
```

#### `string.alphanum`

The string doesn't only contain alphanumeric characters.

#### `string.base64`

The string isn't a valid base64 string.

#### `string.base`

The input is not a string.

#### `string.creditCard`

The string is not a valid credit card number.

#### `string.dataUri`

The string is not a valid data URI.

#### `string.domain`

The string is not a valid domain name.

#### `string.email`

The string is not a valid e-mail.

Additional local context properties:
```ts
{
    invalids: [string] // Array of invalid emails
}
```

#### `string.empty`

When an empty string is found and denied by invalid values.

#### `string.guid`

The string is not a valid GUID.

#### `string.hexAlign`

The string contains hexadecimal characters but they are not byte-aligned.

#### `string.hex`

The string is not a valid hexadecimal string.

#### `string.hostname`

The string is not a valid hostname.

#### `string.ipVersion`

The string is not a valid IP address considering the provided constraints.

Additional local context properties:
```ts
{
    cidr: string, // CIDR used for the validation
    version: Array<string> // List of IP version accepted
}
```

#### `string.ip`

The string is not a valid IP address.

Additional local context properties:
```ts
{
    cidr: string // CIDR used for the validation
}
```

#### `string.isoDate`

The string is not a valid ISO date string.

#### `string.isoDuration`

The string must be a valid ISO 8601 duration.

#### `string.length`

The string is not of the expected length.

Additional local context properties:
```ts
{
    limit: number, // Length that was expected for this string
    encoding: undefined | string // Encoding specified for the check if any
}
```

#### `string.lowercase`

The string isn't all lower-cased.

#### `string.max`

The string is longer than expected.

Additional local context properties:
```ts
{
    limit: number, // Maximum length that was expected for this string
    encoding: undefined | string // Encoding specified for the check if any
}
```

#### `string.min`

The string is shorter than expected.

Additional local context properties:
```ts
{
    limit: number, // Minimum length that was expected for this string
    encoding: undefined | string // Encoding specified for the check if any
}
```

#### `string.normalize`

The string isn't valid in regards of the normalization form expected.

Additional local context properties:
```ts
{
    form: string // Normalization form that is expected
}
```

#### `string.pattern.base`

The string didn't match the regular expression.

Additional local context properties:
```ts
{
    name: undefined, // Undefined since the regular expression has no name
    pattern: string // Regular expression
}
```

#### `string.pattern.name`

The string didn't match the named regular expression.

Additional local context properties:
```ts
{
    name: string, // Name of the regular expression
    pattern: string // Regular expression
}
```

#### `string.pattern.invert.base`

The string matched the regular expression while it shouldn't.

Additional local context properties:
```ts
{
    name: undefined, // Undefined since the regular expression has no name
    pattern: string // Regular expression
}
```

#### `string.pattern.invert.name`

The string matched the named regular expression while it shouldn't.

Additional local context properties:
```ts
{
    name: string, // Name of the regular expression
    pattern: string // Regular expression
}
```

#### `string.token`

The string isn't a token.

#### `string.trim`

The string contains whitespace around it.

#### `string.uppercase`

The string isn't all upper-cased.

#### `string.uri`

The string isn't a valid URI.

#### `string.uriCustomScheme`

The string isn't a valid URI considering the custom schemes.

Additional local context properties:
```ts
{
    scheme: string // Scheme prefix that is expected in the URI
}
```

#### `string.uriRelativeOnly`

The string is a valid relative URI.

#### `symbol.base`

The input is not a Symbol.

#### `symbol.map`

The input is not a Symbol or could not be converted to one.
