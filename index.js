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
      if (isExports(node)) {
        type = 'commonjs';
        walker.stopWalking();

      } else if (isDefine(node)) {
        type = 'amd';
        walker.stopWalking();
      }
    });

    cb && cb(type);
  });
};