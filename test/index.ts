import * as Lab from '@hapi/lab';
import * as Joi from '..';
import { StandardSchemaV1 } from "@standard-schema/spec";

const { expect } = Lab.types;

type IsNull<T> = [T] extends [null] ? true : false;
type IsAny<T> = 0 extends 1 & NoInfer<T> ? true : false;
type IsUnknown<T> = unknown extends T // `T` can be `unknown` or `any`
  ? IsNull<T> extends false // `any` can be `null`, but `unknown` can't be
    ? true
    : false
  : false;

// The following was copied (almost) as-is from:
// https://github.com/DefinitelyTyped/DefinitelyTyped/tree/master/types/hapi__joi

// --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- ---

const x: any = null;
declare const value: any;
const num = 0;
const str = 'test';
const bool: boolean = true;
const buf: Buffer = Buffer.alloc(0);
const exp: RegExp = /./;
const obj: object = {};
const date: Date = new Date();
const err: Error = new Error('test');
const func: () => void = () => {
};
const symbol = Symbol('test');

const numArr: number[] = [1, 2, 3];
const strArr: string[] = ['a', 'b', 'c'];
const expArr: RegExp[] = [/a/, /b/];

// --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- ---

let schema: Joi.Schema = Joi.any();
const schemaLike: Joi.SchemaLike = true;

let anySchema: Joi.AnySchema = Joi.any();
let numSchema: Joi.NumberSchema = Joi.number();
let strSchema: Joi.StringSchema = Joi.string();
let arrSchema: Joi.ArraySchema = Joi.array();
let boolSchema: Joi.BooleanSchema = Joi.boolean();
let binSchema: Joi.BinarySchema = Joi.binary();
let dateSchema: Joi.DateSchema = Joi.date();
let funcSchema: Joi.FunctionSchema = Joi.func();
let objSchema: Joi.ObjectSchema = Joi.object();

const schemaArr: Joi.Schema[] = [Joi.string(), Joi.number()];

let ref: Joi.Reference = Joi.ref('test');
let description: Joi.Description = {};

// --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- ---

let validOpts: Joi.ValidationOptions = {};

validOpts = { abortEarly: bool };
validOpts = { convert: bool };
validOpts = { allowUnknown: bool };
validOpts = { skipFunctions: bool };
validOpts = { stripUnknown: bool };
validOpts = { stripUnknown: { arrays: bool } };
validOpts = { stripUnknown: { objects: bool } };
validOpts = { stripUnknown: { arrays: bool, objects: bool } };
validOpts = { presence: 'optional' };
validOpts = { presence: 'required' };
validOpts = { presence: 'forbidden' };
validOpts = { context: obj };
validOpts = { noDefaults: bool };
validOpts = {
  abortEarly: true,
  messages: {
    'any.ref': str,
    'string.email': str,
  },
  dateFormat: 'iso',
};
// Test various permutations of string, `false`, or `undefined` for both parameters:
validOpts = { errors: { wrap: { label: str, array: '[]' } } };
validOpts = { errors: { wrap: { label: false, array: false } } };
validOpts = { errors: { wrap: { label: str } } };
validOpts = { errors: { wrap: { array: '[]' } } };

// --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- ---

let renOpts: Joi.RenameOptions = {};

renOpts = { alias: bool };
renOpts = { multiple: bool };
renOpts = { override: bool };
renOpts = { ignoreUndefined: bool };

// --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- ---

let emailOpts: Joi.EmailOptions = {};

emailOpts = { allowFullyQualified: bool };
emailOpts = { allowUnicode: bool };
emailOpts = { tlds: { allow: strArr } };
emailOpts = { minDomainSegments: 2 };
emailOpts = { tlds: false };

// --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- ---

let domainOpts: Joi.DomainOptions = {};

domainOpts = { allowFullyQualified: bool };
domainOpts = { allowUnicode: bool };
domainOpts = { tlds: { allow: strArr } };
domainOpts = { minDomainSegments: 2 };

// --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- ---

let hexOpts: Joi.HexOptions = {};

hexOpts = { byteAligned: bool };

// --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- ---

let ipOpts: Joi.IpOptions = {};

ipOpts = { version: str };
ipOpts = { version: strArr };
ipOpts = { cidr: 'forbidden' };

// --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- ---

let uriOpts: Joi.UriOptions = {};

uriOpts = { scheme: str };
uriOpts = { scheme: exp };
uriOpts = { scheme: strArr };
uriOpts = { scheme: expArr };
uriOpts = { domain: domainOpts };

// --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- ---

let base64Opts: Joi.Base64Options = {};

base64Opts = { paddingRequired: bool };

// --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- ---

let dataUriOpts: Joi.DataUriOptions = {};

dataUriOpts = { paddingRequired: bool };

// --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- ---

let whenOpts: Joi.WhenOptions = {
  is: Joi.any(),
};

whenOpts = { is: x };
whenOpts = { is: schema, then: schema };
whenOpts = { is: schema, otherwise: schema };
whenOpts = { is: schemaLike, then: schemaLike, otherwise: schemaLike };
whenOpts = { not: schema, then: schema };
whenOpts = { not: schema, otherwise: schema };
whenOpts = { not: schemaLike, then: schemaLike, otherwise: schemaLike };

// --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- ---

let whenSchemaOpts: Joi.WhenSchemaOptions = {};

whenSchemaOpts = { then: schema };
whenSchemaOpts = { otherwise: schema };
whenSchemaOpts = { then: schemaLike, otherwise: schemaLike };

// --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- ---

let refOpts: Joi.ReferenceOptions = {};

refOpts = { separator: str };
refOpts = { prefix: { local: str } };

// --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- ---

let stringRegexOpts: Joi.StringRegexOptions = {};

stringRegexOpts = { name: str };
stringRegexOpts = { invert: bool };

// --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- ---

const validErr = new Joi.ValidationError('message', [], 'original');
let validErrItem: Joi.ValidationErrorItem;
let validErrFunc: Joi.ValidationErrorFunction;

validErrItem = {
  message: str,
  type: str,
  path: [str],
};

validErrItem = {
  message: str,
  type: str,
  path: [str],
  context: obj,
};

validErrItem = {
  message: str,
  type: str,
  path: [str, num, str],
  context: obj,
};

validErrFunc = (errs) => errs[0] ? errs[0] : [];
validErrFunc = (errs) => 'Some error';
validErrFunc = (errs) => err;

// error() can take function with ErrorReport argument
validErrFunc = (errors) => {
  const path: string | undefined = errors[0]?.path[0];
  const code: string | undefined = errors[0]?.code;
  const messages = errors[0]?.prefs.messages;

  const message: string = messages && code && messages[code]?.rendered || 'Error';

  const validationErr = new Error();
  validationErr.message = `[${path}]: ${message}`;
  return validationErr;
};

Joi.any().error(validErrFunc);

Joi.isError(validErr);

const maybeValidErr: any = new Joi.ValidationError('message', [], 'original');

if (Joi.isError(maybeValidErr)) {
  // isError is a type guard that allows accessing these properties:
  maybeValidErr.isJoi;
}

// --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- ---

schema = anySchema;
schema = numSchema;
schema = strSchema;
schema = arrSchema;
schema = boolSchema;
schema = binSchema;
schema = dateSchema;
schema = funcSchema;
schema = objSchema;

anySchema = anySchema;
anySchema = numSchema;
anySchema = strSchema;
anySchema = arrSchema;
anySchema = boolSchema;
anySchema = binSchema;
anySchema = dateSchema;
anySchema = funcSchema;
anySchema = objSchema;

// --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- ---

let schemaMap: Joi.SchemaMap = {};

schemaMap = {
  a: numSchema,
  b: strSchema,
};
schemaMap = {
  a: numSchema,
  b: {
    b1: strSchema,
    b2: anySchema,
  },
};
schemaMap = {
  a: numSchema,
  b: [{ b1: strSchema }, { b2: anySchema }],
  c: arrSchema,
  d: schemaLike,
};
schemaMap = {
  a: 1,
  b: {
    b1: '1',
    b2: 2,
  },
  c: [{ c1: true }, { c2: null }],
};

// --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- ---

anySchema = Joi.any();

{
  // common
  anySchema = anySchema.allow(x);
  anySchema = anySchema.allow(x, x);
  anySchema = anySchema.allow(...[x, x, x]);
  anySchema = anySchema.valid(x, 'x');
  anySchema = anySchema.valid(x, x);
  anySchema = anySchema.valid(...[x, x, x]);
  anySchema = anySchema.only();
  anySchema = anySchema.equal(x);
  anySchema = anySchema.equal(x, x);
  anySchema = anySchema.equal(...[x, x, x]);
  anySchema = anySchema.invalid(x);
  anySchema = anySchema.invalid(x, x);
  anySchema = anySchema.invalid(...[x, x, x]);
  anySchema = anySchema.disallow(x);
  anySchema = anySchema.disallow(x, x);
  anySchema = anySchema.disallow(...[x, x, x]);
  anySchema = anySchema.not(x);
  anySchema = anySchema.not(x, x);
  anySchema = anySchema.not(...[x, x, x]);

  anySchema = Joi.object().default();
  anySchema = anySchema.default(x);
  anySchema = anySchema.default('string');
  anySchema = anySchema.default(3.14);
  anySchema = anySchema.default(true);
  anySchema = anySchema.default({ foo: 'bar' });
  anySchema = anySchema.default((parent, helpers) => {
    return helpers.state;
  });

  anySchema = anySchema.required();
  anySchema = anySchema.optional();
  anySchema = anySchema.forbidden();
  anySchema = anySchema.strip();

  anySchema = anySchema.description(str);
  anySchema = anySchema.note(str);
  anySchema = anySchema.note(str).note(str);
  anySchema = anySchema.tag(str);
  anySchema = anySchema.tag(str).tag(str);

  anySchema = anySchema.meta(obj);
  anySchema = anySchema.example(obj);
  anySchema = anySchema.unit(str);

  anySchema = anySchema.preferences(validOpts);
  anySchema = anySchema.strict();
  anySchema = anySchema.strict(bool);
  anySchema = anySchema.concat(Joi.object({ x: Joi.any() }));

  anySchema = anySchema.when(str, whenOpts);
  anySchema = anySchema.when(ref, whenOpts);
  anySchema = anySchema.when(schema, whenSchemaOpts);

  anySchema = anySchema.label(str);
  anySchema = anySchema.raw();
  anySchema = anySchema.raw(bool);
  anySchema = anySchema.empty();
  anySchema = anySchema.empty(str);
  anySchema = anySchema.empty(anySchema);

  anySchema = anySchema.error(err);
  anySchema = anySchema.error(validErrFunc);
}

// --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- ---

arrSchema = Joi.array();

arrSchema = arrSchema.has(Joi.any());
arrSchema = arrSchema.sparse();
arrSchema = arrSchema.sparse(bool);
arrSchema = arrSchema.single();
arrSchema = arrSchema.single(bool);
arrSchema = Joi.array().sort();
arrSchema = arrSchema.sort({ order: 'descending' });
arrSchema = arrSchema.sort({ by: 'n' });
arrSchema = arrSchema.sort({ by: Joi.ref('.x') });
arrSchema = arrSchema.sort();
arrSchema = arrSchema.ordered(anySchema);
arrSchema = arrSchema.ordered(
  anySchema,
  numSchema,
  strSchema,
  arrSchema,
  boolSchema,
  binSchema,
  dateSchema,
  funcSchema,
  objSchema,
  schemaLike
);
arrSchema = arrSchema.ordered(schemaMap);
expect.error(arrSchema.ordered([schemaMap, schemaMap, schemaLike]));
arrSchema = arrSchema.min(num);
arrSchema = arrSchema.max(num);
arrSchema = arrSchema.length(num);
arrSchema = arrSchema.length(ref);
arrSchema = arrSchema.unique();
arrSchema = arrSchema.unique((a, b) => a.test === b.test);
arrSchema = arrSchema.unique('customer.id');

arrSchema = arrSchema.items(numSchema);
arrSchema = arrSchema.items(numSchema, strSchema, schemaLike);
expect.error(arrSchema.items([numSchema, strSchema, schemaLike]));
arrSchema = arrSchema.items(schemaMap);
arrSchema = arrSchema.items(schemaMap, schemaMap, schemaLike);
expect.error(arrSchema.items([schemaMap, schemaMap, schemaLike]));
let value1 = Joi.array().items(Joi.string(), Joi.boolean(), Joi.number(), Joi.object({key: Joi.string()}));
expect.type<Joi.ArraySchema<(string | number | boolean | {key?: string})[]>>(value1)

