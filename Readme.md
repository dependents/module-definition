Determines the module definition type (CommonJS, AMD, or none) for a given JavaScript file
by walking through the AST.

`npm install module-definition`

### Usage

```javascript
var getModuleType = require('module-definition');

getModuleType('myscript.js', function (type) {
  console.log(type);
});
```

Passes one of the following strings to the given callback:

* amd
* commonjs
* none
