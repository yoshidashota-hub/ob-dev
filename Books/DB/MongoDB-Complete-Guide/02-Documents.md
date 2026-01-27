# 第2章: ドキュメント操作

## CRUD 概要

```
┌─────────────────────────────────────────────────────┐
│                    CRUD 操作                         │
│                                                     │
│  Create    insertOne(), insertMany()                │
│  Read      find(), findOne()                        │
│  Update    updateOne(), updateMany(), replaceOne() │
│  Delete    deleteOne(), deleteMany()                │
└─────────────────────────────────────────────────────┘
```

## Create（作成）

### insertOne

```javascript
// MongoDB Shell
db.users.insertOne({
  name: '田中太郎',
  email: 'tanaka@example.com',
  age: 30,
  tags: ['developer', 'nodejs'],
  address: {
    city: '東京',
    zip: '100-0001',
  },
  createdAt: new Date(),
});

// 結果
{
  acknowledged: true,
  insertedId: ObjectId("507f1f77bcf86cd799439011")
}
```

```typescript
// Node.js
const result = await db.collection("users").insertOne({
  name: "田中太郎",
  email: "tanaka@example.com",
  age: 30,
  createdAt: new Date(),
});

console.log(result.insertedId); // ObjectId
```

### insertMany

```javascript
// 複数ドキュメントを一括挿入
db.users.insertMany([
  { name: '山田花子', email: 'yamada@example.com', age: 25 },
  { name: '鈴木一郎', email: 'suzuki@example.com', age: 35 },
  { name: '佐藤次郎', email: 'sato@example.com', age: 28 },
]);

// 結果
{
  acknowledged: true,
  insertedIds: {
    '0': ObjectId("..."),
    '1': ObjectId("..."),
    '2': ObjectId("...")
  }
}
```

```typescript
// Node.js - 順序を維持しないバルク挿入（高速）
const result = await db.collection("users").insertMany(documents, {
  ordered: false, // エラーがあっても続行
});
```

## Read（読み取り）

### findOne

```javascript
// 1件取得
db.users.findOne({ email: "tanaka@example.com" });

// _id で検索
db.users.findOne({ _id: ObjectId("507f1f77bcf86cd799439011") });

// 条件なし（最初の1件）
db.users.findOne();
```

```typescript
// Node.js
import { ObjectId } from "mongodb";

const user = await db.collection("users").findOne({ _id: new ObjectId(id) });
```

### find

```javascript
// 全件取得
db.users.find();

// 条件付き
db.users.find({ age: { $gte: 30 } });

// 配列として取得
db.users.find({ age: { $gte: 30 } }).toArray();
```

```typescript
// Node.js
const users = await db
  .collection("users")
  .find({ age: { $gte: 30 } })
  .toArray();

// カーソルで処理
const cursor = db.collection("users").find({});
for await (const doc of cursor) {
  console.log(doc);
}
```

### プロジェクション（フィールド選択）

```javascript
// 特定フィールドのみ取得（1: 含める, 0: 除外）
db.users.find({}, { projection: { name: 1, email: 1 } });

// _id を除外
db.users.find({}, { projection: { name: 1, email: 1, _id: 0 } });

// 特定フィールドを除外
db.users.find({}, { projection: { password: 0 } });
```

```typescript
// Node.js
const users = await db
  .collection("users")
  .find({})
  .project({ name: 1, email: 1, _id: 0 })
  .toArray();
```

### ソート・ページネーション

```javascript
// ソート（1: 昇順, -1: 降順）
db.users.find().sort({ createdAt: -1 });

// 複数フィールドでソート
db.users.find().sort({ age: 1, name: 1 });

// ページネーション
db.users
  .find()
  .sort({ createdAt: -1 })
  .skip(20) // オフセット
  .limit(10); // 件数
```

```typescript
// Node.js
const page = 3;
const limit = 10;

const users = await db
  .collection("users")
  .find({})
  .sort({ createdAt: -1 })
  .skip((page - 1) * limit)
  .limit(limit)
  .toArray();
```

### カウント

```javascript
// 総数
db.users.countDocuments();

// 条件付き
db.users.countDocuments({ age: { $gte: 30 } });

// 推定値（高速だが不正確な場合あり）
db.users.estimatedDocumentCount();
```

## Update（更新）

### 更新演算子

```javascript
// 主要な更新演算子
$set; // フィールドを設定
$unset; // フィールドを削除
$inc; // 数値を増減
$push; // 配列に追加
$pull; // 配列から削除
$addToSet; // 配列に重複なく追加
$rename; // フィールド名を変更
$min; // 小さい場合のみ更新
$max; // 大きい場合のみ更新
```

### updateOne

