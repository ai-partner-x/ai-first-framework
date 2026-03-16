#!/usr/bin/env node
/**
 * aiko-boot-create CLI
 *
 * 顶层入口：注册子命令（init / add app / add api / add feature / list）。
 */
import { Command } from 'commander';
import { registerInitCommand } from './commands/init.js';
import { registerAddAppCommand } from './commands/add-app.js';
import { registerAddApiCommand } from './commands/add-api.js';
import { registerAddFeatureCommand } from './commands/add-feature.js';
import { registerListCommand } from './commands/list.js';

export function runCli(argv = process.argv): void {
  const program = new Command();

  program
    .name('aiko-boot-create')
    .description('Create and extend aiko-boot scaffold projects (monorepo: api, admin, mobile, core)')
    .version('0.2.0');

  // 注册子命令
  registerInitCommand(program);
  registerAddAppCommand(program);
  registerAddApiCommand(program);
  registerAddFeatureCommand(program);
  registerListCommand(program);

  program.parse(argv);
}

runCli();

