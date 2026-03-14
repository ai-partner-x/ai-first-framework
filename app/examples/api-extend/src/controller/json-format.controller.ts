/**
 * JsonFormatController - 演示 @JsonFormat 装饰器
 *
 * Spring Boot / Jackson 风格的 JSON 日期格式化：
 *   - @JsonFormat({ pattern, timezone }) — 将 Date 属性格式化为人类可读字符串
 *   - @JsonFormat({ shape: 'NUMBER' })   — 将 Date 属性序列化为 Unix 毫秒时间戳
 *   - 格式化由 applyJsonFormat() 在 res.json() 之前自动执行，控制器无需手动转换
 *
 * ┌────────────────────────────────────────────────────────────────────┐
 * │  GET  /api/json-format/user/:id    返回单个 UserProfileDto          │
 * │  GET  /api/json-format/users       返回 UserProfileDto 数组         │
 * │  GET  /api/json-format/compare     同一时刻不同时区 / shape 对比    │
 * └────────────────────────────────────────────────────────────────────┘
 */
import 'reflect-metadata';
import {
  RestController,
  GetMapping,
  PathVariable,
  JsonFormat,
} from '@ai-partner-x/aiko-boot-starter-web';

// ──────────────────────────────────────────────────────────────────────
// DTO — 类实例上的 @JsonFormat 注解会被 applyJsonFormat() 递归识别并格式化
// ──────────────────────────────────────────────────────────────────────

/**
 * 用户档案 DTO，演示三种 @JsonFormat 用法：
 *   1. pattern + timezone  — 格式化为 GMT+8 日期时间字符串
 *   2. pattern only        — 仅日期（yyyy-MM-dd），使用进程本地时区
 *   3. shape: 'NUMBER'     — 序列化为 Unix 毫秒时间戳（数字类型）
 */
class UserProfileDto {
  id!: number;
  name!: string;
  email!: string;

  /** 创建时间 — GMT+8 时区，精确到秒 */
  @JsonFormat({ pattern: 'yyyy-MM-dd HH:mm:ss', timezone: 'GMT+8' })
  createTime?: Date;

  /** 生日 — 仅日期，无时区转换 */
  @JsonFormat({ pattern: 'yyyy-MM-dd' })
  birthday?: Date;

  /** 最后更新 — Unix 毫秒时间戳（数字） */
  @JsonFormat({ shape: 'NUMBER' })
  updatedAt?: Date;
}

// ──────────────────────────────────────────────────────────────────────
// Controller
// ──────────────────────────────────────────────────────────────────────

@RestController({ path: '/json-format' })
export class JsonFormatController {
  /**
   * GET /api/json-format/user/:id
   *
   * 返回单个 UserProfileDto。@JsonFormat 注解自动格式化所有 Date 字段：
   *   createTime → "2024-03-09 16:00:00"  (GMT+8)
   *   birthday   → "1995-06-20"
   *   updatedAt  → 1709971200000           (Unix ms)
   *
   * curl http://localhost:3003/api/json-format/user/1
   */
  @GetMapping('/user/:id')
  getUser(@PathVariable('id') id: string): UserProfileDto {
    const dto = new UserProfileDto();
    dto.id         = Number(id);
    dto.name       = 'Alice';
    dto.email      = 'alice@example.com';
    dto.createTime = new Date('2024-03-09T08:00:00.000Z');   // UTC 08:00 → Shanghai 16:00
    dto.birthday   = new Date('1995-06-20T00:00:00.000Z');
    dto.updatedAt  = new Date('2024-03-09T08:00:00.000Z');
    return dto;
  }

  /**
   * GET /api/json-format/users
   *
   * 返回 UserProfileDto 数组。applyJsonFormat() 递归处理数组每个元素，
   * 演示 @JsonFormat 对集合响应同样有效。
   *
   * curl http://localhost:3003/api/json-format/users
   */
  @GetMapping('/users')
  listUsers(): UserProfileDto[] {
    const make = (id: number, name: string, email: string, created: string, born: string): UserProfileDto => {
      const dto    = new UserProfileDto();
      dto.id       = id;
      dto.name     = name;
      dto.email    = email;
      dto.createTime = new Date(created);
      dto.birthday   = new Date(born);
      dto.updatedAt  = new Date(created);
      return dto;
    };

    return [
      make(1, 'Alice',   'alice@example.com',   '2024-01-15T00:30:00.000Z', '1995-06-20T00:00:00.000Z'),
      make(2, 'Bob',     'bob@example.com',     '2024-02-20T12:00:00.000Z', '1990-03-10T00:00:00.000Z'),
      make(3, 'Charlie', 'charlie@example.com', '2024-03-05T06:45:00.000Z', '1988-12-01T00:00:00.000Z'),
    ];
  }

  /**
   * GET /api/json-format/compare
   *
   * 用同一个 Date 值演示三种 @JsonFormat 配置的输出差异：
   *   - GMT+00:00 时区字符串
   *   - GMT+8 时区字符串
   *   - Unix 毫秒时间戳（NUMBER shape）
   *
   * curl http://localhost:3003/api/json-format/compare
   */
  @GetMapping('/compare')
  compare(): object {
    /**
     * 三个不同注解的内联 DTO，展示同一 Date 的不同序列化形式。
     */
    class CompareDto {
      label!: string;

      @JsonFormat({ pattern: 'yyyy-MM-dd HH:mm:ss', timezone: 'GMT+00:00' })
      utcTime?: Date;

      @JsonFormat({ pattern: 'yyyy-MM-dd HH:mm:ss', timezone: 'GMT+8' })
      shanghaiTime?: Date;

      @JsonFormat({ shape: 'NUMBER' })
      timestamp?: Date;
    }

    const now  = new Date('2024-03-09T08:00:00.000Z');
    const dto  = new CompareDto();
    dto.label       = 'Same instant, three @JsonFormat configurations';
    dto.utcTime     = now;
    dto.shanghaiTime = now;
    dto.timestamp   = now;

    return dto;
  }
}
