var Cat = require('./subfolder/Cat');
var assert = require('assert');
var furrball = new Cat("Furrball");

//pre-restore should be overriden
var response = furrball.pet("hard");
assert(response==='Furrball runs away', 'furrball did not runs away - '+response);

module.exports = function(){
	//run default tests
	require('./test-class-default-tests-runner')(furrball, Cat);
}