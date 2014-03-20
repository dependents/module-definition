var Walker = require('node-source-walk'),
    fs = require('fs');

function isExports(node) {
  var c = node.object;
  return c &&
    node.type === 'MemberExpression' &&
    c.type    === 'Identifier' &&
    (c.name   === 'module' || c.name === 'exports');
}

function isDefine(node) {
  var c = node.callee;
  return c &&
    node.type === 'CallExpression' &&
    c.type    === 'Identifier' &&
    c.name    === 'define';
}

// Whether or not the node represents a require function call
function isRequire(node) {
  var c = node.callee;

  return c &&
        node.type  === 'CallExpression' &&
        c.type     === 'Identifier' &&
        c.name     === 'require';
}

function isCommonJS(node) {

  return isExports(node) ||
        // there's a require with no define
        (hasRequire(node) && ! hasDefine(node));
}

// Whether or not the node has a require call
// somewhere in its ast
function hasRequire(node) {
  var sawRequire = false;

  var walker = new Walker();
  walker.traverse(node, function (node) {
    if (isRequire(node)) {
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
    if (isDefine(node)) {
      sawDefine = true;
      walker.stopWalking();
    }
  });

  return sawDefine;
}

function isAMD(node) {
  return isDefine(node);
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