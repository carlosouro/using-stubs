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
  var needsFullPath = true
    , resolvedPath
    , isExternal
    ;

  try {
    resolvedPath = require.resolve(path);
    isExternal = resolvedPath.indexOf('/node_modules/') !== -1;

    needsFullPath = resolvedPath !== path && !isExternal;

    if (isExternal) {
      path = resolvedPath;
    }
  } catch(e) { }

  if (needsFullPath) {
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
			if(content && content.constructors.length>0){
				var i;
				//direction is relevant!
				for(i=0; i<content.constructors.length; i++){
					hook = content.constructors[i].hook;
					ret = hook.run(args);	//run match/stub

					//if no match carry on
					if(ret===globals.NO_MATCH) continue;

					//if there was a stub
					//run constructor
					if(ret!==globals.STUB_NOT_HIT) ret.apply(this, args);

					//found a match, let's apply our overrides
					objectStack(content.constructors[i].reference).addInstance(this);

					//if there was a stub
					//stop running and return it
					if(ret!==globals.STUB_NOT_HIT) return this;
				}

				//no matches
				if(i===content.constructors.length){
					//run original constructor
					obj.apply(this, args);
				}
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
				if(intercept[fullpath] && intercept[fullpath].transitionalInstanceState){
					//new instance setup - save the hook for re-use in instance() expect params
					intercept[fullpath].transitionalInstanceState = intercept[fullpath].setupInstance(this, args, intercept[fullpath].transitionalInstanceState);

				} else {
					throw new Error("using-stubs: unexpected mock contructor - use only with using(Class).instance(new Class());")
				}
			},
			setupInstance: function(reference, args, owner){
				var instanceHook = new InstanceHook(reference, args);
				this.constructors.push({
					reference:reference,
					owner:owner,
					hook: instanceHook
				});
				return instanceHook;
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
				this.stubs = this.constructors.filter(function(e){
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