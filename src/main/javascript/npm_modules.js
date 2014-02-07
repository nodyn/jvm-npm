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
    this.filename = id;
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
    var body   = Require._readFile(file);
    var module = new Module(file, parent);
    var dir    = new File(file).getParent();
    var args   = ['exports', 'module', 'require', '__filename', '__dirname'];
    var func   = new Function(args, body);
    func.apply(module, [module.exports, module, module.require, file, dir]);
    module.loaded = true;
    return module.exports;
  };

  function Require(id, parent) {
    var file = Require.resolve(id, parent);

    if (!file) throw new Error("Cannot find module " + id);

    if (file.endsWith('.js')) { 
      return Module._load(file, parent); 
    }
    else if (file.endsWith('.json')) {
      try {
        var body = Require._readFile(file);
        return JSON.parse(body);
      } catch(e) {
        throw new Error("Cannot load JSON file: " + e);
      }
    }
  }

  function normalizeName(fileName, ext) {
    var extension = ext || '.js';
    if (fileName.endsWith(extension)) {
      return fileName;
    }
    return fileName + extension;
  }

  Require.resolve = function(id, parent) {
    var name = normalizeName(id);
    var root = Require._findRoot(parent);
    var file = new File([root, name].join('/'));
    if (file.exists()) {
      return file.getCanonicalPath();
    }
    // See if there is a JSON file instead
    name = normalizeName(id, '.json');
    file = new File([root, name].join('/'));
    return file.exists() ? file.getCanonicalPath() : false;
  };

  Require._findRoot = function(parent) {
    if (!parent) { return Require.root; }
    var pathParts = parent.id.split('/');
    pathParts.pop();
    return pathParts.join('/');
  };

  Require._readFile = function(filename) {
    try {
      // TODO: I think this is not very efficient
      return new Scanner(new File(filename)).useDelimiter("\\A").next();
    } catch(e) {
      throw new Error("Cannot read file ["+file+"]: " + e);
    }
  };

  Require.root = System.getProperty('user.dir');
  Require.cache = {};
  Require.extensions = {};
  require = Require;

  // Helper function until ECMAScript 6 is complete
  if (typeof String.prototype.endsWith !== 'function') {
    String.prototype.endsWith = function(suffix) {
        return this.indexOf(suffix, this.length - suffix.length) !== -1;
    };
  }
}());

