# 00 - Introduction

## tRPC とは

tRPC (TypeScript Remote Procedure Call) は、TypeScript で型安全な API を構築するためのフレームワークです。

### 従来の API との違い

```text
REST API
┌─────────────────────────────────────────┐
│  クライアント ←→ サーバー               │
│  型情報なし / 手動で型定義が必要        │
└─────────────────────────────────────────┘

GraphQL
┌─────────────────────────────────────────┐
│  クライアント ←→ サーバー               │
│  スキーマ定義 → コード生成 → 型安全     │
└─────────────────────────────────────────┘

tRPC
┌─────────────────────────────────────────┐
│  クライアント ←→ サーバー               │
│  TypeScript の型がそのまま共有される    │
│  スキーマ定義・コード生成不要           │
└─────────────────────────────────────────┘
```

## tRPC の主な特徴

### 1. 自動的な型安全性

```typescript
// サーバー側
const appRouter = router({
  getUser: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(({ input }) => {
      return { id: input.id, name: "John" };
    }),
});

// クライアント側（自動的に型が推論される）
const user = trpc.getUser.useQuery({ id: "1" });
// user.data の型: { id: string; name: string } | undefined
```

### 2. Zod による入力バリデーション

```typescript
const createUser = publicProcedure
  .input(
    z.object({
      email: z.string().email(),
      name: z.string().min(2),
    })
  )
  .mutation(({ input }) => {
    // input は自動的にバリデーション済み
    return db.user.create({ data: input });
  });
```

### 3. React Query との統合

```typescript
// 自動的にキャッシュ、再検証、楽観的更新をサポート
const { data, isLoading, error } = trpc.getUser.useQuery({ id: "1" });
const mutation = trpc.createUser.useMutation();
```

## なぜ tRPC を学ぶのか

| 観点            | REST | GraphQL    | tRPC   |
| --------------- | ---- | ---------- | ------ |
| 型安全性        | 手動 | コード生成 | 自動   |
| 学習コスト      | 低   | 高         | 中     |
| セットアップ    | 簡単 | 複雑       | 簡単   |
| TypeScript 統合 | 弱い | 中程度     | 最高   |
| バンドルサイズ  | -    | 大きめ     | 小さい |

## tRPC のアーキテクチャ

```text
┌─────────────────────────────────────────────────┐
│                   クライアント                   │
│  ┌─────────────────────────────────────────┐   │
│  │  tRPC Client / React Query Hooks        │   │
│  └─────────────────────────────────────────┘   │
└─────────────────────────────────────────────────┘
                        ↓ HTTP/WebSocket
┌─────────────────────────────────────────────────┐
│                   サーバー                       │
│  ┌─────────────────────────────────────────┐   │
│  │  tRPC Router                            │   │
│  │  ├── Query Procedures                   │   │
│  │  ├── Mutation Procedures                │   │
│  │  └── Subscription Procedures            │   │
│  └─────────────────────────────────────────┘   │
│  ┌─────────────────────────────────────────┐   │
│  │  Middleware / Context                   │   │
│  └─────────────────────────────────────────┘   │
└─────────────────────────────────────────────────┘
```

## このガイドで学ぶこと

### Part 1: 基礎編

- tRPC のセットアップ
- Router と Procedures の定義
- Zod による入力バリデーション

### Part 2: サーバー編

- コンテキストの作成と活用
- ミドルウェアによる認証・認可
- エラーハンドリング

### Part 3: クライアント編

- React クライアントのセットアップ
- React Query との統合
- リアルタイム通信（Subscriptions）

### Part 4: フレームワーク統合編

- Next.js App Router との統合
- Next.js Pages Router との統合
- Express / Fastify との統合

### Part 5: 実践編

- テスト戦略
- ベストプラクティス

## クイックスタート

```bash
# 最も簡単な方法: create-t3-app
npx create-t3-app@latest my-t3-app
```

### 最小構成

```typescript
// server/trpc.ts
import { initTRPC } from "@trpc/server";

const t = initTRPC.create();

export const router = t.router;
export const publicProcedure = t.procedure;
```

```typescript
// server/routers/_app.ts
import { z } from "zod";
import { router, publicProcedure } from "../trpc";

export const appRouter = router({
  hello: publicProcedure
    .input(z.object({ name: z.string() }))
    .query(({ input }) => {
      return { greeting: `Hello, ${input.name}!` };
    }),
});

export type AppRouter = typeof appRouter;
```

## まとめ

- tRPC は TypeScript でエンドツーエンドの型安全性を実現
- スキーマ定義やコード生成が不要
- React Query との統合で強力なデータフェッチング
- Next.js との相性が抜群

## 次のステップ

➡️ 次へ: [01 - Getting-Started](./01-Getting-Started.md)
