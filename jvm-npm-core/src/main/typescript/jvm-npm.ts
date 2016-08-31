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
      var body   = Resolve.readFile(module.filename, module.core),
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
    static get debug():boolean {
        return java.lang.Boolean.getBoolean("jvm-npm.debug");
    }
    static cache: { [s: string]: any; } = {};
    static extensions = {};

    static resolve(id, parent?) {
      if( Require.debug ) {
        print( "\n\nRESOLVE:", id );
      }
      var roots = findRoots(parent);
      for ( var i = 0 ; i < roots.length ; ++i ) {
        var root = roots[i];
        var result = Resolve.asCoreModule(id, root) ||
          Resolve.asFile(id, root, '.js')   ||
          Resolve.asFile(id, root, '.json') ||
          Resolve.asDirectory(id, root)     ||
          Resolve.asNodeModule(id, root);
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
            print('cannot resolve', id, 'defaulting to native');
          }
          try {
              native = NativeRequire.require(id);
              if (native) return native;
          }catch(e) {
            throw new ModuleError("cannot load module " + id, "MODULE_NOT_FOUND");
          }
        }
        if (Require.debug) {
          print("cannot load module ", id);
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
        return result;
    }

    Resolve.asDirectory = (id, root?) => {
      print( repeat(indent), "resolveAsDirectory", id, root );
      ++indent;
      let result = _resolveAsDirectory( id, root );
      --indent;
      print( repeat(indent), "result:", result );
      return result;

    }

    Resolve.asNodeModule = (id, root) => {

        print( repeat(indent), "resolveAsNodeModule", id, root );
        ++indent;
        let result = _resolveAsNodeModule( id, root );
        --indent;
        print( repeat(indent), "result:", result );
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
        print( repeat(indent), "result:", (result) ? result.path : result );
        return result;
    }

  }

  function repeat(n:number, ch:string = "-"):string {
    if( n <=0 ) return ">";
    return new Array(n*4).join(ch);
  }

  function relativeToRoot( p:Path ):Path {

    if( p.startsWith(Require.root)) {
      let len = Paths.get(Require.root).getNameCount();
      p = p.subpath(len, p.getNameCount());//.normalize();
    }
    return p;
  }

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
    var json = JSON.parse(Resolve.readFile(file));
    Require.cache[file] = json;
    return json;
  }

  function normalizeName(fileName, extension:string = '.js') {
    if (String(fileName).endsWith(extension)) {
      return fileName;
    }
    return fileName + extension;
  }


  function _resolveAsNodeModule(id, root) {

    var base = [root, 'node_modules'].join('/');
    return Resolve.asFile(id, base) ||
      Resolve.asDirectory(id, base) ||
      (root ? Resolve.asNodeModule(id, new File(root).getParent()) : false);
  }

  function _resolveAsDirectory(id, root?) {
    var base = [root, id].join('/'),
        file = new File([base, 'package.json'].join('/'));
    if (file.exists()) {
      try {
        var body = Resolve.readFile(file.getCanonicalPath()),
            package  = JSON.parse(body);
        if (package.main) {
          return (Resolve.asFile(package.main, base) ||
                  Resolve.asDirectory(package.main, base));
        }
        // if no package.main exists, look for index.js
        return Resolve.asFile('index.js', base);
      } catch(ex) {
        throw new ModuleError("Cannot load JSON file", "PARSE_ERROR", ex);
      }
    }
    return Resolve.asFile('index.js', base);
  }

  function _resolveAsFile(id, root, ext?:string) {
    var file;
    if ( id.length > 0 && id[0] === '/' ) {
      file = new File(normalizeName(id, ext || '.js'));
      if (!file.exists()) {
        return Resolve.asDirectory(id);
      }
    } else {
      file = new File([root, normalizeName(id, ext || '.js')].join('/'));
    }
    if (file.exists()) {
      let result = file.getCanonicalPath();
      if( Require.debug ) {
          print( repeat(indent-1), "result:", relativeToRoot(file.toPath()) );
      }
      return result;
    }
  }

  function _resolveAsCoreModule(id, root) {
    var name = normalizeName(id);
    var classloader = Thread.currentThread().getContextClassLoader();
    if (classloader.getResource(name))
        return { path: name, core: true };
  }

  function _readFile(filename, core?:boolean) {
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
