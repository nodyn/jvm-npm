/**
 *  Copyright 2014 Lance Ball
 *
 *  Licensed under the Apache License, Version 2.0 (the "License");
 *  you may not use this file except in compliance with the License.
 *  You may obtain a copy of the License at
 *
 *  http://www.apache.org/licenses/LICENSE-2.0
 *
 *  Unless required by applicable law or agreed to in writing, software
 *  distributed under the License is distributed on an "AS IS" BASIS,
 *  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 *  See the License for the specific language governing permissions and
 *  limitations under the License.
 */
// Make the native require function look in our local directory
// for modules loaded with NativeRequire.require()

var Paths = java.nio.file.Paths;

var cwd = Paths.get(
            java.lang.System.getProperty('user.dir'),
           'src/test/javascript/specs')
           .toString()
            ;

var home = java.lang.System.getProperty('user.home');

java.lang.System.setProperty('user.dir', cwd); // set current dir

// Load the NPM module loader into the global scope
load('src/main/javascript/rhino-npm.js');

require.root = cwd;  
require.paths = [
    Paths.get(home,".node_modules").toString(),
    Paths.get(home,".node_libraries").toString(),
    Paths.get(cwd,"lib").toString()
];


load('src/main/javascript/jvm-jasmine.js');


/*
describe("NativeRequire", function() {
  require.cache = [];
 
  it("should be a global object", function(){
    expect(typeof NativeRequire).toBe('object');
  });
  
  it("should expose builtin require() function", function(){
    expect(typeof NativeRequire.require).toBe('function');
    
    var f = NativeRequire.require('lib/native_test_module');
    expect(f).toBe("Foo!");
    
    require.root = Paths.get( cwd, "lib").toString();
    
    //expect(NativeRequire.require instanceof org.dynjs.runtime.builtins.Require).toBe(true);
  });
*/

/*
  it("should fall back to builtin require() if not found", function() {
    var called = false;
    NativeRequire.require = function() {
      called = true;
      return "Got native module";
    };
    var native = require('not_found');
    expect(native).toBe("Got native module");
    expect(called).toBe(true);
  });

});

*/

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
    var outer = require('./lib/outer');
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

report();