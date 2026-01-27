# 第4章: インデックス

## インデックスの基本

```
┌─────────────────────────────────────────────────────┐
│                インデックスなし                      │
│                                                     │
│  クエリ: { email: "test@example.com" }              │
│                                                     │
│  [Doc1] → [Doc2] → [Doc3] → ... → [Doc100000]      │
│    ↓                                                │
│  全ドキュメントをスキャン（COLLSCAN）= O(n)          │
└─────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────┐
│                インデックスあり                      │
│                                                     │
│  email インデックス（B-Tree）                       │
│         ┌───┐                                       │
│         │ M │                                       │
│        /     \                                      │
│     ┌───┐   ┌───┐                                  │
│     │ F │   │ T │  → "test@..." を直接参照         │
│                                                     │
│  インデックススキャン（IXSCAN）= O(log n)           │
└─────────────────────────────────────────────────────┘
```

## インデックスの種類

### 単一フィールドインデックス

```javascript
// 作成
db.users.createIndex({ email: 1 }); // 1: 昇順, -1: 降順

// 一意制約付き
db.users.createIndex({ email: 1 }, { unique: true });

// 名前を指定
db.users.createIndex({ email: 1 }, { name: 'idx_users_email' });
```

### 複合インデックス

```javascript
// 複数フィールドのインデックス
db.orders.createIndex({ userId: 1, createdAt: -1 });

// 順序が重要！
// { userId: 1, createdAt: -1 } は以下のクエリに有効:
// - { userId: "xxx" }
// - { userId: "xxx", createdAt: { $gte: date } }
// - { userId: "xxx" } + sort({ createdAt: -1 })

// しかし以下には無効:
// - { createdAt: { $gte: date } } のみ
```

### 複合インデックスの設計（ESR ルール）

```javascript
// ESR: Equality → Sort → Range
// 1. Equality: 等価条件のフィールド
// 2. Sort: ソートに使うフィールド
// 3. Range: 範囲条件のフィールド

// クエリ例
db.orders.find({
  status: 'completed',     // Equality
  amount: { $gte: 1000 }   // Range
}).sort({ createdAt: -1 }) // Sort

// 最適なインデックス
db.orders.createIndex({
  status: 1,     // E: 等価
  createdAt: -1, // S: ソート
  amount: 1      // R: 範囲
});
```

### マルチキーインデックス（配列）

```javascript
// 配列フィールドに自動適用
db.articles.createIndex({ tags: 1 });

// クエリ
db.articles.find({ tags: 'mongodb' });
db.articles.find({ tags: { $all: ['mongodb', 'nodejs'] } });
```

### テキストインデックス

```javascript
// 全文検索用
db.articles.createIndex({
  title: 'text',
  content: 'text',
  tags: 'text',
});

// 重み付け
db.articles.createIndex(
  {
    title: 'text',
    content: 'text',
  },
  {
    weights: { title: 10, content: 1 },
    default_language: 'japanese',
  }
);

// 検索
db.articles.find({ $text: { $search: 'MongoDB チュートリアル' } });
```

### 地理空間インデックス

```javascript
// 2dsphere（球面）
db.places.createIndex({ location: '2dsphere' });

// ドキュメント構造
{
  name: "東京タワー",
  location: {
    type: "Point",
    coordinates: [139.7454, 35.6586] // [経度, 緯度]
  }
}

// 近くの場所を検索
db.places.find({
  location: {
    $near: {
      $geometry: {
        type: "Point",
        coordinates: [139.7000, 35.6800]
      },
      $maxDistance: 5000 // メートル
    }
  }
});
```

### ハッシュインデックス

```javascript
// シャーディングキー用（等価検索のみ）
db.users.createIndex({ referenceId: 'hashed' });
```

## インデックスオプション

### 一意制約

```javascript
// 重複を許可しない
db.users.createIndex({ email: 1 }, { unique: true });

// 複合フィールドで一意
db.memberships.createIndex({ userId: 1, groupId: 1 }, { unique: true });
```

### 部分インデックス

```javascript
// 条件に一致するドキュメントのみインデックス
db.orders.createIndex(
  { createdAt: -1 },
  {
    partialFilterExpression: {
      status: { $in: ['pending', 'processing'] },
    },
  }
);

// アクティブユーザーのみ
db.users.createIndex(
  { email: 1 },
  {
    partialFilterExpression: {
      deletedAt: { $exists: false },
    },
  }
);
```

### スパースインデックス

```javascript
// null や存在しないフィールドを除外
db.users.createIndex({ phoneNumber: 1 }, { sparse: true });

// 注意: sparse + unique は null を複数許可
```

### TTL インデックス

