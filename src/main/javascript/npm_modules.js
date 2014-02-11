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
    
    if (self.parent && self.parent.children) {
      self.parent.children.push(self);
    }

    self.require = function(id) {
      return Require(id, self);
    };

    self._load = function() {
      if (self.loaded) return;
      var body   = readFile(self.filename),
          dir    = new File(self.filename).getParent(),
          args   = ['exports', 'module', 'require', '__filename', '__dirname'],
          func   = new Function(args, body);
      func.apply(self, [self.exports, self, self.require, self.filename, dir]);
      self.loaded = true;
    };
  }

  function Require(id, parent) {
    var file = Require.resolve(id, parent);

    if (!file) 
      throw new ModuleError("Cannot find module " + id, "MODULE_NOT_FOUND");

    if (Require.cache[file]) {
      return Require.cache[file];
    }

    if (file.endsWith('.js')) { 
      var module = new Module(file, parent);
      // prime the cache in order to support cyclic dependencies
      Require.cache[module.filename] = module.exports;
      module._load();
      Require.cache[module.filename] = module.exports;
      return module.exports;
    } else if (file.endsWith('.json')) {
      try {
        var json = JSON.parse(readFile(file));
        Require.cache[file] = json;
        return json;
      } catch(ex) {
        throw new ModuleError("Cannot load JSON file: " + ex, "PARSE_ERROR");
      }
    }
  }

  Require.resolve = function(id, parent) {
    var root = findRoot(parent);
    return resolveAsFile(id, root, '.js') || 
      resolveAsFile(id, root, '.json') || 
      resolveAsDirectory(id, root) ||
      resolveAsNodeModule(id, root);
  };

  Require.root = System.getProperty('user.dir');
  Require.cache = {};
  Require.extensions = {};
  require = Require;

  function resolveAsNodeModule(id, root) {
    var base = [root, 'node_modules'].join('/');
    return resolveAsFile(id, base) ||
      resolveAsDirectory(id, base) ||
      ((root != Require.root) ? 
       resolveAsNodeModule(id, new File(root).getParent()) : 
       false);
  }

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

