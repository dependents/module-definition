var esprima = require('esprima'),
    q  = require('q'),
    fs = require('fs');

// From node-detective
function traverse(node, cb) {
  if (Array.isArray(node)) {
    node.forEach(function (x) {
      if(x != null) {
        // Mark that the node has been visited
        x.parent = node;
        traverse(x, cb);
      }
    });

  } else if (node && typeof node === 'object') {
    cb(node);

    Object.keys(node).forEach(function (key) {
      // Avoid visited nodes
      if (key === 'parent' || ! node[key]) return;

      node[key].parent = node;
      traverse(node[key], cb);
    });
  }
}

// Executes the passed callback for every traversed node of the ast
function walk(src, cb) {
  var ast = esprima.parse(src);
  traverse(ast, cb);
}

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

module.exports = function (file) {
  var deferred = q.defer();

  if (! file) throw new Error('filename missing');

  // Read file
  fs.readFile(file, function (err, data) {
    if (err) {
      console.log(err);
      return;
    }

    var src = data.toString(),
        type = 'none',
        alreadyDeduced = false;

    // Clean the source code of unnecessary
    // TODO: Wtf is this stripping?
    src = src.replace(/^#![^\n]*\n/, '');

    // Note: this is blocking
    walk(src, function (node) {
      if (alreadyDeduced) return;

      // TODO: Figure out how to modify walk such that we can
      // stop walking once we've deduced the module type
      if (isExports(node)) {
        type = 'commonjs';
        alreadyDeduced = true;
      } else if (isDefine(node)) {
        type = 'amd';
        alreadyDeduced = true;
      }
    });

    deferred.resolve(type);
  });

  return deferred.promise;
};