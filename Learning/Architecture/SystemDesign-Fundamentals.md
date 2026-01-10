---
created: 2025-11-17
tags: [learning, system-design, scalability, distributed-systems, architecture]
status: 進行中
topic: System Design Fundamentals
source: https://github.com/donnemartin/system-design-primer
---

# システム設計の基礎

## 概要

システム設計とは、大規模なソフトウェアシステムを構築する際の高レベルな設計プロセス。スケーラビリティ、信頼性、保守性などの非機能要件を満たすための重要な設計判断を含む。

## 学んだこと

### 🎯 システム設計が重要な理由

**良い設計の効果:**

- **スケーラビリティ**: ユーザー数増加に対応
- **信頼性**: 障害に強い
- **パフォーマンス**: 高速な応答
- **保守性**: 変更が容易
- **コスト効率**: リソースの最適化

**実例（Twitter）:**

```
初期: 単一サーバー
↓
成長: 読み書き分離
↓
大規模: 分散システム + キャッシュ + CDN

教訓: 最初から完璧を目指さず、段階的に進化させる
```

---

### 📊 スケーラビリティの基本

#### 水平スケーリング vs 垂直スケーリング

```
垂直スケーリング (Scale Up)
┌─────────────────┐
│   より大きな     │
│   サーバー       │
│   CPU ↑         │
│   RAM ↑         │
│   Disk ↑        │
└─────────────────┘
メリット: シンプル
デメリット: 限界がある、単一障害点

水平スケーリング (Scale Out)
┌─────┐ ┌─────┐ ┌─────┐
│ Srv │ │ Srv │ │ Srv │
│  1  │ │  2  │ │  3  │
└─────┘ └─────┘ └─────┘
メリット: 理論上無限、耐障害性
デメリット: 複雑、データ整合性
```

**選択基準:**

| ケース         | 推奨               | 理由     |
| -------------- | ------------------ | -------- |
| 小規模サービス | 垂直               | シンプル |
| 急成長サービス | 水平               | 柔軟性   |
| データ集約型   | 水平               | 分散処理 |
| ステートレス   | 水平               | 容易     |
| ステートフル   | 垂直 or 慎重に水平 | 複雑性   |

---

### ⚖️ ロードバランシング

**ロードバランサーの役割:**

```
         クライアント
              │
              ▼
      ┌───────────────┐
      │ Load Balancer │
      └───────┬───────┘
         ┌────┼────┐
         ▼    ▼    ▼
      ┌───┐┌───┐┌───┐
      │S1 ││S2 ││S3 │
      └───┘└───┘└───┘
```

**アルゴリズム:**

```typescript
// Round Robin
class RoundRobinBalancer {
  private servers: Server[];
  private current = 0;

  getServer(): Server {
    const server = this.servers[this.current];
    this.current = (this.current + 1) % this.servers.length;
    return server;
  }
}

// Weighted Round Robin
class WeightedRoundRobinBalancer {
  private servers: Array<{ server: Server; weight: number }>;
  private weights: number[];
  private current = 0;
  private currentWeight = 0;

  getServer(): Server {
    while (true) {
      this.current = (this.current + 1) % this.servers.length;
      if (this.current === 0) {
        this.currentWeight--;
        if (this.currentWeight <= 0) {
          this.currentWeight = this.getMaxWeight();
        }
      }
      if (this.servers[this.current].weight >= this.currentWeight) {
        return this.servers[this.current].server;
      }
    }
  }
}

// Least Connections
class LeastConnectionsBalancer {
  private servers: Map<Server, number>;

  getServer(): Server {
    let minConnections = Infinity;
    let selectedServer: Server;

    for (const [server, connections] of this.servers) {
      if (connections < minConnections) {
        minConnections = connections;
        selectedServer = server;
      }
    }

    return selectedServer;
  }
}

// IP Hash (セッション維持に有用)
class IPHashBalancer {
  private servers: Server[];

  getServer(clientIP: string): Server {
    const hash = this.hashIP(clientIP);
    const index = hash % this.servers.length;
    return this.servers[index];
  }

  private hashIP(ip: string): number {
    let hash = 0;
    for (let i = 0; i < ip.length; i++) {
      hash = (hash << 5) - hash + ip.charCodeAt(i);
      hash |= 0;
    }
    return Math.abs(hash);
  }
}
```

**Layer 4 vs Layer 7:**

