---
created: 2025-11-08
tags: [example, nextjs, server-actions, forms, optimistic-ui]
status: 完了
related:
  - "[[Next.js-16-Setup]]"
  - "[[use-cache-examples]]"
  - "[[async-params-migration]]"
---

# Server Actions 実装例

## 概要

Next.js 16 の Server Actions を使った、フォーム処理とデータ変更の実装例。
Progressive Enhancement と Optimistic UI を組み合わせた実践的なパターン。

## 実装場所

```
Projects/next16-sandbox/
├── app/
│   ├── forms/
│   │   ├── page.tsx              # 一覧ページ
│   │   ├── create/page.tsx       # 作成フォーム
│   │   └── edit/[id]/page.tsx    # 編集フォーム
│   ├── actions/
│   │   ├── posts.ts              # データストア
│   │   ├── createPost.ts         # 作成アクション
│   │   ├── updatePost.ts         # 更新アクション
│   │   └── deletePost.ts         # 削除アクション
│   └── components/
│       ├── SubmitButton.tsx      # useFormStatus
│       └── OptimisticList.tsx    # useOptimistic
```

## Server Actions の基本

### 1. Server Action の定義

```typescript
"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function createPost(prevState: FormState, formData: FormData) {
  // フォームデータの取得
  const title = formData.get("title") as string;
  const content = formData.get("content") as string;

  // バリデーション
  if (!title || title.length < 3) {
    return { errors: { title: ["タイトルは3文字以上必要です"] } };
  }

  // データベースに保存
  await db.post.create({ data: { title, content } });

  // キャッシュ無効化
  revalidatePath("/posts");

  // リダイレクト
  redirect("/posts");
}
```

**ポイント**:

- `"use server"` ディレクティブが必須
- `FormData` からデータを取得
- `revalidatePath` でキャッシュを無効化
- `redirect` で画面遷移

### 2. フォームでの使用

```typescript
"use client";

import { useFormState } from "react-dom";
import { createPost } from "./actions/createPost";

export default function CreateForm() {
  const [state, formAction] = useFormState(createPost, {});

  return (
    <form action={formAction}>
      <input name="title" />
      {state.errors?.title && <p>{state.errors.title[0]}</p>}

      <button type="submit">送信</button>
    </form>
  );
}
```

## React 19 Hooks との組み合わせ

### useFormState

フォームの状態と Server Action を統合。

```typescript
"use client";

import { useFormState } from "react-dom";

const initialState = { errors: {}, message: "" };

export default function Form() {
  // Server Actionとフォーム状態を統合
  const [state, formAction] = useFormState(createPost, initialState);

  return (
    <form action={formAction}>
      <input name="title" />

      {/* エラー表示 */}
      {state.errors?.title && (
        <p className="text-red-600">{state.errors.title[0]}</p>
      )}

      {/* 成功メッセージ */}
      {state.message && <p className="text-green-600">{state.message}</p>}

      <button type="submit">送信</button>
    </form>
  );
}
```

### useFormStatus

フォーム送信中の状態を検知。

```typescript
"use client";

import { useFormStatus } from "react-dom";

export function SubmitButton() {
  // フォームの送信状態を取得
  const { pending } = useFormStatus();

  return (
    <button type="submit" disabled={pending}>
      {pending ? "送信中..." : "送信する"}
    </button>
  );
}
```

**注意**: `useFormStatus` は `<form>` の子コンポーネント内で使用する必要があります。

### useOptimistic

楽観的 UI 更新を実装。

```typescript
"use client";

import { useOptimistic } from "react";

export function OptimisticList({ posts }) {
  // 楽観的な状態管理
  const [optimisticPosts, setOptimisticPosts] = useOptimistic(
    posts,
    (currentPosts, deletedId) => {
      return currentPosts.filter((post) => post.id !== deletedId);
    }
  );

  async function handleDelete(id: string) {
    // 即座に UI を更新（楽観的）
    setOptimisticPosts(id);

    // 実際の削除処理
    await deletePost(id);
  }

  return (
    <div>
      {optimisticPosts.map((post) => (
        <div key={post.id}>
          {post.title}
          <button onClick={() => handleDelete(post.id)}>削除</button>
        </div>
      ))}
    </div>
  );
}
```

## データフロー

### 作成処理のフロー

```
1. ユーザーがフォーム送信
   ↓
2. useFormStatus が pending = true に
   ↓
3. Server Action (createPost) 実行
   ↓
4. サーバー側でバリデーション
   ↓
5. エラーがあれば state.errors に返す
   ↓
6. 成功ならデータベースに保存
   ↓
7. revalidatePath でキャッシュ無効化
   ↓
8. redirect で画面遷移
```

### 削除処理のフロー（Optimistic UI）

