---
created: 2025-11-17
tags: [learning, event-driven, saga, kafka, messaging, distributed-systems]
status: 進行中
topic: Event-Driven Architecture
source: https://github.com/eventuate-tram/eventuate-tram-core
---

# イベント駆動アーキテクチャ

## 概要

イベント駆動アーキテクチャ（EDA）は、イベントの生成、検出、消費を中心に設計されたパターン。サービス間の疎結合を実現し、スケーラブルで応答性の高いシステムを構築できる。

## 学んだこと

### 🎯 イベント駆動とは

**従来の同期通信 vs イベント駆動:**

```
同期通信（Request-Response）:
Client → Service A → Service B → Service C
         ↓            ↓            ↓
      (待機)       (待機)       (処理)
         ↓            ↓            ↓
Client ← Service A ← Service B ← Service C
         (全完了まで待つ、1つ失敗で全体失敗)

イベント駆動（非同期）:
Client → Service A → [Event Bus] → (即座に応答)
                          ↓
                    Service B (後で処理)
                          ↓
                    Service C (後で処理)
         (疎結合、障害に強い)
```

**特徴:**

| 特性             | 同期通信     | イベント駆動   |
| ---------------- | ------------ | -------------- |
| 結合度           | 高い         | 低い           |
| 応答時間         | 全処理完了後 | 即座に応答可能 |
| 障害伝播         | 連鎖的       | 局所的         |
| スケーラビリティ | 困難         | 容易           |
| デバッグ         | 簡単         | 複雑           |
| 一貫性           | 強い一貫性   | 結果整合性     |

---

### 📨 イベントの種類

#### 1. ドメインイベント

**ビジネスドメインで起きた重要な出来事。**

```typescript
// 何かが起きた事実を表す（過去形）
interface OrderPlaced {
  type: "OrderPlaced";
  orderId: string;
  customerId: string;
  items: OrderItem[];
  totalAmount: number;
  occurredAt: Date;
}

interface PaymentReceived {
  type: "PaymentReceived";
  paymentId: string;
  orderId: string;
  amount: number;
  method: "credit_card" | "bank_transfer";
  occurredAt: Date;
}

interface OrderShipped {
  type: "OrderShipped";
  orderId: string;
  trackingNumber: string;
  carrier: string;
  estimatedDelivery: Date;
  occurredAt: Date;
}
```

#### 2. 統合イベント

**サービス間で共有されるイベント。**

```typescript
// 公開されたコントラクト（他サービスが依存）
interface ProductPriceChanged {
  type: "ProductPriceChanged";
  productId: string;
  oldPrice: number;
  newPrice: number;
  effectiveDate: Date;
}

// 他サービスがこのイベントを購読
// - カタログサービス: 価格表示を更新
// - カートサービス: カート内の価格を再計算
// - 推薦サービス: 推薦アルゴリズムを調整
```

#### 3. イベント通知

**軽量な通知（詳細は別途取得）。**

```typescript
interface CustomerUpdated {
  type: "CustomerUpdated";
  customerId: string;
  occurredAt: Date;
  // 詳細データは含まない
  // 必要なサービスはAPIで取得
}
```

---

### 🔄 メッセージングパターン

#### Publish/Subscribe（Pub/Sub）

**1 つのイベントを複数のサブスクライバーに配信。**

```typescript
// イベントバス
class EventBus {
  private subscribers: Map<string, EventHandler[]> = new Map();

  subscribe(eventType: string, handler: EventHandler): void {
    if (!this.subscribers.has(eventType)) {
      this.subscribers.set(eventType, []);
    }
    this.subscribers.get(eventType)!.push(handler);
  }

  async publish(event: DomainEvent): Promise<void> {
    const handlers = this.subscribers.get(event.type) || [];

    // すべてのサブスクライバーに配信
    await Promise.all(
      handlers.map(handler => handler.handle(event))
    );
  }
}

// 使用例
const eventBus = new EventBus();

// 注文サービス
eventBus.subscribe('OrderPlaced', {
  handle: async (event: OrderPlaced) => {
    await inventoryService.reserveItems(event.items);
  }
});

// 通知サービス
eventBus.subscribe('OrderPlaced', {
  handle: async (event: OrderPlaced) => {
    await emailService.sendConfirmation(event.customerId, event.orderId);
  }
});

// 分析サービス
eventBus.subscribe('OrderPlaced', {
  handle: async (event: OrderPlaced) => {
    await analyticsService.trackOrder(event);
  }
});

// イベント発行
await eventBus.publish({
  type: 'OrderPlaced',
  orderId: 'order-123',
  customerId: 'customer-456',
  items: [...],
  totalAmount: 150,
  occurredAt: new Date()
});
```

