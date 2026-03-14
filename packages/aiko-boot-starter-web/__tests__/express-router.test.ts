/**
 * Express Router 单元测试
 * 测试 createExpressRouter 和 @RequestPart/@ModelAttribute 的行为
 */

import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest';
import { createExpressRouter, RequestPart, ModelAttribute, RequestAttribute, RestController, PostMapping, GetMapping, RequestParam } from '../src';
import { Router } from 'express';

vi.mock('multer', () => {
  const multerFn: any = vi.fn(() => ({
    fields: vi.fn().mockReturnValue(vi.fn()),
  }));
  multerFn.memoryStorage = vi.fn();
  return { default: multerFn };
});

vi.mock('fs/promises', () => ({
  writeFile: vi.fn(),
}));

describe('createExpressRouter', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('当 @RequestPart 用于未启用 multipart 的路由时应抛出错误', () => {
    @RestController({ path: '/test' })
    class TestController {
      @PostMapping('/upload')
      upload(@RequestPart('file') file: any) {
        return { success: true };
      }
    }

    expect(() => {
      createExpressRouter([TestController], {
        prefix: '/api',
        verbose: false,
      });
    }).toThrow(/Multipart processing is disabled/);
  });

  test('当 @RequestPart 用于启用 multipart 的路由时不应抛出错误', () => {
    @RestController({ path: '/test' })
    class TestController {
      @PostMapping('/upload')
      upload(@RequestPart('file') file: any) {
        return { success: true };
      }
    }

    expect(() => {
      createExpressRouter([TestController], {
        prefix: '/api',
        verbose: false,
        multipart: {
          maxFileSize: 1024 * 1024,
        },
      });
    }).not.toThrow();
  });

  test('应该正确处理空对象作为 req.body', () => {
    const router = Router();
    const registerControllerSpy = vi.fn();

    @RestController({ path: '/test' })
    class TestController {
      @PostMapping('/search')
      search(@ModelAttribute() query: any) {
        return query;
      }
    }

    const controllers = [TestController];
    const options = {
      prefix: '/api',
      verbose: false,
    };

    expect(() => {
      createExpressRouter(controllers, options);
    }).not.toThrow();
  });

  test('应该正确处理 undefined 作为 req.body', () => {
    const router = Router();

    @RestController({ path: '/test' })
    class TestController {
      @PostMapping('/search')
      search(@ModelAttribute() query: any) {
        return query;
      }
    }

    expect(() => {
      createExpressRouter([TestController], {
        prefix: '/api',
        verbose: false,
      });
    }).not.toThrow();
  });

  test('应该正确处理数组作为 req.body（带警告）', () => {
    const router = Router();

    @RestController({ path: '/test' })
    class TestController {
      @PostMapping('/search')
      search(@ModelAttribute() query: any) {
        return query;
      }
    }

    expect(() => {
      createExpressRouter([TestController], {
        prefix: '/api',
        verbose: false,
      });
    }).not.toThrow();
  });

  test('应该正确处理带 @ModelAttribute 的路由注册', () => {
    const router = Router();

    @RestController({ path: '/test' })
    class TestController {
      @PostMapping('/search')
      search(@ModelAttribute() query: any) {
        return { parsed: query };
      }
    }

    expect(() => {
      createExpressRouter([TestController], {
        prefix: '/api',
        verbose: false,
      });
    }).not.toThrow();
  });

  test('应该正确处理多个 @ModelAttribute 参数', () => {
    const router = Router();

    @RestController({ path: '/test' })
    class TestController {
      @PostMapping('/search1')
      search1(@ModelAttribute() query: any) {
        return query;
      }

      @PostMapping('/search2')
      search2(@ModelAttribute() query: any) {
        return query;
      }
    }

    expect(() => {
      createExpressRouter([TestController], {
        prefix: '/api',
        verbose: false,
      });
    }).not.toThrow();
  });

  test('应该正确处理混合装饰器（@ModelAttribute + @RequestParam）', () => {
    const router = Router();

    @RestController({ path: '/test' })
    class TestController {
      @PostMapping('/search')
      search(@ModelAttribute() query: any, @RequestParam('file') file: any) {
        return { query, file };
      }
    }

    expect(() => {
      createExpressRouter([TestController], {
        prefix: '/api',
        verbose: false,
        multipart: {
          maxFileSize: 1024 * 1024,
        },
      });
    }).not.toThrow();
  });

  test('应该正确处理重复的 @RequestPart 名称时抛出错误', () => {
    @RestController({ path: '/test' })
    class TestController {
      @PostMapping('/upload')
      upload(@RequestPart('file') file1: any, @RequestPart('file') file2: any) {
        return { success: true };
      }
    }

    expect(() => {
      createExpressRouter([TestController], {
        prefix: '/api',
        verbose: false,
        multipart: {
          maxFileSize: 1024 * 1024,
        },
      });
    }).toThrow(/Duplicate @RequestPart name/);
  });

  test('应该正确处理没有 @RestController 装饰器的类', () => {
    class NotRestController {
      someMethod() {
        return 'test';
      }
    }

    expect(() => {
      createExpressRouter([NotRestController], {
        prefix: '/api',
        verbose: true,
      });
    }).not.toThrow();

    expect(console.warn).toHaveBeenCalledWith(
      expect.stringContaining('No @RestController metadata found')
    );
  });

  test('应该正确处理数组形式的 controllers 参数', () => {
    @RestController({ path: '/test1' })
    class Controller1 {
      @PostMapping('/test')
      test(@ModelAttribute() query: any) {
        return 'test1';
      }
    }

    @RestController({ path: '/test2' })
    class Controller2 {
      @PostMapping('/test')
      test(@ModelAttribute() query: any) {
        return 'test2';
      }
    }

    expect(() => {
      createExpressRouter([Controller1, Controller2], {
        prefix: '/api',
        verbose: false,
      });
    }).not.toThrow();
  });

  test('应该正确处理对象形式的 controllers 参数', () => {
    @RestController({ path: '/test' })
    class TestController {
      @PostMapping('/test')
      test(@ModelAttribute() query: any) {
        return 'test';
      }
    }

    const controllers = { TestController };

    expect(() => {
      createExpressRouter(controllers, {
        prefix: '/api',
        verbose: false,
      });
    }).not.toThrow();
  });
});

