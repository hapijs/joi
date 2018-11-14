'use strict';


module.exports = class {

    constructor(key, path, ancestors) {

        this.key = key;
        this.path = path;
        this.ancestors = ancestors;
        this.parent = ancestors[0];
    }
};