#### Message Queue

**1 つのメッセージを 1 つのコンシューマーが処理。**

```typescript
// タスクキュー
class TaskQueue {
  private queue: Message[] = [];
  private processing = false;

  async enqueue(message: Message): Promise<void> {
    this.queue.push(message);
    await this.persistToDisk(message);
  }

  async dequeue(): Promise<Message | null> {
    const message = this.queue.shift();
    if (message) {
      await this.markAsProcessing(message);
    }
    return message || null;
  }

  async acknowledge(messageId: string): Promise<void> {
    await this.removeFromDisk(messageId);
  }

  async reject(message: Message): Promise<void> {
    if (message.retryCount < 3) {
      message.retryCount++;
      await this.enqueue(message); // リトライ
    } else {
      await this.moveToDeadLetter(message); // 死者キュー
    }
  }
}

// ワーカー
class Worker {
  constructor(private queue: TaskQueue) {}

  async start(): Promise<void> {
    while (true) {
      const message = await this.queue.dequeue();
      if (!message) {
        await this.sleep(100);
        continue;
      }

      try {
        await this.processMessage(message);
        await this.queue.acknowledge(message.id);
      } catch (error) {
        await this.queue.reject(message);
      }
    }
  }

  private async processMessage(message: Message): Promise<void> {
    // メッセージ処理
  }
}
```

---

### 📊 Apache Kafka

**高スループットの分散ストリーミングプラットフォーム。**

```
プロデューサー → Kafka Cluster → コンシューマー

┌─────────────────────────────────────┐
│           Kafka Cluster             │
│  ┌─────────────────────────────┐   │
│  │     Topic: orders           │   │
│  │  ┌─────┐ ┌─────┐ ┌─────┐   │   │
│  │  │ P0  │ │ P1  │ │ P2  │   │   │
│  │  └─────┘ └─────┘ └─────┘   │   │
│  │  Partition0 Partition1 ...  │   │
│  └─────────────────────────────┘   │
└─────────────────────────────────────┘
         ↑                    ↓
    Producers            Consumers
    (Order Svc)      (Inventory, Email, ...)
```

**Node.js での実装:**

```typescript
import { Kafka, Producer, Consumer } from "kafkajs";

// Kafka クライアント
const kafka = new Kafka({
  clientId: "order-service",
  brokers: ["kafka-1:9092", "kafka-2:9092", "kafka-3:9092"],
});

// プロデューサー
class OrderEventProducer {
  private producer: Producer;

  constructor() {
    this.producer = kafka.producer();
  }

  async connect(): Promise<void> {
    await this.producer.connect();
  }

  async publishOrderPlaced(order: Order): Promise<void> {
    const event = {
      type: "OrderPlaced",
      orderId: order.id,
      customerId: order.customerId,
      items: order.items,
      totalAmount: order.totalAmount,
      occurredAt: new Date().toISOString(),
    };

    await this.producer.send({
      topic: "order-events",
      messages: [
        {
          key: order.id, // パーティショニングキー
          value: JSON.stringify(event),
          headers: {
            "event-type": "OrderPlaced",
            "correlation-id": order.correlationId,
          },
        },
      ],
    });
  }
}

// コンシューマー
class InventoryEventConsumer {
  private consumer: Consumer;

  constructor() {
    this.consumer = kafka.consumer({
      groupId: "inventory-service",
    });
  }

  async start(): Promise<void> {
    await this.consumer.connect();
    await this.consumer.subscribe({
      topic: "order-events",
      fromBeginning: false,
    });

    await this.consumer.run({
      eachMessage: async ({ topic, partition, message }) => {
        const event = JSON.parse(message.value!.toString());

        switch (event.type) {
          case "OrderPlaced":
            await this.handleOrderPlaced(event);
            break;
          case "OrderCancelled":
            await this.handleOrderCancelled(event);
            break;
        }
      },
    });
  }

  private async handleOrderPlaced(event: OrderPlacedEvent): Promise<void> {
    // 在庫を予約
    for (const item of event.items) {
      await inventoryService.reserve(item.productId, item.quantity);
    }
  }
}

// 使用
const producer = new OrderEventProducer();
await producer.connect();

const order = await orderService.createOrder(orderData);
await producer.publishOrderPlaced(order);
```

