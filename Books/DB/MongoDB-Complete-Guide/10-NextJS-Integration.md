# 第10章: Next.js 統合

## プロジェクトセットアップ

```bash
# 新規プロジェクト作成
npx create-next-app@latest my-app --typescript

# 依存関係インストール
npm install mongodb
# または Mongoose
npm install mongoose
```

```env
# .env.local
MONGODB_URI=mongodb+srv://user:password@cluster.xxxxx.mongodb.net/mydb?retryWrites=true&w=majority
```

## 接続設定

### MongoDB Driver

```typescript
// lib/mongodb.ts
import { MongoClient, Db } from "mongodb";

if (!process.env.MONGODB_URI) {
  throw new Error("MONGODB_URI が設定されていません");
}

const uri = process.env.MONGODB_URI;
const options = {};

let client: MongoClient;
let clientPromise: Promise<MongoClient>;

declare global {
  var _mongoClientPromise: Promise<MongoClient> | undefined;
}

if (process.env.NODE_ENV === "development") {
  // 開発環境: ホットリロードで再接続を防ぐ
  if (!global._mongoClientPromise) {
    client = new MongoClient(uri, options);
    global._mongoClientPromise = client.connect();
  }
  clientPromise = global._mongoClientPromise;
} else {
  // 本番環境
  client = new MongoClient(uri, options);
  clientPromise = client.connect();
}

export default clientPromise;

// ヘルパー関数
export async function getDb(): Promise<Db> {
  const client = await clientPromise;
  return client.db();
}
```

### Mongoose

```typescript
// lib/mongoose.ts
import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI!;

if (!MONGODB_URI) {
  throw new Error("MONGODB_URI が設定されていません");
}

interface Cached {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

declare global {
  var mongoose: Cached | undefined;
}

let cached: Cached = global.mongoose || { conn: null, promise: null };

if (!global.mongoose) {
  global.mongoose = cached;
}

async function dbConnect(): Promise<typeof mongoose> {
  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    cached.promise = mongoose.connect(MONGODB_URI, {
      bufferCommands: false,
    });
  }

  cached.conn = await cached.promise;
  return cached.conn;
}

export default dbConnect;
```

## App Router パターン

### Server Components

```typescript
// app/users/page.tsx
import { getDb } from '@/lib/mongodb';

interface User {
  _id: string;
  name: string;
  email: string;
}

export default async function UsersPage() {
  const db = await getDb();
  const users = await db
    .collection<User>('users')
    .find({})
    .sort({ createdAt: -1 })
    .limit(10)
    .toArray();

  return (
    <div>
      <h1>ユーザー一覧</h1>
      <ul>
        {users.map((user) => (
          <li key={user._id.toString()}>
            {user.name} ({user.email})
          </li>
        ))}
      </ul>
    </div>
  );
}
```

### 動的ルート

```typescript
// app/users/[id]/page.tsx
import { getDb } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import { notFound } from 'next/navigation';

interface Props {
  params: { id: string };
}

export default async function UserPage({ params }: Props) {
  const db = await getDb();

  let user;
  try {
    user = await db
      .collection('users')
      .findOne({ _id: new ObjectId(params.id) });
  } catch {
    notFound();
  }

  if (!user) {
    notFound();
  }

  return (
    <div>
      <h1>{user.name}</h1>
      <p>{user.email}</p>
    </div>
  );
}

// 静的生成用のパス
export async function generateStaticParams() {
  const db = await getDb();
  const users = await db
    .collection('users')
    .find({}, { projection: { _id: 1 } })
    .limit(100)
    .toArray();

  return users.map((user) => ({
    id: user._id.toString(),
  }));
}
```

### Server Actions

```typescript
// app/users/actions.ts
"use server";

import { revalidatePath } from "next/cache";
import { getDb } from "@/lib/mongodb";
import { ObjectId } from "mongodb";

export async function createUser(formData: FormData) {
  const db = await getDb();

  const name = formData.get("name") as string;
  const email = formData.get("email") as string;

  // バリデーション
  if (!name || !email) {
    return { error: "名前とメールアドレスは必須です" };
  }

  try {
    const result = await db.collection("users").insertOne({
      name,
      email,
      createdAt: new Date(),
    });

    revalidatePath("/users");

    return { success: true, id: result.insertedId.toString() };
  } catch (error: any) {
    if (error.code === 11000) {
      return { error: "このメールアドレスは既に使用されています" };
    }
    throw error;
  }
}

export async function updateUser(id: string, formData: FormData) {
  const db = await getDb();

  const name = formData.get("name") as string;

  await db.collection("users").updateOne(
    { _id: new ObjectId(id) },
    {
      $set: { name, updatedAt: new Date() },
    },
  );

  revalidatePath("/users");
  revalidatePath(`/users/${id}`);
}

export async function deleteUser(id: string) {
  const db = await getDb();

  await db.collection("users").deleteOne({ _id: new ObjectId(id) });

  revalidatePath("/users");
}
```

