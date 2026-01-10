# アーキテクチャ・設計原則 - 技術面接対策

## 概要

ソフトウェアアーキテクチャ、設計原則、設計パターンの基礎知識。

---

## 1. SOLID 原則

### S - Single Responsibility Principle（単一責任の原則）

クラスは 1 つの責任のみ持つ

```tsx
// 悪い例
class User {
  save() {
    /* DB保存 */
  }
  sendEmail() {
    /* メール送信 */
  }
  generateReport() {
    /* レポート生成 */
  }
}

// 良い例
class User {
  /* ユーザーデータのみ */
}
class UserRepository {
  save(user: User) {}
}
class EmailService {
  send(to: string) {}
}
class ReportGenerator {
  generate(user: User) {}
}
```

### O - Open/Closed Principle（オープン・クローズドの原則）

拡張に開き、修正に閉じる

```tsx
// 悪い例：新しい支払い方法を追加するたびに修正
function processPayment(type: string) {
  if (type === "credit") {
  } else if (type === "paypal") {
  }
  // else if (type === "bitcoin") { }  // 修正が必要
}

// 良い例：新しいクラスを追加するだけ
interface PaymentProcessor {
  process(): void;
}
class CreditCardProcessor implements PaymentProcessor {}
class PayPalProcessor implements PaymentProcessor {}
class BitcoinProcessor implements PaymentProcessor {} // 追加のみ
```

### L - Liskov Substitution Principle（リスコフの置換原則）

サブクラスは親クラスと置換可能

```tsx
// 悪い例
class Rectangle {
  setWidth(w: number) {
    this.width = w;
  }
  setHeight(h: number) {
    this.height = h;
  }
}
class Square extends Rectangle {
  setWidth(w: number) {
    this.width = w;
    this.height = w;
  } // 動作が変わる
}

// 良い例：継承関係を見直す
interface Shape {
  getArea(): number;
}
class Rectangle implements Shape {}
class Square implements Shape {}
```

### I - Interface Segregation Principle（インターフェース分離の原則）

クライアントに不要なメソッドを強制しない

```tsx
// 悪い例
interface Worker {
  work(): void;
  eat(): void; // ロボットには不要
}

// 良い例
interface Workable {
  work(): void;
}
interface Eatable {
  eat(): void;
}
class Human implements Workable, Eatable {}
class Robot implements Workable {}
```

### D - Dependency Inversion Principle（依存性逆転の原則）

具象でなく抽象に依存

```tsx
// 悪い例
class UserService {
  private db = new MySQLDatabase(); // 具象に依存
}

// 良い例
interface Database {
  query(sql: string): void;
}
class UserService {
  constructor(private db: Database) {} // 抽象に依存
}
```

---

## 2. DDD（Domain-Driven Design）

### バウンデッドコンテキスト

ドメインモデルが有効な境界

```
販売コンテキスト        配送コンテキスト
┌─────────────────┐    ┌─────────────────┐
│ 注文（Order）   │    │ 注文（Shipment）│
│ - 価格          │    │ - 配送先        │
│ - 決済情報      │    │ - 配送状態      │
└─────────────────┘    └─────────────────┘
同じ「注文」でも文脈で意味が異なる
```

### コンテキストマップ

コンテキスト間の関係を整理

| 関係                  | 説明            |
| --------------------- | --------------- |
| Partnership           | 協調して開発    |
| Shared Kernel         | 共有部分を持つ  |
| Customer/Supplier     | 上流/下流の関係 |
| Anti-Corruption Layer | 変換層を設ける  |

### ユビキタス言語

各コンテキストで用語を定義し、コードとドキュメントで統一

---

## 3. クリーンアーキテクチャ

### 目的

- 依存関係を内側（ビジネスロジック）に向ける
- フレームワーク非依存
- テスタビリティ向上
- UI/DB/外部サービスが交換可能

### レイヤー構造

```
外側 ←────────────────────────────────────→ 内側
Frameworks & Drivers → Interface Adapters → Use Cases → Entities
(Web, DB, UI)         (Controllers, Gateways) (Application Logic) (Business Rules)
```

### 依存関係ルール

- 内側のレイヤーは外側を知らない
- 外側から内側にのみ依存

