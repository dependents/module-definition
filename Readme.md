Determines the module definition type (CommonJS, AMD, or none) for a given JavaScript file
by walking through the AST.

`npm install module-definition`

### Usage

```javascript
var getModuleType = require('module-definition');

// Async
getModuleType('myscript.js', function (type) {
  console.log(type);
});

// Sync
var type = getModuleType.sync('myscript.js');
console.log(type);

// From source
var type = getModuleType.fromSource('define({foo: "foo"});');
console.log(type);
```

Passes one of the following strings to the given callback or retuns in sync api:

* amd
* commonjs
* none
