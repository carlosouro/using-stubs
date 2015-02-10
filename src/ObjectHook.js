//keep global.using
var globals = global.using;

var objectStack = require('./objectStack');
var requireStack = require('./requireStack');
var PropertyHook = require('./PropertyHook');

//ObjectHook factory
module.exports = globals.pack.factory(function(pub, prot, unfold){

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

	//class instances
	Object.defineProperty(pub, "instance", {
	  enumerable: true,
	  configurable: false,
	  get: function(){
	  	var req = requireStack.byRef(prot.obj.reference);

	  	if(!req){
	  		throw new Error("using-stubs: Class instance overrides only works for using.require(ClassMosule)");
	  	}

	  	//set expectation/owner for requirestack to know it is about to get a new instance setup in this scope
			req.transitionalInstanceState = prot.using;

			//return our instance "expect"
			return function(c, m, s){
				//get hook
				var hook = req.transitionalInstanceState;
				//back to default
				delete req.transitionalInstanceState;
				//get expect params
				var opts = helpers.expectParams(hook.reference, c, m, s, true);
				hook.countsMatcher = opts.countsMatcher;
				hook.stub = opts.stub;

				//return instance
				return instance;
			};
		}
	});

	//verify everything
  prot.verify = function(msg){
  	prot.obj.verify(prot.using, msg);
  }

});