const arr1 = Joi.array().items(Joi.boolean());
expect.type<Joi.ArraySchema<boolean[]>>(arr1);
const arr2 = Joi.array().items(Joi.boolean());
expect.type<Joi.ArraySchema<boolean[]>>(arr2);
const arr3 = Joi.array().items(Joi.number());
expect.type<Joi.ArraySchema<number[]>>(arr3);
const arr4 = Joi.array().items(Joi.array().items(Joi.number()));
expect.type<Joi.ArraySchema<number[][]>>(arr4);
const arr5 = Joi.array().items(Joi.number(), Joi.string());
expect.type<Joi.ArraySchema<(number | string)[]>>(arr5);
const arr6 = Joi.array().items(Joi.number(), Joi.string(), Joi.boolean());
expect.type<Joi.ArraySchema<(number | string | boolean)[]>>(arr6);
const arr7 = Joi.array().items(process.env.NODE_ENV ? Joi.string() : Joi.number());
expect.type<Joi.ArraySchema<(string | number)[]>>(arr7);
const arr8 = Joi.array().items(process.env.NODE_ENV ? Joi.string() : Joi.number(), process.env.NODE_ENV ? Joi.boolean() : Joi.date());
expect.type<Joi.ArraySchema<(string | number | boolean | Date)[]>>(arr8);
const arr9 = Joi.array().items(
  Joi.binary(),
  Joi.boolean(),
  Joi.date(),
  Joi.function(),
  Joi.number(),
  Joi.object<Record<string,string>>(),
  Joi.string(),
);
expect.type<Joi.ArraySchema<(Buffer | boolean | Date | Function | number | Record<string, string> | string)[]>>(arr9);

// Negative tests for array.items() — prove item types are actually inferred, not any
{
  const strArr = Joi.array().items(Joi.string());
  type StrArrType = Joi.InferType<typeof strArr>;
  expect.error<string>({} as StrArrType);

  const numArr = Joi.array().items(Joi.number());
  type NumArrType = Joi.InferType<typeof numArr>;
  expect.error<string>({} as NumArrType);

  const unionArr = Joi.array().items(Joi.string(), Joi.number());
  type UnionArrType = Joi.InferType<typeof unionArr>;
  expect.error<boolean>({} as UnionArrType);
}

// - - - - - - - -

{
  // common copy paste
  // use search & replace from any
  arrSchema = arrSchema.allow(x);
  arrSchema = arrSchema.allow(x, x);
  arrSchema = arrSchema.allow(...[x, x, x]);
  arrSchema = arrSchema.valid(x);
  arrSchema = arrSchema.valid(x, x);
  arrSchema = arrSchema.valid(...[x, x, x]);
  arrSchema = arrSchema.only();
  arrSchema = arrSchema.equal(x);
  arrSchema = arrSchema.equal(x, x);
  arrSchema = arrSchema.equal(...[x, x, x]);
  arrSchema = Joi.array().invalid(x);
  arrSchema = arrSchema.invalid(x, x);
  arrSchema = arrSchema.invalid(...[x, x, x]);
  arrSchema = arrSchema.disallow(x);
  arrSchema = arrSchema.disallow(x, x);
  arrSchema = arrSchema.disallow(...[x, x, x]);
  arrSchema = arrSchema.not(x);
  arrSchema = arrSchema.not(x, x);
  arrSchema = arrSchema.not(...[x, x, x]);

  arrSchema = arrSchema.default(x);

  arrSchema = arrSchema.required();
  arrSchema = arrSchema.optional();
  arrSchema = arrSchema.forbidden();

  arrSchema = arrSchema.description(str);
  arrSchema = arrSchema.note(str);
  arrSchema = arrSchema.note(str).note(str);
  arrSchema = arrSchema.tag(str);
  arrSchema = arrSchema.tag(str).tag(str);

  arrSchema = arrSchema.meta(obj);
  arrSchema = arrSchema.example(obj);
  arrSchema = arrSchema.unit(str);

  arrSchema = arrSchema.preferences(validOpts);
  arrSchema = arrSchema.strict();
  arrSchema = arrSchema.concat(Joi.array());

  arrSchema = arrSchema.when(str, whenOpts);
  arrSchema = arrSchema.when(ref, whenOpts);
  arrSchema = arrSchema.when(schema, whenSchemaOpts);
}

// --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- ---

boolSchema = Joi.bool();
boolSchema = Joi.boolean();

{
  // common copy paste
  boolSchema = boolSchema.allow(x);
  boolSchema = boolSchema.allow(x, x);
  boolSchema = boolSchema.allow(...[x, x, x]);
  boolSchema = boolSchema.valid(x);
  boolSchema = boolSchema.valid(x, x);
  boolSchema = boolSchema.valid(...[x, x, x]);
  boolSchema = boolSchema.only();
  boolSchema = boolSchema.equal(x);
  boolSchema = boolSchema.equal(x, x);
  boolSchema = boolSchema.equal(...[x, x, x]);
  boolSchema = Joi.boolean().invalid(x);
  boolSchema = boolSchema.invalid(x, x);
  boolSchema = boolSchema.invalid(...[x, x, x]);
  boolSchema = boolSchema.disallow(x);
  boolSchema = boolSchema.disallow(x, x);
  boolSchema = boolSchema.disallow(...[x, x, x]);
  boolSchema = boolSchema.not(x);
  boolSchema = boolSchema.not(x, x);
  boolSchema = boolSchema.not(...[x, x, x]);

  boolSchema = boolSchema.default(x);

  boolSchema = boolSchema.required();
  boolSchema = boolSchema.optional();
  boolSchema = boolSchema.forbidden();

  boolSchema = boolSchema.description(str);
  boolSchema = boolSchema.note(str);
  boolSchema = boolSchema.note(str).note(str);
  boolSchema = boolSchema.tag(str);
  boolSchema = boolSchema.tag(str).tag(str);

  boolSchema = boolSchema.meta(obj);
  boolSchema = boolSchema.example(obj);
  boolSchema = boolSchema.unit(str);

  boolSchema = boolSchema.preferences(validOpts);
  boolSchema = boolSchema.strict();
  boolSchema = boolSchema.concat(Joi.boolean());

  boolSchema = boolSchema.truthy(str);
  boolSchema = boolSchema.truthy(num);
  boolSchema = boolSchema.truthy(str, str);
  boolSchema = boolSchema.truthy(num, num);
  boolSchema = boolSchema.falsy(str);
  boolSchema = boolSchema.falsy(num);
  boolSchema = boolSchema.falsy(str, str);
  boolSchema = boolSchema.falsy(num, num);
  boolSchema = boolSchema.sensitive(bool);

  boolSchema = boolSchema.when(str, whenOpts);
  boolSchema = boolSchema.when(ref, whenOpts);
  boolSchema = boolSchema.when(schema, whenSchemaOpts);
}

// --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- ---

binSchema = Joi.binary();

binSchema = binSchema.encoding('hex');
binSchema = binSchema.min(num);
binSchema = binSchema.max(num);
binSchema = binSchema.length(num);

{
  // common
  binSchema = binSchema.allow(x);
  binSchema = binSchema.allow(x, x);
  binSchema = binSchema.allow(...[x, x, x]);
  binSchema = binSchema.valid(x);
  binSchema = binSchema.valid(x, x);
  binSchema = binSchema.valid(...[x, x, x]);
  binSchema = binSchema.only();
  binSchema = binSchema.equal(x);
  binSchema = binSchema.equal(x, x);
  binSchema = binSchema.equal(...[x, x, x]);
  binSchema = Joi.binary().invalid(x);
  binSchema = binSchema.invalid(x, x);
  binSchema = binSchema.invalid(...[x, x, x]);
  binSchema = binSchema.disallow(x);
  binSchema = binSchema.disallow(x, x);
  binSchema = binSchema.disallow(...[x, x, x]);
  binSchema = binSchema.not(x);
  binSchema = binSchema.not(x, x);
  binSchema = binSchema.not(...[x, x, x]);

  binSchema = binSchema.default(x);

  binSchema = binSchema.required();
  binSchema = binSchema.optional();
  binSchema = binSchema.forbidden();

  binSchema = binSchema.description(str);
  binSchema = binSchema.note(str);
  binSchema = binSchema.note(str).note(str);
  binSchema = binSchema.tag(str);
  binSchema = binSchema.tag(str).tag(str);

  binSchema = binSchema.meta(obj);
  binSchema = binSchema.example(obj);
  binSchema = binSchema.unit(str);

  binSchema = binSchema.preferences(validOpts);
  binSchema = binSchema.strict();
  binSchema = binSchema.concat(Joi.binary());

  binSchema = binSchema.when(str, whenOpts);
  binSchema = binSchema.when(ref, whenOpts);
  binSchema = binSchema.when(schema, whenSchemaOpts);
}

// --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- ---

dateSchema = Joi.date();

dateSchema = dateSchema.greater('now');
dateSchema = dateSchema.less('now');
dateSchema = dateSchema.min('now');
dateSchema = dateSchema.max('now');

dateSchema = dateSchema.greater(date);
dateSchema = dateSchema.less(date);
dateSchema = dateSchema.min(date);
dateSchema = dateSchema.max(date);

const dateString: string = date.toDateString();
dateSchema = dateSchema.greater(dateString);
dateSchema = dateSchema.less(dateString);
dateSchema = dateSchema.min(dateString);
dateSchema = dateSchema.max(dateString);

dateSchema = dateSchema.greater(num);
dateSchema = dateSchema.less(num);
dateSchema = dateSchema.min(num);
dateSchema = dateSchema.max(num);

dateSchema = dateSchema.greater(ref);
dateSchema = dateSchema.less(ref);
dateSchema = dateSchema.min(ref);
dateSchema = dateSchema.max(ref);

dateSchema = dateSchema.iso();

dateSchema = dateSchema.timestamp();
dateSchema = dateSchema.timestamp('javascript');
dateSchema = dateSchema.timestamp('unix');

{
  // common
  dateSchema = dateSchema.allow(x);
  dateSchema = dateSchema.allow(x, x);
  dateSchema = dateSchema.allow(...[x, x, x]);
  dateSchema = dateSchema.valid(x);
  dateSchema = dateSchema.valid(x, x);
  dateSchema = dateSchema.valid(...[x, x, x]);
  dateSchema = dateSchema.only();
  dateSchema = dateSchema.equal(x);
  dateSchema = dateSchema.equal(x, x);
  dateSchema = dateSchema.equal(...[x, x, x]);
  dateSchema = Joi.date().invalid(x);
  dateSchema = dateSchema.invalid(x, x);
  dateSchema = dateSchema.invalid(...[x, x, x]);
  dateSchema = dateSchema.disallow(x);
  dateSchema = dateSchema.disallow(x, x);
  dateSchema = dateSchema.disallow(...[x, x, x]);
  dateSchema = dateSchema.not(x);
  dateSchema = dateSchema.not(x, x);
  dateSchema = dateSchema.not(...[x, x, x]);

  dateSchema = dateSchema.default(x);

  dateSchema = dateSchema.required();
  dateSchema = dateSchema.optional();
  dateSchema = dateSchema.forbidden();

  dateSchema = dateSchema.description(str);
  dateSchema = dateSchema.note(str);
  dateSchema = dateSchema.note(str).note(str);
  dateSchema = dateSchema.tag(str);
  dateSchema = dateSchema.tag(str).tag(str);

  dateSchema = dateSchema.meta(obj);
  dateSchema = dateSchema.example(obj);
  dateSchema = dateSchema.unit(str);

  dateSchema = dateSchema.preferences(validOpts);
  dateSchema = dateSchema.strict();
  dateSchema = dateSchema.concat(Joi.date());

  dateSchema = dateSchema.when(str, whenOpts);
  dateSchema = dateSchema.when(ref, whenOpts);
  dateSchema = dateSchema.when(schema, whenSchemaOpts);
}

// --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- ---

funcSchema = Joi.func();
funcSchema = Joi.function();

funcSchema = funcSchema.arity(5);
funcSchema = funcSchema.minArity(6);
funcSchema = funcSchema.maxArity(7);

// --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- ---

numSchema = Joi.number();

numSchema = numSchema.min(num);
numSchema = numSchema.min(ref);
numSchema = numSchema.max(num);
numSchema = numSchema.max(ref);
numSchema = numSchema.greater(num);
numSchema = numSchema.greater(ref);
numSchema = numSchema.less(num);
numSchema = numSchema.less(ref);
numSchema = numSchema.integer();
numSchema = numSchema.unsafe();
numSchema = numSchema.precision(num);
numSchema = numSchema.multiple(4);
numSchema = numSchema.positive();
numSchema = numSchema.negative();
numSchema = numSchema.port();

