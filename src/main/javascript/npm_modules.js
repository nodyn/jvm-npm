NativeRequire = {};
NativeRequire.require = require;

function __require(module) {}

// Make dynjs happy. 
__require.removeLoadPath = NativeRequire.require.removeLoadPath;

__require.resolve = function() {};

__require.cache = {};

__require.extensions = {};

require = __require;
