//keep global.using
var globals = global.using;
var objectStack = require("./objectStack");
var helpers = require('./helpers');

//

//PropertyHook class for expect/restore
module.exports = globals.pack.create(function(pub, prot, unfold){

	prot.indentifier = {};

	prot.counts = 0;

	//what running the factory method does (required)
	prot.construct = function(obj, prop, using, objectName){
		prot.objectName = objectName;
		prot.using = using;
		prot.obj = objectStack(obj);
		prot.prop = prop;
		prot.ref = obj;
		prot.preExpectValue = helpers.originalValueFor(obj, prop);

		//our expect( foo.bar(...) )
		obj[prop] = function(){
			prot.argMatchers = Array.prototype.slice.call(arguments);

			//define target context
			if(this === obj){
				prot.contextMatcher = globals.TARGET_CONTEXT;
			} else {
				prot.contextMatcher = this;
			}

			//create a matcher function based on this information
			prot.matcher = function(context, args){

				//CONTEXT MATCHING
				//let's check if we are targetting an instance
				if(prot.contextMatcher===globals.TARGET_CONTEXT){
					if(prot.obj.instances.indexOf(context)===-1) return false;

				//let's see if we have a literal match
				} else if(context !== prot.contextMatcher){
					//otherwise let's check if this is a function matcher and if it matches
					if(typeof prot.contextMatcher !== 'function') return false;
					if(!prot.contextMatcher(context)) return false;
				}

				//match arguments
				return helpers.argsMatcher(args, prot.argMatchers);

			}

			//return an internal identifier
			return prot.indentifier;
		}

	}

	//expect method
	pub.expect = function(c, m, s){

		//organise/validate params
		var opts = helpers.expectParams(prot.indentifier, c, m, s);

		if(opts.noPattern) {
			prot.noPattern = true;
			return pub.expect(opts.countsMatcher, prot.ref[prot.prop](prot.using.everything), opts.stub);
		}

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
  	if(typeof prot.countsMatcher === 'function' ? !prot.countsMatcher(prot.counts) : prot.countsMatcher!==prot.counts ){
  		//test failed
  		throw new Error((msg || "using-stubs: verify() failed")+'\n\n'+prot.describe()+'\n\nCalled '+prot.counts+' times'); //TO-DO - improve default message...
  	}
  }

  prot.describe = function(){

  	var counts;
  	//countsMatcher
  	if(prot.isFail) {
  		counts = '';
  	} else {
  		counts = helpers.describeItem(prot.countsMatcher);
  	}

  	//methodPattern
  	var method = '';
  	if(!prot.noPattern){
  		method += prot.objectName+'.'+prot.prop;
  		if(prot.contextMatcher!==globals.TARGET_CONTEXT){
  			method+='.call('+helpers.describeItem(prot.contextMatcher);
  		} else {
  			method+='(';
  		}

  		prot.argMatchers.forEach(function(el, i){
  			//,
  			if(i!==0 || prot.contextMatcher!==globals.TARGET_CONTEXT) method+=', '
  			//content
	  		method+=helpers.describeItem(el, true);
	  	});

	  	method+=')';
  	}

  	//stub
		var stub = !prot.isFail && prot.stub ? '[stubFn]' : '';

		//formatting
		var needsFormatting = method || (!prot.isFail && counts && stub);

		var desc = "using("+prot.objectName+")('"+prot.prop+"')."; //using(foo)('bar').
		desc += (prot.isFail?'fail':'expect')+"(";	//expect( || fail(
		if(!prot.isFail){
			desc += counts ? (needsFormatting ? '\n\t' : '')+counts : ''; //\n\t2
			desc += method || stub ? ',' : ''; //,
		}
		if(!prot.noPattern){
			desc += method ? (needsFormatting ? '\n\t' : '')+method : ''; //\n\t2
			desc += stub ? ',' : ''; //,
		}
		desc += stub ? (needsFormatting ? '\n\t' : '')+stub : ''; //\n\t2

		desc+=(needsFormatting ? '\n' : '')+')'; //)

  	return desc;
  }

  //verify property
	pub.verify = function(msg){
		prot.obj.verifyProp(prot.using, prot.prop);
  }

  pub.fail = function(ref){
  	if(!ref) prot.noPattern = true;
  	prot.isFail = true;
  	pub.expect(0, ref || prot.ref[prot.prop].call(prot.using.anything, prot.using.everything));
  }

  pub.stub = function(ref, stub){
  	if(!stub) {
  		stub = ref;
  		ref = undefined;
  		prot.noPattern = true;
  	}
  	pub.expect(globals.MATCH_ALL_COUNTS, ref || prot.ref[prot.prop].call(prot.using.anything, prot.using.everything), stub);
  }

});