{
  // common
  numSchema = numSchema.allow(x);
  numSchema = numSchema.allow(x, x);
  numSchema = numSchema.allow(...[x, x, x]);
  numSchema = numSchema.valid(x);
  numSchema = numSchema.valid(x, x);
  numSchema = numSchema.valid(...[x, x, x]);
  numSchema = numSchema.only();
  numSchema = numSchema.equal(x);
  numSchema = numSchema.equal(x, x);
  numSchema = numSchema.equal(...[x, x, x]);
  numSchema = Joi.number().invalid(x);
  numSchema = numSchema.invalid(x, x);
  numSchema = numSchema.invalid(...[x, x, x]);
  numSchema = numSchema.disallow(x);
  numSchema = numSchema.disallow(x, x);
  numSchema = numSchema.disallow(...[x, x, x]);
  numSchema = numSchema.not(x);
  numSchema = numSchema.not(x, x);
  numSchema = numSchema.not(...[x, x, x]);

  numSchema = numSchema.default(x);

  numSchema = numSchema.required();
  numSchema = numSchema.optional();
  numSchema = numSchema.forbidden();

  numSchema = numSchema.description(str);
  numSchema = numSchema.note(str);
  numSchema = numSchema.note(str).note(str);
  numSchema = numSchema.tag(str);
  numSchema = numSchema.tag(str).tag(str);

  numSchema = numSchema.meta(obj);
  numSchema = numSchema.example(obj);
  numSchema = numSchema.unit(str);

  numSchema = numSchema.preferences(validOpts);
  numSchema = numSchema.strict();
  numSchema = numSchema.concat(Joi.number());

  numSchema = numSchema.when(str, whenOpts);
  numSchema = numSchema.when(ref, whenOpts);
  numSchema = numSchema.when(schema, whenSchemaOpts);
}

// --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- ---

objSchema = Joi.object();
objSchema = Joi.object(schemaMap);

objSchema = objSchema.keys();
objSchema = objSchema.keys(schemaMap);

objSchema = objSchema.append();
objSchema = objSchema.append(schemaMap);

objSchema = objSchema.min(num);
objSchema = objSchema.max(num);
objSchema = objSchema.length(num);

objSchema = objSchema.pattern(exp, schema);
objSchema = objSchema.pattern(exp, schemaLike);

objSchema = objSchema.and(str);
objSchema = objSchema.and(str, str);
objSchema = objSchema.and(str, str, { separator: ',' });

objSchema = objSchema.nand(str);
objSchema = objSchema.nand(str, str);
objSchema = objSchema.nand(str, str, { separator: ',' });

objSchema = objSchema.schema();

objSchema = objSchema.or(str);
objSchema = objSchema.or(str, str);
objSchema = objSchema.or(str, str, { separator: ',' });

objSchema = objSchema.oxor(str);
objSchema = objSchema.oxor(str, str);
objSchema = objSchema.oxor(str, str, { separator: ',' });

objSchema = objSchema.xor(str);
objSchema = objSchema.xor(str, str);
objSchema = objSchema.xor(str, str, { separator: ',' });

objSchema = objSchema.with(str, str);
objSchema = objSchema.with(str, strArr);

objSchema = objSchema.without(str, str);
objSchema = objSchema.without(str, strArr);

objSchema = objSchema.rename(str, 'test2');
objSchema = objSchema.rename(exp, str);
objSchema = objSchema.rename('test1', 'test2', renOpts);

objSchema = objSchema.assert(str, schema);
objSchema = objSchema.assert(str, schema, str);
objSchema = objSchema.assert(ref, schema);
objSchema = objSchema.assert(ref, schema, str);

objSchema = objSchema.unknown();
objSchema = objSchema.unknown(bool);

objSchema = objSchema.instance(func);
objSchema = objSchema.instance(func, str);

objSchema = objSchema.ref();

objSchema = objSchema.regex();

{
  // common
  objSchema = objSchema.allow(x);
  objSchema = objSchema.allow(x, x);
  objSchema = objSchema.allow(...[x, x, x]);
  objSchema = objSchema.valid(x);
  objSchema = objSchema.valid(x, x);
  objSchema = objSchema.valid(...[x, x, x]);
  objSchema = objSchema.only();
  objSchema = objSchema.equal(x);
  objSchema = objSchema.equal(x, x);
  objSchema = objSchema.equal(...[x, x, x]);
  objSchema = Joi.object().invalid(x);
  objSchema = objSchema.invalid(x, x);
  objSchema = objSchema.invalid(...[x, x, x]);
  objSchema = objSchema.disallow(x);
  objSchema = objSchema.disallow(x, x);
  objSchema = objSchema.disallow(...[x, x, x]);
  objSchema = objSchema.not(x);
  objSchema = objSchema.not(x, x);
  objSchema = objSchema.not(...[x, x, x]);

  objSchema = objSchema.default(x);

  objSchema = objSchema.required();
  objSchema = objSchema.optional();
  objSchema = objSchema.forbidden();

  objSchema = objSchema.description(str);
  objSchema = objSchema.note(str);
  objSchema = objSchema.note(str).note(str);
  objSchema = objSchema.tag(str);
  objSchema = objSchema.tag(str).tag(str);

  objSchema = objSchema.meta(obj);
  objSchema = objSchema.example(obj);
  objSchema = objSchema.unit(str);

  objSchema = objSchema.preferences(validOpts);
  objSchema = objSchema.strict();
  objSchema = objSchema.concat(Joi.object());

  objSchema = objSchema.when(str, whenOpts);
  objSchema = objSchema.when(ref, whenOpts);
  objSchema = objSchema.when(schema, whenSchemaOpts);
}

// --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- ---

strSchema = Joi.string();

strSchema = strSchema.insensitive();
strSchema = strSchema.min(num);
strSchema = strSchema.min(num, 'base64');
strSchema = strSchema.min(ref);
strSchema = strSchema.min(ref, 'base64');
strSchema = strSchema.max(num);
strSchema = strSchema.max(num, 'base64');
strSchema = strSchema.max(ref);
strSchema = strSchema.max(ref, 'base64');
strSchema = strSchema.creditCard();
strSchema = strSchema.length(num);
strSchema = strSchema.length(num, 'base64');
strSchema = strSchema.length(ref);
strSchema = strSchema.length(ref, 'base64');
strSchema = strSchema.pattern(exp);
strSchema = strSchema.pattern(exp, str);
strSchema = strSchema.pattern(exp, stringRegexOpts);
strSchema = strSchema.regex(exp);
strSchema = strSchema.regex(exp, str);
strSchema = strSchema.regex(exp, stringRegexOpts);
strSchema = strSchema.replace(exp, str);
strSchema = strSchema.replace(str, str);
strSchema = strSchema.alphanum();
strSchema = strSchema.token();
strSchema = strSchema.email();
strSchema = strSchema.email(emailOpts);
strSchema = strSchema.domain();
strSchema = strSchema.domain(domainOpts);
strSchema = strSchema.ip();
strSchema = strSchema.ip(ipOpts);
strSchema = strSchema.uri();
strSchema = strSchema.uri(uriOpts);
strSchema = strSchema.guid();
strSchema = strSchema.guid({
  version: ['uuidv1', 'uuidv2', 'uuidv3', 'uuidv4', 'uuidv5', 'uuidv6', 'uuidv7', 'uuidv8'],
});
strSchema = strSchema.guid({ version: 'uuidv4' });
strSchema = strSchema.uuid();
strSchema = strSchema.uuid({
  version: ['uuidv1', 'uuidv2', 'uuidv3', 'uuidv4', 'uuidv5', 'uuidv6', 'uuidv7', 'uuidv8'],
});
strSchema = strSchema.uuid({ version: 'uuidv4' });
strSchema = strSchema.hex();
strSchema = strSchema.hex(hexOpts);
strSchema = strSchema.hostname();
strSchema = strSchema.isoDate();
strSchema = strSchema.lowercase();
strSchema = strSchema.uppercase();
strSchema = strSchema.trim();
strSchema = strSchema.truncate();
strSchema = strSchema.truncate(false);
strSchema = strSchema.normalize();
strSchema = strSchema.normalize('NFKC');
strSchema = strSchema.base64();
strSchema = strSchema.base64(base64Opts);
strSchema = strSchema.dataUri();
strSchema = strSchema.dataUri(dataUriOpts);

{
  // common
  strSchema = strSchema.allow(x);
  strSchema = strSchema.allow(x, x);
  strSchema = strSchema.allow(...[x, x, x]);
  strSchema = strSchema.valid(x);
  strSchema = strSchema.valid(x, x);
  strSchema = strSchema.valid(...[x, x, x]);
  strSchema = strSchema.only();
  strSchema = strSchema.equal(x);
  strSchema = strSchema.equal(x, x);
  strSchema = strSchema.equal(...[x, x, x]);
  strSchema = Joi.string().invalid(x);
  strSchema = strSchema.invalid(x, x);
  strSchema = strSchema.invalid(...[x, x, x]);
  strSchema = strSchema.disallow(x);
  strSchema = strSchema.disallow(x, x);
  strSchema = strSchema.disallow(...[x, x, x]);
  strSchema = strSchema.not(x);
  strSchema = strSchema.not(x, x);
  strSchema = strSchema.not(...[x, x, x]);

  strSchema = strSchema.default(x);

  strSchema = strSchema.required();
  strSchema = strSchema.optional();
  strSchema = strSchema.forbidden();

  strSchema = strSchema.description(str);
  strSchema = strSchema.note(str);
  strSchema = strSchema.note(str).note(str);
  strSchema = strSchema.tag(str);
  strSchema = strSchema.tag(str).tag(str);

  strSchema = strSchema.meta(obj);
  strSchema = strSchema.example(obj);
  strSchema = strSchema.unit(str);

  strSchema = strSchema.preferences(validOpts);
  strSchema = strSchema.strict();
  strSchema = strSchema.concat(Joi.string());

  strSchema = strSchema.when(str, whenOpts);
  strSchema = strSchema.when(ref, whenOpts);
  strSchema = strSchema.when(schema, whenSchemaOpts);
}

// --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- ---

{
  const custom: Joi.CustomValidator<number> = (value, helpers) => {
    expect.type<number>(value);
    expect.type<Joi.Schema>(helpers.schema);
    expect.type<Joi.State>(helpers.state);
    expect.type<Joi.ValidationOptions>(helpers.prefs);
    expect.type<number>(helpers.original);
    expect.type<Function>(helpers.warn);
    expect.type<Function>(helpers.error);
    expect.type<Function>(helpers.message);
    return 1;
  };
}

{
  const external: Joi.ExternalValidationFunction<number> = (value, helpers) => {
    expect.type<number>(value);
    expect.type<Joi.Schema>(helpers.schema);
    expect.type<Joi.Schema | null>(helpers.linked);
    expect.type<Joi.State>(helpers.state);
    expect.type<Joi.ValidationOptions>(helpers.prefs);
    expect.type<number>(helpers.original);
    expect.type<Function>(helpers.warn);
    expect.type<Function>(helpers.error);
    expect.type<Function>(helpers.message);
    return 1;
  };
}

// --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- ---

Joi.checkPreferences(validOpts);

// --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- ---

let expr;

expr = Joi.expression('{{foo}}');
expr = Joi.expression('{{foo}}', { adjust: (value) => value });
expr = Joi.expression('{{foo}}', { ancestor: 3 });
expr = Joi.expression('{{foo}}', { in: true });
expr = Joi.expression('{{foo}}', { iterables: true });
expr = Joi.expression('{{foo}}', { map: [['key', 'value']] });
expr = Joi.expression('{{foo}}', { prefix: { local: '%' } });
expr = Joi.expression('{{foo}}', { separator: '_' });

expr = Joi.x('{{foo}}');
expr = Joi.x('{{foo}}', { adjust: (value) => value });
expr = Joi.x('{{foo}}', { ancestor: 3 });
expr = Joi.x('{{foo}}', { in: true });
expr = Joi.x('{{foo}}', { iterables: true });
expr = Joi.x('{{foo}}', { map: [['key', 'value']] });
expr = Joi.x('{{foo}}', { prefix: { local: '%' } });
expr = Joi.x('{{foo}}', { separator: '_' });

// --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- ---

const { string, object } = Joi.types();

// --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- ---

schema = Joi.alternatives();
expect.error(Joi.alternatives().try(schemaArr));
schema = Joi.alternatives().try(schema, schema);

expect.type<Joi.AlternativesSchema<string | number | boolean>>(Joi.alternatives([Joi.string(), Joi.number(), Joi.boolean()]));

schema = Joi.alternatives(schemaArr);
schema = Joi.alternatives(schema, anySchema, boolSchema);

schema = Joi.alt();
expect.error(Joi.alt().try(schemaArr));
schema = Joi.alt().try(schema, schema);

expect.type<Joi.AlternativesSchema<string | number | boolean>>(Joi.alt([Joi.string(), Joi.number(), Joi.boolean()]));

schema = Joi.alt(schemaArr);
schema = Joi.alt(schema, anySchema, boolSchema);

expect.type<Joi.AlternativesSchema<string | number | boolean>>(Joi.alternatives().try(Joi.string(), Joi.number(), Joi.boolean()));

// Negative tests for alternatives().try() — prove the union is real, not any
{
  const alt = Joi.alternatives().try(Joi.string(), Joi.number());
  type AltType = Joi.InferType<typeof alt>;
  expect.error<boolean>({} as AltType);

  const altBool = Joi.alternatives().try(Joi.string(), Joi.boolean());
  type AltBoolType = Joi.InferType<typeof altBool>;
  expect.error<number>({} as AltBoolType);
}

