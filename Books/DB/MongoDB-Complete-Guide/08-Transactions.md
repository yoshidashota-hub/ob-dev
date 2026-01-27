# 第8章: トランザクション

## 概要

MongoDB 4.0 以降でマルチドキュメントトランザクションをサポート。

```
┌─────────────────────────────────────────────────────┐
│               ACID トランザクション                  │
│                                                     │
│  Atomicity   - 全操作が成功 or 全操作がロールバック  │
│  Consistency - データの整合性を保証                  │
│  Isolation   - 他の操作から独立                     │
│  Durability  - コミット後は永続化                   │
│                                                     │
│  ┌─────────────────────────────────────────────┐   │
│  │  startSession()                             │   │
│  │       ↓                                     │   │
│  │  session.startTransaction()                 │   │
│  │       ↓                                     │   │
│  │  ┌───────────────────────────────────────┐ │   │
│  │  │  操作1: 在庫を減らす                   │ │   │
│  │  │  操作2: 注文を作成                    │ │   │
│  │  │  操作3: 決済を記録                    │ │   │
│  │  └───────────────────────────────────────┘ │   │
│  │       ↓                                     │   │
│  │  session.commitTransaction()    ← 成功     │   │
│  │  session.abortTransaction()     ← 失敗     │   │
│  └─────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────┘
```

## 前提条件

- MongoDB 4.0 以降（レプリカセット）
- MongoDB 4.2 以降（シャーディング）
- MongoDB Atlas は対応済み
- スタンドアロンでは使用不可

```bash
# ローカル開発用レプリカセット（docker-compose）
version: '3.8'
services:
  mongo1:
    image: mongo:7
    command: mongod --replSet rs0
    ports:
      - "27017:27017"
    volumes:
      - mongo1_data:/data/db

  mongo2:
    image: mongo:7
    command: mongod --replSet rs0
    volumes:
      - mongo2_data:/data/db

  mongo3:
    image: mongo:7
    command: mongod --replSet rs0
    volumes:
      - mongo3_data:/data/db

volumes:
  mongo1_data:
  mongo2_data:
  mongo3_data:
```

```javascript
// レプリカセット初期化
rs.initiate({
  _id: "rs0",
  members: [
    { _id: 0, host: "mongo1:27017" },
    { _id: 1, host: "mongo2:27017" },
    { _id: 2, host: "mongo3:27017" },
  ],
});
```

## 基本的な使い方

### MongoDB Driver

```typescript
import { MongoClient } from "mongodb";

async function transferFunds(
  client: MongoClient,
  fromAccountId: string,
  toAccountId: string,
  amount: number,
) {
  const session = client.startSession();

  try {
    await session.withTransaction(async () => {
      const accounts = client.db("bank").collection("accounts");

      // 送金元から引き落とし
      const fromResult = await accounts.updateOne(
        { _id: fromAccountId, balance: { $gte: amount } },
        { $inc: { balance: -amount } },
        { session },
      );

      if (fromResult.modifiedCount === 0) {
        throw new Error("残高不足または口座が存在しません");
      }

      // 送金先に入金
      const toResult = await accounts.updateOne(
        { _id: toAccountId },
        { $inc: { balance: amount } },
        { session },
      );

      if (toResult.modifiedCount === 0) {
        throw new Error("送金先口座が存在しません");
      }

      // 取引履歴を記録
      await client.db("bank").collection("transactions").insertOne(
        {
          from: fromAccountId,
          to: toAccountId,
          amount,
          type: "transfer",
          createdAt: new Date(),
        },
        { session },
      );
    });

    console.log("送金が完了しました");
  } catch (error) {
    console.error("送金に失敗しました:", error);
    throw error;
  } finally {
    await session.endSession();
  }
}
```

### 手動制御

```typescript
async function manualTransaction(client: MongoClient) {
  const session = client.startSession();

  try {
    session.startTransaction({
      readConcern: { level: 'snapshot' },
      writeConcern: { w: 'majority' },
      readPreference: 'primary',
    });

    // 操作を実行
    await collection.insertOne({ ... }, { session });
    await collection.updateOne({ ... }, { ... }, { session });

    // コミット
    await session.commitTransaction();
  } catch (error) {
    // ロールバック
    await session.abortTransaction();
    throw error;
  } finally {
    await session.endSession();
  }
}
```

