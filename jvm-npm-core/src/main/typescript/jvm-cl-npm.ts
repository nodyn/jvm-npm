/**
 *
 * JVM-NPM TAILORED FOR RHINO THAT LOOKUP MODULES EXCLUSIVELY IN CLASSPATH
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

    /**
     * _load
     *
     */
    static _load( file, parent:Module, core:boolean, main?:boolean ):any {

      var module = new Module(file, parent, core);
      var __FILENAME__ = module.filename;
      var body   = module.getBody(),
          dir    = module.getParent(),
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

    constructor( public id:string|Path, private parent:Module, private core:boolean) {
      this.filename = id as string;

      if (parent && parent.children) parent.children.push(this);

      this.require = (id) => {
        return Require.call(this, id, this);
      }

      this.exports = {};
    }

    private getBody():string {
      return Resolve.readFile(this.filename, this.core);
    }

    private getParent():string {
      var path = Paths.get( this.filename);

      return path.getParent() || "";
    }
  }


  class Require {
      static root = '';
      static NODE_PATH = undefined;
      static paths:Array<string> = [];
      static get debug():boolean {
          return java.lang.Boolean.getBoolean("jvm-npm.debug");
      }
      static cache: { [s: string]: any; } = {};
      static extensions = {};

      static resolve(id:string, parent?:Module):ResolveResult {
          if( Require.debug ) {
            print( "\n\nRESOLVE-CL:", id );
          }

          var roots = findRoots(parent);
          for ( var i = 0 ; i < roots.length ; ++i ) {
            var root = Paths.get(roots[i]);
            var result =
              Resolve.asCoreModule(id, root)       ||
              Resolve.asFile(id, root, '.js')    ||
              Resolve.asFile(id, root, '.json')  ||
              Resolve.asDirectory(id, root)      ||
              Resolve.asNodeModule(id, root);

              if ( result ) {
                return result;
              }
          }
        };


    constructor(id:string, parent:Module){

          var file = Require.resolve(id, parent);

          if (!file) {
            if (typeof NativeRequire.require === 'function') {
              if (Require.debug) {
                print( 'Cannot resolve', id, 'defaulting to native' );
              }
              var native = NativeRequire.require(id);
              if (native) return native;
            }
            print("Cannot find module ", id);
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
              print("Cannot load module ", id, " LOAD_ERROR");
              throw ex;
            }
          }
        }
  }

  require = Require;
  module.exports = Module;

  class Resolve {

    static asFile:(id, root, ext?:string) => any = _resolveAsFile;

    static asDirectory:(id, root?) => any = _resolveAsDirectory;

    static readFile:(filename, core?:boolean) => any = _readFile;

    static asNodeModule:(id, root) => any = _resolveAsNodeModule;

    static asCoreModule:(id, root) => any = _resolveAsCoreModule;

  }

  let indent = 0;

  if( Require.debug ) {

    Resolve.asFile = (id, root, ext?:string) => {

        print( repeat(indent), "resolveAsFile", id, root, ext );
        ++indent;
        let result = _resolveAsFile( id, root, ext );
        --indent;
        print( repeat(indent), "result:", (result)?result.path:result );
        return result;
    }

    Resolve.asDirectory = (id, root?) => {

      print( repeat(indent), "resolveAsDirectory", id, root );
      ++indent;
      let result = _resolveAsDirectory( id, root );
      --indent;
      print( repeat(indent), "result:", (result)?result.path:result  );
      return result;
    }

    Resolve.asNodeModule = (id, root) => {

        print( repeat(indent), "resolveAsNodeModule", id, root );
        ++indent;
        let result = _resolveAsNodeModule( id, root );
        --indent;
        print( repeat(indent), "result:", (result)?result.path:result  );
        return result;
    }


    Resolve.readFile = (filename, core?:boolean) => {

        print( repeat(indent), "readFile", filename, core );
        return _readFile(filename, core);
    }

    Resolve.asCoreModule = (id, root) => {

        print( repeat(indent), "resolveAsCoreModule", id, root );
        ++indent;
        let result = _resolveAsCoreModule( id, root );
        --indent;
        print( repeat(indent), "result:", (result)?result.path:result  );
        return result;
    }

  }

  function repeat(n:number, ch:string = "-"):string {
    if( n <=0 ) return ">";
    return new Array(n*4).join(ch);
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

  function loadJSON(file:string, core:boolean = false) {
    var json = JSON.parse(Resolve.readFile(file,core));
    Require.cache[file] = json;
    return json;
  }

  function normalizeName(fileName:string, extension = '.js') {

    if (String(fileName).endsWith(extension)) {
      return fileName;
    }
    return fileName + extension;
  }

  function isResourceResolved( id:string ):boolean {
    var cl = Thread.currentThread().getContextClassLoader();

    var url = cl.getResource( id );

    return url!=null;
  }

  function _resolveAsCoreModule(id:string, root:Path):ResolveResult {

      var name = normalizeName(id);

      if (isResourceResolved(name))
          return { path: name, core: true };
  }

  function _resolveAsNodeModule(id:string, root:Path):ResolveResult {

    var base = Paths.get(root, 'node_modules');

    return Resolve.asFile(id, base) ||
      Resolve.asDirectory(id, base) ||
      (root ? Resolve.asNodeModule(id, root.getParent()) : undefined);
  }

  function _resolveAsDirectory(id:string, root?:Path):ResolveResult {

    var base = mergePath(id,root),
        file = base.resolve('package.json').toString();
        ;

    if (isResourceResolved(file)) {
      try {
        var body = Resolve.readFile( file, true ),
            package  = JSON.parse(body);
        if (package.main) {
          return (Resolve.asFile(package.main, base) ||
                  Resolve.asDirectory(package.main, base));
        }
        // if no package.main exists, look for index.js
        //return resolveAsFile( 'index.js', base);
      } catch(ex) {
        throw new ModuleError("Cannot load JSON file", "PARSE_ERROR", ex);
      }
    }
    return Resolve.asFile('index.js', base);
  }

  /**
  resolveAsFile
  @param id
  @param root
  @param ext
  */
  function _resolveAsFile(id:string, root:Path, ext?:string):ResolveResult {

    var file = mergePath(id,root).toString();

    file = normalizeName(file, ext || '.js');

    if ( file.length > 0 && file[0] === '/' ) {

      if (isResourceResolved(file)) {
        return Resolve.asDirectory(id);
      }
    }

    if (isResourceResolved(file)) {
      return { path:file, core:true };
    }
  }

  function _readFile(filename:string, core:boolean) {

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