// --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- ---

schema = Joi.link(str);

// --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- ---

{
  // validate tests
  {
    let value = { username: 'example', password: 'example' };
    type TResult = { username: string; password: string };
    const schema = Joi.object<TResult>().keys({
      username: Joi.string().max(255).required(),
      password: Joi.string()
        .pattern(/^[a-zA-Z0-9]{3,255}$/)
        .required(),
    });
    let result: Joi.ValidationResult;
    let asyncResult: Promise<TResult>;

    result = schema.validate(value);
    if (result.error) {
      throw Error('error should not be set');
    } else {
      expect.type<TResult>(result.value);
    }
    result = schema.validate(value, validOpts);
    asyncResult = schema.validateAsync(value);
    asyncResult = schema.validateAsync(value, validOpts);

    asyncResult
      .then((val) => JSON.stringify(val, null, 2))
      .then((val) => {
        throw new Error('one error');
      })
      .catch((e) => {
      });

    expect.type<Promise<TResult>>(schema.validateAsync(value));
    expect.type<Promise<{
      value: TResult,
      artifacts: Map<any, string[][]>
    }>>(schema.validateAsync(value, { artifacts: true }));
    expect.type<Promise<{
      value: TResult,
      warning: Joi.ValidationWarning
    }>>(schema.validateAsync(value, { warnings: true }));
    expect.type<Promise<{
      value: TResult,
      artifacts: Map<any, string[][]>;
      warning: Joi.ValidationWarning
    }>>(schema.validateAsync(value, { artifacts: true, warnings: true }));
    expect.error<Promise<{
      value: TResult,
      warning: Joi.ValidationWarning
    }>>(schema.validateAsync(value, { artifacts: true }));
    expect.error<Promise<{
      value: TResult,
      artifacts: Map<any, string[][]>
    }>>(schema.validateAsync(value, { warnings: true }));
    expect.error<Promise<TResult>>(schema.validateAsync(value, {
      artifacts: true,
      warnings: true
    }));
    expect.type<Promise<TResult>>(schema.validateAsync(value, { artifacts: false }));
    expect.type<Promise<TResult>>(schema.validateAsync(value, { warnings: false }));
    expect.type<Promise<TResult>>(schema.validateAsync(value, {
      artifacts: false,
      warnings: false
    }));

    const falsyValue = { username: 'example' };
    result = schema.validate(falsyValue);
    if (!result.error) {
      throw Error('error should be set');
    }
  }
}

// --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- ---

schema = Joi.compile(obj);
schema = Joi.compile(schemaMap);

Joi.assert(obj, schema);
Joi.assert(obj, schema, str);
Joi.assert(obj, schema, str, validOpts);
Joi.assert(obj, schema, err);
Joi.assert(obj, schema, err, validOpts);
Joi.assert(obj, schema, validOpts);
expect.error(Joi.assert(obj, schemaLike));

{
  let value = { username: 'example', password: 'example' };
  type TResult = { username: string; password: string };
  let typedSchema = schema as Joi.ObjectSchema<TResult>;
  value = Joi.attempt(obj, typedSchema);
  value = Joi.attempt(obj, typedSchema, str);
  value = Joi.attempt(obj, typedSchema, str, validOpts);
  value = Joi.attempt(obj, typedSchema, err);
  value = Joi.attempt(obj, typedSchema, err, validOpts);
  value = Joi.attempt(obj, typedSchema, validOpts);
  expect.type<TResult>(Joi.attempt(obj, typedSchema));
  expect.error<string>(Joi.attempt(obj, typedSchema));
}

expect.type<number[]>(Joi.attempt(numArr, Joi.array()));
expect.error<string>(Joi.attempt(numArr, Joi.array()));
expect.type<boolean>(Joi.attempt(bool, Joi.bool()));
expect.error<string>(Joi.attempt(bool, Joi.bool()));
expect.type<Buffer>(Joi.attempt(buf, Joi.binary()));
expect.error<string>(Joi.attempt(buf, Joi.binary()));
expect.type<Date>(Joi.attempt(date, Joi.date()));
expect.error<string>(Joi.attempt(date, Joi.date()));
expect.type<Function>(Joi.attempt(func, Joi.func()));
expect.error<string>(Joi.attempt(func, Joi.func()));
expect.type<number>(Joi.attempt(num, Joi.number()));
expect.error<string>(Joi.attempt(num, Joi.number()));
expect.type<string>(Joi.attempt(str, Joi.string()));
expect.error<number>(Joi.attempt(str, Joi.string()));
expect.type<Symbol>(Joi.attempt(symbol, Joi.symbol()));
expect.error<string>(Joi.attempt(symbol, Joi.symbol()));

expect.error(Joi.attempt(obj, schemaLike));

ref = Joi.ref(str, refOpts);
ref = Joi.ref(str);

Joi.isExpression(expr);
Joi.isRef(ref);
Joi.isSchema(schema);

description = schema.describe();

const Joi2 = Joi.extend({ type: 'test1', base: schema });

const Joi3 = Joi.extend({
  type: 'string',
  base: Joi.string(),
  messages: {
    asd: 'must be exactly asd(f)',
  },
  coerce(schema, value) {
    return { value };
  },
  rules: {
    asd: {
      args: [
        {
          name: 'allowFalse',
          ref: true,
          assert: Joi.boolean(),
        },
      ],
      method(allowFalse: boolean) {
        return this.$_addRule({
          name: 'asd',
          args: {
            allowFalse,
          },
        });
      },
      validate(value: boolean, helpers, params, options) {
        if (value || (params.allowFalse && !value)) {
          return value;
        }

        return helpers.error('asd', { v: value }, options);
      },
    },
  },
});

const Joi4 = Joi.extend(
  { type: 'test4', base: schema },
  { type: 'test4a', base: schema }
);

const Joi5 = Joi.extend(
  { type: 'test5', base: schema },
  { type: 'test5a', base: schema },
  { type: 'test5b', base: schema }
);

// --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- ---

const defaultsJoi = Joi.defaults((schema) => {
  switch (schema.type) {
    case 'string':
      return schema.allow('');
    case 'object':
      return (schema as Joi.ObjectSchema).min(1);
    default:
      return schema;
  }
});

schema = Joi.allow(x, x);
schema = Joi.allow(...[x, x, x]);
schema = Joi.valid(x);
schema = Joi.valid(x, x);
schema = Joi.valid(...[x, x, x]);
schema = Joi.equal(x);
schema = Joi.equal(x, x);
schema = Joi.equal(...[x, x, x]);
schema = Joi.invalid(x);
schema = Joi.invalid(x, x);
schema = Joi.invalid(...[x, x, x]);
schema = Joi.disallow(x);
schema = Joi.disallow(x, x);
schema = Joi.disallow(...[x, x, x]);
schema = Joi.not(x);
schema = Joi.not(x, x);
schema = Joi.not(...[x, x, x]);

schema = Joi.required();
schema = Joi.optional();
schema = Joi.forbidden();

schema = Joi.preferences(validOpts);

// --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- ---

schema = Joi.allow(x, x);
schema = Joi.allow(...[x, x, x]);
schema = Joi.valid(x);
schema = Joi.valid(x, x);
schema = Joi.valid(...[x, x, x]);
schema = Joi.equal(x);
schema = Joi.equal(x, x);
schema = Joi.equal(...[x, x, x]);
schema = Joi.invalid(x);
schema = Joi.invalid(x, x);
schema = Joi.invalid(...[x, x, x]);
schema = Joi.disallow(x);
schema = Joi.disallow(x, x);
schema = Joi.disallow(...[x, x, x]);
schema = Joi.not(x);
schema = Joi.not(x, x);
schema = Joi.not(...[x, x, x]);

schema = Joi.required();
schema = Joi.exist();
schema = Joi.optional();
schema = Joi.forbidden();

schema = Joi.preferences(validOpts);

schema = Joi.when(str, whenOpts);
schema = Joi.when(ref, whenOpts);
schema = Joi.when(schema, whenSchemaOpts);

ref = Joi.in(str);
ref = Joi.in(str, refOpts);

schema = Joi.symbol();
schema = Joi.symbol().map(new Map<string, symbol>());
schema = Joi.symbol().map({
  key: Symbol('asd'),
});

// --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- ---

const rule = Joi.string().case('upper').$_getRule('case');
if (rule && rule.args) {
  const direction = rule.args.direction;
}

// --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- ---

schema = Joi.any();
const terms = schema.$_terms;

// --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- ---
// Test Joi.object, Joi.append and Joi.extends (with `any` type)

// should be able to append any new properties (explicit <any> opts out of inference)
let anyObject = Joi.object<any>({
  name: Joi.string().required(),
  family: Joi.string(),
});

anyObject = anyObject
  .append({
    age: Joi.number(),
  })
  .append({
    height: Joi.number(),
  });

anyObject = anyObject.keys({
  length: Joi.string(),
});

// test with keys
Joi.object()
  .keys({
    name: Joi.string().required(),
    family: Joi.string(),
  })
  .append({
    age: Joi.number(),
  })
  .append({
    height: Joi.number(),
  })
  .keys({
    length: Joi.string(),
  });

// --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- ---
// Test generic types

interface User {
  name: string;
  family?: string;
  age: number;
}

const userSchemaObject = Joi.object<User>({
  name: Joi.string().required(),
  family: Joi.string(),
});

let userSchema = Joi.object<User>().keys({
  name: Joi.string().required(),
  family: Joi.string(),
});

userSchema = userSchema.append({
  age: Joi.number(),
});

userSchema.append({ height: Joi.number() });

const userSchema2 = Joi.object<User>()
  .keys({
    name: Joi.string().required(),
  })
  .keys({
    family: Joi.string(),
  });

interface Comment {
  text: string;
  user: User;
  isNew: boolean;
}

const commentSchemaObject = Joi.object<Comment, true>({
  text: Joi.string().required(),
  user: userSchemaObject,
  isNew: Joi.boolean().required(),
});

interface Comment2 {
  text: string;
  user?: {
    name: string;
  };
}

const commentSchemaObject2 = Joi.object<Comment2, true>({
  text: Joi.string().required(),
  user: {
    name: Joi.string().required(),
  },
});

interface CommentWithAlternatives {
  text: string;
  user: string | User;
  type: 'topLevel' | 'pingback' | 'reply';
  reported: boolean | number;
}

const commentWithAlternativesSchemaObject = Joi.object<
  CommentWithAlternatives,
  true
>({
  text: Joi.string().required(),
  user: Joi.alternatives(Joi.string(), userSchemaObject),
  type: Joi.string().required().valid('topLevel', 'pingback', 'reply'),
  reported: Joi.alternatives(Joi.boolean(), Joi.number()),
});

expect.error(userSchema2.keys({ height: Joi.number() }));

expect.error(Joi.string('x'));

// --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- ---
// Test Standard Schema Types
{
  Joi.any()['~standard'].version
  Joi.any()['~standard'].vendor

  {
    // Standard Validate
    let value = { username: 'example', password: 'example' };
    type TResult = { username: string; password: string };
    const schema = Joi.object<TResult>().keys({
      username: Joi.string().max(255).required(),
      password: Joi.string()
          .pattern(/^[a-zA-Z0-9]{3,255}$/)
          .required(),
    });
    let result: StandardSchemaV1.Result<TResult> | Promise<StandardSchemaV1.Result<TResult>>;

    result = schema['~standard'].validate(value);
    if (result instanceof Promise) {
      throw Error("Expected sync result");
    }

    if (result.issues) {
      throw Error('issues should not be set')
    }
    expect.type<TResult>(result.value)

    const falsyValue = { username: 'example' };
    result = schema['~standard'].validate(falsyValue);
    if (result instanceof Promise) {
      throw new Error("Expected sync result");
    }

    if (!result.issues) {
      throw Error('issues should be set')
    }
    expect.error(result.value)
  }

  {
    // Standard JSON Schema
    const schema = Joi.string().min(5);
    const js = schema['~standard'].jsonSchema;
    const input = js.input({ target: 'draft-2020-12' });
    const output = js.output({ target: 'draft-2020-12' });

    expect.type<Record<string, unknown>>(input);
    expect.type<Record<string, unknown>>(output);
  }
}

// --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- ---
// Test Type Inference Infrastructure

{
  // InferType extracts the output type from primitive schemas
  type StringOut = Joi.InferType<Joi.StringSchema>;
  expect.type<string>({} as StringOut);
  expect.error<number>({} as StringOut);

  type NumberOut = Joi.InferType<Joi.NumberSchema>;
  expect.type<number>({} as NumberOut);
  expect.error<string>({} as NumberOut);

  type BooleanOut = Joi.InferType<Joi.BooleanSchema>;
  expect.type<boolean>({} as BooleanOut);
  expect.error<string>({} as BooleanOut);

  type DateOut = Joi.InferType<Joi.DateSchema>;
  expect.type<Date>({} as DateOut);
  expect.error<string>({} as DateOut);

  type BufferOut = Joi.InferType<Joi.BinarySchema>;
  expect.type<Buffer>({} as BufferOut);
  expect.error<string>({} as BufferOut);

  // InferOutput is an alias for InferType
  type StringOut2 = Joi.InferOutput<Joi.StringSchema>;
  expect.type<string>({} as StringOut2);
  expect.error<number>({} as StringOut2);

  // InferInput extracts the input type
  type StringIn = Joi.InferInput<Joi.StringSchema>;
  expect.type<string>({} as StringIn);
  expect.error<number>({} as StringIn);
}

