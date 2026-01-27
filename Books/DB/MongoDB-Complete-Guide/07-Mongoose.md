# 第7章: Mongoose

## 概要

Mongoose は MongoDB の ODM（Object Document Mapper）。スキーマ定義、バリデーション、ミドルウェアなどを提供。

```
┌─────────────────────────────────────────────────────┐
│                    Mongoose                          │
│                                                     │
│  TypeScript/JavaScript                              │
│        ↓                                            │
│  ┌─────────────┐                                   │
│  │   Schema    │ ← 構造定義、バリデーション         │
│  └──────┬──────┘                                   │
│         ↓                                           │
│  ┌─────────────┐                                   │
│  │    Model    │ ← CRUD操作、クエリ                │
│  └──────┬──────┘                                   │
│         ↓                                           │
│  ┌─────────────┐                                   │
│  │  Document   │ ← インスタンス、メソッド           │
│  └──────┬──────┘                                   │
│         ↓                                           │
│     MongoDB                                         │
└─────────────────────────────────────────────────────┘
```

## セットアップ

```bash
npm install mongoose
```

```typescript
// lib/mongoose.ts
import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI!;

if (!MONGODB_URI) {
  throw new Error("MONGODB_URI が設定されていません");
}

let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

async function dbConnect(): Promise<typeof mongoose> {
  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
    };

    cached.promise = mongoose.connect(MONGODB_URI, opts).then((mongoose) => {
      return mongoose;
    });
  }

  cached.conn = await cached.promise;
  return cached.conn;
}

export default dbConnect;
```

```typescript
// types/global.d.ts
import mongoose from "mongoose";

declare global {
  var mongoose: {
    conn: typeof mongoose | null;
    promise: Promise<typeof mongoose> | null;
  };
}
```

## スキーマ定義

### 基本

```typescript
// models/User.ts
import mongoose, { Schema, Document, Model } from "mongoose";

// ドキュメントの型
interface IUser extends Document {
  name: string;
  email: string;
  age?: number;
  status: "active" | "inactive";
  tags: string[];
  profile?: {
    bio: string;
    website?: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

// スキーマ定義
const userSchema = new Schema<IUser>(
  {
    name: {
      type: String,
      required: [true, "名前は必須です"],
      trim: true,
      minlength: [2, "名前は2文字以上です"],
      maxlength: [50, "名前は50文字以内です"],
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      match: [/^\S+@\S+\.\S+$/, "有効なメールアドレスを入力してください"],
    },
    age: {
      type: Number,
      min: [0, "年齢は0以上です"],
      max: [150, "年齢は150以下です"],
    },
    status: {
      type: String,
      enum: ["active", "inactive"],
      default: "active",
    },
    tags: [{ type: String, trim: true }],
    profile: {
      bio: { type: String, maxlength: 500 },
      website: String,
    },
  },
  {
    timestamps: true, // createdAt, updatedAt を自動管理
  },
);

// モデル作成（ホットリロード対策）
const User: Model<IUser> =
  mongoose.models.User || mongoose.model<IUser>("User", userSchema);

export default User;
```

### SchemaTypes

```typescript
// 利用可能な型
{
  stringField: String,
  numberField: Number,
  booleanField: Boolean,
  dateField: Date,
  bufferField: Buffer,
  objectIdField: Schema.Types.ObjectId,
  arrayField: [String],
  mixedField: Schema.Types.Mixed,    // 任意の型
  decimalField: Schema.Types.Decimal128,
  mapField: Map,
  bigintField: BigInt,
}

// 参照
{
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}
```

### バリデーション

```typescript
const productSchema = new Schema({
  name: {
    type: String,
    required: [true, "商品名は必須です"],
    minlength: [3, "商品名は3文字以上です"],
    maxlength: [100, "商品名は100文字以内です"],
  },
  price: {
    type: Number,
    required: true,
    min: [0, "価格は0以上です"],
    validate: {
      validator: (v: number) => v % 1 === 0,
      message: "価格は整数である必要があります",
    },
  },
  sku: {
    type: String,
    required: true,
    unique: true,
    match: [/^[A-Z]{3}-\d{4}$/, "SKU形式: AAA-0000"],
  },
  email: {
    type: String,
    validate: {
      validator: async function (email: string) {
        const count = await mongoose.models.Product.countDocuments({ email });
        return count === 0;
      },
      message: "このメールは既に使用されています",
    },
  },
});
```

