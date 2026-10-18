# TypeScript Type Inference


Joi includes built-in TypeScript type inference. When you define schemas, Joi automatically infers the corresponding TypeScript types — no manual type definitions or code generation required.

## Table of Contents

- [Extracting Types](#extracting-types)
- [Primitives](#primitives)
- [Objects](#objects)
- [Arrays and Tuples](#arrays-and-tuples)
- [Alternatives](#alternatives)
- [Presence Modifiers](#presence-modifiers)
- [Default Values](#default-values)
- [Stripped and Forbidden Keys](#stripped-and-forbidden-keys)
- [Narrowing with `.valid()`](#narrowing-with-valid)
- [Conditional Schemas (`.when()`)](#conditional-schemas-when)
- [Validation](#validation)
- [Input vs Output Types](#input-vs-output-types)
- [Extending Schemas](#extending-schemas)
- [Known Limitations](#known-limitations)

## Extracting Types


Use the `Joi.InferType` utility to extract the inferred type from any schema:

```typescript
import Joi from 'joi';

const userSchema = Joi.object({
    name: Joi.string().required(),
    email: Joi.string().required(),
    age: Joi.number(),
});

type User = Joi.InferType<typeof userSchema>;
// { name: string; email: string; age?: number | undefined }
```

Three utility types are available:

| Utility | Description |
|---|---|
| `Joi.InferType<T>` | Output type (after validation) |
| `Joi.InferOutput<T>` | Alias for `InferType` |
| `Joi.InferInput<T>` | Input type (before validation) — differs for schemas with `.default()` |

## Primitives


Each schema type infers its corresponding TypeScript type:

```typescript
const str = Joi.string();          // string
const num = Joi.number();          // number
const bool = Joi.boolean();        // boolean
const date = Joi.date();           // Date
const bin = Joi.binary();          // Buffer
const sym = Joi.symbol();          // symbol
const fn = Joi.function();         // Function
```

`Joi.any()` infers as `any`. This is intentional — it acts as an escape hatch when you need to opt out of type checking.

## Objects


### Defining shapes with `Joi.object()`

Pass a schema map to `Joi.object()` and each key is inferred:

```typescript
const schema = Joi.object({
    name: Joi.string().required(),
    email: Joi.string().required(),
    age: Joi.number(),
    active: Joi.boolean(),
});

type Result = Joi.InferType<typeof schema>;
// {
//     name: string;
//     email: string;
//     age?: number | undefined;
//     active?: boolean | undefined;
// }
```

Keys without `.required()` or `.default()` are optional and include `| undefined`.

### Adding keys with `.keys()` and `.append()`

Both methods merge new keys into the existing shape:

```typescript
const base = Joi.object({
    id: Joi.number().required(),
});

const extended = base.keys({
    name: Joi.string().required(),
    role: Joi.string(),
});

type Extended = Joi.InferType<typeof extended>;
// { id: number; name: string; role?: string | undefined }
```

`.append()` works identically:

```typescript
const withEmail = base.append({
    email: Joi.string().required(),
});
```

When keys overlap, the new definition takes precedence.

### Concatenating object schemas

`.concat()` merges two object schemas:

```typescript
const addressSchema = Joi.object({
    street: Joi.string().required(),
    city: Joi.string().required(),
});

const fullSchema = base.concat(addressSchema);
type Full = Joi.InferType<typeof fullSchema>;
// { id: number; street: string; city: string }
```

### Explicit generics

You can pass an explicit generic to `Joi.object<T>()`. This disables shape-based inference — the type is whatever you provide:

```typescript
interface User {
    name: string;
    email: string;
}

const schema = Joi.object<User>();
type Result = Joi.InferType<typeof schema>; // User
```

### Unknown keys

`.unknown(true)` adds an index signature without affecting known keys:

```typescript
const schema = Joi.object({
    name: Joi.string().required(),
}).unknown(true);

type Result = Joi.InferType<typeof schema>;
// { name: string; [key: string]: any }
```

## Arrays and Tuples


### Typed arrays with `.items()`

```typescript
const strings = Joi.array().items(Joi.string());
type Strings = Joi.InferType<typeof strings>; // string[]

const mixed = Joi.array().items(Joi.string(), Joi.number());
type Mixed = Joi.InferType<typeof mixed>; // (string | number)[]
```

### Tuples with `.ordered()`

```typescript
const tuple = Joi.array().ordered(Joi.string(), Joi.number(), Joi.boolean());
type Tuple = Joi.InferType<typeof tuple>; // [string, number, boolean]
```

### Sparse arrays

`.sparse()` adds `undefined` to the element type:

```typescript
const sparse = Joi.array().items(Joi.string()).sparse();
type Sparse = Joi.InferType<typeof sparse>; // (string | undefined)[]
```

## Alternatives


`Joi.alternatives().try()` produces a union type:

```typescript
const schema = Joi.alternatives().try(
    Joi.string(),
    Joi.number(),
    Joi.boolean(),
);

type Result = Joi.InferType<typeof schema>; // string | number | boolean
```

## Presence Modifiers


Presence modifiers control whether a key is required, optional, or excluded:

```typescript
const schema = Joi.object({
    required: Joi.string().required(),  // string (always present)
    optional: Joi.string().optional(),  // string | undefined (may be absent)
    bare: Joi.string(),                 // string | undefined (optional by default)
    forbidden: Joi.string().forbidden(), // excluded from type entirely
});

type Result = Joi.InferType<typeof schema>;
// { required: string; optional?: string | undefined; bare?: string | undefined }
// Note: 'forbidden' key does not appear in the type
```

`.exist()` is an alias for `.required()`.

## Default Values


`.default()` makes the key always present in the output type (since validation fills in the default):

```typescript
const schema = Joi.object({
    role: Joi.string().default('user'),
    name: Joi.string().required(),
});

type Output = Joi.InferType<typeof schema>;
// { role: string; name: string }
// 'role' is required in output — default fills it in

type Input = Joi.InferInput<typeof schema>;
// { name: string; role?: string | undefined }
// 'role' is optional in input — you don't have to provide it
```

This is where `InferInput` and `InferOutput` differ. Use `InferInput` when typing function parameters that accept unvalidated data. Use `InferOutput` (or `InferType`) for the validated result.

`.failover()` behaves the same as `.default()` for type inference purposes.

## Stripped and Forbidden Keys


`.strip()` and `.forbidden()` remove keys from the inferred output type:

```typescript
const schema = Joi.object({
    password: Joi.string().required(),
    confirmPassword: Joi.string().strip(),
});

type Result = Joi.InferType<typeof schema>;
// { password: string }
// 'confirmPassword' does not appear
```

## Narrowing with `.valid()`


`.valid()` narrows the type to specific literal values:

```typescript
const status = Joi.string().valid('active', 'inactive');
type Status = Joi.InferType<typeof status>; // 'active' | 'inactive'
```

## Conditional Schemas (`.when()`)


`.when()` produces a union of the `then` and `otherwise` branch types:

```typescript
const schema = Joi.object({
    type: Joi.string().valid('email', 'sms').required(),
    value: Joi.any().when('type', {
        is: 'email',
        then: Joi.string().required(),
        otherwise: Joi.number().required(),
    }),
});
```

When both `then` and `otherwise` are specified with concrete types, the value key infers as `string | number`.

## Validation


### `.validate()`

Returns a `ValidationResult` with the inferred type on `.value`:

```typescript
const schema = Joi.object({
    name: Joi.string().required(),
    age: Joi.number(),
});

const result = schema.validate(input);
if (!result.error) {
    result.value; // { name: string; age?: number | undefined }
}
```

### `Joi.attempt()`

Returns the validated value directly with the inferred type:

```typescript
const value = Joi.attempt(input, schema);
// value: { name: string; age?: number | undefined }
```

### `Joi.assert()`

Narrows the type of the input variable via TypeScript's `asserts` mechanism:

```typescript
const data: unknown = getInput();
Joi.assert(data, schema);
// data is now: { name: string; age?: number | undefined }
```

## Extending Schemas


### `.alter()` and `.tailor()`

`.alter()` defines named alteration targets. `.tailor()` applies them. Both preserve the schema type:

```typescript
const userSchema = Joi.object({
    name: Joi.string().required(),
    email: Joi.string().required(),
    age: Joi.number(),
}).alter({
    create: (s) => s.required(),
    list: (s) => s.optional(),
});

const createSchema = userSchema.tailor('create');
type CreateUser = Joi.InferType<typeof createSchema>;
// { name: string; email: string; age?: number | undefined }
```

> **Note:** `.tailor()` preserves the *base* schema type. The runtime alterations (e.g., making fields required or optional) are applied at runtime but cannot be reflected in the compile-time type, since the alteration target is a runtime string. See [Known Limitations](#known-limitations).

### `Joi.link()`

`Joi.link()` references another schema in the tree. Pass a type parameter for the linked type:

```typescript
const node = Joi.object({
    value: Joi.number().required(),
    children: Joi.array().items(Joi.link<typeof node>('#node')),
}).id('node');
```

### `Joi.extend()`

Extensions return `any` by default. Provide a type parameter to retain type safety:

```typescript
const customJoi = Joi.extend<typeof Joi>((joi) => ({
    type: 'myType',
    base: joi.string(),
}));
```

## Known Limitations


### `.when()` with `Joi.any()` branches

When a `.when()` branch uses `Joi.any()`, the resulting union collapses to `any` because `string | any = any` in TypeScript. Use concrete types in both branches for proper inference:

```typescript
// Collapses to any
Joi.any().when('x', { then: Joi.string(), otherwise: Joi.any() });

// Preserves the union
Joi.any().when('x', { then: Joi.string(), otherwise: Joi.number() });
```

### `.tailor()` runtime transformations

`.tailor()` preserves the schema's compile-time type but cannot reflect the runtime alterations applied by the target function. The actual runtime behavior may differ from the inferred type (e.g., a field may become required at runtime but remain optional in the type).

### `Joi.link()` requires explicit type

`Joi.link()` cannot automatically resolve the linked schema's type at compile time. Pass a type parameter: `Joi.link<typeof otherSchema>(ref)`.

### `Joi.extend()` returns `any`

Without a type parameter, `Joi.extend()` returns a root object typed as `any`. Always provide `Joi.extend<typeof Joi>(...)` to preserve method types.