{
  // InferType works with schema instances from factory methods
  const strSchema = Joi.string();
  type StrType = Joi.InferType<typeof strSchema>;
  expect.type<string>({} as StrType);
  expect.error<number>({} as StrType);

  const numSchema = Joi.number();
  type NumType = Joi.InferType<typeof numSchema>;
  expect.type<number>({} as NumType);
  expect.error<string>({} as NumType);

  const boolSchema = Joi.boolean();
  type BoolType = Joi.InferType<typeof boolSchema>;
  expect.type<boolean>({} as BoolType);
  expect.error<string>({} as BoolType);

  const dateSchema = Joi.date();
  type DateType = Joi.InferType<typeof dateSchema>;
  expect.type<Date>({} as DateType);
  expect.error<string>({} as DateType);

  const binSchema = Joi.binary();
  type BinType = Joi.InferType<typeof binSchema>;
  expect.type<Buffer>({} as BinType);
  expect.error<string>({} as BinType);

  // SymbolSchema inference (negative test)
  const symSchema = Joi.symbol();
  type SymType = Joi.InferType<typeof symSchema>;
  expect.type<Symbol>({} as SymType);
  expect.error<string>({} as SymType);
}

{
  // .valid() narrows the output type to literal unions
  const narrowedStr = Joi.string().valid('a' as const, 'b' as const);
  type NarrowedStrType = Joi.InferType<typeof narrowedStr>;
  expect.type<'a' | 'b'>({} as NarrowedStrType);
  expect.error<number>({} as NarrowedStrType);

  const narrowedNum = Joi.number().valid(1 as const, 2 as const, 3 as const);
  type NarrowedNumType = Joi.InferType<typeof narrowedNum>;
  expect.type<1 | 2 | 3>({} as NarrowedNumType);
  expect.error<string>({} as NarrowedNumType);

  const narrowedBool = Joi.boolean().valid(true as const);
  type NarrowedBoolType = Joi.InferType<typeof narrowedBool>;
  expect.type<true>({} as NarrowedBoolType);
  expect.error<string>({} as NarrowedBoolType);

  // .equal() behaves the same as .valid()
  const equalStr = Joi.string().equal('x' as const, 'y' as const);
  type EqualStrType = Joi.InferType<typeof equalStr>;
  expect.type<'x' | 'y'>({} as EqualStrType);
  expect.error<number>({} as EqualStrType);
}

{
  // .valid() with non-literal values doesn't narrow (returns same type)
  const nonLiteral = Joi.string().valid('a', 'b');
  type NonLiteralType = Joi.InferType<typeof nonLiteral>;
  expect.type<string>({} as NonLiteralType);
}

{
  // validate() returns typed results for primitive schemas
  const strResult = Joi.string().validate('test');
  if (!strResult.error) {
    expect.type<string>(strResult.value);
    expect.error<number>(strResult.value);
  }

  const numResult = Joi.number().validate(42);
  if (!numResult.error) {
    expect.type<number>(numResult.value);
    expect.error<string>(numResult.value);
  }

  // attempt() returns the inferred type
  expect.type<string>(Joi.attempt('test', Joi.string()));
  expect.error<number>(Joi.attempt('test', Joi.string()));
  expect.type<number>(Joi.attempt(42, Joi.number()));
  expect.error<string>(Joi.attempt(42, Joi.number()));
  expect.type<boolean>(Joi.attempt(true, Joi.boolean()));
  expect.error<string>(Joi.attempt(true, Joi.boolean()));
  expect.type<Date>(Joi.attempt(new Date(), Joi.date()));
  expect.error<string>(Joi.attempt(new Date(), Joi.date()));
  expect.type<Buffer>(Joi.attempt(Buffer.alloc(0), Joi.binary()));
  expect.error<string>(Joi.attempt(Buffer.alloc(0), Joi.binary()));
}

{
  // Schema flags infrastructure exists and schemas carry TFlags
  const schema = Joi.string();
  type Flags = typeof schema extends Joi.StringSchema<any, infer F> ? F : never;
  expect.type<Joi.SchemaFlags>({} as Flags);
}

{
  // Type-preserving methods don't change the inferred type
  const schema = Joi.string().min(1).max(100).email().trim();
  type SchemaType = Joi.InferType<typeof schema>;
  expect.type<string>({} as SchemaType);

  const numSchemaChained = Joi.number().min(0).max(100).integer().positive();
  type NumChainedType = Joi.InferType<typeof numSchemaChained>;
  expect.type<number>({} as NumChainedType);
}

{
  // Manual generic type parameters still work (backward compatibility)
  const manualSchema = Joi.object<{ name: string; age: number }>();
  type ManualType = Joi.InferType<typeof manualSchema>;
  expect.type<{ name: string; age: number }>({} as ManualType);

  const manualStr = Joi.string<'hello'>();
  type ManualStrType = Joi.InferType<typeof manualStr>;
  expect.type<'hello'>({} as ManualStrType);
}

// --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- ---
// Test Presence-Modifying Methods (required, optional, exist, forbidden, strip, default, failover)

// Helper to extract flag values from schema types via phantom ~flags property
type ExtractPresence<T extends Joi.AnySchema> = T['~flags']['presence'];
type ExtractHasDefault<T extends Joi.AnySchema> = T['~flags']['hasDefault'];
type ExtractIsStripped<T extends Joi.AnySchema> = T['~flags']['isStripped'];

{
  // .required() sets presence flag to 'required'
  const reqStr = Joi.string().required();
  type ReqPresence = ExtractPresence<typeof reqStr>;
  expect.type<'required'>({} as ReqPresence);
  expect.error<'optional'>({} as ReqPresence);

  // .required() preserves the output type
  type ReqStrType = Joi.InferType<typeof reqStr>;
  expect.type<string>({} as ReqStrType);
  expect.error<number>({} as ReqStrType);

  // .exist() is an alias for .required()
  const existStr = Joi.string().exist();
  type ExistPresence = ExtractPresence<typeof existStr>;
  expect.type<'required'>({} as ExistPresence);
  expect.error<'optional'>({} as ExistPresence);

  // .optional() sets presence flag to 'optional'
  const optStr = Joi.string().optional();
  type OptPresence = ExtractPresence<typeof optStr>;
  expect.type<'optional'>({} as OptPresence);
  expect.error<'required'>({} as OptPresence);

  // .optional() preserves the output type
  type OptStrType = Joi.InferType<typeof optStr>;
  expect.type<string>({} as OptStrType);
  expect.error<number>({} as OptStrType);

  // Chaining: .required().optional() should end up 'optional'
  const reqThenOpt = Joi.string().required().optional();
  type ReqThenOptPresence = ExtractPresence<typeof reqThenOpt>;
  expect.type<'optional'>({} as ReqThenOptPresence);

  // Works on other schema types too
  const reqNum = Joi.number().required();
  type ReqNumPresence = ExtractPresence<typeof reqNum>;
  expect.type<'required'>({} as ReqNumPresence);
  type ReqNumType = Joi.InferType<typeof reqNum>;
  expect.type<number>({} as ReqNumType);
  expect.error<string>({} as ReqNumType);

  const reqBool = Joi.boolean().required();
  type ReqBoolPresence = ExtractPresence<typeof reqBool>;
  expect.type<'required'>({} as ReqBoolPresence);

  const reqDate = Joi.date().required();
  type ReqDatePresence = ExtractPresence<typeof reqDate>;
  expect.type<'required'>({} as ReqDatePresence);
}

{
  // .forbidden() narrows output to never and sets isStripped
  const forbiddenStr = Joi.string().forbidden();
  type ForbiddenType = Joi.InferType<typeof forbiddenStr>;
  expect.type<never>({} as ForbiddenType);

  type ForbiddenStripped = ExtractIsStripped<typeof forbiddenStr>;
  expect.type<true>({} as ForbiddenStripped);
  expect.error<false>({} as ForbiddenStripped);

  // .forbidden() works on all schema types
  const forbiddenNum = Joi.number().forbidden();
  type ForbiddenNumType = Joi.InferType<typeof forbiddenNum>;
  expect.type<never>({} as ForbiddenNumType);
}

{
  // .strip() narrows output to never and sets isStripped flag
  const strippedStr = Joi.string().strip();
  type StrippedType = Joi.InferType<typeof strippedStr>;
  expect.type<never>({} as StrippedType);

  type StrippedFlag = ExtractIsStripped<typeof strippedStr>;
  expect.type<true>({} as StrippedFlag);
  expect.error<false>({} as StrippedFlag);

  // .strip(true) falls back to non-narrowing overload (dynamic boolean)
  const stripTrue = Joi.string().strip(true);
  type StripTrueType = Joi.InferType<typeof stripTrue>;
  expect.type<string>({} as StripTrueType);

  // .strip(false) also falls back to non-narrowing overload
  const stripFalse = Joi.string().strip(false);
  type StripFalseType = Joi.InferType<typeof stripFalse>;
  expect.type<string>({} as StripFalseType);
}

{
  // .default() sets the hasDefault flag
  const defaultStr = Joi.string().default('hello');
  type DefaultFlag = ExtractHasDefault<typeof defaultStr>;
  expect.type<true>({} as DefaultFlag);
  expect.error<false>({} as DefaultFlag);

  // .default() preserves the output type
  type DefaultStrType = Joi.InferType<typeof defaultStr>;
  expect.type<string>({} as DefaultStrType);
  expect.error<number>({} as DefaultStrType);

  // .failover() also sets the hasDefault flag
  const failoverNum = Joi.number().failover(0);
  type FailoverFlag = ExtractHasDefault<typeof failoverNum>;
  expect.type<true>({} as FailoverFlag);
  expect.error<false>({} as FailoverFlag);

  // .failover() preserves the output type
  type FailoverNumType = Joi.InferType<typeof failoverNum>;
  expect.type<number>({} as FailoverNumType);
  expect.error<string>({} as FailoverNumType);
}

{
  // Chaining presence methods with .valid() preserves both narrowings
  const narrowedRequired = Joi.string().valid('a' as const, 'b' as const).required();
  type NarrowedReqType = Joi.InferType<typeof narrowedRequired>;
  expect.type<'a' | 'b'>({} as NarrowedReqType);

  type NarrowedReqPresence = ExtractPresence<typeof narrowedRequired>;
  expect.type<'required'>({} as NarrowedReqPresence);

  // .required() then .valid() also works
  const requiredNarrowed = Joi.string().required().valid('x' as const, 'y' as const);
  type ReqNarrowedType = Joi.InferType<typeof requiredNarrowed>;
  expect.type<'x' | 'y'>({} as ReqNarrowedType);

  type ReqNarrowedPresence = ExtractPresence<typeof requiredNarrowed>;
  expect.type<'required'>({} as ReqNarrowedPresence);
}

{
  // Type-preserving methods still work after presence methods
  const reqChained = Joi.string().required().min(1).max(100).email();
  type ReqChainedType = Joi.InferType<typeof reqChained>;
  expect.type<string>({} as ReqChainedType);

  type ReqChainedPresence = ExtractPresence<typeof reqChained>;
  expect.type<'required'>({} as ReqChainedPresence);

  const numDefault = Joi.number().default(42).min(0).max(100);
  type NumDefaultType = Joi.InferType<typeof numDefault>;
  expect.type<number>({} as NumDefaultType);

  type NumDefaultFlag = ExtractHasDefault<typeof numDefault>;
  expect.type<true>({} as NumDefaultFlag);
}

{
  // Backward compatibility: assigning narrowed schemas to base schema variables
  const reqSchema: Joi.StringSchema = Joi.string().required();
  const optSchema: Joi.StringSchema = Joi.string().optional();
  const defSchema: Joi.StringSchema = Joi.string().default('hello');
  const forbSchema: Joi.StringSchema = Joi.string().forbidden();
  const stripSchema: Joi.StringSchema = Joi.string().strip();

  const reqNum: Joi.NumberSchema = Joi.number().required();
  const reqBool: Joi.BooleanSchema = Joi.boolean().required();
  const reqDate: Joi.DateSchema = Joi.date().required();
  const reqBin: Joi.BinarySchema = Joi.binary().required();
}

// --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- ---
// Test Object Schema Inference (Joi.object() captures schema map and infers output type)

