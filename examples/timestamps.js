'use strict';

// Load modules
const Joi = require('../');

const now = new Date();
const javascriptTimestamp = now.getTime();
const unixTimestamp = now.getTime() / 1000;

const schema = Joi.object().options({ abortEarly: false }).keys({
  javascript1: Joi.date().timestamp(),
  javascript2: Joi.date().timestamp('javascript'),
  unix: Joi.date().timestamp('unix')
});

const data = {
  javascript1: javascriptTimestamp,
  javascript2: javascriptTimestamp,
  unix: unixTimestamp
};

Joi.assert(data, schema);
