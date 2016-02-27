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
// Since we intend to use the Function constructor.
/* jshint evil: true */

module = (typeof module == 'undefined') ? {} :  module;

(function() {
  var System  = java.lang.System,
      Scanner = java.util.Scanner,
      File    = java.io.File;

  NativeRequire = (typeof NativeRequire === 'undefined') ? {} : NativeRequire;
  if (typeof require === 'function' && !NativeRequire.require) {
    NativeRequire.require = require;
  }

  function Module(id, parent, core) {
    this.id = id;
    this.core = core;
    this.parent = parent;
    this.children = [];
    this.filename = id;
    this.loaded = false;

    Object.defineProperty( this, 'exports', {
      get: function() {
        return this._exports;
      }.bind(this),
      set: function(val) {
        Require.cache[this.filename] = val;
        this._exports = val;
      }.bind(this),
    } );
    this.exports = {};

    if (parent && parent.children) parent.children.push(this);

    this.require = function(id) {
      return Require(id, this);
    }.bind(this);
  }

  Module._load = function _load(file, parent, core, main) {
    var module = new Module(file, parent, core);
    var __FILENAME__ = module.filename;
    var body   = readFile(module.filename, module.core),
        dir    = new File(module.filename).getParent(),
        args   = ['exports', 'module', 'require', '__filename', '__dirname'],
        func   = new Function(args, body);
    func.apply(module,
        [module.exports, module, module.require, module.filename, dir]);
    module.loaded = true;
    module.main = main;
    return module.exports;
  };

  Module.runMain = function runMain(main) {
    var file = Require.resolve(main);
    Module._load(file, undefined, false, true);
  };

  function Require(id, parent) {
    var core, native, file = Require.resolve(id, parent);

    if (!file) {
      if (typeof NativeRequire.require === 'function') {
        if (Require.debug) {
          System.out.println(['Cannot resolve', id, 'defaulting to native'].join(' '));
        }
        native = NativeRequire.require(id);
        if (native) return native;
      }
      System.err.println("Cannot find module " + id);
      throw new ModuleError("Cannot find module " + id, "MODULE_NOT_FOUND");
    }

    if (file.core) {
      file = file.path;
      core = true;
    }
    try {
      if (Require.cache[file]) {
        return Require.cache[file];
      } else if (file.endsWith('.js')) {
        return Module._load(file, parent, core);
      } else if (file.endsWith('.json')) {
        return loadJSON(file);
      }
    } catch(ex) {
      if (ex instanceof java.lang.Exception) {
        throw new ModuleError("Cannot load module " + id, "LOAD_ERROR", ex);
      } else {
        System.out.println("Cannot load module " + id + " LOAD_ERROR");
        throw ex;
      }
    }
  }

  Require.resolve = function(id, parent) {
    var roots = findRoots(parent);
    for ( var i = 0 ; i < roots.length ; ++i ) {
      var root = roots[i];
      var result = resolveCoreModule(id, root) ||
        resolveAsFile(id, root, '.js')   ||
        resolveAsFile(id, root, '.json') ||
        resolveAsDirectory(id, root)     ||
        resolveAsNodeModule(id, root);
      if ( result ) {
        return result;
      }
    }
    return false;
  };

  Require.root = System.getProperty('user.dir');
  Require.NODE_PATH = undefined;

  function findRoots(parent) {
    var r = [];
    r.push( findRoot( parent ) );
    return r.concat( Require.paths() );
  }

  function parsePaths(paths) {
    if ( ! paths ) {
      return [];
    }
    if ( paths === '' ) {
      return [];
    }
    var osName = java.lang.System.getProperty("os.name").toLowerCase();
    var separator;

    if ( osName.indexOf( 'win' ) >= 0 ) {
      separator = ';';
    } else {
      separator = ':';
    }

    return paths.split( separator );
  }

  Require.paths = function() {
    var r = [];
    r.push( java.lang.System.getProperty( "user.home" ) + "/.node_modules" );
    r.push( java.lang.System.getProperty( "user.home" ) + "/.node_libraries" );

    if ( Require.NODE_PATH ) {
      r = r.concat( parsePaths( Require.NODE_PATH ) );
    } else {
      var NODE_PATH = java.lang.System.getenv.NODE_PATH;
      if ( NODE_PATH ) {
        r = r.concat( parsePaths( NODE_PATH ) );
      }
    }
    // r.push( $PREFIX + "/node/library" );
    return r;
  };

  function findRoot(parent) {
    if (!parent || !parent.id) { return Require.root; }
    var pathParts = parent.id.split(/[\/|\\,]+/g);
    pathParts.pop();
    return pathParts.join('/');
  }

  Require.debug = true;
  Require.cache = {};
  Require.extensions = {};
  require = Require;

  module.exports = Module;


  function loadJSON(file) {
    var json = JSON.parse(readFile(file));
    Require.cache[file] = json;
    return json;
  }

  function resolveAsNodeModule(id, root) {
    var base = [root, 'node_modules'].join('/');
    return resolveAsFile(id, base) ||
      resolveAsDirectory(id, base) ||
      (root ? resolveAsNodeModule(id, new File(root).getParent()) : false);
  }

  function resolveAsDirectory(id, root) {
    var base = [root, id].join('/'),
        file = new File([base, 'package.json'].join('/'));
    if (file.exists()) {
      try {
        var body = readFile(file.getCanonicalPath()),
            package  = JSON.parse(body);
        if (package.main) {
          return (resolveAsFile(package.main, base) ||
                  resolveAsDirectory(package.main, base));
        }
        // if no package.main exists, look for index.js
        return resolveAsFile('index.js', base);
      } catch(ex) {
        throw new ModuleError("Cannot load JSON file", "PARSE_ERROR", ex);
      }
    }   
    return resolveCoreModule([id, 'index.js'].join('/'), root) ||
      resolveAsFile('index.js', base);
  }

  function resolveAsFile(id, root, ext) {
    var file;
    if ( id.length > 0 && id[0] === '/' ) {
      file = new File(normalizeName(id, ext || '.js'));
      if (!file.exists()) {
        return resolveAsDirectory(id);
      }
    } else {
      file = new File([root, normalizeName(id, ext || '.js')].join('/'));
    }
    if (file.exists()) {
      return file.getCanonicalPath();
    }
    var result = resolveCoreModule(id, root);
    if ( result ) {
      return result;
    }
  }

  function resolveCoreModule(id, root) {
    var name = normalizeName(id);
    var classloader = java.lang.Thread.currentThread().getContextClassLoader();
    if (classloader.getResource(name))
        return { path: name, core: true };
    if(name.startsWith('./'))
      name = name.substring(2);
    if (classloader.getResource(name))
        return { path: name, core: true };
    var path = [root, name].join('/');
    if (classloader.getResource(path))
        return { path: path, core: true };
  }

  function normalizeName(fileName, ext) {
    var extension = ext || '.js';
    if (fileName.endsWith(extension)) {
      return fileName;
    }
    return fileName + extension;
  }

  function readFile(filename, core) {
    var input;
    try {
      if (core) {
        var classloader = java.lang.Thread.currentThread().getContextClassLoader();
        input = classloader.getResourceAsStream(filename);
      } else {
        input = new File(filename);
      }
      // TODO: I think this is not very efficient
      return new Scanner(input).useDelimiter("\\A").next();
    } catch(e) {
      throw new ModuleError("Cannot read file ["+input+"]: ", "IO_ERROR", e);
    }
  }

  function ModuleError(message, code, cause) {
    this.code = code || "UNDEFINED";
    this.message = message || "Error loading module";
    this.cause = cause;
  }

  // Helper function until ECMAScript 6 is complete
  if (typeof String.prototype.endsWith !== 'function') {
    String.prototype.endsWith = function(suffix) {
      if (!suffix) return false;
      return this.indexOf(suffix, this.length - suffix.length) !== -1;
    };
  }

  ModuleError.prototype = new Error();
  ModuleError.prototype.constructor = ModuleError;

}());
