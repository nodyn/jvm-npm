/**
 *
 * JASMINE TEST FOR RHINO + RHINO-NPM WITH NATIVE REQUIRE FOR LOOKUP IN CLASSLOADER
 *
 */

var Paths = java.nio.file.Paths,
    System = java.lang.System
        ;

var cwd = Paths.get(
            System.getProperty('user.dir'),
           'src/test/javascript/specs')
           .toString()
            ;

System.setProperty('user.dir', cwd); // set current dir

// Load the NPM module loader into the global scope
load('src/main/javascript/dist/jvm-rhino-cl-npm.js');

load('src/main/javascript/jvm-jasmine.js');

var __dirname = "dirname";
var __filename = "filename";

beforeEach( function() {
  require.cache = [];
});

describe("NativeRequire", function() {

  it("should be a global object", function(){
    expect(typeof NativeRequire).toBe('object');
  });

  it("should expose DynJS' builtin require() function", function(){
    expect(typeof NativeRequire.require).toBe('function');
    var f = NativeRequire.require('./lib-cl/native_test_module');
    expect(f).toBe("Foo!");
    expect(NativeRequire.require instanceof org.dynjs.runtime.builtins.Require)
      .toBe(true);
  });

}, {disable:true} );

describe("NPM global require()", function() {

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
    expect(function() {require('./not_found.js');}).toThrow(new Error('Cannot find module ./not_found.js'));
    try {
      require('./not_found.js');
    } catch(e) {
      expect(e.code).toBe('MODULE_NOT_FOUND');
    }
  });

  it("should not wrap errors encountered when loading a module", function() {
    try {
      require('./lib-cl/throws');
    } catch(ex) {
      print(ex);
      expect(ex instanceof ReferenceError).toBeTruthy();
    }
  });

  it("should support nested requires", function() {
    var outer = require('./lib-cl/outer');
    expect(outer.quadruple(2)).toBe(8);
  });

  it("should support an ID with an extension", function() {
    var outer = require('./lib-cl/outer.js');
    expect(outer.quadruple(2)).toBe(8);
  });

  it("should return the a .json file as a JSON object", function() {
    var json = require('./lib-cl/some_data.json');
    expect(json.description).toBe("This is a JSON file");
    expect(json.data).toEqual([1,2,3]);
  });

  it("should cache modules in require.cache", function() {
    var outer = require('./lib-cl/outer.js');
    expect(outer).toBe(require.cache[outer.filename]);
    var outer2 = require('./lib-cl/outer.js');
    expect(outer2).toBe(outer);
  });

  it("should handle cyclic dependencies", function() {
    var main = require('./lib-cl/cyclic');
    expect(main.a.fromA).toBe('Hello from A');
    expect(main.b.fromB).toBe('Hello from B');
  });
});

describe("folders as modules", function() {
  it("should find package.json in a module folder", function() {
    var package = require('./lib-cl/other_package');
    expect(package.flavor).toBe('cool ranch');
    expect(package.subdir).toBe('lib-cl/other_package/lib/subdir');
  });

  it('should load package.json main property even if it is a directory', function() {
    var cheese = require('./lib-cl/cheese');
    expect(cheese.flavor).toBe('nacho');
  });

  it("should find index.js in a directory, if no package.json exists", function() {
    var package = require('./lib-cl/my_package');
    expect(package.data).toBe('Hello!');
  });

});

describe("NPM Module execution context", function() {

  it("should have a __dirname property", function() {
    var top = require('./lib-cl/simple_module');
    expect(top.dirname).toBe('./lib-cl');
  });

  it("should have a __filename property", function() {
    var top = require('./lib-cl/simple_module');
    expect(top.filename).toBe('./lib-cl/simple_module.js');
  });

  it("should not expose private module functions globally", function() {
    var top = require('./lib-cl/simple_module');
    expect(top.privateFunction).toBe(undefined);
  });

  it("should have a parent property", function() {
    var outer = require('./lib-cl/outer');
    expect(outer.innerParent.id).toBe('./lib-cl/outer.js');
  });

  it("should have a filename property", function() {
    var outer = require('./lib-cl/outer');
    expect(outer.filename).toBe('./lib-cl/outer.js');
  });

  it("should have a children property", function() {
    var outer = require('./lib-cl/outer');
    expect(outer.children.length).toBe(1);
    //expect(outer.children[0].id).toBe('./lib-cl/sub/inner.js');
    expect(outer.children[0].id).toBe('lib-cl/sub/inner.js');
  });

  it("should support setting the 'free' exports variable", function() {
    var modExports = require('./lib-cl/mod_exports');
    expect(modExports.data).toBe("Hello!");
  });

});

describe("module isolation", function() {

  it("should expose global variables and not expose 'var' declared variables", function() {
    var top = require( './lib-cl/isolation/module-a.js');
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
    var top = require('./lib-cl/isolation/module-c.js');
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
    var Stream = require( "./lib-cl/cyclic2/stream.js" );

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
}, {disable:false});

describe("Path management", function() {
  it( "should respect NODE_PATH variable", function() {
    require.NODE_PATH = 'foo:bar';
    var results = require.paths();
    expect( results[0] ).toBe( home + "/.node_modules" );
    expect( results[1] ).toBe( home + "/.node_libraries" );
    expect( results[2] ).toBe( 'foo' );
    expect( results[3] ).toBe( 'bar' );
  });
}, {disable:true} );

describe("The Module module", function() {
  it('should exist', function() {
    var Module = require('dist/jvm-npm-cl');
    expect(Module).toBeTruthy();
  });

  it('should have a runMain function', function() {
    var Module = require('dist/jvm-npm-cl');
    expect(typeof Module.runMain).toBe('function');
  });
});

report();
