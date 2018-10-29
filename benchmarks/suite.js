'use strict';

const Joi = require('../');

module.exports = [
    [
        'Simple object',
        () => [
            Joi.object({
                id: Joi.string().required(),
                level: Joi.string()
                    .valid(['debug', 'info', 'notice'])
                    .required()
            }).unknown(false),
            { id: '1', level: 'info' }
        ],
        (schema, value) => {

            schema.validate(value, { convert: false });
        }
    ],
    [
        'Simple object with inlined options',
        () => [
            Joi.object({
                id: Joi.string().required(),
                level: Joi.string()
                    .valid(['debug', 'info', 'notice'])
                    .required()
            }).unknown(false).options({ convert: false }),
            { id: '1', level: 'info' }
        ],
        (schema, value) => {

            schema.validate(value);
        }
    ]
];
