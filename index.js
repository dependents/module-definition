var esprima = require('esprima'),
    q  = require('q'),
    fs = require('fs');

module.exports = function (file) {
  var deferred = q.defer();

  if (! file) throw new Error('filename missing');

  // Read file
  fs.readFile(file, function (err, data) {
    var src = data.toString(),
        type = 'none';

    if (isCommonJS(src)) {
      type = 'commonjs';
    } else if (isAMD(src)) {
      type = 'amd';
    }

    deferred.resolve(type);
  });

  return deferred.promise;
};

function isCommonJS(src) {
  // Use esprima to check for module.exports or exports assignment statements

  // Also check for require function calls?

  return false;
}

function isAMD(src) {
  // Use esprima to check for define function calls

  // Also check for require function calls within the define function body?
  return false;
}