<!-- version -->
# 13.3.0 API Reference
<!-- versionstop -->

<img src="https://raw.github.com/hapijs/joi/master/images/validation.png" align="right" />

<!-- toc -->

- [Joi](#joi)
  - [`version`](#version)
  - [`validate(value, schema, [options], [callback])`](#validatevalue-schema-options-callback)
  - [`compile(schema)`](#compileschema)
  - [`describe(schema)`](#describeschema)
  - [`assert(value, schema, [message])`](#assertvalue-schema-message)
  - [`attempt(value, schema, [message])`](#attemptvalue-schema-message)
  - [`ref(key, [options])`](#refkey-options)
  - [`isRef(ref)`](#isrefref)
  - [`reach(schema, path)`](#reachschema-path)
  - [`defaults(fn)`](#defaultsfn)
  - [`extend(extension)`](#extendextension)
    - [Terms](#terms)
    - [Extension](#extension)
    - [npm note](#npm-note)
    - [Examples](#examples)
  - [`any`](#any)
    - [`schemaType`](#schematype)
    - [`any.validate(value, [options], [callback])`](#anyvalidatevalue-options-callback)
    - [`any.allow(value)`](#anyallowvalue)
    - [`any.valid(value)` - aliases: `only`, `equal`](#anyvalidvalue---aliases-only-equal)
    - [`any.invalid(value)` - aliases: `disallow`, `not`](#anyinvalidvalue---aliases-disallow-not)
    - [`any.required()` - aliases: `exist`](#anyrequired---aliases-exist)
    - [`any.optional()`](#anyoptional)
    - [`any.forbidden()`](#anyforbidden)
    - [`any.strip()`](#anystrip)
    - [`any.description(desc)`](#anydescriptiondesc)
    - [`any.notes(notes)`](#anynotesnotes)
    - [`any.tags(tags)`](#anytagstags)
    - [`any.meta(meta)`](#anymetameta)
    - [`any.example(value)`](#anyexamplevalue)
    - [`any.unit(name)`](#anyunitname)
    - [`any.options(options)`](#anyoptionsoptions)
    - [`any.strict(isStrict)`](#anystrictisstrict)
    - [`any.default([value, [description]])`](#anydefaultvalue-description)
    - [`any.concat(schema)`](#anyconcatschema)
    - [`any.when(condition, options)`](#anywhencondition-options)
    - [`any.label(name)`](#anylabelname)
    - [`any.raw(isRaw)`](#anyrawisraw)
    - [`any.empty(schema)`](#anyemptyschema)
    - [`any.error(err)`](#anyerrorerr)
    - [`any.describe()`](#anydescribe)
  - [`array` - inherits from `Any`](#array---inherits-from-any)
    - [`array.sparse([enabled])`](#arraysparseenabled)
    - [`array.single([enabled])`](#arraysingleenabled)
    - [`array.items(type)`](#arrayitemstype)
    - [`array.ordered(type)`](#arrayorderedtype)
    - [`array.min(limit)`](#arrayminlimit)
    - [`array.max(limit)`](#arraymaxlimit)
    - [`array.length(limit)`](#arraylengthlimit)
    - [`array.unique([comparator])`](#arrayuniquecomparator)
  - [`boolean` - inherits from `Any`](#boolean---inherits-from-any)
    - [`boolean.truthy(value)`](#booleantruthyvalue)
    - [`boolean.falsy(value)`](#booleanfalsyvalue)
    - [`boolean.insensitive([enabled])`](#booleaninsensitiveenabled)
  - [`binary` - inherits from `Any`](#binary---inherits-from-any)
    - [`binary.encoding(encoding)`](#binaryencodingencoding)
    - [`binary.min(limit)`](#binaryminlimit)
    - [`binary.max(limit)`](#binarymaxlimit)
    - [`binary.length(limit)`](#binarylengthlimit)
  - [`date` - inherits from `Any`](#date---inherits-from-any)
    - [`date.min(date)`](#datemindate)
    - [`date.max(date)`](#datemaxdate)
    - [`date.greater(date)`](#dategreaterdate)
    - [`date.less(date)`](#datelessdate)
    - [`date.iso()`](#dateiso)
    - [`date.timestamp([type])`](#datetimestamptype)
  - [`func` - inherits from `Any`](#func---inherits-from-any)
    - [`func.arity(n)`](#funcarityn)
    - [`func.minArity(n)`](#funcminarityn)
    - [`func.maxArity(n)`](#funcmaxarityn)
    - [`func.class()`](#funcclass)
    - [`func.ref()`](#funcref)
  - [`number` - inherits from `Any`](#number---inherits-from-any)
    - [`number.min(limit)`](#numberminlimit)
    - [`number.max(limit)`](#numbermaxlimit)
    - [`number.greater(limit)`](#numbergreaterlimit)
    - [`number.less(limit)`](#numberlesslimit)
    - [`number.integer()`](#numberinteger)
    - [`number.precision(limit)`](#numberprecisionlimit)
    - [`number.multiple(base)`](#numbermultiplebase)
    - [`number.positive()`](#numberpositive)
    - [`number.negative()`](#numbernegative)
    - [`number.port()`](#numberport)
  - [`object` - inherits from `Any`](#object---inherits-from-any)
    - [`object.keys([schema])`](#objectkeysschema)
      - [`{} notation`](#-notation)
      - [`Joi.object([schema]) notation`](#joiobjectschema-notation)
      - [`Joi.object().keys([schema]) notation`](#joiobjectkeysschema-notation)
    - [`object.append([schema])`](#objectappendschema)
    - [`object.min(limit)`](#objectminlimit)
    - [`object.max(limit)`](#objectmaxlimit)
    - [`object.length(limit)`](#objectlengthlimit)
    - [`object.pattern(regex, schema)`](#objectpatternregex-schema)
    - [`object.and(peers)`](#objectandpeers)
    - [`object.nand(peers)`](#objectnandpeers)
    - [`object.or(peers)`](#objectorpeers)
    - [`object.xor(peers)`](#objectxorpeers)
    - [`object.with(key, peers)`](#objectwithkey-peers)
    - [`object.without(key, peers)`](#objectwithoutkey-peers)
    - [`object.rename(from, to, [options])`](#objectrenamefrom-to-options)
    - [`object.assert(ref, schema, [message])`](#objectassertref-schema-message)
    - [`object.unknown([allow])`](#objectunknownallow)
    - [`object.type(constructor, [name])`](#objecttypeconstructor-name)
    - [`object.schema()`](#objectschema)
    - [`object.requiredKeys(children)`](#objectrequiredkeyschildren)
    - [`object.optionalKeys(children)`](#objectoptionalkeyschildren)
    - [`object.forbiddenKeys(children)`](#objectforbiddenkeyschildren)
  - [`string` - inherits from `Any`](#string---inherits-from-any)
    - [`string.insensitive()`](#stringinsensitive)
    - [`string.min(limit, [encoding])`](#stringminlimit-encoding)
    - [`string.max(limit, [encoding])`](#stringmaxlimit-encoding)
    - [`string.truncate([enabled])`](#stringtruncateenabled)
    - [`string.creditCard()`](#stringcreditcard)
    - [`string.length(limit, [encoding])`](#stringlengthlimit-encoding)
    - [`string.regex(pattern, [name | options])`](#stringregexpattern-name--options)
    - [`string.replace(pattern, replacement)`](#stringreplacepattern-replacement)
    - [`string.alphanum()`](#stringalphanum)
    - [`string.token()`](#stringtoken)
    - [`string.email([options])`](#stringemailoptions)
    - [`string.ip([options])`](#stringipoptions)
    - [`string.uri([options])`](#stringurioptions)
    - [`string.guid()` - aliases: `uuid`](#stringguid---aliases-uuid)
    - [`string.hex([options])`](#stringhexoptions)
    - [`string.base64([options])`](#stringbase64options)
    - [`string.hostname()`](#stringhostname)
    - [`string.normalize([form])`](#stringnormalizeform)
    - [`string.lowercase()`](#stringlowercase)
    - [`string.uppercase()`](#stringuppercase)
    - [`string.trim()`](#stringtrim)
    - [`string.isoDate()`](#stringisodate)
  - [`alternatives` - inherits from `Any`](#alternatives---inherits-from-any)
    - [`alternatives.try(schemas)`](#alternativestryschemas)
    - [`alternatives.when(condition, options)`](#alternativeswhencondition-options)
  - [`lazy(fn)` - inherits from `Any`](#lazyfn---inherits-from-any)
- [Errors](#errors)

<!-- tocstop -->

## Joi

### `version`

Property showing the current version of joi being used.

### `validate(value, schema, [options], [callback])`

Validates a value using the given schema and options where:
- `value` - the value being validated.
- `schema` - the validation schema. Can be a **joi** type object or a plain object where every key is assigned a **joi** type object using [`Joi.compile`](#compileschema) (be careful of the cost of compiling repeatedly the same schemas).
- `options` - an optional object with the following optional keys:
  - `abortEarly` - when `true`, stops validation on the first error, otherwise returns all the errors found. Defaults to `true`.
  - `convert` - when `true`, attempts to cast values to the required types (e.g. a string to a number). Defaults to `true`.
  - `allowUnknown` - when `true`, allows object to contain unknown keys which are ignored. Defaults to `false`.
  - `skipFunctions` - when `true`, ignores unknown keys with a function value. Defaults to `false`.
  - `stripUnknown` - remove unknown elements from objects and arrays. Defaults to `false`.
    - when `true`, all unknown elements will be removed.
    - when an `object` :
      - `arrays` - set to `true` to remove unknown items from arrays.
      - `objects` - set to `true` to remove unknown keys from objects.
  - `language` - overrides individual error messages. Defaults to no override (`{}`). Messages apply the following rules :
    - variables are put between curly braces like `{{var}}`, if prefixed by a `!` like `{{!var}}`, it will be html escaped if the option `escapeHtml` is also set to `true`
    - strings are always preceeded by the key name, unless a `{{label}}` is found elsewhere or if the string is prefixed by a `!!`
    - when `'label'` is set, it overrides the key name in the error message
    - to better understand the structure of the language, it's advised to have a look at the existing messages you want to override [here](lib/language.js)
  - `presence` - sets the default presence requirements. Supported modes: `'optional'`, `'required'`, and `'forbidden'`.
    Defaults to `'optional'`.
  - `context` - provides an external data set to be used in [references](#refkey-options). Can only be set as an external option to
    `validate()` and not using `any.options()`.
  - `noDefaults` - when `true`, do not apply default values. Defaults to `false`.
  - `escapeHtml` - when `true`, error message templates will escape special characters to HTML entities, for security purposes. Defaults to `false`.
- `callback` - the optional synchronous callback method using the signature `function(err, value)` where:
  - `err` - if validation failed, the [error](#errors) reason, otherwise `null`.
  - `value` - the validated value with any type conversions and other modifiers applied (the input is left unchanged). `value` can be
    incomplete if validation failed and `abortEarly` is `true`. If callback is not provided, then returns an object with [error](#errors)
    and value properties.

When used without a callback, this function returns a Promise-like object that can be used as a promise, or as a simple object like in the below examples.

```js
const schema = {
    a: Joi.number()
};

const value = {
    a: '123'
};

Joi.validate(value, schema, (err, value) => { });
// err -> null
// value.a -> 123 (number, not string)

// or
const result = Joi.validate(value, schema);
// result.error -> null
// result.value -> { "a" : 123 }

// or
const promise = Joi.validate(value, schema);
promise.then((value) => {
    // value -> { "a" : 123 }
});
```

### `compile(schema)`

Converts literal schema definition to **joi** schema object (or returns the same back if already a **joi** schema object) where:
- `schema` - the schema definition to compile.

```js
const definition = ['key', 5, { a: true, b: [/^a/, 'boom'] }];
const schema = Joi.compile(definition);

// Same as:

const schema = Joi.alternatives().try([
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

### `describe(schema)`

Returns an object that represents the internal configuration of a **joi** schema. Useful for debugging and exposing a schema's configuration to other systems, like valid values in a user interface.

- `schema` - the schema to describe.

```js
const schema = Joi.any().valid([ 'foo', 'bar' ]);

console.log(Joi.describe(schema));
```

Results in:

```
{ type: 'any',
  flags: { allowOnly: true },
  valids: [ 'foo', 'bar' ] }
```

### `assert(value, schema, [message])`

Validates a value against a schema and [throws](#errors) if validation fails where:
- `value` - the value to validate.
- `schema` - the validation schema. Can be a **joi** type object or a plain object where every key is assigned a **joi** type object using [`Joi.compile`](#compileschema) (be careful of the cost of compiling repeatedly the same schemas).
- `message` - optional message string prefix added in front of the error message. may also be an Error object.

```js
Joi.assert('x', Joi.number());
```

### `attempt(value, schema, [message])`

Validates a value against a schema, returns valid object, and [throws](#errors) if validation fails where:
- `value` - the value to validate.
- `schema` - the validation schema. Can be a **joi** type object or a plain object where every key is assigned a **joi** type object using [`Joi.compile`](#compileschema) (be careful of the cost of compiling repeatedly the same schemas).
- `message` - optional message string prefix added in front of the error message. may also be an Error object.

```js
Joi.attempt('x', Joi.number()); // throws error
const result = Joi.attempt('4', Joi.number()); // result -> 4
```

### `ref(key, [options])`

Generates a reference to the value of the named key. References are resolved at validation time and in order of dependency
so that if one key validation depends on another, the dependent key is validated second after the reference is validated.
References support the following arguments:
- `key` - the reference target. References cannot point up the object tree, only to sibling keys, but they can point to
  their siblings' children (e.g. 'a.b.c') using the `.` separator. If a `key` starts with `$` is signifies a context reference
  which is looked up in the `context` option object.
- `options` - optional settings:
    - `separator` - overrides the default `.` hierarchy separator.
    - `contextPrefix` - overrides the default `$` context prefix signifier.
    - Other options can also be passed based on what [`Hoek.reach`](https://github.com/hapijs/hoek/blob/master/API.md#reachobj-chain-options) supports.

Note that references can only be used where explicitly supported such as in `valid()` or `invalid()` rules. If upwards
(parents) references are needed, use [`object.assert()`](#objectassertref-schema-message).

```js
const schema = Joi.object().keys({
    a: Joi.ref('b.c'),
    b: {
        c: Joi.any()
    },
    c: Joi.ref('$x')
});

Joi.validate({ a: 5, b: { c: 5 } }, schema, { context: { x: 5 } }, (err, value) => {});
```

### `isRef(ref)`

Checks whether or not the provided argument is a reference.
It's especially useful if you want to post-process error messages.

```js
const ref = Joi.ref('a');
Joi.isRef(ref); // returns true
```

### `reach(schema, path)`

Get a sub-schema of an existing schema based on a `path` that can be either a string or an array of strings For string values path separator is a dot (`.`).

```js
const schema = Joi.object({ foo: Joi.object({ bar: Joi.number() }) });
const number = Joi.reach(schema, 'foo.bar');

//or
const result = Joi.reach(schema, ['foo', 'bar']); //same as number
```

### `defaults(fn)`

Creates a new Joi instance that will apply defaults onto newly created schemas through the use of the `fn` function that takes exactly one argument, the schema being created.

The function must always return a schema, even if untransformed.

```js
const defaultJoi = Joi.defaults((schema) => {

    switch (schema.schemaType) {
        case 'string':
            return schema.allow('');
        case 'object':
            return schema.min(1);
        default:
            return schema;
    }
});

const schema = defaultJoi.object(); // Equivalent to a Joi.object().min(1)
```

### `extend(extension)`

Creates a new Joi instance customized with the extension(s) you provide included.

It is **important** to understand that original Joi library is not modified by this.

#### Terms

The extension makes use of some common structures that need to be described prior :
* `value` - the value being processed by Joi.
* `state` - an object containing the current context of validation.
  * `key` - the key of the current value.
  * `path` - the full path of the current value.
  * `parent` - the potential parent of the current value.
* `options` - options object provided through [`any().options()`](#anyoptionsoptions) or [`Joi.validate()`](#validatevalue-schema-options-callback).

#### Extension

`extension` can be :
- a single extension object
- a factory function generating an extension object
- or an array of those

Extension objects use the following parameters :
* `name` - name of the new type you are defining, this can be an existing type. **Required**.
* `base` - an existing Joi schema to base your type upon. Defaults to `Joi.any()`.
* `coerce` - an optional function that runs before the base, usually serves when you want to coerce values of a different type than your base. It takes 3 arguments `value`, `state` and `options`.
* `pre` - an optional function that runs first in the validation chain, usually serves when you need to cast values. It takes 3 arguments `value`, `state` and `options`.
* `language` - an optional object to add error definitions. Every key will be prefixed by the type name.
* `describe` - an optional function taking the fully formed description to post-process it.
* `rules` - an optional array of rules to add.
  * `name` - name of the new rule. **Required**.
  * `params` - an optional object containing Joi schemas of each parameter ordered. You can also pass a single Joi schema as long as it is a `Joi.object()`, of course some methods such as `pattern` or `rename` won't be useful or won't work at all in this given context.
  * `setup` - an optional function that takes an object with the provided parameters to allow for internals manipulation of the schema when a rule is set, you can optionally return a new Joi schema that will be taken as the new schema instance. At least one of `setup` or `validate` **must** be provided.
  * `validate` - an optional function to validate values that takes 4 parameters `params`, `value`, `state` and `options`. At least one of `setup` or `validate` **must** be provided.
  * `description` - an optional string or function taking the parameters as argument to describe what the rule is doing.

Factory functions are advised if you intend to publish your extensions for others to use, because they are capable of using an extended joi being built, thus avoiding any erasure when using multiple extensions at the same time. See an example of a factory function in the section below.

#### npm note

If you publish your extension on npm, make sure to add `joi` and `extension` as keywords so that it's discoverable more easily.

#### Examples

```js
const Joi = require('joi');
const customJoi = Joi.extend((joi) => ({
    base: joi.number(),
    name: 'number',
    language: {
        round: 'needs to be a rounded number', // Used below as 'number.round'
        dividable: 'needs to be dividable by {{q}}'
    },
    pre(value, state, options) {

        if (options.convert && this._flags.round) {
            return Math.round(value); // Change the value
        }

        return value; // Keep the value as it was
    },
    rules: [
        {
            name: 'round',
            setup(params) {

                this._flags.round = true; // Set a flag for later use
            },
            validate(params, value, state, options) {

                if (value % 1 !== 0) {
                    // Generate an error, state and options need to be passed
                    return this.createError('number.round', { v: value }, state, options);
                }

                return value; // Everything is OK
            }
        },
        {
            name: 'dividable',
            params: {
                q: joi.alternatives([joi.number().required(), joi.func().ref()])
            },
            validate(params, value, state, options) {

                if (value % params.q !== 0) {
                    // Generate an error, state and options need to be passed, q is used in the language
                    return this.createError('number.dividable', { v: value, q: params.q }, state, options);
                }

                return value; // Everything is OK
            }
        }
    ]
}));

const schema = customJoi.number().round().dividable(3);
```

### `any`

Generates a schema object that matches any data type.

```js
const any = Joi.any();
any.validate('a', (err, value) => { });
```

#### `schemaType`

Gets the type of the schema.

```js
const schema = Joi.string();

schema.schemaType === 'string';   // === true
```

#### `any.validate(value, [options], [callback])`

Validates a value using the schema and options where:
- `value` - the value being validated.
- `options` - an object with the same optional keys as [`Joi.validate(value, schema, options, callback)`](#validatevalue-schema-options-callback).
- `callback` - an optional synchronous callback method using the the same signature as [`Joi.validate(value, schema, options, callback)`](#validatevalue-schema-options-callback).

```js
const schema = Joi.object({
    a: Joi.number()
});

const value = {
    a: '123'
};

schema.validate(value, (err, value) => { });
// err -> null
// value.a -> 123 (number, not string)

// or
const result = schema.validate(value);
// result.error -> null
// result.value -> { "a" : 123 }

// or
const promise = schema.validate(value);
```

#### `any.allow(value)`

Whitelists a value where:
- `value` - the allowed value which can be of any type and will be matched against the validated value before applying any other rules.
  `value` can be an array of values, or multiple values can be passed as individual arguments. `value` supports [references](#refkey-options).

Note that this whitelist of allowed values is in *addition* to any other permitted values.
To create an exclusive whitelist of values, see [`any.valid(value)`](#anyvalidvalue).

```js
const schema = {
    a: Joi.any().allow('a'),
    b: Joi.any().allow('b', 'B'),
    c: Joi.any().allow(['c', 'C'])
};
```

#### `any.valid(value)` - aliases: `only`, `equal`

Adds the provided values into the allowed whitelist and marks them as the only valid values allowed where:
- `value` - the allowed value which can be of any type and will be matched against the validated value before applying any other rules.
  `value` can be an array of values, or multiple values can be passed as individual arguments. `value` supports [references](#refkey-options).

```js
const schema = {
    a: Joi.any().valid('a'),
    b: Joi.any().valid('b', 'B'),
    c: Joi.any().valid(['c', 'C'])
};
```

#### `any.invalid(value)` - aliases: `disallow`, `not`

Blacklists a value where:
- `value` - the forbidden value which can be of any type and will be matched against the validated value before applying any other rules.
  `value` can be an array of values, or multiple values can be passed as individual arguments. `value` supports [references](#refkey-options).

```js
const schema = {
    a: Joi.any().invalid('a'),
    b: Joi.any().invalid('b', 'B'),
    c: Joi.any().invalid(['c', 'C'])
};
```

#### `any.required()` - aliases: `exist`

Marks a key as required which will not allow `undefined` as value. All keys are optional by default.

```js
const schema = Joi.any().required();
```

#### `any.optional()`

Marks a key as optional which will allow `undefined` as values. Used to annotate the schema for readability as all keys are optional by default.

Note: this does not allow a `null` value. To do that, use [`any.allow(value)`](#anyallowvalue). Or both!

```js
const schema = Joi.any().optional();
```

#### `any.forbidden()`

Marks a key as forbidden which will not allow any value except `undefined`. Used to explicitly forbid keys.

```js
const schema = {
    a: Joi.any().forbidden()
};
```

#### `any.strip()`

Marks a key to be removed from a resulting object or array after validation. Used to sanitize output.

```js
const schema = Joi.object({
    username: Joi.string(),
    password: Joi.string().strip()
});

schema.validate({ username: 'test', password: 'hunter2' }, (err, value) => {
    // value = { username: 'test' }
});

const schema = Joi.array().items(Joi.string(), Joi.any().strip());

schema.validate(['one', 'two', true, false, 1, 2], (err, value) => {
    // value = ['one', 'two']
});
```

#### `any.description(desc)`

Annotates the key where:
- `desc` - the description string.

```js
const schema = Joi.any().description('this key will match anything you give it');
```

#### `any.notes(notes)`

Annotates the key where:
- `notes` - the notes string or array of strings.

```js
const schema = Joi.any().notes(['this is special', 'this is important']);
```

#### `any.tags(tags)`

Annotates the key where:
- `tags` - the tag string or array of strings.

```js
const schema = Joi.any().tags(['api', 'user']);
```

#### `any.meta(meta)`

Attaches metadata to the key where:
- `meta` - the meta object to attach.

```js
const schema = Joi.any().meta({ index: true });
```

#### `any.example(value)`

Annotates the key where:
- `value` - an example value.

If the example fails to pass validation, the function will throw.

```js
const schema = Joi.string().min(4).example('abcd');
```

#### `any.unit(name)`

Annotates the key where:
- `name` - the unit name of the value.

```js
const schema = Joi.number().unit('milliseconds');
```

#### `any.options(options)`

Overrides the global `validate()` options for the current key and any sub-key where:
- `options` - an object with the same optional keys as [`Joi.validate(value, schema, options, callback)`](#validatevalue-schema-options-callback).

```js
const schema = Joi.any().options({ convert: false });
```

#### `any.strict(isStrict)`

Strict mode sets the `options.convert` options to `false` which prevent type casting for the current key and any child keys.
- `isStrict` - whether strict mode is enabled or not. Defaults to true.

```js
const schema = Joi.any().strict();
```

#### `any.default([value, [description]])`

Sets a default value if the original value is undefined where:
- `value` - the value.
  - `value` supports [references](#refkey-options).
  - `value` may also be a function which returns the default value. If `value` is specified as a function that accepts a single parameter, that parameter will be a context object that can be used to derive the resulting value.
    - Use a function when setting a dynamic value, such as the current time. Ex: `default(Date.now, 'time of creation')`
    - **Caution: this clones the object**, which incurs some overhead so if you don't need access to the context define your method so that it does not accept any parameters.
  - without any `value`, `default` has no effect, except for `object` that will then create nested defaults (applying inner defaults of that object).

Note that if `value` is an object, any changes to the object after `default()` is called will change the reference
and any future assignment.

Additionally, when specifying a method you must either have a `description` property on your method or the second parameter is required.

```js
const generateUsername = (context) => {

  return context.firstname.toLowerCase() + '-' + context.lastname.toLowerCase();
};
generateUsername.description = 'generated username';

const schema = {
    username: Joi.string().default(generateUsername),
    firstname: Joi.string(),
    lastname: Joi.string(),
    created: Joi.date().default(Date.now, 'time of creation'),
    status: Joi.string().default('registered')
};

Joi.validate({
    firstname: 'Jane',
    lastname: 'Doe'
}, schema, (err, value) => {

    // value.status === 'registered'
    // value.username === 'jane-doe'
    // value.created will be the time of validation
});
```

#### `any.concat(schema)`

Returns a new type that is the result of adding the rules of one type to another where:
- `schema` - a **joi** type to merge into the current schema. Can only be of the same type as the context type or `any`. If applied to an `any` type, the schema can be any other schema.

```js
const a = Joi.string().valid('a');
const b = Joi.string().valid('b');
const ab = a.concat(b);
```

#### `any.when(condition, options)`

Converts the type into an [`alternatives`](#alternatives) type where the conditions are merged into the type definition where:
- `condition` - the key name or [reference](#refkey-options), or a schema.
- `options` - an object with:
    - `is` - the required condition **joi** type. Anything that is not a joi schema will be converted using [Joi.compile](#compileschema). Forbidden when `condition` is a schema.
    - `then` - the alternative schema type if the condition is true. Required if `otherwise` is missing.
    - `otherwise` - the alternative schema type if the condition is false. Required if `then` is missing.

Note: by default, the `is` condition schema allows for `undefined` values. Use `.required()` to override.
For example, use `is: Joi.number().required()` to guarantee that a joi reference exists and is a number.

```js
const schema = {
    a: Joi.any().valid('x').when('b', { is: Joi.exist(), then: Joi.valid('y'), otherwise: Joi.valid('z') }),
    b: Joi.any()
};
```

Or with a schema:
```js
const schema = Joi.object({
    a: Joi.any().valid('x'),
    b: Joi.any()
}).when(Joi.object({ b: Joi.exist() }).unknown(), {
    then: Joi.object({
        a: Joi.valid('y')
    }),
    otherwise: Joi.object({
        a: Joi.valid('z')
    })
});
```

Note that this style is much more useful when your whole schema depends on the value of one of its property, or if you find yourself repeating the check for many keys of an object.

Alternatively, if you want to specify a specific type such as `string`, `array`, etc, you can do so like this:

```js
const schema = {
    a: Joi.valid('a', 'b', 'other'),
    other: Joi.string()
        .when('a', { is: 'other', then: Joi.required() }),
};
```

If you need to validate a child key inside a nested object based on a sibling's value, you can do so like this:

```js
const schema = Joi.object().keys({
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
If you want to validate one key based on the existence of another key, you can do so like the following (notice the use of `required()`):
```js
const schema = Joi.object().keys({
    min: Joi.number(),
    max: Joi.number().when('min', {
        is: Joi.number().required(),
        then: Joi.number().greater(Joi.ref('min')),
    }),
});
```

#### `any.label(name)`

Overrides the key name in error messages.
- `name` - the name of the key.

```js
const schema = {
    first_name: Joi.string().label('First Name')
};
```

#### `any.raw(isRaw)`

Outputs the original untouched value instead of the casted value.
- `isRaw` - whether to enable raw mode or not. Defaults to true.

```js
const timestampSchema = Joi.date().timestamp();
timestampSchema.validate('12376834097810'); // { error: null, value: Sat Mar 17 2362 04:28:17 GMT-0500 (CDT) }

const rawTimestampSchema = Joi.date().timestamp().raw();
rawTimestampSchema.validate('12376834097810'); // { error: null, value: '12376834097810' }
```

#### `any.empty(schema)`

Considers anything that matches the schema to be empty (`undefined`).
- `schema` - any object or joi schema to match. An undefined schema unsets that rule.

```js
let schema = Joi.string().empty('');
schema.validate(''); // returns { error: null, value: undefined }
schema = schema.empty();
schema.validate(''); // returns { error: "value" is not allowed to be empty, value: '' }
```

#### `any.error(err)`

Overrides the default joi error with a custom error if the rule fails where:
- `err` can be:
  - an instance of `Error` - the override error.
  - a `function(errors)`, taking an array of errors as argument, where it must either:
    - return a `string` - substitutes the error message with this text
    - return a single `object` or an `Array` of it, where:
      - `type` - optional parameter providing the type of the error (eg. `number.min`).
      - `message` - optional parameter if `template` is provided, containing the text of the error.
      - `template` - optional parameter if `message` is provided, containing a template string, using the same format as usual joi language errors.
      - `context` - optional parameter, to provide context to your error if you are using the `template`.
    - return an `Error` - same as when you directly provide an `Error`, but you can customize the error message based on the errors.

Note that if you provide an `Error`, it will be returned as-is, unmodified and undecorated with any of the
normal joi error properties. If validation fails and another error is found before the error
override, that error will be returned and the override will be ignored (unless the `abortEarly`
option has been set to `false`).

```js
let schema = Joi.string().error(new Error('Was REALLY expecting a string'));
schema.validate(3);     // returns error.message === 'Was REALLY expecting a string'

let schema = Joi.object({
    foo: Joi.number().min(0).error(() => '"foo" requires a positive number')
});
schema.validate({ foo: -2 });    // returns error.message === 'child "foo" fails because ["foo" requires a positive number]'

let schema = Joi.object({
    foo: Joi.number().min(0).error((errors) => {

        return 'found errors with ' + errors.map((err) => `${err.type}(${err.context.limit}) with value ${err.context.value}`).join(' and ');
    })
});
schema.validate({ foo: -2 });    // returns error.message === 'child "foo" fails because [found errors with number.min(0) with value -2]'

let schema = Joi.object({
    foo: Joi.number().min(0).error((errors) => {

        return {
            template: 'contains {{errors}} errors, here is the list : {{codes}}',
            context: {
                errors: errors.length,
                codes: errors.map((err) => err.type)
            }
        };
    })
});
schema.validate({ foo: -2 });    // returns error.message === 'child "foo" fails because ["foo" contains 1 errors, here is the list : [number.min]]'
```

Note that if you want to intercept errors on nested structures such as objects and arrays, you will also get a nested structure to explore the children errors, going one level down through the `err.context.reason` property.

If you want a full substitution of the error system, you can hook at the root and render that `errors` array with whatever templating system you want, just be aware that you will have to crawl the nested errors for the information you want to actually show.

#### `any.describe()`

Behaves the same as [`describe(schema)`](#describeschema) and returns an object that represents the internal configuration of the **joi** schema.

```js
const schema = Joi.any().valid([ 'foo', 'bar' ]);

console.log(schema.describe());
```

Results in:

```
{ type: 'any',
  flags: { allowOnly: true },
  valids: [ 'foo', 'bar' ] }
```

### `array` - inherits from `Any`

Generates a schema object that matches an array data type. Note that undefined values inside arrays are not allowed by
default but can be by using `sparse()`. If the validation `convert` option is on (enabled by default), a string will be
converted to an `array` if specified via `JSON.parse()`. Also, if `convert` `array.single()` are both on, then when a
single value is specified it will be converted to an `array`.

Supports the same methods of the [`any()`](#any) type.

```js
const array = Joi.array().items(Joi.string().valid('a', 'b'));
array.validate(['a', 'b', 'a'], (err, value) => { });
```

#### `array.sparse([enabled])`

Allows this array to be sparse. `enabled` can be used with a falsy value to go back to the default behavior.

```js
let schema = Joi.array().sparse(); // undefined values are now allowed
schema = schema.sparse(false); // undefined values are now denied
```

#### `array.single([enabled])`

Allows single values to be checked against rules as if it were provided as an array.

`enabled` can be used with a falsy value to go back to the default behavior.

Note: `convert` option must be enabled.

```js
const schema = Joi.array().items(Joi.number()).single();
schema.validate([4]); // returns `{ error: null, value: [ 4 ] }`
schema.validate(4); // returns `{ error: null, value: [ 4 ] }`
```

#### `array.items(type)`

Lists the types allowed for the array values where:
- `type` - a **joi** schema object to validate each array item against. `type` can be an array of values, or multiple values can be passed as individual arguments.

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

#### `array.ordered(type)`

Lists the types in sequence order for the array values where:
- `type` - a **joi** schema object to validate against each array item in sequence order. `type` can be an array of values, or multiple values can be passed as individual arguments.

If a given type is `.required()` then there must be a matching item with the same index position in the array.
Errors will contain the number of items that didn't match. Any unmatched item having a [label](#anylabelname) will be mentioned explicitly.

```js
const schema = Joi.array().ordered(Joi.string().required(), Joi.number().required()); // array must have first item as string and second item as number
const schema = Joi.array().ordered(Joi.string().required()).items(Joi.number().required()); // array must have first item as string and 1 or more subsequent items as number
const schema = Joi.array().ordered(Joi.string().required(), Joi.number()); // array must have first item as string and optionally second item as number
```

#### `array.min(limit)`

Specifies the minimum number of items in the array where:
- `limit` - the lowest number of array items allowed.

```js
const schema = Joi.array().min(2);
```

It can also be a reference to another field.

```js
const schema = Joi.object({
  limit: Joi.number().integer().required(),
  numbers: Joi.array().min(Joi.ref('limit')).required()
});
```

#### `array.max(limit)`

Specifies the maximum number of items in the array where:
- `limit` - the highest number of array items allowed.

```js
const schema = Joi.array().max(10);
```

It can also be a reference to another field.

```js
const schema = Joi.object({
  limit: Joi.number().integer().required(),
  numbers: Joi.array().max(Joi.ref('limit')).required()
});
```

#### `array.length(limit)`

Specifies the exact number of items in the array where:
- `limit` - the number of array items allowed.

```js
const schema = Joi.array().length(5);
```

It can also be a reference to another field.

```js
const schema = Joi.object({
  limit: Joi.number().integer().required(),
  numbers: Joi.array().length(Joi.ref('limit')).required()
});
```

#### `array.unique([comparator])`

Requires the array values to be unique.

You can provide a custom `comparator` that is either :
- a function that takes 2 parameters to compare. This function should return whether the 2 parameters are equal or not, you are also **responsible** for this function not to fail, any `Error` would bubble out of Joi.
- a string in dot notation representing the path of the element to do uniqueness check on. Any missing path will be considered undefined, and can as well only exist once.

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

### `boolean` - inherits from `Any`

Generates a schema object that matches a boolean data type. Can also be called via `bool()`. If the validation `convert`
option is on (enabled by default), a string (either "true" or "false") will be converted to a `boolean` if specified.

Supports the same methods of the [`any()`](#any) type.

```js
const boolean = Joi.boolean();
boolean.validate(true, (err, value) => { }); // Valid

boolean.validate(1, (err, value) => { }); // Invalid
```

#### `boolean.truthy(value)`

Allows for additional values to be considered valid booleans by converting them to `true` during validation. Accepts a value or an array of values.

String comparisons are by default case insensitive, see [`boolean.insensitive()`](#booleaninsensitiveenabled) to change this behavior.

```js
const boolean = Joi.boolean().truthy('Y');
boolean.validate('Y', (err, value) => { }); // Valid
```

#### `boolean.falsy(value)`

Allows for additional values to be considered valid booleans by converting them to `false` during validation. Accepts a value or an array of values.

String comparisons are by default case insensitive, see [`boolean.insensitive()`](#booleaninsensitiveenabled) to change this behavior.

```js
const boolean = Joi.boolean().falsy('N');
boolean.validate('N', (err, value) => { }); // Valid
```

#### `boolean.insensitive([enabled])`

Allows the values provided to `truthy` and `falsy` as well as the `"true"` and `"false"` default conversion (when not in `strict()` mode) to be matched in a case insensitive manner.

Parameters are:
- `enabled` - optional parameter defaulting to `true` which allows you to reset the behavior of `insensitive` by providing a falsy value.

```js
const schema = Joi.boolean().truthy('yes').falsy('no').insensitive(false);
```

### `binary` - inherits from `Any`

Generates a schema object that matches a Buffer data type. If the validation `convert` option is on (enabled by default), a string
will be converted to a Buffer if specified.

Supports the same methods of the [`any()`](#any) type.

```js
const schema = Joi.binary();
```

#### `binary.encoding(encoding)`

Sets the string encoding format if a string input is converted to a buffer where:
- `encoding` - the encoding scheme.

```js
const schema = Joi.binary().encoding('base64');
```

#### `binary.min(limit)`

Specifies the minimum length of the buffer where:
- `limit` - the lowest size of the buffer.

```js
const schema = Joi.binary().min(2);
```

#### `binary.max(limit)`

Specifies the maximum length of the buffer where:
- `limit` - the highest size of the buffer.

```js
const schema = Joi.binary().max(10);
```

#### `binary.length(limit)`

Specifies the exact length of the buffer:
- `limit` - the size of buffer allowed.

```js
const schema = Joi.binary().length(5);
```

### `date` - inherits from `Any`

Generates a schema object that matches a date type (as well as a JavaScript date string or number of milliseconds). If
the validation `convert` option is on (enabled by default), a string or number will be converted to a Date if specified.

Supports the same methods of the [`any()`](#any) type.

```js
const date = Joi.date();
date.validate('12-21-2012', (err, value) => { });
```

#### `date.min(date)`

Specifies the oldest date allowed where:
- `date` - the oldest date allowed.

```js
const schema = Joi.date().min('1-1-1974');
```

Notes: `'now'` can be passed in lieu of `date` so as to always compare relatively to the current date, allowing to explicitly ensure a date is either in the past or in the future.

```js
const schema = Joi.date().min('now');
```

It can also be a reference to another field.

```js
const schema = Joi.object({
  from: Joi.date().required(),
  to: Joi.date().min(Joi.ref('from')).required()
});
```

#### `date.max(date)`

Specifies the latest date allowed where:
- `date` - the latest date allowed.

```js
const schema = Joi.date().max('12-31-2020');
```

Notes: `'now'` can be passed in lieu of `date` so as to always compare relatively to the current date, allowing to explicitly ensure a date is either in the past or in the future.

```js
const schema = Joi.date().max('now');
```

It can also be a reference to another field.

```js
const schema = Joi.object({
  from: Joi.date().max(Joi.ref('to')).required(),
  to: Joi.date().required()
});
```

#### `date.greater(date)`

Specifies that the value must be greater than `date`.

```js
const schema = Joi.date().greater('1-1-1974');
```

Notes: `'now'` can be passed in lieu of `date` so as to always compare relatively to the current date, allowing to explicitly ensure a date is either in the past or in the future.

```js
const schema = Joi.date().greater('now');
```

It can also be a reference to another field.

```js
const schema = Joi.object({
  from: Joi.date().required(),
  to: Joi.date().greater(Joi.ref('from')).required()
});
```

#### `date.less(date)`

Specifies that the value must be less than `date`.

```js
const schema = Joi.date().less('12-31-2020');

Notes: `'now'` can be passed in lieu of `date` so as to always compare relatively to the current date, allowing to explicitly ensure a date is either in the past or in the future.

```js
const schema = Joi.date().max('now');
```

It can also be a reference to another field.

```js
const schema = Joi.object({
  from: Joi.date().less(Joi.ref('to')).required(),
  to: Joi.date().required()
});
```

#### `date.iso()`

Requires the string value to be in valid ISO 8601 date format.

```js
const schema = Joi.date().iso();
```

#### `date.timestamp([type])`

Requires the value to be a timestamp interval from [Unix Time](https://en.wikipedia.org/wiki/Unix_time).

- `type` - the type of timestamp (allowed values are `unix` or `javascript` [default])

```js
const schema = Joi.date().timestamp(); // defaults to javascript timestamp
const schema = Joi.date().timestamp('javascript'); // also, for javascript timestamp (milliseconds)
const schema = Joi.date().timestamp('unix'); // for unix timestamp (seconds)
```

### `func` - inherits from `Any`

Generates a schema object that matches a function type.

Supports the same methods of the [`object()`](#object) type. Note that validating a function keys will cause the function
to be cloned. While the function will retain its prototype and closure, it will lose its `length` property value (will be
set to `0`).

```js
const func = Joi.func();
func.validate(function () {}, (err, value) => { });
```

#### `func.arity(n)`

Specifies the arity of the function where:
- `n` - the arity expected.

```js
const schema = Joi.func().arity(2);
```

#### `func.minArity(n)`

Specifies the minimal arity of the function where:
- `n` - the minimal arity expected.

```js
const schema = Joi.func().minArity(1);
```

#### `func.maxArity(n)`

Specifies the maximal arity of the function where:
- `n` - the maximum arity expected.

```js
const schema = Joi.func().maxArity(3);
```

#### `func.class()`

Requires the function to be a class.

```js
const schema = Joi.func().class();
```

#### `func.ref()`

Requires the function to be a Joi reference.

```js
const schema = Joi.func().ref();
```

### `number` - inherits from `Any`

Generates a schema object that matches a number data type (as well as strings that can be converted to numbers). If the
validation `convert` option is on (enabled by default), a string will be converted to a `number` if specified. Also, if
`convert` is on and `number.precision()` is used, the value will be converted to the specified `precision` as well.

`Infinity` and `-Infinity` are invalid by default, you can change that behavior by calling `allow(Infinity, -Infinity)`.

Supports the same methods of the [`any()`](#any) type.

```js
const number = Joi.number();
number.validate(5, (err, value) => { });
```

#### `number.min(limit)`

Specifies the minimum value where:
- `limit` - the minimum value allowed.

```js
const schema = Joi.number().min(2);
```

It can also be a reference to another field.

```js
const schema = Joi.object({
  min: Joi.number().required(),
  max: Joi.number().min(Joi.ref('min')).required()
});
```

#### `number.max(limit)`

Specifies the maximum value where:
- `limit` - the maximum value allowed.

```js
const schema = Joi.number().max(10);
```

It can also be a reference to another field.

```js
const schema = Joi.object({
  min: Joi.number().max(Joi.ref('max')).required(),
  max: Joi.number().required()
});
```

#### `number.greater(limit)`

Specifies that the value must be greater than `limit`.

```js
const schema = Joi.number().greater(5);
```

```js
const schema = Joi.object({
  min: Joi.number().required(),
  max: Joi.number().greater(Joi.ref('min')).required()
});
```

#### `number.less(limit)`

Specifies that the value must be less than `limit`.

```js
const schema = Joi.number().less(10);
```

It can also be a reference to another field.

```js
const schema = Joi.object({
  min: Joi.number().less(Joi.ref('max')).required(),
  max: Joi.number().required()
});
```

#### `number.integer()`

Requires the number to be an integer (no floating point).

```js
const schema = Joi.number().integer();
```

#### `number.precision(limit)`

Specifies the maximum number of decimal places where:
- `limit` - the maximum number of decimal places allowed.

```js
const schema = Joi.number().precision(2);
```

#### `number.multiple(base)`

Specifies that the value must be a multiple of `base`:

```js
const schema = Joi.number().multiple(3);
```

Notes: `Joi.number.multiple(base)` _uses the modulo operator (%) to determine if a number is multiple of another number.
Therefore, it has the normal limitations of Javascript modulo operator. The results with decimal/floats maybe incorrect._

#### `number.positive()`

Requires the number to be positive.

```js
const schema = Joi.number().positive();
```

#### `number.negative()`

Requires the number to be negative.

```js
const schema = Joi.number().negative();
```

#### `number.port()`

Requires the number to be a TCP port, so between 0 and 65535.

```js
const schema = Joi.number().port();
```

### `object` - inherits from `Any`

Generates a schema object that matches an object data type (as well as JSON strings that parsed into objects). Defaults
to allowing any child key. If the validation `convert` option is on (enabled by default), a string will be converted to
an `object` if specified via `JSON.parse()`.

Supports the same methods of the [`any()`](#any) type.

```js
const object = Joi.object().keys({
    a: Joi.number().min(1).max(10).integer(),
    b: 'some string'
});

object.validate({ a: 5 }, (err, value) => { });
```

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

Notes: We have three different ways to define a schema for performing a validation

- Using the plain JS object notation:
```js
const schema = {
    a: Joi.string(),
    b: Joi.number()
};
```
- Using the `Joi.object([schema])` notation
```js
const schema = Joi.object({
    a: Joi.string(),
    b: Joi.number()
});
```
- Using the `Joi.object().keys([schema])` notation
```js
const schema = Joi.object().keys({
    a: Joi.string(),
    b: Joi.number()
});
```

While all these three objects defined above will result in the same validation object, there are some differences in using one or another:

##### `{} notation`

When using the `{}` notation, you are just defining a plain JS object, which isn't a schema object.
You can pass it to the validation method but you can't call `validate()` method of the object because it's just a plain JS object.

Besides, passing the `{}` object to the `validate()` method each time, will perform an expensive schema compilation operation on every validation.

##### `Joi.object([schema]) notation`

Using `Joi.object([schema])` will return a schema object, so you can call the `validate()` method directly, e.g:

```js
const schema = Joi.object({
    a: Joi.boolean()
});

schema.validate(true, (err, value) => {
    console.log('err: ', err);
});
```

When you use `Joi.object([schema])`, it gets compiled the first time, so you can pass it to the `validate()` method multiple times and no overhead is added.

Another benefits of using `Joi.object([schema])` instead of a plain JS object is that you can set any options on the object like allowing unknown keys, e.g:

```js
const schema = Joi.object({
    arg: Joi.string().valid('firstname', 'lastname', 'title', 'company', 'jobtitle'),
    value: Joi.string(),
}).pattern(/firstname|lastname/, Joi.string().min(2));
```

##### `Joi.object().keys([schema]) notation`

This is basically the same as `Joi.object([schema])`, but using `Joi.object().keys([schema])` is more useful when you want to add more keys (e.g. call `keys()` multiple times). If you are only adding one set of keys, you can skip the `keys()` method and just use `object()` directly.

Some people like to use `keys()` to make the code more explicit (this is style only).

#### `object.append([schema])`

Appends the allowed object keys where:
- `schema` - optional object where each key is assigned a **joi** type object. If `schema` is `null`,`undefined` or `{}` no changes will be applied. Uses object.keys([schema]) to append keys.

```js
// Validate key a
const base = Joi.object().keys({
    a: Joi.number()
});
// Validate keys a, b.
const extended = base.append({
    b: Joi.string()
});
```

#### `object.min(limit)`

Specifies the minimum number of keys in the object where:
- `limit` - the lowest number of keys allowed.

```js
const schema = Joi.object().min(2);
```

#### `object.max(limit)`

Specifies the maximum number of keys in the object where:
- `limit` - the highest number of object keys allowed.

```js
const schema = Joi.object().max(10);
```

#### `object.length(limit)`

Specifies the exact number of keys in the object where:
- `limit` - the number of object keys allowed.

```js
const schema = Joi.object().length(5);
```

#### `object.pattern(regex, schema)`

Specify validation rules for unknown keys matching a pattern where:
- `regex` - a regular expression tested against the unknown key names.
- `schema` - the schema object matching keys must validate against.

```js
const schema = Joi.object({
    a: Joi.string()
}).pattern(/\w\d/, Joi.boolean());
```

#### `object.and(peers)`

Defines an all-or-nothing relationship between keys where if one of the peers is present, all of them are required as
well where:
- `peers` - the key names of which if one present, all are required. `peers` can be a single string value, an
  array of string values, or each peer provided as an argument.

```js
const schema = Joi.object().keys({
    a: Joi.any(),
    b: Joi.any()
}).and('a', 'b');
```

#### `object.nand(peers)`

Defines a relationship between keys where not all peers can be present at the
same time where:
- `peers` - the key names of which if one present, the others may not all be present. `peers` can be a single string value, an
  array of string values, or each peer provided as an argument.

```js
const schema = Joi.object().keys({
    a: Joi.any(),
    b: Joi.any()
}).nand('a', 'b');
```

#### `object.or(peers)`

Defines a relationship between keys where one of the peers is required (and more than one is allowed) where:
- `peers` - the key names of which at least one must appear. `peers` can be a single string value, an
  array of string values, or each peer provided as an argument.

```js
const schema = Joi.object().keys({
    a: Joi.any(),
    b: Joi.any()
}).or('a', 'b');
```

#### `object.xor(peers)`

Defines an exclusive relationship between a set of keys where one of them is required but not at the same time where:
- `peers` - the exclusive key names that must not appear together but where one of them is required. `peers` can be a single string value, an
  array of string values, or each peer provided as an argument.

```js
const schema = Joi.object().keys({
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

```js
const schema = Joi.object().keys({
    a: Joi.any(),
    b: Joi.any()
}).with('a', 'b');
```

#### `object.without(key, peers)`

Forbids the presence of other keys whenever the specified is present where:
- `key` - the reference key.
- `peers` - the forbidden peer key names that must not appear together with `key`. `peers` can be a single string value or an array of string values.

```js
const schema = Joi.object().keys({
    a: Joi.any(),
    b: Joi.any()
}).without('a', ['b']);
```

#### `object.rename(from, to, [options])`

Renames a key to another name (deletes the renamed key) where:
- `from` - the original key name or a regular expression matching keys.
- `to` - the new key name.
- `options` - an optional object with the following optional keys:
    - `alias` - if `true`, does not delete the old key name, keeping both the new and old keys in place. Defaults to `false`.
    - `multiple` - if `true`, allows renaming multiple keys to the same destination where the last rename wins. Defaults to `false`.
    - `override` - if `true`, allows renaming a key over an existing key. Defaults to `false`.
    - `ignoreUndefined` - if `true`, skip renaming of a key if it's undefined. Defaults to `false`.

Keys are renamed before any other validation rules are applied.

```js
const object = Joi.object().keys({
    a: Joi.number()
}).rename('b', 'a');

object.validate({ b: 5 }, (err, value) => { });
```

It can also rename keys using a regular expression:

```js
const regex = /^foobar$/i;

const schema = Joi.object().keys({
  fooBar: Joi.string()
}).rename(regex, 'fooBar');

schema.validate({ FooBar: 'a'}, (err, value) => {});
```

#### `object.assert(ref, schema, [message])`

Verifies an assertion where:
- `ref` - the key name or [reference](#refkey-options).
- `schema` - the validation rules required to satisfy the assertion. If the `schema` includes references, they are resolved against
  the object value, not the value of the `ref` target.
- `message` - optional human-readable message used when the assertion fails. Defaults to 'failed to pass the assertion test'.

```js
const schema = Joi.object().keys({
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

```js
const schema = Joi.object({ a: Joi.any() }).unknown();
```

#### `object.type(constructor, [name])`

Requires the object to be an instance of a given constructor where:
- `constructor` - the constructor function that the object must be an instance of.
- `name` - an alternate name to use in validation errors. This is useful when the constructor function does not have a name.

```js
const schema = Joi.object().type(RegExp);
```

#### `object.schema()`

Requires the object to be a Joi schema instance.

```js
const schema = Joi.object().schema();
```

#### `object.requiredKeys(children)`

Sets the specified children to required.
- `children` - can be a single string value, an array of string values, or each child provided as an argument.

```js
const schema = Joi.object().keys({ a: { b: Joi.number() }, c: { d: Joi.string() } });
const requiredSchema = schema.requiredKeys('', 'a.b', 'c', 'c.d');
```

Note that in this example `''` means the current object, `a` is not required but `b` is, as well as `c` and `d`.

#### `object.optionalKeys(children)`

Sets the specified children to optional.
- `children` - can be a single string value, an array of string values, or each child provided as an argument.

```js
const schema = Joi.object().keys({ a: { b: Joi.number().required() }, c: { d: Joi.string().required() } });
const optionalSchema = schema.optionalKeys('a.b', 'c.d');
```

The behavior is exactly the same as `requiredKeys`.

#### `object.forbiddenKeys(children)`

Sets the specified children to forbidden.
- `children` - can be a single string value, an array of string values, or each child provided as an argument.

```js
const schema = Joi.object().keys({ a: { b: Joi.number().required() }, c: { d: Joi.string().required() } });
const optionalSchema = schema.forbiddenKeys('a.b', 'c.d');
```

The behavior is exactly the same as `requiredKeys`.

### `string` - inherits from `Any`

Generates a schema object that matches a string data type. Note that empty strings are not allowed by default and must
be enabled with `allow('')`. However, if you want to specify a default value in case of empty string you have to use a
different pattern: `Joi.string().empty('').default('default value')`. This tells Joi that the empty string should be
considered as an empty value (instead of invalid) and which value to use as default.

If the validation `convert` option is on (enabled by default), a string will be converted using the specified modifiers
for `string.lowercase()`, `string.uppercase()`, `string.trim()`, and each replacement specified with `string.replace()`.

Supports the same methods of the [`any()`](#any) type.

```js
const schema = Joi.string().min(1).max(10);
schema.validate('12345', (err, value) => { });
```

#### `string.insensitive()`

Allows the value to match any whitelist of blacklist item in a case insensitive comparison.

```js
const schema = Joi.string().valid('a').insensitive();
```

#### `string.min(limit, [encoding])`

Specifies the minimum number string characters where:
- `limit` - the minimum number of string characters required.
- `encoding` - if specified, the string length is calculated in bytes using the provided encoding.

```js
const schema = Joi.string().min(2);
```

It can also be a reference to another field.

```js
const schema = Joi.object({
  min: Joi.string().required(),
  value: Joi.string().min(Joi.ref('min'), 'utf8').required()
});
```

#### `string.max(limit, [encoding])`

Specifies the maximum number of string characters where:
- `limit` - the maximum number of string characters allowed.
- `encoding` - if specified, the string length is calculated in bytes using the provided encoding.

```js
const schema = Joi.string().max(10);
```

It can also be a reference to another field.

```js
const schema = Joi.object({
  max: Joi.string().required(),
  value: Joi.string().max(Joi.ref('max'), 'utf8').required()
});
```

#### `string.truncate([enabled])`

Specifies whether the `string.max()` limit should be used as a truncation.

Parameters are:
- `enabled` - optional parameter defaulting to `true` which allows you to reset the behavior of truncate by providing a falsy value.

```js
const schema = Joi.string().max(5).truncate();
```

#### `string.creditCard()`

Requires the number to be a credit card number (Using [Luhn
Algorithm](http://en.wikipedia.org/wiki/Luhn_algorithm)).

```js
const schema = Joi.string().creditCard();
```

#### `string.length(limit, [encoding])`

Specifies the exact string length required where:
- `limit` - the required string length.
- `encoding` - if specified, the string length is calculated in bytes using the provided encoding.

```js
const schema = Joi.string().length(5);
```

It can also be a reference to another field.

```js
const schema = Joi.object({
  length: Joi.string().required(),
  value: Joi.string().length(Joi.ref('length'), 'utf8').required()
});
```

#### `string.regex(pattern, [name | options])`

Defines a regular expression rule where:
- `pattern` - a regular expression object the string value must match against.
- `name` - optional name for patterns (useful with multiple patterns).
- `options` - an optional configuration object with the following supported properties:
  - `name` - optional pattern name.
  - `invert` - optional boolean flag. Defaults to `false` behavior. If specified as `true`, the provided pattern will be disallowed instead of required.

```js
const schema = Joi.string().regex(/^[abc]+$/);

const inlineNamedSchema = Joi.string().regex(/^[0-9]+$/, 'numbers');
inlineNamedSchema.validate('alpha'); // ValidationError: "value" with value "alpha" fails to match the numbers pattern

const namedSchema = Joi.string().regex(/^[0-9]+$/, { name: 'numbers'});
namedSchema.validate('alpha'); // ValidationError: "value" with value "alpha" fails to match the numbers pattern

const invertedSchema = Joi.string().regex(/^[a-z]+$/, { invert: true });
invertedSchema.validate('lowercase'); // ValidationError: "value" with value "lowercase" matches the inverted pattern: [a-z]

const invertedNamedSchema = Joi.string().regex(/^[a-z]+$/, { name: 'alpha', invert: true });
invertedNamedSchema.validate('lowercase'); // ValidationError: "value" with value "lowercase" matches the inverted alpha pattern
```

#### `string.replace(pattern, replacement)`

Replace characters matching the given _pattern_ with the specified
_replacement_ string where:
- `pattern` - a regular expression object to match against, or a string of which _all_ occurrences will be replaced.
- `replacement` - the string that will replace the pattern.


```js
const schema = Joi.string().replace(/b/gi, 'x');
schema.validate('abBc', (err, value) => {
  // here value will be 'axxc'
});
```

When `pattern` is a _string_ all its occurrences will be replaced.

#### `string.alphanum()`

Requires the string value to only contain a-z, A-Z, and 0-9.

```js
const schema = Joi.string().alphanum();
```

#### `string.token()`

Requires the string value to only contain a-z, A-Z, 0-9, and underscore _.

```js
const schema = Joi.string().token();
```

#### `string.email([options])`

Requires the string value to be a valid email address.

- `options` - optional settings:
    - `errorLevel` - Numerical threshold at which an email address is considered invalid.
    - `tldWhitelist` - Specifies a list of acceptable TLDs.
    - `minDomainAtoms` - Number of atoms required for the domain. Be careful since some domains, such as `io`, directly allow email.

```js
const schema = Joi.string().email();
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

#### `string.uri([options])`

Requires the string value to be a valid [RFC 3986](http://tools.ietf.org/html/rfc3986) URI.

- `options` - optional settings:
    - `scheme` - Specifies one or more acceptable Schemes, should only include the scheme name. Can be an Array or String (strings are automatically escaped for use in a Regular Expression).
    - `allowRelative` - Allow relative URIs. Defaults to `false`.
    - `relativeOnly` - Restrict only relative URIs.  Defaults to `false`.

```js
// Accept git or git http/https
const schema = Joi.string().uri({
  scheme: [
    'git',
    /git\+https?/
  ]
});
```

#### `string.guid()` - aliases: `uuid`

Requires the string value to be a valid GUID.

- `options` - optional settings:
    - `version` - Specifies one or more acceptable versions. Can be an Array or String with the following values:
    `uuidv1`, `uuidv2`, `uuidv3`, `uuidv4`, or `uuidv5`. If no `version` is specified then it is assumed to be a generic `guid`.

```js
const schema = Joi.string().guid({
    version: [
        'uuidv4',
        'uuidv5'
    ]
});
```

#### `string.hex([options])`

Requires the string value to be a valid hexadecimal string.

- `options` - optional settings:
  - `byteAligned` - Boolean specifying whether you want to check that the hexadecimal string is byte aligned. If `convert` is `true`, a `0` will be added in front of the string in case it needs to be aligned. Defaults to `false`.
```js
const schema = Joi.string().hex();
```

#### `string.base64([options])`

Requires the string value to be a valid base64 string; does not check the decoded value.

- `options` - optional settings:
    - `paddingRequired` - optional parameter defaulting to `true` which will require `=` padding if `true` or make padding optional if `false`.

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

#### `string.hostname()`

Requires the string value to be a valid hostname as per [RFC1123](http://tools.ietf.org/html/rfc1123).

```js
const schema = Joi.string().hostname();
```

#### `string.normalize([form])`

Requires the string value to be in a [unicode normalized](https://developer.mozilla.org/en/docs/Web/JavaScript/Reference/Global_Objects/String/normalize)
form. If the validation `convert` option is on (enabled by default), the string will be normalized.

- `form` - The unicode normalization form to use. Valid values: `NFC` [default], `NFD`, `NFKC`, `NFKD`

```js
const schema = Joi.string().normalize(); // defaults to NFC
const schema = Joi.string().normalize('NFC'); // canonical composition
const schema = Joi.string().normalize('NFD'); // canonical decomposition
const schema = Joi.string().normalize('NFKC'); // compatibility composition
const schema = Joi.string().normalize('NFKD'); // compatibility decomposition
```

#### `string.lowercase()`

Requires the string value to be all lowercase. If the validation `convert` option is on (enabled by default), the string
will be forced to lowercase.

```js
const schema = Joi.string().lowercase();
```

#### `string.uppercase()`

Requires the string value to be all uppercase. If the validation `convert` option is on (enabled by default), the string
will be forced to uppercase.

```js
const schema = Joi.string().uppercase();
```

#### `string.trim()`

Requires the string value to contain no whitespace before or after. If the validation `convert` option is on (enabled by
default), the string will be trimmed.

```js
const schema = Joi.string().trim();
```

#### `string.isoDate()`

Requires the string value to be in valid ISO 8601 date format.
If the validation `convert` option is on (enabled by default), the string will be forced to simplified extended ISO format (ISO 8601). Be aware that this operation uses javascript Date object, which does not support the full ISO format, so a few formats might not pass when using `convert`.

```js
const schema = Joi.string().isoDate();
```

### `alternatives` - inherits from `Any`

Generates a type that will match one of the provided alternative schemas via the [`try()`](#alternativestryschemas)
method. If no schemas are added, the type will not match any value except for `undefined`.

Supports the same methods of the [`any()`](#any) type.

Alternatives can be expressed using the shorter `[]` notation.

```js
const alt = Joi.alternatives().try(Joi.number(), Joi.string());
// Same as [Joi.number(), Joi.string()]
```

#### `alternatives.try(schemas)`

Adds an alternative schema type for attempting to match against the validated value where:
- `schema` - an array of alternative **joi** types. Also supports providing each type as a separate argument.

```js
const alt = Joi.alternatives().try(Joi.number(), Joi.string());
alt.validate('a', (err, value) => { });
```

#### `alternatives.when(condition, options)`

Adds a conditional alternative schema type, either based on another key (not the same as `any.when()`) value, or a
schema peeking into the current value, where:
- `condition` - the key name or [reference](#refkey-options), or a schema.
- `options` - an object with:
    - `is` - the required condition **joi** type. Forbidden when `condition` is a schema.
    - `then` - the alternative schema type to **try** if the condition is true. Required if `otherwise` is missing.
    - `otherwise` - the alternative schema type to **try** if the condition is false. Required if `then` is missing.

```js
const schema = {
    a: Joi.alternatives().when('b', { is: 5, then: Joi.string(), otherwise: Joi.number() }),
    b: Joi.any()
};
```

```js
const schema = Joi.alternatives().when(Joi.object({ b: 5 }).unknown(), {
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

Note that `when()` only adds additional alternatives to try and does not impact the overall type. Setting
a `required()` rule on a single alternative will not apply to the overall key. For example,
this definition of `a`:

```js
const schema = {
    a: Joi.alternatives().when('b', { is: true, then: Joi.required() }),
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

### `lazy(fn)` - inherits from `Any`

Generates a placeholder schema for a schema that you would provide with the `fn`.

Supports the same methods of the [`any()`](#any) type.

This is mostly useful for recursive schemas, like :
```js
const Person = Joi.object({
    firstName: Joi.string().required(),
    lastName: Joi.string().required(),
    children: Joi.array().items(Joi.lazy(() => Person).description('Person schema'))
});
```

## Errors

Joi throws classical javascript `Error`s containing :
- `name` - `'ValidationError'`.
- `isJoi` - `true`.
- `details` - an array of errors :
    - `message` - string with a description of the error.
    - `path` - ordered array where each element is the accessor to the value where the error happened.
    - `type` - type of the error.
    - `context` - object providing context of the error containing at least:
        - `key` - key of the value that errored, equivalent to the last element of `details.path`.
        - `label` - label of the value that errored, or the `key` if any, or the default `language.root`.
- `annotate` - function that returns a string with an annotated version of the object pointing at the places where errors occurred. Takes an optional parameter that, if truthy, will strip the colors out of the output.
- `_object` - the original object to validate.
