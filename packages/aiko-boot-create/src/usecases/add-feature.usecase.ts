import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs-extra';
import type { Logger } from '../core/logger.js';
import type { Prompter } from '../core/prompts.js';
import { loadProjectConfig } from '../core/project-config.js';
import { syncRootPackageJson, withProjectConfig } from '../core/workspace.js';

// 在 ESM 环境中模拟 __dirname，兼容打包到 dist 后的运行时
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export type AddFeatureInput = {
  serviceName: string;
  feature: string;
  rootDir?: string;
  dryRun: boolean;
};

export type AddFeatureDeps = {
  logger: Logger;
  prompter: Prompter;
};

export function createAddFeatureUseCase(deps: AddFeatureDeps) {
  const { logger } = deps;

  async function execute(input: AddFeatureInput): Promise<void> {
    const rootDir = input.rootDir ?? process.cwd();
    const feature = input.feature;

    if (input.dryRun) {
      logger.info(
        `[dry-run] 将在 ${rootDir} 中为服务端 "${input.serviceName}" 增加特性：${feature}`,
      );
      return;
    }

    const config = await loadProjectConfig(rootDir);
    if (!config) {
      throw new Error(
        '未找到 .aiko-boot.json，当前目录似乎不是脚手架根目录，请在 init 生成的根目录下执行。',
      );
    }

    let apiDir: string;
    const api = (config.apis ?? []).find(
      (x) => x.name === input.serviceName,
    );

    if (api) {
      // 从配置中读取路径
      apiDir = path.join(rootDir, api.path);
    } else {
      // 如果配置中没有，尝试从 packages/<serviceName> 推断
      const candidateApiDir = path.join(rootDir, 'packages', input.serviceName);
      if (await fs.pathExists(candidateApiDir)) {
        logger.info(
          `未在 .aiko-boot.json 中找到 "${input.serviceName}" 配置，但检测到目录 ${candidateApiDir}，将使用该目录。`,
        );
        apiDir = candidateApiDir;
      } else {
        throw new Error(
          `未在 .aiko-boot.json 中找到名为 "${input.serviceName}" 的服务端配置，且未找到 packages/${input.serviceName} 目录。\n` +
            `请先使用 "add-api ${input.serviceName}" 添加服务端，或手动在 .aiko-boot.json 中配置。`,
        );
      }
    }

    // 根据特性类型调用对应的处理函数
    if (feature === 'file') {
      await addFileFeatureToApi({
        apiDir,
        rootDir,
        logger,
      });
      logger.info(
        `已为服务端 "${input.serviceName}" 启用 file 特性（本地存储 + 上传控制器）。`,
      );
    } else if (feature === 'redis') {
      await addRedisFeatureToApi({
        apiDir,
        rootDir,
        logger,
      });
      logger.info(
        `已为服务端 "${input.serviceName}" 启用 redis 特性（缓存管理 + Redis 连接）。`,
      );
    } else if (feature === 'mq') {
      await addMqFeatureToApi({
        apiDir,
        rootDir,
        logger,
      });
      logger.info(
        `已为服务端 "${input.serviceName}" 启用 mq 特性（消息队列 + 消费者服务）。`,
      );
    } else {
      logger.info(
        `TODO: 特性 "${feature}" 暂未实现，当前仅支持 feature=file（文件上传）、feature=redis（缓存管理）和 feature=mq（消息队列）。`,
      );
      return;
    }

    // 更新 .aiko-boot.json 中的 features 数组
    await withProjectConfig(rootDir, (cfg) => {
      const apiConfig = cfg.apis?.find((x) => x.name === input.serviceName);
      if (apiConfig) {
        const features = apiConfig.features ?? [];
        if (!features.includes(feature)) {
          features.push(feature);
          apiConfig.features = features;
        }
      }
    });

    // 特性添加完成后，同步根 package.json（保证 scripts 等信息最新）
    await syncRootPackageJson(rootDir);
  }

  return { execute };
}

