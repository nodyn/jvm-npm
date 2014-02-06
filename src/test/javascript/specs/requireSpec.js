// Make the native require function look in our local directory
// for modules loaded with NativeRequire.require()
var cwd = [java.lang.System.getProperty('user.dir'), 
           'src/test/javascript/specs'].join('/');
require.pushLoadPath(cwd);

// Load the NPM module loader into the global scope
load('src/main/javascript/npm_modules.js');

// Tell require where it's root is
require.root = cwd;

describe("NPM Modules", function() {

  describe("NativeRequire", function() {

    it("should be a global object", function(){
      expect(typeof NativeRequire).toBe('object');
    });

    it("should expose DynJS' builtin require() function", function(){
      expect(typeof NativeRequire.require).toBe('function');
      var f = NativeRequire.require('./lib/native_test_module');
      expect(f).toBe("Foo!");
    });

  });

  describe("Global require()", function() {

    it("should be a function", function() {
      expect(typeof require).toBe('function');
    });

    it("should have a resolve() function", function() {
      expect(typeof require.resolve).toBe('function');
    });

    it("should have a cache property that is an Object", function() {
      expect(typeof require.cache).toBe('object');
    });

    it("should have an extensions property that is an Object", function() {
      expect(typeof require.extensions).toBe('object');
    });

    it("should find and load files with a .js extension", function() {
      // Ensure that the npm require() is not using NativeRequire
      var that=this;
      NativeRequire.require = function() {
        that.fail("NPM require() should not use DynJS native require");
      };
      expect(require('./lib/native_test_module')).toBe("Foo!");
    });

    it("should throw an Error if a file can't be found", function() {
      expect(function() {require('./not_found.js');}).toThrow(new Error('Cannot find module ./not_found.js'));
    });

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

    it("should support nested requires", function() {
      var outer = require('./lib/outer');
      expect(outer.quadruple(2)).toBe(8);
    });

    it("A module should have a parent property", function() {
      var outer = require('./lib/outer');
      expect(outer.innerParent.id).toBe([cwd, 'lib/outer.js'].join('/'));
    });

    it("A module should have a filename property", function() {
      var outer = require('./lib/outer');
      expect(outer.filename).toBe([cwd, 'lib/outer.js'].join('/'));
    });

    it("A module should have a children property", function() {
      var outer = require('./lib/outer');
      expect(outer.children.length).toBe(1);
      expect(outer.children[0].id).toBe([cwd, 'lib/sub/inner.js'].join('/'));
    });

  }); // describe Global require()

}); // describe NPM modules
