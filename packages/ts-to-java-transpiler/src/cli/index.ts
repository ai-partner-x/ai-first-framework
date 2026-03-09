#!/usr/bin/env node
import * as fs from 'fs';
import * as path from 'path';
import * as ts from 'typescript';
import { program } from 'commander';
import { parseSourceFile } from '../parser';
import { transpileToJava } from '../transpiler';
import { TranspilerOptions } from '../types';

// Parse command line arguments
program
  .version('0.1.0')
  .description('TypeScript to Java transpiler')
  .option('-f, --file <path>', 'TypeScript file to transpile')
  .option('-d, --directory <path>', 'Directory containing TypeScript files')
  .option('-o, --output <path>', 'Output directory for Java files')
  .option('-p, --package <name>', 'Java package name', 'com.example')
  .option('--use-lombok', 'Use Lombok annotations', false)
  .option('--java-version <version>', 'Java version', '17')
  .parse(process.argv);

const options = program.opts();

if (!options.file && !options.directory) {
  console.error('Error: Either --file or --directory must be specified');
  process.exit(1);
}

const outputDir = options.output || './java-output';
const transpilerOptions: TranspilerOptions = {
  packageName: options.package,
  useLombok: options.useLombok,
  javaVersion: options.javaVersion
};

// Create output directory if it doesn't exist
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

// Process files
if (options.file) {
  processFile(options.file, outputDir, transpilerOptions);
} else if (options.directory) {
  processDirectory(options.directory, outputDir, transpilerOptions);
}

/**
 * Process a single TypeScript file
 */
function processFile(filePath: string, outputDir: string, options: TranspilerOptions) {
  console.log(`Processing file: ${filePath}`);
  
  try {
    const sourceCode = fs.readFileSync(filePath, 'utf8');
    const sourceFile = ts.createSourceFile(
      path.basename(filePath),
      sourceCode,
      ts.ScriptTarget.ES2020,
      true
    );
    
    const parsed = parseSourceFile(sourceFile);
    const javaCode = transpileToJava(parsed, options);
    
    const outputFileName = path.basename(filePath, '.ts') + '.java';
    const outputPath = path.join(outputDir, outputFileName);
    
    fs.writeFileSync(outputPath, javaCode);
    console.log(`Generated Java file: ${outputPath}`);
  } catch (error) {
    console.error(`Error processing file ${filePath}:`, error);
  }
}

/**
 * Process a directory of TypeScript files
 */
function processDirectory(directoryPath: string, outputDir: string, options: TranspilerOptions) {
  console.log(`Processing directory: ${directoryPath}`);
  
  const files = fs.readdirSync(directoryPath);
  
  for (const file of files) {
    const filePath = path.join(directoryPath, file);
    const stats = fs.statSync(filePath);
    
    if (stats.isFile() && path.extname(file) === '.ts') {
      processFile(filePath, outputDir, options);
    } else if (stats.isDirectory()) {
      const subOutputDir = path.join(outputDir, file);
      if (!fs.existsSync(subOutputDir)) {
        fs.mkdirSync(subOutputDir, { recursive: true });
      }
      processDirectory(filePath, subOutputDir, options);
    }
  }
}
