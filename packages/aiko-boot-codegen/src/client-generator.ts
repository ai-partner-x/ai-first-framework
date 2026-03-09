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

function generateControllerCode(info: ControllerInfo, entityFile: string, dtoFile: string): string {
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
    importStatements += `import type { ${dtoImports.join(', ')} } from './${dtoFile.replace('.ts', '')}';\n`;
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
  });

  return `/**\n * ⚠️ 此文件由 build 自动生成，请勿手动修改\n * 源文件: src/${type}/${path.basename(filePath)}\n */\n${result.join('\n')}\n`;
}

// ==================== 导出 API ====================

export interface CodegenOptions {
  srcDir?: string;
  outDir?: string;
  silent?: boolean;
}

/**
 * 生成 API Client
 * @param options 配置选项
 */
export function generateApiClient(options: CodegenOptions = {}) {
  const srcDir = path.resolve(process.cwd(), options.srcDir || './src');
  const outDir = path.resolve(process.cwd(), options.outDir || './dist/client');
  const silent = options.silent ?? false;

  const log = (msg: string) => !silent && console.log(msg);

  if (!fs.existsSync(srcDir)) {
    throw new Error(`Source directory not found: ${srcDir}`);
  }

  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }

  const exports: string[] = [];
  let entityFile = '';
  let dtoFile = '';

  // 1. 生成 Entity
  const entityDir = path.join(srcDir, 'entity');
  if (fs.existsSync(entityDir)) {
    for (const file of fs.readdirSync(entityDir)) {
      if (file.endsWith('.entity.ts')) {
        const srcPath = path.join(entityDir, file);
        const destPath = path.join(outDir, file);
        const code = generateInterface(srcPath, 'entity');
        fs.writeFileSync(destPath, code);
        log(`✅ Generated: ${file}`);
        exports.push(`export * from './${file.replace('.ts', '')}';`);
        entityFile = file;
      }
    }
  }

  // 2. 生成 DTO
  const dtoDir = path.join(srcDir, 'dto');
  if (fs.existsSync(dtoDir)) {
    for (const file of fs.readdirSync(dtoDir)) {
      if (file.endsWith('.dto.ts')) {
        const srcPath = path.join(dtoDir, file);
        const destPath = path.join(outDir, file);
        const code = generateInterface(srcPath, 'dto');
        fs.writeFileSync(destPath, code);
        log(`✅ Generated: ${file}`);
        exports.push(`export * from './${file.replace('.ts', '')}';`);
        dtoFile = file;
      }
    }
  }

  // 3. 生成 Controller -> Api
  const controllerDir = path.join(srcDir, 'controller');
  if (fs.existsSync(controllerDir)) {
    for (const file of fs.readdirSync(controllerDir)) {
      if (file.endsWith('.controller.ts')) {
        const srcPath = path.join(controllerDir, file);
        const info = parseController(srcPath);
        if (info) {
          const destFile = file.replace('.controller.ts', '.api.ts');
          const destPath = path.join(outDir, destFile);
          const code = generateControllerCode(info, entityFile, dtoFile);
          fs.writeFileSync(destPath, code);
          log(`✅ Generated: ${destFile}`);
          exports.push(`export * from './${destFile.replace('.ts', '')}';`);
        }
      }
    }
  }

  // 4. 生成 index.ts
  const indexContent = `/**\n * API Client 入口\n * ⚠️ 此文件由 build 自动生成\n */\n\n${exports.join('\n')}\n`;
  fs.writeFileSync(path.join(outDir, 'index.ts'), indexContent);
  log(`✅ Generated: index.ts`);

  log('\n🎉 API Client generated!');
}

// ==================== Watch 模式 ====================

export interface WatchOptions extends CodegenOptions {
  /** 防抖时间，单位毫秒，默认 300 */
  debounce?: number;
}

/**
 * Watch 模式：监控源文件变化自动重新生成
 */
export function watchApiClient(options: WatchOptions = {}) {
  const srcDir = path.resolve(process.cwd(), options.srcDir || './src');
  const debounceMs = options.debounce ?? 300;

  // 首次生成
  generateApiClient(options);

  console.log(`\n👀 [codegen] Watching for changes in ${srcDir}...`);
  console.log('   Monitoring: entity/, dto/, controller/\n');

  const watchDirs = ['entity', 'dto', 'controller'];
  let debounceTimer: NodeJS.Timeout | null = null;

  const regenerate = () => {
    if (debounceTimer) clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      console.log('\n🔄 [codegen] Change detected, regenerating...');
      try {
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
      fs.watch(dirPath, { recursive: true }, (eventType, filename) => {
        if (filename && (filename.endsWith('.ts') || filename.endsWith('.tsx'))) {
          console.log(`📝 [codegen] ${eventType}: ${dir}/${filename}`);
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
