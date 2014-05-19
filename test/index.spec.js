var getModuleType = require('../');
var path = require("path");

function asyncTest(filename, result) {
    it("should return `" + result + "` as type of " + filename, function(done) {
        getModuleType(path.resolve(__dirname, filename), function (type) {
            expect(type).toBe(result);
            done();
        });
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