### Mongoose でのトランザクション

```typescript
import mongoose from "mongoose";

async function createOrderWithTransaction(userId: string, items: OrderItem[]) {
  const session = await mongoose.startSession();

  try {
    let order;

    await session.withTransaction(async () => {
      // 在庫確認と減算
      for (const item of items) {
        const product = await Product.findOneAndUpdate(
          {
            _id: item.productId,
            stock: { $gte: item.quantity },
          },
          { $inc: { stock: -item.quantity } },
          { session, new: true },
        );

        if (!product) {
          throw new Error(`在庫不足: ${item.productId}`);
        }
      }

      // 注文作成
      [order] = await Order.create(
        [
          {
            userId,
            items,
            status: "pending",
            total: calculateTotal(items),
          },
        ],
        { session },
      );

      // ユーザーの注文履歴を更新
      await User.updateOne(
        { _id: userId },
        { $push: { orderHistory: order._id } },
        { session },
      );
    });

    return order;
  } finally {
    await session.endSession();
  }
}
```

## トランザクションオプション

```typescript
session.startTransaction({
  // Read Concern
  readConcern: {
    level: "snapshot", // 'local' | 'available' | 'majority' | 'linearizable' | 'snapshot'
  },

  // Write Concern
  writeConcern: {
    w: "majority", // 'majority' | number | 'majority'
    j: true, // ジャーナリング
    wtimeout: 5000, // タイムアウト（ms）
  },

  // Read Preference
  readPreference: "primary", // 'primary' | 'primaryPreferred' | 'secondary' | 'secondaryPreferred' | 'nearest'

  // 最大コミット時間
  maxCommitTimeMS: 5000,
});
```

## リトライロジック

```typescript
async function runTransactionWithRetry<T>(
  client: MongoClient,
  txnFunc: (session: ClientSession) => Promise<T>,
  maxRetries = 3
): Promise<T> {
  const session = client.startSession();

  try {
    let retries = 0;

    while (true) {
      try {
        const result = await session.withTransaction(
          () => txnFunc(session),
          {
            readConcern: { level: 'snapshot' },
            writeConcern: { w: 'majority' },
          }
        );

        return result;
      } catch (error: any) {
        // 一時的なエラーはリトライ
        if (
          error.hasErrorLabel?.('TransientTransactionError') &&
          retries < maxRetries
        ) {
          retries++;
          console.log(`リトライ ${retries}/${maxRetries}`);
          continue;
        }

        // コミットエラーはリトライ
        if (
          error.hasErrorLabel?.('UnknownTransactionCommitResult') &&
          retries < maxRetries
        ) {
          retries++;
          console.log(`コミットリトライ ${retries}/${maxRetries}`);
          continue;
        }

        throw error;
      }
    }
  } finally {
    await session.endSession();
  }
}

// 使用
await runTransactionWithRetry(client, async (session) => {
  await collection.insertOne({ ... }, { session });
  await collection.updateOne({ ... }, { ... }, { session });
});
```

## 実践的なパターン

### 注文処理

```typescript
async function processOrder(
  client: MongoClient,
  orderId: string,
  paymentInfo: PaymentInfo,
) {
  const session = client.startSession();

  try {
    await session.withTransaction(async () => {
      const db = client.db("ecommerce");

      // 1. 注文を取得
      const order = await db
        .collection("orders")
        .findOne(
          { _id: new ObjectId(orderId), status: "pending" },
          { session },
        );

      if (!order) {
        throw new Error("注文が見つからないか、既に処理済みです");
      }

      // 2. 在庫を確保
      for (const item of order.items) {
        const result = await db.collection("products").updateOne(
          {
            _id: item.productId,
            stock: { $gte: item.quantity },
          },
          {
            $inc: { stock: -item.quantity },
            $push: {
              reservations: {
                orderId: order._id,
                quantity: item.quantity,
                at: new Date(),
              },
            },
          },
          { session },
        );

        if (result.modifiedCount === 0) {
          throw new Error(`在庫不足: ${item.productId}`);
        }
      }

      // 3. 決済処理（外部API呼び出しはトランザクション外で）
      // 注: 決済APIはトランザクションに含めない

      // 4. 注文ステータス更新
      await db.collection("orders").updateOne(
        { _id: order._id },
        {
          $set: {
            status: "confirmed",
            paymentInfo,
            confirmedAt: new Date(),
          },
        },
        { session },
      );

      // 5. 通知を記録
      await db.collection("notifications").insertOne(
        {
          userId: order.userId,
          type: "order_confirmed",
          orderId: order._id,
          createdAt: new Date(),
        },
        { session },
      );
    });

    // トランザクション成功後に決済APIを呼び出し
    await processPayment(paymentInfo);
  } finally {
    await session.endSession();
  }
}
```

