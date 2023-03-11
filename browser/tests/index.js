const Assert = require('assert');

const Joi = require('../..');


describe('Joi', () => {

    it('should be able to create schemas', () => {

        Joi.boolean().truthy('true');
        Joi.number().min(5).max(10).multiple(2);
        Joi.array().items(Joi.number().required());
        Joi.object({
            key: Joi.string().required()
        });
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

    it('validates email', () => {

        const schema = Joi.string().email({ tlds: false }).required();
        Assert.ok(!schema.validate('test@example.com').error);
        Assert.ok(schema.validate('test@example.com ').error);
        Assert.ok(!schema.validate('伊昭傑@郵件.商務').error);

        const schema2 = Joi.string().email({ tlds: { allow: false } }).required();
        Assert.ok(!schema2.validate('test@example.com').error);
        Assert.ok(schema2.validate('test@example.com ').error);
        Assert.ok(!schema2.validate('伊昭傑@郵件.商務').error);
    });

    it('validates domain', () => {

        const schema = Joi.string().domain().required();
        Assert.ok(!schema.validate('example.com').error);
        Assert.ok(schema.validate('example.com ').error);
        Assert.ok(!schema.validate('example.商務').error);

        const schema2 = Joi.string().domain({ tlds: { allow: false } }).required();
        Assert.ok(!schema2.validate('example.com').error);
        Assert.ok(schema2.validate('example.com ').error);
        Assert.ok(!schema2.validate('example.商務').error);
    });
});
