# 分散システム - 技術面接対策

## 概要

分散システム、並行処理、メッセージング、非同期処理の基礎知識。

---

## 1. CAP 定理

### 定義

分散システムは 3 つを同時に満たせない:

- **C（Consistency）**: 整合性 - すべてのノードが同じデータを見る
- **A（Availability）**: 可用性 - 常に応答を返す
- **P（Partition Tolerance）**: 分断耐性 - ネットワーク分断に耐える

### 現実的な選択

ネットワーク分断は避けられないため、CP か AP の選択

| 選択 | 特徴                               | 例                  |
| ---- | ---------------------------------- | ------------------- |
| CP   | 整合性重視、分断時に一部が利用不可 | ZooKeeper、HBase    |
| AP   | 可用性重視、一時的な不整合を許容   | Cassandra、DynamoDB |

---

## 2. 結果整合性（Eventual Consistency）

### 定義

データの更新が即座に全レプリカに反映されず、最終的に一致する状態

### 許容できる場面

- [ ] SNS のいいね数
- [ ] EC サイトのカート（在庫は厳密に）
- [ ] ページビューカウント
- [ ] 通知の既読状態

### 許容できない場面

- 銀行口座の残高
- 在庫管理
- 予約システム

---

## 3. 分散トランザクション

### Saga パターン

各サービスがローカルトランザクションを実行し、失敗時は補償トランザクションで戻す

```
注文作成 → 在庫確保 → 決済 → 配送手配
   ↓         ↓        ↓        ↓
  失敗時    在庫戻し  返金    キャンセル
```

### オーケストレーション vs コレオグラフィ

| 方式                 | 説明                           | 特徴                     |
| -------------------- | ------------------------------ | ------------------------ |
| オーケストレーション | 中央のコーディネーターが制御   | 分かりやすい、単一障害点 |
| コレオグラフィ       | イベント駆動でサービス間が連携 | 疎結合、追跡が難しい     |

```tsx
// オーケストレーション
class OrderSaga {
  async execute(order: Order) {
    try {
      await inventoryService.reserve(order.items);
      await paymentService.charge(order.total);
      await shippingService.schedule(order);
    } catch (error) {
      await this.compensate(order); // ロールバック
    }
  }
}
```

---

## 4. コンシステントハッシング

### 目的

ノード追加/削除時に再配置されるデータを最小化

### 仕組み

1. ハッシュリング上にノードを配置
2. データは時計回りで最初に見つかるノードに配置
3. 仮想ノードで負荷を均等化

```
        Node A
          ●
         /  \
        /    \
       ●      ● Node B
    Node D     \
               \
                ● Node C

データ X → ハッシュ値を計算 → 時計回りで最初のノードに配置
```

### 用途

- キャッシュクラスタ
- DB シャーディング
- ロードバランシング

---

## 5. 並行処理・非同期

### デッドロック

4 条件が全て揃うと発生:

1. 相互排他
2. 保持と待機
3. 横取り不可
4. 循環待機

### 防止策

- [ ] ロック順序の統一
- [ ] タイムアウト設定
- [ ] 必要なリソースを一度に取得
- [ ] ロックの細粒度化

### Race Condition

複数スレッド/プロセスが共有リソースに同時アクセスして予期しない結果になる

```tsx
// 問題のあるコード
let counter = 0;

async function increment() {
  const current = counter; // 読み取り
  await someAsyncOperation();
  counter = current + 1; // 書き込み（古い値に基づく）
}

// 解決策: アトミック操作
await db.user.update({
  where: { id: 1 },
  data: { count: { increment: 1 } }, // DB側でアトミックに
});
```

---

## 6. async/await の裏側

### イベントループ

```
┌─────────────────────┐
│   Call Stack        │  同期的な関数呼び出し
└──────────┬──────────┘
           │
┌──────────▼──────────┐
│   Task Queue        │  setTimeout 等のコールバック
└──────────┬──────────┘
           │
┌──────────▼──────────┐
│  Microtask Queue    │  Promise 解決（優先度高）
└─────────────────────┘
```

