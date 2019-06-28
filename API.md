<!-- version -->
# 16.0.0-rc1 API Reference
<!-- versionstop -->

<!-- toc -->

- [Joi](#joi)
  - [`version`](#version)
  - [`compile(schema, [options])`](#compileschema-options)
  - [`describe(schema)`](#describeschema)
  - [`assert(value, schema, [message], [options])` - aliases: `attempt`](#assertvalue-schema-message-options---aliases-attempt)
  - [`ref(key, [options])`](#refkey-options)
    - [Relative references](#relative-references)
  - [`isRef(ref)`](#isrefref)
  - [`isExpression(expression)`](#isexpressionexpression)
  - [`expression(template, [options])` - aliases: `x`](#expressiontemplate-options---aliases-x)
    - [Template syntax](#template-syntax)
  - [`isSchema(schema, [options])`](#isschemaschema-options)
  - [`defaults(fn)`](#defaultsfn)
  - [`bind()`](#bind)
  - [`extend(extension)`](#extendextension)
    - [Terms](#terms)
    - [Extension](#extension)
    - [npm note](#npm-note)
    - [Examples](#examples)
  - [`any`](#any)
    - [`type`](#type)
    - [`any.allow(...values)`](#anyallowvalues)
    - [`any.cast(to)`](#anycastto)
    - [`any.concat(schema)`](#anyconcatschema)
    - [`any.default([value, [description]])`](#anydefaultvalue-description)
    - [`any.describe()`](#anydescribe)
    - [`any.description(desc)`](#anydescriptiondesc)
    - [`any.empty(schema)`](#anyemptyschema)
    - [`any.error(err)`](#anyerrorerr)
    - [`any.example(...values)`](#anyexamplevalues)
    - [`any.extract(path)`](#anyextractpath)
    - [`any.failover([value, [description]])`](#anyfailovervalue-description)
    - [`any.forbidden()`](#anyforbidden)
    - [`any.id(id)`](#anyidid)
    - [`any.invalid(...values)` - aliases: `disallow`, `not`](#anyinvalidvalues---aliases-disallow-not)
    - [`any.keep()`](#anykeep)
    - [`any.label(name)`](#anylabelname)
    - [`any.message(message)`](#anymessagemessage)
    - [`any.meta(meta)`](#anymetameta)
    - [`any.modify(paths, adjuster)`](#anymodifypaths-adjuster)
    - [`any.notes(notes)`](#anynotesnotes)
    - [`any.optional()`](#anyoptional)
    - [`any.prefs(options)` = aliases: `preferences`, `options`](#anyprefsoptions--aliases-preferences-options)
    - [`any.raw()`](#anyraw)
    - [`any.required()` - aliases: `exist`](#anyrequired---aliases-exist)
    - [`any.rule(options)`](#anyruleoptions)
    - [`any.ruleset` - aliases: `$`](#anyruleset---aliases-)
    - [`any.strict(isStrict)`](#anystrictisstrict)
    - [`any.strip()`](#anystrip)
    - [`any.tags(tags)`](#anytagstags)
    - [`any.unit(name)`](#anyunitname)
    - [`any.valid(...values)` - aliases: `only`, `equal`](#anyvalidvalues---aliases-only-equal)
    - [`any.validate(value, [options])`](#anyvalidatevalue-options)
    - [`any.when(condition, options)`](#anywhencondition-options)
  - [`array` - inherits from `Any`](#array---inherits-from-any)
    - [`array.has(schema)`](#arrayhasschema)
    - [`array.items(...types)`](#arrayitemstypes)
    - [`array.length(limit)`](#arraylengthlimit)
    - [`array.max(limit)`](#arraymaxlimit)
    - [`array.min(limit)`](#arrayminlimit)
    - [`array.ordered(...type)`](#arrayorderedtype)
    - [`array.single([enabled])`](#arraysingleenabled)
    - [`array.sort([options])`](#arraysortoptions)
    - [`array.sparse([enabled])`](#arraysparseenabled)
    - [`array.unique([comparator, [options]])`](#arrayuniquecomparator-options)
  - [`boolean` - inherits from `Any`](#boolean---inherits-from-any)
    - [`boolean.truthy(...values)`](#booleantruthyvalues)
    - [`boolean.falsy(...values)`](#booleanfalsyvalues)
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
  - [`number` - inherits from `Any`](#number---inherits-from-any)
    - [`number.unsafe([enabled])`](#numberunsafeenabled)
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
    - [`object.pattern(pattern, schema, [options])`](#objectpatternpattern-schema-options)
    - [`object.and(...peers, [options])`](#objectandpeers-options)
    - [`object.nand(...peers, [options])`](#objectnandpeers-options)
    - [`object.or(...peers, [options])`](#objectorpeers-options)
    - [`object.xor(...peers, [options])`](#objectxorpeers-options)
    - [`object.oxor(...peers, [options])`](#objectoxorpeers-options)
    - [`object.with(key, peers, [options])`](#objectwithkey-peers-options)
    - [`object.without(key, peers, [options])`](#objectwithoutkey-peers-options)
    - [`object.ref()`](#objectref)
    - [`object.rename(from, to, [options])`](#objectrenamefrom-to-options)
    - [`object.assert(ref, schema, [message])`](#objectassertref-schema-message)
    - [`object.unknown([allow])`](#objectunknownallow)
    - [`object.instance(constructor, [name])`](#objectinstanceconstructor-name)
    - [`object.schema([type])`](#objectschematype)
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
    - [`string.domain([options])`](#stringdomainoptions)
    - [`string.email([options])`](#stringemailoptions)
    - [`string.ip([options])`](#stringipoptions)
    - [`string.uri([options])`](#stringurioptions)
    - [`string.guid()` - aliases: `uuid`](#stringguid---aliases-uuid)
    - [`string.hex([options])`](#stringhexoptions)
    - [`string.base64([options])`](#stringbase64options)
    - [`string.dataUri([options])`](#stringdataurioptions)
    - [`string.hostname()`](#stringhostname)
    - [`string.normalize([form])`](#stringnormalizeform)
    - [`string.lowercase()`](#stringlowercase)
    - [`string.uppercase()`](#stringuppercase)
    - [`string.trim([enabled])`](#stringtrimenabled)
    - [`string.isoDate()`](#stringisodate)
    - [`string.isoDuration()`](#stringisoduration)
  - [`symbol` - inherits from `Any`](#symbol---inherits-from-any)
    - [`symbol.map(map)`](#symbolmapmap)
  - [`alternatives` - inherits from `Any`](#alternatives---inherits-from-any)
    - [`alternatives.try(schemas)`](#alternativestryschemas)
    - [`alternatives.when(condition, options)`](#alternativeswhencondition-options)
  - [`lazy(fn[, options])` - inherits from `Any`](#lazyfn-options---inherits-from-any)
- [Errors](#errors)
  - [`ValidationError`](#validationerror)
  - [List of errors](#list-of-errors)
    - [`alternatives.base`](#alternativesbase)
    - [`alternatives.types`](#alternativestypes)
    - [`alternatives.match`](#alternativesmatch)
    - [`any.allowOnly`](#anyallowonly)
    - [`any.default`](#anydefault)
    - [`any.failover`](#anyfailover)
    - [`any.empty`](#anyempty)
    - [`any.invalid`](#anyinvalid)
    - [`any.required`](#anyrequired)
    - [`any.unknown`](#anyunknown)
    - [`array.base`](#arraybase)
    - [`array.excludes`](#arrayexcludes)
    - [`array.includesRequiredBoth`](#arrayincludesrequiredboth)
    - [`array.includesRequiredKnowns`](#arrayincludesrequiredknowns)
    - [`array.includesRequiredUnknowns`](#arrayincludesrequiredunknowns)
    - [`array.includes`](#arrayincludes)
    - [`array.length`](#arraylength)
    - [`array.max`](#arraymax)
    - [`array.min`](#arraymin)
    - [`array.orderedLength`](#arrayorderedlength)
    - [`array.ref`](#arrayref)
    - [`array.sort`](#arraysort)
    - [`array.sort.mismatching`](#arraysortmismatching)
    - [`array.sort.unsupported`](#arraysortunsupported)
    - [`array.sparse`](#arraysparse)
    - [`array.unique`](#arrayunique)
    - [`array.hasKnown`](#arrayhasknown)
    - [`array.hasUnknown`](#arrayhasunknown)
    - [`binary.base`](#binarybase)
    - [`binary.length`](#binarylength)
    - [`binary.max`](#binarymax)
    - [`binary.min`](#binarymin)
    - [`binary.ref`](#binaryref)
    - [`boolean.base`](#booleanbase)
    - [`date.base`](#datebase)
    - [`date.greater`](#dategreater)
    - [`date.isoDate`](#dateisodate)
    - [`date.less`](#dateless)
    - [`date.max`](#datemax)
    - [`date.min`](#datemin)
    - [`date.ref`](#dateref)
    - [`date.strict`](#datestrict)
    - [`date.timestamp.javascript`](#datetimestampjavascript)
    - [`date.timestamp.unix`](#datetimestampunix)
    - [`function.arity`](#functionarity)
    - [`function.base`](#functionbase)
    - [`function.class`](#functionclass)
    - [`function.maxArity`](#functionmaxarity)
    - [`function.minArity`](#functionminarity)
    - [`lazy.base`](#lazybase)
    - [`lazy.schema`](#lazyschema)
    - [`number.base`](#numberbase)
    - [`number.greater`](#numbergreater)
    - [`number.integer`](#numberinteger-1)
    - [`number.less`](#numberless)
    - [`number.max`](#numbermax)
    - [`number.min`](#numbermin)
    - [`number.multiple`](#numbermultiple)
    - [`number.negative`](#numbernegative-1)
    - [`number.port`](#numberport-1)
    - [`number.positive`](#numberpositive-1)
    - [`number.precision`](#numberprecision)
    - [`number.ref`](#numberref)
    - [`number.unsafe`](#numberunsafe)
    - [`object.allowUnknown`](#objectallowunknown)
    - [`object.and`](#objectand)
    - [`object.assert`](#objectassert)
    - [`object.base`](#objectbase)
    - [`object.length`](#objectlength)
    - [`object.max`](#objectmax)
    - [`object.min`](#objectmin)
    - [`object.missing`](#objectmissing)
    - [`object.nand`](#objectnand)
    - [`object.pattern.match`](#objectpatternmatch)
    - [`object.refType`](#objectreftype)
    - [`object.rename.multiple`](#objectrenamemultiple)
    - [`object.rename.override`](#objectrenameoverride)
    - [`object.schema`](#objectschema)
    - [`object.instance`](#objectinstance)
    - [`object.with`](#objectwith)
    - [`object.without`](#objectwithout)
    - [`object.xor`](#objectxor)
    - [`object.oxor`](#objectoxor)
    - [`string.alphanum`](#stringalphanum-1)
    - [`string.base64`](#stringbase64)
    - [`string.base`](#stringbase)
    - [`string.creditCard`](#stringcreditcard-1)
    - [`string.dataUri`](#stringdatauri)
    - [`string.domain`](#stringdomain)
    - [`string.email`](#stringemail)
    - [`string.guid`](#stringguid)
    - [`string.hexAlign`](#stringhexalign)
    - [`string.hex`](#stringhex)
    - [`string.hostname`](#stringhostname-1)
    - [`string.ipVersion`](#stringipversion)
    - [`string.ip`](#stringip)
    - [`string.isoDate`](#stringisodate-1)
    - [`string.isoDuration`](#stringisoduration-1)
    - [`string.length`](#stringlength)
    - [`string.lowercase`](#stringlowercase-1)
    - [`string.max`](#stringmax)
    - [`string.min`](#stringmin)
    - [`string.normalize`](#stringnormalize)
    - [`string.ref`](#stringref)
    - [`string.regex.base`](#stringregexbase)
    - [`string.regex.name`](#stringregexname)
    - [`string.regex.invert.base`](#stringregexinvertbase)
    - [`string.regex.invert.name`](#stringregexinvertname)
    - [`string.token`](#stringtoken-1)
    - [`string.trim`](#stringtrim)
    - [`string.uppercase`](#stringuppercase-1)
    - [`string.uri`](#stringuri)
    - [`string.uriCustomScheme`](#stringuricustomscheme)
    - [`string.uriRelativeOnly`](#stringurirelativeonly)
    - [`symbol.base`](#symbolbase)
    - [`symbol.map`](#symbolmap)

<!-- tocstop -->

## Joi

### `version`

Property showing the current version of **joi** being used.

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

const schema = Joi.alternatives().try([
    Joi.string().valid('key'),
    Joi.number().valid(5),
    Joi.object({
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

### `assert(value, schema, [message], [options])` - aliases: `attempt`

Validates a value against a schema and [throws](#errors) if validation fails where:
- `value` - the value to validate.
- `schema` - the validation schema. Can be a **joi** type object or a plain object where every key is assigned a **joi** type object using [`Joi.compile`](#compileschema-options) (be careful of the cost of compiling repeatedly the same schemas).
- `message` - optional message string prefix added in front of the error message. may also be an Error object.
- `options` - optional options object, passed in to [`any.validate`](#anyvalidatevalue-options)

```js
Joi.assert('x', Joi.number());
```

### `ref(key, [options])`

Generates a reference to the value of the named key. References are resolved at validation time and
in order of dependency so that if one key validation depends on another, the dependent key is
validated second after the reference is validated.

References support the following arguments:
- `key` - the reference target. References can point to sibling keys (`a.b`) or ancestor keys
  (`...a.b`) using the `.` separator. If a `key` starts with `$` is signifies a context reference
  which is looked up in the `context` option object. The `key` can start with one or more separator
  characters to indicate a [relative starting point](#Relative-references).
- `options` - optional settings:
    - `adjust` - a function with the signature `function(value)` where `value` is the resolved reference value and the return
      value is the adjusted value to use. For example `(value) => value + 5` will add 5 to the resolved value. Note that the
      `adjust` feature will not perform any type validation on the adjusted value and it must match the value expected by the
      rule it is used in. Cannot be used with `map`.
    - `map` - an array of array pairs using the format `[[key, value], [key, value]]` used to maps
      the resolved reference value to another value. If the resolved value is not in the map, it is
      returned as-is. Cannot be used with `adjust`.
    - `prefix` - overrides default prefix characters for:
      - `global` - references to the globally provided `context` preference. Defaults to `'$'`.
      - `local` - references to error-specific or rule specific context. Defaults to `'#'`.
    - `separator` - overrides the default `.` hierarchy separator. Set to `false` to treat the `key` as a literal value.
    - `ancestor` - if set to a number, sets the reference [relative starting point](#Relative-references). Cannot be combined
      with separator prefix characters. Defaults to the reference key prefix (or `1` if none present).

Note that references can only be used where explicitly supported such as in `valid()` or `invalid()` rules. If upwards
(parents) references are needed, use [`object.assert()`](#objectassertref-schema-message).

```js
const schema = Joi.object({
    a: Joi.ref('b.c'),
    b: {
        c: Joi.any()
    },
    c: Joi.ref('$x')
});

await schema.validate({ a: 5, b: { c: 5 } }, { context: { x: 5 } });
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

### `isRef(ref)`

Checks whether or not the provided argument is a reference.
It's especially useful if you want to post-process error messages.

```js
const ref = Joi.ref('a');
Joi.isRef(ref); // returns true
```

### `isExpression(expression)`

Checks whether or not the provided argument is an expression.

```js
const expression = Joi.x('{a}');
Joi.isExpression(expression); // returns true
```

### `expression(template, [options])` - aliases: `x`

Generates a dyanmic expression using a template string where:
- `template` - the template string using the [template syntax](#template-syntax).
- `options` - optional settings used when creating internal references. Supports the same options
  as [`ref()`](#refkey-options).

#### Template syntax

The template syntax uses `{}` and `{{}}` enclosed formulas to reference values as well as perform
number and string operations. Single braces `{}` leave the formula result as-is, while double
braces `{{}}` HTML-escape the formula result (unless the template is used for error messages
and the `errors.escapeHtml` preference flag is set to `false`).

The formula uses a simple mathematical syntax such as `a + b * 2` where the named formula variables
are references. Most references can be used as-is but some can create ambiguity with the formula
syntax and must be enclosed in `[]` bracets (e.g. `[.]`).

The formulas can only operate on `null`, booleans, numbers, and strings. If any operation involves
a string, all other numbers will be casted to strings (as the internal implementation uses simple
JavaScript operators). The supported operators are: `^`, `*`, `/`, `%`, `+`, `-`, `<`, `<=`, `>`,
`>=`, `==`, `!=`, `&&`, `||`, and `??` (in this order of precendece).

The reference names can have one of the following prefixes:
- `#` - indicates the variable references a local context value. For example, in errors this is the
  error context, while in rename operations, it is the regular expression matching groups.
- `$` - indicates the variable references a global context value from the `context` preference object
  provided as an option to the validation function or set using [`any.prefs()`](#anyprefsoptions--aliases-preferences-options).
- any other variable references a key within the current value being validated.

The formula syntax also supports built-in functions:
- `if(condition, then, otherwise)`

And the following constants:
- `null`
- `true`
- `false`

### `isSchema(schema, [options])`

Checks whether or not the provided argument is a **joi** schema where:
- `schema` - the value being checked.
- `options` - optional settings:
    - `legacy` - if `true`, will identify schemas from older versions of joi, otherwise will throw
      an error. Defaults to `false`.

```js
const schema = Joi.any();
Joi.isSchema(schema); // returns true
```

### `defaults(fn)`

Creates a new **joi** instance that will apply defaults onto newly created schemas through the use
of the `fn` function that takes exactly one argument, the schema being created.

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

### `bind()`

By default, some **joi** methods to function properly need to rely on the **joi** instance they are attached to because they use `this` internally. So `Joi.string()` works but if you extract the function from it and call `string()` it won't. `bind()` creates a new **joi** instance where all the functions relying on `this` are bound to the **joi** instance.

```js
const { object, string } = require('@hapi/joi').bind();

const schema = object({
  property: string().min(4)
});
```

### `extend(extension)`

Creates a new **joi** instance customized with the extension(s) you provide included.

It is **important** to understand that original **joi** library is not modified by this.

#### Terms

The extension makes use of some common structures that need to be described prior :
- `value` - the value being processed by Joi.
- `state` - an object containing the current context of validation.
    - `key` - the key of the current value.
    - `path` - the full path of the current value.
    - `ancestors` - an array of the potential parents of the current value.
    - `flags` - a reference to the schema's internal flags.
- `prefs` - preferences object provided through [`any().prefs()`](#anyprefsoptions--aliases-preferences-options) or [`any.validate()`](#anyvalidatevalue-options).

#### Extension

`extension` can be :
- a single extension object
- a factory function generating an extension object
- or an array of those

Extension objects use the following parameters :
- `name` - name of the new type you are defining, this can be an existing type. **Required**.
- `base` - an existing **joi** schema to base your type upon. Defaults to `Joi.any()`.
- `coerce` - an optional function that runs before the base, usually serves when you want to coerce values of a different type than your base. It takes 3 arguments `value`, `state` and `prefs`.
- `pre` - an optional function that runs first in the validation chain, usually serves when you need to cast values. It takes 3 arguments `value`, `state` and `prefs`.
- `messages` - an optional object to add error definitions. Every key will be prefixed by the type name.
- `describe` - an optional function taking the fully formed description to post-process it.
- `rules` - an optional array of rules to add.
    - `name` - name of the new rule. **Required**.
    - `params` - an optional object containing **joi** schemas of each parameter ordered. You can also pass a single **joi** schema as long as it is a `Joi.object()`, of course some methods such as `pattern` or `rename` won't be useful or won't work at all in this given context.
    - `setup` - an optional function that takes an object with the provided parameters to allow for internals manipulation of the schema when a rule is set, you can optionally return a new **joi** schema that will be taken as the new schema instance. At least one of `setup` or `validate` **must** be provided.
    - `validate` - an optional function to validate values that takes 4 parameters `params`, `value`, `state` and `prefs`. At least one of `setup` or `validate` **must** be provided.
    - `description` - an optional string or function taking the parameters as argument to describe what the rule is doing.

Factory functions are advised if you intend to publish your extensions for others to use, because they are capable of using an extended **joi** being built, thus avoiding any erasure when using multiple extensions at the same time. See an example of a factory function in the section below.

The `params` of `rules` rely on the fact that all engines, even though not stated in the ECMA specifications, preserve the order of object keys, this is a conscious choice to simplify the API for the end-user. If you ever see an engine misbehaving or are uncomfortable relying on this, you can use a single option object to describe your parameters, like:
```js
params: { options: Joi.object({ param1: Joi.number().required(), param2: Joi.string() }) }
```

To resolve referenced `params` in you `validate` or `setup` functions, you can use the following approach:
```js
validate(params, value, state, prefs) {

    let {foo} = params;
    if (Joi.isRef(foo)) {
        foo = foo.resolve(value, state, prefs);
    }
  //...
}
```

Any of the `coerce`, `pre` and `validate` functions should use `this.createError(code, value, local, state, prefs)` to create and return errors.
This function potentially takes 5 required arguments:
- `code` - the dotted type of the error matching predefined messages or the ones defined in your extension.
- `value` - the value responsible for the error.
- `local` - a free-form object that can contain anything you want to provide context on regarding the error. This object's properties are inserted in the error message where bracketted placeholders are.
- `state` - state that the validation was in, which contains the current key, path, parent if any, or reference if any. Usually you just have to pass the `state` you were given.
- `prefs` - preferences that were used for the validation. Usually you just have to pass the `prefs` you were given.

#### npm note

If you publish your extension on npm, make sure to add `joi` and `extension` as keywords so that it's discoverable more easily.

#### Examples

```js
const Joi = require('@hapi/joi');
const customJoi = Joi.extend((joi) => ({
    base: joi.number(),
    name: 'number',
    messages: {
        round: 'needs to be a rounded number', // Used below as 'number.round'
        dividable: 'needs to be dividable by {{q}}'
    },
    pre(value, state, prefs) {

        if (prefs.convert && this._flags.round) {
            return Math.round(value); // Change the value
        }

        return value; // Keep the value as it was
    },
    rules: [
        {
            name: 'round',
            setup(params) {

                this._flags.round = true;    // Set a flag for later use
            },
            validate(params, value, state, prefs) {

                if (value % 1 !== 0) {
                    // Generate an error, state and prefs need to be passed
                    return this.createError('number.round', value, {}, state, prefs);
                }

                return value; // Everything is OK
            }
        },
        {
            name: 'dividable',
            params: {
                q: joi.alternatives([joi.number().required(), joi.func().ref()])
            },
            validate(params, value, state, prefs) {

                if (value % params.q !== 0) {
                    // Generate an error, state and prefs need to be passed, q is used in the messages
                    return this.createError('number.dividable', value, { q: params.q }, state, prefs);
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
await any.validate('a');
```

#### `type`

Gets the type of the schema.

```js
const schema = Joi.string();

schema.type === 'string';   // === true
```

#### `any.allow(...values)`

Allows values where:
- `values` - one or more allowed values which can be of any type and will be matched against the
  validated value before applying any other rules. Supports [references](#refkey-options).

Note that this list of allowed values is in *addition* to any other permitted values.
To create an exclusive list of values, see [`any.valid(value)`](#anyvalidvalue---aliases-only-equal).

```js
const schema = {
    a: Joi.any().allow('a'),
    b: Joi.any().allow('b', 'B')
};
```

#### `any.cast(to)`

Casts the validated value to the specified type where:
- `to` - the value target type. Each **joi** schema type supports its own set of cast targets:
    - `'map'` - supported by the `Joi.object()` type, converts the result to a `Map` object
      containing the object key-value pairs.
    - `'number'` - supported by `Joi.boolean()` and `Joi.date()`, converts the result to a number.
      For dates, number of milliseconds since the epoch and for booleans, `0` for `false` and `1`
      for `true`.
    - `'raw'` - supported by all types, forces the result value to use the raw input regardless of
      any conversions or changes made during validation.
    - `'set'` - supported by the `Joi.array()` type, converts the result to a `Set` object
      containing the array values.
    - `'string'` - supported by `Joi.binary()`, `Joi.boolean()`, `Joi.date()`, and `Joi.number()`,
      converts the result to a string.

#### `any.concat(schema)`

Returns a new type that is the result of adding the rules of one type to another where:
- `schema` - a **joi** type to merge into the current schema. Can only be of the same type as the context type or `any`. If applied to an `any` type, the schema can be any other schema.

```js
const a = Joi.string().valid('a');
const b = Joi.string().valid('b');
const ab = a.concat(b);
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

const schema = Joi.object({
    username: Joi.string().default(generateUsername),
    firstname: Joi.string(),
    lastname: Joi.string(),
    created: Joi.date().default(Date.now, 'time of creation'),
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
  - a function with the signature `function(errors)`, where `errors` is an array of errors and it returns a single `Error`.

Note that if you provide an `Error`, it will be returned as-is, unmodified and undecorated with any
of the normal error properties. If validation fails and another error is found before the error
override, that error will be returned and the override will be ignored (unless the `abortEarly`
option has been set to `false`).

```js
const schema = Joi.string().error(new Error('Was REALLY expecting a string'));
schema.validate(3);     // returns error.message === 'Was REALLY expecting a string'
```

```js
const schema = Joi.object({
    foo: Joi.number().min(0).error((errors) => new Error('"foo" requires a positive number'))
});
schema.validate({ foo: -2 });    // returns error.message === '"foo" requires a positive number'
```

```js
const schema = Joi.object({
    foo: Joi.number().min(0).error((errors) => {

        return new Error('found errors with ' + errors.map((err) => `${err.type}(${err.local.limit}) with value ${err.local.value}`).join(' and '));
    })
});
schema.validate({ foo: -2 });    // returns error.message === 'child "foo" fails because [found errors with number.min(0) with value -2]'
```

#### `any.example(...values)`

Adds examples to the schema where:
- `values` - each argument is an example value.

Note that no validation is performed on the provided examples. Calling this function again will override the previous examples.

```js
const schema = Joi.string().min(4).example('abcd');
```

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

#### `any.failover([value, [description]])`

Sets a failover value if the original value failes passing validation where:
- `value` - the failover value.
  - `value` supports [references](#refkey-options).
  - `value` may also be a function which returns the default value. If `value` is specified as a
    function that accepts a single parameter, that parameter will be a context object that can be
    used to derive the resulting value.
    - Use a function when setting a dynamic value, such as the current time. Ex: `default(Date.now, 'time of creation')`
    - **Caution: this clones the object**, which incurs some overhead so if you don't need access
      to the context define your method so that it does not accept any parameters.
  - without any `value`, `default` has no effect, except for `object` that will then create nested
    defaults (applying inner defaults of that object).

Note that if `value` is an object, any changes to the object after `failover()` is called will
change the reference and any future assignment.

Additionally, when specifying a method you must either have a `description` property on your method
or the second parameter is required.

Possible validation errors: [`any.failover`](#anyfailover)

#### `any.forbidden()`

Marks a key as forbidden which will not allow any value except `undefined`. Used to explicitly forbid keys.

```js
const schema = {
    a: Joi.any().forbidden()
};
```

Possible validation errors: [`any.unknown`](#anyunknown)

#### `any.id(id)`

Sets a schema id for reaching into the schema via [`any.extract()`](#anyextractpath) where:
- `id` - an alphanumeric string (plus `_`) used to identify the schema.

If no id is set, the schema id defaults to the object key it is associated with. If the schema is
used in an array or alternatives type and no id is set, the schema in unreachable.

#### `any.invalid(...values)` - aliases: `disallow`, `not`

Disallows values where:
- `values` - the forbidden values which can be of any type and will be matched against the
  validated value before applying any other rules. Supports [references](#refkey-options).

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

#### `any.meta(meta)`

Attaches metadata to the key where:
- `meta` - the meta object to attach.

```js
const schema = Joi.any().meta({ index: true });
```

#### `any.modify(paths, adjuster)`

Returns a new schema where each of the path keys listed have been modified where:
- `paths` - an array of key strings, a single key string, or an array of arrays of pre-split
  key strings. Key string paths use dot `.` to indicate key hierarchy.
- `adjuster` - a function using the signature `function(schema)` which must return a modified
  schema. For example, `(schema) => schema.required()`.

The method does not modify the original schema.

#### `any.notes(notes)`

Annotates the key where:
- `notes` - the notes string or array of strings.

```js
const schema = Joi.any().notes(['this is special', 'this is important']);
```

#### `any.optional()`

Marks a key as optional which will allow `undefined` as values. Used to annotate the schema for readability as all keys are optional by default.

Note: this does not allow a `null` value. To do that, use [`any.allow(value)`](#anyallowvalue). Or both!

```js
const schema = Joi.any().optional();
```

#### `any.prefs(options)` = aliases: `preferences`, `options`

Overrides the global `validate()` options for the current key and any sub-key where:
- `options` - an object with the same optional keys as [`any.validate()`](#anyvalidatevalue-options).

```js
const schema = Joi.any().prefs({ convert: false });
```

#### `any.raw()`

Outputs the original untouched value instead of the casted value.

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


#### `any.rule(options)`

Applies a set of rule options to the current ruleset or last rule added where:
- `options` - the rules to apply where:
  - `keep` - if `true`, the rules will not be replaced by the same unqiue rule later. For example,
    `Joi.number().min(1).rule({ keep: true }).min(2)` will keep both `min()` rules instead of the later
    rule overriding the first. Defaults to `false`.
  - `message` - a single message string or a messages object where each key is an error code and
    corresponding message string as value. The object is the same as the `messages` used as an option in
    [`any.validate()`](#anyvalidatevalue-options).
    The strings can be plain messages or a message template.

When applying rule options, the last rule (e.g. `min()`) is used unless there is an active ruleset defined
(e.g. `$.min().max()`) in which case the options are applied to all the provided rules. Once `rules()` is
called, the previous rules can no longer be modified and any active ruleset is terminated.

#### `any.ruleset` - aliases: `$`

Starts a ruleset in order to apply multiple [rule options](#anyruleoptions). The set ends when
[`rule()`](#anyruleoptions) is called.

```js
const schema = Joi.number().ruleset.min(1).max(10).rule({ message: 'Number must be between 1 and 10' });
```

```js
const schema = Joi.number().$.min(1).max(10).rule({ message: 'Number must be between 1 and 10' });
```

#### `any.strict(isStrict)`

Strict mode sets the `options.convert` options to `false` which prevent type casting for the current key and any child keys.
- `isStrict` - whether strict mode is enabled or not. Defaults to true.

```js
const schema = Joi.any().strict();
```

#### `any.strip()`

Marks a key to be removed from a resulting object or array after validation. Used to sanitize output.

```js
const schema = Joi.object({
    username: Joi.string(),
    password: Joi.string().strip()
});

schema.validate({ username: 'test', password: 'hunter2' }); // result.value = { username: 'test' }

const schema = Joi.array().items(Joi.string(), Joi.any().strip());

schema.validate(['one', 'two', true, false, 1, 2]); // result.value = ['one', 'two']
});
```

#### `any.tags(tags)`

Annotates the key where:
- `tags` - the tag string or array of strings.

```js
const schema = Joi.any().tags(['api', 'user']);
```

#### `any.unit(name)`

Annotates the key where:
- `name` - the unit name of the value.

```js
const schema = Joi.number().unit('milliseconds');
```

#### `any.valid(...values)` - aliases: `only`, `equal`

Adds the provided values into the allowed whitelist and marks them as the only valid values allowed
where:
- `values` - one or more allowed values which can be of any type and will be matched against the
  validated value before applying any other rules. Supports [references](#refkey-options).

```js
const schema = {
    a: Joi.any().valid('a'),
    b: Joi.any().valid('b', 'B')
};
```

Possible validation errors: [`any.allowOnly`](#anyallowonly)

#### `any.validate(value, [options])`

Validates a value using the current schema and options where:
- `value` - the value being validated.
- `options` - an optional object with the following optional keys:
  - `abortEarly` - when `true`, stops validation on the first error, otherwise returns all the errors found. Defaults to `true`.
  - `allowUnknown` - when `true`, allows object to contain unknown keys which are ignored. Defaults to `false`.
  - `context` - provides an external data set to be used in [references](#refkey-options). Can only be set as an external option to
    `validate()` and not using `any.prefs()`.
  - `convert` - when `true`, attempts to cast values to the required types (e.g. a string to a number). Defaults to `true`.
  - `dateFormat` - sets the string format used when converting dates to strings in error messages and casting. Options are:
    - `'date'` - date string.
    - `'iso'` - date time ISO string. This is the default.
    - `'string'` - JS default date time string.
    - `'time'` - time string.
    - `'utc'` - UTC date time string.
  - `error` - error formatting settings:
    - `escapeHtml` - when `true`, error message templates will escape special characters to HTML
      entities, for security purposes. Defaults to `false`.
    - `language` - the prefered language code for error messages. The value is matched against keys
      are the root of the `messages` object, and then the error code as a child key of that. Can be
      a reference to the value, global context, or local context which is the root value passed to the
      validation function. Note that references to the value are usually not what you want as they move
      around the value structure relative to where the error happens. Instead, either use the global
      context, or the absolute value using local context notation (e.g. `Joi.ref('#variable')`);
    - `wrapArrays` - if `true`, array values in error messages are wrapped in `[]`. Defaults to `true`.
  - `messages` - overrides individual error messages. Defaults to no override (`{}`). Messages use
    the same rules as [templates](#template-syntax). Variables in double braces `{{var}}` are HTML
    escaped if the option `errors.escapeHtml` is set to `true`.
  - `noDefaults` - when `true`, do not apply default values. Defaults to `false`.
  - `nonEnumerables` - when `true`, inputs are shallow cloned to include non-enumerables properties.
    Defaults to `false`.
  - `presence` - sets the default presence requirements. Supported modes: `'optional'`, `'required'`,
    and `'forbidden'`. Defaults to `'optional'`.
  - `skipFunctions` - when `true`, ignores unknown keys with a function value. Defaults to `false`.
  - `stripUnknown` - remove unknown elements from objects and arrays. Defaults to `false`.
    - when an `object` :
      - `arrays` - set to `true` to remove unknown items from arrays.
      - `objects` - set to `true` to remove unknown keys from objects.
    - when `true`, it is equivalent to having `{ arrays: false, objects: true }`.

Returns a Promise-like object that can be used as a promise, or as a simple object like in the below examples.

```js
const schema = Joi.object({
    a: Joi.number()
});

const value = {
    a: '123'
};

const result = schema.validate(value);
// result.error -> null
// result.value -> { "a" : 123 }

// or
try {
  const value = await schema.validate(value);
  // value -> { "a" : 123 }
}
catch (err) {

}
```

#### `any.when(condition, options)`

Converts the type into an [`alternatives`](#alternatives---inherits-from-any) type with the
conditions merged into the type definition where:
- `condition` - the key name or [reference](#refkey-options), or a schema.
- `options` - an object with:
    - `is` - the condition expressed as a **joi** schema. Anything that is not a **joi** schema will be
      converted using [Joi.compile](#compileschema-options). By default, the `is` condition schema allows for
      `undefined` values. Use `.required()` to override. For example, use `is: Joi.number().required()`
      to guarantee that a **joi** reference exists and is a number.
    - `then` - if the condition is true, the **joi** schema to use.
    - `otherwise` - if the condition is false, the **joi** schema to use.
    - `switch` - an array of `{ is, then }` conditions that are evaluated against the `condition`.
      The last item in the array may also contain `otherwise`.

If `condition` is a reference:
- one of `is` or `switch` is required.
- one of `then`, `otherwise`, or `switch` is required.
- cannot use `is` or `then` with `switch`.
- cannot specify `otherwise` both inside the last `switch` statement and outside.

If `condition` is a schema:
- cannot specify `is` or `switch`.
- one of `then` or `otherwise` is required.

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

Note that this style is much more useful when your whole schema depends on the value of one of its
property, or if you find yourself repeating the check for many keys of an object. For example to
validate this logic:

```js
const schema = Joi.object({
    capacity: Joi.string()
        .valid(["A", "B", "C"])
        .required(),
    // required if capacity == "A"
    foo: Joi.when("capacity", {
        is: "A",
        then: Joi.string()
        .valid(["X", "Y", "Z"])
        .required()
    }),
    // required if capacity === "A" and foo !== "Z"
    bar: Joi.string()
}).when(
    Joi.object({
        capacity: Joi.only("A").required(),
        foo: Joi.not("Z")
    }).unknown(),
    {
        then: Joi.object({
            bar: Joi.required()
        })
    }
);
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

### `array` - inherits from `Any`

Generates a schema object that matches an array data type. Note that undefined values inside arrays are not allowed by
default but can be by using `sparse()`. If the validation `convert` option is on (enabled by default), a string will be
converted to an `array` if specified via `JSON.parse()`.

Supports the same methods of the [`any()`](#any) type.

```js
const array = Joi.array().items(Joi.string().valid('a', 'b'));
await array.validate(['a', 'b', 'a']);
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

Possible validation errors: [`array.excludes`](#arrayexcludes), [`array.includesRequiredBoth`], [`array.includesRequiredKnowns`], [`array.includesRequiredUnknowns`], [`array.includes`](#arrayincludes)

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
    - `by` - a key name or reference to sort array objects by. Defautls to the entire value.

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

### `boolean` - inherits from `Any`

Generates a schema object that matches a boolean data type. Can also be called via `bool()`. If the validation `convert`
option is on (enabled by default), a string (either "true" or "false") will be converted to a `boolean` if specified.

Supports the same methods of the [`any()`](#any) type.

```js
const boolean = Joi.boolean();

await boolean.validate(true); // Valid
await boolean.validate(1);    // Throws
```

Possible validation errors: [`boolean.base`](#booleanbase)

#### `boolean.truthy(...values)`

Allows for additional values to be considered valid booleans by converting them to `true` during validation.
Requires the validation `convert` option to be `true`.

String comparisons are by default case insensitive, see [`boolean.insensitive()`](#booleaninsensitiveenabled) to change this behavior.

```js
const boolean = Joi.boolean().truthy('Y');
await boolean.validate('Y'); // Valid
```

#### `boolean.falsy(...values)`

Allows for additional values to be considered valid booleans by converting them to `false` during validation.
Requires the validation `convert` option to be `true`.

String comparisons are by default case insensitive, see [`boolean.insensitive()`](#booleaninsensitiveenabled) to change this behavior.

```js
const boolean = Joi.boolean().falsy('N');
await boolean.validate('N'); // Valid
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

Possible validation errors: [`binary.base`](#binarybase)

#### `binary.encoding(encoding)`

Sets the string encoding format if a string input is converted to a buffer where:
- `encoding` - the encoding scheme.

```js
const schema = Joi.binary().encoding('base64');
```

#### `binary.min(limit)`

Specifies the minimum length of the buffer where:
- `limit` - the lowest size of the buffer or a reference.

```js
const schema = Joi.binary().min(2);
```

Possible validation errors: [`binary.min`](#binarymin), [`binary.ref`](#binaryref)

#### `binary.max(limit)`

Specifies the maximum length of the buffer where:
- `limit` - the highest size of the buffer or a reference.

```js
const schema = Joi.binary().max(10);
```

Possible validation errors: [`binary.max`](#binarymax), [`binary.ref`](#binaryref)

#### `binary.length(limit)`

Specifies the exact length of the buffer:
- `limit` - the size of buffer allowed or a reference.

```js
const schema = Joi.binary().length(5);
```

Possible validation errors: [`binary.length`](#binarylength), [`binary.ref`](#binaryref)

### `date` - inherits from `Any`

Generates a schema object that matches a date type (as well as a JavaScript date string or number of milliseconds). If
the validation `convert` option is on (enabled by default), a string or number will be converted to a Date if specified.

Supports the same methods of the [`any()`](#any) type.

```js
const date = Joi.date();
await date.validate('12-21-2012');
```

Possible validation errors: [`date.base`](#datebase), [`date.strict`](#datestrict)

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

#### `date.greater(date)`

Specifies that the value must be greater than `date` (or a reference).

```js
const schema = Joi.date().greater('1-1-1974');
```

Notes: `'now'` can be passed in lieu of `date` so as to always compare relatively to the current date, allowing to explicitly ensure a date is either in the past or in the future.

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

#### `date.less(date)`

Specifies that the value must be less than `date` (or a reference).

```js
const schema = Joi.date().less('12-31-2020');

Notes: `'now'` can be passed in lieu of `date` so as to always compare relatively to the current date, allowing to explicitly ensure a date is either in the past or in the future.

```js
const schema = Joi.date().max('now');
```

```js
const schema = Joi.object({
  from: Joi.date().less(Joi.ref('to')).required(),
  to: Joi.date().required()
});
```

Possible validation errors: [`date.less`](#dateless), [`date.ref`](#dateref)

#### `date.iso()`

Requires the string value to be in valid ISO 8601 date format.

```js
const schema = Joi.date().iso();
```

Possible validation errors: [`date.isoDate`](#dateisodate)

#### `date.timestamp([type])`

Requires the value to be a timestamp interval from [Unix Time](https://en.wikipedia.org/wiki/Unix_time).

- `type` - the type of timestamp (allowed values are `unix` or `javascript` [default])

```js
const schema = Joi.date().timestamp(); // defaults to javascript timestamp
const schema = Joi.date().timestamp('javascript'); // also, for javascript timestamp (milliseconds)
const schema = Joi.date().timestamp('unix'); // for unix timestamp (seconds)
```

Possible validation errors: [`date.timestamp.javascript`](#datetimestampjavascript), [`date.timestamp.unix`](#datetimestampunix)

### `func` - inherits from `Any`

Generates a schema object that matches a function type.

Supports the same methods of the [`object()`](#object) type. Note that validating a function keys will cause the function
to be cloned. While the function will retain its prototype and closure, it will lose its `length` property value (will be
set to `0`).

```js
const func = Joi.func();
await func.validate(function () {});
```

Possible validation errors: [`function.base`](#functionbase)

#### `func.arity(n)`

Specifies the arity of the function where:
- `n` - the arity expected.

```js
const schema = Joi.func().arity(2);
```

Possible validation errors: [`function.arity`](#functionarity)

#### `func.minArity(n)`

Specifies the minimal arity of the function where:
- `n` - the minimal arity expected.

```js
const schema = Joi.func().minArity(1);
```

Possible validation errors: [`function.minArity`](#functionminarity)

#### `func.maxArity(n)`

Specifies the maximal arity of the function where:
- `n` - the maximum arity expected.

```js
const schema = Joi.func().maxArity(3);
```

Possible validation errors: [`function.maxArity`](#functionmaxarity)

#### `func.class()`

Requires the function to be a class.

```js
const schema = Joi.func().class();
```

Possible validation errors: [`function.class`](#functionclass)

### `number` - inherits from `Any`

Generates a schema object that matches a number data type (as well as strings that can be converted to numbers). 

By default, it only allows safe numbers, see [`number.unsafe()`](#numberunsafeenabled).

If the validation `convert` option is on (enabled by default), a string will be converted to a `number` if specified. Also, if
`convert` is on and `number.precision()` is used, the value will be converted to the specified `precision` as well.

`Infinity` and `-Infinity` are invalid by default, you can change that behavior by calling `allow(Infinity, -Infinity)`.

Supports the same methods of the [`any()`](#any) type.

```js
const number = Joi.number();
await number.validate(5);
```

Possible validation errors: [`number.base`](#numberbase)

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

#### `number.integer()`

Requires the number to be an integer (no floating point).

```js
const schema = Joi.number().integer();
```

Possible validation errors: [`number.base`](#numberbase)

#### `number.precision(limit)`

Specifies the maximum number of decimal places where:
- `limit` - the maximum number of decimal places allowed.

```js
const schema = Joi.number().precision(2);
```

Possible validation errors: [`number.integer`](#numberinteger-1)

#### `number.multiple(base)`

Specifies that the value must be a multiple of `base` (or a reference):

```js
const schema = Joi.number().multiple(3);
```

Notes: `Joi.number.multiple(base)` _uses the modulo operator (%) to determine if a number is multiple of another number.
Therefore, it has the normal limitations of Javascript modulo operator. The results with decimal/floats may be incorrect._

Possible validation errors: [`number.multiple`](#numbermultiple), [`number.ref`](#numberref)

#### `number.positive()`

Requires the number to be positive.

```js
const schema = Joi.number().positive();
```

Possible validation errors: [`number.positive`](#numberpositive-1)

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

### `object` - inherits from `Any`

Generates a schema object that matches an object data type (as well as JSON strings that parsed into objects). Defaults
to allowing any child key. If the validation `convert` option is on (enabled by default), a string will be converted to
an `object` if specified via `JSON.parse()`.

Supports the same methods of the [`any()`](#any) type.

```js
const object = Joi.object({
    a: Joi.number().min(1).max(10).integer(),
    b: 'some string'
});

await object.validate({ a: 5 });
```

Possible validation errors: [`object.base`](#objectbase)

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

Possible validation errors: [`object.allowUnknown`](#objectallowunknown)

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

await schema.validate(true);  // Throws error
```

When you use `Joi.object([schema])`, it gets compiled the first time, so you can pass it to the `validate()` method multiple times and no overhead is added.

Another benefits of using `Joi.object([schema])` instead of a plain JS object is that you can set any options on the object like allowing unknown keys, e.g:

```js
const schema = Joi.object({
    arg: Joi.string().valid('firstname', 'lastname', 'title', 'company', 'jobtitle'),
    value: Joi.string(),
})
    .pattern(/firstname|lastname/, Joi.string().min(2));
```

##### `Joi.object().keys([schema]) notation`

This is basically the same as `Joi.object([schema])`, but using `Joi.object().keys([schema])` is more useful when you want to add more keys (e.g. call `keys()` multiple times). If you are only adding one set of keys, you can skip the `keys()` method and just use `object()` directly.

Some people like to use `keys()` to make the code more explicit (this is style only).

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

#### `object.min(limit)`

Specifies the minimum number of keys in the object where:
- `limit` - the lowest number of keys allowed or a reference.

```js
const schema = Joi.object().min(2);
```

Possible validation errors: [`object.min`](#objectmin), [`object.ref`](#objectref)

#### `object.max(limit)`

Specifies the maximum number of keys in the object where:
- `limit` - the highest number of object keys allowed or a reference.

```js
const schema = Joi.object().max(10);
```

Possible validation errors: [`object.max`](#objectmax), [`object.ref`](#objectref)

#### `object.length(limit)`

Specifies the exact number of keys in the object where or a reference:
- `limit` - the number of object keys allowed.

```js
const schema = Joi.object().length(5);
```

Possible validation errors: [`object.length`](#objectlength), [`object.ref`](#objectref)

#### `object.pattern(pattern, schema, [options])`

Specify validation rules for unknown keys matching a pattern where:
- `pattern` - a pattern that can be either a regular expression or a **joi** schema that will be
  tested against the unknown key names.
- `schema` - the schema object matching keys must validate against.
- `options` - options settings:
    - `exclusive` - if `true` and the key matches, no other patterns are checked. Defaults to `false`.
    - `matches` - a joi array schema used to validated the array of matching keys. For example,
      `Joi.object().pattern(/\d/, Joi.boolean(), { matches: Joi.array().length(2) })` will require
      two matching keys.

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

#### `object.ref()`

Requires the object to be a **joi** reference.

```js
const schema = Joi.object().ref();
```

Possible validation errors: [`object.refType`](#objectreftype)

#### `object.rename(from, to, [options])`

Renames a key to another name (deletes the renamed key) where:
- `from` - the original key name or a regular expression matching keys.
- `to` - the new key name. `to` can be set to a [`template`](#templatetemplate-options) which is
  rendered at runtime using the current value, global context, and local context if `from` is a
  regular expression (e.g. the expression `/^(\d+)$/` will match any all-digits keys with a capture
  group that is accessible in the template via `{#1}`).
- `options` - an optional object with the following optional keys:
    - `alias` - if `true`, does not delete the old key name, keeping both the new and old keys in place. Defaults to `false`.
    - `multiple` - if `true`, allows renaming multiple keys to the same destination where the last rename wins. Defaults to `false`.
    - `override` - if `true`, allows renaming a key over an existing key. Defaults to `false`.
    - `ignoreUndefined` - if `true`, skip renaming of a key if it's undefined. Defaults to `false`.

Keys are renamed before any other validation rules are applied. If `to` is a template that
references the object own keys (e.g. `'{.prefix}-{#1}'`), the value of these keys is the raw
input value, not the value generated after validation.

```js
const object = Joi.object({
    a: Joi.number()
}).rename('b', 'a');

await object.validate({ b: 5 });
```

Using a regular expression:

```js
const regex = /^foobar$/i;

const schema = Joi.object({
  fooBar: Joi.string()
}).rename(regex, 'fooBar');

await schema.validate({ FooBar: 'a'});
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

const value = await Joi.compile(schema).validate(input);
// value === { x123x: 'x', x1x: 'y', x0x: 'z', x4x: 'test' }
```

Possible validation errors: [`object.rename.multiple`](#objectrenamemultiple), [`object.rename.override`](#objectrenameoverride)

#### `object.assert(ref, schema, [message])`

Verifies an assertion where:
- `ref` - the key name or [reference](#refkey-options).
- `schema` - the validation rules required to satisfy the assertion. If the `schema` includes references, they are resolved against
  the object value, not the value of the `ref` target.
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
}).assert('d.e', Joi.ref('a.c'), 'equal to a.c');
```

Possible validation errors: [`object.assert`](#objectassert)

#### `object.unknown([allow])`

Overrides the handling of unknown keys for the scope of the current object only (does not apply to children) where:
- `allow` - if `false`, unknown keys are not allowed, otherwise unknown keys are ignored.

```js
const schema = Joi.object({ a: Joi.any() }).unknown();
```

Possible validation errors: [`object.allowUnknown`](#objectallowunknown)

#### `object.instance(constructor, [name])`

Requires the object to be an instance of a given constructor where:
- `constructor` - the constructor function that the object must be an instance of.
- `name` - an alternate name to use in validation errors. This is useful when the constructor function does not have a name.

```js
const schema = Joi.object().instance(RegExp);
```

Possible validation errors: [`object.instance`](#objectinstance)

#### `object.schema([type])`

Requires the object to be a **joi** schema instance where:
- `type` - optional **joi** schema to require.

```js
const schema = Joi.object().schema();
```

Possible validation errors: [`object.schema`](#objectschema-1)

### `string` - inherits from `Any`

Generates a schema object that matches a string data type. Note that empty strings are not allowed by default and must
be enabled with `allow('')`. However, if you want to specify a default value in case of empty string you have to use a
different pattern: `Joi.string().empty('').default('default value')`. This tells **joi** that the empty string should be
considered as an empty value (instead of invalid) and which value to use as default.

If the validation `convert` option is on (enabled by default), a string will be converted using the specified modifiers
for `string.lowercase()`, `string.uppercase()`, `string.trim()`, and each replacement specified with `string.replace()`.

Supports the same methods of the [`any()`](#any) type.

```js
const schema = Joi.string().min(1).max(10);
await schema.validate('12345');
```

Possible validation errors: [`string.base`](#stringbase), [`any.empty`](#anyempty)

#### `string.insensitive()`

Allows the value to match any whitelist or blacklist item in a case insensitive comparison.

```js
const schema = Joi.string().valid('a').insensitive();
```

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

Possible validation errors: [`string.creditCard`](#stringcreditcard-1)

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

Possible validation errors: [`string.regex.base`](#stringregexbase), [`string.regex.invert.base`](#stringregexinvertbase), [`string.regex.invert.name`](#stringregexinvertname), [`string.regex.name`](#stringregexname)

#### `string.replace(pattern, replacement)`

Replace characters matching the given _pattern_ with the specified
_replacement_ string where:
- `pattern` - a regular expression object to match against, or a string of which _all_ occurrences will be replaced.
- `replacement` - the string that will replace the pattern.


```js
const schema = Joi.string().replace(/b/gi, 'x');
await schema.validate('abBc');  // return value will be 'axxc'
```

When `pattern` is a _string_ all its occurrences will be replaced.

#### `string.alphanum()`

Requires the string value to only contain a-z, A-Z, and 0-9.

```js
const schema = Joi.string().alphanum();
```

Possible validation errors: [`string.alphanum`](#stringalphanum-1)

#### `string.token()`

Requires the string value to only contain a-z, A-Z, 0-9, and underscore _.

```js
const schema = Joi.string().token();
```

Possible validation errors: [`string.token`](#stringtoken-1)

#### `string.domain([options])`

Requires the string value to be a valid domain name.

- `options` - optional settings:
    - `allowUnicode` - if `true`, Unicode characters are permitted. Defaults to `true`.
    - `minDomainSegments` - Number of segments required for the domain. Defaults to `2`.
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
    - `minDomainSegments` - Number of segments required for the domain. The default setting excludes
      single segment domains such as `example@io` which is a valid email but very uncommon. Defaults
      to `2`.
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

Possible validation errors: [`string.email`](#stringemail)

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

#### `string.guid()` - aliases: `uuid`

Requires the string value to be a valid GUID.

- `options` - optional settings:
    - `version` - Specifies one or more acceptable versions. Can be an Array or String with the following values:
    `uuidv1`, `uuidv2`, `uuidv3`, `uuidv4`, or `uuidv5`. If no `version` is specified then it is assumed to be a generic `guid`
    which will not validate the version or variant of the guid and just check for general structure format.

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

#### `string.hostname()`

Requires the string value to be a valid hostname as per [RFC1123](http://tools.ietf.org/html/rfc1123).

```js
const schema = Joi.string().hostname();
```

Possible validation errors: [`string.hostname`](#stringhostname-1)

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

Possible validation errors: [`string.normalize`](#stringnormalize)

#### `string.lowercase()`

Requires the string value to be all lowercase. If the validation `convert` option is on (enabled by default), the string
will be forced to lowercase.

```js
const schema = Joi.string().lowercase();
```

Possible validation errors: [`string.lowercase`](#stringlowercase-1)

#### `string.uppercase()`

Requires the string value to be all uppercase. If the validation `convert` option is on (enabled by default), the string
will be forced to uppercase.

```js
const schema = Joi.string().uppercase();
```

Possible validation errors: [`string.uppercase`](#stringuppercase-1)

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

### `symbol` - inherits from `Any`

Generates a schema object that matches a `Symbol` data type.

If the validation `convert` option is on (enabled by default), the mappings declared in `map()` will be tried for an eventual match. 

Supports the same methods of the [`any()`](#any) type.

```js
const schema = Joi.symbol().map({ 'foo': Symbol('foo'), 'bar': Symbol('bar') });
await schema.validate('foo');
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

### `alternatives` - inherits from `Any`

Generates a type that will match one of the provided alternative schemas via the [`try()`](#alternativestryschemas)
method. If no schemas are added, the type will not match any value except for `undefined`.

Supports the same methods of the [`any()`](#any) type.

Alternatives can be expressed using the shorter `[]` notation.

```js
const alt = Joi.alternatives().try([Joi.number(), Joi.string()]);
// Same as [Joi.number(), Joi.string()]
```

Possible validation errors: [`alternatives.base`](#alternativesbase), [`alternatives.types`](#alternativestypes), [`alternatives.match`](#alternativesmatch)

#### `alternatives.try(schemas)`

Adds an alternative schema type for attempting to match against the validated value where:
- `schema` - a single or an array of alternative **joi** types.

```js
const alt = Joi.alternatives().try([Joi.number(), Joi.string()]);
await alt.validate('a');
```

#### `alternatives.when(condition, options)`

Adds a conditional alternative schema type, either based on another key (not the same as `any.when()`) value, or a
schema peeking into the current value, where:
- `condition` - the key name or [reference](#refkey-options), or a schema.
- `options` - an object with:
    - `is` - the condition expressed as a **joi** schema. Anything that is not a **joi** schema will be
      converted using [Joi.compile](#compileschema-options).
    - `then` - if the condition is true, the **joi** schema to use.
    - `otherwise` - if the condition is false, the **joi** schema to use.
    - `switch` - an array of `{ is, then }` conditions that are evaluated against the `condition`.
      The last item in the array may also contain `otherwise`.

If `condition` is a reference:
- one of `is` or `switch` is required.
- one of `then`, `otherwise`, or `switch` is required.
- cannot use `is` or `then` with `switch`.
- cannot specify `otherwise` both inside the last `switch` statement and outside.

If `condition` is a schema:
- cannot specify `is` or `switch`.
- one of `then` or `otherwise` is required.

Note that `alternatives.when()` is different than `any.when()`. When you use `any.when()` you end
up with an alternatives type that is based on the base type `when()` was called on. Each `then` or
`otherwise` is a concatenation of the base type with the other schemas. You cannot add additional
conditions to such an alternatives type.

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

### `lazy(fn[, options])` - inherits from `Any`

Generates a placeholder schema for a schema that you would provide where:
- `fn` - is a function returning the actual schema to use for validation.
- `options`:
  - `once` - enables or disables the single evaluation behavior. When `false`, the function will be called every time a validation happens, otherwise the schema will be cached for further re-use. Defaults to `true`.

Supports the same methods of the [`any()`](#any) type.

This is mostly useful for recursive schemas, like :
```js
const Person = Joi.object({
    firstName: Joi.string().required(),
    lastName: Joi.string().required(),
    children: Joi.array().items(Joi.lazy(() => Person).description('Person schema'))
});
```

Possible validation errors: [`lazy.base`](#lazybase), [`lazy.schema`](#lazyschema)

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
        - `key` - key of the value that errored, equivalent to the last element of `details.path`.
        - `label` - label of the value that errored, or the `key` if any, or the default `messages.root`.
        - `value` - the value that failed validation.
        - other error specific properties as described for each error code.
- `annotate()` - function that returns a string with an annotated version of the object pointing at
  the places where errors occurred. Takes an optional parameter that, if truthy, will strip the
  colors out of the output.

### List of errors

<!-- errors -->
#### `alternatives.base`

No alternative was found to test against the input due to try criteria.

#### `alternatives.types`

The provided input did not match any of the allowed types.

Additional local context properties:
```ts
{
    types: Array<string> // The list of expected types
}
```

#### `alternatives.match`

No alternative matched the input due to specific matching rules for at least one of the alternatives.

Additional local context properties:
```ts
{
    details: Array<object>, // An array of details for each error found while trying to match to each of the alternatives
    message: string // The combined error messages
}
```

#### `any.allowOnly`

Only some values were allowed, the input didn't match any of them.

Additional local context properties:
```ts
{
    valids: Array<any> // Contains the list of the valid values that were expected
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

#### `any.empty`

When an empty string is found and denied by invalid values.

Additional local context properties:
```ts
{
    invalids: Array<any> // Contains the list of the invalid values that should be rejected
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

Some values were expected to be present in the array and are missing. This error happens when we have a mix of labelled and unlabelled schemas.

Additional local context properties:
```ts
{
    knownMisses: Array<string>, // Labels of all the missing values
    unknownMisees: number // Count of missing values that didn't have a label
}
```

#### `array.includesRequiredKnowns`

Some values were expected to be present in the array and are missing. This error happens when we only have labelled schemas.

Additional local context properties:
```ts
{
    knownMisses: Array<string> // Labels of all the missing values
}
```

#### `array.includesRequiredUnknowns`

Some values were expected to be present in the array and are missing. This error happens when we only have unlabelled schemas.

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

#### `array.ref`

A reference was used in one of [`array.min()`](#arrayminlimit), [`array.max()`](#arraymaxlimit) or [`array.length()`](#arraylengthlimit) and the value pointed to by that reference in the input is not a valid number for those rules.

Additional local context properties:
```ts
{
    ref: Reference // Reference used
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

The schema on an [`array.has()`](#arrayhas) was not found in the array. This error happens when the schema is labelled.

Additional local context properties:
```ts
{
    patternLabel: string // Label of assertion schema
}
```

#### `array.hasUnknown`

The schema on an [`array.has()`](#arrayhas) was not found in the array. This error happens when the schema is unlabelled.

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

#### `binary.ref`

A reference was used in one of [`binary.min()`](#binaryminlimit), [`binary.max()`](#binarymaxlimit), [`binary.length()`](#binarylengthlimit) and the value pointed to by that reference in the input is not a valid number.

Additional local context properties:
```ts
{
    ref: Reference // Reference used
}
```

#### `boolean.base`

The value is either not a boolean or could not be cast to a boolean from one of the truthy or falsy values.

#### `date.base`

The value is either not a date or could not be cast to a date from a string or a number.

#### `date.greater`

The date is over the limit that you set.

Additional local context properties:
```ts
{
    limit: Date // Maximum date
}
```

#### `date.isoDate`

The date does not match the ISO 8601 format.

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

#### `date.ref`

A reference was used in one of [`date.min()`](#datemindate), [`date.max()`](#datemaxdate), [`date.less()`](#datelessdate) or [`date.greater()`](#dategreaterdate) and the value pointed to by that reference in the input is not a valid date.

Additional local context properties:
```ts
{
    ref: Reference // Reference used
}
```

#### `date.strict`

Occurs when the input is not a Date type and `convert` is disabled.

#### `date.timestamp.javascript`

Failed to be converted from a string or a number to a date as JavaScript timestamp.

#### `date.timestamp.unix`

Failed to be converted from a string or a number to a date as Unix timestamp.

#### `function.arity`

The number of arguments for the function doesn't match the required number.

Additional local context properties:
```ts
{
    n: number // Expected arity
}
```

#### `function.base`

The input is not a function.

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

#### `lazy.base`

The lazy function is not set.

#### `lazy.schema`

The lazy function didn't return a **joi** schema.

Additional local context properties:
```ts
{
    schema: any // The value return by the generator function
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

#### `number.ref`

A reference was used in one of [`number.min()`](#numberminlimit), [`number.max()`](#numbermaxlimit), [`number.less()`](#numberlesslimit), [`number.greater()`](#numbergreaterlimit), or [`number.multiple()`](#numbermultiplebase) and the value pointed to by that reference in the input is not a valid number.

#### `number.unsafe`

The number is not within the safe range of JavaScript numbers.

#### `object.allowUnknown`

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
    ref: string, // Dotted path to the property that was checked
    message: string // Custom message or default one
}
```

#### `object.base`

The value is not of object type or could not be cast to an object from a string.

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

The OR or XOR condition between the properties you specified was not satisfied in that object, none of it were set.

Additional local context properties:
```ts
{
    peers: Array<string>, // List of properties were none of it was set
    peersWithLabels: Array<string> // List of labels for the properties were none of it was set
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
``

#### `object.ref`

A reference was used in one of [`object.min()`](#objectminlimit), [`object.max()`](#objectmaxlimit), [`object.length()`](#objectlengthlimit) and the value pointed to by that reference in the input is not a valid number.

Additional local context properties:
```ts
{
    ref: Reference // Reference used
}
```

#### `object.refType`

The object is not a [`Joi.ref()`](#refkey-options).

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

The string is larger than expected.

Additional local context properties:
```ts
{
    limit: number, // Maximum length that was expected for this string
    encoding: undefined | string // Encoding specified for the check if any
}
```

#### `string.min`

The string is smaller than expected.

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

#### `string.ref`

A reference was used in one of [`string.min()`](#stringminlimit-encoding), [`string.max()`](#stringmaxlimit-encoding) or [`string.length()`](#stringlengthlimit-encoding) and the value pointed to by that reference in the input is not a valid number for those rules.

Additional local context properties:
```ts
{
    ref: Reference // Reference used
}
```

#### `string.regex.base`

The string didn't match the regular expression.

Additional local context properties:
```ts
{
    name: undefined, // Undefined since the regular expression has no name
    pattern: string // Regular expression
}
```

#### `string.regex.name`

The string didn't match the named regular expression.

Additional local context properties:
```ts
{
    name: string, // Name of the regular expression
    pattern: string // Regular expression
}
```

#### `string.regex.invert.base`

The string matched the regular expression while it shouldn't.

Additional local context properties:
```ts
{
    name: undefined, // Undefined since the regular expression has no name
    pattern: string // Regular expression
}
```

#### `string.regex.invert.name`

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

The string contains whitespaces around it.

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

<!-- errorsstop -->
