#!/usr/bin/env node
/**
 * @ai-partner-x/codegen
 * 
 * 从 Controller/Entity/DTO 源码生成前端可用的 API Client
 * 
 * 两种使用方式：
 * 1. CLI: npx aiko-boot-codegen --src ./src --out ./dist/client
 * 2. API: import { generateApiClient } from '@ai-partner-x/codegen'
 */
import * as ts from 'typescript';
import * as fs from 'fs';
import * as path from 'path';

// ==================== Controller 生成（带 fetch 实现） ====================

interface MethodMeta {
  name: string;
  httpMethod: string;
  path: string;
  params: { name: string; type: string; decorator: string; decoratorArg?: string }[];
  returnType: string;
  innerType: string;
}

interface ControllerInfo {
  className: string;
  basePath: string;
  methods: MethodMeta[];
  imports: Set<string>;
}

function parseController(filePath: string): ControllerInfo | null {
  const sourceCode = fs.readFileSync(filePath, 'utf-8');
  const sourceFile = ts.createSourceFile(filePath, sourceCode, ts.ScriptTarget.Latest, true);
  const printer = ts.createPrinter({ newLine: ts.NewLineKind.LineFeed });

  let basePath = '/';
  let className = '';
  const methods: MethodMeta[] = [];
  const imports = new Set<string>();

  ts.forEachChild(sourceFile, (node) => {
    if (ts.isClassDeclaration(node) && node.name) {
      className = node.name.text.replace('Controller', 'Api');

      const decorators = ts.getDecorators(node) || [];
      for (const d of decorators) {
        if (ts.isCallExpression(d.expression)) {
          const decoratorName = (d.expression.expression as ts.Identifier).text;
          if (decoratorName === 'RestController' && d.expression.arguments.length > 0) {
            const arg = d.expression.arguments[0];
            if (ts.isObjectLiteralExpression(arg)) {
              for (const prop of arg.properties) {
                if (ts.isPropertyAssignment(prop) && (prop.name as ts.Identifier).text === 'path') {
                  basePath = (prop.initializer as ts.StringLiteral).text;
                }
              }
            }
          }
        }
      }

      node.members.forEach((member) => {
        if (ts.isMethodDeclaration(member) && member.name) {
          const methodName = (member.name as ts.Identifier).text;
          const methodDecorators = ts.getDecorators(member) || [];

          let httpMethod = 'GET';
          let methodPath = '';

          for (const d of methodDecorators) {
            if (ts.isCallExpression(d.expression)) {
              const dName = (d.expression.expression as ts.Identifier).text;
              if (dName === 'GetMapping') httpMethod = 'GET';
              else if (dName === 'PostMapping') httpMethod = 'POST';
              else if (dName === 'PutMapping') httpMethod = 'PUT';
              else if (dName === 'DeleteMapping') httpMethod = 'DELETE';

              if (d.expression.arguments.length > 0) {
                const pathArg = d.expression.arguments[0];
                if (ts.isStringLiteral(pathArg)) {
                  methodPath = pathArg.text;
                }
              }
            }
          }

          const params: MethodMeta['params'] = [];
          member.parameters.forEach((param) => {
            const paramName = (param.name as ts.Identifier).text;
            const paramType = param.type
              ? printer.printNode(ts.EmitHint.Unspecified, param.type, sourceFile)
              : 'any';
            const paramDecorators = ts.getDecorators(param) || [];

            // 收集类型引用
            if (param.type) {
              const typeText = paramType.replace(/\[\]$/, '');
              if (/^[A-Z]/.test(typeText) && !['Promise', 'Record', 'Array'].includes(typeText)) {
                imports.add(typeText);
              }
            }

            let decorator = '';
            let decoratorArg = '';
            for (const pd of paramDecorators) {
              if (ts.isCallExpression(pd.expression)) {
                decorator = (pd.expression.expression as ts.Identifier).text;
                if (pd.expression.arguments.length > 0) {
                  const arg = pd.expression.arguments[0];
                  if (ts.isStringLiteral(arg)) {
                    decoratorArg = arg.text;
                  }
                }
              }
            }

            params.push({ name: paramName, type: paramType, decorator, decoratorArg });
          });

          const returnType = member.type
            ? printer.printNode(ts.EmitHint.Unspecified, member.type, sourceFile)
            : 'Promise<any>';

          let innerType = 'any';
          if (member.type && ts.isTypeReferenceNode(member.type)) {
            const typeArgs = member.type.typeArguments;
            if (typeArgs && typeArgs.length > 0) {
              innerType = printer.printNode(ts.EmitHint.Unspecified, typeArgs[0], sourceFile);
              // 收集返回类型引用
              const cleanType = innerType.replace(/\[\]$/, '').replace(/ \| null$/, '');
              if (/^[A-Z]/.test(cleanType) && !['Promise', 'Record', 'Array'].includes(cleanType)) {
                imports.add(cleanType);
              }
            }
          }

          methods.push({ name: methodName, httpMethod, path: methodPath, params, returnType, innerType });
        }
      });
    }
  });

  if (!className) return null;
  return { className, basePath, methods, imports };
}

