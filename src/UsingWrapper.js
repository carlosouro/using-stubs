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
  pub.typeOf = function(type, customDescription){
    function typeOf(obj){
    	return typeof(obj)===type;
    }
    typeOf['using:explanation'] = customDescription ? customDescription : 'using.typeOf('+type+')';
    return typeOf;
  }
  pub.instanceOf = function(type, customDescription){
    function instanceOf(obj){
    	return obj instanceof(type);
    }
    instanceOf['using:explanation'] = customDescription ? customDescription : 'using.instanceOf([Function])';
    return instanceOf;
  }
  pub.everything = globals.EVERYTHING_MATCHER;
  pub.aString = pub.typeOf('string', 'using.aString');
  pub.aNumber = pub.typeOf('number', 'using.aNumber');
  pub.aBoolean = pub.typeOf('boolean', 'using.aBoolean');
  pub.aFunction = pub.typeOf('function', 'using.aFunction');

  pub.aStringLike = function(regex){
  	function stringLike(str){
  		return typeof str === 'string' && str.match(regex);
  	}
  	stringLike['using:explanation'] = 'using.aStringLike('+regex.toString()+')';
  	return stringLike;
  }

  pub.anInt = function(integer){
  	return typeof integer === 'number' && integer.toString().indexOf('.')===-1;
  }
  pub.anInt['using:explanation'] = 'using.anInt';

  pub.anObject = function(obj){
  	return typeof obj === 'object' && obj!==null;
  }
  pub.anObject['using:explanation'] = 'using.anObject';

  pub.anObjectLike = function(base, strict){
  	function objectLike(obj){
  		return deepEqual(obj, base, {strict:strict});
  	}
  	objectLike['using:explanation'] = 'using.anObjectLike('+JSON.stringify(base)+(strict!==undefined?','+strict:'')+')';
  	return objectLike;
  }

  pub.something = function(obj){
  	return typeof obj !== 'undefined';
  }
  pub.something['using:explanation'] = 'using.something';

  pub.anything = function(){return true;}
  pub.anything['using:explanation'] = 'using.anything';


  //COUNT MATCHERS
  pub.atLeast = function(i){
    function atLeast(j){
    	return j>=i;
    }
    atLeast['using:explanation'] = 'using.atLeast('+i+')';
    return atLeast;
  }
  pub.atMost = function(i){
    function atMost(j){
    	return j<=i;
    }
    atMost['using:explanation'] = 'using.atMost('+i+')';
    return atMost;
  }
  pub.between = function(i,k){
    function between(j){
    	return j>=i && j<=k;
    }
    between['using:explanation'] = 'using.between('+i+','+k+')';
    return between;
  }

});