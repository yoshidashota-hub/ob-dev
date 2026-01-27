# MongoDB 学習ノート

## 概要

MongoDB はドキュメント指向の NoSQL データベース。JSON ライクなドキュメントでデータを柔軟に保存。

## 基本概念

```
┌─────────────────────────────────────────────────────┐
│                    MongoDB                           │
│                                                     │
│  RDBMS        MongoDB                               │
│  ─────────    ───────────                           │
│  Database  →  Database                              │
│  Table     →  Collection                            │
│  Row       →  Document                              │
│  Column    →  Field                                 │
│  Index     →  Index                                 │
└─────────────────────────────────────────────────────┘
```

## セットアップ

```bash
npm install mongodb
# または Mongoose（ODM）
npm install mongoose
```

### MongoDB Native Driver

```typescript
// lib/mongodb.ts
import { MongoClient, Db } from 'mongodb';

const uri = process.env.MONGODB_URI!;
const options = {};

let client: MongoClient;
let clientPromise: Promise<MongoClient>;

if (process.env.NODE_ENV === 'development') {
  const globalWithMongo = global as typeof globalThis & {
    _mongoClientPromise?: Promise<MongoClient>;
  };

  if (!globalWithMongo._mongoClientPromise) {
    client = new MongoClient(uri, options);
    globalWithMongo._mongoClientPromise = client.connect();
  }
  clientPromise = globalWithMongo._mongoClientPromise;
} else {
  client = new MongoClient(uri, options);
  clientPromise = client.connect();
}

export default clientPromise;

export async function getDb(): Promise<Db> {
  const client = await clientPromise;
  return client.db('myapp');
}
```

### Mongoose（ODM）

```typescript
// lib/mongoose.ts
import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI!;

let cached = (global as any).mongoose || { conn: null, promise: null };

export async function connectDB() {
  if (cached.conn) return cached.conn;

  if (!cached.promise) {
    cached.promise = mongoose.connect(MONGODB_URI);
  }

  cached.conn = await cached.promise;
  return cached.conn;
}
```

## スキーマ定義（Mongoose）

```typescript
// models/User.ts
import mongoose, { Schema, Document } from 'mongoose';

export interface IUser extends Document {
  email: string;
  name: string;
  password: string;
  posts: mongoose.Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<IUser>(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    name: {
      type: String,
      required: true,
      minlength: 1,
      maxlength: 100,
    },
    password: {
      type: String,
      required: true,
      select: false, // デフォルトで取得しない
    },
    posts: [{
      type: Schema.Types.ObjectId,
      ref: 'Post',
    }],
  },
  {
    timestamps: true,
  }
);

// インデックス
userSchema.index({ email: 1 });
userSchema.index({ createdAt: -1 });

export const User = mongoose.models.User || mongoose.model<IUser>('User', userSchema);
```

## CRUD 操作

### Create

```typescript
// Mongoose
const user = await User.create({
  email: 'user@example.com',
  name: 'John',
  password: hashedPassword,
});

// Native Driver
const db = await getDb();
const result = await db.collection('users').insertOne({
  email: 'user@example.com',
  name: 'John',
  password: hashedPassword,
  createdAt: new Date(),
});
```

### Read

```typescript
// Mongoose
const user = await User.findById(id);
const users = await User.find({ name: /john/i }).limit(10);
const userWithPosts = await User.findById(id).populate('posts');

// Native Driver
const db = await getDb();
const user = await db.collection('users').findOne({ _id: new ObjectId(id) });
const users = await db.collection('users')
  .find({ name: { $regex: /john/i } })
  .limit(10)
  .toArray();
```

### Update

```typescript
// Mongoose
await User.findByIdAndUpdate(id, { name: 'Jane' }, { new: true });
await User.updateMany({ status: 'inactive' }, { $set: { archived: true } });

// Native Driver
await db.collection('users').updateOne(
  { _id: new ObjectId(id) },
  { $set: { name: 'Jane', updatedAt: new Date() } }
);
```

### Delete

```typescript
// Mongoose
await User.findByIdAndDelete(id);
await User.deleteMany({ archived: true });

// Native Driver
await db.collection('users').deleteOne({ _id: new ObjectId(id) });
```

## クエリ演算子

```typescript
// 比較
const users = await User.find({
  age: { $gte: 18, $lte: 65 },
  status: { $in: ['active', 'pending'] },
  role: { $ne: 'admin' },
});

// 論理
const users = await User.find({
  $or: [
    { email: 'admin@example.com' },
    { role: 'admin' },
  ],
  $and: [
    { status: 'active' },
    { verified: true },
  ],
});

// 配列
const posts = await Post.find({
  tags: { $all: ['typescript', 'mongodb'] },
  tags: { $elemMatch: { $eq: 'featured' } },
});

// テキスト検索（インデックス必要）
const results = await Post.find({
  $text: { $search: 'mongodb tutorial' },
});
```

## 集計（Aggregation）

```typescript
const stats = await User.aggregate([
  { $match: { status: 'active' } },
  {
    $group: {
      _id: '$country',
      count: { $sum: 1 },
      avgAge: { $avg: '$age' },
    },
  },
  { $sort: { count: -1 } },
  { $limit: 10 },
]);

// 複雑な集計
const userPosts = await User.aggregate([
  { $match: { _id: new ObjectId(userId) } },
  {
    $lookup: {
      from: 'posts',
      localField: '_id',
      foreignField: 'authorId',
      as: 'posts',
    },
  },
  {
    $project: {
      name: 1,
      email: 1,
      postCount: { $size: '$posts' },
      recentPosts: { $slice: ['$posts', 5] },
    },
  },
]);
```

## Next.js API Route

```typescript
// app/api/users/route.ts
import { connectDB } from '@/lib/mongoose';
import { User } from '@/models/User';

export async function GET(req: Request) {
  await connectDB();

  const { searchParams } = new URL(req.url);
  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '20');

  const [users, total] = await Promise.all([
    User.find()
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    User.countDocuments(),
  ]);

  return Response.json({
    data: users,
    meta: { page, limit, total },
  });
}

export async function POST(req: Request) {
  await connectDB();
  const body = await req.json();

  const user = await User.create(body);

  return Response.json({ data: user }, { status: 201 });
}
```

## ベストプラクティス

1. **インデックス設計**: クエリパターンに合わせて作成
2. **スキーマ設計**: 埋め込み vs 参照を適切に選択
3. **lean()**: 読み取りのみなら Mongoose のオーバーヘッド削減
4. **接続プーリング**: 接続を使い回す
5. **Atlas Search**: 全文検索は Atlas Search を活用

## 参考リソース

- [MongoDB ドキュメント](https://www.mongodb.com/docs/)
- [Mongoose ドキュメント](https://mongoosejs.com/)
- [MongoDB Atlas](https://www.mongodb.com/atlas)
