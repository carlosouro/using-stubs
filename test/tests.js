//START TESTS
var assert = require('assert');
var usingFactory, using, follows;

//blanket to test nature.js file coverage
if(process.env.YOURPACKAGE_COVERAGE) require('blanket')({"data-cover-only":'src', "data-cover-never":'node_modules'});

beforeEach(function(){
  follows = 0;
});


//our test case object
var obj = {
  prop:function(){
    return {
      propInside:function(){
        return {
          value : "propInside-value"
        }
      },
      ClassExample:function(){

        this.propInClass=function(){
          return {
            value:"propInClass-value"
          }
        }
      },
      getClassExample:function(){
        return this.ClassExample;
      }
    }
  }
};
var originalObj = {
  prop:obj.prop
}


//TESTS
describe('using-stubs', function(){

	it('should not have syntax errors', function(){
		usingFactory = require('../src/using.js')
	});
	it('should initialise an instance', function(){
		using = usingFactory();
    //using.debug = true;
	});

  //basics
	describe('basic functionality', function(){


		it('should follow code (methods)', function(done){

			using(obj, 'prop').like(obj.prop()).follow(function(objInside){
        follows++;
        assert(objInside.propInside && objInside.ClassExample);
        return using(objInside, 'propInside');
      }).follow(function(objInside2){
        follows++;
        assert.equal(objInside2.value, "propInside-value");
        //change it
        objInside2.value = "propInside-value-modified"
      });

      var value = obj.prop().propInside().value;

      assert.equal(follows, 2);

      assert.equal(value, "propInside-value-modified")



      done();

		});

    it('should trigger flow multiple times', function(done){

      //x2
      var value = obj.prop().propInside().value;
      assert.equal(follows, 2);
      assert.equal(value, "propInside-value-modified")

      //x3
      value = obj.prop().propInside().value;
      assert.equal(follows, 4);
      assert.equal(value, "propInside-value-modified")

      //x4
      value = obj.prop().propInside().value;
      assert.equal(follows, 6);
      assert.equal(value, "propInside-value-modified")

      done();

    });

    it('should using.clean() all', function(done){

      using.clean();

      var value = obj.prop().propInside().value;
      assert.equal(follows, 0);
      assert.equal(value, "propInside-value")

      assert.equal(obj.prop, originalObj.prop)

      done();

    });

    it('should work for multiple rules', function(done){

      //rule 1 (matches last)
      using(obj, 'prop').follow(function(objInside){
        follows++;
        assert.equal(follows, 1);
        assert(objInside.propInside && objInside.ClassExample);
        //remove class
        delete objInside.ClassExample;
        return using(objInside, 'propInside');

      }).follow(function(objInside2){
        follows++;
        assert.equal(follows, 3);
        assert.equal(objInside2.value, "propInside-value");
        //change it
        objInside2.value = "propInside-value-modified"
      });

      //rule 2 (matches first)
      using(obj, 'prop').follow(function(objInside){
        follows++;
        assert.equal(follows, 2);
        assert(objInside.propInside && !objInside.ClassExample);
        return using(objInside, 'propInside');
      }).follow(function(objInside2){
        follows++;
        assert.equal(objInside2.value, "propInside-value-modified");
        //change it
        objInside2.value = "propInside-value-modified2"
      });


      var value = obj.prop().propInside().value;
      assert.equal(follows, 4);
      assert.equal(value, "propInside-value-modified2");

      done();

    })

  });

  //.like() .stub clauses
  describe('working with .like()', function(){

    it('should match .like() clauses', function(done){

      using.clean();

      var execs = 0;

      using(obj, 'prop').follow(function(){
        //counts executions
        execs++;
      })

      using(obj, 'prop').like(obj.prop("0")).follow(function(){
        follows++
      })
      using(obj, 'prop').like(obj.prop(0)).follow(function(){
        assert.fail("unexpected match");
      })

      obj.prop();
      obj.prop(false);
      assert.equal(follows, 0)
      obj.prop("0");
      assert.equal(follows, 1)

      //a bit more complex
      using(obj, 'prop').like(obj.prop(using.everything)).follow(function(){
        follows++
      })
      using(obj, 'prop').like(obj.prop("not!", using.everything)).follow(function(){
        assert.fail("unexpected using.everything match");
      })

      obj.prop("0");
      assert.equal(follows, 3)

      //a callback
      using(obj, 'prop').like(obj.prop(using.anything)).follow(function(){
        follows++
      })

      obj.prop("0");
      assert.equal(follows, 6)

      assert.equal(execs, 5)

      done();
    })

  })

  //classes
  describe('working with classes', function(){

    it('should follow code (property classes)', function(done){

      using.clean()

      using(obj, 'prop').follow(function(objInside){
        follows++;
        assert(objInside.propInside && objInside.ClassExample);
        return using(objInside, 'ClassExample');
      }).follow(function(instanceInside){
        follows++;
        assert(instanceInside.propInClass);
        return using(instanceInside, 'propInClass');
      }).follow(function(objInside2){
        follows++;
        objInside2.value = "propInClass-value-modified";
      });

      assert.equal((new (obj.prop()).ClassExample()).propInClass().value, "propInClass-value-modified")

      assert.equal(follows, 3);

      done();

    });

    it('should follow code (piped function/class)', function(done){

      using.clean()

      using(obj, 'prop').follow(function(objInside){
        follows++;
        assert(objInside.propInside && objInside.ClassExample);
        return using(objInside, 'getClassExample');
      }).follow(function(ClassExample){
        follows++;
        assert(typeof ClassExample, 'function');
        return using(ClassExample);
      }).follow(function(objInside2){
        follows++;
        return using(objInside2, 'propInClass');
      }).follow(function(objInside3){
        follows++;
        objInside3.value = "propInClass-value-modified";
      });

      assert.equal((new (obj.prop().getClassExample())()).propInClass().value, "propInClass-value-modified")

      assert.equal(follows, 4);

      done();

    });

  });

  //Node.js require()
  describe('working with require()', function(){

    it('should follow code (require)', function(done){

      using.clean()

      using.require('./includes/require/include.js').first().follow(function(obj){
        follows++
        //setup internal rule
        using(obj, 'testTrue').like(obj.testTrue("NO!")).stub(function(){
          return false;
        });

        assert(obj.testTrue() && !obj.testFalse());

        return using(obj, 'getObject');
      }).follow(function(obj){
        follows++;
        assert(obj.value)
        obj.value = false;
      })

      assert(!require('./includes/require/include.js').getObject().value)
      assert.equal(follows, 2);

      using.require('./includes/require/include.js').first().follow(function(obj){
        follows++;
        assert.equal(follows, 3);
        assert(obj.testTrue() && !obj.testTrue("NO!") && !obj.testFalse());
        return using(obj, 'getObject');
      }).follow(function(obj){
        follows++;
        assert.equal(follows, 5);
        assert(!obj.value)
        obj.value = "YES!";
      })

      assert.equal(require('./includes/require/include.js').getObject().value, "YES!")
      assert.equal(follows, 5);

      using.clean();
      follows=0;
      assert.equal(require('./includes/require/include.js').getObject().value, true)
      assert.equal(follows, 0);

      done();

    });

  });

  //TO-DO: missing matchers tests

});