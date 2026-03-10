/**
 * FormController - 演示 @ModelAttribute 和 @RequestAttribute 装饰器
 *
 * @ModelAttribute  ─  将 req.query + req.body 合并注入到参数（Spring MVC 风格的表单绑定）
 * @RequestAttribute ─ 读取 Express req 对象上由中间件设置的自定义属性（如 req.currentUser）
 *
 * 此示例中，server.ts 在路由挂载前注册了一个模拟 Auth 中间件：
 *   (req as any).currentUser = { id: 1, name: 'Alice', role: 'admin' }
 *
 * ┌─────────────────────────────────────────────────────────────────┐
 * │  GET  /api/form/search        @ModelAttribute — URL 查询参数     │
 * │  POST /api/form/register      @ModelAttribute — form-urlencoded  │
 * │  GET  /api/form/profile       @RequestAttribute — req.currentUser │
 * │  GET  /api/form/tenant-info   @RequestAttribute — req.tenantId   │
 * └─────────────────────────────────────────────────────────────────┘
 */
import 'reflect-metadata';
import {
  RestController,
  GetMapping,
  PostMapping,
  ModelAttribute,
  RequestAttribute,
} from '@ai-partner-x/aiko-boot-starter-web';

/** 搜索参数 DTO（由 @ModelAttribute 从 query string 绑定） */
interface SearchDto {
  keyword?: string;
  page?: string;
  size?: string;
  category?: string;
}

/** 注册表单 DTO（由 @ModelAttribute 从 application/x-www-form-urlencoded 绑定） */
interface RegisterDto {
  username?: string;
  email?: string;
  age?: string;
}

/** 由 Auth 中间件注入到 req 的用户对象 */
interface CurrentUser {
  id: number;
  name: string;
  role: string;
}

@RestController({ path: '/form' })
export class FormController {
  /**
   * GET /api/form/search?keyword=alice&page=1&size=10&category=admin
   *
   * @ModelAttribute 将整个 req.query 合并为 SearchDto 对象注入，
   * 无需逐个声明 @RequestParam，适合有多个可选查询参数的搜索接口。
   *
   * curl "http://localhost:3003/api/form/search?keyword=alice&page=1&category=admin"
   */
  @GetMapping('/search')
  search(
    @ModelAttribute() query: SearchDto,
  ): object {
    return {
      received: query,
      parsed: {
        keyword: query.keyword ?? '(none)',
        page: Number(query.page ?? 1),
        size: Number(query.size ?? 10),
        category: query.category ?? '(all)',
      },
      message: '✅ Query params bound via @ModelAttribute (req.query + req.body merged)',
    };
  }

  /**
   * POST /api/form/register  (Content-Type: application/x-www-form-urlencoded)
   *
   * @ModelAttribute 从 req.body (urlencoded) 绑定表单字段，
   * 与 HTML <form method="POST"> 提交场景对应。
   *
   * curl -X POST http://localhost:3003/api/form/register \
   *   -d "username=alice&email=alice@example.com&age=30"
   */
  @PostMapping('/register')
  register(
    @ModelAttribute('user') dto: RegisterDto,
  ): object {
    if (!dto?.username) throw new Error('Missing required form field: username');
    if (!dto?.email) throw new Error('Missing required form field: email');
    return {
      received: dto,
      message: '✅ Form body bound via @ModelAttribute (application/x-www-form-urlencoded)',
    };
  }

  /**
   * GET /api/form/profile
   *
   * @RequestAttribute('currentUser') 读取由 Auth 中间件注入到 req 的用户对象，
   * 对应 Spring Boot @RequestAttribute 的典型用法（HandlerInterceptor 预处理后注入）。
   *
   * curl http://localhost:3003/api/form/profile
   * （server.ts 中的 Auth 中间件已将 req.currentUser 设为 { id: 1, name: 'Alice', role: 'admin' }）
   */
  @GetMapping('/profile')
  profile(
    @RequestAttribute('currentUser') user: CurrentUser,
  ): object {
    if (!user) {
      throw new Error('currentUser not set — Auth middleware may not be running');
    }
    return {
      user,
      message: '✅ currentUser injected via @RequestAttribute (set by Auth middleware)',
    };
  }

  /**
   * GET /api/form/tenant-info
   *
   * 演示从 req 读取另一个自定义属性 req.tenantId（多租户场景）。
   *
   * curl http://localhost:3003/api/form/tenant-info
   */
  @GetMapping('/tenant-info')
  tenantInfo(
    @RequestAttribute('tenantId') tenantId: string,
    @RequestAttribute('currentUser') user: CurrentUser,
  ): object {
    return {
      tenantId: tenantId ?? '(not set)',
      user: user ?? null,
      message: '✅ Multiple @RequestAttribute on same method — each reads a different req property',
    };
  }
}
