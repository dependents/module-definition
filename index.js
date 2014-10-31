var Walker  = require('node-source-walk'),
    types   = require('ast-module-types'),
    fs      = require('fs');

function fromSource(source) {
  if (typeof source === 'undefined') throw new Error('source not supplied');

  var type = 'none',
      walker = new Walker(),
      hasDefine = false,
      hasAMDTopLevelRequire = false,
      hasRequire = false,
      hasExports = false,
      hasES6Import = false,
      isAMD, isCommonJS;

  walker.walk(source, function (node) {
    if (types.isDefine(node)) {
      hasDefine = true;
    }

    if (types.isRequire(node)) {
      hasRequire = true;
    }

    if (types.isExports(node)) {
      hasExports = true;
    }

    if (types.isAMDDriverScriptRequire(node)) {
      hasAMDTopLevelRequire = true;
    }

    // @todo: Support es6-style exports
    if (types.isES6Import(node)) {
      hasES6Import = true;
    }
  });

  isAMD = hasDefine || hasAMDTopLevelRequire;
  isCommonJS = hasExports || (hasRequire && ! hasDefine);
  // @todo: Support hasES6Exports
  isES6 = hasES6Import;

  if (isAMD) {
    return 'amd';
  }

  if (isCommonJS) {
    return 'commonjs';
  }

  if (isES6) {
    return 'es6';
  }

  return 'none';
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

  fs.readFile(file, { encoding: "utf8" }, function (err, data) {
    if (err) {
      return cb(err);
    }

    try {
      var type = fromSource(data);
    } catch(err) {
      return cb(err)
    }

    cb(null, type);
  });
};


module.exports.sync = sync;
module.exports.fromSource = fromSource;
