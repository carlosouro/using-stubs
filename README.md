#using-stubs
![using-stubs NPM package information](https://nodei.co/npm/using-stubs.png "using-stubs NPM package information")

![using-stubs travis-CI build](https://travis-ci.org/carlosouro/using-stubs.svg "using-stubs travis-CI build") ![using-stubs test coverage](https://coveralls.io/repos/carlosouro/using-stubs/badge.svg "using-stubs test coverage")

Stubbing and verification for node.js tests.
Enables you to validate and override behaviour of nested pieces of code such as methods, require() and npm modules or even instances of classes.

This library is inspired on [node-gently](https://github.com/alex-seville/blanket), [MockJS](https://github.com/badoo/MockJS) and [mock-require](https://github.com/boblauer/mock-require).

---
##API

### <a name="gettingStarted"></a>Getting started

```JavaScript
var using = require('using-stubs')(); //an instance of using
```


### <a name="methods"></a>methods stubbing and verification
_using(object, [objectName])('method').expect([countMatch], [object.method([[paramMatchers](#paramMatchers)...])], [stubFn]);_


_using(object, [objectName])('method').stub([object.method([[paramMatchers](#paramMatchers)...])], stubFn);_


_using(object, [objectName])('method').fail([object.method([[paramMatchers](#paramMatchers)...])]);_


**Consider the object:**
```JavaScript
var foo = {
	bar: function(someone){
		return someone+" goes into a bar";
	},
	baz: function(){}
}
```

**Setup: Simple stubbing all method calls:**
```JavaScript
using(foo)('bar').stub(
	function(someone){	//stub
		return someone+" went to the park instead";
	}
);
```

**Setup: Simple failing any method calls:**
```JavaScript
using(foo)('baz').fail();
```

**Setup: Matching --&gt; Stubbing:**
```JavaScript
using(foo)('bar').expect(
	foo.bar(using.aString),	//call match clause
	function(someone){	//stub for this case
		return someone+" stayed at home";
	}
);
```

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
using(foo)('bar').expect(1, foo.bar(5));

//
foo.bar(5); //matches
foo.bar("5"); //does not match
```

Or, you can use any callback as a matcher (returning true matches)
```JavaScript
var matchFrom1to5 = function(param){
	return typeof(param)==='number' && param > 0 && param <5; // number from 1 to 5
}

using(foo)('bar').expect(2, foo.bar(matchFrom1to5));

//
foo.bar(3); //matches
foo.bar(6); //does not match
```

Parameter matching even works on context
```JavaScript
using(foo)('bar').expect(1, foo.bar.call(using.anObjectLike({'a':'a'}), 5));

//
foo.bar.apply({'a':'a'}, [5]); //matches
foo.bar(5); //does not match
```

using-stubs provides you a few common matchers for easy use
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

using.oneOf(a1, [[a2], ...[aN]])     //matches one of the given parameters
using.otherThan(a1, [[a2], ...[aN]]) //matches none of the given parameters

using.anObjectLike(obj, [boolean strict])  //deep compare to given object
                         //strict - defaults to non-strict (==) comparison (false)

using.everything         //special matcher - all arguments from this point onward
                         //will be matched, even if not set in the argument list.
                         //Eg. foo("a", using.everything) will match foo("a"), foo("a", "one")
                         //or even foo("a", 1, 2, 3, 4, 5, 6);
```



#### <a name="countMatchers"></a>count matchers
You can specify an exact match directly
```JavaScript
using(foo)('bar').expect(5, foo.bar()); //expects 5 executions
```

Or use a callback matcher
```JavaScript
var matchFrom1to5 = function(param){
	return typeof(param)==='number' && param > 0 && param <5; // number from 1 to 5
}

using(foo)('bar').expect(matchFrom1to5, foo.bar()); //expects 1 to 5 executions
```

using-stubs provides you a few common matchers for easy use
```JavaScript
using.atLeast(x)     //executed at least x times
using.atMost(x)      //executed at most x times
using.between(x, y)  //executed between x and y times
```