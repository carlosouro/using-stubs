var assert = require('assert');

module.exports = function(furrball, Cat){
	//snuffles
	var snuffles = new Cat('Snuffles');

	var response = snuffles.pet();
	assert(response==='Snuffles purrs', 'Snuffles default response was '+response);

	//furrball
	response = furrball.pet("hard");
	assert(response==='Furrball purrs', 'Furrball default response was '+response);
}