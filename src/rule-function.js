//internal
var ruleBase = require('./rule-base');

//class definition
module.exports = global.usingPackage.from(ruleBase).factory(function(pub, prot, unfold){

  //initialisation call
  prot.initialise = function(obj){

    prot.identifiers = {
      reference : obj,
      ruleType: 'function'
    }

    //call rule injection mechanism on wrapper function
    prot.objProt = unfold(obj);
    prot.previousFn = prot.objProt.exec;
    prot.objProt.exec = prot.exec;
  }

  //.like() method
  Object.defineProperty(pub, 'like', {
    configurable:true,
    enumerable:true,
    get: function(){
      delete pub.like;
      delete pub.clean;

      //replace obj() call with matchersGatherer
      var currentFn = prot.objProt.exec;
      prot.objProt.exec = matchersGatherer;

      //setup the finish callback
      return function(matcher){
        //save matcher details
        prot.contextMatcher = matcher.context;
        prot.argumentMatchers = matcher.args;

        //reset obj() to internal .exec()
        prot.objProt.exec = currentFn;

        //keep it chainable
        return pub;
      }

    }
  });

  prot.destroyHook = function(){

    //put back previousFn
    prot.objProt.exec = prot.previousFn;

    //self destroy
    delete prot.objProt;

  }

});