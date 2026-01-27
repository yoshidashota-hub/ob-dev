# 第4章: CRUD 操作

## Create（作成）

### 単一レコード

```typescript
const user = await prisma.user.create({
  data: {
    email: "test@example.com",
    name: "Test User",
  },
});
```

### リレーションと一緒に作成

```typescript
// ネストした作成
const userWithProfile = await prisma.user.create({
  data: {
    email: "test@example.com",
    name: "Test User",
    profile: {
      create: {
        bio: "Hello, World!",
      },
    },
    posts: {
      create: [
        { title: "First Post" },
        { title: "Second Post" },
      ],
    },
  },
  include: {
    profile: true,
    posts: true,
  },
});
```

### 複数レコード

```typescript
// createMany
const count = await prisma.user.createMany({
  data: [
    { email: "user1@example.com", name: "User 1" },
    { email: "user2@example.com", name: "User 2" },
    { email: "user3@example.com", name: "User 3" },
  ],
  skipDuplicates: true,  // ユニーク制約違反をスキップ
});

console.log(`Created ${count.count} users`);
```

### createManyAndReturn（PostgreSQL）

```typescript
const users = await prisma.user.createManyAndReturn({
  data: [
    { email: "user1@example.com" },
    { email: "user2@example.com" },
  ],
});
// 作成されたレコードが返される
```

## Read（読み取り）

### 単一レコード

```typescript
// findUnique - ユニークフィールドで検索
const user = await prisma.user.findUnique({
  where: { id: 1 },
});

const userByEmail = await prisma.user.findUnique({
  where: { email: "test@example.com" },
});

// findUniqueOrThrow - 見つからない場合は例外
const user = await prisma.user.findUniqueOrThrow({
  where: { id: 1 },
});

// findFirst - 最初の1件
const user = await prisma.user.findFirst({
  where: { role: "ADMIN" },
});
```

### 複数レコード

```typescript
// 全件取得
const users = await prisma.user.findMany();

// 条件付き
const admins = await prisma.user.findMany({
  where: { role: "ADMIN" },
});
```

### select（フィールド選択）

```typescript
const user = await prisma.user.findUnique({
  where: { id: 1 },
  select: {
    id: true,
    email: true,
    name: true,
    // password: false, // 除外
  },
});
```

### include（リレーション読み込み）

```typescript
const user = await prisma.user.findUnique({
  where: { id: 1 },
  include: {
    profile: true,
    posts: true,
  },
});

// ネストした include
const user = await prisma.user.findUnique({
  where: { id: 1 },
  include: {
    posts: {
      include: {
        tags: true,
      },
    },
  },
});

// select と組み合わせ
const user = await prisma.user.findUnique({
  where: { id: 1 },
  select: {
    email: true,
    posts: {
      select: {
        title: true,
      },
    },
  },
});
```

## Update（更新）

### 単一レコード

```typescript
const user = await prisma.user.update({
  where: { id: 1 },
  data: {
    name: "Updated Name",
  },
});
```

### 数値操作

```typescript
const post = await prisma.post.update({
  where: { id: 1 },
  data: {
    viewCount: { increment: 1 },
    // viewCount: { decrement: 1 },
    // viewCount: { multiply: 2 },
    // viewCount: { divide: 2 },
  },
});
```

### リレーションの更新

```typescript
// 既存のリレーションに接続
const post = await prisma.post.update({
  where: { id: 1 },
  data: {
    tags: {
      connect: [{ id: 1 }, { id: 2 }],
    },
  },
});

// リレーションを切断
const post = await prisma.post.update({
  where: { id: 1 },
  data: {
    tags: {
      disconnect: [{ id: 1 }],
    },
  },
});

// set: 既存を全て置き換え
const post = await prisma.post.update({
  where: { id: 1 },
  data: {
    tags: {
      set: [{ id: 3 }, { id: 4 }],
    },
  },
});
```

### 複数レコード

```typescript
const count = await prisma.user.updateMany({
  where: { role: "USER" },
  data: { isActive: false },
});

console.log(`Updated ${count.count} users`);
```

### upsert（存在すれば更新、なければ作成）

```typescript
const user = await prisma.user.upsert({
  where: { email: "test@example.com" },
  update: {
    name: "Updated Name",
  },
  create: {
    email: "test@example.com",
    name: "New User",
  },
});
```

## Delete（削除）

### 単一レコード

```typescript
const user = await prisma.user.delete({
  where: { id: 1 },
});
```

### 複数レコード

```typescript
const count = await prisma.user.deleteMany({
  where: { isActive: false },
});

// 全削除
const count = await prisma.user.deleteMany();
```

### カスケード削除

```prisma
model User {
  id      Int       @id @default(autoincrement())
  posts   Post[]
}

model Post {
  id       Int  @id @default(autoincrement())
  author   User @relation(fields: [authorId], references: [id], onDelete: Cascade)
  authorId Int
}
```

## 集計

### count

```typescript
const userCount = await prisma.user.count();

const activeCount = await prisma.user.count({
  where: { isActive: true },
});
```

### aggregate

```typescript
const stats = await prisma.product.aggregate({
  _avg: { price: true },
  _sum: { price: true },
  _min: { price: true },
  _max: { price: true },
  _count: true,
});
```

### groupBy

```typescript
const groupedUsers = await prisma.user.groupBy({
  by: ["role"],
  _count: { id: true },
  _avg: { age: true },
  orderBy: {
    _count: { id: "desc" },
  },
});
// [{ role: "ADMIN", _count: { id: 5 }, _avg: { age: 35 } }, ...]
```

## 実践的なパターン

### ページネーション

```typescript
// オフセットベース
const users = await prisma.user.findMany({
  skip: 10,
  take: 10,
});

// カーソルベース
const users = await prisma.user.findMany({
  take: 10,
  cursor: { id: lastUserId },
  skip: 1,  // カーソル自体をスキップ
});
```

### ソート

```typescript
const users = await prisma.user.findMany({
  orderBy: [
    { role: "asc" },
    { createdAt: "desc" },
  ],
});
```

### 存在確認

```typescript
const exists = await prisma.user.findFirst({
  where: { email: "test@example.com" },
  select: { id: true },
});

if (exists) {
  // 存在する
}
```

## 次のステップ

次章では、クエリのフィルタリングについて詳しく学びます。
