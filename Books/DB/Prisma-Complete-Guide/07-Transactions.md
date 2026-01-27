# 第7章: トランザクション

## トランザクションとは

複数の操作をアトミック（全て成功または全て失敗）に実行する仕組み。

```
┌─────────────────────────────────────────────────────┐
│                 Transaction                          │
│                                                     │
│  ┌─────────┐   ┌─────────┐   ┌─────────┐          │
│  │ Query 1 │──▶│ Query 2 │──▶│ Query 3 │          │
│  └─────────┘   └─────────┘   └─────────┘          │
│       │             │             │                 │
│       └─────────────┴─────────────┘                 │
│                     │                               │
│               ┌─────┴─────┐                         │
│               │           │                         │
│           Success      Failure                      │
│           (Commit)    (Rollback)                    │
└─────────────────────────────────────────────────────┘
```

## インタラクティブトランザクション

### 基本

```typescript
const result = await prisma.$transaction(async (tx) => {
  // tx は PrismaClient のサブセット
  const user = await tx.user.create({
    data: { email: "test@example.com" },
  });

  const post = await tx.post.create({
    data: {
      title: "First Post",
      authorId: user.id,
    },
  });

  return { user, post };
});

// エラーが発生した場合は自動ロールバック
```

### エラーハンドリング

```typescript
try {
  const result = await prisma.$transaction(async (tx) => {
    await tx.account.update({
      where: { id: fromAccountId },
      data: { balance: { decrement: amount } },
    });

    // 残高チェック
    const fromAccount = await tx.account.findUnique({
      where: { id: fromAccountId },
    });

    if (fromAccount!.balance < 0) {
      throw new Error("Insufficient balance");
    }

    await tx.account.update({
      where: { id: toAccountId },
      data: { balance: { increment: amount } },
    });

    return { success: true };
  });
} catch (error) {
  // トランザクション失敗、全てロールバック済み
  console.error("Transaction failed:", error);
}
```

### オプション

```typescript
const result = await prisma.$transaction(
  async (tx) => {
    // 処理
  },
  {
    maxWait: 5000,   // トランザクション開始までの最大待機時間
    timeout: 10000,  // トランザクションの最大実行時間
    isolationLevel: "Serializable",  // 分離レベル
  },
);
```

### 分離レベル

```typescript
type IsolationLevel =
  | "ReadUncommitted"
  | "ReadCommitted"
  | "RepeatableRead"
  | "Serializable";
```

## シーケンシャルトランザクション

複数のクエリを順番に実行。

```typescript
// 配列で渡す
const [users, posts] = await prisma.$transaction([
  prisma.user.findMany(),
  prisma.post.findMany(),
]);

// 条件付き
const results = await prisma.$transaction([
  prisma.user.count({ where: { isActive: true } }),
  prisma.post.count({ where: { status: "PUBLISHED" } }),
  prisma.comment.count(),
]);

const [activeUsers, publishedPosts, totalComments] = results;
```

## 実践的なパターン

### 送金処理

```typescript
async function transfer(
  fromId: number,
  toId: number,
  amount: number,
) {
  return await prisma.$transaction(async (tx) => {
    // 送金元から引き落とし
    const from = await tx.account.update({
      where: { id: fromId },
      data: { balance: { decrement: amount } },
    });

    // 残高チェック
    if (from.balance < 0) {
      throw new Error("Insufficient balance");
    }

    // 送金先に入金
    const to = await tx.account.update({
      where: { id: toId },
      data: { balance: { increment: amount } },
    });

    // 取引記録
    await tx.transaction.create({
      data: {
        fromAccountId: fromId,
        toAccountId: toId,
        amount,
        type: "TRANSFER",
      },
    });

    return { from, to };
  });
}
```

### 在庫管理

```typescript
async function purchaseItem(
  userId: number,
  productId: number,
  quantity: number,
) {
  return await prisma.$transaction(async (tx) => {
    // 商品情報を取得（ロック）
    const product = await tx.product.findUnique({
      where: { id: productId },
    });

    if (!product) {
      throw new Error("Product not found");
    }

    // 在庫チェック
    if (product.stock < quantity) {
      throw new Error("Insufficient stock");
    }

    // 在庫を減らす
    await tx.product.update({
      where: { id: productId },
      data: { stock: { decrement: quantity } },
    });

    // 注文を作成
    const order = await tx.order.create({
      data: {
        userId,
        items: {
          create: {
            productId,
            quantity,
            price: product.price,
          },
        },
        total: product.price * quantity,
      },
    });

    return order;
  });
}
```

### バルク操作

```typescript
async function processUsers(userIds: number[]) {
  return await prisma.$transaction(
    userIds.map((id) =>
      prisma.user.update({
        where: { id },
        data: { processedAt: new Date() },
      }),
    ),
  );
}
```

### 楽観的ロック

```typescript
async function updateWithVersion(
  id: number,
  data: any,
  expectedVersion: number,
) {
  const result = await prisma.record.updateMany({
    where: {
      id,
      version: expectedVersion,  // バージョンチェック
    },
    data: {
      ...data,
      version: { increment: 1 },
    },
  });

  if (result.count === 0) {
    throw new Error("Concurrent modification detected");
  }

  return result;
}
```

## ネストした操作

```typescript
const result = await prisma.$transaction(async (tx) => {
  // ユーザー作成
  const user = await tx.user.create({
    data: {
      email: "test@example.com",
      profile: {
        create: { bio: "Hello!" },
      },
      posts: {
        create: [
          {
            title: "Post 1",
            tags: {
              connectOrCreate: [
                {
                  where: { name: "typescript" },
                  create: { name: "typescript" },
                },
              ],
            },
          },
        ],
      },
    },
    include: {
      profile: true,
      posts: { include: { tags: true } },
    },
  });

  // 追加の処理
  await tx.auditLog.create({
    data: {
      action: "USER_CREATED",
      userId: user.id,
    },
  });

  return user;
});
```

## トランザクションの注意点

### タイムアウト

```typescript
// 長時間のトランザクションは避ける
const result = await prisma.$transaction(
  async (tx) => {
    // 重い処理は外で行う
    const processedData = await heavyProcessing();

    // DB操作のみトランザクション内で
    return await tx.record.createMany({
      data: processedData,
    });
  },
  { timeout: 30000 },  // 30秒
);
```

### デッドロック回避

```typescript
// 常に同じ順序でレコードをロック
const result = await prisma.$transaction(async (tx) => {
  const ids = [3, 1, 2].sort();  // ソート

  for (const id of ids) {
    await tx.record.update({
      where: { id },
      data: { /* ... */ },
    });
  }
});
```

## 次のステップ

次章では、型安全性と TypeScript 統合について学びます。