```typescript
// app/users/new/page.tsx
import { createUser } from '../actions';

export default function NewUserPage() {
  return (
    <form action={createUser}>
      <input type="text" name="name" placeholder="名前" required />
      <input type="email" name="email" placeholder="メール" required />
      <button type="submit">作成</button>
    </form>
  );
}
```

### Route Handlers (API Routes)

```typescript
// app/api/users/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "10");

  const db = await getDb();

  const [users, total] = await Promise.all([
    db
      .collection("users")
      .find({})
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .toArray(),
    db.collection("users").countDocuments(),
  ]);

  return NextResponse.json({
    users,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  });
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { name, email } = body;

  if (!name || !email) {
    return NextResponse.json(
      { error: "名前とメールアドレスは必須です" },
      { status: 400 },
    );
  }

  const db = await getDb();

  try {
    const result = await db.collection("users").insertOne({
      name,
      email,
      createdAt: new Date(),
    });

    return NextResponse.json({ id: result.insertedId }, { status: 201 });
  } catch (error: any) {
    if (error.code === 11000) {
      return NextResponse.json(
        { error: "メールアドレスは既に使用されています" },
        { status: 409 },
      );
    }
    throw error;
  }
}
```

```typescript
// app/api/users/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import { ObjectId } from "mongodb";

interface Params {
  params: { id: string };
}

export async function GET(request: NextRequest, { params }: Params) {
  const db = await getDb();

  try {
    const user = await db
      .collection("users")
      .findOne({ _id: new ObjectId(params.id) });

    if (!user) {
      return NextResponse.json(
        { error: "ユーザーが見つかりません" },
        { status: 404 },
      );
    }

    return NextResponse.json(user);
  } catch {
    return NextResponse.json({ error: "無効なID" }, { status: 400 });
  }
}

export async function PATCH(request: NextRequest, { params }: Params) {
  const body = await request.json();
  const db = await getDb();

  const result = await db.collection("users").updateOne(
    { _id: new ObjectId(params.id) },
    {
      $set: { ...body, updatedAt: new Date() },
    },
  );

  if (result.matchedCount === 0) {
    return NextResponse.json(
      { error: "ユーザーが見つかりません" },
      { status: 404 },
    );
  }

  return NextResponse.json({ success: true });
}

export async function DELETE(request: NextRequest, { params }: Params) {
  const db = await getDb();

  const result = await db
    .collection("users")
    .deleteOne({ _id: new ObjectId(params.id) });

  if (result.deletedCount === 0) {
    return NextResponse.json(
      { error: "ユーザーが見つかりません" },
      { status: 404 },
    );
  }

  return NextResponse.json({ success: true });
}
```

## データ取得パターン

### キャッシュ戦略

```typescript
// app/products/page.tsx
import { getDb } from '@/lib/mongodb';
import { unstable_cache } from 'next/cache';

// キャッシュ付きデータ取得
const getProducts = unstable_cache(
  async () => {
    const db = await getDb();
    return db.collection('products').find({}).toArray();
  },
  ['products'],
  {
    tags: ['products'],
    revalidate: 60, // 60秒
  }
);

export default async function ProductsPage() {
  const products = await getProducts();

  return (
    <ul>
      {products.map((product) => (
        <li key={product._id.toString()}>{product.name}</li>
      ))}
    </ul>
  );
}
```

### 並列データ取得

```typescript
// app/dashboard/page.tsx
import { getDb } from '@/lib/mongodb';

async function getStats() {
  const db = await getDb();

  const [userCount, orderCount, revenue] = await Promise.all([
    db.collection('users').countDocuments(),
    db.collection('orders').countDocuments({ status: 'completed' }),
    db
      .collection('orders')
      .aggregate([
        { $match: { status: 'completed' } },
        { $group: { _id: null, total: { $sum: '$amount' } } },
      ])
      .toArray(),
  ]);

  return {
    userCount,
    orderCount,
    revenue: revenue[0]?.total || 0,
  };
}

export default async function DashboardPage() {
  const stats = await getStats();

  return (
    <div>
      <h1>ダッシュボード</h1>
      <p>ユーザー数: {stats.userCount}</p>
      <p>注文数: {stats.orderCount}</p>
      <p>売上: ¥{stats.revenue.toLocaleString()}</p>
    </div>
  );
}
```

### ストリーミング

