# @ai-first/mq

Spring Boot 风格的 MQ 组件：使用方式与 Spring Boot 一致，**通过配置切换不同 MQ（rabbit / memory），业务代码无需修改**。

## 安装

```bash
pnpm add @ai-first/mq
# 使用 RabbitMQ 时
pnpm add amqplib
```

## 使用方式（与 Spring Boot 一致）

### 1. 配置驱动，切换 MQ 不改业务代码

用一份配置决定用 Rabbit 还是内存，业务只依赖 `MqTemplate` 和 `@MqListener`：

```ts
import { createMqFromConfig, MqTemplate, MqListener, registerMqListeners } from '@ai-first/mq';
import type { Message } from '@ai-first/mq';

// 配置：改 type 即可切换，无需改下面业务
const mqConfig = {
  type: 'memory' as const,  // 开发用 memory；生产改为 'rabbit' 并配 rabbit
  rabbit: process.env.AMQP_URL
    ? { url: process.env.AMQP_URL, assert: { queues: [{ name: 'order.created' }] } }
    : undefined,
  defaultQueue: 'order.created',
};

const { client, mqTemplate } = await createMqFromConfig(mqConfig);

// 业务：发消息（与 Spring RabbitTemplate 一致）
await mqTemplate.convertAndSend('order.created', { orderId: '001', amount: 99 });
await mqTemplate.convertAndSendToDestination('my.exchange', 'order.routing', { orderId: '002' });
```

### 1.1 与 @ai-first/di 集成（推荐）

提供 Spring Boot 风格的“自动配置 + 注册 Bean + 注册 Listener”的一站式入口（无需手写 `Container.registerInstance`）：

```ts
import { initMqAndRegister } from '@ai-first/mq/di';
import { MqListener } from '@ai-first/mq';
import type { Message } from '@ai-first/mq';

class OrderListener {
  @MqListener({ queues: ['order.created'] })
  onOrderCreated(message: Message<{ orderId: string }>) {
    console.log(message.getBody().orderId);
  }
}

const { mqTemplate, shutdown } = await initMqAndRegister(
  {
    type: process.env.MQ_TYPE === 'rabbit' ? 'rabbit' : 'memory',
    rabbit: process.env.AMQP_URL ? { url: process.env.AMQP_URL } : undefined,
  },
  { listeners: [OrderListener] }
);

await mqTemplate.convertAndSend('order.created', { orderId: '001' });

// 关闭应用时
await shutdown();
```

### 2. 消费者：@MqListener（与 Spring @RabbitListener 一致）

```ts
import { MqListener } from '@ai-first/mq';
import type { Message, ConsumeContext } from '@ai-first/mq';

class OrderListener {
  @MqListener({ queues: ['order.created'] })
  onOrderCreated(message: Message<{ orderId: string; amount: number }>) {
    const body = message.getBody();
    console.log('Received', body.orderId, body.amount);
    // 单参数时框架自动 ack
  }

  @MqListener({ queues: ['order.needAck'] })
  async onOrderNeedAck(message: Message<unknown>, ctx: ConsumeContext) {
    // 两参数时需手动 ack/nack
    try {
      await doSomething(message.getBody());
      ctx.ack();
    } catch (e) {
      ctx.nack(true);
    }
  }
}

// 启动时注册（一次即可，底层用当前配置的 client）
await registerMqListeners(client, [
  { constructor: OrderListener, instance: new OrderListener() },
]);
```

### 3. 注入 MqTemplate（如配合 @ai-first/di）

业务只依赖 `MqTemplate`，具体是 Rabbit 还是 Memory 由配置决定：

```ts
import { Container } from '@ai-first/di';
import { createMqFromConfig } from '@ai-first/mq';
import type { MqTemplate } from '@ai-first/mq';

const { client, mqTemplate } = await createMqFromConfig({
  type: process.env.MQ_TYPE === 'rabbit' ? 'rabbit' : 'memory',
  rabbit: { url: process.env.AMQP_URL! },
});
Container.registerInstance<MqTemplate>('MqTemplate', mqTemplate);
```

## 配置说明

| 字段 | 说明 |
|------|------|
| `type` | `'rabbit'` \| `'memory'`，切换实现 |
| `rabbit` | type=rabbit 时必填，同 Spring 的 connection 配置（url、assert 等） |
| `memory` | type=memory 时无需内容 |
| `defaultQueue` | 可选，Template 默认队列 |

**仅改配置即可切换 MQ，业务里只用 `MqTemplate` + `@MqListener`，无需改代码。**

## API 与 Spring Boot 对应

| 本库 | Spring Boot 对应 |
|------|------------------|
| `MqTemplate#convertAndSend(routingKey, object)` | `RabbitTemplate.convertAndSend(routingKey, object)` |
| `MqTemplate#convertAndSendToDestination(exchange, routingKey, object)` | `RabbitTemplate.convertAndSend(exchange, routingKey, object)` |
| `MqTemplate#send(routingKey, message)` | `RabbitTemplate.send(routingKey, message)` |
| `@MqListener({ queues: ['q1'] })` | `@RabbitListener(queues = "q1")` |
| `Message#getBody()` / `getMessageProperties()` | `org.springframework.messaging.Message` |
| `createMqFromConfig(config)` | 类似 Spring Boot 根据 `spring.rabbitmq` 等自动配置 |

