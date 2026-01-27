# MongoDB サンプル集

## 接続設定

```typescript
// lib/mongodb.ts (Native Driver)
import { MongoClient, Db } from 'mongodb';

const uri = process.env.MONGODB_URI!;
let client: MongoClient;
let clientPromise: Promise<MongoClient>;

if (process.env.NODE_ENV === 'development') {
  const globalWithMongo = global as typeof globalThis & {
    _mongoClientPromise?: Promise<MongoClient>;
  };
  if (!globalWithMongo._mongoClientPromise) {
    client = new MongoClient(uri);
    globalWithMongo._mongoClientPromise = client.connect();
  }
  clientPromise = globalWithMongo._mongoClientPromise;
} else {
  client = new MongoClient(uri);
  clientPromise = client.connect();
}

export default clientPromise;

export async function getDb(): Promise<Db> {
  const client = await clientPromise;
  return client.db('myapp');
}
```

## Mongoose スキーマ

```typescript
// models/User.ts
import mongoose, { Schema, Document } from 'mongoose';

export interface IUser extends Document {
  email: string;
  name: string;
  password: string;
  role: 'user' | 'admin';
  profile: {
    bio?: string;
    avatar?: string;
    social?: {
      twitter?: string;
      github?: string;
    };
  };
  posts: mongoose.Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<IUser>(
  {
    email: { type: String, required: true, unique: true, lowercase: true },
    name: { type: String, required: true },
    password: { type: String, required: true, select: false },
    role: { type: String, enum: ['user', 'admin'], default: 'user' },
    profile: {
      bio: String,
      avatar: String,
      social: {
        twitter: String,
        github: String,
      },
    },
    posts: [{ type: Schema.Types.ObjectId, ref: 'Post' }],
  },
  { timestamps: true }
);

userSchema.index({ email: 1 });
userSchema.index({ 'profile.social.twitter': 1 }, { sparse: true });

export const User = mongoose.models.User || mongoose.model<IUser>('User', userSchema);
```

## CRUD 操作

```typescript
// Create
const user = await User.create({
  email: 'user@example.com',
  name: 'John',
  password: hashedPassword,
  profile: { bio: 'Hello!' },
});

// Read
const user = await User.findById(id);
const user = await User.findOne({ email: 'user@example.com' });
const users = await User.find({ role: 'user' })
  .select('name email profile')
  .sort({ createdAt: -1 })
  .limit(10)
  .lean();

// Update
await User.findByIdAndUpdate(id, { name: 'Jane' }, { new: true });
await User.updateOne(
  { _id: id },
  { $set: { 'profile.bio': 'Updated bio' } }
);

// Delete
await User.findByIdAndDelete(id);
await User.deleteMany({ role: 'guest' });
```

## 複雑なクエリ

```typescript
// OR / AND 条件
const users = await User.find({
  $or: [
    { email: { $regex: /admin/i } },
    { role: 'admin' },
  ],
  $and: [
    { createdAt: { $gte: new Date('2024-01-01') } },
    { 'profile.bio': { $exists: true } },
  ],
});

// 配列クエリ
const posts = await Post.find({
  tags: { $all: ['typescript', 'mongodb'] },
  'comments.0': { $exists: true }, // コメントが1つ以上
});

// 埋め込みドキュメント
const users = await User.find({
  'profile.social.twitter': { $exists: true, $ne: '' },
});
```

## Aggregation Pipeline

```typescript
// ユーザーごとの投稿数
const stats = await User.aggregate([
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
  { $sort: { postCount: -1 } },
  { $limit: 10 },
]);

// 月別集計
const monthlyStats = await Post.aggregate([
  {
    $match: {
      createdAt: { $gte: new Date('2024-01-01') },
    },
  },
  {
    $group: {
      _id: {
        year: { $year: '$createdAt' },
        month: { $month: '$createdAt' },
      },
      count: { $sum: 1 },
      views: { $sum: '$views' },
    },
  },
  { $sort: { '_id.year': 1, '_id.month': 1 } },
]);
```

## トランザクション

```typescript
const session = await mongoose.startSession();

try {
  await session.withTransaction(async () => {
    const user = await User.create([{ email: 'new@example.com', name: 'New' }], { session });
    
    await Post.create([{
      title: 'Welcome Post',
      authorId: user[0]._id,
    }], { session });

    await User.findByIdAndUpdate(
      user[0]._id,
      { $inc: { postCount: 1 } },
      { session }
    );
  });
} finally {
  await session.endSession();
}
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
  const search = searchParams.get('search');

  const query = search
    ? {
        $or: [
          { name: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } },
        ],
      }
    : {};

  const [users, total] = await Promise.all([
    User.find(query)
      .select('-password')
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    User.countDocuments(query),
  ]);

  return Response.json({
    data: users,
    meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
  });
}

export async function POST(req: Request) {
  await connectDB();
  const body = await req.json();

  const user = await User.create(body);

  return Response.json({ data: user }, { status: 201 });
}
```

## インデックス管理

```typescript
// 複合インデックス
userSchema.index({ email: 1, createdAt: -1 });

// テキストインデックス（検索用）
postSchema.index({ title: 'text', content: 'text' });

// TTL インデックス（自動削除）
sessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// 部分インデックス
userSchema.index(
  { email: 1 },
  { partialFilterExpression: { status: 'active' } }
);
```
