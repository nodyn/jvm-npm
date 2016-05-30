module = (typeof module == 'undefined') ? {} : module;
(function () {
    var System = java.lang.System, Scanner = java.util.Scanner, File = java.io.File, Paths = java.nio.file.Paths;
    NativeRequire = (typeof NativeRequire === 'undefined') ? {} : NativeRequire;
    if (typeof require === 'function' && !NativeRequire.require) {
        NativeRequire.require = require;
    }
    function ModuleError(message, code, cause) {
        this.code = code || "UNDEFINED";
        this.message = message || "Error loading module";
        this.cause = cause;
    }
    ModuleError.prototype = new Error();
    ModuleError.prototype.constructor = ModuleError;
    var Module = (function () {
        function Module(id, parent, core) {
            this.id = id;
            this.parent = parent;
            this.core = core;
            this.children = [];
            this.loaded = false;
            this.exports = {};
            this.filename = id;
            Object.defineProperty(this, 'exports', {
                get: function () {
                    return this._exports;
                }.bind(this),
                set: function (val) {
                    Require.cache[this.filename] = val;
                    this._exports = val;
                }.bind(this),
            });
            if (parent && parent.children)
                parent.children.push(this);
            this.require = function (id) {
                return Require(id, this);
            }.bind(this);
        }
        Module._load = function (file, parent, core, main) {
            print("_load", file, parent, core, main);
            var module = new Module(file, parent, core);
            var __FILENAME__ = module.filename;
            var body = readFile(module.filename, module.core), dir = new File(module.filename).getParent(), args = ['exports', 'module', 'require', '__filename', '__dirname'], func = new Function(args, body);
            func.apply(module, [module.exports, module, module.require, module.filename, dir]);
            module.loaded = true;
            module.main = main;
            return module.exports;
        };
        Module.runMain = function (main) {
            var file = Require.resolve(main);
            Module._load(file, undefined, false, true);
        };
        return Module;
    }());
    function Require(id, parent) {
        print("require", id, parent);
        var core, native, file = Require.resolve(id, parent);
        if (!file) {
            if (typeof NativeRequire.require === 'function') {
                if (Require.debug) {
                    System.out.println(['Cannot resolve', id, 'defaulting to native'].join(' '));
                }
                native = NativeRequire.require(id);
                if (native)
                    return native;
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
            }
            else if (file.endsWith('.js')) {
                return Module._load(file, parent, core);
            }
            else if (file.endsWith('.json')) {
                return loadJSON(file);
            }
        }
        catch (ex) {
            if (ex instanceof java.lang.Exception) {
                throw new ModuleError("Cannot load module " + id, "LOAD_ERROR", ex);
            }
            else {
                System.out.println("Cannot load module " + id + " LOAD_ERROR");
                throw ex;
            }
        }
    }
    Require.resolve = function (id, parent) {
        print("resolve", id, parent);
        var roots = findRoots(parent);
        for (var i = 0; i < roots.length; ++i) {
            var root = roots[i];
            var result = resolveCoreModule(id, root) ||
                resolveAsFile(id, root, '.js') ||
                resolveAsFile(id, root, '.json') ||
                resolveAsDirectory(id, root) ||
                resolveAsNodeModule(id, root);
            if (result) {
                return result;
            }
        }
        return false;
    };
    Require.root = '';
    Require.NODE_PATH = undefined;
    Require.paths = [];
    Require.debug = true;
    Require.cache = {};
    Require.extensions = {};
    require = Require;
    module.exports = Module;
    function findRoots(parent) {
        var r = [];
        r.push(findRoot(parent));
        return r.concat(Require.paths);
    }
    function findRoot(parent) {
        if (!parent || !parent.id) {
            return Require.root;
        }
        var pathParts = parent.id.split(/[\/|\\,]+/g);
        pathParts.pop();
        return pathParts.join('/');
    }
    function loadJSON(file) {
        var json = JSON.parse(readFile(file, true));
        Require.cache[file] = json;
        return json;
    }
    function getParent(root) {
        return Paths.get(root).getParent() || "";
    }
    function resolveAsNodeModule(id, root) {
        var base = Paths.get(root, 'node_modules') || "";
        return resolveAsFile(id, base) ||
            resolveAsDirectory(id, base) ||
            (root ? resolveAsNodeModule(id, getParent(root)) : false);
    }
    function resolveAsDirectory(id, root) {
        if (root === void 0) { root = ""; }
        print("resolveAsDirectory", id, root);
        var base = Paths.get(root, id), file = Paths.get(base, 'package.json'), cl = java.lang.Thread.currentThread().getContextClassLoader();
        var url = cl.getResource(file);
        print(file, url);
        if (url != null) {
            try {
                var body = readFile(file, true), package = JSON.parse(body);
                if (package.main) {
                    return (resolveAsFile(package.main, base) ||
                        resolveAsDirectory(package.main, base));
                }
                return resolveAsFile('index.js', base);
            }
            catch (ex) {
                throw new ModuleError("Cannot load JSON file", "PARSE_ERROR", ex);
            }
        }
        return resolveAsFile('index.js', base);
    }
    function resolveAsFile(id, root, ext) {
        print("resolveAsFile", id, root, ext);
        var file, cl = java.lang.Thread.currentThread().getContextClassLoader();
        ;
        if (id.length > 0 && id[0] === '/') {
            file = normalizeName(id, ext || '.js');
            var url = cl.getResource(file);
            print(file, url);
            if (url != null) {
                return resolveAsDirectory(id);
            }
        }
        else {
            file = Paths.get(root, normalizeName(id, ext || '.js')).toString();
        }
        var url = cl.getResource(file);
        print(file, url);
        if (url != null) {
            return { path: file, core: true };
        }
    }
    function resolveCoreModule(id, root) {
        print("resolveCoreModule", id, root);
        var name = normalizeName(id);
        var classloader = java.lang.Thread.currentThread().getContextClassLoader();
        if (classloader.getResource(name))
            return { path: name, core: true };
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
            }
            else {
                input = new File(filename);
            }
            return new Scanner(input).useDelimiter("\\A").next();
        }
        catch (e) {
            throw new ModuleError("Cannot read file [" + input + "]: ", "IO_ERROR", e);
        }
    }
    if (typeof String.prototype.endsWith !== 'function') {
        String.prototype.endsWith = function (suffix) {
            if (!suffix)
                return false;
            return this.indexOf(suffix, this.length - suffix.length) !== -1;
        };
    }
}());
