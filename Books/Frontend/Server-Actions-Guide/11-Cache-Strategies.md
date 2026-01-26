# 11 - Cache Strategies（キャッシュ戦略）

## この章で学ぶこと

- Next.js のキャッシュレイヤーの理解
- Time-based vs On-demand Revalidation
- キャッシュ設計のベストプラクティス
- Server Actions とキャッシュの連携パターン

## Next.js のキャッシュレイヤー

### 4つのキャッシュ

```
┌─────────────────────────────────────────────────────────┐
│                    Request Memoization                   │
│              同一リクエスト内でのfetch重複排除              │
└─────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────┐
│                      Data Cache                          │
│              fetch()結果のサーバーサイドキャッシュ           │
└─────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────┐
│                   Full Route Cache                       │
│                静的ページのHTMLキャッシュ                  │
└─────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────┐
│                    Router Cache                          │
│              クライアントサイドのルートキャッシュ            │
└─────────────────────────────────────────────────────────┘
```

## Time-based Revalidation

### 時間ベースの再検証

```typescript
// lib/data.ts
// 60秒ごとに再検証
async function getPosts() {
  const res = await fetch("https://api.example.com/posts", {
    next: { revalidate: 60 },
  });
  return res.json();
}

// unstable_cache を使用
import { unstable_cache } from "next/cache";

export const getCachedPosts = unstable_cache(
  async () => {
    return db.post.findMany();
  },
  ["posts"],
  {
    revalidate: 60, // 60秒
    tags: ["posts"],
  },
);
```

### 用途別の推奨設定

```typescript
// 頻繁に更新されるデータ（ニュース、SNS）
const getLatestNews = async () => {
  return fetch(url, { next: { revalidate: 60 } }); // 1分
};

// 中程度の更新頻度（ブログ、商品情報）
const getBlogPosts = async () => {
  return fetch(url, { next: { revalidate: 3600 } }); // 1時間
};

// 低頻度の更新（設定、プロフィール）
const getSettings = async () => {
  return fetch(url, { next: { revalidate: 86400 } }); // 24時間
};

// 静的なデータ（国リスト、カテゴリ）
const getCountries = async () => {
  return fetch(url, { cache: "force-cache" }); // 無期限
};
```

## On-demand Revalidation

### Server Actions との連携

```typescript
// app/actions/post.ts
"use server";

import { revalidatePath, revalidateTag } from "next/cache";

export async function createPost(formData: FormData) {
  const post = await db.post.create({
    data: {
      title: formData.get("title") as string,
      content: formData.get("content") as string,
    },
  });

  // オンデマンドで即座に再検証
  revalidateTag("posts");
  revalidatePath("/posts");

  return { success: true, post };
}
```

### Time-based vs On-demand の使い分け

```typescript
// lib/cache-strategy.ts
import { unstable_cache } from "next/cache";

// ハイブリッドアプローチ: Time-based + On-demand
export const getProducts = unstable_cache(
  async (category?: string) => {
    return db.product.findMany({
      where: category ? { categoryId: category } : undefined,
    });
  },
  ["products"],
  {
    revalidate: 3600, // バックグラウンドで1時間ごとに更新
    tags: ["products"], // Server Actions で即座に更新も可能
  },
);

// app/actions/product.ts
("use server");

export async function updateProduct(id: string, data: ProductData) {
  await db.product.update({ where: { id }, data });

  // 即座にキャッシュを無効化
  revalidateTag("products");
  revalidateTag(`product-${id}`);
}
```

## キャッシュキーの設計

### 効果的なタグ設計

```typescript
// lib/cache-keys.ts
export const CacheKeys = {
  // エンティティベース
  posts: "posts",
  post: (id: string) => `post-${id}`,
  users: "users",
  user: (id: string) => `user-${id}`,

  // リレーションベース
  userPosts: (userId: string) => `user-${userId}-posts`,
  postComments: (postId: string) => `post-${postId}-comments`,

  // 集計データ
  postCount: "post-count",
  userStats: (userId: string) => `user-${userId}-stats`,

  // フィルタリング結果
  postsByCategory: (categoryId: string) => `posts-category-${categoryId}`,
  postsByTag: (tag: string) => `posts-tag-${tag}`,
} as const;

// 使用例
import { unstable_cache } from "next/cache";
import { CacheKeys } from "@/lib/cache-keys";

export const getUserPosts = unstable_cache(
  async (userId: string) => {
    return db.post.findMany({ where: { authorId: userId } });
  },
  ["user-posts"],
  {
    tags: [CacheKeys.posts, CacheKeys.userPosts(userId)],
    revalidate: 300,
  },
);
```

### 階層的なタグ設計

