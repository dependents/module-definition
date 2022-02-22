/* eslint-env mocha */

'use strict';

// TODO switch to assert.strict
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const unionfs = require('unionfs');
const memfs = require('memfs');
const getModuleType = require('../index.js');
const amdAST = require('./fixtures/amdAST.js');

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

function testMethodAgainstExpected(method) {
  // TODO: switch to Object.entries
  Object.keys(expected).forEach((file) => {
    method('./' + file + '.js', expected[file]);
  });
}

function asyncTest(filename, result) {
  it('should return `' + result + '` as type of ' + filename, (done) => {
    getModuleType(path.resolve(__dirname, 'fixtures', filename), (error, type) => {
      assert.strictEqual(error, null, error);
      assert.strictEqual(type, result);
      done();
    });
  });
}

function syncTest(filename, result) {
  it('should return `' + result + '` as type of ' + filename, () => {
    const type = getModuleType.sync(path.resolve(__dirname, 'fixtures', filename));
    assert.strictEqual(type, result);
  });
}

function sourceTest(filename, result) {
  it('should return `' + result + '` as type of ' + filename, () => {
    const source = fs.readFileSync(path.resolve(__dirname, 'fixtures', filename), 'utf8');
    const type = getModuleType.fromSource(source);

    assert.strictEqual(type, result);
  });
}

describe('module-definition', () => {
  describe('Async tests', () => {
    testMethodAgainstExpected(asyncTest);

    it('should report an error for non-existing file', (done) => {
      getModuleType('no_such_file', (error) => {
        assert.notStrictEqual(error, null);
        // ENOENT errors always contain filename
        assert.notStrictEqual(error.toString().includes('no_such_file'), false, error);
        done();
      });
    });

    it('should report an error for file with syntax error', (done) => {
      getModuleType(path.resolve(__dirname, 'fixtures', 'j.js'), (error) => {
        assert.notStrictEqual(error, null);
        // Check error not to be ENOENT
        assert.strictEqual(error.toString().includes('j.js'), false, error);
        done();
      });
    });

    it('should throw an error if argument is missing', () => {
      assert.throws(() => {
        getModuleType(path.resolve(__dirname, 'a.js'));
      }, /callback/);
      assert.throws(() => {
        getModuleType();
      }, /filename/);
    });

    it('should use an alternative file system if provided', (done) => {
      const vol = memfs.Volume.fromJSON({'bar.js': memfsSample}, '/foo');
      const ufs = unionfs.ufs.use(vol);

      getModuleType('/foo/bar.js', (error, type) => {
        assert.strictEqual(error, null, error);
        assert.strictEqual('commonjs', type);
        done();
      }, {fileSystem: ufs});
    });
  });

  describe('Sync tests', () => {
    testMethodAgainstExpected(syncTest);

    it('should throw an error if argument is missing', () => {
      assert.throws(() => {
        getModuleType.sync();
      }, /filename/);
    });

    it('should use an alternative file system if provided', () => {
      const vol = memfs.Volume.fromJSON({'bar.js': memfsSample}, '/foo');
      const ufs = unionfs.ufs.use(vol);
      const type = getModuleType.sync('/foo/bar.js', {fileSystem: ufs});
      assert.strictEqual('commonjs', type);
    });
  });

  describe('From source tests', () => {
    testMethodAgainstExpected(sourceTest);

    it('should throw an error if argument is missing', () => {
      assert.throws(() => {
        getModuleType.fromSource();
      }, /source/);
    });

    it('should accept an AST', () => {
      assert.strictEqual(getModuleType.fromSource(amdAST), 'amd');
    });

    it('should deem a main require as commonjs', () => {
      assert.strictEqual(getModuleType.fromSource('require.main.require();'), 'commonjs');
    });
  });
});
