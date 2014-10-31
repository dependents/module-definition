var getModuleType = require('../');
var path = require('path');
var fs = require('fs');
var assert = require('assert');

var expected = {
    './a.js': 'commonjs',
    './b.js': 'commonjs',
    './c.js': 'amd',
    './d.js': 'none',
    './e.js': 'amd',
    './f.js': 'amd',
    './g.js': 'commonjs',
    './h.js': 'none',
    './i.js': 'amd'
};

function testMethodAgainstExpected(method) {
    Object.keys(expected).forEach(function(file) {
      method(file, expected[file]);
    });
}

function asyncTest(filename, result) {
    it('should return `' + result + '` as type of ' + filename, function(done) {
        getModuleType(path.resolve(__dirname, filename), function (error, type) {
            assert(error === null);
            assert(type === result);
            done();
        });
    });
}

function syncTest(filename, result) {
    it("should return `" + result + "` as type of " + filename, function() {
        var type = getModuleType.sync(path.resolve(__dirname, filename));
        assert(type === result);
    });
}

function sourceTest(filename, result) {
    it('should return `' + result + '` as type of ' + filename, function() {
        var source = fs.readFileSync(path.resolve(__dirname, filename));
        var type = getModuleType.fromSource(source);
        assert(type === result);
    });
}

describe('Async tests', function() {
    testMethodAgainstExpected(asyncTest);

    it('should report an error for non-existing file', function(done) {
        getModuleType("no_such_file", function (error, type) {
            assert(error !== null);
            done();
        });
    });

    it('should report an error for file with syntax error', function(done) {
        getModuleType(path.resolve(__dirname, 'j.js'), function (error, type) {
            assert(error !== null);
            done();
        });
    });
});

describe('Sync tests', function() {
    testMethodAgainstExpected(syncTest);
});

describe('From source tests', function() {
    testMethodAgainstExpected(sourceTest);
});
