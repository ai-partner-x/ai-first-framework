# @ai-partner-x/aiko-boot-starter-mq

MQ 模块，Spring Boot 风格的消息队列。支持 RabbitMQ、Kafka、RocketMQ。

## 安装

```bash
pnpm add @ai-partner-x/aiko-boot-starter-mq
```

## 配置

通过环境变量配置（风格对齐 Spring Boot）：

| 变量 | 说明 | 默认 |
|-----|------|------|
| `MQ_TYPE` | `rabbitmq` \| `kafka` \| `rocketmq` \| `memory`| `rabbitmq` |
| `MQ_HOST` | 主机 | `localhost` |
| `MQ_PORT` | 端口 | `5672` |
| `MQ_USERNAME` / `MQ_PASSWORD` | 认证（生产环境必须显式设置，避免使用 guest/guest） | `guest` / `guest` |
| `MQ_VHOST` | RabbitMQ 虚拟主机 | `/` |
| `MQ_USE_TLS` | 是否使用 AMQPS（TLS） | `false` |
| `MQ_PREFETCH_COUNT` | RabbitMQ 预取数量，0 表示不限制 | `10` |
| `MQ_RECONNECT_INITIAL_DELAY_MS` | 连接断开后首次重连延迟 | `1000` |
| `MQ_RECONNECT_MAX_DELAY_MS` | 重连退避最大延迟 | `30000` |
| `MQ_CLIENT_ID` | Kafka 客户端 ID | `aiko-boot-mq` |
| `MQ_GROUP_ID` | Kafka/RocketMQ 消费者组 | `default-group` |
| `MQ_ENDPOINTS` | RocketMQ 代理端点（如 `127.0.0.1:8081`） | - |
| `MQ_NAMESPACE` | RocketMQ 命名空间 | `''` |

**Kafka**：默认端口 9092，设置 `MQ_PORT=9092` 或依赖 host 解析。  
**RocketMQ**：需 5.x + Proxy，默认端口 8081，可设置 `MQ_ENDPOINTS=host:8081`。  

**生产环境提醒**：使用默认凭证 `guest`/`guest` 时，启动会输出警告。请在生产环境显式设置 `MQ_USERNAME` 和 `MQ_PASSWORD`。

## 使用（文档格式）

### 1. 定义消费者（方法级 @MqListener）

```ts
import { MqListener, ConsumerContainer } from '@ai-partner-x/aiko-boot-starter-mq';

export interface UserCreatedEvent {
  userId: string;
  email: string;
  name: string;
}

export class UserCreatedListener {
  @MqListener({ topic: 'user.created', tag: 'add', group: 'user-group' })
  async onUserCreated(event: UserCreatedEvent) {
    console.log('User created:', event);
  }
}

ConsumerContainer.registerListener(UserCreatedListener);
```

### 2. 发送消息（MqSender 重载）

```ts
import { MqTemplate } from '@ai-partner-x/aiko-boot-starter-mq';

const template = new MqTemplate();

// send(topic, body)
await template.send('user.created', { userId: '123', email: 'u@e.com', name: 'John' });

// send(topic, tag, body)
await template.send('user.created', 'add', { userId: '123', email: 'u@e.com', name: 'John' });

// send(MqMessage)
await template.send({ topic: 'user.created', tag: 'add', body: { userId: '123', ... } });
```

### 3. 启动方式

**方式 A：使用 createApp（推荐）**

当项目使用 `createApp()` 时，MqAutoConfiguration 会自动发现并加载，无需手动初始化。

```ts
import { createApp } from '@ai-partner-x/aiko-boot/boot';
import { ConsumerContainer, MqTemplate } from '@ai-partner-x/aiko-boot-starter-mq';
import './listeners/UserCreatedListener'; // 注册消费者

const context = await createApp({ srcDir: __dirname });
// MQ 已在 ApplicationReady 时自动初始化
const template = new MqTemplate();
await template.send('user.created', payload);
```

**方式 B：手动初始化（如 Next.js、独立脚本）**

```ts
import { MqAutoConfiguration } from '@ai-partner-x/aiko-boot-starter-mq';
import './listeners/UserCreatedListener'; // 注册消费者

let initialized = false;

export async function initMq() {
  if (initialized) return;
  await MqAutoConfiguration.init();
  initialized = true;
}

if (typeof window === 'undefined' && !initialized) {
  initMq().catch(console.error);
}
```

## 目录结构（文档 1:1）

```
packages/mq/src/
├── core/             # MqException, MqErrorHandler, MqSerializer, MqMessage, MqSender
├── config/           # MqProperties, MqAutoConfiguration
├── decorators/       # @MqListener（方法级 topic/tag/group）
├── producer/         # MqTemplate
├── consumer/         # ConsumerContainer
├── adapters/         # RabbitMqAdapter, KafkaMqAdapter, RocketMqAdapter, InMemoryMqAdapter
├── logger.ts
└── index.ts
```
