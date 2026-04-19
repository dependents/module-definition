#!/usr/bin/env node

'use strict';

const process = require('process');
const getModuleType = require('../index.js');

const filename = process.argv[2];

if (!filename) {
  console.error('Usage: module-definition <filename>');
  process.exit(1);
}

console.log(getModuleType.sync(filename));
