var globals = global.using;

module.exports.originalValueFor = function(obj, prop){
	if(!obj.hasOwnProperty(prop)) return globals.PROP_NOT_EXISTENT;
	return obj[prop];
}

module.exports.restoreOrigValue = function(obj, prop, origValue){
	if(origValue === globals.PROP_NOT_EXISTENT) {
		delete obj[prop];
	} else {
		 obj[prop] = origValue;
	}
}