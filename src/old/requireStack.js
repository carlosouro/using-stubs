//keep global.using
var globals = global.using;

//require mocking (originally from https://github.com/boblauer/mock-require)
var Module           = require('module')
  , dirname          = require('path').dirname
  , join             = require('path').join
  , originalLoader   = Module._load
  ;

var objectStack = require('./objectStack');
var InstanceHook = require('./InstanceHook');

//helper
function getFullPath(path, calledFrom) {
  try {
    path = require.resolve(path);
  } catch(e) {
  	path = join(dirname(calledFrom), path);
    path = Module._resolveFilename(path);
  }

  return path;
}


//{'modulePath': {reference:{}, stubs:[{stub:stub, owner:obj}, ...], constructors:[{hook:instanceHook, owner:obj}, ...]}
var intercept = {};

//replace Module._load with our own

//Note: This is ugly, I know.
//I wish node/commonJS had some standard (non-hack)
//way of achieving require overrides.

Module._load = function(request, parent) {
	var fullFilePath = Module._resolveFilename(request, parent);

	if (!intercept.hasOwnProperty(fullFilePath)) {
		//use regular require
		return originalLoader.apply(this, arguments);
	}

	//override with our own
	var content = intercept[fullFilePath], stackObject = objectStack(content.reference);

	//use original require or latest stub
	var obj, original = false;
	if(content.stubs.length>0){
		//replace with a stub
		obj = content.stubs[content.stubs.length-1].reference
	} else {
		//get real require
		obj = originalLoader.apply(this, arguments);

		original = true;
	}

	//save our target as original object
	stackObject.assignTarget(obj, original);

	//classes management
	if(content.constructors.length>0){
		var origConstructor = obj;
		obj = function(){
			var args = Array.prototype.slice.call(arguments);

			var i = -1;
			var match, constructor, hook;

			if(content && content.constructors.length>0){

				i = content.constructors.length

				//direction is relevant!
				while(i--){

					hook = content.constructors[i].hook;
					match = hook.run(args);	//run match/stub

					//if no match carry on
					if(match===globals.NO_MATCH) continue;

					//only 1 match allowed
					break;
				}

			}

			//copy all prototype content
			var scope = this;
			Object.keys(origConstructor.prototype).forEach(function(k){
				scope[k] = origConstructor.prototype[k];
			});

			//no matches
			if(i === -1 || match===globals.STUB_NOT_HIT){
				//save original constructor
				constructor = origConstructor;
			} else {
				constructor = match;

				Object.keys(constructor.prototype).forEach(function(k){
					scope[k] = constructor.prototype[k];
				});
			}



			//run constructor
			constructor.apply(this, args);

			//apply objectstacks - order is important
			if(i !== -1) {
				var obj = content.constructors[i].reference;
				var stackObject = objectStack(obj);
				//assign this as the original object
				stackObject.assignTarget(this, true);
				stackObject.addInstance(this, true);
			}

		}
	}

	//merge object with our stubs
	stackObject.addInstance(obj);

	//return object
	return obj;
};

//helper
function getElement(fullpath){
	//create if doesn't exist
	if(!intercept[fullpath]){
		intercept[fullpath] = {
			reference:function(){
				//this method server as setup base for "new reference()" for classes
				var args = Array.prototype.slice.call(arguments);

				var self = intercept[fullpath];
				self.temporaryInstanceHook = new InstanceHook(this, args);
			},
			saveInstance: function(owner, opts){

				//add opts to hook
				this.temporaryInstanceHook.countsMatcher = opts.countsMatcher;
				this.temporaryInstanceHook.stub = opts.stub;

				//save
				this.constructors.push({
					reference:this.temporaryInstanceHook.reference,
					owner:owner,
					hook: this.temporaryInstanceHook
				});

				//remove cache
				delete this.temporaryInstanceHook;
			},
			constructors:[],
			stubs:[],
			stub:function(reference, owner){
				if(!module||!reference||!owner) throw Error('using-stubs: internal requireStack.stub() unexpected params');
				this.stubs.push({
					reference:reference,
					owner:owner
				});
			},
			remove:function(owner){
				//remove stubs
				this.stubs = this.stubs.filter(function(e){
					if(e.owner === owner) return false;
					return true;
				});
				//remove constructors
				this.constructors = this.constructors.filter(function(e){
					if(e.owner === owner) {
						//remove relevant objectStack instance stuff
						objectStack(e.reference).remove(owner);
						return false;
					}
					return true;
				});
				//remove relevant objectStack stuff
				objectStack(this.reference).remove(owner);
			}
		}
	}

	return intercept[fullpath];
}

module.exports = function(module, callerFilePath){
	return getElement(getFullPath(module, callerFilePath));
}
module.exports.byRef = function(reference){
	var keys = Object.keys(intercept), i = keys.length;
	while(i--){
		if(intercept[keys[i]].reference === reference){
			return intercept[keys[i]];
		}
	}
	return false;
}
module.exports.restore = function(owner){
	Object.keys(intercept).forEach(function(path){
		intercept[path].remove(owner);
	});
}