type AddFileFeatureContext = {
  apiDir: string;
  rootDir: string;
  logger: Logger;
};

async function addFileFeatureToApi(ctx: AddFileFeatureContext): Promise<void> {
  const { apiDir, rootDir, logger } = ctx;

  // 1) 更新 api package.json 依赖（storage starter + multer）
  const pkgPath = path.join(apiDir, 'package.json');
  if (!(await fs.pathExists(pkgPath))) {
    throw new Error(`未找到 API package.json：${pkgPath}`);
  }
  const pkg = await fs.readJson(pkgPath);
  pkg.dependencies = pkg.dependencies ?? {};
  pkg.devDependencies = pkg.devDependencies ?? {};

  if (!pkg.dependencies['@ai-partner-x/aiko-boot-starter-storage']) {
    pkg.dependencies['@ai-partner-x/aiko-boot-starter-storage'] =
      'workspace:*';
  }
  if (!pkg.dependencies.multer) {
    pkg.dependencies.multer = '^1.4.5-lts.1';
  }
  if (!pkg.devDependencies['@types/multer']) {
    pkg.devDependencies['@types/multer'] = '^1.4.12';
  }

  await fs.writeJson(pkgPath, pkg, { spaces: 2 });
  logger.info('更新依赖：已写入 aiko-boot-starter-storage / multer / @types/multer。');

  // 2) 更新 app.config.ts，增加 storage 配置（如果尚未存在）
  const appConfigPath = path.join(apiDir, 'app.config.ts');
  if (await fs.pathExists(appConfigPath)) {
    let content = await fs.readFile(appConfigPath, 'utf-8');
    if (!content.includes('storage:')) {
      const marker = '} satisfies AppConfig;';
      const storageBlock = `  storage: {
    provider: 'local',
    local: {
      uploadDir: './uploads',
      baseUrl: 'http://localhost:3001/api/uploads',
    },
  },

`;
      if (!content.includes(marker)) {
        throw new Error(
          `无法在 app.config.ts 中找到 "${marker}"，请手动合并 storage 配置。`,
        );
      }
      content = content.replace(marker, `${storageBlock}${marker}`);
      await fs.writeFile(appConfigPath, content, 'utf-8');
      logger.info('已在 app.config.ts 中注入 storage 配置。');
    } else {
      logger.info('检测到 app.config.ts 已存在 storage 配置，跳过注入。');
    }
  } else {
    logger.warn?.('未找到 app.config.ts，跳过 storage 配置注入。');
  }

  // 3) 更新 server.ts，挂载 multer 中间件与静态文件服务
  const serverPath = path.join(apiDir, 'src', 'server.ts');
  if (await fs.pathExists(serverPath)) {
    let serverCode = await fs.readFile(serverPath, 'utf-8');

    if (!serverCode.includes('hasFileUpload')) {
      // import { dirname } from 'path'; => import { dirname, join } from 'path';
      serverCode = serverCode.replace(
        "import { dirname } from 'path';",
        "import { dirname, join } from 'path';",
      );

      if (!serverCode.includes("from 'multer'")) {
        serverCode = serverCode.replace(
          "import express from 'express';",
          "import express from 'express';\nimport multer from 'multer';",
        );
      }

      const loggerBlock = `  logger.info('Express middleware configured', {
    hasRequestLogging: true,
  });
`;
      const replacementBlock = `  // 配置 multer 文件上传中间件
  const upload = multer({ storage: multer.memoryStorage() });
  expressApp.post('/api/upload', upload.single('file'));
  expressApp.post('/api/upload/multiple', upload.array('files', 10));

  // 配置静态文件服务（本地存储时访问上传的文件）
  const uploadsDir = join(__dirname, '..', 'uploads');
  expressApp.use('/api/uploads', express.static(uploadsDir));

  logger.info('Express middleware configured', {
    hasRequestLogging: true,
    hasFileUpload: true,
    hasStaticFiles: true,
  });
`;

      if (!serverCode.includes(loggerBlock)) {
        throw new Error(
          '无法在 server.ts 中找到 Express 中间件配置位置，请手动合并文件上传逻辑。',
        );
      }
      serverCode = serverCode.replace(loggerBlock, replacementBlock);
      await fs.writeFile(serverPath, serverCode, 'utf-8');
      logger.info('已在 server.ts 中配置 multer 中间件和静态文件服务。');
    } else {
      logger.info('检测到 server.ts 已包含文件上传相关配置，跳过修改。');
    }
  } else {
    logger.warn?.('未找到 src/server.ts，跳过服务端中间件配置。');
  }

  // 4) 复制上传控制器模板到 src/controller/upload.controller.ts
  const controllerDir = path.join(apiDir, 'src', 'controller');
  const uploadControllerPath = path.join(
    controllerDir,
    'upload.controller.ts',
  );

  if (!(await fs.pathExists(uploadControllerPath))) {
    const templateControllerPath = path.resolve(
      __dirname,
      '../../templates/feature-file/api/upload.controller.ts',
    );
    await fs.ensureDir(controllerDir);
    await fs.copy(templateControllerPath, uploadControllerPath);
    logger.info('已创建上传控制器 src/controller/upload.controller.ts。');
  } else {
    logger.info('检测到上传控制器已存在，跳过创建。');
  }

  // 5) 创建 uploads 目录和 .gitkeep
  const uploadsDir = path.join(apiDir, 'uploads');
  await fs.ensureDir(uploadsDir);
  await fs.writeFile(path.join(uploadsDir, '.gitkeep'), '', 'utf-8');
  logger.info('已创建 uploads 目录及占位文件。');

  // 6) 更新根 .gitignore，忽略上传文件但保留 .gitkeep
  const gitignorePath = path.join(rootDir, '.gitignore');
  let gitignore = (await fs.pathExists(gitignorePath))
    ? await fs.readFile(gitignorePath, 'utf-8')
    : '';

  const relativeUploadsPath = path
    .relative(rootDir, uploadsDir)
    .replace(/\\\\/g, '/')
    .replace(/\\/g, '/');

  const ignoreLine = `${relativeUploadsPath}/*`;
  const keepLine = `!${relativeUploadsPath}/.gitkeep`;

  if (!gitignore.includes(ignoreLine)) {
    gitignore += `\n# Uploads (generated by aiko-boot-create)\n${ignoreLine}\n${keepLine}\n`;
    await fs.writeFile(gitignorePath, gitignore.trimStart() + '\n', 'utf-8');
    logger.info('已在根 .gitignore 中添加 uploads 忽略规则。');
  } else {
    logger.info('根 .gitignore 中已存在 uploads 忽略规则，跳过修改。');
  }
}

