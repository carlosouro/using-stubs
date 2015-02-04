//keep global.using
var globals = global.using;

var objectStack = require('./objectStack');
var PropertyHook = require('./PropertyHook');

//ObjectHook factory
module.exports = globals.pack.factory(function(pub, prot, unfold){

	prot.methodStack = []

	prot.construct = function(obj, using){
		prot.obj = objectStack(obj);
		prot.using = using;
	}

	prot.scope = function(prop){
		return new PropertyHook(prot.obj.reference, prop, prot.using);
	}

	pub.restore = function(){
		prot.obj.remove(prot.using);
	}

	pub.instance = function(){
		throw Error('under implementation for 0.0.4');
	}

	//verify everything
  prot.verify = function(msg){
  	prot.obj.verify(prot.using, msg);
  }

});