'use strict';

// Load modules

const Toc = require('markdown-toc');
const Fs = require('fs');
const Package = require('./package.json');

// Declare internals

const internals = {
    filename: './API.md'
};


internals.generate = function () {

    const api = Fs.readFileSync(internals.filename, 'utf8');
    const tocOptions = {
        bullets: '-',
        slugify: function (text) {

            return text.toLowerCase()
                .replace(/\s/g, '-')
                .replace(/[^\w-]/g, '');
        }
    };

    const output = Toc.insert(api, tocOptions)
        .replace(/<!-- version -->(.|\n)*<!-- versionstop -->/, '<!-- version -->\n# ' + Package.version + ' API Reference\n<!-- versionstop -->');

    Fs.writeFileSync(internals.filename, output);
};

internals.generate();