{
  // Basic object inference: all optional keys (no .required() called)
  const allOptional = Joi.object({
    name: Joi.string(),
    age: Joi.number(),
  });
  type AllOptionalType = Joi.InferType<typeof allOptional>;
  expect.type<{ name?: string; age?: number }>({} as AllOptionalType);
  expect.error<string>({} as AllOptionalType);

  // Mixed required and optional keys
  const mixed = Joi.object({
    name: Joi.string().required(),
    email: Joi.string().email().required(),
    age: Joi.number(),
  });
  type MixedType = Joi.InferType<typeof mixed>;
  expect.type<{ name: string; email: string; age?: number }>({} as MixedType);
  expect.error<string>({} as MixedType);

  // All required keys
  const allRequired = Joi.object({
    name: Joi.string().required(),
    age: Joi.number().required(),
    active: Joi.boolean().required(),
  });
  type AllRequiredType = Joi.InferType<typeof allRequired>;
  expect.type<{ name: string; age: number; active: boolean }>({} as AllRequiredType);
  expect.error<string>({} as AllRequiredType);

  // Keys with .default() are treated as required (default fills in missing values)
  const withDefaults = Joi.object({
    name: Joi.string().required(),
    role: Joi.string().default('user'),
    count: Joi.number().default(0),
  });
  type WithDefaultsType = Joi.InferType<typeof withDefaults>;
  expect.type<{ name: string; role: string; count: number }>({} as WithDefaultsType);
  expect.error<string>({} as WithDefaultsType);

  // Keys with .forbidden() or .strip() are excluded from the output
  const withStripped = Joi.object({
    name: Joi.string().required(),
    secret: Joi.string().strip(),
    internal: Joi.number().forbidden(),
  });
  type WithStrippedType = Joi.InferType<typeof withStripped>;
  expect.type<{ name: string }>({} as WithStrippedType);
  expect.error<string>({} as WithStrippedType);

  // Nested objects infer correctly
  const nested = Joi.object({
    user: Joi.object({
      name: Joi.string().required(),
      email: Joi.string().required(),
    }).required(),
    meta: Joi.object({
      createdAt: Joi.date(),
    }),
  });
  type NestedType = Joi.InferType<typeof nested>;
  expect.type<{
    user: { name: string; email: string };
    meta?: { createdAt?: Date };
  }>({} as NestedType);

  // Empty object infers empty type
  const empty = Joi.object({});
  type EmptyType = Joi.InferType<typeof empty>;
  expect.type<{}>({} as EmptyType);

  // .valid() narrowing works inside objects
  const withValid = Joi.object({
    status: Joi.string().valid('active' as const, 'inactive' as const).required(),
    priority: Joi.number().valid(1 as const, 2 as const, 3 as const),
  });
  type WithValidType = Joi.InferType<typeof withValid>;
  expect.type<{
    status: 'active' | 'inactive';
    priority?: 1 | 2 | 3;
  }>({} as WithValidType);

  // .exist() (alias for .required()) works in objects
  const withExist = Joi.object({
    name: Joi.string().exist(),
    age: Joi.number(),
  });
  type WithExistType = Joi.InferType<typeof withExist>;
  expect.type<{ name: string; age?: number }>({} as WithExistType);

  // Explicit type parameter still works (backward compat)
  interface ManualUser {
    name: string;
    age?: number;
  }
  const manualObj = Joi.object<ManualUser>({
    name: Joi.string().required(),
    age: Joi.number(),
  });
  type ManualObjType = Joi.InferType<typeof manualObj>;
  expect.type<ManualUser>({} as ManualObjType);

  // Joi.object() without args returns ObjectSchema<any> (backward compat)
  const noArgs = Joi.object();
  type NoArgsType = Joi.InferType<typeof noArgs>;
  expect.type<any>({} as NoArgsType);

  // validate() returns inferred type (must check error first for typed value)
  const schema = Joi.object({
    name: Joi.string().required(),
    age: Joi.number(),
  });
  const result = schema.validate({ name: 'test' });
  if (!result.error) {
    expect.type<{ name: string; age?: number }>(result.value);
    expect.error<string>(result.value);
  }

  // Type-preserving methods on ObjectSchema don't break inference
  const withConstraints = Joi.object({
    name: Joi.string().required(),
  }).min(1).max(10).unknown(true);
  type ConstrainedType = Joi.InferType<typeof withConstraints>;
  expect.type<{ name: string }>({} as ConstrainedType);
  expect.error<string>({} as ConstrainedType);

  // Chaining presence methods on the object schema itself
  const requiredObj = Joi.object({
    name: Joi.string().required(),
  }).required();
  type ReqObjPresence = ExtractPresence<typeof requiredObj>;
  expect.type<'required'>({} as ReqObjPresence);
  type ReqObjType = Joi.InferType<typeof requiredObj>;
  expect.type<{ name: string }>({} as ReqObjType);

  // .failover() on keys works like .default()
  const withFailover = Joi.object({
    retries: Joi.number().failover(3),
    name: Joi.string().required(),
  });
  type WithFailoverType = Joi.InferType<typeof withFailover>;
  expect.type<{ retries: number; name: string }>({} as WithFailoverType);

  // Backward compat: inferred ObjectSchema assignable to base ObjectSchema
  const inferredObj: Joi.ObjectSchema = Joi.object({
    name: Joi.string().required(),
  });
}

// --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- ---
// Test .keys(), .append(), and .concat() with type inference on ObjectSchema

{
  // .keys() adds new fields to inferred schema
  const base = Joi.object({
    name: Joi.string().required(),
  });
  const extended = base.keys({
    age: Joi.number(),
  });
  type ExtendedType = Joi.InferType<typeof extended>;
  expect.type<{ name: string; age?: number }>({} as ExtendedType);
  expect.error<string>({} as ExtendedType);

  // .keys() overwrites conflicting keys (last writer wins)
  const overwritten = Joi.object({
    name: Joi.string(),
  }).keys({
    name: Joi.number().required(),
  });
  type OverwrittenType = Joi.InferType<typeof overwritten>;
  expect.type<{ name: number }>({} as OverwrittenType);
  expect.error<string>({} as OverwrittenType);

  // Chaining multiple .keys() calls
  const chained = Joi.object({
    a: Joi.string().required(),
  }).keys({
    b: Joi.number().required(),
  }).keys({
    c: Joi.boolean(),
  });
  type ChainedType = Joi.InferType<typeof chained>;
  expect.type<{ a: string; b: number; c?: boolean }>({} as ChainedType);

  // .append() adds new fields to inferred schema
  const appended = Joi.object({
    name: Joi.string().required(),
  }).append({
    email: Joi.string().email().required(),
    age: Joi.number(),
  });
  type AppendedType = Joi.InferType<typeof appended>;
  expect.type<{ name: string; email: string; age?: number }>({} as AppendedType);
  expect.error<string>({} as AppendedType);

  // .keys() then .append() chaining
  const mixed = Joi.object({
    id: Joi.number().required(),
  }).keys({
    name: Joi.string().required(),
  }).append({
    active: Joi.boolean().default(true),
  });
  type MixedType = Joi.InferType<typeof mixed>;
  expect.type<{ id: number; name: string; active: boolean }>({} as MixedType);

  // .concat() merges two inferred ObjectSchemas
  const schema1 = Joi.object({
    name: Joi.string().required(),
  });
  const schema2 = Joi.object({
    age: Joi.number().required(),
  });
  const merged = schema1.concat(schema2);
  type MergedType = Joi.InferType<typeof merged>;
  expect.type<{ name: string } & { age: number }>({} as MergedType);
  expect.error<string>({} as MergedType);

  // .keys() on empty object builds up the shape
  const fromEmpty = Joi.object({}).keys({
    name: Joi.string().required(),
    age: Joi.number(),
  });
  type FromEmptyType = Joi.InferType<typeof fromEmpty>;
  expect.type<{ name: string; age?: number }>({} as FromEmptyType);
  const fromEmptyIsAny: IsAny<FromEmptyType> = false;
  const fromEmptyIsUnknown: IsUnknown<FromEmptyType> = false;

  // .keys() on lack of value builds up the shape
  const fromNoValue = Joi.object().keys({
    name: Joi.string().required(),
    age: Joi.number(),
  });
  type FromNoValueType = Joi.InferType<typeof fromNoValue>;
  expect.type<{ name: string; age?: number }>({} as FromNoValueType);
  const noValueIsAny: IsAny<FromNoValueType> = false;
  const noValueIsUnknown: IsUnknown<FromNoValueType> = false;

  // Nested objects work with .keys()
  const nested = Joi.object({
    user: Joi.object({
      name: Joi.string().required(),
    }).required(),
  }).keys({
    meta: Joi.object({
      createdAt: Joi.date(),
    }),
  });
  type NestedKeysType = Joi.InferType<typeof nested>;
  expect.type<{
    user: { name: string };
    meta?: { createdAt?: Date };
  }>({} as NestedKeysType);
  const nestedIsAny: IsAny<NestedKeysType> = false;
  const nestedIsUnknown: IsUnknown<NestedKeysType> = false;

  // validate() returns inferred type after .keys()
  const schema = Joi.object({
    name: Joi.string().required(),
  }).keys({
    age: Joi.number(),
  });
  const result = schema.validate({});
  expect.type<{ name: string; age?: number }>(result.value);

  // Deep negative tests: prove .keys() added fields carry real types, not any
  type ExtNameType = ExtendedType['name'];
  expect.type<string>({} as ExtNameType);
  expect.error<number>({} as ExtNameType);  // proves name is string, not any

  type ExtAgeType = NonNullable<ExtendedType['age']>;
  expect.type<number>({} as ExtAgeType);
  expect.error<string>({} as ExtAgeType);  // proves age is number, not any

  // Deep negative tests: prove chained .keys() carries all key types
  type ChainedAType = ChainedType['a'];
  expect.type<string>({} as ChainedAType);
  expect.error<number>({} as ChainedAType);

  type ChainedBType = ChainedType['b'];
  expect.type<number>({} as ChainedBType);
  expect.error<string>({} as ChainedBType);

  type ChainedCType = NonNullable<ChainedType['c']>;
  expect.type<boolean>({} as ChainedCType);
  expect.error<string>({} as ChainedCType);

  // Deep negative tests: prove .append() carries real types
  type AppendedNameType = AppendedType['name'];
  expect.type<string>({} as AppendedNameType);
  expect.error<number>({} as AppendedNameType);

  type AppendedEmailType = AppendedType['email'];
  expect.type<string>({} as AppendedEmailType);
  expect.error<number>({} as AppendedEmailType);

  type AppendedAgeType = NonNullable<AppendedType['age']>;
  expect.type<number>({} as AppendedAgeType);
  expect.error<string>({} as AppendedAgeType);

  // Deep negative tests: .concat() merged keys carry real types
  type MergedNameType = MergedType['name'];
  expect.type<string>({} as MergedNameType);
  expect.error<number>({} as MergedNameType);

  type MergedAgeType = MergedType['age'];
  expect.type<number>({} as MergedAgeType);
  expect.error<string>({} as MergedAgeType);

  // Deep negative tests: nested .keys() inner keys at deeper levels
  type NestedUserNameType = NestedKeysType['user']['name'];
  expect.type<string>({} as NestedUserNameType);
  expect.error<number>({} as NestedUserNameType);

  type NestedMetaType = NonNullable<NestedKeysType['meta']>;
  type NestedCreatedAtType = NonNullable<NestedMetaType['createdAt']>;
  expect.type<Date>({} as NestedCreatedAtType);
  expect.error<string>({} as NestedCreatedAtType);

  // 3-level nesting: prove leaf keys are correctly typed
  const deep = Joi.object({
    level1: Joi.object({
      level2: Joi.object({
        leaf: Joi.string().required(),
      }).required(),
    }).required(),
  }).keys({
    extra: Joi.object({
      nested: Joi.object({
        value: Joi.number().required(),
      }).required(),
    }),
  });
  type DeepType = Joi.InferType<typeof deep>;
  type LeafType = DeepType['level1']['level2']['leaf'];
  expect.type<string>({} as LeafType);
  expect.error<number>({} as LeafType);

  type ExtraNestedType = NonNullable<DeepType['extra']>;
  type DeepValueType = ExtraNestedType['nested']['value'];
  expect.type<number>({} as DeepValueType);
  expect.error<string>({} as DeepValueType);
}

{
  // Explicitly-typed ObjectSchema still enforces strict keys
  // (TShape is null, inference overload is skipped)
  expect.error(Joi.object<{ name: string }>().keys({ height: Joi.number() }));
}

{
  // .append() on untyped Joi.object() should infer shape from arguments
  const appendNoValue = Joi.object().append({
    name: Joi.string().required(),
    age: Joi.number(),
  });
  type AppendNoValueType = Joi.InferType<typeof appendNoValue>;
  expect.type<{ name: string; age?: number }>({} as AppendNoValueType);
  const appendNoValueIsAny: IsAny<AppendNoValueType> = false;
  const appendNoValueIsUnknown: IsUnknown<AppendNoValueType> = false;

  // .concat() on untyped Joi.object() should infer shape from the other schema
  const concatNoValue = Joi.object().concat(Joi.object({
    name: Joi.string().required(),
    age: Joi.number(),
  }));
  type ConcatNoValueType = Joi.InferType<typeof concatNoValue>;
  expect.type<{ name: string; age?: number }>({} as ConcatNoValueType);
  const concatNoValueIsAny: IsAny<ConcatNoValueType> = false;
  const concatNoValueIsUnknown: IsUnknown<ConcatNoValueType> = false;
}

