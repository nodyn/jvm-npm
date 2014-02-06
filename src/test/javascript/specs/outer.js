var inner = require('./inner');

module.exports = {
  quadruple: function(val) { return 2*inner.double(val); }
};
