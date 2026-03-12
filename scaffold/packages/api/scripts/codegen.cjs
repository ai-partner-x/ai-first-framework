#!/usr/bin/env node
const { generateApiClient, watchApiClient } = require('@ai-partner-x/aiko-boot-codegen');

const isWatch = process.argv.includes('--watch') || process.argv.includes('-w');

if (isWatch) {
  watchApiClient();
} else {
  generateApiClient();
}