/**
 *
 * JASMINE TEST FOR RHINO WITH NATIVE REQUIRE
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

var home = System.getProperty('user.home');

System.setProperty('user.dir', cwd); // set current dir


require.root = cwd;
require.paths = [
    Paths.get(home,".node_modules").toString(),
    Paths.get(home,".node_libraries").toString()
];

var __dirname = "dirname";
var __filename = "filename";

load('src/main/javascript/jvm-jasmine.js');


describe("NPM global require()", function() {
  require.cache = [];

  it("should be a function", function() {
    expect(typeof require).toBe('function');
  });

  it("should throw an Error if a file can't be found", function() {
    expect( function() {require('not_found.js');} ).toThrow(new Error('Module "not_found.js" not found.'));
  });

  it("should not wrap errors encountered when loading a module", function() {
    try {
      require('lib/throws');
    } catch(ex) {
      print(ex);
      expect(ex instanceof ReferenceError).toBeTruthy();
    }
  });

/*
  ERROR: missing ; before statement

  it("should return the a .json file as a JSON object", function() {
    var json = require('lib/some_data.json');
    expect(json.description).toBe("This is a JSON file");
    expect(json.data).toEqual([1,2,3]);
  });
*/
  it("outer.quadruple is defined ", function() {
    var outer = require('lib/outer');
    expect(outer.quadruple).toBeDefined();
  });

  it("should support nested requires", function() {
    var outer = require('lib/outer');
    expect(outer.quadruple(2)).toBe(8);
  });

  it("should support an ID with an extension", function() {
    var outer = require('lib/outer.js');
    expect(outer.quadruple(2)).toBe(8);
  });

  it("should cache modules in require.cache", function() {
    var outer = require('lib/outer.js');
    var outer2 = require('lib/outer.js');
    expect(outer2).toBe(outer);
  });

  it("should handle cyclic dependencies", function() {
    var main = require('lib/cyclic');
    expect(main.a.fromA).toBe('Hello from A');
    expect(main.b.fromB).toBe('Hello from B');
  });
});

describe("NPM Module execution context", function() {

  it("should have a __dirname property", function() {
    var top = require('lib/simple_module');
    expect(top.dirname).toBe(__dirname);
  });

  it("should have a __filename property", function() {
    var top = require('lib/simple_module');
    expect(top.filename).toBe(__filename);
  });

  it("should not expose private module functions globally", function() {
    var top = require('lib/simple_module');
    expect(top.privateFunction).toBe(undefined);
  });

  it("should support setting the 'free' exports variable", function() {
    var modExports = require('lib/mod_exports');
    expect(modExports.data).toBe("Hello!");
  });

});


describe("module isolation", function() {

    /*
    it("should expose global variables and not expose 'var' declared variables", function() {

    var top = require( 'lib/isolation/module-a.js');
    expect(doLeak).toBe("cheddar");
    try {
      var shouldFail = doNotLeak;
      // should have thrown
      expect(true).toBe(false);
    } catch (err) {
      expect( err instanceof ReferenceError ).toBe(true);
    }
  });
  */

  it("should not leak function declarations", function() {
    var top = require('lib/isolation/module-c.js');
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
    var Stream = require( "lib/cyclic2/stream.js" );

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
    expect( typeof Core.Child.Core ).toBe( "object" );

  });
});

describe("The Module module", function() {
  it('should exist', function() {
    var Module = require('dist/rhino-npm');
    expect(Module).toBeTruthy();
  });

  it('should have a runMain function', function() {
    var Module = require('dist/rhino-npm');
    expect(typeof Module.runMain).toBe('function');
  });
});

report();

require.paths.forEach( function(p) {

    print( "path", p);
});
