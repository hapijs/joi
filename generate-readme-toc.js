'use strict';

// Load modules

const Toc = require('markdown-toc');
const Fs = require('fs');
const Package = require('./package.json');

// Declare internals

const internals = {
    api: {
        filename: './API.md',
        contents: Fs.readFileSync('./API.md', 'utf8')
    },
    readme: {
        filename: './README.md',
        contents: Fs.readFileSync('./README.md', 'utf8')
    }
};

internals.generateToc = function () {

    const tocOptions = {
        bullets: '-',
        slugify: function (text) {

            return text.toLowerCase()
                .replace(/\s/g, '-')
                .replace(/[^\w-]/g, '');
        }
    };

    const api = Toc.insert(internals.api.contents, tocOptions)
        .replace(/<!-- version -->(.|\n)*<!-- versionstop -->/, `<!-- version -->\n# ${Package.version} API Reference\n<!-- versionstop -->`);

    Fs.writeFileSync(internals.api.filename, api);
};

internals.generateLink = function () {
    // create absolute URL for versioned docs
    const readme = internals.readme.contents
        .replace(/\[API Reference\]\(.*\)/gi, `[API Reference](${Package.homepage || ''}/blob/v${Package.version}/${internals.api.filename.substr(2)})`);

    Fs.writeFileSync(internals.readme.filename, readme);
};

internals.generateToc();
internals.generateLink();
