#using-stubs
![using-stubs NPM package information](https://nodei.co/npm/using-stubs.png "using-stubs NPM package information")

![using-stubs travis-CI build](https://travis-ci.org/carlosouro/using-stubs.svg "using-stubs travis-CI build") ![using-stubs test coverage](https://coveralls.io/repos/github/carlosouro/using-stubs/badge.svg?branch=master "using-stubs test coverage")

Stubbing and verification for node.js tests.
Enables you to validate and override behaviour of nested pieces of code such as methods, require() and npm modules or even instances of classes.

This library is inspired on [node-gently](https://github.com/alex-seville/blanket), [MockJS](https://github.com/badoo/MockJS) and [mock-require](https://github.com/boblauer/mock-require).

---
##API

### <a name="gettingStarted"></a>Getting started

```JavaScript
var using = require('using-stubs')(); //an instance of using
```


### <a name="methods"></a>Matching, following and stubbing in-depth code

_using(object, 'method').like(foo.method("example"));_

_using(object, 'method').stub(function(originalFn, args, context){ /*...*/ });_

_using(object, 'method').follow(function(resultingObject){ /*...*/ });_


**Consider the object:**
```JavaScript
//class Baz
function ClassExample(){
  this.test = function(){
    return "";
  }
}

//object foo
var foo = {
	bar: function(){
    return {
      Baz: ClassExample
    }
  },
  getBaz: function(){
    return ClassExample
  }
}
```

**Basics: Dive deep into Baz class, intercept and modify returned instance:**
```JavaScript
//setup using()
using(foo, 'bar').follow(function(obj){

  return using(obj, 'Baz'); //chaining with .follow()

}).follow(function(bazInstance){

  // modify bazInstance however you'd like
  using(bazInstance, 'test').stub(function(){
    return "OK!";
  })

});

//actual test case
var obj = foo.bar();

var instance = new obj.Baz();

console.log(instance.test()); //prints "OK!"
```

**Class constructor: Actually replace bazInstance with your mock entirely when adquired via _foo.bar("test-match").getBaz()_ and constructed via _new Baz(callback)_:**
```JavaScript
//setup using()
using(foo, 'bar').like( foo.bar("test-match") ).follow(function(obj){

  return using(obj, 'getBaz');

}).follow(function(Baz){

  //Notice that because we intercept Baz itself in .follow() we can modify its entire behaviour.

  //This wouldn't be possible if Baz reference hadn't been piped through using.follow(),
  //in that case we would only be able to intercept methods of Baz, but not its instances

  using(Baz).like( new Baz(using.aCallback) ).stub(function(originalFn, args, context){
    var callback = args[0];
    callback("YEAH!");
  });

});

//actual test case
var obj = foo.bar("test-match"); //anything else won't apply
var Baz = new obj.getBaz();

new Baz(function(str){
  console.log(str);
}) //prints "YEAH!"

```

**Clean: Examples on removing all or part of set rules :**
```JavaScript
//clean all rules for a given method
using(obj, 'prop').clean();

//clean all rules for classes / functions
using(obj).clean();

//clean everything - all rules for all objects and methods, classes, etc
using.clean();

//Note: .clean() only cleans rules that have been set via the given using instance (see first item on documentation)
```

**API: All API methods at once example:**
```JavaScript

//using all API methods in one chain

using.require('./example').first().follow(function(foo){

  using(foo, 'bar')
  .like( foo.bar(using.aString) ) //only when called like this
  .stub(function(fn, args, context){

    //eg. replace a calling argument but still return the original function result
    return fn.call(context, "my-override-string")

  })
  .the(2) //stalker-pattern API: only follow the 2nd match
  .follow(function(obj){

    console.log("the(2) foo.bar()");
    return using(obj, 'Baz'); //chaining with .follow()

  })
  .first() //stalker-pattern API: only follow the first instance of obj.Baz
  .follow(function(bazInstance){

    console.log("first() instance of obj.Baz");
    return using(bazInstance, 'test'); //chaining with .follow()
  })
  .from(2).to(5) //stalker-pattern API: only follow 2nd to 5th call to bazInstance.test()
  .follow(function(res){
    console.log("+1");
  })

})

//running the test
var a = foo.bar("a"); //does nothing
var b = foo.bar("b"); //prints "the(2) foo.bar()"

var instance = new b.Baz(); //prints "first() instance of obj.Baz"

instance.test(); //does nothing

instance.test(); //prints "+1"
instance.test(); //prints "+1"
instance.test(); //prints "+1"
instance.test(); //prints "+1"

instance.test(); //does nothing

```

**Note:**
The interfaces .first(), .the(), .from(), .to(), and .follow() are inherited from the stalker-pattern API
Take a look at [stalker-pattern reference](https://github.com/carlosouro/stalker-pattern) in order to further understand the pattern and its chaining API


**Setup: Verification &lt;-- Matching:**
```JavaScript
using(foo)('bar').expect(1, foo.bar("John")); //expect foo.bar("John") to be called once
```

**Setup: Verification &lt;-- Matching (w/ context example) --&gt; Stubbing:**
```JavaScript
var someScope = {};

using(foo)('bar').expect(
	1, //countMatcher
	foo.bar.apply(someScope, ["Anna"]),	//call match clause w/ context
	function(){	//stub
		return "Anna was the only one going to the bar";
	}
);
```

**Setup: Just Verification:**
```JavaScript
using(foo)('bar').expect(4); //in total, foo.bar will be used 4 times
```

**Running the test**
```JavaScript
foo.bar("Peter"); //Peter stayed at home
foo.bar("John"); //John stayed at home
foo.bar.call(someScope, "Anna"); //Anna was the only one going to the bar
foo.bar(5); //5 went to the park instead
//foo.baz(); //doing this would fail our test
```

<sub>Note: verifications are processed from newest to oldest and whenever a stub is hit, the processing stops. This means that if we'd begun with the simple _using(foo)('bar').expect(4);_ on the top instead of at the bottom, cases that would hit a stub in the queue wouldn't count as a match for _.expect(4)_, and _.verify()_ would fail.</sub>

### <a name="verify"></a>verify all expectations
_using.verify([errorMsg]);_

Verifies that all countMatchers match the number of executions.

```JavaScript
using.verify("Our test case failed");
```

####verify only one object (all methods)
_using(object).verify([errorMsg]);_

```JavaScript
using(foo).verify();
```

####verify only one method
_using(object)('method').verify([errorMsg]);_

```JavaScript
using(foo)('bar').verify();
```

### <a name="restore"></a>restore everything done with this _using_ instance (including require/classes)
_using.restore();_
```JavaScript
using.restore();
```

####restore only one object (all methods)
_using(object).restore();_

```JavaScript
using(foo).restore();
```

####restore only a method
_using(object)('method').restore();_

```JavaScript
using(foo)('bar').restore();
```

---
---
## <a name="require"></a>require()

### <a name="requireMethods"></a>require() module methods
_var module = using.require(moduleName);_

<sub>Note: module is still executed normally when requested, if you'd rather the module not to be executed at all, see [entire module stubbing](#requireStubbing).</sub>

```JavaScript
var uProcess = using.require('child_process');

using(uProcess)('exec').expect(
	using.atLeast(1),
	uProcess.exec(using.aString, using.anObject, using.aFunction),
	function(s,o,c){
		c();
	}
);
```

####restore module method

```JavaScript
using(uProcess)('exec').restore();
```

####restore all module methods

```JavaScript
using(uProcess).restore();
```


### <a name="requireStubbing"></a>require() stubbing entire module
_using.require.stub(moduleName, mockModule);_

Stub entire module and avoid the module to be executed at all.

```JavaScript
using.require.stub('module', {}); //replace module with this empty object
```
Of course, we can still verify/stub specific methods in our stubbed object.
```JavaScript
var module = using.require('module');
using(module)('foo').expect(module.foo(/*...*/), /*...*/);
```

####restore normal module (clear stubs)
_using.require.restore(moduleName);_

<sub>Note: also restores all module methods</sub>
```JavaScript
using.require.restore('module');
```

---
---

### <a name="classes"></a>classes and instances
_var instance = using(ClassModule).instance([countMatch], new ClassModule([[paramMatchers](#paramMatchers)...]), [stubInstance]);_

<sub>Note: This only works for classes wrapped within require() modules.</sub>

Consider the following module ./Cat.js :
```JavaScript
function Cat(name){
	this.name = name;
}
Cat.prototype = {
	pet: function(){
		return this.name +" "+ randomBehaviour();
	}
}
module.exports = Cat;
```

Within our tests, we can stub/verify behaviour on specific class instances via:
```JavaScript
var Cat = using.require('./Cat');

//be it cat an instance of new Cat(using.aString)
var cat = using(Cat).instance(new Cat(using.aString));

//example - stub cat.pet()
using(cat)('pet').expect(
	cat.pet(),
	function(){
	  return this.name + " purrs.";
	}
);
```

---
---
## <a name="matchers"></a>matchers

#### <a name="paramMatchers"></a>parameter matchers

The simplest way to exactly match a parameter is by specifying it directly.
```JavaScript
using(foo, 'bar').like( foo.bar(5) );

//
foo.bar(5); //matches
foo.bar("5"); //does not match
```

Or, you can use any callback as a matcher (returning true matches)
```JavaScript
function divisibleBy3(param){
	return typeof(param)==='number' && (param % 3) === 0;
}

using(foo, 'bar').like( foo.bar(divisibleBy3) );

//
foo.bar(6); //matches
foo.bar(7); //does not match
```

Parameter matching even works on context
```JavaScript
using(foo, 'bar').like( foo.bar.call(using.anObjectLike({'a':'a'}), 5) );

//
foo.bar.apply({'a':'a'}, [5]); //matches
foo.bar(5); //does not match
```

using-stubs provides you a few common matchers for ease of use
```JavaScript
using.aString            //matches any string
using.aStringLike(regex) //matches the regular expression
using.anInt              //matches any integer
using.aNumber            //matches any number
using.anObject           //matches any object (not null)
using.aFunction          //matches any function
using.typeOf(type)       //tests typeOf(parameter)===type
using.instanceOf(Class)  //tests parameter instanceOf Class
using.something          //matches parameter!==undefined
using.anything           //matches any param as long as it is set in the argument list (even undefined)

using.atLeast(x)     //a number > x
using.atMost(x)      //a number < x
using.between(x, y)  //a number > x && < y
using.oneOf(a1, [[a2], ...[aN]])     //matches one of the given parameters
using.otherThan(a1, [[a2], ...[aN]]) //matches if none of the given parameters match

using.anObjectLike(obj, [boolean strict])  //deep compare to given object
                         //strict - defaults to non-strict (==) comparison (false)

using.everything         //special matcher - all arguments from this point onward
                         //will be matched, even if not set in the argument list.
                         //Eg. foo("a", using.everything) will match foo("a"), foo("a", "one")
                         //or even foo("a", 1, 2, 3, 4, 5, 6);
```