var Walker  = require('node-source-walk'),
    types   = require('ast-module-types'),
    fs      = require('fs');

function hasRequire(ast) {
  var sawRequire = false;

  var walker = new Walker();
  walker.traverse(ast, function (node) {
    if (types.isRequire(node)) {
      sawRequire = true;
      walker.stopWalking();
    }
  });

  return sawRequire;
}

function hasDefine(ast) {
  var sawDefine = false;

  var walker = new Walker();
  walker.traverse(ast, function (node) {
    if (types.isDefine(node)) {
      sawDefine = true;
      walker.stopWalking();
    }
  });

  return sawDefine;
}

function hasAMDTopLevelRequire(ast) {
  var result = false,
      walker = new Walker(),
      // Allows us to differentiate from the funky commonjs case
      hasValidArguments = function(requireNode) {
        var args = requireNode.arguments;

        return  args &&
                args[0].type !== 'Literal' &&
                // For some dynamic node requires
                args[0].type !== 'Identifier';
      };

  walker.traverse(ast, function(node) {
    if (types.isTopLevelRequire(node) && hasValidArguments(node)) {
      result = true;
      walker.stopWalking();
    }
  });

  return result;
}

function hasExports(ast) {
  var result = false,
      walker = new Walker();

  walker.traverse(ast, function(node) {
    if (types.isExports(node)) {
      result = true;
      walker.stopWalking();
    }
  });

  return result;
}

function isAMD(ast) {
  return  hasDefine(ast) ||
          hasAMDTopLevelRequire(ast);
}

function isCommonJS(ast) {
  return  hasExports(ast) ||
          // there's a require with no define
          hasRequire(ast) && ! hasDefine(ast);
}

function fromSource(source) {
  if (! source) throw new Error('source not supplied');

  var type = 'none';
  var walker = new Walker();

  walker.walk(source, function (ast) {
    // Check for amd first because it's a simpler traversal
    // Also, there's a funky case when a top-level require could be an amd driver script
    // or a commonjs module that starts with require('something'). It's easier to check
    // for the AMD driver script case
    if (isAMD(ast)) {
      type = 'amd';
      walker.stopWalking();

    } else if (isCommonJS(ast)) {
      type = 'commonjs';
      walker.stopWalking();
    }
  });

  return type;
}

function sync(file) {
  if (! file) throw new Error('filename missing');

  var data = fs.readFileSync(file);
  return fromSource(data.toString());
}

module.exports = function (file, cb) {
  if (! file) throw new Error('filename missing');
  if (! cb)   throw new Error('callback missing');

  var walker = new Walker();

  fs.readFile(file, function (err, data) {
    if (err) {
      console.log(err);
      return;
    }

    var src = data.toString(),
        type = fromSource(data.toString());

    if (cb) cb(type);
  });
};


module.exports.sync = sync;
module.exports.fromSource = fromSource;
