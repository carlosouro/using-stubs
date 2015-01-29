//main Using()
var pack, UsingWrapper, Using, ObjectHook, MethodHook;
var nature = require('nature-js');
var mockRequire = require('mock-require');

//finals
var EVERYTHING_MATCHER = {};
var PROP_NOT_EXISTENT = {};

//create package for using-stubs (cross-protected access)
pack = nature.createPackage();

//UsingWrapper - what is returned on exports
//factory that returns a "using" instance
UsingWrapper = pack.factory(function(pub, prot){

	//initializer
	prot.scope = function(){
		return Using();
	}


	//PARAMETER MATCHERS
  pub.typeOf = function(type){
    return function(obj){
    	return typeof(obj)===type;
    }
  }
  pub.instanceOf = function(type){
    return function(obj){
    	return obj instanceof(type);
    }
  }
  pub.everything = EVERYTHING_MATCHER;


  //COUNT MATCHERS
  pub.atLeast = function(i){
    return function(j){
    	return j>=i;
    }
  }
  pub.atMost = function(i){
    return function(j){
    	return j<=i;
    }
  }
  pub.between = function(i,k){
    return function(j){
    	return j>=i && j<=k;
    }
  }

});


//var using = require('using')();
//using instance itself
//using(obj)('method'); returns new MethodHook()
Using = pack.from(UsingWrapper).factory(function(pub, prot, unfold){

	//what running the factory method does (required)
  prot.scope = function(obj){
		return prot.getObjectFor(obj);
	}

	//private variables

	// requireStack {'module':{
	// 	isStub: true/false,
	//	reference: object to use as objectHook reference,
	//	stub: object/function/wtv to stub
	// }}
	prot.requireStack = {};

	//methods for .require scope
	//reference for require property stubbing
	pub.require = function(module){
		var obj = prot.getRequireEntryFor(module);
		return obj.reference;
	}
	//subbing require itself
	pub.require.stub = function(module, replacement){
		var obj = prot.getRequireEntryFor(module);
		obj.isStub = true;
		obj.stub = replacement;
		return obj.reference;
	}
	//restore original module
	pub.require.restore = function(module){
		var obj = prot.getRequireEntryFor(module);
		//stopping mocking
		mockRequire.stop(module);
		//remove
		prot.removeObject(obj.reference);
		delete prot.requireStack[module];
	}

	//internal getter
	prot.getRequireEntryFor = function(module){
		if(prot.requireStack.hasOwnProperty(module)){
			//return existing instance
			return prot.requireStack[module];
		} else {
			//create a new entry
			prot.requireStack[module] = {
				isStub:false,
				reference: {}
			}
			//setup mock
			//TO-DO - setup mock
		}
	}


	//protected methods to handle the objectStack

	// objectStack [objectHook]
	prot.objectStack = [];

	//clean all object entries from stack
	prot.removeObject = function(ref){
		var i = prot.objectStack.length, hookProt;

		while(i--){
			hookProt = unfold(prot.objectStack[i]);

			if(ref === hookProt.obj) {
				hookProt.clean();
				prot.objectStack.splice(i,1);
				break;
			}
		}

	}

	//lookup reference
	prot.getObjectFor = function(ref){
		var ret, i = prot.objectStack.length;
		while(i--){
			if(ref === unfold(prot.objectStack[i]).obj) {
				ret = prot.objectStack[i];
				break;
			}
		}
		//not found - create a new one
		if(!ret){
			ret = ObjectHook(ref, pub);
			prot.objectStack.push(ret);
		}
		return ret;
	}

  //restore everything
  pub.restoreAll = function(){
  	//first clean up require modules
  	var modules = Object.keys(prot.requireStack);
  	modules.forEach(function(module){
  		pub.require.restore(module);
  	});
  	//now for each object
  	prot.objectStack.forEach(function(hook){
  		unfold(hook).clean();
  	})
  	//clean stack references
  	prot.objectStack = [];
  }

  //verify everything
  pub.verify = function(msg){
  	prot.objectStack.forEach(function(hook){
  		unfold(hook).verify(msg);
  	})
  }

});
//ObjectHook factory
ObjectHook = pack.factory(function(pub, prot, unfold){

	prot.methodStack = []

	prot.construct = function(obj, using){
		prot.obj = obj;
		prot.using = using;
	}

	prot.scope = function(prop){
		var hook = new MethodHook(prot.obj, prop, pub);
		prot.methodStack.push(hook);
		return hook;
	}

	prot.removeMethods = function(prop){

		var cleanCache = [];
		prot.methodStack = prot.methodStack.filter(function(hook){
			var hookProt = unfold(hook);
			if(hookProt.prop === prop) {
				cleanCache.push(hookProt);
				return false; //take out from stack
			}
			return true;
		});

		var i = cleanCache.length;
		//reverse is important for methods!
		while(i--){
			cleanCache[i].clean();
		}
	}

	pub.restore = function(){
		unfold(prot.using).removeObject(prot.obj);
	}

	prot.clean = function(){
		var i = prot.methodStack.length;
		//reverse is important for methods!
		while(i--){
			unfold(prot.methodStack[i]).clean();
		}
	}

	//verify everything
  prot.verify = function(msg){
  	prot.methodStack.forEach(function(hook){
  		unfold(hook).verify(msg);
  	})
  }

})

