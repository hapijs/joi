'use strict';

// Load modules

const Fs = require('fs');
const Path = require('path');
const Language = require('../lib/language');

// Declare internals

const internals = {
    API: Fs.readFileSync(Path.join(__dirname, '../API.md'), 'utf8'),
    startString: '<!-- errors -->',
    endString: '<!-- errorsstop -->',
    ignoredLanguage: ['root', 'key', 'messages'],
    ignoredCodes: [
        '`alternatives.child`',
        '`array.includesOne`',
        '`array.includesOneSingle`',
        '`array.ordered`',
        '`object.child`'
    ]
};

internals.parseTitles = function (markdown) {

    const re = /^#### (.*)$/gm;
    const matches = [];
    let match;
    while (match = re.exec(markdown)) {
        matches.push(match[1]);
    }

    return matches;
};

internals.generateCurrentErrorCodes = function (obj = Language.errors, path = [], result = []) {

    for (const key of Object.keys(obj)) {
        if (obj === Language.errors) {
            if (internals.ignoredLanguage.includes(key)) {
                continue;
            }
        }

        const value = obj[key];
        if (value === null || typeof value === 'string') {
            const code = '`' + path.concat(key).join('.') + '`';
            if (!internals.ignoredCodes.includes(code)) {
                result.push(code);
            }

            continue;
        }

        internals.generateCurrentErrorCodes(value, path.concat(key), result);
    }

    return result;
};

internals.checkMissing = function (titles) {

    const table = [];
    const currentCodes = internals.generateCurrentErrorCodes();
    currentCodes.forEach((code) => {

        if (!titles.includes(code)) {
            table.push(code);
        }
    });
    table.sort();
    return table;
};

internals.updateTable = function () {

    const start = internals.API.indexOf(internals.startString);
    const end = internals.API.indexOf(internals.endString);
    const errorSection = internals.API.substring(start, end);
    const titles = internals.parseTitles(errorSection);
    const missing = internals.checkMissing(titles);
    if (missing.length) {
        console.log(`Missing:
${missing.map((m) => `#### ${m}

**Description**

**Context**
\`\`\`ts
{
    key: string, // Last element of the path accessing the value, \`undefined\` if at the root
    label: string, // Label if defined, otherwise it's the key
    ...
}
\`\`\`
`).join('\n')}
`);
        process.exit(1);
    }
};

internals.updateTable();
