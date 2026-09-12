'use strict';


exports.contentEncoding = function (encoding) {

    // JSON Schema's contentEncoding annotation follows RFC 4648 / MIME transfer
    // encoding names, not Node's full Buffer encoding namespace. Map only the
    // binary transfer encodings Joi can express here and omit charset-style
    // encodings such as utf8/latin1 that have no honest contentEncoding value.
    if (!encoding) {
        return undefined;
    }

    if (encoding === 'hex') {
        return 'base16';
    }

    if (encoding === 'base64' ||
        encoding === 'base64url') {

        return encoding;
    }

    return undefined;
};
