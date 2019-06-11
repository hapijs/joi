'use strict';

const Fs = require('fs');
const Path = require('path');

const Language = require('../lib/language');


const internals = {
    API: Fs.readFileSync(Path.join(__dirname, '../API.md'), 'utf8'),
    startString: '<!-- errors -->',
    endString: '<!-- errorsstop -->',
    ignoredCodes: ['root', 'key', 'messages.wrapArrays']
};


internals.parseTitles = function (markdown) {

    const re = /^#### `(.*)`$/gm;
    const matches = [];
    let match;
    while (match = re.exec(markdown)) {
        matches.push(match[1]);
    }

    return matches;
};


internals.checkMissing = function (titles) {

    return Object.keys(Language.errors)
        .filter((code) => !internals.ignoredCodes.includes(code))
        .filter((code) => !titles.includes(code))
        .sort();
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
