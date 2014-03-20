var getModuleType = require('../');

['./a.js', './b.js', './c.js', './d.js', './e.js'].forEach(run);

function run(file) {
  getModuleType(file, function (type) {
    console.log(file, type);
  });
}