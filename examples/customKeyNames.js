var Joi = require('../');

var schema = Joi.object().keys({
    title: Joi.string().required().options({ language: { root: 'Book title'} }),
    copies: Joi.number().optional().options({ language: { root: 'Number of copies'} }),
    summary: Joi.string().optional().options({ language: { root: 'Brief summary'} })
});

var data = {
    copies: 'blah',
    summary: 'It was the best of times, it was the worst of times'
};

Joi.assert(data, schema);
