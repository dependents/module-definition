import childProcess from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';
import { Volume } from 'memfs';
import { ufs } from 'unionfs';
import { describe, it, expect } from 'vitest';
import getModuleType from '../index.js';
import amdAST from './fixtures/amdAST.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

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

function testMethodAgainstExpected(method) {
  for (const [file, type] of Object.entries(expected)) {
    method(`./${file}.js`, type);
  }
}

function asyncTest(filename, result) {
  it(`should return "${result}" as type of ${filename}`, async() => {
    const type = await getModuleTypeAsync(path.resolve(__dirname, 'fixtures', filename));
    expect(type).toBe(result);
  });
}

function syncTest(filename, result) {
  it(`should return "${result}" as type of ${filename}`, () => {
    const type = getModuleType.sync(path.resolve(__dirname, 'fixtures', filename));
    expect(type).toBe(result);
  });
}

function sourceTest(filename, result) {
  it(`should return "${result}" as type of ${filename}`, () => {
    const source = fs.readFileSync(path.resolve(__dirname, 'fixtures', filename), 'utf8');
    const type = getModuleType.fromSource(source);
    expect(type).toBe(result);
  });
}

describe('module-definition', () => {
  describe('Async tests', () => {
    testMethodAgainstExpected(asyncTest);

    it('should report an error for non-existing file', async() => {
      const error = await getModuleTypeAsync('no_such_file').catch(error_ => error_);
      expect(error).not.toBe(null);
      expect(error.toString()).toContain('no_such_file');
    });

    it('should report an error for file with syntax error', async() => {
      const error = await getModuleTypeAsync(path.resolve(__dirname, 'fixtures', 'j.js')).catch(error_ => error_);
      expect(error).not.toBe(null);
      expect(error.toString()).not.toContain('j.js');
    });

    it('should throw an error if argument is missing', () => {
      expect(() => {
        getModuleType(path.resolve(__dirname, 'a.js'));
      }).toThrow(new Error('callback missing'));
      expect(() => {
        getModuleType();
      }).toThrow(new Error('filename missing'));
    });

    it('should use an alternative file system if provided', async() => {
      const vol = Volume.fromJSON({ 'bar.js': memfsSample }, '/foo');
      const memUfs = ufs.use(vol);

      await new Promise((resolve, reject) => {
        getModuleType('/foo/bar.js', (error, type) => {
          try {
            expect(error).toBe(null);
            expect(type).toBe('commonjs');
            resolve();
          } catch(error_) {
            reject(error_);
          }
        }, { fileSystem: memUfs });
      });
    });
  });

  describe('Sync tests', () => {
    testMethodAgainstExpected(syncTest);

    it('should throw an error if argument is missing', () => {
      expect(() => {
        getModuleType.sync();
      }).toThrow(new Error('filename missing'));
    });

    it('should use an alternative file system if provided', () => {
      const vol = Volume.fromJSON({ 'bar.js': memfsSample }, '/foo');
      const memUfs = ufs.use(vol);
      const type = getModuleType.sync('/foo/bar.js', { fileSystem: memUfs });
      expect(type).toBe('commonjs');
    });
  });

  describe('From source tests', () => {
    testMethodAgainstExpected(sourceTest);

    it('should throw an error if argument is missing', () => {
      expect(() => {
        getModuleType.fromSource();
      }).toThrow(new Error('source not supplied'));
    });

    it('should accept an AST', () => {
      expect(getModuleType.fromSource(amdAST)).toBe('amd');
    });

    it('should deem a main require as commonjs', () => {
      expect(getModuleType.fromSource('require.main.require();')).toBe('commonjs');
    });
  });

  describe('CLI tests', () => {
    it('should print usage and exit when filename is missing', () => {
      const cliPath = path.resolve(__dirname, '..', 'bin', 'cli.js');
      const result = childProcess.spawnSync(process.execPath, [cliPath], {
        encoding: 'utf8'
      });

      expect(result.status).toBe(1);
      expect(result.stderr).toContain('error: missing required argument \'filename\'');
    });

    it('should print the module type for a given file', () => {
      const cliPath = path.resolve(__dirname, '..', 'bin', 'cli.js');
      const fixturePath = path.resolve(__dirname, 'fixtures', 'cjsExport.js');
      const result = childProcess.spawnSync(process.execPath, [cliPath, fixturePath], {
        encoding: 'utf8'
      });

      expect(result.status).toBe(0);
      expect(result.stdout.trim()).toBe('commonjs');
    });
  });
});
