/**
 *
 * JVM-NPM THAT LOOKUP MODULES EXCLUSIVELY IN CLASSPATH
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
      type Path = java.nio.file.Path;

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
    _exports:any;
    require:Function;
    main:boolean;

    get exports():any {
     return this._exports;
    }
    set exports(val:any) {
      Require.cache[this.filename] = val;
      this._exports = val;
    }

    constructor( public id:string|Path, private parent:Module, private core:boolean) {
      this.filename = id as string;

      if (parent && parent.children) parent.children.push(this);

      this.require = (id) => {
        return new Require(id, this);
      }

      this.exports = {};
    }

    /**
     * _load
     *
     */
    static _load( file, parent:Module, core:boolean, main?:boolean ):any {
      // print( "_load", file, parent, core, main );

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

  function resolveCoreModule(id:string, root:Path):ResolveResult {
      // print(  "resolveCoreModule", id, root);

      var name = normalizeName(id);

      if (isResourceResolved(name))
          return { path: name, core: true };
    }

  function resolveAsNodeModule(id:string, root:Path):ResolveResult {
    var base = Paths.get(root, 'node_modules');

    return resolveAsFile(id, base) ||
      resolveAsDirectory(id, base) ||
      (root ? resolveAsNodeModule(id, root.getParent()) : undefined);
  }

  function resolveAsDirectory(id:string, root?:Path):ResolveResult {

    // print(  "resolveAsDirectory", id, root);

    var base = mergePath(id,root),
        file = base.resolve('package.json').toString();
        ;

    if (isResourceResolved(file)) {
      try {
        var body = readFile( file, true ),
            package  = JSON.parse(body);
        if (package.main) {
          return (resolveAsFile(package.main, base) ||
                  resolveAsDirectory(package.main, base));
        }
        // if no package.main exists, look for index.js
        //return resolveAsFile( 'index.js', base);
      } catch(ex) {
        throw new ModuleError("Cannot load JSON file", "PARSE_ERROR", ex);
      }
    }
    return resolveAsFile('index.js', base);
  }

  /**
  resolveAsFile
  @param id
  @param root
  @param ext
  */
  function resolveAsFile(id:string, root:Path, ext?:string):ResolveResult {

    var file = mergePath(id,root).toString();

    // print(  "resolveAsFile", id, root, ext, file);

    file = normalizeName(file, ext || '.js');

    if ( file.length > 0 && file[0] === '/' ) {

      if (isResourceResolved(file)) {
        return resolveAsDirectory(id);
      }
    }

    if (isResourceResolved(file)) {
      return { path:file, core:true };
    }
  }

  function isResourceResolved( id:string ):boolean {
    var cl = Thread.currentThread().getContextClassLoader();

    var url = cl.getResource( id );

    // print(  "\tisResourceResolved", url!=null, id );

    return url!=null;
  }

  function findRoots(parent:Module):Array<string> {
    var r:Array<string> = [];

    r.push( findRoot( parent ) );

    return r.concat( Require.paths );
  }

  function findRoot(parent:Module):string {
    if (!parent || !parent.id) { return Require.root; }

    var path = ( parent.id instanceof java.nio.file.Path ) ?
      (parent.id as Path) :
      Paths.get( parent.id );

    return path.getParent() || "";

  }

  function mergePath( id:string, root:Path ):Path {
    if( !id  ) throw new ModuleError("impossible merge an undefined paths");

    var path:Path = Paths.get(id);
    if( root && !path.startsWith(root) ) path = Paths.get( root, id );

    return path.normalize();
  }

  class Require {
    static root = '';
    static NODE_PATH = undefined;
    static paths:Array<string> = [];
    static debug = true;
    static cache:[any];
    static extensions = {};

    static resolve(id:string, parent?:Module):ResolveResult {
        // print(  "resolve", id, parent );

        var roots = findRoots(parent);
        for ( var i = 0 ; i < roots.length ; ++i ) {
          var root = Paths.get(roots[i]);
          var result =
            resolveCoreModule(id, root)       ||
            resolveAsFile(id, root, '.js')    ||
            resolveAsFile(id, root, '.json')  ||
            resolveAsDirectory(id, root)      ||
            resolveAsNodeModule(id, root);

            if ( result ) {
              return result;
            }
        }
      };


  constructor(id:string, parent:Module){
        // print(  "require", id, parent );

        var file = Require.resolve(id, parent);

        if (!file) {
          if (typeof NativeRequire.require === 'function') {
            if (Require.debug) {
              System.out.println(['Cannot resolve', id, 'defaulting to native'].join(' '));
            }
            var native = NativeRequire.require(id);
            if (native) return native;
          }
          System.err.println("Cannot find module " + id);
          throw new ModuleError("Cannot find module " + id, "MODULE_NOT_FOUND");
        }


        try {
          // print(  "Require.cache.get", file.path);

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

  function loadJSON(file:string, core:boolean = false) {
    var json = JSON.parse(readFile(file,core));
    Require.cache[file] = json;
    return json;
  }

  function normalizeName(fileName:string, extension = '.js') {

    if (String(fileName).endsWith(extension)) {
      return fileName;
    }
    return fileName + extension;
  }

  function readFile(filename:string, core:boolean) {
    // print(  '\treadFile', filename, core);
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
