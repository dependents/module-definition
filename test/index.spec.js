var getModuleType = require('../');
var path = require("path");
var fs = require("fs");

function asyncTest(filename, result) {
    it("should return `" + result + "` as type of " + filename, function(done) {
        getModuleType(path.resolve(__dirname, filename), function (type) {
            expect(type).toBe(result);
            done();
        });
    });
}

function syncTest(filename, result) {
    it("should return `" + result + "` as type of " + filename, function() {
        var type = getModuleType.sync(path.resolve(__dirname, filename));
        expect(type).toBe(result);
    });
}

function sourceTest(filename, result) {
    it("should return `" + result + "` as type of " + filename, function() {
        var source = fs.readFileSync(path.resolve(__dirname, filename));
        var type = getModuleType.fromSource(source);
        expect(type).toBe(result);
    });
}

describe("Async tests", function() {
    beforeEach(function(done) {
        this.originalTimeout = jasmine.DEFAULT_TIMEOUT_INTERVAL;
        jasmine.DEFAULT_TIMEOUT_INTERVAL = 100;
        done();
    });

    asyncTest("./a.js", "commonjs");
    asyncTest("./b.js", "commonjs");
    asyncTest("./c.js", "amd");
    asyncTest("./d.js", "none");
    asyncTest("./e.js", "amd");

    afterEach(function() {
        jasmine.DEFAULT_TIMEOUT_INTERVAL = this.originalTimeout;
    });
});

describe("Sync tests", function() {
    syncTest("./a.js", "commonjs");
    syncTest("./b.js", "commonjs");
    syncTest("./c.js", "amd");
    syncTest("./d.js", "none");
    syncTest("./e.js", "amd");
});

describe("From source tests", function() {
    sourceTest("./a.js", "commonjs");
    sourceTest("./b.js", "commonjs");
    sourceTest("./c.js", "amd");
    sourceTest("./d.js", "none");
    sourceTest("./e.js", "amd");
});