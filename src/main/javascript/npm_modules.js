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
    var body   = readFile(file),
        module = new Module(file, parent),
        dir    = new File(file).getParent(),
        args   = ['exports', 'module', 'require', '__filename', '__dirname'],
        func   = new Function(args, body);
    func.apply(module, [module.exports, module, module.require, file, dir]);
    module.loaded = true;
    return module.exports;
  };

  function Require(id, parent) {
    var file = Require.resolve(id, parent),
        moduleExports = {};

    if (!file) 
      throw new ModuleError("Cannot find module " + id, "MODULE_NOT_FOUND");

    if (file.endsWith('.js')) { 
      moduleExports = Module._load(file, parent); 
    }
    else if (file.endsWith('.json')) {
      try {
        moduleExports = JSON.parse(readFile(file));
      } catch(ex) {
        throw new ModuleError("Cannot load JSON file: " + ex, "PARSE_ERROR");
      }
    }
    require.cache[file] = moduleExports;
    return moduleExports;
  }

  Require.resolve = function(id, parent) {
    var root = findRoot(parent);

    // Try to load the module as a file
    var file = resolveAsFile(id, root, '.js');
    if (file) return file;
    file = resolveAsFile(id, root, '.json');
    if (file) return file;

    // OK, no file exists, how about directory?
    return resolveAsDirectory(id, root);
  };

  Require.root = System.getProperty('user.dir');
  Require.cache = {};
  Require.extensions = {};
  require = Require;

  function resolveAsDirectory(id, root) {
    var base = [root, id].join('/');
    var file = new File([base, 'package.json'].join('/'));
    if (file.exists()) {
      try {
        var body     = readFile(file.getCanonicalPath());
        var package  = JSON.parse(body);
        return resolveAsFile(package.main || 'index.js', base);
      } catch(ex) {
        throw new ModuleError("Cannot load JSON file: " + ex, "PARSE_ERROR");
      }
      return file.exists() ? file.getCanonicalPath() : false;
    }
    return resolveAsFile('index.js', base);
  }

  function resolveAsFile(id, root, ext) {
    var extension = ext || '.js';
    var name = normalizeName(id, extension);
    var file = new File([root, name].join('/'));
    return file.exists() ? file.getCanonicalPath() : false;
  }

  function normalizeName(fileName, ext) {
    var extension = ext || '.js';
    if (fileName.endsWith(extension)) {
      return fileName;
    }
    return fileName + extension;
  }

  function findRoot(parent) {
    if (!parent) { return Require.root; }
    var pathParts = parent.id.split('/');
    pathParts.pop();
    return pathParts.join('/');
  }

  function readFile(filename) {
    try {
      // TODO: I think this is not very efficient
      return new Scanner(new File(filename)).useDelimiter("\\A").next();
    } catch(e) {
      throw new ModuleError("Cannot read file ["+file+"]: " + e, "IO_ERROR");
    }
  }

  function ModuleError(message, code) {
    this.code = code || "UNDEFINED";
    this.message = message || "Error loading module";
  }

  // Helper function until ECMAScript 6 is complete
  if (typeof String.prototype.endsWith !== 'function') {
    String.prototype.endsWith = function(suffix) {
        return this.indexOf(suffix, this.length - suffix.length) !== -1;
    };
  }

  ModuleError.prototype = new Error();
  ModuleError.prototype.constructor = ModuleError;
}());