```tsx
// Use Cases 層
interface UserRepository {
  // インターフェース定義
  findById(id: string): Promise<User>;
}

class GetUserUseCase {
  constructor(private userRepo: UserRepository) {}
  async execute(id: string): Promise<User> {
    return this.userRepo.findById(id);
  }
}

// Infrastructure 層（外側）
class PrismaUserRepository implements UserRepository {
  async findById(id: string): Promise<User> {
    return prisma.user.findUnique({ where: { id } });
  }
}
```

---

## 4. 設計パターン

### サーキットブレーカーパターン

連鎖障害を防止

```
状態遷移:
Closed（正常）→ Open（障害時、リクエスト遮断）→ Half-Open（一部リクエストで復旧確認）
```

```tsx
class CircuitBreaker {
  private failures = 0;
  private state: "CLOSED" | "OPEN" | "HALF_OPEN" = "CLOSED";
  private lastFailure?: Date;

  async call<T>(fn: () => Promise<T>): Promise<T> {
    if (this.state === "OPEN") {
      if (this.shouldRetry()) {
        this.state = "HALF_OPEN";
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
}
```

### バルクヘッドパターン

障害を分離。リソースプールをサービスごとに分割。

```tsx
// サービスごとに独立したコネクションプール
const serviceAPool = createPool({ max: 10 });
const serviceBPool = createPool({ max: 10 });

// ServiceA が障害でも ServiceB に影響しない
```

### Strangler Fig パターン

レガシーシステムの段階的移行

```
1. 新システムを並行で構築
2. ルーティングを徐々に新システムに切り替え
3. 最終的に旧システムを廃止
```

### CQRS（Command Query Responsibility Segregation）

コマンド（書き込み）とクエリ（読み取り）を分離

```tsx
// Command 側
class CreateOrderCommand {
  constructor(public orderId: string, public items: Item[]) {}
}

class OrderCommandHandler {
  async handle(cmd: CreateOrderCommand) {
    await this.writeDb.save(cmd);
  }
}

// Query 側
class OrderQueryService {
  async getOrder(id: string) {
    return this.readDb.findById(id); // 読み取り最適化されたDB
  }
}
```

**使いどころ**: 読み書きのスケール特性が異なる場合

### イベントソーシング

状態でなくイベント（事実）を保存

```tsx
// イベント
interface OrderCreated {
  type: "OrderCreated";
  orderId: string;
}
interface ItemAdded {
  type: "ItemAdded";
  itemId: string;
}
interface OrderShipped {
  type: "OrderShipped";
  shippedAt: Date;
}

// 現在状態はイベントをリプレイして導出
function rebuildOrder(events: OrderEvent[]): Order {
  return events.reduce((order, event) => {
    switch (event.type) {
      case "OrderCreated":
        return { id: event.orderId, items: [] };
      case "ItemAdded":
        return { ...order, items: [...order.items, event.itemId] };
      // ...
    }
  }, {} as Order);
}
```

**メリット**: 監査ログが自然に残る、過去の状態を復元可能

---

## 5. 技術選定

### 判断基準

- [ ] 要件への適合性
- [ ] チームのスキルセット
- [ ] コミュニティ/エコシステムの活発さ
- [ ] 長期保守性
- [ ] ライセンス

### ADR（Architecture Decision Records）

```markdown
# ADR-001: 認証に JWT を採用

## ステータス

Accepted

## コンテキスト

ステートレスな API 設計が求められている

## 決定

JWT ベースの認証を採用

## 影響

- トークン失効の仕組みが必要
- リフレッシュトークンの実装
```

---

## 学習チェックリスト

### SOLID

- [ ] 各原則を例を挙げて説明できる
- [ ] 違反しているコードを指摘できる

### DDD

- [ ] バウンデッドコンテキストを説明できる
- [ ] コンテキストマップの関係を説明できる

### クリーンアーキテクチャ

- [ ] 依存関係ルールを説明できる
- [ ] 各レイヤーの責務を説明できる

### 設計パターン

- [ ] サーキットブレーカーを説明できる
- [ ] CQRS とイベントソーシングを説明できる
- [ ] Strangler Fig パターンを説明できる

---

## 関連ノート

- [[Interview-Backend-API]]
- [[Interview-Distributed-Systems]]
- [[Interview-CS-Fundamentals]]