function generateControllerCode(info: ControllerInfo, entityFile: string): string {
  const methodsCode = info.methods.map((m) => {
    const paramsStr = m.params.map((p) => `${p.name}: ${p.type}`).join(', ');
    
    let urlCode = `\`\${this.baseUrl}/api${info.basePath}${m.path}\``;
    
    for (const p of m.params) {
      if (p.decorator === 'PathVariable' && p.decoratorArg) {
        urlCode = urlCode.replace(`:${p.decoratorArg}`, `\${${p.name}}`);
      }
    }

    const bodyParam = m.params.find((p) => p.decorator === 'RequestBody');
    const bodyCode = bodyParam ? `body: JSON.stringify(${bodyParam.name}),` : '';

    return `  async ${m.name}(${paramsStr}): ${m.returnType} {
    const res = await fetch(${urlCode}, {
      method: '${m.httpMethod}',
      headers: { 'Content-Type': 'application/json' },
      ${bodyCode}
    });
    const json = await res.json() as { success: boolean; data?: ${m.innerType}; error?: string };
    if (!json.success) throw new Error(json.error || 'Request failed');
    return json.data as ${m.innerType};
  }`;
  }).join('\n\n');

  // 生成 import 语句
  const entityImports: string[] = [];
  const dtoImports: string[] = [];
  
  info.imports.forEach((type) => {
    if (type.endsWith('Dto')) {
      dtoImports.push(type);
    } else {
      entityImports.push(type);
    }
  });

  let importStatements = '/**\n * ⚠️ 此文件由 build 自动生成，请勿手动修改\n */\n';
  if (entityImports.length > 0) {
    importStatements += `import type { ${entityImports.join(', ')} } from './${entityFile.replace('.ts', '')}';\n`;
  }
  if (dtoImports.length > 0) {
    importStatements += `import type { ${dtoImports.join(', ')} } from './index';\n`;
  }

  return `${importStatements}
export class ${info.className} {
  constructor(private baseUrl: string) {}

${methodsCode}
}
`;
}

// ==================== Entity/DTO 生成 ====================

function generateInterface(filePath: string, type: 'entity' | 'dto'): string {
  const sourceCode = fs.readFileSync(filePath, 'utf-8');
  const sourceFile = ts.createSourceFile(filePath, sourceCode, ts.ScriptTarget.Latest, true);
  const printer = ts.createPrinter({ newLine: ts.NewLineKind.LineFeed });

  const result: string[] = [];

  ts.forEachChild(sourceFile, (node) => {
    // 处理 class 声明
    if (ts.isClassDeclaration(node) && node.name) {
      const className = node.name.text;

      const properties: string[] = [];
      node.members.forEach((member) => {
        if (ts.isPropertyDeclaration(member) && member.name) {
          const propName = (member.name as ts.Identifier).text;
          const propType = member.type
            ? printer.printNode(ts.EmitHint.Unspecified, member.type, sourceFile)
            : 'any';
          const optional = member.questionToken ? '?' : '';
          properties.push(`  ${propName}${optional}: ${propType};`);
        }
      });

      result.push(`export interface ${className} {\n${properties.join('\n')}\n}`);
    }
    // 处理 interface 声明
    else if (ts.isInterfaceDeclaration(node) && node.name) {
      const interfaceName = node.name.text;

      const properties: string[] = [];
      node.members.forEach((member) => {
        if (ts.isPropertySignature(member) && member.name) {
          const propName = (member.name as ts.Identifier).text;
          const propType = member.type
            ? printer.printNode(ts.EmitHint.Unspecified, member.type, sourceFile)
            : 'any';
          const optional = member.questionToken ? '?' : '';
          properties.push(`  ${propName}${optional}: ${propType};`);
        }
      });

      result.push(`export interface ${interfaceName} {\n${properties.join('\n')}\n}`);
    }
  });

  return `/**\n * ⚠️ 此文件由 build 自动生成，请勿手动修改\n * 源文件: src/${type}/${path.basename(filePath)}\n */\n${result.join('\n')}\n`;
}

// ==================== 导出 API ====================

