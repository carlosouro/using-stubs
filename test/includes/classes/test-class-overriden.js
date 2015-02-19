var assert = require('assert');
var Cat = require('./subfolder/Cat');

var furrball = new Cat('Furrball');
var snuffles = new Cat('Snuffles');
var lady = new Cat('Lady');

var response = furrball.pet();
assert(response==='Furrball purrs', 'furrball did not purr - '+response);

response = furrball.pet("hard")
assert(response==='Furrball runs away', 'furrball did not runs away - '+response);

response = snuffles.pet("Snuffles")
assert(response==='Cat screams: "call me Snowball - I like it better"', 'snowball failed - '+response);

response = snuffles.pet()
assert(response==='Snowball purrs', 'snowball didnt purr - '+response);

response = snuffles.hello()
assert(response==='Snowball says hi', 'snowball said hi - '+response);

response = lady.pet();
assert(response==='Lady purrs', 'lady default response was '+response);