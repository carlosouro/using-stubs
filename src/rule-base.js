//external
var Stalker = require('stalker-pattern');

//internal
var Matchers = require('./Matchers');
var formatter = require('./formatter');
var functionFactory = require('./function-wrapper');

//instance of matcher for internal use
var matchers = new Matchers();

//class definition
module.exports = global.usingPackage.create(function(pub, prot, unfold){

  //default matchers
  prot.contextMatcher = matchers.anything;
  prot.argumentMatchers = [matchers.everything];

  //matcher references
  prot.matchers = matchers;
  //method replacement for obj.prop() or obj() for matching setup
  prot.matchersGatherer = formatter;

  //random ID
  prot.id = '('+(0|Math.random()*9e6).toString(36)+')';

  //prot.construct()
  prot.construct = function(using){

    prot.using = using;

    //integrate Stalker pattern
    Object.keys(Stalker.prototype).forEach(function(k){
      pub[k]=Stalker.prototype[k];
    })

    Stalker.call(pub, function(t){
      //link trigger
      prot.trigger = t;
    });

    prot.initialise.apply(prot, Array.prototype.slice.call(arguments, 1));
  }

  //method execution
  prot.exec = function(){
    var match = true, ret = undefined, cMatcher=prot.contextMatcher, aMatchers = prot.argumentMatchers;

    //assess context matches
    if(
        this !== cMatcher &&  //not exact match
        cMatcher !== matchers.everything && //not using.everything
        (typeof cMatcher !== 'function' || !cMatcher(this)) && //not valid callback tester
        (cMatcher !== matchers.newInstance || !this instanceof prot.exec) //not new instance
      ){
      match = false;
    }

    //quick fail
    if(
        aMatchers.length>arguments.length && //more matchers then arguments
        aMatchers[arguments.length]!==matchers.everything //does not end with using.everything
      ){
      match = false;
    }


    if(match){

      //assess argument matching loop
      for(var i=0; i<arguments.length; i++){

        //immediately fail if no matcher is provided
        if(!aMatchers[i]) {
          match=false;
          break;
        }

        //immediately match on using.everything
        if(aMatchers[i]===matchers.everything) break;

        //test the matcher itself
        if(
          arguments[i] !== aMatchers[i] &&
          (typeof aMatchers[i] !== 'function' || !aMatchers[i](arguments[i]))
        ){

          //if matcher fails, immediately fail
          match = false;
          break;
        }

      }
    }


    //match / no match logic
    if(match) {

      //debug
      if(prot.using.debug){
        prot.using.logger("using matched", prot.describe(), prot.id)
      }

      //execute stub
      if(prot.stub){
        ret = prot.stub(prot.previousFn, arguments, this)
      } else {
        //or original function in case no stub is given
        ret = prot.previousFn.apply(this, arguments)
      }

      //property classes
      //if this property is instanced as a class we actually return this instead of ret
      if(this instanceof prot.exec || this["using:wrapper:instance"]===functionFactory.check){
        ret = this;
      }

      //use functionFactory when necessary
      if(typeof ret === 'function' && ret["using:wrapper:check"]!==functionFactory.check){
        ret = functionFactory(ret);
      }

      //resolve follow() pattern
      prot.trigger(ret);

      //return result
      return ret;

    } else {

      //debug
      if(prot.using.debug){
        prot.using.logger("using skipped", prot.describe(), prot.id)
      }

      //pipe normal flow directly
      return prot.previousFn.apply(this, arguments);

    }

  }

  //.clean() method
  pub.clean = function(){
    unfold(prot.using).destroyRules(prot.identifiers);
    delete pub.like;
    delete pub.clean;
    delete pub.stub;
  }

  //.stub() method
  pub.stub = function(cb){
    prot.stub = cb;
    delete pub.like;
    delete pub.clean;
    delete pub.stub;
    return pub; //chainable
  }

  //.destroy()
  prot.destroy = function(){

    //put back previousFn
    prot.destroyHook();

    //self destroy
    delete prot.trigger;
    delete prot.using;
    delete prot.stub;

    //remove pub methods
    delete pub.like;
    delete pub.clean;
    delete pub.stub;

    //make sure nothing matches and everything works even if some references may be kept somewhere
    //keep prot.previousFn
    prot.contextMatcher = function(){return false;} //match nothing
    prot.argumentMatchers = [];
  }

  //internal debug
  prot.describeItem = function(item){
    if(item && item['using:explanation']){
      return item['using:explanation']
    } else if(typeof item === 'function'){
      return '[function]';
    } else if(item && typeof item === 'object'){
      return '[object]';
    } else if(typeof item === 'string'){
      return '"'+item+'"';
    } else {
      return ""+item;
    }
  }


  //to be implemented in child classes:
  //prot.identifiers
  //prot.previousFn
  //prot.initialise()
  //prot.destroyHook()
  //prot.describe() - debug
  //pub.like() - optional

});