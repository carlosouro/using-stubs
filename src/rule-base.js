//external
var Stalker = require('stalker-pattern');

//internal
var Matchers = require('./Matchers');
var functionFactory = require('./function-wrapper');

//instance of matcher for internal use
var matchers = new Matchers();

//class definition
module.exports = global.usingPackage.create(function(pub, prot, unfold){

  //default matchers
  prot.contextMatcher = matchers.anything;
  prot.argumentMatchers = [matchers.everything];

  prot.matchers = matchers;

  //prot.construct()
  prot.construct = function(using){

    prot.using = using;

    Stalker.call(pub, function(t){
      //link trigger
      prot.trigger = t;
    });

    prot.initialise.apply(prot, Array.prototype.slice.call(arguments, 1));
  }

  //method replacement for obj.prop() or obj() for matching setup
  prot.matchersGatherer = function(){
    return {
      context:this instanceof prot.matchersGatherer ? matchers.newInstance : this,
      args:[].slice(arguments)
    }
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

      //execute stub
      if(prot.stub){
        ret = prot.stub(prot.previousFn, arguments, this)
      } else {
        //or original function in case no stub is given
        ret = prot.previousFn.apply(this, arguments)
      }

      //property classes
      //if this property is instanced as a class we actually return this instead of ret
      if(this instanceof prot.exec || this.constructor["nature:isFactory"]){
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


  //to be implemented in child classes:
  //prot.identifiers
  //prot.previousFn
  //prot.initialise()
  //prot.destroyHook()
  //pub.like() - optional

});