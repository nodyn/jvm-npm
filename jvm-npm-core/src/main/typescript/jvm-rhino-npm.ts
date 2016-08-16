/**
 *
 * JVM-NPM TAILORED FOR RHINO JS ENGINE
 *
 */
/// <reference path="jvm-npm.d.ts" />

module = (typeof module == 'undefined') ? {} :  module;

(function() {
  var System  = java.lang.System,
      Scanner = java.util.Scanner,
      File    = java.io.File,
      Paths = java.nio.file.Paths,
      Thread = java.lang.Thread
      ;

  NativeRequire = (typeof NativeRequire === 'undefined') ? {} : NativeRequire;
  if (typeof require === 'function' && !NativeRequire.require) {
    NativeRequire.require = require;
  }

  function ModuleError(message:string, code:string, cause?:any) {
    this.code = code || "UNDEFINED";
    this.message = message || "Error loading module";
    this.cause = cause;
  }

  ModuleError.prototype = new Error();
  ModuleError.prototype.constructor = ModuleError;

  class Module {

    children = [];
    filename;
    loaded = false;
    require:Function;
    main:boolean;

    _exports:any;

    get exports():any {
     return this._exports;
    }
    set exports(val:any) {
      Require.cache[this.filename] = val;
      this._exports = val;
    }

    static _load(file, parent, core:boolean, main?:boolean) {
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
    }

    static runMain(main) {
      var file = Require.resolve(main);
      Module._load(file, undefined, false, true);
    }

    constructor( public id, private parent:Module, private core:boolean) {
      this.filename = id;

      this.exports = {};

      if (parent && parent.children) parent.children.push(this);

      this.require = (id) => {
        return Require.call(this, id, this);
      }
    }

  }

  class Require {
    static root:string = System.getProperty('user.dir');
    static NODE_PATH:string = undefined;
    static paths = [];
    static debug = true;
    static cache: { [s: string]: any; } = {};
    static extensions = {};

    static resolve(id, parent?) {
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

    constructor(id, parent) {
      var core, native, file = Require.resolve(id, parent);

      if (!file) {
        if (typeof NativeRequire.require === 'function') {
          if (Require.debug) {
            System.out.println(['cannot resolve', id, 'defaulting to native'].join(' '));
          }
          try {
              native = NativeRequire.require(id);
              if (native) return native;
          }catch(e) {
            throw new ModuleError("cannot load module " + id, "MODULE_NOT_FOUND");
          }
        }
        if (Require.debug) {
          System.err.println("cannot load module " + id);
        }
        throw new ModuleError("cannot load module " + id, "MODULE_NOT_FOUND");
      }

      if (file.core) {
        file = file.path;
        core = true;
      }
      try {
        if (Require.cache[file]) {
          return Require.cache[file];
        } else if (String(file).endsWith('.js')) {
          return Module._load(file, parent, core);
        } else if (String(file).endsWith('.json')) {
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

  }

  require         = Require;
  module.exports  = Module;

  function findRoots(parent) {
    var r = [];
    r.push( findRoot( parent ) );
    return r.concat( Require.paths );
  }

  function findRoot(parent):string {
    if (!parent || !parent.id) { return Require.root; }

    var path = ( parent.id instanceof java.nio.file.Path ) ?
      (parent.id as Path) :
      Paths.get( parent.id );

    return path.getParent() || "";

  }

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

  function resolveAsDirectory(id, root?) {
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
    return resolveAsFile('index.js', base);
  }

  function resolveAsFile(id, root, ext?:string) {
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
  }

  function resolveCoreModule(id, root) {
    var name = normalizeName(id);
    var classloader = Thread.currentThread().getContextClassLoader();
    if (classloader.getResource(name))
        return { path: name, core: true };
  }

  function normalizeName(fileName, extension:string = '.js') {
    if (String(fileName).endsWith(extension)) {
      return fileName;
    }
    return fileName + extension;
  }

  function readFile(filename, core?:boolean) {
    var input;
    try {
      if (core) {
        var classloader = Thread.currentThread().getContextClassLoader();
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


}());
