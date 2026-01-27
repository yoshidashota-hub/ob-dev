# 第3章: クエリ

## 比較演算子

```javascript
// 演算子一覧
$eq; // 等しい（=）
$ne; // 等しくない（!=）
$gt; // より大きい（>）
$gte; // 以上（>=）
$lt; // より小さい（<）
$lte; // 以下（<=）
$in; // いずれかに一致
$nin; // いずれにも一致しない
```

### 使用例

```javascript
// 等しい
db.users.find({ status: "active" }); // 暗黙的な $eq
db.users.find({ status: { $eq: "active" } }); // 明示的

// 等しくない
db.users.find({ status: { $ne: "deleted" } });

// 範囲
db.users.find({ age: { $gt: 20 } }); // 20より大きい
db.users.find({ age: { $gte: 20, $lte: 30 } }); // 20以上30以下

// 日付の範囲
db.orders.find({
  createdAt: {
    $gte: ISODate("2024-01-01"),
    $lt: ISODate("2024-02-01"),
  },
});

// いずれかに一致
db.users.find({ status: { $in: ["active", "pending"] } });

// いずれにも一致しない
db.users.find({ role: { $nin: ["admin", "moderator"] } });
```

## 論理演算子

```javascript
// 演算子一覧
$and; // すべてに一致
$or; // いずれかに一致
$not; // 否定
$nor; // いずれにも一致しない
```

### 使用例

```javascript
// AND（暗黙的）
db.users.find({ status: "active", age: { $gte: 18 } });

// AND（明示的 - 同じフィールドに複数条件）
db.users.find({
  $and: [{ age: { $gte: 18 } }, { age: { $lte: 65 } }],
});

// OR
db.users.find({
  $or: [{ status: "active" }, { role: "admin" }],
});

// 複合条件
db.users.find({
  status: "active",
  $or: [{ age: { $lt: 20 } }, { age: { $gt: 60 } }],
});

// NOT
db.users.find({
  age: { $not: { $gt: 30 } }, // 30以下または age フィールドなし
});

// NOR（いずれにも一致しない）
db.users.find({
  $nor: [{ status: "deleted" }, { status: "banned" }],
});
```

## 要素演算子

```javascript
// 演算子一覧
$exists; // フィールドの存在
$type; // 型の確認
```

### 使用例

```javascript
// フィールドが存在する
db.users.find({ email: { $exists: true } });

// フィールドが存在しない
db.users.find({ deletedAt: { $exists: false } });

// 型の確認
db.users.find({ age: { $type: "number" } });
db.users.find({ tags: { $type: "array" } });

// 複数の型
db.users.find({ value: { $type: ["string", "number"] } });
```

## 配列演算子

```javascript
// 演算子一覧
$all; // すべての要素を含む
$elemMatch; // 条件に一致する要素が存在
$size; // 配列のサイズ
```

### 使用例

```javascript
// 配列に値が含まれる
db.users.find({ tags: "developer" }); // tags に 'developer' を含む

// すべての値を含む
db.users.find({ tags: { $all: ["developer", "nodejs"] } });

// 配列のサイズ
db.users.find({ tags: { $size: 3 } }); // 要素が3つ

// 埋め込みドキュメントの配列を検索
db.orders.find({
  items: {
    $elemMatch: {
      product: "iPhone",
      quantity: { $gte: 2 },
    },
  },
});

// $elemMatch なしの場合（AND が全要素に分散）
db.orders.find({
  "items.product": "iPhone",
  "items.quantity": { $gte: 2 },
}); // 別々の要素でも一致してしまう
```

## 評価演算子

```javascript
// 演算子一覧
$regex; // 正規表現
$expr; // 集計式を使用
$text; // テキスト検索
$where; // JavaScript 式（非推奨）
$mod; // 剰余
$jsonSchema; // JSON Schema でバリデーション
```

### 正規表現

```javascript
// 基本
db.users.find({ name: { $regex: /田中/ } });
db.users.find({ name: { $regex: "田中" } });

// オプション付き（i: 大文字小文字無視）
db.users.find({
  email: { $regex: /example\.com$/i },
});

// 前方一致（インデックスを活用）
db.users.find({ name: { $regex: /^田中/ } });

// 複雑なパターン
db.products.find({
  name: { $regex: /^iPhone \d+( Pro)?$/, $options: "i" },
});
```

### $expr（フィールド間の比較）

