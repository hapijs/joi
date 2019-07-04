'use strict';

const Code = require('@hapi/code');
const Lab = require('@hapi/lab');
const Joi = require('..');


const internals = {};


const { describe, it } = exports.lab = Lab.script();
const { expect } = Code;


describe('Manifest', () => {

    describe('describe()', () => {

        it('describes schema (direct)', () => {

            const defaultFn = function () {

                return 'test';
            };

            defaultFn.description = 'testing';

            const defaultDescribedFn = function () {

                return 'test';
            };

            const defaultRef = Joi.ref('xor');

            const schema = Joi.object({
                sub: {
                    email: Joi.string().email(),
                    domain: Joi.string().domain(),
                    date: Joi.date(),
                    child: Joi.object({
                        alphanum: Joi.string().alphanum()
                    })
                },
                min: [Joi.number(), Joi.string().min(3)],
                max: Joi.string().max(3).default(0).failover(1),
                required: Joi.string().required(),
                xor: Joi.string(),
                renamed: Joi.string().valid('456'),
                notEmpty: Joi.string().required().description('a').notes('b').tags('c'),
                empty: Joi.string().empty('').strip(),
                defaultRef: Joi.string().default(defaultRef, 'not here'),
                defaultFn: Joi.string().default(defaultFn, 'not here'),
                defaultDescribedFn: Joi.string().default(defaultDescribedFn, 'described test')
            })
                .prefs({ abortEarly: false, convert: false })
                .rename('renamed', 'required')
                .without('required', 'xor')
                .without('xor', 'required')
                .allow({ a: 'x' });

            const result = {
                type: 'object',
                valids: [{ value: { a: 'x' } }],
                children: {
                    sub: {
                        type: 'object',
                        children: {
                            email: {
                                type: 'string',
                                invalids: [''],
                                rules: [{ name: 'email' }]
                            },
                            domain: {
                                type: 'string',
                                invalids: [''],
                                rules: [{ name: 'domain' }]
                            },
                            date: {
                                type: 'date'
                            },
                            child: {
                                type: 'object',
                                children: {
                                    alphanum: {
                                        type: 'string',
                                        invalids: [''],
                                        rules: [{ name: 'alphanum' }]
                                    }
                                }
                            }
                        }
                    },
                    min: {
                        type: 'alternatives',
                        alternatives: [
                            {
                                type: 'number',
                                invalids: [Infinity, -Infinity],
                                flags: { unsafe: false }
                            },
                            {
                                type: 'string',
                                invalids: [''],
                                rules: [{ name: 'min', args: { limit: 3 } }]
                            }
                        ]
                    },
                    max: {
                        type: 'string',
                        flags: {
                            default: { value: 0 },
                            failover: { value: 1 }
                        },
                        invalids: [''],
                        rules: [{ name: 'max', args: { limit: 3 } }]
                    },
                    required: {
                        type: 'string',
                        flags: {
                            presence: 'required'
                        },
                        invalids: ['']
                    },
                    xor: {
                        type: 'string',
                        invalids: ['']
                    },
                    renamed: {
                        type: 'string',
                        flags: {
                            allowOnly: true
                        },
                        valids: ['456'],
                        invalids: ['']
                    },
                    notEmpty: {
                        type: 'string',
                        flags: {
                            presence: 'required'
                        },
                        description: 'a',
                        notes: ['b'],
                        tags: ['c'],
                        invalids: ['']
                    },
                    empty: {
                        type: 'string',
                        flags: {
                            empty: {
                                type: 'string',
                                flags: {
                                    allowOnly: true
                                },
                                valids: ['']
                            },
                            strip: true
                        },
                        invalids: ['']
                    },
                    defaultRef: {
                        type: 'string',
                        flags: {
                            default: {
                                ref: 'value',
                                key: 'xor',
                                path: ['xor']
                            }
                        },
                        invalids: ['']
                    },
                    defaultFn: {
                        type: 'string',
                        flags: {
                            default: {
                                description: 'testing',
                                function: defaultFn
                            }
                        },
                        invalids: ['']
                    },
                    defaultDescribedFn: {
                        type: 'string',
                        flags: {
                            default: {
                                description: 'described test',
                                function: defaultDescribedFn
                            }
                        },
                        invalids: ['']
                    }
                },
                dependencies: [
                    {
                        type: 'without',
                        key: 'required',
                        peers: ['xor']
                    },
                    {
                        type: 'without',
                        key: 'xor',
                        peers: ['required']
                    }
                ],
                renames: [
                    {
                        from: 'renamed',
                        to: 'required',
                        options: {
                            alias: false,
                            multiple: false,
                            override: false
                        }
                    }
                ],
                options: {
                    abortEarly: false,
                    convert: false
                }
            };

            const description = schema.describe();
            expect(description).to.equal(result);
            expect(description.children.defaultRef.flags.default).to.equal({ ref: 'value', key: 'xor', path: ['xor'] });
            expect(description.children.defaultFn.flags.default.description).to.equal('testing');
            expect(description.children.defaultDescribedFn.flags.default.description).to.equal('described test');
        });

        it('describes schema (any)', () => {

            const any = Joi;
            const description = any.describe();
            expect(description).to.equal({
                type: 'any'
            });
        });

        it('describes schema without invalids', () => {

            const description = Joi.allow(null).describe();
            expect(description.invalids).to.not.exist();
        });
    });
});
