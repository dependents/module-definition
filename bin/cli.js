#!/usr/bin/env node

import { program } from 'commander';
import getModuleType from '../index.js';
import pkg from '../package.json' with { type: 'json' };

const { name, description, version } = pkg;

program
  .name(name)
  .description(description)
  .version(version)
  .argument('<filename>', 'JavaScript file to examine')
  .usage('[options] <filename>')
  .showHelpAfterError()
  .parse();

const [filename] = program.args;

console.log(getModuleType.sync(filename));
