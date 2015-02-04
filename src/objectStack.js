//keep global.using
var globals = global.using;

var helpers = require('./helpers');

//objectStack pub
//[reference:obj, objHooks:[{scope:Using, hook:objectHook}], props:{'prop':{originalValue:val, hooks:[{scope:Using, hook:propertyHook}, ...]}}
var objectStack = [];

//stack object
var StackElement = globals.pack.create(function(pub, prot, unfold){

	prot.construct = function(obj){
		pub.reference = obj;
		pub.target = obj;
	}

	pub.props = {};
	pub.objHooks = [];

	//returns a stored objectHook for this owner
	pub.getObjHook =function(owner){
		var index = pub.getObjHookIndex(owner);
		if(typeof index !== 'undefined') return pub.objHooks[index].hook;

		//otherwise create new
		var hook = unfold(owner).createObjectHook(pub.reference);
		pub.objHooks.push({
			scope:owner,
			hook: hook
		});
		return hook;
	}
	pub.getObjHookIndex = function(owner){
		var i = pub.objHooks.length;
		while(i--){
			if(pub.objHooks[i].scope === owner) return i;
		}
	}

	pub.remove =function(owner){
		//remove props
		Object.keys(pub.props).forEach(function(e){
			pub.removeProp(owner, e);
		});
		//remove objectHooks
		pub.objHooks = pub.objHooks.filter(function(e){
			if(e.scope === owner) return false;
			return true;
		})
	}

	pub.verify =function(owner){
		Object.keys(pub.props).forEach(function(e){
			pub.verifyProp(owner, e);
		});
	}

	pub.setupPropHook =function(owner, prop, hook){

		//may or may not be the same reference
		//in case it is not - keep pub.reference clean
		if(pub.target!==pub.reference) {
			delete pub.reference[prop];
		}

		//create if it doesn't exist
		if(!pub.props[prop]) {
			pub.props[prop] = {
				originalValue : helpers.originalValueFor(pub.target, prop),
				hooks:[]
			}
		}

		var hooks = pub.props[prop].hooks;
		//add hook
		hooks.push({
			scope:owner,
			hook: hook
		});
		//assign callback
		pub.target[prop] = function(){
			var i = hooks.length, hook, ret, args = Array.prototype.slice.call(arguments);
			//run all propertyHooks
			while(i--){
				hook = hooks[i].hook;
				ret = unfold(hook).run(this, args);	//run match/stub
				//if there was a stub
				//stop running and return it
				if(ret!==globals.STUB_NOT_HIT) {
					return ret;
				}
			}
			//no stub was hit - run the originalValue
			var originalValue = pub.props[prop].originalValue;

			//original value may not be a function
			if(typeof originalValue !== 'function') return undefined;
			return originalValue.apply(this, args);
		}
	}

	pub.removeProp =function(owner, prop){
		//we dont actually remove a prop, but all hooks in that prop referent to this owner
		var propDef = pub.props[prop];
		if(propDef){
			propDef.hooks = propDef.hooks.filter(function(e){
				if(e.scope === owner) return false;
				return true;
			});

			//if there are no more hooks - restore original prop
			if(propDef.hooks.length===0){
				//re-assign original value
				helpers.restoreOrigValue(pub.target, prop, propDef.originalValue);
				//delete prop
				delete pub.props[prop];
			}
		}

	}

	pub.verifyProp =function(owner, prop){
		//verify all propertyHooks of this owner
		var props = pub.props[prop];
		if(props){
			props.hooks.forEach(function(e){
				if(e.scope === owner){
					unfold(e.hook).validate();
				}
			})
		}
	}

	pub.assignTarget =function(target){
		if(pub.target === target) return; //nothing to do

		//copy necessary stuff over to new target
		Object.keys(pub.props).forEach(function(el){
			pub.props[el].originalValue = helpers.originalValueFor(target, el);	//keep new originalValue
			target[el] = pub.target[el]; //assign parser
		});

		//assign new target
		pub.target = target;
	}

});

//public method - get or create element
module.exports = function(obj){
	var i=objectStack.length;
	while(i--){
		if(objectStack[i].reference === obj) return objectStack[i];
	}

	//create new object
	objectStack.push(new StackElement(obj));

	//return our newly created object
	return objectStack[objectStack.length-1];
}
//restore everything for a owner
module.exports.restore = function(owner){
	objectStack.forEach(function(e){
		e.remove(owner);
	});
}
//verify everything for an owner
module.exports.verify = function(owner){
	objectStack.forEach(function(e){
		e.verify(owner);
	});
}