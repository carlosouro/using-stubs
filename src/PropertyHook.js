//keep global.using
var globals = global.using;
var objectStack = require("./objectStack");
var helpers = require('./helpers');

//PropertyHook class for expect/restore
module.exports = globals.pack.create(function(pub, prot, unfold){

	prot.indentifier = {};

	prot.counts = 0;

	//what running the factory method does (required)
	prot.construct = function(obj, prop, using){
		prot.using = using;
		prot.obj = objectStack(obj);
		prot.prop = prop;
		prot.ref = obj;
		prot.preExpectValue = helpers.originalValueFor(obj, prop);

		//our expect( foo.bar(...) )
		obj[prop] = function(){
			var matchers = Array.prototype.slice.call(arguments);
			//define target context
			var targetContext = this === obj ? globals.TARGET_CONTEXT : this;

			//create a matcher function based on this information
			prot.matcher = function(context, args){

				//different context is an immediate fail
				if(targetContext===globals.TARGET_CONTEXT ? prot.obj.instances.indexOf(context)===-1 : context !== targetContext) {
					return false;
				}

				return helpers.argsMatcher(args, matchers);

			}

			//return an internal identifier
			return prot.indentifier;
		}

	}

	//expect method
	pub.expect = function(c, m, s){

		//organise/validate params
		var opts = helpers.expectParams(prot.indentifier, c, m, s);
		prot.countsMatcher = opts.countsMatcher;
		prot.stub = opts.stub;

		//replace our function
		helpers.restoreOrigValue(prot.ref, prot.prop, prot.preExpectValue);
		prot.obj.setupPropHook(prot.using, prot.prop, pub);

	}

	prot.run = function(context, args){

		//does it match?
		if(prot.matcher(context, args)){
			//match!
			prot.counts++;

			if(prot.stub) {
				return prot.stub.apply(context, args);
			}

			return globals.STUB_NOT_HIT; //tells objectStack processor that no stub was processed
		}

		return globals.NO_MATCH; //tells objectStack processor that didn't match
	}

	//restore method
	pub.restore = function(){
		//remove expectations
		prot.obj.removeProp(prot.using, prot.prop);
	}

	//verify this one
	prot.validate = function(msg){
  	if(typeof prot.countsMatcher !== 'undefined' && (typeof prot.countsMatcher === 'function' ? !prot.countsMatcher(prot.counts) : prot.countsMatcher!==prot.counts) ){
  		//test failed
  		throw new Error(msg || "using-stubs: verify() failed"); //TO-DO - improve default message...
  	}
  }

  //verify property
	pub.verify = function(msg){
		prot.obj.verifyProp(prot.using, prot.prop);
  }

  pub.fail = function(){
  	pub.expect(0, prot.ref[prot.prop](prot.using.everything));
  }

});