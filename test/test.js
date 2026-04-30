'use strict';

const assert = require('assert').strict;
const childProcess = require('child_process');
const fs = require('fs');
const path = require('path');
const process = require('process');
const { promisify } = require('util');
const memfs = require('memfs');
const unionfs = require('unionfs');
const { suite } = require('uvu');
const getModuleType = require('../index.js');
const amdAST = require('./fixtures/amdAST.js');

const getModuleTypeAsync = promisify(getModuleType);

const expected = {
  cjsExport: 'commonjs',
  cjsRequire: 'commonjs',
  amdNoDep: 'amd',
  iife: 'none',
  amdFactory: 'amd',
  amdDeps: 'amd',
  cjsTopRequire: 'commonjs',
  empty: 'none',
  amdREM: 'amd',
  es6Import: 'es6',
  es6Export: 'es6',
  es6WithRequire: 'es6',
  es6WithDynamicImport: 'es6',
  notAmd: 'none'
};

const memfsSample = `
  // commonjs
  module.exports = function () {
    console.log("booyah");
  };
`;

const asyncTests = suite('Async tests');
const syncTests = suite('Sync tests');
const fromSourceTests = suite('From source tests');
const cliTests = suite('CLI tests');

for (const [file, type] of Object.entries(expected)) {
  const filename = `./${file}.js`;

  asyncTests(`should return "${type}" as type of ${filename}`, async() => {
    const actual = await getModuleTypeAsync(path.resolve(__dirname, 'fixtures', filename));
    assert.equal(actual, type);
  });

  syncTests(`should return "${type}" as type of ${filename}`, () => {
    const actual = getModuleType.sync(path.resolve(__dirname, 'fixtures', filename));
    assert.equal(actual, type);
  });

  fromSourceTests(`should return "${type}" as type of ${filename}`, () => {
    const source = fs.readFileSync(path.resolve(__dirname, 'fixtures', filename), 'utf8');
    const actual = getModuleType.fromSource(source);
    assert.equal(actual, type);
  });
}

asyncTests('should report an error for non-existing file', async() => {
  await assert.rejects(getModuleTypeAsync('no_such_file'), error => {
    assert.equal(error.toString().includes('no_such_file'), true);
    return true;
  });
});

asyncTests('should report an error for file with syntax error', async() => {
  await assert.rejects(getModuleTypeAsync(path.resolve(__dirname, 'fixtures', 'j.js')), error => {
    assert.equal(error.toString().includes('j.js'), false);
    return true;
  });
});

asyncTests('should throw an error if argument is missing', () => {
  assert.throws(() => {
    getModuleType(path.resolve(__dirname, 'a.js'));
  }, /^Error: callback missing$/);
  assert.throws(() => {
    getModuleType();
  }, /^Error: filename missing$/);
});

asyncTests('should use an alternative file system if provided', async() => {
  const vol = memfs.Volume.fromJSON({ 'bar.js': memfsSample }, '/foo');
  const ufs = unionfs.ufs.use(vol);

  await new Promise((resolve, reject) => {
    getModuleType('/foo/bar.js', (error, type) => {
      try {
        assert.equal(error, null, error);
        assert.equal(type, 'commonjs');
        resolve();
      } catch (error_) {
        reject(error_);
      }
    }, { fileSystem: ufs });
  });
});

syncTests('should throw an error if argument is missing', () => {
  assert.throws(() => {
    getModuleType.sync();
  }, /^Error: filename missing$/);
});

syncTests('should use an alternative file system if provided', () => {
  const vol = memfs.Volume.fromJSON({ 'bar.js': memfsSample }, '/foo');
  const ufs = unionfs.ufs.use(vol);
  const type = getModuleType.sync('/foo/bar.js', { fileSystem: ufs });
  assert.equal(type, 'commonjs');
});

fromSourceTests('should throw an error if argument is missing', () => {
  assert.throws(() => {
    getModuleType.fromSource();
  }, /^Error: source not supplied$/);
});

fromSourceTests('should accept an AST', () => {
  assert.equal(getModuleType.fromSource(amdAST), 'amd');
});

fromSourceTests('should deem a main require as commonjs', () => {
  assert.equal(getModuleType.fromSource('require.main.require();'), 'commonjs');
});

cliTests('should print usage and exit when filename is missing', () => {
  const cliPath = path.resolve(__dirname, '..', 'bin', 'cli.js');
  const result = childProcess.spawnSync(process.execPath, [cliPath], {
    encoding: 'utf8'
  });

  assert.equal(result.status, 1);
  assert.equal(result.stderr.includes('Usage: module-definition <filename>'), true);
});

asyncTests.run();
syncTests.run();
fromSourceTests.run();
cliTests.run();