## 类型

- **Message&lt;T&gt;**：`getBody()`、`getMessageProperties()`，对应 Spring Message。
- **MessageProperties**：headers、timestamp、correlationId、replyTo 等。
- **createMessage(body, properties?)**：构造 Message。

---

## MQ 模块能力总结与 Spring 体系对标

### 一、当前具备的能力

| 能力 | 说明 | 入口/API |
|------|------|----------|
| **统一抽象** | 所有实现共用的契约，配置切换无感 | `IMQClient` / `IMQProducer` / `IMQConsumer`、`ConsumeContext`(ack/nack)、`Message`/`MessageProperties` |
| **配置驱动** | 改 `type` 即换实现，业务代码不变 | `MqConfig`（`type: 'rabbit' \| 'memory'`）、`createMqFromConfig(config)` |
| **发送模板** | 与 Spring RabbitTemplate 一致的发送 API | `MqTemplate`：`convertAndSend`、`convertAndSendToDestination`、`send`、`setDefaultQueue`/`setDefaultExchange` |
| **消费注解** | 方法上标队列，自动订阅、自动 ack/异常 nack | `@MqListener({ queues: [...] })`、单参自动 ack、双参 `(msg, ctx)` 手动 ack/nack |
| **Listener 注册** | 把带 @MqListener 的类注册到当前 client | `registerMqListeners(client, beans)`、`getMqListenerMetadata`、`getRegisteredMqListenerClasses()` |
| **全局工厂与生命周期** | 单例式创建/获取/关闭，对齐 ORM 风格 | `createMq(config)`、`getMqClient()`/`getMqTemplate()`/`getMqConfig()`、`closeMq()`、`isMqInitialized()` |
| **DI 集成** | 自动注册 Bean + 可选自动收集 Listener + 发送侧注解 | `initMqAndRegister(config, options)`、`@MqProducer()`（`@ai-first/mq/di`）、`MQ_CLIENT_TOKEN`/`MQ_TEMPLATE_TOKEN` |
| **多实现** | 生产用 Rabbit、开发/测试用内存，同一套 API | `MemoryMQClient`、`createRabbitMQClient`，由 config 选择 |

### 二、与 Spring 体系对标

| 本库（@ai-first/mq） | Spring 体系对应 | 说明 |
|----------------------|-----------------|------|
| `MqTemplate` | `org.springframework.amqp.rabbit.core.RabbitTemplate` | 发送入口；convertAndSend / send 语义一致 |
| `MqTemplate.convertAndSend(routingKey, object)` | `RabbitTemplate.convertAndSend(routingKey, object)` | 默认 exchange，routingKey 即队列名 |
| `MqTemplate.convertAndSendToDestination(exchange, routingKey, object)` | `RabbitTemplate.convertAndSend(exchange, routingKey, object)` | 指定 exchange + routingKey |
| `MqTemplate.send(routingKey, message)` | `RabbitTemplate.send(routingKey, message)` | 发送已构建的 Message |
| `Message` / `getBody()` / `getMessageProperties()` | `org.springframework.messaging.Message` | 统一消息抽象，便于 TS→Java 生成 |
| `createMessage(body, properties?)` | `MessageBuilder` / `MessageBuilder.withPayload(...).build()` | 构造 Message |
| `@MqListener({ queues: ['q1'] })` | `@RabbitListener(queues = "q1")` | 方法级消费，队列声明方式一致 |
| 单参 handler → 框架自动 ack | `@RabbitListener` + 默认 AckMode | 单参视为“处理完即 ack” |
| 双参 `(message, ctx)` → 手动 ack/nack | `Channel` / `Acknowledgment` 等 | 两参时由业务调用 `ctx.ack()` / `ctx.nack(requeue)` |
| `createMqFromConfig(config)` / `createMq(config)` | Spring Boot `spring.rabbitmq.*` 自动配置 + `RabbitAutoConfiguration` | 配置驱动，按 type 创建连接/模板 |
| `getMqClient()` / `getMqTemplate()` / `closeMq()` | 单例 `ConnectionFactory` / `RabbitTemplate` + 应用关闭时销毁 | 全局单例、显式生命周期 |
| `initMqAndRegister(config, { listeners })` | Spring Boot 自动配置 + `@RabbitListener` 扫描注册 | 一站式：创建 + 注册 Bean + 注册监听器 |
| `@MqProducer()`（di 入口） | `@Service` + 注入 `RabbitTemplate` | 发送侧类标记为 Bean，可注入 Template |
| `type: 'rabbit' \| 'memory'` | `spring.rabbitmq` / 测试时 `@EmbeddedRabbit` 或内存实现 | 通过配置切换实现，业务无感 |

### 三、设计原则（与 Spring 一致）

- **配置驱动**：只改配置（如 `type`、`rabbit.url`），不改业务代码即可切换 MQ 或环境。
- **面向接口**：业务依赖 `MqTemplate` 和 `Message`/`ConsumeContext`，不依赖具体实现。
- **注解驱动**：消费用 `@MqListener`，发送侧用 `@MqProducer`（配合 DI），与 Spring 注解风格一致。
- **生命周期清晰**：提供 `createMq` / `closeMq` / `isMqInitialized`，便于应用启动/关闭与测试隔离。

---

## License

MIT
