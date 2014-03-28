var Walker  = require('node-source-walk'),
    types   = require('ast-module-types'),
    fs      = require('fs');

function isCommonJS(node) {

  return types.isExports(node) ||
        // there's a require with no define
        (hasRequire(node) && ! hasDefine(node));
}

// Whether or not the node has a require call
// somewhere in its ast
function hasRequire(node) {
  var sawRequire = false;

  var walker = new Walker();
  walker.traverse(node, function (node) {
    if (types.isRequire(node)) {
      sawRequire = true;
      walker.stopWalking();
    }
  });

  return sawRequire;
}

// Whether or not the node has a define call
// somewhere in its ast
function hasDefine(node) {
  var sawDefine = false;

  var walker = new Walker();
  walker.traverse(node, function (node) {
    if (types.isDefine(node)) {
      sawDefine = true;
      walker.stopWalking();
    }
  });

  return sawDefine;
}

function isAMD(node) {
  return types.isDefine(node);
}

module.exports = function (file, cb) {
  if (! file) throw new Error('filename missing');

  var walker = new Walker();

  // Read file
  fs.readFile(file, function (err, data) {
    if (err) {
      console.log(err);
      return;
    }

    var src = data.toString(),
        type = 'none';

    // Note: this is blocking
    walker.walk(src, function (node) {
      if (isCommonJS(node)) {
        type = 'commonjs';
        walker.stopWalking();

      } else if (isAMD(node)) {
        type = 'amd';
        walker.stopWalking();
      }
    });

    cb && cb(type);
  });
};