type AddRedisFeatureContext = {
  apiDir: string;
  rootDir: string;
  logger: Logger;
};

async function addRedisFeatureToApi(ctx: AddRedisFeatureContext): Promise<void> {
  const { apiDir, rootDir, logger } = ctx;

  // 1) 更新 api package.json 依赖（cache starter + ioredis）
  const pkgPath = path.join(apiDir, 'package.json');
  if (!(await fs.pathExists(pkgPath))) {
    throw new Error(`未找到 API package.json：${pkgPath}`);
  }
  const pkg = await fs.readJson(pkgPath);
  pkg.dependencies = pkg.dependencies ?? {};
  pkg.devDependencies = pkg.devDependencies ?? {};

  if (!pkg.dependencies['@ai-partner-x/aiko-boot-starter-cache']) {
    pkg.dependencies['@ai-partner-x/aiko-boot-starter-cache'] = 'workspace:*';
  }
  if (!pkg.dependencies.ioredis) {
    pkg.dependencies.ioredis = '^5.4.2';
  }

  await fs.writeJson(pkgPath, pkg, { spaces: 2 });
  logger.info('更新依赖：已写入 aiko-boot-starter-cache / ioredis。');

  // 2) 更新 app.config.ts，增加 cache 配置（如果尚未存在）
  const appConfigPath = path.join(apiDir, 'app.config.ts');
  if (await fs.pathExists(appConfigPath)) {
    let content = await fs.readFile(appConfigPath, 'utf-8');
    if (!content.includes('cache:')) {
      const marker = '} satisfies AppConfig;';
      const cacheBlock = `  // ========== Cache Configuration (cache.*) ==========
  // Cache is disabled by default — no Redis connection is made until you opt in.
  // To enable: set \`enabled: true\`, ensure Redis is running, then adjust host/port.
  cache: {
    enabled: false,  // set to true to activate (requires Redis)
    type: 'redis',
    host: process.env.REDIS_HOST || '127.0.0.1',
    port: Number(process.env.REDIS_PORT) || 6379,
  },
`;
      if (!content.includes(marker)) {
        throw new Error(
          `无法在 app.config.ts 中找到 "${marker}"，请手动合并 cache 配置。`,
        );
      }
      content = content.replace(marker, `${cacheBlock}${marker}`);
      await fs.writeFile(appConfigPath, content, 'utf-8');
      logger.info('已在 app.config.ts 中注入 cache 配置。');
    } else {
      logger.info('检测到 app.config.ts 已存在 cache 配置，跳过注入。');
    }
  } else {
    logger.warn?.('未找到 app.config.ts，跳过 cache 配置注入。');
  }

  // 3) 复制缓存相关文件模板
  const templateBaseDir = path.resolve(
    __dirname,
    '../../templates/feature-redis/api',
  );

  // 复制 DTO
  const dtoDir = path.join(apiDir, 'src', 'dto');
  const cacheDtoPath = path.join(dtoDir, 'cache.dto.ts');
  if (!(await fs.pathExists(cacheDtoPath))) {
    const templateDtoPath = path.join(templateBaseDir, 'src', 'dto', 'cache.dto.ts');
    await fs.ensureDir(dtoDir);
    await fs.copy(templateDtoPath, cacheDtoPath);
    logger.info('已创建缓存 DTO src/dto/cache.dto.ts。');
  } else {
    logger.info('检测到缓存 DTO 已存在，跳过创建。');
  }

  // 复制 Service
  const serviceDir = path.join(apiDir, 'src', 'service');
  const cacheServicePath = path.join(serviceDir, 'cache.service.ts');
  if (!(await fs.pathExists(cacheServicePath))) {
    const templateServicePath = path.join(templateBaseDir, 'src', 'service', 'cache.service.ts');
    await fs.ensureDir(serviceDir);
    await fs.copy(templateServicePath, cacheServicePath);
    logger.info('已创建缓存服务 src/service/cache.service.ts。');
  } else {
    logger.info('检测到缓存服务已存在，跳过创建。');
  }

  // 复制 Controller
  const controllerDir = path.join(apiDir, 'src', 'controller');
  const cacheControllerPath = path.join(controllerDir, 'cache.controller.ts');
  if (!(await fs.pathExists(cacheControllerPath))) {
    const templateControllerPath = path.join(templateBaseDir, 'src', 'controller', 'cache.controller.ts');
    await fs.ensureDir(controllerDir);
    await fs.copy(templateControllerPath, cacheControllerPath);
    logger.info('已创建缓存控制器 src/controller/cache.controller.ts。');
  } else {
    logger.info('检测到缓存控制器已存在，跳过创建。');
  }
}