## CRUD 操作

### Create

```typescript
// 単一作成
const user = new User({
  name: "田中太郎",
  email: "tanaka@example.com",
});
await user.save();

// または
const user = await User.create({
  name: "田中太郎",
  email: "tanaka@example.com",
});

// 複数作成
const users = await User.insertMany([
  { name: "山田", email: "yamada@example.com" },
  { name: "鈴木", email: "suzuki@example.com" },
]);
```

### Read

```typescript
// 全件取得
const users = await User.find();

// 条件付き
const activeUsers = await User.find({ status: "active" });

// 1件取得
const user = await User.findById(id);
const user = await User.findOne({ email: "tanaka@example.com" });

// プロジェクション
const users = await User.find({}, "name email"); // 含める
const users = await User.find({}, "-password"); // 除外

// ソート・ページネーション
const users = await User.find().sort({ createdAt: -1 }).skip(20).limit(10);

// lean()（プレーンオブジェクトを返す、高速）
const users = await User.find().lean();
```

### Update

```typescript
// 1件更新
await User.findByIdAndUpdate(
  id,
  { name: "新しい名前" },
  { new: true, runValidators: true },
);

await User.updateOne(
  { email: "tanaka@example.com" },
  { $set: { status: "inactive" } },
);

// 複数更新
await User.updateMany({ status: "inactive" }, { $set: { status: "archived" } });

// ドキュメント経由
const user = await User.findById(id);
user.name = "新しい名前";
await user.save(); // バリデーション実行
```

### Delete

```typescript
// 1件削除
await User.findByIdAndDelete(id);
await User.deleteOne({ email: "tanaka@example.com" });

// 複数削除
await User.deleteMany({ status: "deleted" });
```

## インデックス

```typescript
const userSchema = new Schema({
  email: { type: String, unique: true }, // 一意インデックス
  name: { type: String, index: true }, // 単一インデックス
});

// 複合インデックス
userSchema.index({ status: 1, createdAt: -1 });

// テキストインデックス
userSchema.index({ name: "text", bio: "text" });

// 部分インデックス
userSchema.index(
  { email: 1 },
  { partialFilterExpression: { status: "active" } },
);

// TTL インデックス
userSchema.index({ expireAt: 1 }, { expireAfterSeconds: 0 });
```

## メソッドとスタティック

### インスタンスメソッド

```typescript
interface IUser extends Document {
  name: string;
  email: string;
  // メソッドの型定義
  getFullName(): string;
  comparePassword(password: string): Promise<boolean>;
}

userSchema.methods.getFullName = function (): string {
  return `${this.firstName} ${this.lastName}`;
};

userSchema.methods.comparePassword = async function (
  password: string,
): Promise<boolean> {
  return bcrypt.compare(password, this.password);
};

// 使用
const user = await User.findById(id);
const isMatch = await user.comparePassword("password123");
```

### スタティックメソッド

```typescript
interface IUserModel extends Model<IUser> {
  findByEmail(email: string): Promise<IUser | null>;
  findActive(): Promise<IUser[]>;
}

userSchema.statics.findByEmail = function (email: string) {
  return this.findOne({ email });
};

userSchema.statics.findActive = function () {
  return this.find({ status: "active" });
};

const User = mongoose.model<IUser, IUserModel>("User", userSchema);

// 使用
const user = await User.findByEmail("tanaka@example.com");
const activeUsers = await User.findActive();
```

### 仮想フィールド（Virtual）

