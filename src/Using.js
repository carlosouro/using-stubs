//external
var nature = require('nature-js');
var callerId = require('caller-id');

//create using package for protected references access
global.usingPackage = nature.createPackage();

//internal deps
var Matchers = require('./Matchers');
var propertyRuleFactory = require('./rule-property');
var functionRuleFactory = require('./rule-function');
var requireRuleFactory = require('./rule-require')
var functionFactory = require('./function-wrapper');


module.exports = global.usingPackage.from(Matchers).factory(function(pub, prot, unfold){

  //require('using')() construct
  prot.construct = function(){}

  //active rules
  prot.rules = [];

  //using(obj, prop)
  prot.scope = function(){

    var obj, prop, isFunction=false;

    //validation
    //console.log(arguments)
    switch(arguments.length){
      // using(fn)
      case 1:
        obj = arguments[0];
        isFunction = true;

        if(obj["using:wrapper:check"]!==functionFactory.check){
          throw new Error("The use of using(fn) requires a valid function parameter returned in a .follow() scope;");
        }

        break;
      //using(obj, prop)
      case 2:
        obj = arguments[0];
        prop = arguments[1];
        //check object/function
        if(!obj || ['function', 'object'].indexOf(typeof obj)===-1){
          throw new Error("Invalid object/function given to listen to on using(obj, prop);");
        }
        //check property
        if(!prop || typeof prop !== 'string'){
          throw new Error("Invalid property given to listen to on using(obj, prop);");
        }
        break;

      //fail
      default:
        throw new Error("Invalid arguments on using(obj, prop);");
    }

    var rule = isFunction ? functionRuleFactory(pub, obj) : propertyRuleFactory(pub, obj, prop);
    prot.rules.push(rule); //save rule for destroying later

    return rule;
  }

  //using.require()
  pub.require = function(module){
    var rule = requireRuleFactory(pub, module, callerId.getData().filePath);
    prot.rules.push(rule);
    return rule;
  }

  //destroy all existing rules and object links
  pub.clean = function(){
    prot.rules.reverse().forEach(function(r){
      unfold(r).destroy();
    });

    prot.rules = [];
  }

  //destroy all rules matching given parameters
  prot.destroyRules = function(identifiers){

    prot.rules = prot.rules.reverse().filter(function(r){
      var ruleProt = unfold(r), el;

      //if any doesn't match keep the item untouched
      for(el in identifiers){
        if(identifiers[el]!==ruleProt.identifiers[el]){
          return true;
        }
      }

      //if all match remove the item
      ruleProt.destroy();
      return false;

    }).reverse();

  }
});

//remove trace of global.usingPackage
delete global.usingPackage;