```javascript
// 自動削除（セッション、ログなど）
db.sessions.createIndex({ createdAt: 1 }, { expireAfterSeconds: 3600 }); // 1時間後

db.logs.createIndex({ timestamp: 1 }, { expireAfterSeconds: 86400 * 30 }); // 30日後
```

### バックグラウンド作成

```javascript
// 本番環境での作成（MongoDB 4.2+は自動でバックグラウンド）
db.users.createIndex({ email: 1 }, { background: true });
```

## インデックス管理

### 一覧表示

```javascript
// コレクションのインデックス
db.users.getIndexes();

// 出力例
[
  { v: 2, key: { _id: 1 }, name: '_id_' },
  { v: 2, key: { email: 1 }, name: 'email_1', unique: true },
];
```

### 削除

```javascript
// 名前で削除
db.users.dropIndex('email_1');

// キーで削除
db.users.dropIndex({ email: 1 });

// 全て削除（_id 以外）
db.users.dropIndexes();
```

### インデックス使用状況

```javascript
// 統計情報
db.users.aggregate([{ $indexStats: {} }]);

// 出力例
{
  name: "email_1",
  accesses: {
    ops: 15420,      // 使用回数
    since: ISODate("...")
  }
}
```

## パフォーマンス分析

### explain

```javascript
// 実行計画を確認
db.users.find({ email: 'test@example.com' }).explain();

// 詳細な実行統計
db.users.find({ email: 'test@example.com' }).explain('executionStats');

// 全プラン比較
db.users.find({ email: 'test@example.com' }).explain('allPlansExecution');
```

### explain の読み方

```javascript
{
  queryPlanner: {
    winningPlan: {
      stage: "FETCH",           // ドキュメント取得
      inputStage: {
        stage: "IXSCAN",        // インデックススキャン ✓
        keyPattern: { email: 1 },
        indexName: "email_1"
      }
    }
  },
  executionStats: {
    executionTimeMillis: 2,     // 実行時間（ms）
    totalKeysExamined: 1,       // スキャンしたキー数
    totalDocsExamined: 1,       // スキャンしたドキュメント数
    nReturned: 1                // 返された件数
  }
}

// 理想: totalKeysExamined ≈ nReturned
// 悪い: COLLSCAN（全スキャン）
```

### よくある stage

```javascript
COLLSCAN;    // コレクションスキャン（インデックスなし）⚠️
IXSCAN;      // インデックススキャン ✓
FETCH;       // ドキュメント取得
SORT;        // メモリ内ソート ⚠️
SORT_KEY_GENERATOR; // ソートキー生成
PROJECTION;  // フィールド選択
LIMIT;       // 件数制限
SKIP;        // オフセット
```

## カバリングインデックス

```javascript
// クエリに必要な全フィールドがインデックスに含まれる
db.users.createIndex({ email: 1, name: 1, status: 1 });

// カバリングクエリ（FETCH 不要で高速）
db.users
  .find({ email: 'test@example.com' }, { name: 1, status: 1, _id: 0 })
  .explain();

// stage: "PROJECTION_COVERED" ← FETCH なし
```

## インデックス設計のベストプラクティス

### 1. クエリパターンを分析

```javascript
// よく使うクエリを特定
// 1. ユーザー検索: email
// 2. 注文一覧: userId + createdAt
// 3. 商品検索: category + price
```

### 2. 選択性の高いフィールドを優先

```javascript
// 良い: email（一意に近い）
db.users.createIndex({ email: 1 });

// 悪い: status（値が少ない）
db.users.createIndex({ status: 1 }); // 効果薄い

// 複合の場合は選択性の高いものを前に
db.users.createIndex({ email: 1, status: 1 });
```

### 3. 書き込みコストを考慮

```javascript
// インデックスが多すぎると書き込みが遅くなる
// 目安: 1コレクションに5-10個以下

// 使用されていないインデックスを削除
db.users.aggregate([{ $indexStats: {} }]);
```

### 4. メモリを考慮

```javascript
// インデックスはメモリに載るのが理想
// totalIndexSize を確認
db.users.stats().totalIndexSize;

// MongoDB Atlas では Performance Advisor を活用
```

## Node.js でのインデックス管理

```typescript
// 起動時にインデックスを作成
async function ensureIndexes(db: Db) {
  // ユーザー
  await db.collection('users').createIndexes([
    { key: { email: 1 }, unique: true },
    { key: { createdAt: -1 } },
  ]);

  // 注文
  await db.collection('orders').createIndexes([
    { key: { userId: 1, createdAt: -1 } },
    { key: { status: 1 }, partialFilterExpression: { status: 'pending' } },
  ]);

  // セッション（TTL）
  await db
    .collection('sessions')
    .createIndex({ createdAt: 1 }, { expireAfterSeconds: 86400 });
}
```

## 次のステップ

次章では、複雑なデータ処理を行う Aggregation Pipeline について学びます。
