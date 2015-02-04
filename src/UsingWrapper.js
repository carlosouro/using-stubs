//keep global.using
var globals = global.using;

var requireStack = require('./requireStack');
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