```typescript
// app/feed/page.tsx
import { Suspense } from 'react';

async function RecentPosts() {
  const db = await getDb();
  const posts = await db
    .collection('posts')
    .find({})
    .sort({ createdAt: -1 })
    .limit(10)
    .toArray();

  return (
    <ul>
      {posts.map((post) => (
        <li key={post._id.toString()}>{post.title}</li>
      ))}
    </ul>
  );
}

export default function FeedPage() {
  return (
    <div>
      <h1>フィード</h1>
      <Suspense fallback={<div>読み込み中...</div>}>
        <RecentPosts />
      </Suspense>
    </div>
  );
}
```

## Mongoose + Next.js

### モデル定義

```typescript
// models/User.ts
import mongoose, { Schema, Document, Model } from "mongoose";

export interface IUser extends Document {
  name: string;
  email: string;
  role: "user" | "admin";
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<IUser>(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    role: { type: String, enum: ["user", "admin"], default: "user" },
  },
  { timestamps: true },
);

// ホットリロード対策
const User: Model<IUser> =
  mongoose.models.User || mongoose.model<IUser>("User", userSchema);

export default User;
```

### 使用例

```typescript
// app/users/page.tsx
import dbConnect from '@/lib/mongoose';
import User from '@/models/User';

export default async function UsersPage() {
  await dbConnect();

  const users = await User.find({}).sort({ createdAt: -1 }).limit(10).lean();

  return (
    <ul>
      {users.map((user) => (
        <li key={user._id.toString()}>{user.name}</li>
      ))}
    </ul>
  );
}
```

## エラーハンドリング

```typescript
// app/users/[id]/page.tsx
import { getDb } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import { notFound } from 'next/navigation';

export default async function UserPage({ params }: { params: { id: string } }) {
  const db = await getDb();

  // ObjectId の検証
  if (!ObjectId.isValid(params.id)) {
    notFound();
  }

  const user = await db
    .collection('users')
    .findOne({ _id: new ObjectId(params.id) });

  if (!user) {
    notFound();
  }

  return <div>{user.name}</div>;
}
```

```typescript
// app/error.tsx
'use client';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div>
      <h2>エラーが発生しました</h2>
      <p>{error.message}</p>
      <button onClick={reset}>再試行</button>
    </div>
  );
}
```

## 認証との統合

### NextAuth.js + MongoDB Adapter

```bash
npm install next-auth @auth/mongodb-adapter
```

```typescript
// lib/auth.ts
import NextAuth from "next-auth";
import { MongoDBAdapter } from "@auth/mongodb-adapter";
import clientPromise from "@/lib/mongodb";
import GitHub from "next-auth/providers/github";

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: MongoDBAdapter(clientPromise),
  providers: [
    GitHub({
      clientId: process.env.GITHUB_ID!,
      clientSecret: process.env.GITHUB_SECRET!,
    }),
  ],
});
```

```typescript
// app/api/auth/[...nextauth]/route.ts
import { handlers } from "@/lib/auth";

export const { GET, POST } = handlers;
```

## 型安全なクエリ

```typescript
// types/database.ts
import { ObjectId } from "mongodb";

export interface User {
  _id: ObjectId;
  name: string;
  email: string;
  createdAt: Date;
  updatedAt?: Date;
}

export interface Product {
  _id: ObjectId;
  name: string;
  price: number;
  stock: number;
  category: string;
}

export interface Order {
  _id: ObjectId;
  userId: ObjectId;
  items: Array<{
    productId: ObjectId;
    quantity: number;
    price: number;
  }>;
  total: number;
  status: "pending" | "processing" | "completed" | "cancelled";
  createdAt: Date;
}
```

```typescript
// lib/db.ts
import { getDb as getDbBase } from "./mongodb";
import type { User, Product, Order } from "@/types/database";
import type { Collection } from "mongodb";

export async function getDb() {
  const db = await getDbBase();

  return {
    users: db.collection<User>("users"),
    products: db.collection<Product>("products"),
    orders: db.collection<Order>("orders"),
  };
}

// 使用
const db = await getDb();
const user = await db.users.findOne({ email: "test@example.com" });
// user は User | null 型
```

## デプロイ

### Vercel

```
1. プロジェクトをインポート
2. 環境変数を設定
   - MONGODB_URI
3. デプロイ
```

### 注意点

```typescript
// Vercel のサーバーレス環境では
// 接続プールを適切に管理

const options = {
  maxPoolSize: 10, // 小さめに設定
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
};
```

## まとめ

MongoDB と Next.js の統合では、以下のポイントが重要：

1. **接続管理**: ホットリロード時の再接続防止
2. **Server Components**: 直接データベースアクセス
3. **Server Actions**: フォーム処理
4. **キャッシュ**: unstable_cache で最適化
5. **型安全**: TypeScript で堅牢な開発

これで MongoDB 完全ガイドは終了です。実際のプロジェクトで活用してください！
