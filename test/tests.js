//START TESTS
var assert = require('assert');
var usingFactory, using, follows;

//blanket to test nature.js file coverage
if(process.env.YOURPACKAGE_COVERAGE) require('blanket')({"data-cover-only":'src', "data-cover-never":'node_modules'});

beforeEach(function(){
  follows = 0;
})

describe('using-stubs', function(){

	it('should not have syntax errors', function(){
		usingFactory = require('../src/using.js')
	});
	it('should initialise an instance', function(){
		using = usingFactory();
	});

	describe('basic functionality', function(){

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


		it('should follow code (methods)', function(done){

			using(obj, 'prop').follow(function(objInside){
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


		it('should follow code (property classes)', function(done){

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

      using.clean();

      done();

		});

    it('should follow code (piped function/class)', function(done){

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

    it('should follow code (require)', function(done){

      using.require('./includes/require/include.js').follow(function(obj){
        follows++
        assert(obj.testTrue() && !obj.testFalse());
        return using(obj, 'getObject');
      }).follow(function(obj){
        follows++;
        assert(obj.value)
        obj.value = false;
      })

      assert(!require('./includes/require/include.js').getObject().value)
      assert.equal(follows, 2);

      using.clean();
      assert(require('./includes/require/include.js').getObject().value)
      assert.equal(follows, 2);

      done();

    });

  });

  //TO-DO: missing require() tests

  //TO-DO: missing matchers tests

});