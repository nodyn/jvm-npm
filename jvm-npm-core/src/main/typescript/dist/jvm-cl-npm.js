module = (typeof module == 'undefined') ? {} : module;
(function () {
    var System = java.lang.System, Scanner = java.util.Scanner, File = java.io.File, Paths = java.nio.file.Paths, Thread = java.lang.Thread;
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
            var _this = this;
            this.id = id;
            this.parent = parent;
            this.core = core;
            this.children = [];
            this.loaded = false;
            this.filename = id;
            if (parent && parent.children)
                parent.children.push(this);
            this.require = function (id) {
                return Require.call(_this, id, _this);
            };
            this.exports = {};
        }
        Object.defineProperty(Module.prototype, "exports", {
            get: function () {
                return this._exports;
            },
            set: function (val) {
                Require.cache[this.filename] = val;
                this._exports = val;
            },
            enumerable: true,
            configurable: true
        });
        Module._load = function (file, parent, core, main) {
            var module = new Module(file, parent, core);
            var __FILENAME__ = module.filename;
            var body = module.getBody(), dir = module.getParent(), args = ['exports', 'module', 'require', '__filename', '__dirname'], func = new Function(args, body);
            func.apply(module, [module.exports, module, module.require, module.filename, dir]);
            module.loaded = true;
            module.main = main;
            return module.exports;
        };
        Module.runMain = function (main) {
            var file = Require.resolve(main);
            Module._load(file.path, undefined, file.core, true);
        };
        Module.prototype.getBody = function () {
            return Resolve.readFile(this.filename, this.core);
        };
        Module.prototype.getParent = function () {
            var path = Paths.get(this.filename);
            return path.getParent() || "";
        };
        return Module;
    }());
    var Require = (function () {
        function Require(id, parent) {
            var file = Require.resolve(id, parent);
            if (!file) {
                if (typeof NativeRequire.require === 'function') {
                    if (Require.debug) {
                        print('Cannot resolve', id, 'defaulting to native');
                    }
                    var native = NativeRequire.require(id);
                    if (native)
                        return native;
                }
                print("Cannot find module ", id);
                throw new ModuleError("Cannot find module " + id, "MODULE_NOT_FOUND");
            }
            try {
                if (Require.cache[file.path]) {
                    return Require.cache[file.path];
                }
                else if (String(file.path).endsWith('.js')) {
                    return Module._load(file.path, parent, file.core);
                }
                else if (String(file.path).endsWith('.json')) {
                    return loadJSON(file.path, file.core);
                }
            }
            catch (ex) {
                if (ex instanceof java.lang.Exception) {
                    throw new ModuleError("Cannot load module " + id, "LOAD_ERROR", ex);
                }
                else {
                    print("Cannot load module ", id, " LOAD_ERROR");
                    throw ex;
                }
            }
        }
        Object.defineProperty(Require, "debug", {
            get: function () {
                return java.lang.Boolean.getBoolean("jvm-npm.debug");
            },
            enumerable: true,
            configurable: true
        });
        Require.resolve = function (id, parent) {
            if (Require.debug) {
                print("\n\nRESOLVE-CL:", id);
            }
            var roots = findRoots(parent);
            for (var i = 0; i < roots.length; ++i) {
                var root = Paths.get(roots[i]);
                var result = Resolve.asCoreModule(id, root) ||
                    Resolve.asFile(id, root, '.js') ||
                    Resolve.asFile(id, root, '.json') ||
                    Resolve.asDirectory(id, root) ||
                    Resolve.asNodeModule(id, root);
                if (result) {
                    return result;
                }
            }
        };
        ;
        Require.root = '';
        Require.NODE_PATH = undefined;
        Require.paths = [];
        Require.cache = {};
        Require.extensions = {};
        return Require;
    }());
    require = Require;
    module.exports = Module;
    var Resolve = (function () {
        function Resolve() {
        }
        Resolve.asFile = _resolveAsFile;
        Resolve.asDirectory = _resolveAsDirectory;
        Resolve.readFile = _readFile;
        Resolve.asNodeModule = _resolveAsNodeModule;
        Resolve.asCoreModule = _resolveAsCoreModule;
        return Resolve;
    }());
    var indent = 0;
    if (Require.debug) {
        Resolve.asFile = function (id, root, ext) {
            print(repeat(indent), "resolveAsFile", id, root, ext);
            ++indent;
            var result = _resolveAsFile(id, root, ext);
            --indent;
            print(repeat(indent), "result:", (result) ? result.path : result);
            return result;
        };
        Resolve.asDirectory = function (id, root) {
            print(repeat(indent), "resolveAsDirectory", id, root);
            ++indent;
            var result = _resolveAsDirectory(id, root);
            --indent;
            print(repeat(indent), "result:", (result) ? result.path : result);
            return result;
        };
        Resolve.asNodeModule = function (id, root) {
            print(repeat(indent), "resolveAsNodeModule", id, root);
            ++indent;
            var result = _resolveAsNodeModule(id, root);
            --indent;
            print(repeat(indent), "result:", (result) ? result.path : result);
            return result;
        };
        Resolve.readFile = function (filename, core) {
            print(repeat(indent), "readFile", filename, core);
            return _readFile(filename, core);
        };
        Resolve.asCoreModule = function (id, root) {
            print(repeat(indent), "resolveAsCoreModule", id, root);
            ++indent;
            var result = _resolveAsCoreModule(id, root);
            --indent;
            print(repeat(indent), "result:", (result) ? result.path : result);
            return result;
        };
    }
    function repeat(n, ch) {
        if (ch === void 0) { ch = "-"; }
        if (n <= 0)
            return ">";
        return new Array(n * 4).join(ch);
    }
    function findRoots(parent) {
        var r = [];
        r.push(findRoot(parent));
        return r.concat(Require.paths);
    }
    function findRoot(parent) {
        if (!parent || !parent.id) {
            return Require.root;
        }
        var path = (parent.id instanceof java.nio.file.Path) ?
            parent.id :
            Paths.get(parent.id);
        return path.getParent() || "";
    }
    function mergePath(id, root) {
        if (!id)
            throw new ModuleError("impossible merge an undefined paths");
        var path = Paths.get(id);
        if (root && !path.startsWith(root))
            path = Paths.get(root, id);
        return path.normalize();
    }
    function loadJSON(file, core) {
        if (core === void 0) { core = false; }
        var json = JSON.parse(Resolve.readFile(file, core));
        Require.cache[file] = json;
        return json;
    }
    function normalizeName(fileName, extension) {
        if (extension === void 0) { extension = '.js'; }
        if (String(fileName).endsWith(extension)) {
            return fileName;
        }
        return fileName + extension;
    }
    function isResourceResolved(id) {
        var cl = Thread.currentThread().getContextClassLoader();
        var url = cl.getResource(id);
        return url != null;
    }
    function _resolveAsCoreModule(id, root) {
        var name = normalizeName(id);
        if (isResourceResolved(name))
            return { path: name, core: true };
    }
    function _resolveAsNodeModule(id, root) {
        var base = Paths.get(root, 'node_modules');
        return Resolve.asFile(id, base) ||
            Resolve.asDirectory(id, base) ||
            (root ? Resolve.asNodeModule(id, root.getParent()) : undefined);
    }
    function _resolveAsDirectory(id, root) {
        var base = mergePath(id, root), file = base.resolve('package.json').toString();
        ;
        if (isResourceResolved(file)) {
            try {
                var body = Resolve.readFile(file, true), package = JSON.parse(body);
                if (package.main) {
                    return (Resolve.asFile(package.main, base) ||
                        Resolve.asDirectory(package.main, base));
                }
            }
            catch (ex) {
                throw new ModuleError("Cannot load JSON file", "PARSE_ERROR", ex);
            }
        }
        return Resolve.asFile('index.js', base);
    }
    function _resolveAsFile(id, root, ext) {
        var file = mergePath(id, root).toString();
        file = normalizeName(file, ext || '.js');
        if (file.length > 0 && file[0] === '/') {
            if (isResourceResolved(file)) {
                return Resolve.asDirectory(id);
            }
        }
        if (isResourceResolved(file)) {
            return { path: file, core: true };
        }
    }
    function _readFile(filename, core) {
        var input;
        try {
            if (core) {
                var classloader = Thread.currentThread().getContextClassLoader();
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
}());
