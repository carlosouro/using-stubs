//internal
var ruleBase = require('./rule-base');
var Matchers = require('./Matchers');

//class definition
module.exports = global.usingPackage.from(ruleBase).factory(function(pub, prot, unfold){

  //initialisation call
  prot.initialise = function(obj, prop){

    prot.identifiers = {
      reference : obj,
      ruleType: 'property',
      property: prop
    }

    //replace property with our own callback
    prot.previousFn = obj[prop];
    obj[prop] = prot.exec;
  }

  //.like() method
  Object.defineProperty(pub, 'like', {
    configurable:true,
    enumerable:true,
    get: function(){
      delete pub.like;
      delete pub.clean;
      var obj = prot.identifiers.reference;
      var prop = prot.identifiers.property;

      //replace obj.prop() call with prot.matchersGatherer
      var currentFn = obj[prop];
      obj[prop] = prot.matchersGatherer(obj);

      //setup the finish callback
      return function(matcher){
        //save matcher details
        prot.contextMatcher = matcher.context;
        prot.argumentMatchers = matcher.args;

        //reset obj.prop() to internal .exec()
        obj[prop] = currentFn;

        //keep it chainable
        return pub;
      }

    }
  });

  prot.describe = function(){
    var cMatcher=prot.contextMatcher, aMatchers = prot.argumentMatchers;

    var desc = '';
    aMatchers.forEach(function(e, i){
      desc+=(i>0?', ':'')+prot.describeItem(e);
    });

    if(cMatcher===prot.matchers.newInstance){
      return 'new '+prot.describeItem(prot.identifiers.reference)+'.'+prot.identifiers.property+'('+desc+')';
    } else if(cMatcher && cMatcher['using:sameContext']){
      return prot.describeItem(prot.identifiers.reference)+'.'+prot.identifiers.property+'('+desc+');'
    } else {
      return prot.describeItem(prot.identifiers.reference)+'.'+prot.identifiers.property+'.apply('+prot.describeItem(cMatcher)+', ['+desc+']);'
    }
  }

  prot.destroyHook = function(){
    //put back previousFn
    prot.identifiers.reference[prot.identifiers.property] = prot.previousFn;
  }

});