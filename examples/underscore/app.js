load('../../src/main/javascript/jvm-npm.js');
var _ = require('underscore');

print('Here we do some stuff with underscore');

example("_.each", function() {
  _.each([1, 2, 3], print);
});

example("_.map", function() {
  print(_.map([1, 2, 3], function(num){ return num * 3; }));
});

example("_.reduce", function() {
  print(_.reduce([1, 2, 3], function(memo, num){ 
    return memo + num; 
  }, 0));
});

example("_.reduceRight", function() {
  var list = [[0, 1], [2, 3], [4, 5]];
  var flat = _.reduceRight(list, function(a, b) { 
    return a.concat(b); 
  }, []);
  print(flat);
});

example("_.find", function() {
  var even = _.find([1, 2, 3, 4, 5, 6], function(num){ 
    return num % 2 === 0; 
  });
  print(even);
});

example("_.filter", function() {
  var even = _.filter([1, 2, 3, 4, 5, 6], function(num){ 
    return num % 2 === 0; 
  });
  print(even);
});

function example(name, ex) {
  print(["", name].join("\n"));
  print(ex);
  ex();
}
