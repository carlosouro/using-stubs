var Cat = require('./subfolder/Cat');

var furrball = new Cat("Furrball");

//run default tests
require('./test-class-default-tests-runner')(furrball, Cat);