//keep global.using
var globals = global.using;

var requireStack = require('./requireStack');
var deepEqual = require('deep-equal');
var Using;

//UsingWrapper
//factory that returns a "using" instance
module.exports = globals.pack.factory(function(pub, prot){

	prot.construct = function(){
		Using = require('./Using');
	}

	//initializer
	prot.scope = function(){
		return Using(pub);
	}


	//PARAMETER MATCHERS
  pub.typeOf = function(type){
    return function(obj){
    	return typeof(obj)===type;
    }
  }
  pub.instanceOf = function(type){
    return function(obj){
    	return obj instanceof(type);
    }
  }
  pub.everything = globals.EVERYTHING_MATCHER;
  pub.aString = pub.typeOf('string');
  pub.aNumber = pub.typeOf('number');
  pub.aBoolean = pub.typeOf('boolean');
  pub.aFunction = pub.typeOf('function');

  pub.aStringLike = function(regex){
  	return function(str){
  		return typeof str === 'string' && str.match(regex);
  	}
  }
  pub.anInt = function(integer){
  	return typeof integer === 'number' && integer.toString().indexOf('.')===-1;
  }
  pub.anObject = function(obj){
  	return typeof obj === 'object' && obj!==null;
  }
  pub.anObjectLike = function(base, strict){
  	return function(obj){
  		return deepEqual(obj, base, {strict:strict});
  	}
  }
  pub.something = function(obj){
  	return typeof obj !== 'undefined';
  }
  pub.anything = function(){return true;}


  //COUNT MATCHERS
  pub.atLeast = function(i){
    return function(j){
    	return j>=i;
    }
  }
  pub.atMost = function(i){
    return function(j){
    	return j<=i;
    }
  }
  pub.between = function(i,k){
    return function(j){
    	return j>=i && j<=k;
    }
  }

});