| 特性                   | Layer 4 (Transport) | Layer 7 (Application) |
| ---------------------- | ------------------- | --------------------- |
| 速度                   | 高速                | 低速                  |
| 機能                   | 基本的              | 高機能                |
| コンテンツ             | 見えない            | 見える                |
| SSL 終端               | できない            | できる                |
| パスベースルーティング | できない            | できる                |

---

### 🗄️ キャッシング戦略

**キャッシュの配置:**

```
クライアント → CDN → リバースプロキシ → アプリサーバー → DBキャッシュ → DB
     ↑         ↑           ↑                  ↑              ↑
   ブラウザ   エッジ      Nginx           Redis/Memcached  Query Cache
   キャッシュ  キャッシュ   キャッシュ        キャッシュ
```

**キャッシュ戦略:**

```typescript
// Cache-Aside (Lazy Loading)
async function getCacheAside(key: string): Promise<Data> {
  // 1. キャッシュを確認
  let data = await cache.get(key);

  if (!data) {
    // 2. キャッシュミス: DBから取得
    data = await db.query(key);
    // 3. キャッシュに保存
    await cache.set(key, data, TTL);
  }

  return data;
}

// Write-Through
async function writeThrough(key: string, value: Data): Promise<void> {
  // 1. DBに書き込み
  await db.write(key, value);
  // 2. キャッシュに書き込み（同期）
  await cache.set(key, value);
}

// Write-Behind (Write-Back)
async function writeBehind(key: string, value: Data): Promise<void> {
  // 1. キャッシュに書き込み
  await cache.set(key, value);
  // 2. 非同期でDBに書き込み（キューイング）
  await queue.enqueue({ key, value });
}

// Read-Through
class ReadThroughCache {
  async get(key: string): Promise<Data> {
    // キャッシュが自動的にDBから取得
    return await cache.getOrFetch(key, () => db.query(key));
  }
}
```

**キャッシュ無効化:**

```typescript
// Time-Based (TTL)
await cache.set(key, value, { ttl: 3600 }); // 1時間

// Event-Based
async function updateUser(userId: string, data: UserData) {
  await db.update(userId, data);
  await cache.delete(`user:${userId}`);
  await eventBus.publish("user.updated", { userId });
}

// Version-Based
interface CachedData {
  data: any;
  version: number;
}

async function getWithVersion(key: string): Promise<any> {
  const cached = await cache.get<CachedData>(key);
  const currentVersion = await db.getVersion(key);

  if (cached && cached.version === currentVersion) {
    return cached.data;
  }

  const data = await db.query(key);
  await cache.set(key, { data, version: currentVersion });
  return data;
}
```

**キャッシュの問題と解決:**

| 問題           | 説明                       | 解決策                           |
| -------------- | -------------------------- | -------------------------------- |
| Cache Stampede | 同時に多数のキャッシュミス | ロック、確率的早期更新           |
| Hot Key        | 特定のキーにアクセス集中   | レプリケーション、シャーディング |
| Cold Start     | 起動時にキャッシュが空     | ウォームアップ                   |
| Inconsistency  | DB とキャッシュの不整合    | 適切な無効化戦略                 |

---

### 🌐 CAP 定理

**3 つの特性（2 つしか保証できない）:**

```
           Consistency
              /\
             /  \
            /    \
           /      \
    CA ───/────────\─── CP
         /          \
        /            \
       /              \
      /______________\
  Availability    Partition Tolerance

CAP定理: 分散システムでは、ネットワーク分断時に
         一貫性と可用性の両方を保証できない
```

**各組み合わせの特徴:**

```typescript
// CP (Consistency + Partition Tolerance)
// 例: MongoDB, HBase, Redis (Cluster mode)
// 一貫性を優先、可用性を犠牲にする

async function cpSystem() {
  // ネットワーク分断時
  if (await isPartitioned()) {
    // 書き込みを拒否（一貫性維持）
    throw new Error("System unavailable during partition");
  }

  // 通常時
  await writeToAllReplicas(data); // 強い一貫性
}

// AP (Availability + Partition Tolerance)
// 例: Cassandra, DynamoDB, CouchDB
// 可用性を優先、一貫性を犠牲にする

async function apSystem() {
  // ネットワーク分断時でも書き込み可能
  await writeToLocalReplica(data);

  // 後で同期（結果整合性）
  await reconcileConflicts(); // 競合解決
}

// CA (Consistency + Availability)
// 例: 単一ノードのRDBMS (PostgreSQL, MySQL)
// 分散システムでは実質的に不可能

async function caSystem() {
  // 単一ノードなので分断がない
  await writeToSingleNode(data);
  // しかし、分散環境では使えない
}
```

