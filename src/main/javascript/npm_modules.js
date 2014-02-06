// Since we intend to use the Function constructor.
/* jshint evil: true */
(function() {
  // Keep a reference to DynJS's builtin require()
  NativeRequire = { require: require };

  var System  = java.lang.System,
      Scanner = java.util.Scanner,
      File    = java.io.File;

  function Module(id, parent) {
    this.id = id;
    this.exports = {};
    this.parent = parent;
    this.children = [];
    this.filename = null;
    this.loaded = false;
    
    if (parent && parent.children) {
      parent.children.push(this);
    }
  }

  Module._load = function(file, parent) {
    var module = new Module(file, parent);
    var body   = Module._readFile(file);
    var dir    = new File(file).getParent();
    var func   = new Function('exports', 'module', 
                               '__filename', '__dirname', body);
    func(module.exports, module, file, dir);
    return module.exports;
  };

  Module._resolve = function(id) {
    var name = [id, 'js'].join('.');
    var file = new File([Require.root, name].join('/'));
    return file.exists() ? file.getCanonicalPath() : false;
  };

  Module._readFile = function(filename) {
    try {
      // TODO: I think this is not very efficient
      return new Scanner(new File(filename)).useDelimiter("\\A").next();
    } catch(e) {
      throw new Error("Cannot read file ["+file+"]: " + e);
    }
  };

  Module.prototype.require = function(path) {
    return Module._load(path, this);
  };

  function Require(id) {
    var file = Module._resolve(id);
    if (file) { return Module._load(file); }
    throw new Error("Cannot find module " + id);
  }

  Module.require = Require;
  Require.root = System.getProperty('user.dir');
  Require.resolve = Module._resolve;
  Require.cache = {};
  Require.extensions = {};
  require = Require;
}());