```typescript
// lib/data.ts
import { unstable_cache } from "next/cache";

// 親タグ: "posts" - すべての投稿関連キャッシュ
// 子タグ: "post-{id}" - 特定の投稿

export const getPostWithComments = unstable_cache(
  async (id: string) => {
    return db.post.findUnique({
      where: { id },
      include: { comments: true },
    });
  },
  ["post-with-comments"],
  {
    tags: [
      "posts", // 親タグ
      `post-${id}`, // 投稿タグ
      `post-${id}-comments`, // コメントタグ
    ],
    revalidate: 300,
  },
);

// app/actions/comment.ts
("use server");

export async function addComment(postId: string, content: string) {
  await db.comment.create({
    data: { postId, content },
  });

  // コメントタグのみ再検証（投稿本体は変更なし）
  revalidateTag(`post-${postId}-comments`);
}

export async function updatePost(postId: string, data: PostData) {
  await db.post.update({ where: { id: postId }, data });

  // 投稿タグを再検証（コメントも含む全体が更新される）
  revalidateTag(`post-${postId}`);
}
```

## キャッシュ無効化パターン

### 部分的無効化

```typescript
// app/actions/user.ts
"use server";

import { revalidateTag } from "next/cache";

export async function updateUserProfile(userId: string, data: ProfileData) {
  await db.user.update({ where: { id: userId }, data });

  // ユーザー情報のみ無効化
  revalidateTag(`user-${userId}`);

  // ユーザーの投稿一覧は変更なし - 無効化しない
}

export async function updateUserAvatar(userId: string, avatarUrl: string) {
  await db.user.update({
    where: { id: userId },
    data: { avatarUrl },
  });

  // アバター変更は広範囲に影響
  revalidateTag(`user-${userId}`);
  revalidateTag(`user-${userId}-posts`); // 投稿にもアバターが表示される
  revalidateTag("recent-comments"); // コメントにもアバターが表示される
}
```

### 全体無効化

```typescript
// app/actions/admin.ts
"use server";

import { revalidatePath } from "next/cache";

export async function rebuildCache() {
  // 管理者による全キャッシュ無効化
  revalidatePath("/", "layout");
}

export async function importData(file: File) {
  await bulkImport(file);

  // 大量インポート後は全体を無効化
  revalidatePath("/", "layout");
}
```

## キャッシュと認証

### ユーザー固有データのキャッシュ

```typescript
// lib/data.ts
import { unstable_cache } from "next/cache";
import { auth } from "@/lib/auth";

// ❌ 悪い例: ユーザー固有データを共有キャッシュに
export const getMyPosts = unstable_cache(
  async () => {
    const session = await auth();
    return db.post.findMany({ where: { authorId: session?.user?.id } });
  },
  ["my-posts"], // すべてのユーザーで同じキャッシュキー
);

// ✅ 良い例: ユーザーIDをキャッシュキーに含める
export const getMyPosts = async () => {
  const session = await auth();
  if (!session?.user?.id) return [];

  return unstable_cache(
    async () => {
      return db.post.findMany({ where: { authorId: session.user.id } });
    },
    [`user-${session.user.id}-posts`], // ユーザー固有のキャッシュキー
    {
      tags: [`user-${session.user.id}-posts`],
      revalidate: 300,
    },
  )();
};
```

### 公開データと非公開データの分離

```typescript
// lib/data.ts

// 公開データ: 積極的にキャッシュ
export const getPublicPosts = unstable_cache(
  async () => {
    return db.post.findMany({
      where: { published: true },
    });
  },
  ["public-posts"],
  {
    revalidate: 60,
    tags: ["posts", "public-posts"],
  },
);

// 非公開データ: キャッシュしないか、短い有効期限
export async function getDraftPosts(userId: string) {
  // キャッシュなしで直接取得
  return db.post.findMany({
    where: { authorId: userId, published: false },
  });
}
```

## パフォーマンス最適化

### 並列データ取得

```typescript
// app/posts/[id]/page.tsx
import { Suspense } from "react";

export default async function PostPage({ params }: { params: { id: string } }) {
  // 並列で取得（それぞれ独立したキャッシュ）
  const [post, comments, relatedPosts] = await Promise.all([
    getPost(params.id),
    getComments(params.id),
    getRelatedPosts(params.id),
  ]);

  return (
    <div>
      <Post post={post} />
      <Suspense fallback={<CommentsSkeleton />}>
        <Comments comments={comments} />
      </Suspense>
      <RelatedPosts posts={relatedPosts} />
    </div>
  );
}
```

### プリフェッチ戦略

```typescript
// app/posts/page.tsx
import Link from "next/link";

export default async function PostsPage() {
  const posts = await getPosts();

  return (
    <div>
      {posts.map((post) => (
        <Link
          key={post.id}
          href={`/posts/${post.id}`}
          prefetch={true} // ホバー時にプリフェッチ
        >
          {post.title}
        </Link>
      ))}
    </div>
  );
}
```

## まとめ

- **Time-based**: バックグラウンドで定期更新、読み取り中心のデータに最適
- **On-demand**: Server Actions と連携、書き込み操作後に即時更新
- **ハイブリッド**: 両方を組み合わせて柔軟に対応
- **タグ設計**: 階層的で意味のあるキャッシュキーを使用
- **認証**: ユーザー固有データは適切に分離

## 確認問題

1. Time-based と On-demand Revalidation の使い分けを説明してください
2. キャッシュキーの階層設計の利点を説明してください
3. ユーザー固有データをキャッシュする際の注意点を説明してください
4. ハイブリッドキャッシュ戦略を実装してください

## 次の章へ

[12 - Security](./12-Security.md) では、Server Actions のセキュリティについて詳しく学びます。
