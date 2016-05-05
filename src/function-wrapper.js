var functionFactory = global.usingPackage.factory(function(pub,prot){

  prot.construct = function(originalFn){

    if(typeof originalFn !== 'function'){
      originalFn = function(){};
    }

    prot.exec = originalFn;

    prot.scope.name = originalFn.name;

    Object.defineProperty(pub, "using:wrapper:check", { writable: false, configurable: false, enumerable:false, value: functionFactory.check });
    //inherit from original prototype
    prot.scope.prototype = Object.create(originalFn.prototype);

    Object.defineProperty(prot.scope.prototype, "using:wrapper:instance", { writable: false, configurable: false, enumerable:false, value: functionFactory.check });
  }

  prot.scope = function(){
    return prot.exec.apply(this, arguments);  //pipe call to .exec
  }

});
functionFactory.check = {};


module.exports = functionFactory;