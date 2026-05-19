#!/usr/bin/env node

import process from 'node:process';
import getModuleType from '../index.js';

const filename = process.argv[2];

if (!filename) {
  console.error('Usage: module-definition <filename>');
  process.exit(1);
}

console.log(getModuleType.sync(filename));