**Kafka の特徴:**

| 特性             | 説明                           |
| ---------------- | ------------------------------ |
| 高スループット   | 数百万メッセージ/秒            |
| 永続性           | ディスクに保存、再読み取り可能 |
| 順序保証         | パーティション内は順序保証     |
| スケーラビリティ | パーティション追加で水平拡張   |
| 耐障害性         | レプリケーションで冗長化       |

---

### 🔄 SAGA パターン

**分散トランザクションを管理。**

```
従来のトランザクション（2PC）:
┌─────────────────────────────────┐
│      Transaction Coordinator     │
│           ↓       ↓       ↓     │
│        Service A  B  C          │
│        (全て成功 or 全てロールバック) │
└─────────────────────────────────┘
問題: 単一障害点、パフォーマンス低下

SAGA（補償トランザクション）:
Step 1: Service A (成功)
Step 2: Service B (成功)
Step 3: Service C (失敗)
→ Compensate B (補償)
→ Compensate A (補償)
```

#### Choreography-based SAGA

**各サービスが自律的にイベントに反応。**

```typescript
// Order Service
class OrderService {
  async createOrder(data: OrderData): Promise<Order> {
    const order = new Order(data);
    order.status = "PENDING";
    await this.orderRepo.save(order);

    // イベント発行
    await this.eventBus.publish({
      type: "OrderCreated",
      orderId: order.id,
      customerId: data.customerId,
      items: data.items,
      totalAmount: data.totalAmount,
    });

    return order;
  }

  @Subscribe("PaymentCompleted")
  async onPaymentCompleted(event: PaymentCompletedEvent): Promise<void> {
    const order = await this.orderRepo.findById(event.orderId);
    order.status = "CONFIRMED";
    await this.orderRepo.save(order);

    await this.eventBus.publish({
      type: "OrderConfirmed",
      orderId: order.id,
    });
  }

  @Subscribe("PaymentFailed")
  async onPaymentFailed(event: PaymentFailedEvent): Promise<void> {
    const order = await this.orderRepo.findById(event.orderId);
    order.status = "CANCELLED";
    await this.orderRepo.save(order);

    await this.eventBus.publish({
      type: "OrderCancelled",
      orderId: order.id,
      reason: event.reason,
    });
  }
}

// Payment Service
class PaymentService {
  @Subscribe("OrderCreated")
  async onOrderCreated(event: OrderCreatedEvent): Promise<void> {
    try {
      const payment = await this.processPayment(
        event.customerId,
        event.totalAmount
      );

      await this.eventBus.publish({
        type: "PaymentCompleted",
        paymentId: payment.id,
        orderId: event.orderId,
      });
    } catch (error) {
      await this.eventBus.publish({
        type: "PaymentFailed",
        orderId: event.orderId,
        reason: error.message,
      });
    }
  }

  @Subscribe("OrderCancelled")
  async onOrderCancelled(event: OrderCancelledEvent): Promise<void> {
    // 補償: 返金処理
    await this.refundPayment(event.orderId);
  }
}

// Inventory Service
class InventoryService {
  @Subscribe("OrderConfirmed")
  async onOrderConfirmed(event: OrderConfirmedEvent): Promise<void> {
    try {
      await this.reserveItems(event.orderId);

      await this.eventBus.publish({
        type: "InventoryReserved",
        orderId: event.orderId,
      });
    } catch (error) {
      await this.eventBus.publish({
        type: "InventoryReservationFailed",
        orderId: event.orderId,
        reason: error.message,
      });
    }
  }

  @Subscribe("OrderCancelled")
  async onOrderCancelled(event: OrderCancelledEvent): Promise<void> {
    // 補償: 在庫を戻す
    await this.releaseItems(event.orderId);
  }
}
```

#### Orchestration-based SAGA

**中央のオーケストレーターが制御。**

