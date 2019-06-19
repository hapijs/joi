'use strict';

const Hoek = require('@hapi/hoek');
const Joi = require('.');


const schema = Joi.object({
    id: Joi.number()
        .required(),

    level: Joi.string()
        .valid('debug', 'info', 'notice')
        .required()
})
    .unknown(false);


const bench = new Hoek.Bench();

for (let i = 0; i < 1000000; ++i) {
    schema.validate({ id: i, level: 'info' });
}

console.log(bench.elapsed() / 1000000);