describe('ModelAttribute 边界情况', () => {
  test('应该正确处理 req.query 为 undefined', () => {
    const router = Router();

    @RestController({ path: '/test' })
    class TestController {
      @PostMapping('/search')
      search(@ModelAttribute() query: any) {
        return query;
      }
    }

    expect(() => {
      createExpressRouter([TestController], {
        prefix: '/api',
        verbose: false,
      });
    }).not.toThrow();
  });

  test('应该正确处理 req.body 为 null', () => {
    const router = Router();

    @RestController({ path: '/test' })
    class TestController {
      @PostMapping('/search')
      search(@ModelAttribute() query: any) {
        return query;
      }
    }

    expect(() => {
      createExpressRouter([TestController], {
        prefix: '/api',
        verbose: false,
      });
    }).not.toThrow();
  });

  test('应该正确处理 req.body 为字符串', () => {
    const router = Router();

    @RestController({ path: '/test' })
    class TestController {
      @PostMapping('/search')
      search(@ModelAttribute() query: any) {
        return query;
      }
    }

    expect(() => {
      createExpressRouter([TestController], {
        prefix: '/api',
        verbose: false,
      });
    }).not.toThrow();
  });

  test('应该正确处理 req.body 为数字', () => {
    const router = Router();

    @RestController({ path: '/test' })
    class TestController {
      @PostMapping('/search')
      search(@ModelAttribute() query: any) {
        return query;
      }
    }

    expect(() => {
      createExpressRouter([TestController], {
        prefix: '/api',
        verbose: false,
      });
    }).not.toThrow();
  });

  test('应该正确处理 req.body 为布尔值', () => {
    const router = Router();

    @RestController({ path: '/test' })
    class TestController {
      @PostMapping('/search')
      search(@ModelAttribute() query: any) {
        return query;
      }
    }

    expect(() => {
      createExpressRouter([TestController], {
        prefix: '/api',
        verbose: false,
      });
    }).not.toThrow();
  });

  test('应该正确处理 req.body 为函数', () => {
    const router = Router();

    @RestController({ path: '/test' })
    class TestController {
      @PostMapping('/search')
      search(@ModelAttribute() query: any) {
        return query;
      }
    }

    expect(() => {
      createExpressRouter([TestController], {
        prefix: '/api',
        verbose: false,
      });
    }).not.toThrow();
  });

  test('应该正确处理 req.body 为 Symbol', () => {
    const router = Router();

    @RestController({ path: '/test' })
    class TestController {
      @PostMapping('/search')
      search(@ModelAttribute() query: any) {
        return query;
      }
    }

    expect(() => {
      createExpressRouter([TestController], {
        prefix: '/api',
        verbose: false,
      });
    }).not.toThrow();
  });
});

