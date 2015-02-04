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
			var that = this;

			//create a matcher function based on this information
			prot.matcher = function(context, args){

				//different context is an immediate fail
				if(context !== that) return false;

				//args can only be different length in the special case of EVERYTHING_MATCHER
				if(matchers[matchers.length-1]!== globals.EVERYTHING_MATCHER ? args.length!==matchers.length : args.length<matchers.length-1){
					return false;
				}

				//size matches - now let's test each of the matchers
				var i;
				for(i=0; i<args.length; i++){
					if( typeof matchers[i] !== 'function' ? args[i]!==matchers[i] : !matchers[i](args[i]) ){
						return false;
					}
				}

				//all passed - we have a match
				return true;
			}

			//return an internal identifier
			return prot.indentifier;
		}

	}

	//expect method
	pub.expect = function(c, m, s){

		//organise/validate params
		if(c===prot.indentifier){
			if(typeof m === 'function'){
				prot.stub = m;
			} else if(typeof m !== 'undefined'){
				throw new Error("using-stubs: .expect() called with unexpected set of arguments")
			}
		} else if(m===prot.indentifier){
			prot.countsMatcher = c;
			if(typeof s === 'function'){
				prot.stub = s;
			} else if(typeof s !== 'undefined'){
				throw new Error("using-stubs: .expect() called with unexpected set of arguments")
			}
		} else {
			throw new Error("using-stubs: .expect() called with unexpected set of arguments")
		}

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

		}

		return globals.STUB_NOT_HIT; //tells objectStack processor that no stub was processed
	}

	//restore method
	pub.restore = function(){
		//remove expectations
		prot.obj.removeProp(prot.using, prot.prop);
	}

	//verify this one
	prot.validate = function(msg){
		msg = (msg || "using-stubs:")+ " ";
  	if(typeof prot.countsMatcher !== 'undefined' && (typeof prot.countsMatcher === 'function' ? !prot.countsMatcher(prot.counts) : prot.countsMatcher!==prot.counts) ){
  		//test failed
  		throw new Error(msg+"it failed"); //TO-DO - improve default message...
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