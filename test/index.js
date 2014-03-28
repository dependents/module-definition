var getModuleType = require('../');

function run(file) {
  getModuleType(file, function (type) {
    console.log(file, type);

    switch(file) {
      case './a.js':
        console.log(type === 'commonjs');
        break;
      case './b.js':
        console.log(type === 'commonjs');
        break;
      case './c.js':
        console.log(type === 'amd');
        break;
      case './d.js':
        console.log(type === 'none');
        break;
      case './e.js':
        console.log(type === 'amd');
        break;
    }

  });
}

['./a.js', './b.js', './c.js', './d.js', './e.js'].forEach(run);