# 第5章: クエリとフィルタリング

## 基本的なフィルタ

### 等価比較

```typescript
// 完全一致
const user = await prisma.user.findMany({
  where: {
    email: "test@example.com",  // equals の省略形
  },
});

// 明示的な equals
const user = await prisma.user.findMany({
  where: {
    email: { equals: "test@example.com" },
  },
});

// 不等価
const users = await prisma.user.findMany({
  where: {
    role: { not: "ADMIN" },
  },
});
```

### 複数条件（AND / OR / NOT）

```typescript
// AND（デフォルト）
const users = await prisma.user.findMany({
  where: {
    email: { contains: "@example.com" },
    isActive: true,
  },
});

// 明示的な AND
const users = await prisma.user.findMany({
  where: {
    AND: [
      { email: { contains: "@example.com" } },
      { isActive: true },
    ],
  },
});

// OR
const users = await prisma.user.findMany({
  where: {
    OR: [
      { email: { contains: "@example.com" } },
      { role: "ADMIN" },
    ],
  },
});

// NOT
const users = await prisma.user.findMany({
  where: {
    NOT: {
      role: "ADMIN",
    },
  },
});

// 組み合わせ
const users = await prisma.user.findMany({
  where: {
    AND: [
      { isActive: true },
      {
        OR: [
          { role: "ADMIN" },
          { role: "MODERATOR" },
        ],
      },
    ],
  },
});
```

## 文字列フィルタ

```typescript
const users = await prisma.user.findMany({
  where: {
    name: {
      // 前方一致
      startsWith: "田中",

      // 後方一致
      endsWith: "太郎",

      // 部分一致
      contains: "中",

      // 大文字小文字を区別しない（PostgreSQL, MySQL）
      contains: "test",
      mode: "insensitive",
    },
  },
});
```

## 数値フィルタ

```typescript
const products = await prisma.product.findMany({
  where: {
    price: {
      // より大きい
      gt: 1000,

      // 以上
      gte: 1000,

      // より小さい
      lt: 5000,

      // 以下
      lte: 5000,
    },
  },
});

// 範囲指定
const products = await prisma.product.findMany({
  where: {
    price: {
      gte: 1000,
      lte: 5000,
    },
  },
});
```

## 日時フィルタ

```typescript
const posts = await prisma.post.findMany({
  where: {
    createdAt: {
      gte: new Date("2024-01-01"),
      lt: new Date("2024-02-01"),
    },
  },
});

// 過去24時間
const recentPosts = await prisma.post.findMany({
  where: {
    createdAt: {
      gte: new Date(Date.now() - 24 * 60 * 60 * 1000),
    },
  },
});
```

## リストフィルタ

```typescript
// in: 値がリストに含まれる
const users = await prisma.user.findMany({
  where: {
    role: { in: ["ADMIN", "MODERATOR"] },
  },
});

// notIn: 値がリストに含まれない
const users = await prisma.user.findMany({
  where: {
    id: { notIn: [1, 2, 3] },
  },
});

// 配列フィールド（PostgreSQL）
const posts = await prisma.post.findMany({
  where: {
    tags: { has: "typescript" },
    // hasSome: ["typescript", "javascript"],
    // hasEvery: ["typescript", "react"],
    // isEmpty: true,
  },
});
```

## NULL チェック

```typescript
// NULL である
const users = await prisma.user.findMany({
  where: {
    name: null,
    // または
    name: { equals: null },
  },
});

// NULL でない
const users = await prisma.user.findMany({
  where: {
    name: { not: null },
  },
});

// isSet（オプショナルフィールド）
const users = await prisma.user.findMany({
  where: {
    name: { isSet: true },
  },
});
```

## リレーションフィルタ

### 関連レコードの条件

```typescript
// 投稿があるユーザー
const users = await prisma.user.findMany({
  where: {
    posts: {
      some: {
        status: "PUBLISHED",
      },
    },
  },
});

// 全ての投稿が公開済みのユーザー
const users = await prisma.user.findMany({
  where: {
    posts: {
      every: {
        status: "PUBLISHED",
      },
    },
  },
});

// 投稿がないユーザー
const users = await prisma.user.findMany({
  where: {
    posts: {
      none: {},
    },
  },
});
```

### 関連レコードの数

```typescript
// 投稿が5件以上のユーザー
const users = await prisma.user.findMany({
  where: {
    posts: {
      some: {},
    },
  },
  include: {
    _count: {
      select: { posts: true },
    },
  },
  having: {
    posts: {
      _count: { gte: 5 },
    },
  },
});
```

### ネストしたフィルタ

```typescript
// 特定のタグを持つ投稿の著者
const users = await prisma.user.findMany({
  where: {
    posts: {
      some: {
        tags: {
          some: {
            name: "typescript",
          },
        },
      },
    },
  },
});
```

## ソート

```typescript
// 単一フィールド
const users = await prisma.user.findMany({
  orderBy: { createdAt: "desc" },
});

// 複数フィールド
const users = await prisma.user.findMany({
  orderBy: [
    { role: "asc" },
    { createdAt: "desc" },
  ],
});

// リレーションでソート
const users = await prisma.user.findMany({
  orderBy: {
    posts: { _count: "desc" },
  },
});

// NULL の位置
const users = await prisma.user.findMany({
  orderBy: {
    name: { sort: "asc", nulls: "last" },
  },
});
```

## ページネーション

### オフセットベース

```typescript
const page = 2;
const pageSize = 10;

const users = await prisma.user.findMany({
  skip: (page - 1) * pageSize,
  take: pageSize,
  orderBy: { createdAt: "desc" },
});
```

### カーソルベース

```typescript
const users = await prisma.user.findMany({
  take: 10,
  cursor: { id: lastUserId },
  skip: 1,  // カーソル自体をスキップ
  orderBy: { id: "asc" },
});
```

### ページネーションヘルパー

```typescript
async function paginate<T>(
  model: any,
  options: {
    page?: number;
    pageSize?: number;
    where?: any;
    orderBy?: any;
  },
) {
  const page = options.page || 1;
  const pageSize = options.pageSize || 10;

  const [data, total] = await Promise.all([
    model.findMany({
      where: options.where,
      orderBy: options.orderBy,
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    model.count({ where: options.where }),
  ]);

  return {
    data,
    meta: {
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    },
  };
}

// 使用例
const result = await paginate(prisma.user, {
  page: 2,
  pageSize: 20,
  where: { isActive: true },
  orderBy: { createdAt: "desc" },
});
```

## 次のステップ

次章では、リレーションの詳細について学びます。
