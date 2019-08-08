const Assert = require('assert');

const Joi = require('../..');

describe('Joi', () => {
    it('should be able to create schemas', () => {
        Joi.string().min(5);
    });

    it('should be able to validate data', () => {
        const schema = Joi.string().min(5);
        Assert.ok(!schema.validate('123456').error);
        Assert.ok(schema.validate('123').error);
    });

    it('fails using binary', () => {
        Assert.throws(() => Joi.binary().min(1));
        Assert.strictEqual(Joi.binary, undefined);
    });
});
