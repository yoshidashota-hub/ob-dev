# 00 - Introduction

## Server Actions とは

Server Actions は、サーバー上で実行される非同期関数で、クライアントコンポーネントやフォームから直接呼び出すことができます。

### 従来のアプローチとの違い

```text
従来の API Route
┌─────────────────────────────────────────┐
│  クライアント                            │
│    ↓ fetch('/api/users', { ... })       │
│  API Route (/api/users/route.ts)        │
│    ↓                                    │
│  データベース                            │
└─────────────────────────────────────────┘

Server Actions
┌─────────────────────────────────────────┐
│  クライアント / フォーム                 │
│    ↓ action={createUser}                │
│  Server Action (直接呼び出し)           │
│    ↓                                    │
│  データベース                            │
└─────────────────────────────────────────┘
```

## Server Actions の主な特徴

### 1. シンプルな定義

```typescript
// app/actions.ts
"use server";

export async function createUser(formData: FormData) {
  const name = formData.get("name") as string;
  const email = formData.get("email") as string;

  await db.user.create({
    data: { name, email },
  });

  revalidatePath("/users");
}
```

### 2. フォームとの統合

```tsx
// app/users/page.tsx
import { createUser } from "./actions";

export default function UsersPage() {
  return (
    <form action={createUser}>
      <input name="name" placeholder="Name" />
      <input name="email" type="email" placeholder="Email" />
      <button type="submit">Create User</button>
    </form>
  );
}
```

### 3. Progressive Enhancement

```tsx
// JavaScript が無効でもフォームは動作する
<form action={createUser}>
  {/* サーバーサイドで処理される */}
</form>
```

## なぜ Server Actions を学ぶのか

| 観点 | API Routes | Server Actions |
|------|------------|----------------|
| 実装の簡潔さ | ボイラープレート多い | シンプル |
| 型安全性 | 手動で定義 | 自動推論 |
| Progressive Enhancement | なし | あり |
| フォーム統合 | 手動 fetch | ネイティブ |
| エラーハンドリング | 複雑 | シンプル |

## Server Actions の仕組み

```text
1. "use server" ディレクティブで関数をマーク
   ┌─────────────────────────────────────────┐
   │  "use server"                           │
   │  async function createUser() { ... }    │
   └─────────────────────────────────────────┘

2. Next.js がエンドポイントを自動生成
   ┌─────────────────────────────────────────┐
   │  POST /_next/action/xxxx                │
   │  (内部的に HTTP エンドポイントを作成)    │
   └─────────────────────────────────────────┘

3. クライアントから呼び出し
   ┌─────────────────────────────────────────┐
   │  form.action = createUser               │
   │  または                                  │
   │  await createUser(data)                 │
   └─────────────────────────────────────────┘
```

## このガイドで学ぶこと

### Part 1: 基礎編

- Server Actions の定義方法
- フォームでの使用
- クライアントコンポーネントからの呼び出し

### Part 2: 状態管理編

- useActionState でフォーム状態を管理
- useFormStatus で送信状態を表示
- 楽観的更新の実装

### Part 3: バリデーション編

- サーバーサイドバリデーション
- Zod との統合
- エラーの返却と表示

### Part 4: キャッシュ編

- revalidatePath でページを再検証
- revalidateTag でタグベースの再検証
- キャッシュ戦略

### Part 5: 実践編

- セキュリティ対策
- 実践的なパターン
- ベストプラクティス

## クイックスタート

### 1. Server Action を定義

```typescript
// app/actions.ts
"use server";

export async function addTodo(formData: FormData) {
  const title = formData.get("title") as string;

  // データベースに保存
  await db.todo.create({ data: { title } });

  // ページを再検証
  revalidatePath("/todos");
}
```

### 2. フォームで使用

```tsx
// app/todos/page.tsx
import { addTodo } from "./actions";

export default function TodosPage() {
  return (
    <form action={addTodo}>
      <input name="title" placeholder="New todo" required />
      <button type="submit">Add</button>
    </form>
  );
}
```

### 3. 送信状態を表示

```tsx
"use client";

import { useFormStatus } from "react-dom";

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button type="submit" disabled={pending}>
      {pending ? "Adding..." : "Add"}
    </button>
  );
}
```

## まとめ

- Server Actions はサーバーで実行される非同期関数
- フォームとネイティブに統合
- Progressive Enhancement をサポート
- API Routes より簡潔で型安全

## 次のステップ

➡️ 次へ: [01 - Basic-Usage](./01-Basic-Usage.md)
