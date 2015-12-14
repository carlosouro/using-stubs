//keep global.using
var globals = global.using;

var objectStack = require('./objectStack');
var requireStack = require('./requireStack');
var PropertyHook = require('./PropertyHook');
var helpers = require('./helpers');

//ObjectHook factory
module.exports = globals.pack.factory(function(pub, prot, unfold){

	prot.construct = function(obj, using){
		prot.obj = objectStack(obj);
		prot.using = using;
	}

	prot.scope = function(prop){
		return new PropertyHook(prot.obj.reference, prop, prot.using, prot.name);
	}

	pub.restore = function(){
		prot.obj.remove(prot.using);
	}

	prot.prepare = function(name){
		prot.name = name;
		prot.reqObject = requireStack.byRef(prot.obj.reference);
	}

	pub.instance = function(c, m, s){

		if(!prot.reqObject){
			throw new Error("using-stubs: Class instance overrides only works for using.require(ClassModule)");
		}

		var ref = prot.reqObject.temporaryInstanceHook.reference;

		//get expect params
		var opts = helpers.expectParams(ref, c, m, s, true);
		//tell req to accept new instance under this owner
		prot.reqObject.saveInstance(prot.using, opts);

		return ref;
	}

  pub.factory = function(c, m, s){

    if(!prot.reqObject){
      throw new Error("using-stubs: Factory overrides only works for using.require(FactoryModule)");
    }

    var ref = prot.reqObject.temporaryFactoryHook.reference;

    //get expect params
    var opts = helpers.expectParams(ref, c, m, s, true);
    //tell req to accept new factory under this owner
    prot.reqObject.saveFactory(prot.using, opts);

    return ref;
  }

	//verify everything
  prot.verify = function(msg){
  	prot.obj.verify(prot.using, msg);
  }

});