```
1. ユーザーが削除ボタンクリック
   ↓
2. useOptimistic で即座に UI から削除
   ↓
3. Server Action (deletePost) 実行
   ↓
4. サーバー側で実際に削除
   ↓
5. revalidatePath でキャッシュ無効化
   ↓
6. 成功/失敗の結果を返す
```

## バリデーション

### サーバー側バリデーション

```typescript
"use server";

export async function createPost(prevState, formData) {
  const title = formData.get("title") as string;

  // バリデーション
  const errors: Record<string, string[]> = {};

  if (!title || title.trim().length === 0) {
    errors.title = ["タイトルは必須です"];
  } else if (title.length < 3) {
    errors.title = ["タイトルは3文字以上で入力してください"];
  } else if (title.length > 100) {
    errors.title = ["タイトルは100文字以内で入力してください"];
  }

  if (Object.keys(errors).length > 0) {
    return { errors };
  }

  // 保存処理
  // ...
}
```

### Zod によるバリデーション

```typescript
"use server";

import { z } from "zod";

const postSchema = z.object({
  title: z
    .string()
    .min(3, "タイトルは3文字以上必要です")
    .max(100, "タイトルは100文字以内で入力してください"),
  content: z.string().min(10, "本文は10文字以上必要です"),
  author: z.string().min(1, "著者名は必須です"),
});

export async function createPost(prevState, formData) {
  // Zodでバリデーション
  const validationResult = postSchema.safeParse({
    title: formData.get("title"),
    content: formData.get("content"),
    author: formData.get("author"),
  });

  if (!validationResult.success) {
    return {
      errors: validationResult.error.flatten().fieldErrors,
    };
  }

  // 保存処理
  const { title, content, author } = validationResult.data;
  // ...
}
```

## キャッシュ管理

### revalidatePath

特定のパスのキャッシュを無効化。

```typescript
"use server";

import { revalidatePath } from "next/cache";

export async function createPost(data) {
  // 保存処理
  await db.post.create({ data });

  // /posts のキャッシュを無効化
  revalidatePath("/posts");

  // /posts/create のキャッシュも無効化
  revalidatePath("/posts/create");
}
```

### revalidateTag

タグでキャッシュを無効化。

```typescript
"use server";

import { revalidateTag } from "next/cache";

export async function updatePost(id, data) {
  await db.post.update({ where: { id }, data });

  // "posts" タグのキャッシュを無効化
  revalidateTag("posts");

  // 特定の投稿のタグを無効化
  revalidateTag(`post-${id}`);
}
```

**キャッシュの設定**:

```typescript
// ページやコンポーネントでタグを設定
export default async function PostsPage() {
  const posts = await fetch("https://api.example.com/posts", {
    next: { tags: ["posts"] },
  }).then((r) => r.json());

  return <div>{/* ... */}</div>;
}
```

## 部分適用（bind）

Server Action に引数を事前に渡す。

```typescript
"use server";

export async function updatePost(
  id: string, // 事前に渡す引数
  prevState: FormState,
  formData: FormData
) {
  // id を使って更新
  await db.post.update({
    where: { id },
    data: {
      title: formData.get("title"),
    },
  });
}
```

**使用側**:

```typescript
"use client";

import { useFormState } from "react-dom";

export default function EditForm({ postId }) {
  // bind で ID を部分適用
  const updatePostWithId = updatePost.bind(null, postId);

  const [state, formAction] = useFormState(updatePostWithId, {});

  return <form action={formAction}>{/* ... */}</form>;
}
```

## Progressive Enhancement

JavaScript が無効でも動作するフォーム。

```typescript
// Server Action
"use server";

export async function createPost(formData: FormData) {
  const title = formData.get("title") as string;

  // 保存処理
  await db.post.create({ data: { title } });

  // リダイレクト（JavaScriptなしでも動作）
  redirect("/posts");
}
```

```typescript
// フォーム
export default function Form() {
  return (
    <form action={createPost}>
      {/* JavaScriptなしでも送信可能 */}
      <input name="title" required />
      <button type="submit">送信</button>
    </form>
  );
}
```

**段階的な機能強化**:

1. **基本**: JavaScript なしでも動作（フォーム送信 → リダイレクト）
2. **JS あり**: useFormState でエラー表示
3. **JS あり**: useFormStatus で送信中表示
4. **JS あり**: useOptimistic で楽観的 UI

## エラーハンドリング

### try-catch パターン

```typescript
"use server";

export async function createPost(prevState, formData) {
  try {
    const title = formData.get("title") as string;

    // バリデーション
    if (!title) {
      return { errors: { title: ["タイトルは必須です"] } };
    }

    // 保存
    await db.post.create({ data: { title } });

    revalidatePath("/posts");
    redirect("/posts");
  } catch (error) {
    // エラーログ
    console.error("Failed to create post:", error);

    return {
      message: "投稿の作成に失敗しました",
    };
  }
}
```

