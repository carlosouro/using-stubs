var obj = require('./include.js');
var assert = require('assert');

assert(typeof obj.test() === 'undefined', '.test() returns undefined');
assert(obj.testTrue("hello")===true, 'testTrue() is true');
assert(obj.testFalse()===true, 'testFalse() is true');