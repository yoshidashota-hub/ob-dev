# 10 - Revalidation（キャッシュ再検証）

## この章で学ぶこと

- revalidatePath の使い方
- revalidateTag の使い方
- オンデマンド再検証
- 再検証のベストプラクティス

## revalidatePath

### 基本的な使い方

```typescript
// app/actions/post.ts
"use server";

import { revalidatePath } from "next/cache";

export async function createPost(formData: FormData) {
  const title = formData.get("title") as string;
  const content = formData.get("content") as string;

  await db.post.create({
    data: { title, content },
  });

  // 投稿一覧ページのキャッシュを無効化
  revalidatePath("/posts");
}
```

### パスの種類

```typescript
"use server";

import { revalidatePath } from "next/cache";

export async function updatePost(id: string, formData: FormData) {
  await db.post.update({
    where: { id },
    data: {
      title: formData.get("title") as string,
    },
  });

  // 特定のページ
  revalidatePath(`/posts/${id}`);

  // 動的ルートのすべてのページ
  revalidatePath("/posts/[id]", "page");

  // レイアウトとそのすべての子ページ
  revalidatePath("/posts", "layout");

  // ルート全体
  revalidatePath("/", "layout");
}
```

### type パラメータ

```typescript
"use server";

import { revalidatePath } from "next/cache";

export async function updateSettings() {
  // 'page': 特定のページのみ（デフォルト）
  revalidatePath("/settings", "page");

  // 'layout': レイアウトとすべての子ページ
  revalidatePath("/dashboard", "layout");
}
```

## revalidateTag

### タグ付きフェッチ

```typescript
// app/posts/page.tsx
async function getPosts() {
  const res = await fetch("https://api.example.com/posts", {
    next: { tags: ["posts"] },
  });
  return res.json();
}

export default async function PostsPage() {
  const posts = await getPosts();
  // ...
}

// app/posts/[id]/page.tsx
async function getPost(id: string) {
  const res = await fetch(`https://api.example.com/posts/${id}`, {
    next: { tags: ["posts", `post-${id}`] },
  });
  return res.json();
}
```

### タグの再検証

```typescript
// app/actions/post.ts
"use server";

import { revalidateTag } from "next/cache";

export async function createPost(formData: FormData) {
  const response = await fetch("https://api.example.com/posts", {
    method: "POST",
    body: formData,
  });

  // 'posts' タグが付いたすべてのフェッチを無効化
  revalidateTag("posts");
}

export async function updatePost(id: string, formData: FormData) {
  await fetch(`https://api.example.com/posts/${id}`, {
    method: "PUT",
    body: formData,
  });

  // 特定の投稿のみ無効化
  revalidateTag(`post-${id}`);

  // 一覧も更新
  revalidateTag("posts");
}

export async function deletePost(id: string) {
  await fetch(`https://api.example.com/posts/${id}`, {
    method: "DELETE",
  });

  revalidateTag(`post-${id}`);
  revalidateTag("posts");
}
```

## unstable_cache との連携

```typescript
// lib/data.ts
import { unstable_cache } from "next/cache";

export const getUser = unstable_cache(
  async (id: string) => {
    return db.user.findUnique({ where: { id } });
  },
  ["user"],
  {
    tags: ["users"],
    revalidate: 3600, // 1時間
  },
);

export const getUserPosts = unstable_cache(
  async (userId: string) => {
    return db.post.findMany({ where: { authorId: userId } });
  },
  ["user-posts"],
  {
    tags: (userId) => [`user-${userId}-posts`, "posts"],
    revalidate: 300, // 5分
  },
);

// app/actions/post.ts
("use server");

import { revalidateTag } from "next/cache";

export async function createPost(userId: string, formData: FormData) {
  await db.post.create({
    data: {
      title: formData.get("title") as string,
      authorId: userId,
    },
  });

  // ユーザーの投稿キャッシュを無効化
  revalidateTag(`user-${userId}-posts`);
  revalidateTag("posts");
}
```

## 実践的なパターン

### CRUD 操作での再検証

```typescript
// app/actions/product.ts
"use server";

import { revalidatePath, revalidateTag } from "next/cache";

// 作成
export async function createProduct(formData: FormData) {
  const product = await db.product.create({
    /* ... */
  });

  revalidatePath("/products");
  revalidatePath("/admin/products");
  revalidateTag("products");
  revalidateTag("product-count");
}

// 更新
export async function updateProduct(id: string, formData: FormData) {
  await db.product.update({
    where: { id },
    data: {
      /* ... */
    },
  });

  revalidatePath(`/products/${id}`);
  revalidatePath("/products");
  revalidateTag(`product-${id}`);
  revalidateTag("products");
}

// 削除
export async function deleteProduct(id: string) {
  await db.product.delete({ where: { id } });

  revalidatePath("/products");
  revalidatePath(`/products/${id}`);
  revalidateTag("products");
  revalidateTag("product-count");
}
```

### 関連データの再検証

```typescript
// app/actions/comment.ts
"use server";

import { revalidatePath, revalidateTag } from "next/cache";

export async function addComment(postId: string, formData: FormData) {
  await db.comment.create({
    data: {
      content: formData.get("content") as string,
      postId,
    },
  });

  // コメントに関連するキャッシュを無効化
  revalidatePath(`/posts/${postId}`);
  revalidateTag(`post-${postId}-comments`);
  revalidateTag("recent-comments");
}
```

### カテゴリ変更時の再検証

```typescript
// app/actions/post.ts
"use server";

export async function updatePostCategory(
  postId: string,
  oldCategoryId: string,
  newCategoryId: string,
) {
  await db.post.update({
    where: { id: postId },
    data: { categoryId: newCategoryId },
  });

  // 投稿自体
  revalidatePath(`/posts/${postId}`);
  revalidateTag(`post-${postId}`);

  // 旧カテゴリ
  revalidatePath(`/categories/${oldCategoryId}`);
  revalidateTag(`category-${oldCategoryId}-posts`);

  // 新カテゴリ
  revalidatePath(`/categories/${newCategoryId}`);
  revalidateTag(`category-${newCategoryId}-posts`);
}
```

## 再検証のタイミング

### 即時 vs 遅延

```typescript
// 即時再検証（デフォルト）
export async function createPost(formData: FormData) {
  await db.post.create({
    /* ... */
  });
  revalidatePath("/posts"); // 即座に実行
}

// バックグラウンドでの再検証が必要な場合
export async function importPosts(file: File) {
  // 大量のデータをインポート
  await bulkImport(file);

  // すべてのページを再検証
  revalidatePath("/", "layout");
}
```

## まとめ

- revalidatePath: 特定のパスのキャッシュを無効化
- revalidateTag: タグ付きフェッチのキャッシュを無効化
- type パラメータで page/layout を指定可能
- CRUD 操作に応じて適切な再検証を実行
- 関連データの再検証も忘れずに

## 確認問題

1. revalidatePath と revalidateTag の違いを説明してください
2. type パラメータの 'page' と 'layout' の違いを説明してください
3. 投稿を更新した際に再検証すべきパスを挙げてください
4. タグ付きフェッチを使用する利点を説明してください

## 次の章へ

[11 - Cache-Strategies](./11-Cache-Strategies.md) では、キャッシュ戦略について詳しく学びます。
