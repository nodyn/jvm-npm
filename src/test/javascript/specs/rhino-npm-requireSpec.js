
var Paths = java.nio.file.Paths,
    System = java.lang.System    
        ;

var cwd = Paths.get(
            System.getProperty('user.dir'),
           'src/test/javascript/specs')
           .toString()
            ;

var home = System.getProperty('user.home');

System.setProperty('user.dir', cwd); // set current dir

// Load the NPM module loader into the global scope
load('src/main/javascript/rhino-npm.js');

require.root = cwd;  
require.paths = [
    Paths.get(home,".node_modules").toString(),
    Paths.get(home,".node_libraries").toString()
];


load('src/main/javascript/jvm-jasmine.js');


describe("NativeRequire", function() {
  require.cache = [];

  it("should be a global object", function(){
    expect(typeof NativeRequire).toBe('object');
  });

  it("should expose DynJS' builtin require() function", function(){
    expect(typeof NativeRequire.require).toBe('function');
    var f = NativeRequire.require('lib/native_test_module');
    expect(f).toBe("Foo!");
    //expect(NativeRequire.require instanceof org.mozilla.javascript.commonjs.module.Require).toBe(true);
  });
});


describe("NPM global require()", function() {
  require.cache = [];
 
  it("should be a function", function() {
    expect(typeof require).toBe('function');
  });

  it("should have a resolve() property that is a function", function() {
    expect(typeof require.resolve).toBe('function');
  });

  it("should have a cache property that is an Object", function() {
    expect(typeof require.cache).toBe('object');
  });

  it("should have an extensions property that is an Object", function() {
    expect(typeof require.extensions).toBe('object');
  });

  it("should throw an Error if a file can't be found", function() {
    expect( function() {require('not_found.js');} ).toThrow(new Error('Cannot find module not_found.js'));
    try {
      require('./not_found.js');
    } catch(e) {
      expect(e.code).toBe('MODULE_NOT_FOUND');
    }
  });

  it("should not wrap errors encountered when loading a module", function() {
    try {
      require('./lib/throws');
    } catch(ex) {
      print(ex);
      expect(ex instanceof ReferenceError).toBeTruthy();
    }
  });

  it("should return the a .json file as a JSON object", function() {
    var json = require('./lib/some_data.json');
    expect(json.description).toBe("This is a JSON file");
    expect(json.data).toEqual([1,2,3]);
  });

  it("outer.quadruple is defined ", function() {
    var outer = require('lib/outer');
    expect(outer.quadruple).toBeDefined();    
  });
  
  it("should support nested requires", function() {
    var outer = require('./lib/outer');
    expect(outer.quadruple(2)).toBe(8);
  });

  it("should support an ID with an extension", function() {
    var outer = require('./lib/outer.js');
    expect(outer.quadruple(2)).toBe(8);
  });

  it("outer.filename is defined", function() {
    var outer = require('lib/outer.js');
    expect(outer.filename).toBeDefined();    
  });
  
  
  it("should cache modules in require.cache", function() {
    var outer = require('./lib/outer.js');
    expect(outer).toBe(require.cache[outer.filename]);
    var outer2 = require('./lib/outer.js');
    expect(outer2).toBe(outer);
  });

  it("should handle cyclic dependencies", function() {
    var main = require('./lib/cyclic');
    expect(main.a.fromA).toBe('Hello from A');
    expect(main.b.fromB).toBe('Hello from B');
  });
});

describe("NPM Module execution context", function() {

  it("should have a __dirname property", function() {
    var top = require('./lib/simple_module');
    expect(top.dirname).toBe([cwd, 'lib'].join('/'));
  });

  it("should have a __filename property", function() {
    var top = require('./lib/simple_module');
    expect(top.filename).toBe([cwd, 'lib/simple_module.js'].join('/'));
  });

  it("should not expose private module functions globally", function() {
    var top = require('./lib/simple_module');
    expect(top.privateFunction).toBe(undefined);
  });

  it("should have a parent property", function() {
    var outer = require('./lib/outer');
    expect(outer.innerParent.id).toBe([cwd, 'lib/outer.js'].join('/'));
  });

  it("should have a filename property", function() {
    var outer = require('./lib/outer');
    expect(outer.filename).toBe([cwd, 'lib/outer.js'].join('/'));
  });

  it("should have a children property", function() {
    var outer = require('./lib/outer');
    expect(outer.children.length).toBe(1);
    expect(outer.children[0].id).toBe([cwd, 'lib/sub/inner.js'].join('/'));
  });

  it("should support setting the 'free' exports variable", function() {
    var modExports = require('./lib/mod_exports');
    expect(modExports.data).toBe("Hello!");
  });

});

describe("module isolation", function() {
  it("should expose global variables and not expose 'var' declared variables", function() {
    var top = require( './lib/isolation/module-a.js');
    expect(doLeak).toBe("cheddar");
    try {
      var shouldFail = doNotLeak;
      // should have thrown
      expect(true).toBe(false);
    } catch (err) {
      expect( err instanceof ReferenceError ).toBe(true);
    }
  });

  it("should not leak function declarations", function() {
    var top = require('./lib/isolation/module-c.js');
    try {
      var shouldFail = doNotLeak;
      // should have thrown
      expect(true).toBe(false);
    } catch (err) {
      expect( err instanceof ReferenceError ).toBe(true);
    }
  });
});

describe("cyclic with replacement of module.exports", function() {
  it( "should have the same sense of an object in all places", function() {
    var Stream = require( "./lib/cyclic2/stream.js" );

    expect( typeof Stream ).toBe( "function"  );
    expect( typeof Stream.Readable ).toBe( "function" );
    expect( typeof Stream.Readable.Stream ).toBe( "function" );

  });
});

describe("Core modules", function() {
  it("should be found on the classpath", function() {
    var core = require('core');    
    expect(core).not.toBeFalsy();
  });

  it( "should have the same sense of an object in all places", function() {
    var Core = require( "core.js" );

    expect( typeof Core ).toBe( "function"  );
    expect( typeof Core.Child ).toBe( "function" );
    expect( typeof Core.Child.Core ).toBe( "function" );

  });
});

describe("The Module module", function() {
  it('should exist', function() {
    var Module = require('rhino-npm');
    expect(Module).toBeTruthy();
  });

  it('should have a runMain function', function() {
    var Module = require('jvm-npm');
    expect(typeof Module.runMain).toBe('function');
  });
});

report();

require.paths.forEach( function(p) {
   
    print( "path", p);
});