```javascript
// 1件更新
db.users.updateOne(
  { email: 'tanaka@example.com' }, // フィルター
  {
    $set: { name: '田中太郎（更新）', updatedAt: new Date() },
    $inc: { loginCount: 1 },
  }
);

// 結果
{
  acknowledged: true,
  matchedCount: 1,
  modifiedCount: 1
}
```

```typescript
// Node.js
const result = await db.collection("users").updateOne(
  { _id: new ObjectId(id) },
  {
    $set: { name: newName },
    $currentDate: { updatedAt: true },
  },
);
```

### updateMany

```javascript
// 複数件更新
db.users.updateMany(
  { status: "inactive" },
  { $set: { status: "archived", archivedAt: new Date() } },
);
```

### 配列操作

```javascript
// 配列に追加
db.users.updateOne({ _id: userId }, { $push: { tags: "newTag" } });

// 複数追加
db.users.updateOne(
  { _id: userId },
  { $push: { tags: { $each: ["tag1", "tag2"] } } },
);

// 重複なく追加
db.users.updateOne({ _id: userId }, { $addToSet: { tags: "uniqueTag" } });

// 配列から削除
db.users.updateOne({ _id: userId }, { $pull: { tags: "oldTag" } });

// 配列要素を更新
db.users.updateOne(
  { _id: userId, "addresses.type": "home" },
  { $set: { "addresses.$.city": "大阪" } },
);
```

### upsert

```javascript
// 存在しなければ挿入、存在すれば更新
db.users.updateOne(
  { email: "new@example.com" },
  {
    $set: { name: "新規ユーザー" },
    $setOnInsert: { createdAt: new Date() }, // 挿入時のみ
  },
  { upsert: true },
);
```

### replaceOne

```javascript
// ドキュメント全体を置換（_id 以外）
db.users.replaceOne(
  { email: "tanaka@example.com" },
  {
    name: "田中太郎",
    email: "tanaka@example.com",
    profile: { bio: "新しいプロフィール" },
    // createdAt は消える！
  },
);
```

### findOneAndUpdate

```javascript
// 更新前または更新後のドキュメントを返す
const result = db.users.findOneAndUpdate(
  { email: "tanaka@example.com" },
  { $inc: { points: 10 } },
  { returnDocument: "after" }, // 'before' | 'after'
);
```

```typescript
// Node.js
const result = await db
  .collection("users")
  .findOneAndUpdate(
    { _id: new ObjectId(id) },
    { $set: { status: "active" } },
    { returnDocument: "after" },
  );

console.log(result); // 更新後のドキュメント
```

## Delete（削除）

### deleteOne

```javascript
// 1件削除
db.users.deleteOne({ email: 'tanaka@example.com' });

// 結果
{
  acknowledged: true,
  deletedCount: 1
}
```

### deleteMany

```javascript
// 複数件削除
db.users.deleteMany({ status: "deleted" });

// 全件削除（危険！）
db.users.deleteMany({});
```

### findOneAndDelete

```javascript
// 削除されたドキュメントを返す
const deleted = db.users.findOneAndDelete({ email: "tanaka@example.com" });
```

## Bulk Operations

```typescript
// 大量操作を効率的に実行
const bulkOps = [
  {
    insertOne: {
      document: { name: "新規1", email: "new1@example.com" },
    },
  },
  {
    updateOne: {
      filter: { email: "update@example.com" },
      update: { $set: { status: "active" } },
    },
  },
  {
    deleteOne: {
      filter: { email: "delete@example.com" },
    },
  },
];

const result = await db.collection("users").bulkWrite(bulkOps, {
  ordered: false, // 並列実行
});

console.log(result.insertedCount);
console.log(result.modifiedCount);
console.log(result.deletedCount);
```

## TypeScript 型定義

```typescript
// types/user.ts
import { ObjectId } from "mongodb";

interface Address {
  type: "home" | "work";
  city: string;
  zip: string;
}

interface User {
  _id?: ObjectId;
  name: string;
  email: string;
  age?: number;
  tags: string[];
  addresses: Address[];
  createdAt: Date;
  updatedAt?: Date;
}

// 使用例
const db = await getDb();
const users = db.collection<User>("users");

// 型安全な操作
const user = await users.findOne({ email: "test@example.com" });
// user は User | null 型
```

## エラーハンドリング

```typescript
import { MongoError, MongoServerError } from "mongodb";

try {
  await db.collection("users").insertOne({ email: "duplicate@example.com" });
} catch (error) {
  if (error instanceof MongoServerError) {
    if (error.code === 11000) {
      // 重複キーエラー
      console.error("Email already exists");
    }
  }
  throw error;
}
```

## 次のステップ

次章では、より複雑なクエリと演算子について学びます。