```typescript
userSchema.virtual("fullName").get(function () {
  return `${this.firstName} ${this.lastName}`;
});

userSchema.virtual("fullName").set(function (name: string) {
  const [firstName, lastName] = name.split(" ");
  this.firstName = firstName;
  this.lastName = lastName;
});

// JSON に含める
userSchema.set("toJSON", { virtuals: true });
userSchema.set("toObject", { virtuals: true });
```

## ミドルウェア（Hooks）

### Pre ミドルウェア

```typescript
// save 前
userSchema.pre("save", async function (next) {
  if (this.isModified("password")) {
    this.password = await bcrypt.hash(this.password, 10);
  }
  next();
});

// find 前
userSchema.pre("find", function (next) {
  // デフォルトで削除済みを除外
  this.where({ deletedAt: { $exists: false } });
  next();
});

// deleteOne 前
userSchema.pre("deleteOne", { document: true }, async function (next) {
  // 関連データを削除
  await Comment.deleteMany({ userId: this._id });
  next();
});
```

### Post ミドルウェア

```typescript
// save 後
userSchema.post("save", function (doc) {
  console.log(`ユーザー ${doc.name} が保存されました`);
});

// エラーハンドリング
userSchema.post("save", function (error, doc, next) {
  if (error.name === "MongoServerError" && error.code === 11000) {
    next(new Error("メールアドレスは既に使用されています"));
  } else {
    next(error);
  }
});
```

## Population（参照の解決）

```typescript
// スキーマ
const postSchema = new Schema({
  title: String,
  content: String,
  author: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  comments: [
    {
      type: Schema.Types.ObjectId,
      ref: "Comment",
    },
  ],
});

// 使用
const post = await Post.findById(id)
  .populate("author", "name email") // フィールド指定
  .populate({
    path: "comments",
    populate: {
      // ネストした populate
      path: "author",
      select: "name",
    },
  });

// 条件付き populate
const posts = await Post.find().populate({
  path: "comments",
  match: { status: "approved" },
  options: { sort: { createdAt: -1 }, limit: 5 },
});
```

## クエリビルダー

```typescript
// メソッドチェーン
const users = await User.find()
  .where("status")
  .equals("active")
  .where("age")
  .gte(18)
  .lte(65)
  .select("name email")
  .sort("-createdAt")
  .limit(10)
  .lean();

// カスタムクエリヘルパー
userSchema.query.byStatus = function (status: string) {
  return this.where({ status });
};

userSchema.query.active = function () {
  return this.where({ status: "active" });
};

// 使用
const users = await User.find().active().byStatus("premium");
```

## Aggregation

```typescript
const result = await Order.aggregate([
  { $match: { status: "completed" } },
  {
    $group: {
      _id: "$userId",
      totalAmount: { $sum: "$amount" },
      orderCount: { $sum: 1 },
    },
  },
  {
    $lookup: {
      from: "users",
      localField: "_id",
      foreignField: "_id",
      as: "user",
    },
  },
  { $unwind: "$user" },
  { $sort: { totalAmount: -1 } },
  { $limit: 10 },
]);
```

## TypeScript との統合

```typescript
// models/User.ts
import mongoose, { Schema, Document, Model, Types } from "mongoose";

// ドキュメントインターフェース
export interface IUser {
  name: string;
  email: string;
  status: "active" | "inactive";
  createdAt: Date;
  updatedAt: Date;
}

// メソッド
export interface IUserMethods {
  getDisplayName(): string;
}

// スタティック
export interface IUserModel extends Model<IUser, {}, IUserMethods> {
  findByEmail(email: string): Promise<IUser | null>;
}

// スキーマ
const userSchema = new Schema<IUser, IUserModel, IUserMethods>(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    status: { type: String, enum: ["active", "inactive"], default: "active" },
  },
  { timestamps: true },
);

userSchema.methods.getDisplayName = function () {
  return this.name;
};

userSchema.statics.findByEmail = function (email: string) {
  return this.findOne({ email });
};

const User =
  (mongoose.models.User as IUserModel) ||
  mongoose.model<IUser, IUserModel>("User", userSchema);

export default User;
```

## 次のステップ

次章では、MongoDB のトランザクションについて学びます。
