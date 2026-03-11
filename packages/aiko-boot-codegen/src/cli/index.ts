#!/usr/bin/env node
/**
 * Aiko Codegen CLI
 * TypeScript to Java code transpiler command line interface
 */
import { Command } from 'commander';
import { transpileCommand } from './transpile.js';

const program = new Command();

program
  .name('aiko-codegen')
  .description('TypeScript to Java code transpiler')
  .version('0.1.0');

// Transpile command
program
  .command('transpile')
  .description('Transpile TypeScript source files to Java')
  .argument('<source>', 'Source directory or file to transpile')
  .option('-o, --out <dir>', 'Output directory for Java files', './gen')
  .option('-p, --package <name>', 'Java package name', 'com.example')
  .option('--lombok', 'Generate Lombok annotations', false)
  .option('--java-version <version>', 'Target Java version (11, 17, 21)', '17')
  .option('--spring-boot <version>', 'Spring Boot version', '3.2.0')
  .option('--dry-run', 'Show what would be generated without writing files', false)
  .option('-v, --verbose', 'Verbose output', false)
  .option('--incremental', 'Enable incremental generation (only regenerate changed files)', false)
  .action(transpileCommand);

// Validate command
program
  .command('validate')
  .description('Validate TypeScript source files for Java compatibility')
  .argument('<source>', 'Source directory or file to validate')
  .option('-v, --verbose', 'Verbose output', false)
  .action(async (source: string, _options: { verbose: boolean }) => {
    console.log(`Validating ${source} for Java compatibility...`);
    console.log('Use eslint with @aiko-boot/eslint-plugin/java-compat config for validation');
    console.log('Example: npx eslint --config .eslintrc.java-compat.json src/');
  });

program.parse();
