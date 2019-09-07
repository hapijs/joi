'use strict';

const Code = require('@hapi/code');


const internals = {};


const { expect } = Code;


exports.validate = function (schema, prefs, tests) {

    if (!tests) {
        tests = prefs;
        prefs = null;
    }

    try {
        expect(schema.$_root.build(schema.describe())).to.equal(schema, { skip: ['_ruleset', '_resolved'] });

        for (const [input, pass, expected] of tests) {
            if (!pass) {
                expect(expected, 'Failing tests messages must be tested').to.exist();
            }

            const { error, value } = schema.validate(input, prefs);

            if (error &&
                pass) {

                console.log(error);
            }

            if (!error &&
                !pass) {

                console.log(input);
            }

            expect(!error).to.equal(pass);

            if (expected === undefined) {
                continue;
            }

            if (pass) {
                expect(value).to.equal(expected);
                continue;
            }

            const message = expected.message || expected;
            if (message instanceof RegExp) {
                expect(error.message).to.match(message);
            }
            else {
                expect(error.message).to.equal(message);
            }

            if (expected.details) {
                expect(error.details).to.equal(expected.details);
            }
        }
    }
    catch (err) {
        console.error(err.stack);
        err.at = internals.thrownAt();      // Adjust error location to test
        throw err;
    }
};


internals.thrownAt = function () {

    const error = new Error();
    const frame = error.stack.replace(error.toString(), '').split('\n').slice(1).filter((line) => !line.includes(__filename))[0];
    const at = frame.match(/^\s*at \(?(.+)\:(\d+)\:(\d+)\)?$/);
    return {
        filename: at[1],
        line: at[2],
        column: at[3]
    };
};