### async/await は Promise のシンタックスシュガー

await でマイクロタスクキューに制御を戻す

---

## 7. Node.js の並行性

### シングルスレッドなのになぜ高速？

- **ノンブロッキング I/O**: I/O 待ちでスレッドをブロックしない
- **libuv**: 内部でスレッドプールを使って I/O を処理
- **イベント駆動**: 大量の同時接続を少ないリソースで処理

### CPU バウンドの限界

重い計算は Worker Threads で分離

```tsx
import { Worker } from "worker_threads";

const worker = new Worker("./heavy-task.js");
worker.postMessage({ data: largeData });
worker.on("message", (result) => {
  console.log(result);
});
```

---

## 8. メッセージング・キュー

### Kafka の特徴

- 分散コミットログ
- パーティションで並列処理
- Consumer Group でスケールアウト
- 高スループット、永続化
- リプレイ可能

### RabbitMQ vs Kafka

| 項目         | RabbitMQ             | Kafka              |
| ------------ | -------------------- | ------------------ |
| モデル       | メッセージブローカー | イベントログ       |
| ルーティング | 複雑なルーティング   | シンプル           |
| 永続化       | 短期                 | 長期保存可能       |
| スループット | 中程度               | 非常に高い         |
| 用途         | タスクキュー         | イベントストリーム |

### メッセージの重複対策

Exactly-once は難しい。At-least-once + 冪等な消費者が現実的。

```tsx
async function processMessage(message: Message) {
  // 冪等性キーで重複チェック
  const existing = await db.processed.findUnique({
    where: { idempotencyKey: message.id },
  });

  if (existing) return; // 処理済み

  await db.$transaction([
    db.order.create({ data: message.payload }),
    db.processed.create({ data: { idempotencyKey: message.id } }),
  ]);
}
```

### Dead Letter Queue（DLQ）

リトライ超過メッセージを退避

```
Main Queue → 処理 → 成功
         ↓
       失敗 → リトライ（3回）
                    ↓
                  失敗 → DLQ → アラート → 手動確認
```

---

## 9. イベント駆動アーキテクチャ

### 難しさ

- [ ] 順序保証
- [ ] 整合性担保
- [ ] デバッグ困難
- [ ] イベントスキーマの進化（互換性維持）

### イベントスキーマの進化

```tsx
// v1
interface OrderCreatedV1 {
  type: "OrderCreated";
  version: 1;
  orderId: string;
}

// v2（後方互換）
interface OrderCreatedV2 {
  type: "OrderCreated";
  version: 2;
  orderId: string;
  customerId: string; // 新フィールド（optional）
}

// 消費者は両方を処理できるように
```

---

## 10. キャッシュ戦略

### Cache-Aside（Lazy Loading）

```tsx
async function getUser(id: string) {
  // キャッシュを確認
  let user = await cache.get(`user:${id}`);
  if (user) return user;

  // DBから取得
  user = await db.user.findUnique({ where: { id } });
  await cache.set(`user:${id}`, user, { ttl: 3600 });
  return user;
}
```

### Write-Through

書き込み時にキャッシュと DB に同時書き込み

### Write-Behind（Write-Back）

キャッシュに書いて非同期で DB に反映（高速だがデータロスリスク）

---

## 学習チェックリスト

### 基本

- [ ] CAP 定理を説明できる
- [ ] 結果整合性を説明できる
- [ ] デッドロックの条件と対策を説明できる

### 分散トランザクション

- [ ] Saga パターンを説明できる
- [ ] オーケストレーションとコレオグラフィの違いを説明できる

### メッセージング

- [ ] Kafka と RabbitMQ の違いを説明できる
- [ ] メッセージの重複対策を説明できる
- [ ] DLQ の役割を説明できる

### キャッシュ

- [ ] Cache-Aside、Write-Through、Write-Behind を説明できる

---

## 関連ノート

- [[Interview-Backend-API]]
- [[Interview-Database]]
- [[Interview-Architecture]]