export interface CodegenOptions {
  srcDir?: string;
  outDir?: string;
  silent?: boolean;
  /** 强制重新生成所有文件 */
  force?: boolean;
}

/**
 * 智能写入文件
 * - 内容不变时跳过写入（避免触发 HMR）
 * - 返回是否实际写入
 */
function smartWriteFile(destPath: string, content: string): 'written' | 'unchanged' | 'skipped' {
  // 检查磁盘文件：内容相同 → 跳过写入
  if (fs.existsSync(destPath)) {
    const existingContent = fs.readFileSync(destPath, 'utf-8');
    if (existingContent === content) {
      return 'unchanged';
    }
  }
  
  // 写入文件
  fs.writeFileSync(destPath, content);
  return 'written';
}

/**
 * 获取文件修改时间
 */
function getFileMtime(filePath: string): number {
  try {
    return fs.statSync(filePath).mtimeMs;
  } catch {
    return 0;
  }
}

/**
 * 检查源文件是否比目标文件新
 */
function isSourceNewer(srcPath: string, destPath: string): boolean {
  const srcMtime = getFileMtime(srcPath);
  const destMtime = getFileMtime(destPath);
  return srcMtime > destMtime || destMtime === 0;
}

/**
 * 生成 API Client（优化版）
 * 
 * 优化点：
 * 1. 增量更新 - 源文件未变化时跳过生成
 * 2. 内容比对 - 生成内容不变时跳过写入
 * 3. 并行生成 - 并行处理多个文件
 */
export function generateApiClient(options: CodegenOptions = {}) {
  const srcDir = path.resolve(process.cwd(), options.srcDir || './src');
  const outDir = path.resolve(process.cwd(), options.outDir || './dist/client');
  const silent = options.silent ?? false;
  const force = options.force ?? false;

  const log = (msg: string) => !silent && console.log(msg);

  if (!fs.existsSync(srcDir)) {
    throw new Error(`Source directory not found: ${srcDir}`);
  }

  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }

  const exports: string[] = [];
  let entityFile = '';
  const dtoFiles: string[] = [];
  
  // 统计
  let generated = 0;
  let skipped = 0;
  let unchanged = 0;

  // 收集所有待处理的文件
  interface FileTask {
    type: 'entity' | 'dto' | 'controller';
    srcPath: string;
    destPath: string;
    file: string;
  }
  const tasks: FileTask[] = [];

  // 1. 收集 Entity 文件
  const entityDir = path.join(srcDir, 'entity');
  if (fs.existsSync(entityDir)) {
    for (const file of fs.readdirSync(entityDir)) {
      if (file.endsWith('.entity.ts')) {
        tasks.push({
          type: 'entity',
          srcPath: path.join(entityDir, file),
          destPath: path.join(outDir, file),
          file,
        });
        exports.push(`export * from './${file.replace('.ts', '')}';`);
        entityFile = file;
      }
    }
  }

  // 2. 收集 DTO 文件
  const dtoDir = path.join(srcDir, 'dto');
  if (fs.existsSync(dtoDir)) {
    for (const file of fs.readdirSync(dtoDir)) {
      if (file.endsWith('.dto.ts')) {
        tasks.push({
          type: 'dto',
          srcPath: path.join(dtoDir, file),
          destPath: path.join(outDir, file),
          file,
        });
        exports.push(`export * from './${file.replace('.ts', '')}';`);
        dtoFiles.push(file);
      }
    }
  }

  // 3. 收集 Controller 文件
  const controllerDir = path.join(srcDir, 'controller');
  if (fs.existsSync(controllerDir)) {
    for (const file of fs.readdirSync(controllerDir)) {
      if (file.endsWith('.controller.ts')) {
        const destFile = file.replace('.controller.ts', '.api.ts');
        tasks.push({
          type: 'controller',
          srcPath: path.join(controllerDir, file),
          destPath: path.join(outDir, destFile),
          file: destFile,
        });
        exports.push(`export * from './${destFile.replace('.ts', '')}';`);
      }
    }
  }

  // 4. 处理所有文件
  for (const task of tasks) {
    // 增量更新检查：源文件未变化 + 非强制模式 → 跳过生成
    if (!force && !isSourceNewer(task.srcPath, task.destPath)) {
      skipped++;
      continue;
    }

    let code: string;
    if (task.type === 'entity') {
      code = generateInterface(task.srcPath, 'entity');
    } else if (task.type === 'dto') {
      code = generateInterface(task.srcPath, 'dto');
    } else {
      const info = parseController(task.srcPath);
      if (!info) continue;
      code = generateControllerCode(info, entityFile);
    }

    // 智能写入（内容比对）
    const result = smartWriteFile(task.destPath, code);
    if (result === 'written') {
      log(`✅ Generated: ${task.file}`);
      generated++;
    } else {
      unchanged++;
    }
  }

  // 5. 生成 index.ts（始终检查内容）
  const indexContent = `/**\n * API Client 入口\n * ⚠️ 此文件由 build 自动生成\n */\n\n${exports.join('\n')}\n`;
  const indexPath = path.join(outDir, 'index.ts');
  const indexResult = smartWriteFile(indexPath, indexContent);
  if (indexResult === 'written') {
    log(`✅ Generated: index.ts`);
    generated++;
  }

  // 输出统计
  if (!silent) {
    const total = tasks.length + 1;  // +1 for index.ts
    if (generated > 0) {
      const parts = [`🎉 Generated ${generated} file(s)`];
      if (skipped > 0) parts.push(`${skipped} skipped (source unchanged)`);
      if (unchanged > 0) parts.push(`${unchanged} skipped (content same)`);
      console.log(`\n${parts.join(', ')}`);
    } else if (unchanged > 0) {
      // 源文件有变化但内容相同
      console.log(`\n✨ ${unchanged} file(s) regenerated, content unchanged`);
    } else {
      console.log(`\n✨ All ${total} file(s) up to date`);
    }
  }
}

