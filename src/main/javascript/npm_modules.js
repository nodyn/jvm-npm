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
    self = this;
    
    if (this.parent && this.parent.children) {
      this.parent.children.push(this);
    }
    this.require = function(id) {
      return Require(id, self);
    };
  }

  Module._load = function(file, parent) {
    var body   = Module._readFile(file);
    var module = new Module(file, parent);
    var dir    = new File(file).getParent();
    var args   = ['exports', 'module', 'require', '__filename', '__dirname'];
    var func   = new Function(args, body);
    func.apply(module, [module.exports, module, module.require, file, dir]);
    module.loaded = true;
    return module.exports;
  };

  Module._resolve = function(id, parent) {
    var name = [id, 'js'].join('.');
    var root = Module._findRoot(parent);
    var file = new File([root, name].join('/'));
    return file.exists() ? file.getCanonicalPath() : false;
  };

  Module._findRoot = function(parent) {
    if (!parent) { return Require.root; }
    var pathParts = parent.id.split('/');
    pathParts.pop();
    return pathParts.join('/');
  };

  Module._readFile = function(filename) {
    try {
      // TODO: I think this is not very efficient
      return new Scanner(new File(filename)).useDelimiter("\\A").next();
    } catch(e) {
      throw new Error("Cannot read file ["+file+"]: " + e);
    }
  };

  function Require(id, parent) {
    var file = Module._resolve(id, parent);
    if (file) { return Module._load(file, parent); }
    throw new Error("Cannot find module " + id);
  }

  Require.root = System.getProperty('user.dir');
  Require.resolve = Module._resolve;
  Require.cache = {};
  Require.extensions = {};
  require = Require;
}());

