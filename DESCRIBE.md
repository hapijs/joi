<!-- version -->

# 15.0.0 API Reference: Describe

<!-- versionstop -->

<!-- toc -->

- [describe(schema)](#describeschema)
  - [`any`](#any)
    - [`any.allow(value).describe()`](#anyallowvalue)
    - [`any.valid(value).describe()`](#anyvalidvalue)
    - [`any.invalid(value).describe()`](#anyinvalidvalue)
    - [`any.required().describe()`](#anyrequired)
    - [`any.optional().describe()`](#anyoptional)
    - [`any.forbidden().describe()`](#anyforbidden)
    - [`any.strip().describe()`](#anystrip)
    - [`any.description(desc).describe()`](#anydescriptiondesc)
    - [`any.notes(notes).describe()`](#anynotesnotes)
    - [`any.tags(tags).describe()`](#anytagstags)
    - [`any.meta(meta).describe()`](#anymetameta)
    - [`any.example(...values).describe()`](#anyexamplevalues)
    - [`any.unit(name).describe()`](#anyunitname)
    - [`any.options(options).describe()`](#anyoptionsoptions)
    - [`any.strict(isStrict).describe()`](#anystrictisstrict)
    - [`any.default([value, [description]]).describe()`](#anydefaultvalue-description)
    - [`any.concat(schema).describe()`](#anyconcatschema)
    - [`any.when(condition, options).describe()`](#anywhencondition-options)
    - [`any.label(name).describe()`](#anylabelname)
    - [`any.raw(isRaw).describe()`](#anyrawisraw)
    - [`any.empty(schema).describe()`](#anyemptyschema)
    - [`any.error(err, [options]).describe()`](#anyerrorerr-options)

<!-- tocstop -->

## describe(schema)

Returns an object that represents the internal configuration of a **joi** schema. Useful for debugging and exposing a schema's configuration to other systems, like valid values in a user interface.

- `schema` - the schema to describe.

```js
const schema = Joi.any().valid(["foo", "bar"]);

console.log(Joi.describe(schema));
```

Results in:

```
{ type: 'any',
  flags: { allowOnly: true },
  valids: [ 'foo', 'bar' ] }
```

### `any`

[`any`](API.md#any)

#### `any.allow(value).describe()`

[`any.allow(value)`](API.md#anyallowvalue)

```js
const schema = Joi.any().allow("a");

console.log(Joi.describe(schema));
```

Results in:

```
{ type: 'any', valids: [ 'a' ] }
```

#### `any.valid(value).describe()`

[`any.valid(value)` - aliases: `only`, `equal`](API.md#anyvalidvalue---aliases-only-equal)

```js
const schema = Joi.any().valid("a");

console.log(Joi.describe(schema));
```

Results in:

```
{ type: 'any', flags: { allowOnly: true }, valids: [ 'a' ] }
```

#### `any.invalid(value).describe()`

[`any.invalid(value)` - aliases: `disallow`, `not`](API.md#anyinvalidvalue---aliases-disallow-not)

```js
const schema = Joi.any().invalid("a");

console.log(Joi.describe(schema));
```

Results in:

```
{ type: 'any', invalids: [ 'a' ] }
```

#### `any.required().describe()`

[`any.required()` - aliases: `exist`](API.md#anyrequired---aliases-exist)

```js
const schema = Joi.any().required();

console.log(Joi.describe(schema));
```

Results in:

```
{ type: 'any', flags: { presence: 'required' } }
```

#### `any.optional().describe()`

[`any.optional()`](API.md#anyoptional)

```js
const schema = Joi.any().optional();

console.log(Joi.describe(schema));
```

Results in:

```
{ type: 'any', flags: { presence: 'optional' } }
```

#### `any.forbidden().describe()`

[`any.forbidden()`](API.md#anyforbidden)

```js
const schema = Joi.any().forbidden();

console.log(Joi.describe(schema));
```

Results in:

```
{ type: 'any', flags: { presence: 'forbidden' } }
```

#### `any.strip().describe()`

[`any.strip()`](API.md#anystrip)

```js
const schema = Joi.array().items(Joi.string(), Joi.any().strip());

console.log(Joi.describe(schema));
```

Results in:

```
{ type: 'array',
  flags: { sparse: false },
  items:
   [ { type: 'string', invalids: [Array] },
     { type: 'any', flags: [Object] } ] }
```

#### `any.description(desc).describe()`

[`any.description(desc)`](API.md#anydescriptiondesc)

```js
const schema = Joi.any().description(
  "this key will match anything you give it"
);

console.log(Joi.describe(schema));
```

Results in:

```
{ type: 'any',
  description: 'this key will match anything you give it' }
```

#### `any.notes(notes).describe()`

[`any.notes(notes)`](API.md#anynotesnotes)

```js
const schema = Joi.any().notes(["this is special", "this is important"]);

console.log(Joi.describe(schema));
```

#### `any.tags(tags).describe()`

[`any.tags(tags)`](API.md#anytagstags)

```js
const schema = Joi.any().tags(["api", "user"]);

console.log(Joi.describe(schema));
```

Results in:

```
{ type: 'any', tags: [ 'api', 'user' ] }
```

#### `any.meta(meta).describe()`

[`any.meta(meta)`](API.md#anymetameta)

```js
const schema = Joi.any().meta({ index: true });

console.log(Joi.describe(schema));
```

Results in:

```
{ type: 'any', meta: [ { index: true } ] }
```

#### `any.example(...values).describe()`

[`any.example(...values)`](API.md#anyexamplevalues)

```js
const schema = Joi.string()
  .min(4)
  .example("abcd");

console.log(Joi.describe(schema));
```

Results in:

```
{ type: 'string',
  examples: [ { value: 'abcd' } ],
  invalids: [ '' ],
  rules: [ { name: 'min', arg: 4 } ] }
```

#### `any.unit(name).describe()`

[`any.unit(name)`](API.md#anyunitname)

```js
const schema = Joi.number().unit("milliseconds");

console.log(Joi.describe(schema));
```

Results in:

```
{ type: 'number',
  flags: { unsafe: false },
  unit: 'milliseconds',
  invalids: [ Infinity, -Infinity ] }
```

#### `any.options(options).describe()`

[`any.options(options)`](API.md#anyoptionsoptions)

```js
const schema = Joi.any().options({ convert: false });

console.log(Joi.describe(schema));
```

Results in:

```
{ type: 'any', options: { convert: false } }
```

#### `any.strict(isStrict).describe()`

[`any.strict(isStrict)`](API.md#anystrictisstrict)

```js
const schema = Joi.any().strict();

console.log(Joi.describe(schema));
```

Results in:

```
{ type: 'any', options: { convert: false } }
```

#### `any.default([value, [description]]).describe()`

[`any.default([value, [description]])`](API.md#anydefaultvalue-description)

```js
const generateUsername = context => {
  return context.firstname.toLowerCase() + "-" + context.lastname.toLowerCase();
};

generateUsername.description = "generated username";

const schema = Joi.string().default(generateUsername);

console.log(Joi.describe(schema));
```

Results in:

```
{ type: 'string',
  flags:
   { default: { description: 'generated username', function: [Object] } },
  invalids: [ '' ] }
```

#### `any.concat(schema).describe()`

[`any.concat(schema)`](API.md#anyconcatschema)

```js
const schema = Joi.string()
  .valid("a")
  .concat(Joi.string().valid("b"));

console.log(Joi.describe(schema));
```

Results in:

```
{ type: 'string',
  flags: { allowOnly: true },
  valids: [ 'a', 'b' ],
  invalids: [ '' ] }
```

#### `any.when(condition, options).describe()`

[`any.when(condition, options)`](API.md#anywhencondition-options)

```js
const schema = Joi.any()
  .valid("x")
  .when("b", {
    is: Joi.exist(),
    then: Joi.valid("y"),
    otherwise: Joi.valid("z")
  });

console.log(Joi.describe(schema));
```

Results in:

```
{ type: 'alternatives',
  flags: { presence: 'ignore' },
  base: { type: 'any', flags: { allowOnly: true }, valids: [ 'x' ] },
  alternatives:
   [ { ref: 'ref:b',
       is: [Object],
       then: [Object],
       otherwise: [Object] } ] }
```

#### `any.label(name).describe()`

[`any.label(name)`](API.md#anylabelname)

```js
const schema = Joi.string().label("First Name");

console.log(Joi.describe(schema));
```

Results in:

```
{ type: 'string',
  flags: {},
  invalids: [ '' ],
  label: 'First Name' }
```

#### `any.raw(isRaw).describe()`

[`any.raw(isRaw)`](API.md#anyrawisraw)

```js
const schema = Joi.date()
  .timestamp()
  .raw();

console.log(Joi.describe(schema));
```

Results in:

```
{ type: 'date',
  flags: { timestamp: 'javascript', multiplier: 1, raw: true } }
```

#### `any.empty(schema).describe()`

[`any.empty(schema)`](API.md#anyemptyschema)

```js
const schema = Joi.string().empty("");

console.log(Joi.describe(schema));
```

Results in:

```
{
    type: 'string',
    flags: {
        empty: {
            type: 'string',
            flags: {
                allowOnly: true
            },
            valids: [ ]
        }
    },
    invalids: [ '' ]
}
```

#### `any.error(err, [options]).describe()`

[`any.error(err, [options])`](API.md#anyerrorerr-options)

```js
const schema = Joi.number()
  .min(0)
  .error(errors => {
    return {
      template: "contains {{errors}} errors, here is the list : {{codes}}",
      context: {
        errors: errors.length,
        codes: errors.map(err => err.type)
      }
    };
  });

console.log(Joi.describe(schema));
```

Results in:

```
{ type: 'number',
  flags: { unsafe: false, error: [Function] },
  invalids: [ Infinity, -Infinity ],
  rules: [ { name: 'min', arg: 0 } ] }
```

<!-- errorsstop -->
