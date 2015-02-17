var deepEqual = require('deep-equal');
var assert = require('assert');

assert(!deepEqual({foo:'bar'}, {foo:'bar'}), 'stubbed deepEqual() returns false');
assert(typeof deepEqual.usingStubsTest === 'function', 'deepEqual.usingStubsTest is a function');
deepEqual.usingStubsTest();