/**
 *
 * JVM-NPM THAT LOOKUP MODULES EXCLUSIVELY IN CLASSPATH
 *
 */

declare namespace java {

  namespace lang {
    var System:any;
    var Thread:any;
    var Exception:any;
  }
  namespace io {
    var File:any;
  }
  namespace nio {

    namespace file {

      var Paths:any;
    }
  }
  namespace util {
    var Scanner:any;
  }

}

interface FunctionConstructor {
    new (args: string[], body:string): Function;
}

interface String {
  endsWith( suffix:string ):boolean;
}

declare function print( ...args: Object[] );

declare var module:any;
declare var require:Function;
declare var NativeRequire:any;
declare var Require:any;


module = (typeof module == 'undefined') ? {} :  module;

(function() {
  var System  = java.lang.System,
      Scanner = java.util.Scanner,
      File    = java.io.File,
      Paths = java.nio.file.Paths
      ;

  NativeRequire = (typeof NativeRequire === 'undefined') ? {} : NativeRequire;
  if (typeof require === 'function' && !NativeRequire.require) {
    NativeRequire.require = require;
  }

  function ModuleError(message:string, code?:string, cause?:any) {
    this.code = code || "UNDEFINED";
    this.message = message || "Error loading module";
    this.cause = cause;
  }
  ModuleError.prototype = new Error();
  ModuleError.prototype.constructor = ModuleError;

  /**
   * Module
   */
  class Module {

    children = [];
    filename:string;
    loaded = false;
    exports = {};
    require:Function;
    main:boolean;

    constructor( private id:string, private parent:any, private core:boolean) {

      this.filename = id;

      Object.defineProperty( this, 'exports', {
        get: function() {
          return this._exports;
        }.bind(this),
        set: function(val) {
          Require.cache[this.filename] = val;
          this._exports = val;
        }.bind(this),
      } );

      if (parent && parent.children) parent.children.push(this);

      this.require = function(id) {
        return new Require(id, this);
      }.bind(this);

    }

    /**
     * _load
     *
     */
    static _load( file, parent, core:boolean, main?:boolean ):any {
      print( "_load", file, parent, core, main );

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
      Module._load(file.path, undefined, file.core, true);

    }
  }

  interface ResolveResult {
    path:string;
    core?:boolean;
  }

  function resolveCoreModule(id:string, root:string):ResolveResult {
      print( "resolveCoreModule", id, root);

      var name = normalizeName(id);
      var classloader = java.lang.Thread.currentThread().getContextClassLoader();
      if (classloader.getResource(name))
          return { path: name, core: true };
    }

  function resolveAsNodeModule(id:string, root:string):ResolveResult {
    var base = Paths.get(root, 'node_modules') || "";

    return resolveAsFile(id, base) ||
      resolveAsDirectory(id, base) ||
      (root ? resolveAsNodeModule(id, getParent(root)) : undefined);
  }

  function resolveAsDirectory(id:string, root:string = ""):ResolveResult {
    print( "resolveAsDirectory", id, root);
    var base = Paths.get(root, id),
        file = Paths.get(base, 'package.json'),
        cl = java.lang.Thread.currentThread().getContextClassLoader();

    var url = cl.getResource( file ); print( file , url );

    if (url!=null) {
      try {
        var body = readFile( file, true ),
            package  = JSON.parse(body);
        if (package.main) {
          return (resolveAsFile(package.main, base) ||
                  resolveAsDirectory(package.main, base));
        }
        // if no package.main exists, look for index.js
        return resolveAsFile( 'index.js', base);
      } catch(ex) {
        throw new ModuleError("Cannot load JSON file", "PARSE_ERROR", ex);
      }
    }
    return resolveAsFile('index.js', base);
  }

  function resolveAsFile(id:string, root, ext?:string):ResolveResult {
    print( "resolveAsFile", id, root, ext);

    var file, cl = java.lang.Thread.currentThread().getContextClassLoader();
;
    if ( id.length > 0 && id[0] === '/' ) {
      file = normalizeName(id, ext || '.js');

      var url = cl.getResource( file ); print( file , url );

      if (url!=null) {
        return resolveAsDirectory(id);
      }
    } else {
      //file = [root, normalizeName(id, ext || '.js')].join('/');
      file = Paths.get(root, normalizeName(id, ext || '.js')).toString();

    }
    var url = cl.getResource( file ); print( file , url );

    if (url!=null) {
      return { path:file, core:true };
    }
  }



  class Require {
    static root = '';
    static NODE_PATH = undefined;
    static paths = [];
    static debug = true;
    static cache:[any];
    static extensions = {};

    static resolve(id:string, parent?):ResolveResult {
        print( "resolve", id, parent );

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
      };


  constructor(id:string, parent:any){
        print( "require", id, parent );

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


        try {
          if (Require.cache[file.path]) {
            return Require.cache[file.path];
          } else if (String(file.path).endsWith('.js')) {
            return Module._load(file.path, parent, file.core);
          } else if (String(file.path).endsWith('.json')) {
            return loadJSON(file.path, file.core);
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

  require = Require;

  module.exports = Module;



  function findRoots(parent) {
    var r = [];
    r.push( findRoot( parent ) );
    return r.concat( Require.paths );
  }

  function findRoot(parent) {
    if (!parent || !parent.id) { return Require.root; }
    var pathParts = parent.id.split(/[\/|\\,]+/g);
    pathParts.pop();
    return pathParts.join('/');
  }



  function loadJSON(file:string, core:boolean = false) {
    var json = JSON.parse(readFile(file,core));
    Require.cache[file] = json;
    return json;
  }

  function getParent(root:string) {
      return Paths.get( root ).getParent() || "";

  }


  function normalizeName(fileName:string, ext?:string) {
    var extension = ext || '.js';

    if (String(fileName).endsWith(extension)) {
      return fileName;
    }
    return fileName + extension;
  }

  function readFile(filename:string, core:boolean) {
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

/*
  function endsWith( s:string, suffix:string ):number
  // Helper function until ECMAScript 6 is complete
  if (typeof String.prototype.endsWith !== 'function') {

      String.prototype.endsWith = function(suffix) {
        if (!suffix) return false;
        return this.indexOf(suffix, this.length - suffix.length) !== -1;
      };
  }
*/

}());
