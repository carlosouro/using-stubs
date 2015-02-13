//keep global.using
var globals = global.using;

var callerId = require('caller-id');
var objectStack = require('./objectStack');
var objectHook = require('./ObjectHook');
var requireStack = require('./requireStack');

var UsingWrapper = require('./UsingWrapper');

//var using = require('using')();
//using instance itself
//using(obj)('method'); returns new PropertyHook()
module.exports = globals.pack.from(UsingWrapper).factory(function(pub, prot, unfold){

	//what running the factory method does (required)
  prot.scope = function(obj){
  	var obj = objectStack(obj).getObjHook(pub);
  	unfold(obj).prepare();
  	return obj;
	}
	prot.createObjectHook = function(obj){
		return objectHook(obj, pub);
	}

	//REQUIRE STUFF
	//methods for .require scope
	pub.require = function(module){
		return requireStack(module, callerId.getData().filePath).reference;
	}
	//subbing require itself
	pub.require.stub = function(module, replacement){
		var obj = requireStack(module, callerId.getData().filePath);
		obj.stub(replacement, pub);
		return obj.reference;
	}
	//restore original module
	pub.require.restore = function(module){
		var obj = requireStack(module, callerId.getData().filePath);
		obj.remove(pub);
	}


  //restore everything
  pub.restore = function(){
  	requireStack.restore(pub);
  	objectStack.restore(pub);
  }

  //verify everything
  pub.verify = function(msg){
  	objectStack.verify(pub, msg);
  }

});