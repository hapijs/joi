var Joi = require('../');


var schema = Joi.object().keys({
    email: Joi.string().email().required(),
    password: Joi.string().min(8).required(),
    password_confirmation: Joi.any().valid(Joi.ref('password')).required().options({ language: { any: { allowOnly: 'must match password' } } }),
    first_name: Joi.string().required(),
    last_name: Joi.string().required(),
    company: Joi.string().optional()
});


var data = {
    email: 'joe@example.com',
    password: 'abcd1234',
    password_confirmation: 'abc1',
    first_name: 'Joe',
    last_name: 'Doe'
};

Joi.assert(data, schema);