**PACELC 定理（CAP の拡張）:**

```
PAC (Partition時):
  - Availability vs Consistency

ELC (通常時 - Else):
  - Latency vs Consistency

例:
- DynamoDB: PA/EL (可用性優先、低レイテンシ)
- MongoDB: PC/EC (一貫性優先)
- Cassandra: PA/EL (可用性優先、低レイテンシ)
```

---

### 🗃️ データベースの選択

**データベースの種類:**

| タイプ      | 例                    | 用途             | 特徴               |
| ----------- | --------------------- | ---------------- | ------------------ |
| RDBMS       | PostgreSQL, MySQL     | トランザクション | ACID、構造化データ |
| Document    | MongoDB               | 柔軟なスキーマ   | JSON、ネストデータ |
| Key-Value   | Redis, DynamoDB       | 高速読み書き     | シンプル、高速     |
| Wide-Column | Cassandra, HBase      | 大規模データ     | 水平スケーリング   |
| Graph       | Neo4j                 | 関係性分析       | 複雑なクエリ       |
| Time-Series | InfluxDB, TimescaleDB | 時系列データ     | 集約、圧縮         |

**選択フローチャート:**

```
データの性質は？
├─ 構造化、関係性重要 → RDBMS
│   └─ トランザクション必須？
│       ├─ Yes → PostgreSQL
│       └─ No → MySQL
├─ ドキュメント形式、スキーマ変化 → MongoDB
├─ 単純なKey-Value、高速 → Redis/DynamoDB
├─ 大規模、書き込み多数 → Cassandra
├─ グラフ、関係性探索 → Neo4j
└─ 時系列、メトリクス → InfluxDB
```

**シャーディング戦略:**

```typescript
// 水平シャーディング
class HorizontalSharding {
  private shards: Database[];

  // Range-based
  getShardByRange(userId: number): Database {
    if (userId < 1000000) return this.shards[0];
    if (userId < 2000000) return this.shards[1];
    return this.shards[2];
  }

  // Hash-based
  getShardByHash(userId: string): Database {
    const hash = this.hash(userId);
    return this.shards[hash % this.shards.length];
  }

  // Directory-based
  async getShardByDirectory(userId: string): Promise<Database> {
    const shardId = await this.directory.lookup(userId);
    return this.shards[shardId];
  }
}

// Consistent Hashing
class ConsistentHashing {
  private ring: Map<number, Database> = new Map();
  private sortedKeys: number[] = [];

  addNode(node: Database) {
    // 仮想ノードを追加
    for (let i = 0; i < 100; i++) {
      const hash = this.hash(`${node.id}:${i}`);
      this.ring.set(hash, node);
      this.sortedKeys.push(hash);
    }
    this.sortedKeys.sort((a, b) => a - b);
  }

  getNode(key: string): Database {
    const hash = this.hash(key);
    // 時計回りで最初のノードを見つける
    for (const nodeHash of this.sortedKeys) {
      if (nodeHash >= hash) {
        return this.ring.get(nodeHash)!;
      }
    }
    return this.ring.get(this.sortedKeys[0])!;
  }
}
```

---

### 🔄 非同期処理とメッセージキュー

**メッセージキューの利点:**

```
同期処理:
Client → Service A → Service B → Service C → Response
        (全て待つ、1つ失敗で全体失敗)

非同期処理:
Client → Service A → Queue → Response (即座に返す)
                       ↓
                   Service B (後で処理)
                       ↓
                   Service C
```

**キューイングパターン:**

```typescript
// Producer-Consumer
class MessageQueue {
  private queue: Message[] = [];

  async publish(message: Message): Promise<void> {
    this.queue.push(message);
    await this.notifyConsumers();
  }

  async consume(): Promise<Message | null> {
    return this.queue.shift() || null;
  }
}

// Pub/Sub
class PubSubBroker {
  private subscribers: Map<string, Consumer[]> = new Map();

  subscribe(topic: string, consumer: Consumer): void {
    if (!this.subscribers.has(topic)) {
      this.subscribers.set(topic, []);
    }
    this.subscribers.get(topic)!.push(consumer);
  }

  publish(topic: string, message: Message): void {
    const consumers = this.subscribers.get(topic) || [];
    for (const consumer of consumers) {
      consumer.receive(message);
    }
  }
}

// Task Queue with Retry
class TaskQueue {
  async enqueue(task: Task): Promise<void> {
    await this.queue.add(task, {
      attempts: 3,
      backoff: {
        type: "exponential",
        delay: 1000,
      },
    });
  }

  async process(processor: (task: Task) => Promise<void>): Promise<void> {
    while (true) {
      const task = await this.queue.pop();
      if (!task) {
        await this.sleep(100);
        continue;
      }

      try {
        await processor(task);
        await this.queue.ack(task);
      } catch (error) {
        if (task.attempts < task.maxAttempts) {
          await this.queue.retry(task);
        } else {
          await this.queue.moveToDeadLetter(task);
        }
      }
    }
  }
}
```

