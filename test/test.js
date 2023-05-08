/* eslint-env mocha */

'use strict';

const assert = require('assert').strict;
const { readFile } = require('fs/promises');
const path = require('path');
const memfs = require('memfs');
const unionfs = require('unionfs');
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
  for (const [file, type] of Object.entries(expected)) {
    method(`./${file}.js`, type);
  }
}

function asyncTest(filename, result) {
  it(`should return "${result}" as type of ${filename}`, done => {
    getModuleType(path.resolve(__dirname, 'fixtures', filename), (error, type) => {
      assert.equal(error, null, error);
      assert.equal(type, result);
      done();
    });
  });
}

function syncTest(filename, result) {
  it(`should return "${result}" as type of ${filename}`, () => {
    const type = getModuleType.sync(path.resolve(__dirname, 'fixtures', filename));
    assert.equal(type, result);
  });
}

function sourceTest(filename, result) {
  it(`should return "${result}" as type of ${filename}`, async() => {
    const source = await readFile(path.resolve(__dirname, 'fixtures', filename), 'utf8');
    const type = getModuleType.fromSource(source);
    assert.equal(type, result);
  });
}

describe('module-definition', () => {
  describe('Async tests', () => {
    testMethodAgainstExpected(asyncTest);

    it('should report an error for non-existing file', done => {
      getModuleType('no_such_file', error => {
        assert.notEqual(error, null);
        // ENOENT errors always contain filename
        assert.notEqual(error.toString().includes('no_such_file'), false, error);
        done();
      });
    });

    it('should report an error for file with syntax error', done => {
      getModuleType(path.resolve(__dirname, 'fixtures', 'j.js'), error => {
        assert.notEqual(error, null);
        // Check error not to be ENOENT
        assert.equal(error.toString().includes('j.js'), false, error);
        done();
      });
    });

    it('should throw an error if argument is missing', () => {
      assert.throws(() => {
        getModuleType(path.resolve(__dirname, 'a.js'));
      }, /^Error: callback missing$/);
      assert.throws(() => {
        getModuleType();
      }, /^Error: filename missing$/);
    });

    it('should use an alternative file system if provided', done => {
      const vol = memfs.Volume.fromJSON({ 'bar.js': memfsSample }, '/foo');
      const ufs = unionfs.ufs.use(vol);

      getModuleType('/foo/bar.js', (error, type) => {
        assert.equal(error, null, error);
        assert.equal('commonjs', type);
        done();
      }, { fileSystem: ufs });
    });
  });

  describe('Sync tests', () => {
    testMethodAgainstExpected(syncTest);

    it('should throw an error if argument is missing', () => {
      assert.throws(() => {
        getModuleType.sync();
      }, /^Error: filename missing$/);
    });

    it('should use an alternative file system if provided', () => {
      const vol = memfs.Volume.fromJSON({ 'bar.js': memfsSample }, '/foo');
      const ufs = unionfs.ufs.use(vol);
      const type = getModuleType.sync('/foo/bar.js', { fileSystem: ufs });
      assert.equal('commonjs', type);
    });
  });

  describe('From source tests', async() => {
    testMethodAgainstExpected(await sourceTest);

    it('should throw an error if argument is missing', () => {
      assert.throws(() => {
        getModuleType.fromSource();
      }, /^Error: source not supplied$/);
    });

    it('should accept an AST', () => {
      assert.equal(getModuleType.fromSource(amdAST), 'amd');
    });

    it('should deem a main require as commonjs', () => {
      assert.equal(getModuleType.fromSource('require.main.require();'), 'commonjs');
    });
  });
});