```typescript
// SAGA オーケストレーター
interface SagaStep {
  name: string;
  action: (context: SagaContext) => Promise<void>;
  compensate: (context: SagaContext) => Promise<void>;
}

class CreateOrderSaga {
  private steps: SagaStep[] = [
    {
      name: "createOrder",
      action: this.createOrder.bind(this),
      compensate: this.cancelOrder.bind(this),
    },
    {
      name: "reserveInventory",
      action: this.reserveInventory.bind(this),
      compensate: this.releaseInventory.bind(this),
    },
    {
      name: "processPayment",
      action: this.processPayment.bind(this),
      compensate: this.refundPayment.bind(this),
    },
    {
      name: "confirmOrder",
      action: this.confirmOrder.bind(this),
      compensate: async () => {}, // 最後のステップは補償不要
    },
  ];

  async execute(orderData: OrderData): Promise<SagaResult> {
    const context: SagaContext = {
      orderData,
      orderId: null,
      paymentId: null,
      reservationId: null,
    };

    const executedSteps: SagaStep[] = [];

    for (const step of this.steps) {
      try {
        console.log(`Executing step: ${step.name}`);
        await step.action(context);
        executedSteps.push(step);
      } catch (error) {
        console.error(`Step ${step.name} failed:`, error);

        // 逆順で補償を実行
        for (const executedStep of executedSteps.reverse()) {
          console.log(`Compensating step: ${executedStep.name}`);
          await executedStep.compensate(context);
        }

        return {
          success: false,
          failedStep: step.name,
          error: error.message,
        };
      }
    }

    return {
      success: true,
      orderId: context.orderId,
    };
  }

  private async createOrder(context: SagaContext): Promise<void> {
    const order = await this.orderService.create(context.orderData);
    context.orderId = order.id;
  }

  private async cancelOrder(context: SagaContext): Promise<void> {
    await this.orderService.cancel(context.orderId);
  }

  private async reserveInventory(context: SagaContext): Promise<void> {
    const reservation = await this.inventoryService.reserve(
      context.orderData.items
    );
    context.reservationId = reservation.id;
  }

  private async releaseInventory(context: SagaContext): Promise<void> {
    await this.inventoryService.release(context.reservationId);
  }

  private async processPayment(context: SagaContext): Promise<void> {
    const payment = await this.paymentService.charge(
      context.orderData.customerId,
      context.orderData.totalAmount
    );
    context.paymentId = payment.id;
  }

  private async refundPayment(context: SagaContext): Promise<void> {
    await this.paymentService.refund(context.paymentId);
  }

  private async confirmOrder(context: SagaContext): Promise<void> {
    await this.orderService.confirm(context.orderId);
  }
}

// 使用
const saga = new CreateOrderSaga(
  orderService,
  inventoryService,
  paymentService
);
const result = await saga.execute(orderData);

if (result.success) {
  console.log("Order created successfully:", result.orderId);
} else {
  console.log("Order creation failed at:", result.failedStep);
}
```

**Choreography vs Orchestration:**

| 特性       | Choreography     | Orchestration            |
| ---------- | ---------------- | ------------------------ |
| 結合度     | 低い             | 中程度                   |
| 可視性     | 低い（分散）     | 高い（中央）             |
| 単一障害点 | なし             | オーケストレーター       |
| 複雑性     | サービス数に比例 | オーケストレーターに集中 |
| デバッグ   | 困難             | 比較的容易               |

---

### 🔁 Outbox パターン

**データベースとメッセージ送信の整合性を保証。**

```
問題:
1. データベースに保存 ✓
2. イベント送信 ✗ (失敗)
→ 不整合が発生

解決策（Outbox パターン）:
1. データベースに保存 + Outbox テーブルに保存（同一トランザクション）
2. 別プロセスが Outbox を監視してイベント送信
```