type AddMqFeatureContext = {
  apiDir: string;
  rootDir: string;
  logger: Logger;
};

async function addMqFeatureToApi(ctx: AddMqFeatureContext): Promise<void> {
  const { apiDir, rootDir, logger } = ctx;

  // 1) 更新 api package.json 依赖（mq starter）
  const pkgPath = path.join(apiDir, 'package.json');
  if (!(await fs.pathExists(pkgPath))) {
    throw new Error(`未找到 API package.json：${pkgPath}`);
  }
  const pkg = await fs.readJson(pkgPath);
  pkg.dependencies = pkg.dependencies ?? {};
  pkg.devDependencies = pkg.devDependencies ?? {};

  if (!pkg.dependencies['@ai-partner-x/aiko-boot-starter-mq']) {
    pkg.dependencies['@ai-partner-x/aiko-boot-starter-mq'] = 'workspace:*';
  }

  await fs.writeJson(pkgPath, pkg, { spaces: 2 });
  logger.info('更新依赖：已写入 aiko-boot-starter-mq。');

  // 2) 更新 app.config.ts，增加 mq 配置（如果尚未存在）
  const appConfigPath = path.join(apiDir, 'app.config.ts');
  if (await fs.pathExists(appConfigPath)) {
    let content = await fs.readFile(appConfigPath, 'utf-8');
    if (!content.includes('mq:')) {
      const marker = '} satisfies AppConfig;';
      const mqBlock = `  // ========== MQ Configuration (消息队列) ==========
  // 使用内存适配器无需 RabbitMQ，设置 MQ_TYPE=memory 或使用下方配置
  mq: {
    enabled: true,
    type: 'memory' as const,
  },
`;
      if (!content.includes(marker)) {
        throw new Error(
          `无法在 app.config.ts 中找到 "${marker}"，请手动合并 mq 配置。`,
        );
      }
      content = content.replace(marker, `${mqBlock}${marker}`);
      await fs.writeFile(appConfigPath, content, 'utf-8');
      logger.info('已在 app.config.ts 中注入 mq 配置。');
    } else {
      logger.info('检测到 app.config.ts 已存在 mq 配置，跳过注入。');
    }
  } else {
    logger.warn?.('未找到 app.config.ts，跳过 mq 配置注入。');
  }

  // 3) 复制 MQ 相关文件模板
  const templateBaseDir = path.resolve(
    __dirname,
    '../../templates/feature-mq/api',
  );

  // 复制 DTO
  const dtoDir = path.join(apiDir, 'src', 'dto');
  const mqDtoPath = path.join(dtoDir, 'mq.dto.ts');
  if (!(await fs.pathExists(mqDtoPath))) {
    const templateDtoPath = path.join(templateBaseDir, 'src', 'dto', 'mq.dto.ts');
    await fs.ensureDir(dtoDir);
    await fs.copy(templateDtoPath, mqDtoPath);
    logger.info('已创建 MQ DTO src/dto/mq.dto.ts。');
  } else {
    logger.info('检测到 MQ DTO 已存在，跳过创建。');
  }

  // 复制 Service
  const serviceDir = path.join(apiDir, 'src', 'service');
  const mqConsumerServicePath = path.join(serviceDir, 'mq.consumer.service.ts');
  if (!(await fs.pathExists(mqConsumerServicePath))) {
    const templateServicePath = path.join(templateBaseDir, 'src', 'service', 'mq.consumer.service.ts');
    await fs.ensureDir(serviceDir);
    await fs.copy(templateServicePath, mqConsumerServicePath);
    logger.info('已创建 MQ 消费者服务 src/service/mq.consumer.service.ts。');
  } else {
    logger.info('检测到 MQ 消费者服务已存在，跳过创建。');
  }

  // 复制 Controller
  const controllerDir = path.join(apiDir, 'src', 'controller');
  const mqControllerPath = path.join(controllerDir, 'mq.controller.ts');
  if (!(await fs.pathExists(mqControllerPath))) {
    const templateControllerPath = path.join(templateBaseDir, 'src', 'controller', 'mq.controller.ts');
    await fs.ensureDir(controllerDir);
    await fs.copy(templateControllerPath, mqControllerPath);
    logger.info('已创建 MQ 控制器 src/controller/mq.controller.ts。');
  } else {
    logger.info('检测到 MQ 控制器已存在，跳过创建。');
  }
}