describe('Array Body Handling', () => {
  test('应该正确处理 req.body 为数组并记录警告', () => {
    const router = Router();

    @RestController({ path: '/test' })
    class TestController {
      @PostMapping('/search')
      search(@ModelAttribute() query: any) {
        return query;
      }
    }

    expect(() => {
      createExpressRouter([TestController], {
        prefix: '/api',
        verbose: false,
      });
    }).not.toThrow();
  });

  test('应该正确处理 req.body 为 Buffer 并返回空对象', () => {
    const router = Router();

    @RestController({ path: '/test' })
    class TestController {
      @PostMapping('/search')
      search(@ModelAttribute() query: any) {
        return query;
      }
    }

    expect(() => {
      createExpressRouter([TestController], {
        prefix: '/api',
        verbose: false,
      });
    }).not.toThrow();
  });
});

describe('Parameter injection (handler invocation)', () => {
  /**
   * Helper: 从 Express Router 的 stack 中提取指定路径的最后一个 handler。
   * multer 中间件（如果有）排在前面，真正的业务 handler 排在最后。
   */
  function getHandler(router: any, path: string): Function {
    for (const layer of router.stack) {
      if (layer.route && layer.route.path === path) {
        return layer.route.stack[layer.route.stack.length - 1].handle;
      }
    }
    throw new Error(`No handler found for path: ${path}`);
  }

  function createMockRes() {
    const res: any = {
      json: vi.fn().mockReturnThis(),
      status: vi.fn().mockReturnThis(),
    };
    return res;
  }

  test('@RequestPart 应正确注入文件为 MultipartFile', async () => {
    @RestController({ path: '/test' })
    class UploadController {
      @PostMapping('/upload')
      async upload(@RequestPart('file') file: any) {
        return { filename: file?.getOriginalFilename(), size: file?.getSize() };
      }
    }

    const router = createExpressRouter([UploadController], {
      prefix: '/api',
      verbose: false,
      multipart: { maxFileSize: 1024 * 1024 },
    });

    const handler = getHandler(router, '/api/test/upload');
    const mockReq = {
      params: {},
      query: {},
      body: {},
      files: {
        file: [{
          fieldname: 'file',
          originalname: 'photo.png',
          mimetype: 'image/png',
          size: 2048,
          buffer: Buffer.from('file-content'),
        }],
      },
    };
    const res = createMockRes();

    await handler(mockReq, res, vi.fn());

    expect(res.json).toHaveBeenCalledWith({
      success: true,
      data: { filename: 'photo.png', size: 2048 },
    });
  });

  test('@RequestPart 应正确注入非文件字段 (从 body 读取)', async () => {
    @RestController({ path: '/test' })
    class UploadController {
      @PostMapping('/upload')
      async upload(@RequestPart('file') file: any, @RequestPart('folder') folder: string) {
        return { filename: file?.getOriginalFilename(), folder };
      }
    }

    const router = createExpressRouter([UploadController], {
      prefix: '/api',
      verbose: false,
      multipart: { maxFileSize: 1024 * 1024 },
    });

    const handler = getHandler(router, '/api/test/upload');
    const mockReq = {
      params: {},
      query: {},
      body: { folder: 'avatars' },
      files: {
        file: [{
          fieldname: 'file',
          originalname: 'photo.png',
          mimetype: 'image/png',
          size: 2048,
          buffer: Buffer.from('file-content'),
        }],
      },
    };
    const res = createMockRes();

    await handler(mockReq, res, vi.fn());

    expect(res.json).toHaveBeenCalledWith({
      success: true,
      data: { filename: 'photo.png', folder: 'avatars' },
    });
  });

  test('@ModelAttribute 应合并 query 和 body 参数', async () => {
    @RestController({ path: '/test' })
    class SearchController {
      @PostMapping('/search')
      async search(@ModelAttribute() query: any) {
        return query;
      }
    }

    const router = createExpressRouter([SearchController], {
      prefix: '/api',
      verbose: false,
    });

    const handler = getHandler(router, '/api/test/search');
    const mockReq = {
      params: {},
      query: { page: '1', keyword: 'from-query' },
      body: { sortBy: 'name', keyword: 'from-body' },
    };
    const res = createMockRes();

    await handler(mockReq, res, vi.fn());

    // body 字段覆盖同名 query 字段
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      data: { page: '1', keyword: 'from-body', sortBy: 'name' },
    });
  });

  test('@ModelAttribute 当 body 是数组时应使用空对象并发出警告', async () => {
    @RestController({ path: '/test' })
    class SearchController {
      @PostMapping('/search')
      async search(@ModelAttribute() query: any) {
        return query;
      }
    }

    const router = createExpressRouter([SearchController], {
      prefix: '/api',
      verbose: false,
    });

    const handler = getHandler(router, '/api/test/search');
    const mockReq = {
      params: {},
      query: { page: '1' },
      body: [1, 2, 3],
    };
    const res = createMockRes();

    await handler(mockReq, res, vi.fn());

    expect(console.warn).toHaveBeenCalledWith(
      expect.stringContaining('@ModelAttribute received array body')
    );
    // 数组 body 被忽略，只保留 query 参数
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      data: { page: '1' },
    });
  });

  test('@RequestAttribute 应从 req 对象读取自定义属性', async () => {
    @RestController({ path: '/test' })
    class ProfileController {
      @GetMapping('/profile')
      async profile(@RequestAttribute('currentUser') user: any) {
        return { userId: user?.id };
      }
    }

    const router = createExpressRouter([ProfileController], {
      prefix: '/api',
      verbose: false,
    });

    const handler = getHandler(router, '/api/test/profile');
    const mockReq = {
      params: {},
      query: {},
      body: {},
      currentUser: { id: 42, name: 'Alice' },
    };
    const res = createMockRes();

    await handler(mockReq, res, vi.fn());

    expect(res.json).toHaveBeenCalledWith({
      success: true,
      data: { userId: 42 },
    });
  });

  test('@RequestAttribute 当属性不存在时应注入 undefined', async () => {
    @RestController({ path: '/test' })
    class ProfileController {
      @GetMapping('/profile')
      async profile(@RequestAttribute('currentUser') user: any) {
        return { hasUser: user !== undefined };
      }
    }

    const router = createExpressRouter([ProfileController], {
      prefix: '/api',
      verbose: false,
    });

    const handler = getHandler(router, '/api/test/profile');
    const mockReq = {
      params: {},
      query: {},
      body: {},
    };
    const res = createMockRes();

    await handler(mockReq, res, vi.fn());

    expect(res.json).toHaveBeenCalledWith({
      success: true,
      data: { hasUser: false },
    });
  });
});