**メッセージブローカーの比較:**

| ブローカー    | スループット | 順序保証           | 永続性   | 用途                   |
| ------------- | ------------ | ------------------ | -------- | ---------------------- |
| RabbitMQ      | 中           | キュー単位         | あり     | タスクキュー           |
| Apache Kafka  | 非常に高     | パーティション単位 | あり     | イベントストリーミング |
| Amazon SQS    | 高           | なし/FIFO          | あり     | シンプルなキューイング |
| Redis Streams | 高           | あり               | 設定次第 | リアルタイム処理       |

---

### 📈 パフォーマンスメトリクス

**重要な指標:**

```typescript
// レイテンシの測定
interface LatencyMetrics {
  p50: number; // 中央値
  p95: number; // 95パーセンタイル
  p99: number; // 99パーセンタイル
  p999: number; // 99.9パーセンタイル
  mean: number; // 平均
  max: number; // 最大
}

// スループット
interface ThroughputMetrics {
  requestsPerSecond: number;
  bytesPerSecond: number;
  transactionsPerMinute: number;
}

// 可用性
interface AvailabilityMetrics {
  uptime: number; // 稼働率 (99.99% = "Four Nines")
  mtbf: number; // Mean Time Between Failures
  mttr: number; // Mean Time To Recovery
  errorRate: number; // エラー率
}

// SLI/SLO/SLA
interface ServiceLevelIndicator {
  // 実際の測定値
  latencyP99: number;
  availability: number;
  errorRate: number;
}

interface ServiceLevelObjective {
  // 目標値
  latencyP99: "< 200ms";
  availability: "> 99.9%";
  errorRate: "< 0.1%";
}

interface ServiceLevelAgreement {
  // 契約（違反時のペナルティ）
  slo: ServiceLevelObjective;
  penalties: Penalty[];
}
```

**可用性の計算:**

```
99.9% (Three Nines):
  年間ダウンタイム: 8.76時間
  月間ダウンタイム: 43.8分

99.99% (Four Nines):
  年間ダウンタイム: 52.56分
  月間ダウンタイム: 4.38分

99.999% (Five Nines):
  年間ダウンタイム: 5.26分
  月間ダウンタイム: 26.3秒

直列システムの可用性:
A(total) = A1 × A2 × A3
例: 0.99 × 0.99 × 0.99 = 0.970 (97%)

並列システムの可用性:
A(total) = 1 - (1-A1) × (1-A2)
例: 1 - (1-0.99) × (1-0.99) = 0.9999 (99.99%)
```

---

### 🛡️ 信頼性パターン

**サーキットブレーカー:**

```typescript
enum CircuitState {
  CLOSED, // 正常
  OPEN, // 遮断
  HALF_OPEN, // テスト中
}

class CircuitBreaker {
  private state = CircuitState.CLOSED;
  private failureCount = 0;
  private successCount = 0;
  private lastFailure: Date | null = null;

  private readonly failureThreshold = 5;
  private readonly successThreshold = 3;
  private readonly timeout = 60000; // 1分

  async execute<T>(fn: () => Promise<T>): Promise<T> {
    if (this.state === CircuitState.OPEN) {
      if (this.shouldTryAgain()) {
        this.state = CircuitState.HALF_OPEN;
      } else {
        throw new Error("Circuit is OPEN");
      }
    }

    try {
      const result = await fn();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  private onSuccess(): void {
    if (this.state === CircuitState.HALF_OPEN) {
      this.successCount++;
      if (this.successCount >= this.successThreshold) {
        this.state = CircuitState.CLOSED;
        this.reset();
      }
    } else {
      this.reset();
    }
  }

  private onFailure(): void {
    this.failureCount++;
    this.lastFailure = new Date();

    if (this.failureCount >= this.failureThreshold) {
      this.state = CircuitState.OPEN;
    }
  }

  private shouldTryAgain(): boolean {
    if (!this.lastFailure) return true;
    return Date.now() - this.lastFailure.getTime() >= this.timeout;
  }

  private reset(): void {
    this.failureCount = 0;
    this.successCount = 0;
  }
}

// 使用例
const breaker = new CircuitBreaker();

async function callExternalService() {
  return breaker.execute(async () => {
    const response = await fetch("https://api.example.com/data");
    if (!response.ok) throw new Error("Service error");
    return response.json();
  });
}
```

