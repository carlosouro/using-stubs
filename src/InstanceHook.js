//keep global.using
var globals = global.using;

var helpers = require('./helpers');

//ObjectHook factory
module.exports = globals.pack.create(function(pub, prot, unfold){

	prot.counts = 0;

	prot.construct = function(obj, matchers){
		pub.reference = obj;

		//create a matcher function based on this information
		prot.matcher = function(args){
			return helpers.argsMatcher(args, matchers);
		}
	}

	pub.run = function(args){
		//does it match?
		if(prot.matcher(args)){
			//match!
			prot.counts++;

			if(pub.stub) {
				return pub.stub;
			}

			return globals.STUB_NOT_HIT; //tells objectStack processor that no stub was processed

		}

		return globals.NO_MATCH; //tells objectStack processor that no stub was processed
	}

});