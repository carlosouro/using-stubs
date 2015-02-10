//keep global.using
var globals = global.using;

var helpers = require('./helpers');

//objectStack pub
//[reference:obj, objHooks:[{owner:Using, hook:objectHook}], props:{'prop':{originalValue:val, hooks:[{owner:Using, hook:propertyHook}, ...]}}
var objectStack = [];

//stack object
var StackElement = globals.pack.create(function(pub, prot, unfold){

	prot.construct = function(obj){
		pub.reference = obj;
		pub.originalTarget = obj;
		pub.instances = [obj];
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
			if(pub.objHooks[i].owner === owner) return i;
		}
	}

	pub.remove =function(owner){
		//remove props
		Object.keys(pub.props).forEach(function(e){
			//remove instances (stubs) references
			pub.props[e].instanceValues = [];
			//restore property
			pub.removeProp(owner, e);
		});
		//remove objectHooks
		pub.objHooks = pub.objHooks.filter(function(e){
			if(e.owner === owner) return false;
			return true;
		})
	}

	pub.verify =function(owner){
		Object.keys(pub.props).forEach(function(e){
			pub.verifyProp(owner, e);
		});
	}

	pub.setupPropHook =function(owner, prop, hook){

		//create if it doesn't exist
		if(!pub.props[prop]) {
			pub.props[prop] = {
				originalValue : helpers.originalValueFor(pub.originalTarget, prop),
				instanceValues: [],
				hooks:[]
			}
		}

		//add hook
		pub.props[prop].hooks.push({
			owner:owner,
			hook: hook
		});

		//create new callback
		var callback = prot.createCallback(prop);

		//assign callback (all targets)
		pub.instances.forEach(function(o){
			o[prop] = callback;
		});

	}

	prot.createCallback = function(prop){

		var hooks = pub.props[prop].hooks;

		//check if already assigned
		if(!pub.props[prop].callback) {
			//create new callback
			pub.props[prop].callback = function(){
				var i = hooks.length, hook, ret, args = Array.prototype.slice.call(arguments);
				//run all propertyHooks
				while(i--){
					hook = hooks[i].hook;
					ret = unfold(hook).run(this, args);	//run match/stub
					//if there was a stub
					//stop running and return it
					if(ret!==globals.NO_MATCH && ret!==globals.STUB_NOT_HIT) {
						return ret;
					}
				}
				//no stub was hit - run the originalValue of this instance
				var originalValue = prot.getOriginalValueForInstance(this, prop);

				//original value may not be a function
				if(typeof originalValue !== 'function') return undefined;
				return originalValue.apply(this, args);
			}
		}
		//return callback
		return pub.props[prop].callback;
	}

	prot.getOriginalValueForInstance = function(instance, prop){
		var propertyObj = pub.props[prop];

		var i = propertyObj.instanceValues.length;
		while(i--){
			if(propertyObj.instanceValues[i].instance===instance){
				return propertyObj.instanceValues[i].value
			}
		}

		return propertyObj.originalValue;
	}

	pub.removeProp =function(owner, prop){
		//we dont actually remove a prop, but all hooks in that prop referent to this owner
		var propDef = pub.props[prop];
		if(propDef){
			propDef.hooks = propDef.hooks.filter(function(e){
				if(e.owner === owner) return false;
				return true;
			});

			//if there are no more hooks - restore original prop
			if(propDef.hooks.length===0){

				pub.instances.forEach(function(o){
					//re-assign original value
					helpers.restoreOrigValue(o, prop, prot.getOriginalValueForInstance(o, prop));
				});

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
				if(e.owner === owner){
					unfold(e.hook).validate();
				}
			})
		}
	}

	pub.assignTarget =function(target, original){

		//check if instance is already added instance
		if(pub.instances.indexOf(target)!==-1) return;

		//copy necessary stuff over to new target
		Object.keys(pub.props).forEach(function(el){
			var value = helpers.originalValueFor(target, el);

			if(original) pub.props[el].originalValue = value;	//keep new originalValue
			//keep instance info
			pub.props[el].instanceValues.push({
				instance: target,
				value:value
			})
		});

		//now create an empty prop entry for every target item we don't have yet in case we need it later
		Object.keys(target).forEach(function(el){
			//create if it doesn't exist
			if(!pub.props[el]) {
				var value = helpers.originalValueFor(target, el);
				pub.props[el] = {
					instanceValues : [{instance:target, value:value}],
					originalValue : value,
					hooks:[]
				}
			}
		});

		//assign new target
		if(original) pub.originalTarget = target;

	}

	pub.addInstance = function(instance, original){
		//check if instance is already added instance
		if(pub.instances.indexOf(instance)!==-1) return;

		//copy necessary stuff over to new instance
		Object.keys(pub.props).forEach(function(el){
			instance[el] = pub.props[el].callback; //assign callback
		});

		//add instance to the stack
		pub.instances.push(instance);
	}

	pub.hasTarget = function(target){
		return pub.originalTarget !== pub.reference;
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