// --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- ---
// Test .ordered() tuple inference on ArraySchema

{
  // .ordered() with a single schema infers a 1-tuple
  const single = Joi.array().ordered(Joi.string());
  type SingleType = Joi.InferType<typeof single>;
  expect.type<[string]>({} as SingleType);
  expect.error<string>({} as SingleType);

  // .ordered() with two schemas infers a 2-tuple
  const pair = Joi.array().ordered(Joi.string(), Joi.number());
  type PairType = Joi.InferType<typeof pair>;
  expect.type<[string, number]>({} as PairType);
  expect.error<string>({} as PairType);

  // .ordered() with three schemas infers a 3-tuple
  const triple = Joi.array().ordered(Joi.string(), Joi.number(), Joi.boolean());
  type TripleType = Joi.InferType<typeof triple>;
  expect.type<[string, number, boolean]>({} as TripleType);
  expect.error<string>({} as TripleType);

  // .ordered() with mixed types including date
  const mixed = Joi.array().ordered(Joi.string(), Joi.date(), Joi.number(), Joi.boolean());
  type MixedType = Joi.InferType<typeof mixed>;
  expect.type<[string, Date, number, boolean]>({} as MixedType);
  expect.error<string>({} as MixedType);

  // .ordered() result is assignable to base ArraySchema (backward compat)
  const orderedArr: Joi.ArraySchema = Joi.array().ordered(Joi.string(), Joi.number());

  // Deep negative tests: prove tuple elements are real types, not any
  // Wrong order must fail
  expect.error<[number, string]>({} as PairType);

  // Extract each tuple position and prove it's typed
  type PairFirst = PairType[0];
  expect.type<string>({} as PairFirst);
  expect.error<number>({} as PairFirst);   // proves element 0 is string, not any

  type PairSecond = PairType[1];
  expect.type<number>({} as PairSecond);
  expect.error<string>({} as PairSecond);  // proves element 1 is number, not any

  // Extract triple elements individually
  type TripleFirst = TripleType[0];
  expect.type<string>({} as TripleFirst);
  expect.error<number>({} as TripleFirst);

  type TripleSecond = TripleType[1];
  expect.type<number>({} as TripleSecond);
  expect.error<string>({} as TripleSecond);

  type TripleThird = TripleType[2];
  expect.type<boolean>({} as TripleThird);
  expect.error<string>({} as TripleThird);
}

// --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- ---
// Test .sparse() adding undefined to array item type

{
  // .sparse() on a string array adds undefined to items
  const sparseStr = Joi.array().items(Joi.string()).sparse();
  type SparseStrType = Joi.InferType<typeof sparseStr>;
  expect.type<(string | undefined)[]>({} as SparseStrType);
  expect.error<string>({} as SparseStrType);

  // .sparse() on a number array adds undefined to items
  const sparseNum = Joi.array().items(Joi.number()).sparse();
  type SparseNumType = Joi.InferType<typeof sparseNum>;
  expect.type<(number | undefined)[]>({} as SparseNumType);
  expect.error<string>({} as SparseNumType);

  // .sparse() on a union array adds undefined to items
  const sparseUnion = Joi.array().items(Joi.string(), Joi.number()).sparse();
  type SparseUnionType = Joi.InferType<typeof sparseUnion>;
  expect.type<(string | number | undefined)[]>({} as SparseUnionType);

  // .sparse(true) falls back to this (dynamic arg, no narrowing)
  const sparseTrue = Joi.array().items(Joi.string()).sparse(true);
  type SparseTrueType = Joi.InferType<typeof sparseTrue>;
  expect.type<string[]>({} as SparseTrueType);

  // .sparse() result is assignable to base ArraySchema (backward compat)
  const sparseArr: Joi.ArraySchema = Joi.array().items(Joi.string()).sparse();
}

// --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- ---
// Test simple .when() type inference

{
  // .when() with both then and otherwise infers union of both branches
  // Note: Joi.any() is used because runtime Joi asserts then/otherwise match the base schema type
  const conditional = Joi.any().when('type', {
    is: 'admin',
    then: Joi.string().required(),
    otherwise: Joi.number().required(),
  });
  type ConditionalType = Joi.InferType<typeof conditional>;
  expect.type<string | number>({} as ConditionalType);
  expect.error<boolean>({} as ConditionalType);

  // .when() with only then (and an otherwise fallback for runtime validity)
  const thenOnly = Joi.any().when('type', {
    is: 'admin',
    then: Joi.string().required(),
    otherwise: Joi.any(),
  });
  type ThenOnlyType = Joi.InferType<typeof thenOnly>;
  expect.type<string | any>({} as ThenOnlyType);

  // .when() with matching types on string schema
  const strWhen = Joi.string().when('type', {
    is: 'admin',
    then: Joi.string().required(),
    otherwise: Joi.string(),
  });
  type StrWhenType = Joi.InferType<typeof strWhen>;
  expect.type<string>({} as StrWhenType);

  // .when() inside an object schema: field type is the union
  const objWithWhen = Joi.object({
    type: Joi.string().valid('a' as const, 'b' as const).required(),
    value: Joi.any().when('type', {
      is: 'a',
      then: Joi.string().required(),
      otherwise: Joi.number().required(),
    }),
  });
  type ObjWithWhenType = Joi.InferType<typeof objWithWhen>;
  // value field is typed as AnySchema output (string | number) — key is optional since .when() returns AnySchema
  expect.type<{ type: 'a' | 'b' }>({} as Pick<ObjWithWhenType, 'type'>);
}

// --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- ---
// Test Root-level undocumented methods with type inference

{
  // Root.valid() narrows to literal types
  const validSchema = Joi.valid('a' as const, 'b' as const);
  type ValidType = Joi.InferType<typeof validSchema>;
  expect.type<'a' | 'b'>({} as ValidType);
  expect.error<number>({} as ValidType);

  // Root.equal() narrows to literal types (alias for valid)
  const equalSchema = Joi.equal(1 as const, 2 as const);
  type EqualType = Joi.InferType<typeof equalSchema>;
  expect.type<1 | 2>({} as EqualType);
  expect.error<string>({} as EqualType);

  // Root.required() sets presence flag
  const requiredSchema = Joi.required();
  type RequiredFlags = typeof requiredSchema['~flags'];
  expect.type<'required'>({} as RequiredFlags['presence']);

  // Root.exist() sets presence flag (alias for required)
  const existSchema = Joi.exist();
  type ExistFlags = typeof existSchema['~flags'];
  expect.type<'required'>({} as ExistFlags['presence']);

  // Root.forbidden() narrows to never
  const forbiddenSchema = Joi.forbidden();
  type ForbiddenType = Joi.InferType<typeof forbiddenSchema>;
  expect.type<never>({} as ForbiddenType);

  // Root.allow() returns AnySchema
  const allowSchema = Joi.allow(null);
  expect.type<Joi.AnySchema>(allowSchema);

  // Root.invalid() returns AnySchema
  const invalidSchema = Joi.invalid('x');
  expect.type<Joi.AnySchema>(invalidSchema);

  // Root.prefs() returns AnySchema
  const prefsSchema = Joi.prefs({ convert: false });
  expect.type<Joi.AnySchema>(prefsSchema);
}

// --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- ---
// Test Joi.compile() with type pass-through

{
  // compile() with a typed schema preserves the type
  const strSchema = Joi.string().required();
  const compiled = Joi.compile(strSchema);
  expect.type<Joi.StringSchema<string, Joi.SetPresence<Joi.SchemaFlags, 'required'>>>(compiled);

  // compile() with a generic SchemaLike returns Schema
  const compiledGeneric = Joi.compile({ name: Joi.string() });
  expect.type<Joi.Schema>(compiledGeneric);
}

// --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- ---
// Test Joi.assert() as type-narrowing assertion

{
  const assertSchema = Joi.object({
    name: Joi.string().required(),
  });

  const assertData: unknown = { name: 'test' };
  Joi.assert(assertData, assertSchema);
  // After assert, data is narrowed to the inferred type
  expect.type<{ name: string }>(assertData);
  expect.error<string>(assertData);
}

// --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- ---
// Test Joi.extend() with type parameter

{
  // extend() with type parameter returns Root & TExtension
  interface MillionDef {
    million(): Joi.NumberSchema;
  }
  const extJoi = Joi.extend<MillionDef>({ type: 'million', base: Joi.number() });
  // extJoi has both Root and MillionDef methods
  const millionSchema = extJoi.million();
  expect.type<Joi.NumberSchema>(millionSchema);
  // Original Root methods still work
  const strFromExt = extJoi.string();
  expect.type<Joi.StringSchema>(strFromExt);

  // Deep negative test: extension schema inside Joi.object() carries real types
  const extObj = extJoi.object({
    count: extJoi.million().required(),
    name: extJoi.string().required(),
  });
  type ExtObjType = Joi.InferType<typeof extObj>;
  type ExtCountType = ExtObjType['count'];
  expect.type<number>({} as ExtCountType);
  expect.error<string>({} as ExtCountType);  // proves count is number, not any

  type ExtNameType = ExtObjType['name'];
  expect.type<string>({} as ExtNameType);
  expect.error<number>({} as ExtNameType);  // proves name is string, not any
}

// --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- ---
// Test Joi.link() with explicit type parameter

{
  // link() without type parameter infers any
  const anyLink = Joi.link('#root');
  type AnyLinkType = Joi.InferType<typeof anyLink>;
  expect.type<any>({} as AnyLinkType);

  // link() with explicit type parameter infers the provided type
  interface TreeNode {
    value: string;
    children: TreeNode[];
  }
  const typedLink = Joi.link<TreeNode>('#node');
  type TreeLinkType = Joi.InferType<typeof typedLink>;
  expect.type<TreeNode>({} as TreeLinkType);
  expect.error<string>({} as TreeLinkType);  // proves it's not any

  // Deep negative test: link<T>() inside an object propagates real types
  const treeObj = Joi.object({
    root: Joi.link<TreeNode>('#node').required(),
    label: Joi.string().required(),
  });
  type TreeObjType = Joi.InferType<typeof treeObj>;
  type TreeRootType = TreeObjType['root'];
  expect.error<string>({} as TreeRootType);  // proves root is TreeNode, not any

  type TreeRootValue = TreeRootType['value'];
  expect.type<string>({} as TreeRootValue);
  expect.error<number>({} as TreeRootValue);  // proves value is string, not any
}

// --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- ---
// Test escape hatches — manual generics still work

{
  // Joi.any<T>() manual generic
  interface CustomType { x: number; y: string }
  const anyTyped = Joi.any<CustomType>();
  type AnyTypedOut = Joi.InferType<typeof anyTyped>;
  expect.type<CustomType>({} as AnyTypedOut);

  // Joi.object<T>() manual generic still works
  interface User { name: string; age: number }
  const userSchema = Joi.object<User>({ name: Joi.string(), age: Joi.number() });
  type UserOut = Joi.InferType<typeof userSchema>;
  expect.type<User>({} as UserOut);

  // Manual generic doesn't interfere with inferred schemas
  const inferredSchema = Joi.object({ name: Joi.string().required() });
  type InferredOut = Joi.InferType<typeof inferredSchema>;
  expect.type<{ name: string }>(({} as InferredOut));
}

// --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- ---
// Test .unknown(true) does not break inference of known keys

{
  const schemaWithUnknown = Joi.object({
    name: Joi.string().required(),
    age: Joi.number(),
  }).unknown(true);

  type UnknownType = Joi.InferType<typeof schemaWithUnknown>;
  // Known keys are still properly inferred
  expect.type<{ name: string; age?: number }>({} as UnknownType);

  // Deep negative tests: prove .unknown(true) doesn't leak any into known keys
  type UnknownNameType = UnknownType['name'];
  expect.type<string>({} as UnknownNameType);
  expect.error<number>({} as UnknownNameType);

  type UnknownAgeType = NonNullable<UnknownType['age']>;
  expect.type<number>({} as UnknownAgeType);
  expect.error<string>({} as UnknownAgeType);
}

// --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- ---
// Test .alter() and .tailor() best-effort typing

