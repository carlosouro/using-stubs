var obj = require('../include.js');
var assert = require('assert');

assert(!obj.hasOwnProperty('test'), '.test() is not defined');
assert(obj.testTrue("hello")===true, 'testTrue() is true');
assert(obj.testFalse()===false, 'testFalse() is false');