### ポイント付与

```typescript
async function awardPoints(
  client: MongoClient,
  userId: string,
  points: number,
  reason: string,
) {
  const session = client.startSession();

  try {
    await session.withTransaction(async () => {
      const db = client.db("app");

      // ポイント残高を更新
      const result = await db.collection("users").findOneAndUpdate(
        { _id: new ObjectId(userId) },
        {
          $inc: { "points.balance": points },
          $push: {
            "points.history": {
              amount: points,
              reason,
              createdAt: new Date(),
            },
          },
        },
        { session, returnDocument: "after" },
      );

      if (!result) {
        throw new Error("ユーザーが見つかりません");
      }

      // ポイント履歴を記録
      await db.collection("pointTransactions").insertOne(
        {
          userId: new ObjectId(userId),
          amount: points,
          reason,
          balanceAfter: result.points.balance,
          createdAt: new Date(),
        },
        { session },
      );
    });
  } finally {
    await session.endSession();
  }
}
```

## 注意点とベストプラクティス

### 1. トランザクションは短く

```typescript
// ❌ 悪い例: 外部API呼び出しを含む
await session.withTransaction(async () => {
  await collection.updateOne({ ... }, { ... }, { session });
  await externalPaymentAPI.charge(amount); // 遅い！
  await collection.updateOne({ ... }, { ... }, { session });
});

// ✓ 良い例: 外部呼び出しは外で
await session.withTransaction(async () => {
  await collection.updateOne({ ... }, { session });
  await collection.updateOne({ ... }, { session });
});
// トランザクション後に外部API
await externalPaymentAPI.charge(amount);
```

### 2. ドキュメント設計を見直す

```typescript
// トランザクションが本当に必要か？
// 埋め込みでアトミック更新できる場合も

// 1回の更新でアトミック
await Order.updateOne(
  { _id: orderId },
  {
    $set: { status: "paid" },
    $push: {
      payments: { amount, method, paidAt: new Date() },
    },
  },
);
```

### 3. エラーハンドリング

```typescript
try {
  await session.withTransaction(async () => {
    // ...
  });
} catch (error: any) {
  if (error.hasErrorLabel?.("TransientTransactionError")) {
    // ネットワークエラー等、リトライ可能
  } else if (error.hasErrorLabel?.("UnknownTransactionCommitResult")) {
    // コミット結果不明、確認が必要
  } else {
    // その他のエラー
  }
}
```

### 4. タイムアウト設定

```typescript
// デフォルトは60秒
session.startTransaction({
  maxCommitTimeMS: 10000, // 10秒
});

// 接続文字列でも設定可能
const uri = "mongodb://...?wtimeoutMS=5000";
```

## トランザクションが不要なケース

```typescript
// 1. 単一ドキュメントの更新（常にアトミック）
await User.updateOne({ _id: userId }, { $set: { name: "新しい名前" } });

// 2. 埋め込みドキュメントの更新
await Order.updateOne(
  { _id: orderId },
  { $push: { items: newItem }, $inc: { total: newItem.price } },
);

// 3. findOneAndUpdate（読み取りと更新がアトミック）
const result = await Counter.findOneAndUpdate(
  { _id: "orderId" },
  { $inc: { seq: 1 } },
  { returnDocument: "after", upsert: true },
);
```

## 次のステップ

次章では、MongoDB Atlas の機能と活用方法を学びます。
