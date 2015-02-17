var deepEqual = require('deep-equal');
var assert = require('assert');

assert(deepEqual({foo:'bar'}, {foo:'bar'}), 'returns true');
assert(!deepEqual.hasOwnProperty('usingStubsTest'), 'deepEqual.usingStubsTest is not defined');