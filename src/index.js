var nature = require('nature-js');

//create package for using-stubs (cross-protected access)
global.using = {
	pack : nature.createPackage(),
	EVERYTHING_MATCHER : {},
	PROP_NOT_EXISTENT : {},
	STUB_NOT_HIT : {},
	TARGET_CONTEXT: {},
	NO_MATCH:{}
}

//get main wrapper
require('./Using'); //initialise

//return wrapper instance
module.exports = require('./UsingWrapper')();

//cleanup global
delete global.using;