//MethodHook class for expect/restore
MethodHook = pack.create(function(pub, prot, unfold){

	prot.indentifier = {};

	prot.counts = 0;

	//what running the factory method does (required)
	prot.construct = function(obj, prop, objectHook){
		prot.objectHook = objectHook;
		prot.obj = obj;
		prot.prop = prop;

		//replace obj.prop for expect( foo.bar(...) )
		if(prop in obj) {
			prot.originalMethod = obj[prop];
		} else {
			prot.originalMethod = PROP_NOT_EXISTENT
		}

		//our expect( foo.bar(...) )
		obj[prop] = function(){
			var matchers = Array.prototype.slice.call(arguments);
			var that = this;

			//create a matcher function based on this information
			prot.matcher = function(context, args){

				//different context is an immediate fail
				if(context !== that) return false;

				//args can only be different length in the special case of EVERYTHING_MATCHER
				if(matchers[matchers.length-1]!==EVERYTHING_MATCHER ? args.length!==matchers.length : args.length<matchers.length-1){
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

		var stub;

		//organise/validate params
		if(c===prot.indentifier){
			if(typeof m === 'function'){
				stub = m;
			} else if(typeof m !== 'undefined'){
				throw new Error("using-stubs: .expect() called with unexpected set of arguments")
			}
		} else if(m===prot.indentifier){
			prot.countsMatcher = c;
			if(typeof s === 'function'){
				stub = s;
			} else if(typeof s !== 'undefined'){
				throw new Error("using-stubs: .expect() called with unexpected set of arguments")
			}
		} else {
			throw new Error("using-stubs: .expect() called with unexpected set of arguments")
		}

		//replace our function
		prot.obj[prot.prop] = function(){
			var args = Array.prototype.slice.call(arguments), stubbed = false;

			//does it match?
			if(prot.matcher(this, args)){
				//match!
				prot.counts++;

				if(stub) {
					stub.apply(this, args);
					stubbed = true;
				}

			}

			//relay to originalMethod
			if(!stubbed && typeof(prot.originalMethod)==='function') prot.originalMethod.apply(this, args);
		}

	}

	//restore method
	pub.restore = function(){
		//remove expectations
		unfold(prot.objectHook).removeMethods(prot.prop);
	}

	prot.clean = function(){
		//restore value
		if(prot.originalMethod===PROP_NOT_EXISTENT){
			delete prot.obj[prot.prop];
		} else {
			prot.obj[prot.prop] = prot.originalMethod;
		}
	}

	//verify all
	prot.verify = function(msg){
		msg = (msg || "using-stubs:")+ " ";
  	if(typeof prot.countsMatcher !== 'undefined' && (typeof prot.countsMatcher === 'function' ? !prot.countsMatcher(prot.counts) : prot.countsMatcher!==prot.counts) ){
  		//test failed
  		throw new Error(msg+"it failed"); //TO-DO - improve default message...
  	}
  }

});


module.exports = UsingWrapper();