// ==================== Watch 模式 ====================

export interface WatchOptions extends CodegenOptions {
  /** 防抖时间，单位毫秒，默认 200 */
  debounce?: number;
}

/**
 * Watch 模式：监控源文件变化自动重新生成（增量更新）
 */
export function watchApiClient(options: WatchOptions = {}) {
  const srcDir = path.resolve(process.cwd(), options.srcDir || './src');
  const debounceMs = options.debounce ?? 200;

  // 首次生成（强制全量）
  console.log('🚀 [codegen] Initial generation...\n');
  generateApiClient({ ...options, force: true });

  console.log(`\n👀 [codegen] Watching for changes...`);
  console.log('   Monitoring: entity/, dto/, controller/\n');

  const watchDirs = ['entity', 'dto', 'controller'];
  let debounceTimer: NodeJS.Timeout | null = null;
  let pendingChanges = new Set<string>();

  const regenerate = () => {
    if (debounceTimer) clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      const changes = Array.from(pendingChanges);
      pendingChanges.clear();
      
      console.log(`\n🔄 [codegen] Detected ${changes.length} change(s): ${changes.join(', ')}`);
      try {
        // 增量更新（不强制）
        generateApiClient({ ...options, silent: false });
      } catch (e) {
        console.error(`❌ [codegen] Error: ${(e as Error).message}`);
      }
    }, debounceMs);
  };

  // 使用 Node.js 原生 watch API
  for (const dir of watchDirs) {
    const dirPath = path.join(srcDir, dir);
    if (!fs.existsSync(dirPath)) continue;

    try {
      fs.watch(dirPath, { recursive: true }, (_eventType, filename) => {
        if (filename && (filename.endsWith('.ts') || filename.endsWith('.tsx'))) {
          pendingChanges.add(`${dir}/${filename}`);
          regenerate();
        }
      });
      console.log(`   ✅ Watching: ${dir}/`);
    } catch (e) {
      console.warn(`   ⚠️  Cannot watch ${dir}/: ${(e as Error).message}`);
    }
  }
}

// ==================== CLI 入口 ====================

// 只有当直接运行 codegen.js 时才执行 CLI 逻辑
const isCLI = process.argv[1]?.endsWith('codegen.js');
if (isCLI) {
  const args = process.argv.slice(2);
  let srcDir = './src';
  let outDir = './dist/client';
  let watch = false;

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--src' && args[i + 1]) srcDir = args[++i];
    else if (args[i] === '--out' && args[i + 1]) outDir = args[++i];
    else if (args[i] === '--watch' || args[i] === '-w') watch = true;
    else if (args[i] === '--help' || args[i] === '-h') {
      console.log(`\nUsage: aiko-boot-codegen [options]\n\nOptions:\n  --src <dir>   Source directory (default: ./src)\n  --out <dir>   Output directory (default: ./dist/client)\n  --watch, -w   Watch mode, auto-regenerate on file changes\n`);
      process.exit(0);
    }
  }

  console.log(`📁 Source: ${srcDir}`);
  console.log(`📁 Output: ${outDir}`);
  
  if (watch) {
    watchApiClient({ srcDir, outDir });
  } else {
    generateApiClient({ srcDir, outDir });
  }
}
