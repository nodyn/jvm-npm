
load('src/main/javascript/npm_modules.js');

describe("NPM Modules", function() {

  describe("NativeRequire", function() {

    it("should be a global object", function(){
      expect(typeof NativeRequire).toBe('object');
    });

    it("should be have a reference to DynJS' native require()", function(){
      expect(typeof NativeRequire.require).toBe('function');
//      var f = NativeRequire.require('./native_test_module');
//      expect(f).toBe("Foo!");
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

  }); // describe Global require()

}); // describe NPM modules
