//require mocking (originally from https://github.com/boblauer/mock-require)
var Module           = require('module');
var dirname          = require('path').dirname;
var join             = require('path').join;
var originalLoader   = Module._load;
var callerId = require('caller-id');

//internal
var ruleBase = require('./rule-base');

//filter out resolvedPath on root Module._load function (avoid future bugs)
var originalLoad = Module._load;
Module._load = function(request, parent){ return originalLoad.call(Module, request, parent) };

//class definition
module.exports = global.usingPackage.from(ruleBase).factory(function(pub, prot, unfold){

  //initialisation call
  prot.initialise = function(module, calledFrom){

    var path;
    try {
      path = require.resolve(module);
    } catch(e) {
      path = join(dirname(calledFrom), module);
      path = Module._resolveFilename(path);
    }

    prot.identifiers = {
      path : path,
      ruleType: 'require'
    }

    prot.contextMatcher = Module;
    prot.argumentMatchers = [prot.matchers.anything, prot.matchers.anything, path];

    //replace require() with our override callback
    prot.previousFn = Module._load;
    Module._load = function(request, parent){
      var v = prot.exec.call(this, request, parent, Module._resolveFilename(request, parent));
      //console.log(v);
      return v;
    }

    //override stalker behaviour (always requires first())
    var originalFirst = pub.first;
    var originalFollow = pub.follow;

    pub.first = function(){
      pub.follow = originalFollow;
      pub.first = originalFirst;
      return pub.first();
    }

    delete pub.follow;
    delete pub.from;
    delete pub.to;
    delete pub.the;
  }

  prot.describe = function(){
    return 'require("'+prot.identifiers.path+'")';
  }

  prot.destroyHook = function(){

    //put back previousFn
    Module._load = prot.previousFn;
  }

});