```typescript
// Outbox テーブルの構造
interface OutboxMessage {
  id: string;
  aggregateType: string;
  aggregateId: string;
  eventType: string;
  payload: string;
  createdAt: Date;
  processedAt: Date | null;
}

// 注文作成（同一トランザクション）
class OrderService {
  async createOrder(data: OrderData): Promise<Order> {
    return await this.db.transaction(async (tx) => {
      // 1. 注文を保存
      const order = new Order(data);
      await tx.orders.insert(order);

      // 2. Outbox にイベントを保存（同一トランザクション）
      const outboxMessage: OutboxMessage = {
        id: generateId(),
        aggregateType: "Order",
        aggregateId: order.id,
        eventType: "OrderCreated",
        payload: JSON.stringify({
          orderId: order.id,
          customerId: data.customerId,
          items: data.items,
          totalAmount: data.totalAmount,
        }),
        createdAt: new Date(),
        processedAt: null,
      };
      await tx.outbox.insert(outboxMessage);

      return order;
    });
  }
}

// Outbox リレー（別プロセス）
class OutboxRelay {
  async start(): Promise<void> {
    while (true) {
      const messages = await this.db.outbox.findUnprocessed({ limit: 100 });

      for (const message of messages) {
        try {
          // イベントを送信
          await this.eventBus.publish({
            type: message.eventType,
            ...JSON.parse(message.payload),
          });

          // 処理済みにマーク
          await this.db.outbox.markProcessed(message.id);
        } catch (error) {
          console.error("Failed to publish message:", message.id, error);
          // リトライは次回のループで
        }
      }

      await this.sleep(1000); // ポーリング間隔
    }
  }
}

// CDC（Change Data Capture）を使う方法
// Debezium などのツールが Outbox テーブルの変更を監視
// より効率的で、ポーリング不要
```

---

### 🏗️ イベントストリーミングプラットフォーム

#### RabbitMQ

```typescript
import amqp from "amqplib";

class RabbitMQEventBus {
  private connection: amqp.Connection;
  private channel: amqp.Channel;

  async connect(): Promise<void> {
    this.connection = await amqp.connect("amqp://localhost");
    this.channel = await this.connection.createChannel();
  }

  async publish(
    exchange: string,
    routingKey: string,
    event: any
  ): Promise<void> {
    await this.channel.assertExchange(exchange, "topic", { durable: true });

    this.channel.publish(
      exchange,
      routingKey,
      Buffer.from(JSON.stringify(event)),
      {
        persistent: true,
        contentType: "application/json",
      }
    );
  }

  async subscribe(
    exchange: string,
    routingKey: string,
    handler: (event: any) => Promise<void>
  ): Promise<void> {
    await this.channel.assertExchange(exchange, "topic", { durable: true });

    const queue = await this.channel.assertQueue("", { exclusive: true });
    await this.channel.bindQueue(queue.queue, exchange, routingKey);

    this.channel.consume(queue.queue, async (msg) => {
      if (msg) {
        const event = JSON.parse(msg.content.toString());
        try {
          await handler(event);
          this.channel.ack(msg);
        } catch (error) {
          this.channel.nack(msg, false, true); // リキュー
        }
      }
    });
  }
}
```

#### Amazon EventBridge

```typescript
import {
  EventBridgeClient,
  PutEventsCommand,
} from "@aws-sdk/client-eventbridge";

class EventBridgePublisher {
  private client: EventBridgeClient;

  constructor() {
    this.client = new EventBridgeClient({ region: "ap-northeast-1" });
  }

  async publish(event: DomainEvent): Promise<void> {
    const command = new PutEventsCommand({
      Entries: [
        {
          Source: "com.myapp.orders",
          DetailType: event.type,
          Detail: JSON.stringify(event),
          EventBusName: "default",
        },
      ],
    });

    await this.client.send(command);
  }
}

// Lambda でイベント処理
export const handler = async (event: any) => {
  const detail = event.detail;

  switch (event["detail-type"]) {
    case "OrderPlaced":
      await processOrderPlaced(detail);
      break;
    case "PaymentReceived":
      await processPaymentReceived(detail);
      break;
  }
};
```

---

### 📈 モニタリングと可観測性

**分散トレーシング:**

```typescript
import { trace, context, SpanStatusCode } from "@opentelemetry/api";

class EventHandler {
  private tracer = trace.getTracer("event-handler");

  async handleEvent(event: DomainEvent): Promise<void> {
    // 親スパンからコンテキストを復元
    const parentContext = this.extractContext(event.headers);

    const span = this.tracer.startSpan(
      `handle ${event.type}`,
      undefined,
      parentContext
    );

    try {
      context.with(trace.setSpan(context.active(), span), async () => {
        await this.processEvent(event);
      });

      span.setStatus({ code: SpanStatusCode.OK });
    } catch (error) {
      span.setStatus({
        code: SpanStatusCode.ERROR,
        message: error.message,
      });
      span.recordException(error);
      throw error;
    } finally {
      span.end();
    }
  }
}

// メトリクス
import { Counter, Histogram } from "prom-client";

const eventProcessedCounter = new Counter({
  name: "events_processed_total",
  help: "Total number of events processed",
  labelNames: ["event_type", "status"],
});

const eventProcessingDuration = new Histogram({
  name: "event_processing_duration_seconds",
  help: "Event processing duration in seconds",
  labelNames: ["event_type"],
  buckets: [0.01, 0.05, 0.1, 0.5, 1, 5],
});
```