```javascript
// フィールド同士を比較
db.inventory.find({
  $expr: { $gt: ["$quantity", "$minStock"] },
});

// 計算結果で比較
db.orders.find({
  $expr: {
    $lt: [{ $subtract: ["$total", "$discount"] }, 1000],
  },
});
```

### テキスト検索

```javascript
// テキストインデックスが必要
db.articles.createIndex({ title: "text", content: "text" });

// 検索
db.articles.find({ $text: { $search: "mongodb database" } });

// フレーズ検索
db.articles.find({ $text: { $search: '"mongodb database"' } });

// 除外
db.articles.find({ $text: { $search: "mongodb -mysql" } });

// スコアでソート
db.articles
  .find({ $text: { $search: "mongodb" } }, { score: { $meta: "textScore" } })
  .sort({ score: { $meta: "textScore" } });
```

## ネストしたドキュメントのクエリ

```javascript
// ドット記法
db.users.find({ "address.city": "東京" });
db.users.find({ "address.zip": { $regex: /^100/ } });

// 複数レベル
db.users.find({ "profile.settings.notifications.email": true });

// 完全一致（順序も含めて完全一致）
db.users.find({
  address: { city: "東京", zip: "100-0001" },
});
```

## 配列内のドキュメントクエリ

```javascript
// サンプルデータ
{
  name: "田中太郎",
  orders: [
    { product: "iPhone", price: 100000, quantity: 1 },
    { product: "Case", price: 3000, quantity: 2 }
  ]
}

// ドット記法
db.users.find({ "orders.product": "iPhone" });

// $elemMatch（同一要素内で複数条件）
db.users.find({
  orders: {
    $elemMatch: {
      product: "iPhone",
      quantity: { $gte: 2 }
    }
  }
});

// 配列インデックス指定
db.users.find({ "orders.0.product": "iPhone" }); // 最初の注文
```

## 実践的なクエリパターン

### ページネーション

```typescript
// オフセットベース
async function getUsers(page: number, limit: number) {
  return db
    .collection("users")
    .find({})
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit)
    .toArray();
}

// カーソルベース（大量データ向け）
async function getUsersAfter(cursor: string, limit: number) {
  return db
    .collection("users")
    .find({ _id: { $gt: new ObjectId(cursor) } })
    .sort({ _id: 1 })
    .limit(limit)
    .toArray();
}
```

### 検索機能

```typescript
async function searchUsers(query: string, filters: Filters) {
  const filter: Filter<User> = {};

  // テキスト検索
  if (query) {
    filter.$text = { $search: query };
  }

  // フィルター
  if (filters.status) {
    filter.status = filters.status;
  }

  if (filters.ageRange) {
    filter.age = {
      $gte: filters.ageRange.min,
      $lte: filters.ageRange.max,
    };
  }

  if (filters.tags?.length) {
    filter.tags = { $all: filters.tags };
  }

  return db.collection<User>("users").find(filter).toArray();
}
```

### ソフトデリート

```typescript
// 削除済みを除外するベースフィルター
const activeFilter = { deletedAt: { $exists: false } };

// 通常のクエリ
async function getActiveUsers() {
  return db
    .collection("users")
    .find({ ...activeFilter, status: "active" })
    .toArray();
}

// ソフトデリート実行
async function softDelete(id: string) {
  return db
    .collection("users")
    .updateOne({ _id: new ObjectId(id) }, { $set: { deletedAt: new Date() } });
}
```

### 集計カウント

```typescript
async function getUserStats() {
  const [total, active, inactive] = await Promise.all([
    db.collection("users").countDocuments(),
    db.collection("users").countDocuments({ status: "active" }),
    db.collection("users").countDocuments({ status: "inactive" }),
  ]);

  return { total, active, inactive };
}
```

## クエリプランの確認

```javascript
// explain でクエリ実行計画を確認
db.users.find({ email: 'test@example.com' }).explain('executionStats');

// 重要な指標
{
  executionStats: {
    executionTimeMillis: 5,      // 実行時間
    totalDocsExamined: 10000,    // スキャンしたドキュメント数
    totalKeysExamined: 1,        // スキャンしたインデックスキー数
    nReturned: 1                 // 返されたドキュメント数
  },
  queryPlanner: {
    winningPlan: {
      stage: "FETCH",            // COLLSCAN は全スキャン（遅い）
      inputStage: {
        stage: "IXSCAN",         // インデックススキャン（速い）
        indexName: "email_1"
      }
    }
  }
}
```

## 次のステップ

次章では、クエリパフォーマンスを改善するインデックスについて学びます。
