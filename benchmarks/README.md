# Joi benchmarks

The benchmarks in this folder are there to do performance regression testing. This is not to compare joi to some other library as this is most of the time meaningless.

Run it first with `npm run bench-update` to establish a baseline then run `npm run bench` or `npm test` to compare your modifications to the baseline.

Significant (> 10% by default) are put in colors in the report, the rest should be fairly obvious.
