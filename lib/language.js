// Load modules


// Declare internals

var internals = {};


exports.errors = {
    root: 'value',
    any: {
        unknown: '{{key}} is not allowed',
        invalid: '{{key}} is not allowed to be {{value}}',
        empty: '{{key}} is not allowed to be empty',
        allowOnly: '{{key}} must be one of {{value}}'
    },
    alternatives: {
        base: '{{key}} not matching any of the allowed alternatives'
    },
    array: {
        base: '{{key}} must be an array',
        includes: '{{key}}[{{pos}}] does not match any of the allowed types',
        'includes-single': '{{key}}[{{pos}}] fails because {{reason}}',
        excludes: '{{key}}[{{pos}}] contains an excluded value',
        min: '{{key}} must contain at least {{limit}} items',
        max: '{{key}} must contain less than or equal to {{limit}} items',
        length: '{{key}} must contain {{limit}} items'
    },
    boolean: {
        base: '{{key}} must be a boolean'
    },
    binary: {
        base: '{{key}} must be a buffer or a string',
        min: '{{key}} must be at least {{limit}} bytes',
        max: '{{key}} must be less than or equal to {{limit}} bytes',
        length: '{{key}} must be {{limit}} bytes'
    },
    date: {
        base: '{{key}} must be a number of milliseconds or valid date string',
        min: '{{key}} must be larger than or equal to {{limit}}',
        max: '{{key}} must be less than or equal to {{limit}}'
    },
    function: {
        base: '{{key}} must be a Function'
    },
    object: {
        base: '{{key}} must be an object',
        allowUnknown: '{{key}} is not allowed',
        rename: {
            multiple: 'cannot rename {{from}} because multiple renames are disabled and another key was already renamed to {{to}}',
            override: 'cannot rename {{from}} because override is disabled and target {{to}} exists'
        },
        with: '{{key}} missing required peer {{peer}}',
        without: '{{key}} conflict with forbidden peer {{peer}}',
        xor: {
            conflict: 'conflict within exclusive peers {{peers}}',
            missing: 'at least one of {{peers}} is required'
        },
        or: 'missing at least one of alternative peers {{peers}}',
        and: '{{present}} missing required peers {{missing}}',
        assert: '{{ref}} failed assertion {{message}}'
    },
    number: {
        base: '{{key}} must be a number',
        min: '{{key}} must be larger than or equal to {{limit}}',
        max: '{{key}} must be less than or equal to {{limit}}',
        float: '{{key}} must be a float or double',
        integer: '{{key}} must be an integer',
        negative: '{{key}} must be a negative number',
        positive: '{{key}} must be a positive number'
    },
    string: {
        base: '{{key}} must be a string',
        min: '{{key}} length must be at least {{limit}} characters long',
        max: '{{key}} length must be less than or equal to {{limit}} characters long',
        length: '{{key}} length must be {{limit}} characters long',
        alphanum: '{{key}} must only contain alpha-numeric characters',
        token: '{{key}} must only contain alpha-numeric and underscore characters',
        regex: '{{key}} must match the regular expression {{value}}',
        email: '{{key}} must be a valid email',
        isoDate: '{{key}} must be a valid ISO 8601 date',
        guid: '{{key}} must be a valid GUID',
        hostname: '{{key}} must be a valid hostname'
    }
};
