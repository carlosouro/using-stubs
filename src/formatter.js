var Matchers = require('./Matchers');
var functionFactory = require('./function-wrapper');
matchers = new Matchers();

module.exports = global.usingPackage.factory(function(pub, prot){

  prot.construct = function(originalObject){
    prot.originalObject = originalObject;
  }

  prot.scope = function(){
    var cMatcher = this;

    if(this === prot.originalObject) cMatcher = Matchers.sameContext(prot.originalObject)
    else if(this instanceof prot.scope || this["using:wrapper:instance"]===functionFactory.check) cMatcher = matchers.newInstance;

    return {
      context:cMatcher,
      args: Array.prototype.slice.call(arguments)
    }
  }

});