<a href="http://hapijs.com"><img src="https://raw.githubusercontent.com/hapijs/assets/master/images/family.png" width="180px" align="right" /></a>

# joi

Object schema description language and validator for JavaScript objects.

  [![NPM Version][npm-image]][npm-url]
  [![NPM Downloads][downloads-image]][downloads-url]
  [![Linux Build][travis-image]][travis-url]
  [![Known Vulnerabilities][snyk-image]][snyk-url]

[npm-image]: https://img.shields.io/npm/v/@hapi/joi.svg
[npm-url]: https://npmjs.org/package/@hapi/joi
[downloads-image]: https://img.shields.io/npm/dm/@hapi/joi.svg
[downloads-url]: https://npmjs.org/package/@hapi/joi
[travis-image]: https://img.shields.io/travis/hapijs/joi/master.svg
[travis-url]: https://travis-ci.org/hapijs/joi
[snyk-image]: https://snyk.io/test/github/hapijs/joi/badge.svg
[snyk-url]: https://snyk.io/test/github/hapijs/joi

## Introduction

Imagine you run facebook and you want visitors to sign up on the website with real names and not
something like `l337_p@nda` in the first name field. How would you define the limitations of what
can be inputted and validate it against the set rules?

This is joi, joi allows you to create *blueprints* or *schemas* for JavaScript objects (an object
that stores information) to ensure *validation* of key information.

## API

See the detailed [API Reference](https://hapi.dev/family/joi/).

## Example

```js
const Joi = require('@hapi/joi');

const schema = Joi.object().keys({
    username: Joi.string().alphanum().min(3).max(30).required(),
    password: Joi.string().regex(/^[a-zA-Z0-9]{3,30}$/),
    access_token: [Joi.string(), Joi.number()],
    birthyear: Joi.number().integer().min(1900).max(2013),
    email: Joi.string().email({ minDomainSegments: 2 })
}).with('username', 'birthyear').without('password', 'access_token');

// Return result.
const result = schema.validate({ username: 'abc', birthyear: 1994 });
// result.error === null -> valid

// You can also pass a callback which will be called synchronously with the validation result.
schema.validate({ username: 'abc', birthyear: 1994 }, function (err, value) { });  // err === null -> valid

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
    * must have two domain parts e.g. `example.com`

## Usage

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

// or

schema.validate({ a: 'a string' }, function (error, value) { });
```

If the input is valid, then the `error` will be `null`. If the input is invalid, `error` is assigned
a [`ValidationError`](https://github.com/hapijs/joi/blob/master/API.md#validationerror) object
providing more information.

The schema can be a plain JavaScript object where every key is assigned a **joi** type, or it can be a **joi** type directly:

```js
const schema = Joi.string().min(10);
```

If the schema is a **joi** type, the `schema.validate(value, callback)` can be called directly on the type. When passing a non-type schema object,
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

## Browsers

Joi doesn't directly support browsers, but you could use [joi-browser](https://github.com/jeffbski/joi-browser) for an ES5 build of Joi that works in browsers, or as a source of inspiration for your own builds.