{
  // .alter() preserves the schema type (returns this)
  const alteredStr = Joi.string().alter({
    create: (s) => s.required(),
    update: (s) => s.optional(),
  });
  expect.type<Joi.StringSchema>(alteredStr);

  // .tailor() preserves the schema type (returns this) — string
  const tailored = alteredStr.tailor('create');
  expect.type<Joi.StringSchema>(tailored);

  // .tailor() output preserves inferred type
  type TailoredType = Joi.InferType<typeof tailored>;
  expect.type<string>({} as TailoredType);
  expect.error<number>({} as TailoredType);

  // .alter() + .tailor() on an object schema — real-world use case
  const userSchema = Joi.object({
    name: Joi.string().required(),
    email: Joi.string().required(),
    age: Joi.number(),
  }).alter({
    create: (s) => s.required(),
    list: (s) => s.optional(),
  });

  const createUserSchema = userSchema.tailor('create');
  type CreateUser = Joi.InferType<typeof createUserSchema>;

  // extract and test each key individually
  type CreateUserName = CreateUser['name'];
  type CreateUserEmail = CreateUser['email'];
  type CreateUserAge = CreateUser['age'];

  expect.type<string>({} as CreateUserName);
  expect.error<number>({} as CreateUserName);
  expect.type<string>({} as CreateUserEmail);
  expect.error<number>({} as CreateUserEmail);
  expect.type<number | undefined>({} as CreateUserAge);
  expect.error<string>({} as CreateUserAge);
}

// --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- ---
// Test graceful fallbacks for untypeable features

{
  // .when() with WhenOptions variable falls back to this
  const whenOpts: Joi.WhenOptions = { is: Joi.string(), then: Joi.required() };
  const fallbackWhen = Joi.string().when('field', whenOpts);
  expect.type<Joi.StringSchema>(fallbackWhen);

  // .rename() returns this (type-preserving, no key remapping)
  const renamed = Joi.object({
    name: Joi.string().required(),
  }).rename('oldName', 'name');
  expect.type<Joi.ObjectSchema>(renamed);

  // .pattern() returns this (type-preserving)
  const patterned = Joi.object({
    name: Joi.string().required(),
  }).pattern(/^key_/, Joi.number());
  expect.type<Joi.ObjectSchema>(patterned);

  // Complex .when() with switch falls back gracefully
  const switchWhen = Joi.any().when('type', {
    switch: [
      { is: 'a', then: Joi.string() },
      { is: 'b', then: Joi.number() },
    ],
  });
  // Falls back to this (AnySchema) since switch isn't in typed overloads
  expect.type<Joi.AnySchema>(switchWhen);
}

// --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- ---
// Test Joi.attempt() returns inferred type

{
  const schema = Joi.object({
    name: Joi.string().required(),
    count: Joi.number().default(0),
  });

  const result = Joi.attempt({ name: 'test', count: 1 }, schema);
  expect.type<{ name: string; count: number }>(result);
  expect.error<string>(result);
}

// --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- ---
// Test input/output type distinction for schemas with .default()

{
  // Object with required, optional, and defaulted keys
  const schema = Joi.object({
    name: Joi.string().required(),
    age: Joi.number(),
    role: Joi.string().default('user'),
    count: Joi.number().default(0),
  });

  // Output type: defaulted keys are required (default fills them in)
  type Output = Joi.InferType<typeof schema>;
  const output: Output = { name: 'alice', role: 'admin', count: 5 };
  expect.type<{ name: string; age?: number; role: string; count: number }>(output);
  expect.error<string>(output);

  // Input type: defaulted keys are optional (you can omit them)
  type Input = Joi.InferInput<typeof schema>;
  const input: Input = { name: 'alice' };
  expect.type<{ name: string; age?: number; role?: string; count?: number }>(input);
  expect.error<string>(input);

  // InferOutput is an alias for InferType (output type)
  type Output2 = Joi.InferOutput<typeof schema>;
  expect.type<Output>({} as Output2);
  expect.type<Output2>({} as Output);
  expect.error<string>({} as Output2);

  // validate() returns the output type (defaulted keys are present)
  const validated = schema.validate({ name: 'test', role: 'admin', count: 1 });
  if (!validated.error) {
    expect.type<{ name: string; age?: number; role: string; count: number }>(validated.value);
    expect.error<string>(validated.value);
  }
}

{
  // Schema with .required().default() — both flags
  const schema = Joi.object({
    id: Joi.number().required(),
    status: Joi.string().required().default('active'),
  });

  // Output: both required (id from .required(), status from .default() AND .required())
  type Output = Joi.InferType<typeof schema>;
  expect.type<{ id: number; status: string }>({} as Output);
  expect.error<string>({} as Output);

  // Input: id is required, status is required too (.required() takes precedence)
  type Input = Joi.InferInput<typeof schema>;
  expect.type<{ id: number; status: string }>({} as Input);
  expect.error<string>({} as Input);
}

{
  // Schema with only defaulted keys — all optional in input, all required in output
  const schema = Joi.object({
    x: Joi.number().default(0),
    y: Joi.number().default(0),
  });

  type Output = Joi.InferType<typeof schema>;
  expect.type<{ x: number; y: number }>({} as Output);
  expect.error<string>({} as Output);

  type Input = Joi.InferInput<typeof schema>;
  expect.type<{ x?: number; y?: number }>({} as Input);
  expect.error<string>({} as Input);
}

{
  // Nested object with defaults
  const schema = Joi.object({
    user: Joi.object({
      name: Joi.string().required(),
      locale: Joi.string().default('en'),
    }).required(),
  });

  type Output = Joi.InferType<typeof schema>;
  expect.type<{ user: { name: string; locale: string } }>({} as Output);
  expect.error<string>({} as Output);

  // InferInput on non-object schemas returns the same as InferType
  type StringInput = Joi.InferInput<Joi.StringSchema>;
  expect.type<string>({} as StringInput);
  expect.error<number>({} as StringInput);

  type NumberInput = Joi.InferInput<Joi.NumberSchema>;
  expect.type<number>({} as NumberInput);
  expect.error<string>({} as NumberInput);
}

// --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- ---
// Deep negative tests: .sparse() inference

{
  // sparse with string items
  const sparseStrSchema = Joi.array().items(Joi.string()).sparse();
  type SparseStrType = Joi.InferType<typeof sparseStrSchema>;
  type SparseStrElement = SparseStrType[number];
  // Element should be string | undefined, not any
  expect.error<number>({} as NonNullable<SparseStrElement>);

  // sparse with number items
  const sparseNumSchema = Joi.array().items(Joi.number()).sparse();
  type SparseNumType = Joi.InferType<typeof sparseNumSchema>;
  type SparseNumElement = SparseNumType[number];
  expect.error<string>({} as NonNullable<SparseNumElement>);

  // sparse with union items
  const sparseUnionSchema = Joi.array().items(Joi.string(), Joi.number()).sparse();
  type SparseUnionType = Joi.InferType<typeof sparseUnionSchema>;
  type SparseUnionElement = SparseUnionType[number];
  expect.error<boolean>({} as NonNullable<SparseUnionElement>);
}

// --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- ---
// Deep negative tests: .when() with then and otherwise

{
  // .when() with then + otherwise: both branches typed
  const whenBothSchema = Joi.any().when('type', {
    is: 'admin',
    then: Joi.string().required(),
    otherwise: Joi.number().required()
  });
  type WhenBothType = Joi.InferType<typeof whenBothSchema>;
  expect.error<boolean>({} as WhenBothType);

  // .when() then-only on Joi.any() — union of then + base (any)
  // Note: Joi.string().when() then-only with Joi.number() then produces
  // string | number, which is a valid Lab types limitation to test separately.
  // When then-only is used with Joi.any() base, the result includes any.
  const whenThenOnlyAny = Joi.any().when('type', {
    is: 'admin',
    then: Joi.string().required()
  });
  type WhenThenOnlyAnyType = Joi.InferType<typeof whenThenOnlyAny>;
  // Base is any, so result is string | any = any (accepted limitation)
  expect.type<any>({} as WhenThenOnlyAnyType);
}

// --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- ---
// Deep negative tests: .when() inside objects

{
  const objWithWhenSchema = Joi.object({
    type: Joi.string().required(),
    value: Joi.any().when('type', {
      is: 'text',
      then: Joi.string().required(),
      otherwise: Joi.number().required()
    })
  });
  type ObjWithWhenType = Joi.InferType<typeof objWithWhenSchema>;

  // Test the 'type' key individually
  type TypeKey = ObjWithWhenType['type'];
  expect.type<string>({} as TypeKey);
  expect.error<number>({} as TypeKey);

  // Test the 'value' key individually — should be string | number
  type ValueKey = NonNullable<ObjWithWhenType['value']>;
  expect.error<boolean>({} as ValueKey);
}

// --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- ---
// Deep negative tests: Joi.array().items() element types

{
  // Single item type
  const singleSchema = Joi.array().items(Joi.string());
  type SingleType = Joi.InferType<typeof singleSchema>;
  type SingleElement = SingleType[number];
  expect.type<string>({} as SingleElement);
  expect.error<number>({} as SingleElement);

  // Multiple items (union)
  const unionSchema = Joi.array().items(Joi.string(), Joi.number());
  type UnionType = Joi.InferType<typeof unionSchema>;
  type UnionElement = UnionType[number];
  expect.error<boolean>({} as UnionElement);

  // Nested array
  const nestedSchema = Joi.array().items(Joi.array().items(Joi.number()));
  type NestedType = Joi.InferType<typeof nestedSchema>;
  type NestedElement = NestedType[number];
  // NestedElement should be number[]
  type NestedInnerElement = NestedElement[number];
  expect.type<number>({} as NestedInnerElement);
  expect.error<string>({} as NestedInnerElement);
}

// --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- ---
// Deep negative tests: Joi.alternatives().try() union members

{
  // 2 branches
  const alt2 = Joi.alternatives().try(Joi.string(), Joi.number());
  type Alt2Type = Joi.InferType<typeof alt2>;
  expect.error<boolean>({} as Alt2Type);

  // 3+ branches
  const alt3 = Joi.alternatives().try(Joi.string(), Joi.number(), Joi.boolean());
  type Alt3Type = Joi.InferType<typeof alt3>;
  expect.error<Date>({} as Alt3Type);
}

// --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- ---
// Deep negative tests: Joi.attempt() with object schemas — per-key extraction

{
  const attemptSchema = Joi.object({
    name: Joi.string().required(),
    age: Joi.number().required(),
    active: Joi.boolean().required()
  });

  const attemptResult = Joi.attempt({ name: 'test', age: 30, active: true }, attemptSchema);

  // Extract and test each key individually
  type AttemptResultType = typeof attemptResult;
  type AttemptNameType = AttemptResultType['name'];
  expect.type<string>({} as AttemptNameType);
  expect.error<number>({} as AttemptNameType);

  type AttemptAgeType = AttemptResultType['age'];
  expect.type<number>({} as AttemptAgeType);
  expect.error<string>({} as AttemptAgeType);

  type AttemptActiveType = AttemptResultType['active'];
  expect.type<boolean>({} as AttemptActiveType);
  expect.error<string>({} as AttemptActiveType);
}

// --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- ---
// Deep negative tests: Joi.assert() type narrowing — per-key extraction

{
  const assertSchema = Joi.object({
    id: Joi.number().required(),
    label: Joi.string().required()
  });

  const assertData: unknown = { id: 1, label: 'hello' };
  Joi.assert(assertData, assertSchema);

  // After assert, data should be narrowed
  type AssertDataType = typeof assertData;
  type AssertIdType = AssertDataType['id'];
  expect.type<number>({} as AssertIdType);
  expect.error<string>({} as AssertIdType);

  type AssertLabelType = AssertDataType['label'];
  expect.type<string>({} as AssertLabelType);
  expect.error<number>({} as AssertLabelType);
}

// --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- ---
// Deep negative tests: InferInput/InferOutput on complex objects with .default() — per-key

{
  const defaultSchema = Joi.object({
    name: Joi.string().required(),
    age: Joi.number(),
    role: Joi.string().default('user'),
    count: Joi.number().default(0)
  });

  // Output type: extract and test each key
  type DefaultOutput = Joi.InferOutput<typeof defaultSchema>;
  type DefaultOutputName = DefaultOutput['name'];
  expect.type<string>({} as DefaultOutputName);
  expect.error<number>({} as DefaultOutputName);

  type DefaultOutputRole = DefaultOutput['role'];
  expect.type<string>({} as DefaultOutputRole);
  expect.error<number>({} as DefaultOutputRole);

  type DefaultOutputCount = DefaultOutput['count'];
  expect.type<number>({} as DefaultOutputCount);
  expect.error<string>({} as DefaultOutputCount);

  // Input type: extract and test each key
  type DefaultInput = Joi.InferInput<typeof defaultSchema>;
  type DefaultInputName = DefaultInput['name'];
  expect.type<string>({} as DefaultInputName);
  expect.error<number>({} as DefaultInputName);

  // Defaulted keys are optional in input — role and count should accept undefined
  type DefaultInputRole = DefaultInput['role'];
  expect.type<string | undefined>({} as DefaultInputRole);
  expect.error<number>({} as DefaultInputRole);

  type DefaultInputCount = DefaultInput['count'];
  expect.type<number | undefined>({} as DefaultInputCount);
  expect.error<string>({} as DefaultInputCount);
}
