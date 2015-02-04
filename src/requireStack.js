//keep global.using
var globals = global.using;

//require mocking (originally from https://github.com/boblauer/mock-require)
var Module           = require('module')
  , dirname          = require('path').dirname
  , join             = require('path').join
  , originalLoader   = Module._load
  ;

var objectStack = require('./objectStack');

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


//{'modulePath': {reference:{}, stubs:[{stub:stub, owner:obj}, ...]}
var intercept = {};

//replace Module._load with our own
Module._load = function(request, parent) {
	var fullFilePath = Module._resolveFilename(request, parent);

	if (!intercept.hasOwnProperty(fullFilePath)) {
		//use regular require
		return originalLoader.apply(this, arguments);
	}

	//override with our own
	var content = intercept[fullFilePath];

	//use original require or latest stub
	var obj = content.stubs.length>0 ? content.stubs[content.stubs.length-1] : originalLoader.apply(this, arguments);

	//merge object with our stubs
	objectStack(content.reference).assignTarget(obj);

	//return object
	return obj;
};

//helper
function getElement(fullpath){
	//create if doesn't exist
	if(!intercept[fullpath]){
		intercept[fullpath] = {
			reference:{},
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
module.exports.restore = function(owner){
	Object.keys(intercept).forEach(function(obj){
		obj.remove(owner);
	});
}