**リトライとバックオフ:**

```typescript
async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  options: {
    maxAttempts: number;
    initialDelay: number;
    maxDelay: number;
    factor: number;
  }
): Promise<T> {
  let attempt = 0;
  let delay = options.initialDelay;

  while (true) {
    try {
      return await fn();
    } catch (error) {
      attempt++;
      if (attempt >= options.maxAttempts) {
        throw error;
      }

      // Exponential backoff with jitter
      const jitter = Math.random() * 0.3 * delay;
      await sleep(delay + jitter);

      delay = Math.min(delay * options.factor, options.maxDelay);
    }
  }
}

// 使用例
const result = await retryWithBackoff(() => callExternalAPI(), {
  maxAttempts: 5,
  initialDelay: 1000,
  maxDelay: 30000,
  factor: 2,
});
```

---

### 🌍 グローバル分散

**CDN (Content Delivery Network):**

```
ユーザー(東京) → 東京エッジ → [キャッシュヒット] → コンテンツ返却
ユーザー(NYC) → NYCエッジ → [キャッシュミス] → オリジン → キャッシュ & 返却

利点:
- レイテンシ削減
- 帯域コスト削減
- 可用性向上
- DDoS保護
```

**マルチリージョンデプロイ:**

```typescript
// Active-Active
interface MultiRegionConfig {
  regions: Region[];
  routingPolicy: "latency" | "geoproximity" | "weighted";
  dataReplication: "async" | "sync";
  conflictResolution: "last-write-wins" | "merge" | "custom";
}

// DNS-based routing
class GeoDNS {
  resolveRegion(clientIP: string): Region {
    const location = this.geolocate(clientIP);
    return this.findNearestRegion(location);
  }
}

// データ同期
class CrossRegionReplication {
  async replicate(change: Change): Promise<void> {
    const localRegion = this.getCurrentRegion();
    const remoteRegions = this.getRemoteRegions();

    // 非同期レプリケーション
    for (const region of remoteRegions) {
      await this.queue.enqueue({
        destination: region,
        change: change,
        timestamp: Date.now(),
      });
    }
  }

  async resolveConflict(local: Data, remote: Data): Promise<Data> {
    // Last Write Wins
    if (local.timestamp > remote.timestamp) {
      return local;
    }
    return remote;
  }
}
```

---

## 🎓 学習リソース

### 主要リポジトリ

1. **[system-design-primer](https://github.com/donnemartin/system-design-primer)**

   - 包括的な学習リソース
   - 図解付き解説
   - 日本語翻訳あり

2. **[awesome-scalability](https://github.com/binhnguyennus/awesome-scalability)**

   - 実企業の事例集
   - Netflix, Twitter, Uber 等
   - パフォーマンスチューニング

3. **[system-design-interview](https://github.com/checkcheckzz/system-design-interview)**
   - 面接対策
   - 実践的な設計問題
   - 解答例

### 推奨書籍

- **Designing Data-Intensive Applications** - Martin Kleppmann
- **Web Scalability for Startup Engineers** - Artur Ejsmont
- **Building Microservices** - Sam Newman

### オンラインリソース

- [High Scalability Blog](http://highscalability.com/)
- [AWS Architecture Center](https://aws.amazon.com/architecture/)
- [Google Cloud Architecture](https://cloud.google.com/architecture)

---

## 次のステップ

1. **実践練習**

   - 設計問題を解く（URL 短縮、Twitter、YouTube 等）
   - トレードオフを言語化する
   - ボトルネックを特定する

2. **深い学習**

   - 特定のコンポーネント（DB、キャッシュ）を深掘り
   - 実際のシステムのアーキテクチャを分析
   - 障害事例（ポストモーテム）を読む

3. **ハンズオン**
   - ローカルで分散システムを構築
   - 負荷テストを実施
   - モニタリングを設定

---

最終更新: 2025 年 11 月
