# 插件开发指南

本文档详细介绍如何为 @ai-partner-x/aiko-boot-codegen 开发自定义插件。

## 目录

- [插件概述](#插件概述)
- [插件接口](#插件接口)
- [插件生命周期](#插件生命周期)
- [插件优先级](#插件优先级)
- [插件示例](#插件示例)
- [最佳实践](#最佳实践)
- [调试插件](#调试插件)
- [常见问题](#常见问题)

## 插件概述

插件是扩展代码生成器功能的主要方式。通过插件，你可以：

- 自定义装饰器转换逻辑
- 自定义类型映射
- 修改方法和类
- 后处理生成的 Java 代码
- 生成额外的辅助代码

### 为什么需要插件？

1. **自定义装饰器**：添加对自定义装饰器的支持
2. **特殊类型处理**：处理特殊的类型转换需求
3. **代码风格调整**：根据团队规范调整生成的代码
4. **框架集成**：集成第三方框架的注解和模式
5. **代码增强**：添加额外的验证、日志等功能

## 插件接口

### TranspilePlugin 接口

```typescript
interface TranspilePlugin {
  /** 插件名称（必填） */
  name: string;
  
  /** 插件优先级（可选，默认为 0） */
  priority?: number;
  
  /** 转换装饰器 */
  transformDecorator?: (decorator: ParsedDecorator, context: TransformContext) => ParsedDecorator;
  
  /** 转换类型 */
  transformType?: (tsType: string, context: TransformContext) => string;
  
  /** 转换方法 */
  transformMethod?: (method: ParsedMethod, context: TransformContext) => ParsedMethod;
  
  /** 转换类 */
  transformClass?: (cls: ParsedClass, context: TransformContext) => ParsedClass;
  
  /** 后处理 */
  postProcess?: (javaCode: string, context: TransformContext) => string;
  
  /** 生成额外代码 */
  generateAdditional?: (cls: ParsedClass, context: TransformContext) => string | null;
}
```

### TransformContext 接口

```typescript
interface TransformContext {
  /** 源文件路径 */
  sourceFile: string;
  
  /** 当前类名 */
  className: string;
  
  /** 类类型 */
  classType: 'entity' | 'repository' | 'service' | 'controller' | 'dto' | 'redis' | 'mq' | 'security' | 'admin' | 'unknown';
  
  /** 转换器选项 */
  options: TranspilerOptions;
  
  /** 当前文件中的所有解析类 */
  allClasses: ParsedClass[];
}
```

## 插件生命周期

插件在代码生成过程中按以下顺序执行：

```
1. 解析 TypeScript 源代码
   ↓
2. 应用 transformClass（转换整个类）
   ↓
3. 应用 transformDecorator（转换装饰器）
   ↓
4. 应用 transformType（转换类型）
   ↓
5. 应用 transformMethod（转换方法）
   ↓
6. 生成 Java 代码
   ↓
7. 应用 postProcess（后处理生成的代码）
   ↓
8. 应用 generateAdditional（生成额外代码）
```

### 详细流程

1. **解析阶段**：解析 TypeScript 源代码，提取类、方法、字段等信息
2. **类转换**：对整个类进行转换（可选）
3. **装饰器转换**：转换每个装饰器（可选）
4. **类型转换**：转换每个类型引用（可选）
5. **方法转换**：转换每个方法（可选）
6. **代码生成**：根据转换后的信息生成 Java 代码
7. **后处理**：对生成的 Java 代码进行最终处理（可选）
8. **额外代码生成**：生成额外的辅助代码（可选）

## 插件优先级

插件按优先级顺序执行，优先级高的插件先执行。

### 设置优先级

```typescript
const plugin: TranspilePlugin = {
  name: 'my-plugin',
  priority: 100, // 高优先级，先执行
  transformDecorator: (decorator, context) => {
    // 转换逻辑
    return decorator;
  },
};
```

### 默认优先级

- 默认优先级：`0`
- 内置插件优先级：
  - `mapperPlugin`: 10
  - `entityPlugin`: 10
  - `validationPlugin`: 5
  - `datePlugin`: 5
  - `servicePlugin`: 10
  - `controllerPlugin`: 10
  - `queryWrapperPlugin`: 5

### 优先级建议

- **高优先级（100+）**：核心转换逻辑，需要最先执行
- **中优先级（10-99）**：框架特定的转换
- **低优先级（0-9）**：辅助功能，如验证、日志等
- **默认优先级（0）**：通用转换逻辑

## 插件示例

### 示例 1：自定义装饰器转换

假设你有一个自定义装饰器 `@ApiIgnore`，需要转换为 Java 的 `@ApiIgnore` 注解。

```typescript
import type { TranspilePlugin } from '@ai-partner-x/aiko-boot-codegen';

const apiIgnorePlugin: TranspilePlugin = {
  name: 'api-ignore-plugin',
  priority: 10,
  
  transformDecorator: (decorator, context) => {
    // 转换 @ApiIgnore 装饰器
    if (decorator.name === 'ApiIgnore') {
      return {
        ...decorator,
        name: 'ApiIgnore',
        args: {},
      };
    }
    return decorator;
  },
};

export default apiIgnorePlugin;
```

### 示例 2：自定义类型映射

假设你有一个自定义类型 `Money`，需要转换为 Java 的 `BigDecimal`。

```typescript
import type { TranspilePlugin } from '@ai-partner-x/aiko-boot-codegen';

const moneyTypePlugin: TranspilePlugin = {
  name: 'money-type-plugin',
  priority: 5,
  
  transformType: (tsType, context) => {
    // 转换 Money 类型
    if (tsType === 'Money') {
      return 'BigDecimal';
    }
    return tsType;
  },
};

export default moneyTypePlugin;
```

### 示例 3：添加验证注解

为实体类的字段添加验证注解。

```typescript
import type { TranspilePlugin } from '@ai-partner-x/aiko-boot-codegen';

const validationPlugin: TranspilePlugin = {
  name: 'validation-plugin',
  priority: 5,
  
  transformClass: (cls, context) => {
    // 只处理实体类
    if (context.classType !== 'entity') {
      return cls;
    }
    
    // 为每个字段添加验证注解
    const fields = cls.fields.map(field => {
      const decorators = [...field.decorators];
      
      // 为字符串字段添加 @NotBlank
      if (field.type === 'string' && !field.optional) {
        decorators.push({
          name: 'NotBlank',
          args: {},
        });
      }
      
      // 为数字字段添加 @Min 和 @Max
      if (field.type === 'number') {
        decorators.push({
          name: 'Min',
          args: { value: 0 },
        });
        decorators.push({
          name: 'Max',
          args: { value: 999999 },
        });
      }
      
      return {
        ...field,
        decorators,
      };
    });
    
    return {
      ...cls,
      fields,
    };
  },
};

export default validationPlugin;
```

### 示例 4：添加日志注解

为服务类的方法添加日志注解。

```typescript
import type { TranspilePlugin } from '@ai-partner-x/aiko-boot-codegen';

const loggingPlugin: TranspilePlugin = {
  name: 'logging-plugin',
  priority: 5,
  
  transformMethod: (method, context) => {
    // 只处理服务类的方法
    if (context.classType !== 'service') {
      return method;
    }
    
    // 为公共方法添加日志注解
    const decorators = [...method.decorators];
    
    if (!method.name.startsWith('_') && !method.name.startsWith('get')) {
      decorators.push({
        name: 'LogExecutionTime',
        args: {},
      });
    }
    
    return {
      ...method,
      decorators,
    };
  },
};

export default loggingPlugin;
```

### 示例 5：后处理生成的代码

对生成的 Java 代码进行格式化或添加额外的导入。

```typescript
import type { TranspilePlugin } from '@ai-partner-x/aiko-boot-codegen';

const formatPlugin: TranspilePlugin = {
  name: 'format-plugin',
  priority: 0,
  
  postProcess: (javaCode, context) => {
    // 添加额外的导入
    if (context.classType === 'entity') {
      const imports = [
        'import lombok.Data;',
        'import lombok.NoArgsConstructor;',
        'import lombok.AllArgsConstructor;',
      ].join('\n');
      
      return imports + '\n\n' + javaCode;
    }
    
    return javaCode;
  },
};

export default formatPlugin;
```

### 示例 6：生成额外代码

为实体类生成 Builder 模式代码。

```typescript
import type { TranspilePlugin } from '@ai-partner-x/aiko-boot-codegen';

const builderPlugin: TranspilePlugin = {
  name: 'builder-plugin',
  priority: 0,
  
  generateAdditional: (cls, context) => {
    // 只为实体类生成 Builder
    if (context.classType !== 'entity') {
      return null;
    }
    
    const builderCode = `
public static class Builder {
  ${cls.fields.map(field => `private ${field.type} ${field.name};`).join('\n  ')}

  ${cls.fields.map(field => `
  public Builder ${field.name}(${field.type} ${field.name}) {
    this.${field.name} = ${field.name};
    return this;
  }`).join('')}

  public ${cls.name} build() {
    ${cls.name} instance = new ${cls.name}();
    ${cls.fields.map(field => `instance.${field.name} = this.${field.name};`).join('\n    ')}
    return instance;
  }
}
    `.trim();
    
    return builderCode;
  },
};

export default builderPlugin;
```

### 示例 7：综合示例

一个完整的插件示例，包含多个转换钩子。

```typescript
import type { TranspilePlugin } from '@ai-partner-x/aiko-boot-codegen';

const comprehensivePlugin: TranspilePlugin = {
  name: 'comprehensive-plugin',
  priority: 10,
  
  transformDecorator: (decorator, context) => {
    // 转换自定义装饰器
    if (decorator.name === 'CustomEntity') {
      return {
        ...decorator,
        name: 'Entity',
        args: {},
      };
    }
    return decorator;
  },
  
  transformType: (tsType, context) => {
    // 转换自定义类型
    if (tsType === 'UUID') {
      return 'String';
    }
    if (tsType === 'Money') {
      return 'BigDecimal';
    }
    return tsType;
  },
  
  transformMethod: (method, context) => {
    // 为服务类方法添加事务注解
    if (context.classType === 'service' && method.name.startsWith('create') || method.name.startsWith('update') || method.name.startsWith('delete')) {
      const decorators = [...method.decorators];
      decorators.push({
        name: 'Transactional',
        args: {},
      });
      return {
        ...method,
        decorators,
      };
    }
    return method;
  },
  
  transformClass: (cls, context) => {
    // 为实体类添加序列化注解
    if (context.classType === 'entity') {
      const decorators = [...cls.decorators];
      decorators.push({
        name: 'JsonSerialize',
        args: { using: 'LocalDateTimeSerializer.class' },
      });
      return {
        ...cls,
        decorators,
      };
    }
    return cls;
  },
  
  postProcess: (javaCode, context) => {
    // 添加额外的导入
    if (context.classType === 'entity') {
      return `import com.fasterxml.jackson.databind.ser.std.LocalDateTimeSerializer;\n\n` + javaCode;
    }
    return javaCode;
  },
};

export default comprehensivePlugin;
```

## 使用插件

### 注册插件

```typescript
import { PluginRegistry } from '@ai-partner-x/aiko-boot-codegen';
import myPlugin from './my-plugin';

const registry = new PluginRegistry();
registry.register(myPlugin);
```

### 注册多个插件

```typescript
import { PluginRegistry } from '@ai-partner-x/aiko-boot-codegen';
import plugin1 from './plugin1';
import plugin2 from './plugin2';

const registry = new PluginRegistry();
registry.registerAll([plugin1, plugin2]);
```

### 在代码生成中使用插件

```typescript
import { transpile } from '@ai-partner-x/aiko-boot-codegen';
import { PluginRegistry } from '@ai-partner-x/aiko-boot-codegen';
import myPlugin from './my-plugin';

const registry = new PluginRegistry();
registry.register(myPlugin);

const result = transpile(sourceCode, {
  packageName: 'com.example',
  pluginRegistry: registry,
});
```

### 在 CLI 中使用插件

创建一个自定义 CLI 脚本：

```typescript
#!/usr/bin/env node
import { transpileCommand } from '@ai-partner-x/aiko-boot-codegen/cli';
import { PluginRegistry } from '@ai-partner-x/aiko-boot-codegen';
import myPlugin from './my-plugin';

const registry = new PluginRegistry();
registry.register(myPlugin);

await transpileCommand('./src', {
  out: './gen',
  package: 'com.example',
  pluginRegistry: registry,
});
```

## 最佳实践

### 1. 插件命名

使用描述性的插件名称：

```typescript
const plugin: TranspilePlugin = {
  name: 'validation-plugin', // ✅ 好的命名
  // name: 'plugin1', // ❌ 不好的命名
};
```

### 2. 优先级设置

合理设置插件优先级：

```typescript
const plugin: TranspilePlugin = {
  name: 'my-plugin',
  priority: 10, // 根据插件的重要性设置优先级
};
```

### 3. 条件转换

只在特定条件下执行转换：

```typescript
transformClass: (cls, context) => {
  // 只处理实体类
  if (context.classType !== 'entity') {
    return cls;
  }
  
  // 转换逻辑
  return transformedClass;
}
```

### 4. 保持不可变性

不要修改原始对象，返回新对象：

```typescript
transformDecorator: (decorator, context) => {
  // ✅ 好的做法：返回新对象
  return {
    ...decorator,
    name: 'NewName',
  };
  
  // ❌ 不好的做法：修改原始对象
  decorator.name = 'NewName';
  return decorator;
}
```

### 5. 错误处理

添加适当的错误处理：

```typescript
transformType: (tsType, context) => {
  try {
    // 转换逻辑
    return transformedType;
  } catch (error) {
    console.error(`Error transforming type ${tsType}:`, error);
    return tsType; // 返回原始类型
  }
}
```

### 6. 日志记录

添加日志记录以便调试：

```typescript
transformMethod: (method, context) => {
  if (context.options.verbose) {
    console.log(`Transforming method ${method.name} in class ${context.className}`);
  }
  
  // 转换逻辑
  return transformedMethod;
}
```

### 7. 插件测试

为插件编写单元测试：

```typescript
import { PluginRegistry } from '@ai-partner-x/aiko-boot-codegen';
import myPlugin from './my-plugin';

describe('My Plugin', () => {
  test('should transform decorator', () => {
    const registry = new PluginRegistry();
    registry.register(myPlugin);
    
    const decorator = { name: 'OldName', args: {} };
    const context = {
      sourceFile: 'test.ts',
      className: 'TestClass',
      classType: 'entity',
      options: {},
      allClasses: [],
    };
    
    const result = registry.applyDecoratorTransform(decorator, context);
    expect(result.name).toBe('NewName');
  });
});
```

## 调试插件

### 1. 启用详细输出

```bash
aiko-codegen transpile ./src --out ./gen --package com.example --verbose
```

### 2. 使用 dry-run 模式

```bash
aiko-codegen transpile ./src --out ./gen --package com.example --dry-run
```

### 3. 添加日志

在插件中添加日志：

```typescript
transformDecorator: (decorator, context) => {
  console.log(`[MyPlugin] Transforming decorator: ${decorator.name}`);
  
  const result = /* 转换逻辑 */;
  
  console.log(`[MyPlugin] Transformed to: ${result.name}`);
  return result;
}
```

### 4. 使用调试器

在 VS Code 中配置调试：

```json
{
  "type": "node",
  "request": "launch",
  "name": "Debug Plugin",
  "program": "${workspaceFolder}/packages/aiko-boot-codegen/dist/cli/index.js",
  "args": ["transpile", "./src", "--out", "./gen", "--package", "com.example", "--verbose"],
  "preLaunchTask": "tsc: build - packages/aiko-boot-codegen/tsconfig.json"
}
```

## 常见问题

### Q: 如何确保插件按特定顺序执行？

A: 设置插件的 `priority` 属性，优先级高的插件先执行。

```typescript
const plugin1: TranspilePlugin = {
  name: 'plugin1',
  priority: 100, // 先执行
};

const plugin2: TranspilePlugin = {
  name: 'plugin2',
  priority: 50, // 后执行
};
```

### Q: 如何在插件中访问其他类？

A: 使用 `context.allClasses` 访问当前文件中的所有类。

```typescript
transformClass: (cls, context) => {
  const otherClasses = context.allClasses.filter(c => c.name !== cls.name);
  // 使用其他类
  return cls;
}
```

### Q: 如何在插件中添加自定义导入？

A: 在 `postProcess` 钩子中添加导入。

```typescript
postProcess: (javaCode, context) => {
  const customImport = 'import com.example.CustomAnnotation;';
  return customImport + '\n\n' + javaCode;
}
```

### Q: 如何在插件中处理嵌套类型？

A: 递归处理类型字符串。

```typescript
transformType: (tsType, context) => {
  // 处理数组类型
  if (tsType.endsWith('[]')) {
    const baseType = tsType.slice(0, -2);
    return `List<${this.transformType(baseType, context)}>`;
  }
  
  // 处理泛型类型
  if (tsType.includes('<')) {
    const [base, ...generics] = tsType.split(/[<>]/g);
    const transformedGenerics = generics.map(g => this.transformType(g.trim(), context));
    return `${base}<${transformedGenerics.join(', ')}>`;
  }
  
  return tsType;
}
```

### Q: 如何在插件中生成注释？

A: 在 `postProcess` 钩子中添加注释。

```typescript
postProcess: (javaCode, context) => {
  const comment = `/**\n * Generated by MyPlugin\n * @author Your Name\n */\n`;
  return comment + javaCode;
}
```

## 更多资源

- [API 文档](./API.md) - 详细的 API 参考
- [README](./README.md) - 使用文档
- [GitHub Issues](https://github.com/ai-partner-x/ai-first-framework/issues) - 报告问题和获取帮助

## 贡献

欢迎贡献你的插件！请查看 [CONTRIBUTING.md](./CONTRIBUTING.md) 了解详情。