**Dead Letter Queue:**

```typescript
class DeadLetterHandler {
  async moveToDeadLetter(message: Message, error: Error): Promise<void> {
    const deadLetter = {
      originalMessage: message,
      error: {
        message: error.message,
        stack: error.stack,
      },
      failedAt: new Date(),
      retryCount: message.retryCount,
    };

    await this.deadLetterQueue.push(deadLetter);
    await this.alertService.notify("Message moved to DLQ", deadLetter);
  }

  async reprocessDeadLetters(): Promise<void> {
    const deadLetters = await this.deadLetterQueue.getAll();

    for (const dl of deadLetters) {
      try {
        await this.eventProcessor.process(dl.originalMessage);
        await this.deadLetterQueue.remove(dl.id);
      } catch (error) {
        console.error("Failed to reprocess:", dl.id);
      }
    }
  }
}
```

---

### 🛡️ 回復性パターン

**べき等性（Idempotency）:**

```typescript
class IdempotentEventHandler {
  private processedEvents: Set<string> = new Set();

  async handle(event: DomainEvent): Promise<void> {
    // 重複チェック
    if (await this.isAlreadyProcessed(event.id)) {
      console.log("Event already processed, skipping:", event.id);
      return;
    }

    try {
      await this.processEvent(event);
      await this.markAsProcessed(event.id);
    } catch (error) {
      // 失敗してもマークしない（リトライ可能）
      throw error;
    }
  }

  private async isAlreadyProcessed(eventId: string): Promise<boolean> {
    // データベースでチェック
    const exists = await this.db.processedEvents.findOne({ eventId });
    return !!exists;
  }

  private async markAsProcessed(eventId: string): Promise<void> {
    await this.db.processedEvents.insert({
      eventId,
      processedAt: new Date(),
    });
  }
}

// べき等なビジネスロジック
class PaymentService {
  async processPayment(orderId: string, amount: number): Promise<Payment> {
    // 既存の支払いをチェック
    const existing = await this.db.payments.findOne({ orderId });
    if (existing) {
      return existing; // べき等: 同じ結果を返す
    }

    // 新規支払い処理
    const payment = await this.createPayment(orderId, amount);
    return payment;
  }
}
```

**サーキットブレーカー:**

```typescript
class EventConsumerWithCircuitBreaker {
  private circuitBreaker = new CircuitBreaker({
    failureThreshold: 5,
    successThreshold: 3,
    timeout: 30000,
  });

  async processEvent(event: DomainEvent): Promise<void> {
    await this.circuitBreaker.execute(async () => {
      await this.handler.handle(event);
    });
  }
}
```

---

## 🎓 学習リソース

### 主要リポジトリ

1. **[eventuate-tram-core](https://github.com/eventuate-tram/eventuate-tram-core)**

   - トランザクショナルメッセージング
   - SAGA パターン
   - Outbox パターン

2. **[axon-quick-start](https://github.com/AxonIQ/axon-quick-start)**

   - CQRS + イベントソーシング
   - Java/Kotlin
   - 完全なフレームワーク

3. **[kafka-streams-examples](https://github.com/confluentinc/kafka-streams-examples)**
   - Kafka Streams
   - ストリーム処理パターン

### 推奨書籍

- **Designing Event-Driven Systems** - Ben Stopford
- **Building Event-Driven Microservices** - Adam Bellemare
- **Enterprise Integration Patterns** - Gregor Hohpe

### オンラインリソース

- [Microservices.io Patterns](https://microservices.io/patterns/)
- [Confluent Developer](https://developer.confluent.io/)
- [AWS Event-Driven Architecture](https://aws.amazon.com/event-driven-architecture/)

---

## 次のステップ

1. **実践**

   - Kafka をローカルで動かす
   - SAGA パターンを実装
   - Outbox パターンを試す

2. **深い学習**

   - イベントストーミング
   - CQRS との組み合わせ
   - 分散システムの障害パターン

3. **本番運用**
   - モニタリング設定
   - Dead Letter Queue の管理
   - スキーマの進化（Schema Registry）

---

最終更新: 2025 年 11 月