### クライアント側でのエラー表示

```typescript
"use client";

export default function Form() {
  const [state, formAction] = useFormState(createPost, {});

  return (
    <form action={formAction}>
      {/* フィールドエラー */}
      {state.errors?.title && (
        <p className="text-red-600">{state.errors.title[0]}</p>
      )}

      {/* 全体エラー */}
      {state.message && (
        <div className="bg-red-50 border border-red-200 p-4 rounded">
          <p className="text-red-800">{state.message}</p>
        </div>
      )}

      <input name="title" />
      <button type="submit">送信</button>
    </form>
  );
}
```

## ベストプラクティス

### 1. Server Action は別ファイルに分離

```typescript
// ❌ 悪い例: ページ内に定義
export default function Page() {
  async function createPost(formData) {
    "use server";
    // ...
  }

  return <form action={createPost}>...</form>;
}

// ✅ 良い例: 別ファイルに定義
// app/actions/createPost.ts
("use server");
export async function createPost(formData) {
  // ...
}

// app/page.tsx
import { createPost } from "./actions/createPost";
export default function Page() {
  return <form action={createPost}>...</form>;
}
```

### 2. 型定義を明確に

```typescript
// 型定義
export interface CreatePostFormState {
  errors?: {
    title?: string[];
    content?: string[];
  };
  message?: string;
}

// Server Action
export async function createPost(
  prevState: CreatePostFormState,
  formData: FormData
): Promise<CreatePostFormState> {
  // ...
}
```

### 3. バリデーションは常にサーバー側で

```typescript
// ✅ サーバー側で必ずバリデーション
"use server";
export async function createPost(prevState, formData) {
  // サーバー側バリデーション（必須）
  const title = formData.get("title");
  if (!title) {
    return { errors: { title: ["必須です"] } };
  }

  // 保存
  // ...
}
```

### 4. キャッシュの無効化を忘れずに

```typescript
"use server";

export async function updatePost(id, data) {
  await db.post.update({ where: { id }, data });

  // ✅ 関連するキャッシュを無効化
  revalidatePath("/posts");
  revalidatePath(`/posts/${id}`);
}
```

## トラブルシューティング

### 問題 1: "use server" が効かない

```typescript
// ❌ 間違い: インポート後に "use server"
import { db } from "./db";
("use server"); // これはエラー

// ✅ 正しい: ファイルの最初に配置
("use server");
import { db } from "./db";
```

### 問題 2: useFormStatus が pending にならない

```typescript
// ❌ 間違い: useFormStatus を form の外で使用
function Page() {
  const { pending } = useFormStatus(); // 効かない
  return <form>...</form>;
}

// ✅ 正しい: form の子コンポーネントで使用
function SubmitButton() {
  const { pending } = useFormStatus(); // 正しい
  return <button disabled={pending}>送信</button>;
}

function Page() {
  return (
    <form>
      <SubmitButton />
    </form>
  );
}
```

### 問題 3: redirect がキャッチされる

```typescript
// ❌ 間違い: redirect を try-catch で囲む
try {
  redirect("/posts"); // これはエラーをthrowする
} catch (error) {
  // redirectがキャッチされてしまう
}

// ✅ 正しい: redirect は最後に実行
try {
  await db.post.create(data);
} catch (error) {
  return { message: "エラー" };
}
redirect("/posts"); // try-catchの外
```

## まとめ

### Server Actions の利点

- ✅ JavaScript なしでも動作（Progressive Enhancement）
- ✅ 型安全なフォーム処理
- ✅ 自動キャッシュ管理
- ✅ Optimistic UI 対応
- ✅ サーバー側バリデーション

### 主な Hooks

| Hook          | 用途             | 使用場所                |
| ------------- | ---------------- | ----------------------- |
| useFormState  | フォーム状態管理 | フォームコンポーネント  |
| useFormStatus | 送信中状態の検知 | form の子コンポーネント |
| useOptimistic | 楽観的 UI 更新   | リストコンポーネント    |

### 実装チェックリスト

- [ ] `"use server"` ディレクティブを追加
- [ ] サーバー側バリデーションを実装
- [ ] エラーハンドリングを追加
- [ ] `revalidatePath` でキャッシュ無効化
- [ ] `useFormState` でフォーム状態管理
- [ ] `useFormStatus` で送信中表示
- [ ] `useOptimistic` で楽観的 UI（オプション）

---

**実装日**: 2025-11-08
**プロジェクト**: `Projects/next16-sandbox/`
**Next.js**: 16.0.1
**参考**: `app/forms/`, `app/actions/`, `app/components/`
