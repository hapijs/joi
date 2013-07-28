<a href="https://github.com/spumko"><img src="https://raw.github.com/spumko/spumko/master/images/from.png" align="right" /></a>
![joi Logo](https://raw.github.com/spumko/joi/master/images/joi.png)

Object schema validation

[![Build Status](https://secure.travis-ci.org/spumko/joi.png)](http://travis-ci.org/spumko/joi)


# Table of Contents

<img src="https://raw.github.com/spumko/joi/master/images/validation.png" align="right" />
* [Introduction](#introduction "Introduction")
* [Type Registry](#type-registry "Type Registry")
* [Constraints](#constraints "Constraints")
  * [BaseType](#basetype "BaseType")
  * [String](#string "String")
  * [Number](#number "Number")
  * [Boolean](#boolean "Boolean")
  * [Array](#array "Array")
  * [Object](#object "Object")
  * [Function](#function "Function")
  * [Any](#any "Any")
* [Usage](#usage "Usage")
  * [Config Syntax](#config-syntax "Config Syntax")
  * [Evaluation Order](#evaluation-order "Evaluation Order")
* [Special Options](#special-options "Special Options")
* [Security Considerations](#security-considerations "Security Considerations")
* [Examples](#examples "Examples")
* [References](#references "References")
  * [Reference A: Other Types](#reference-a-other-types "Reference A: Other Types")


# Introduction

The **joi** validation system is used to validate JavaScript objects based on a rich descriptive schema.
Schema validation is the process of ensuring that objects match pre-defined expectations.

For example, the following schema:
```javascript
var Joi = require('joi');

var schema = {
    username: Joi.types.String().alphanum().min(3).max(30).with('birthyear').required(),
    password: Joi.types.String().regex(/[a-zA-Z0-9]{3,30}/).without('access_token'),
    access_token: Joi.types.String(),
    birthyear: Joi.types.Number().min(1850).max(2012),
    email: Joi.types.String().email()
};
```

defines these constraints:
* 'username'
    * a required string
    * must contain only alphanumeric characters
    * at least 3 chars long but no more than 30
    * must be accompanied by 'birthyear' (logical AND)
* 'password'
    * an optional string
    * must satisfy the custom regex
    * cannot appear together with 'access_token'
* 'access_token'
    * an optional, unconstrained string
* 'birthyear'
    * an integer between 1850 and 2012
* 'email'
    * a valid email address string

The above constraints point out some non-obvious features:
* Keys are optional by default
* Strings are by default utf-8 encoded
* relationships are defined in an additive fashion
    * "X.join(Y), Y.join(Z)" is the same as requiring all three to be present: "X AND Y AND Z"
    * Likewise "X.xor(Y), Y.xor(Z)" => requires that only one of three be present: "X XOR Y XOR Z"
* .regex may or may not override other string-related constraints (.alphanum, .min, .max)
    ** constraints are evaluated in order
* order of chained functions matter
    ** ".min(0).max(100).min(1)" sets the min to 1, overwriting the result of the first min call
    ** if ".regex(/[a-z]{0,3}/)" and ".max(50)" both supplied, only the overlap is valid (length 3 or less = valid)

Below is an example of how to validate an object against the above schema:

```javascript
var err = Joi.validate(obj, schema);
// err will be set if the object failed to validate against the schema
```

# Type Registry

The Types object is pre-populated with a mutable list of JavaScript's valid data types. However, for convenience, the registry also includes subset helpers with common constraints already applied. For a list of helpers see the following sections...

* [String](#string "String")
* [Number](#number "Number")
* [Boolean](#boolean "Boolean")
* [Array](#array "Array")
* [Object](#object "Object")
* [Function](#function "Function")
* [Any](#any "Any")

Any custom, user-defined data type is derived from one of the base types (although it may also combine additional types for sub-elements). Thus, there are two valid ways of creating your own types.

The first method is to add the type directly to the Type Registry. This makes the new type explicitly available as a base Type.

```javascript
var IntDef = _.extends({}, Number, function () {

    // Constructor
    return this.integer();
});

Types.set("Int", IntDef);
var Int = Types.Int;
```

The second, simpler, and more acceptable method is to alias the new Type within the config file.

```javascript
var PositiveInt = Number().integer().min(0)
PositiveInt.max(999999);
```

Thus, subsequent calls to the new "type" will behave as fully registered types in much less code.

*Note: The first method may eventually be deprecated. Then, the Type Registry becomes non-mutable which simplies the logic significantly.*

*Note: See "Reference A" before suggesting a pre-included Type for the Type Registry.*


## Constraints

Constraints are functions that restrict the input value in some way.

By default, all without explicit constraints, Types are optional.

### Implementation

```javascript
var schema = {
    username: Joi.types.String().min(6).max(30).allow('admin').deny('Administrator'),
};
```

The above example demonstrates that even though the username has a minimum length of 6, extra constraints can be appended that allow 'admin' to be used as a username. Likewise, even though 'Administrator' would be allowed by the other constraints, it is explicitly denied by the _'deny'_ constraint.

### By Type

#### BaseType

All types inherit the following builtin constraints:

##### BaseType.required()

Specifies that the input may not be undefined (unspecified).

##### BaseType.allow(value)

Specifies that the input may equal this value.  This is type specific, so you cannot allow a number on a string type and vice-versa.

This function is idempotent.

*Note: This function does not verify that value is the correct type.*

##### BaseType.deny(value)

Specifies that the input may NOT equal this value.

This function is idempotent.

*Note: This function does not verify that value is the correct type.*

##### Basetype.valid(a1[, a2, ...])

Specifies an arbitrary number of valid values for this input.

If no inputs are supplied, it returns an Error.

If one or more of inputs given do not match the basic type, an Error is raised.

##### Basetype.invalid(a1[, a2, ...])

Specifies an arbitrary number of invalid values for this input.

If no inputs are supplied, it returns an Error.

If one or more of inputs given do not match the basic type, an Error is raised.

##### BaseType.with(a1[, a2, ...])

Specifies an arbitrary number of inputs that must also be supplied (a1..an) with this input.

*Note: This may or may not have aliases in the final version (.join, .with, .and... etc)*

##### BaseType.without(a1[, a2, ...])

Specifies an arbitrary number of inputs that cannot exist alongside this input (logical XOR).

*Note: This may or may not have aliases in the final version (.disjoin, .without, .xor... etc)*

##### BaseType.nullOk()

Specifies that the value is allowed to be null.

##### BaseType.rename(to[, options])

Specifies a key to rename the current parameter to.

Options take the form of an object with the follow default values:

```javascript
{
    deleteOrig: false,
    allowMult: false,
    allowOverwrite: false
}
```

The option "deleteOrig" specifies whether or not to delete the original key of the param (effectively a permanent "move").

The option "allowMult" specifies whether or not multiple parameters can be renamed to a single key.

The option "allowOverwrite" specifies whether or not the rename function can overwrite existing keys.


#### String

Strings, by default, match JavaScript Strings. They are typically unbounded in length unless limited by interpreter. They are encoded in UTF-8 (this is true in Node.js at least). They may contain any allowable characters in the specified encoding.

The Type Registry's implementation of String also includes some builtin constraints:

##### String.emptyOk()

Specifies that the input may be equal to '' (the empty string).

##### String.min(n)

Specifies a minimum length for this input string, inclusive.

If n is not specified, it returns an Error.

If n is not a non-negative integer, it returns an Error.

##### String.max(n)

Specifies a maximum length for this input string, inclusive.

If n is not specified, it returns an Error.

If n is not a positive integer, it returns an Error.

##### String.alphanum()

Specifies that this input may only consist of alphanumeric characters.

##### String.regex(pattern)

Specifies that this input matches the given RegExp pattern.

If pattern is not specified, it returns an Error.

If pattern is not a valid RegExp object, it returns an error.

##### String.email()

Specifies that this input is a valid email string.

##### String.date()

Specifies that this input is a valid Date string (locale string but also accepts unix timestamp in milliseconds).

##### String.encoding(enc)

Specifies an explicit encoding for this input string.

*Warning: This may or may not be included in the final version. A better solution may be to forcibly convert from the encoding specified by enc to utf-8. However, this is not always possible (i.e. UTF-16 converting to UTF-8 would truncate a lot of characters).*


#### Number

##### Number.integer()

Specifies that this input be a valid integer.

##### Number.float()

Specifies that this input be a valid float or double.

##### Number.min(n)

Specifies a minimum value for this input, inclusive.

If n is not specified, it returns an Error.

If n is not an integer, it returns an Error.

##### Number.max(n)

Specifies a maximum value for this input, inclusive.

If n is not specified, it returns an Error.

If n is not an integer, it returns an Error.


#### Boolean

Boolean values accept a case-insensitive string parameter. If the value is "true", true is returned. Otherwise, false is returned.

*Note: Boolean has no special methods other than those inherited from BaseType*


#### Array

**Note**
Array values take the querystring form of
```
?cars=1&cars=2
```
and get converted to
```
{ cars: [ '1', '2' ] }
```
by the server.

*Note: Array has no special methods other than those inherited from BaseType*


##### Array.includes(n1, n2, ...)

Specifies allowed types for the array value to include. The values of n1, n2, ... are Type Registry constraints (usually of other types).

##### Array.excludes(n1, n2, ...)

Specifies allowed types for the array value to exclude. The values of n1, n2, ... are Type Registry constraints (usually of other types).


#### Object

##### Object.allowOtherKeys()

Will cause any unknown keys in the object being validated to not cause the object to be invalid.


#### Function

Function types accept any value that is a function.

*Note: Function has no special methods other than those inherited from BaseType*


#### Any

Accept any type of value where the value is not null.  By default the value must not be null but is allowed to be undefined.  To change this behavior use either the _'required'_ or _'nullOk'_ methods.

*Note: Any has no special methods other than those inherited from BaseType*

## Usage

### Config Syntax

In Hapi's routes configuration array, the routes are listed as JavaScript objects. Route objects may include an optional "query" key, the value of which should be an object. This object should associate querystring input names to validation constraints.

```javascript
var queryObj = {
  input_name: constraints
};
```

In the above code example, "input_name" must conform to typical JavaScript object key constraints (no spaces, no quotes unless escaped and surrounded by quotes, etc).

In place of "constraints", there should be a combination of constraints. The combination of constraints must be formed starting from a valid base type. The base type may be followed by zero or more pre-defined constraint functions chained consecutively. These combinations can be pre-combined into "alias" variables that may also be followed by zero or more pre-defined constraint functions chained consecutively. An example is shown below:

```javascript
Base().constraint_one().constraint_two()...

BaseAlias = Base().constraint()
BaseAlias.constraint_one().constraint_two()...
```

Constraint functions may accept optional and arbitrary parameters.

Every call must have its own `Base()` prefix. This creates a new validation object. Otherwise, it will retain settings from any prior constraints.

### Evaluation Order

#### Overrides

Each constraint is evaluated independantly and in order of chaining. In some cases, a subsequent constraint may override a prior constraint:

```javascript
String.required().optional() # This input will be considered optional
String.required(false).required() # This input will be considered required
```

Constraints that can override modify the query validation state upon the function's evocation. The actual evaluation is performed at the end of the chain (or once the entire querystring validation is finished).

These constraint functions are special cases:
* required/optional
* with/without
* rename

Rename is always performed at the end of the chain.


###### With/Without

Below is an example of a schema that is likely to be used for defining a username/password constraint.  Notice that _'with'_ is used on the _'username'_ to indicate that _'password'_ is required to appear whenever _'username'_ exists.  Similarly, _'password'_ has a constraint indicating that the key _'access_token'_ must not exist when _'password'_ exists.

```javascript
username: Joi.types.String().with('password'),
password: Joi.types.String().without('access_token')
```

#### Overrules

Yet, in another case, a prior constraint may overrule a subsequent constraint:

```javascript
Types.String().max(5).max(10) # This input cannot be larger than 5 characters
Types.String().max(3).regex(/.{0,5}/) # This input cannot be larger than 3 characters
```

This should apply to all other constraints that do not override.



## Special Options

Joi has special settings that will modify certain behaviors.

### Global

#### Custom Messages

Joi error messages can be updated and replaced with localized versions.  Use the `languagePath` option to specify a file path to a JSON file that contains error messages.  Each message supports a mustache style template with the following keys:

 - `{{key}}` - the schema property that fails validation
 - `{{value}}` - the invalid value assigned to the key


#### Skip Functions

On occasion, an object must be validated which contains functions as properties. To force Joi to ignore validation on such functions, use the `skipFunctions` option:

    Joi.settings.skipFunctions = true;


#### Save Conversions

Through the process of validation, some inputs will be converted to accommodate the various constraint functions. For example, if an input is of type Joi.Types.Number() but is defined as a string, the validator will convert to Number during validation. This does not persist and does not affect the original input.

To force Joi to save the conversion, use the `saveConversions` option:

    Joi.settings.saveConversions = true;


#### Skip Conversions

By default Joi tries to parse and convert object's values into correct type. You might want to disable this behaviour e.g. when you are validating program's internal objects instead of user input.

To force Joi to not convert object values, use the `skipConversions` option:

    Joi.settings.skipConversions = true;


### Type-Specific

#### Short Circuit Breakout

When validating an input for a specific type with lots of constraints, Joi will, by default, return error immediately upon the first error condition. In some rare cases, iterating through all of the constraint functions is actually ideal (to identify all the reasons why an input is invalid at once). To force Joi to evaluate all constraints, use the `shortCircuit` option:

    var S = Joi.Types.String();
    S.options.shortCircuit = false;
    var schema = {
      nickname: S().valid('Silly').min(2)
    }
    schema.nickname.validate('o', null, null, errors) // => populates errors with all failing constraints
    
    // alternative way
    var input = { amount: 2.5 };
    var schema = { amount: T.Number().integer().min(3).max(5).noShortCircuit() };
    
    Joi.validate(input, schema);


#### Non-Exclusive Valid

The `.valid` constraint is currently exclusive - if the input is NOT one of the values passed to `.valid`, the validator returns false. In the event this is too strict, use the hidden `__allowOnly` option.

    var S = Joi.Types.String();
    S.__allowOnly = false;
    var schema = {
      username: S().valid('walmart')
    }
    schema.username.validate('test') // => this returns true



## Security Considerations

Encodings could potentially play a role in security - some strings in one encoding, when exec()'d in another encoding could execute malicious code. If this type of validation is enabled, it will likely provide little to no explicit protection for developers. Developers could unintentionally (and even worse, unknowingly) expose a significant security risk.

## Examples

### Validating username and password

```javascript
var Joi = require('joi');

var schema = {
    username: Joi.types.String().alphanum().min(3).max(30).required(),
    password: Joi.types.String().regex(/[a-zA-Z0-9]{3,30}/).required(),
};

var invalidObj = { username: 'roger' };
var validObj = { username: 'roger', password: 'pa55word' };

var err = Joi.validate(invalidObj, schema);
if (err) throw err;

var err = Joi.validate(validObj, schema);
if (err) throw err;
```

Executing the above code outputs the following:
```
Error: [ValidationError]: the value of `password` is not allowed to be undefined
```

### Validating a number

```javascript
var Joi = require('joi');

var schema = {
    num: Joi.types.Number().required()
};

var obj = { num: '1' };

var err = Joi.validate(obj, schema);
if (err) throw err;
else console.log('Success!');
```

Executing the above code outputs the following:
```
Success!
```

## References
### Reference A: Other Types

#### "null"

The "null" variable is considered to be of type "object". An alias could easily be added for this type if necessary. However, for the purposes of querystring validation, this appears to be unnecessary.

#### "undefined"

Unlike null, undefined is its own type with its own special properties. For the purposes of querystring validation, any blank or indefinite inputs will appear as blank strings (""). As far as I know, there is no way to force the undefined object into the querystring. Thus, unless otherwise proven, "undefined" will not be included in the Type Registry.
