# キャッシング戦略 学習ノート

## 概要

キャッシングはパフォーマンス最適化の要。適切な戦略でレスポンス時間短縮とサーバー負荷軽減を実現。

## キャッシュの階層

```
┌─────────────────────────────────────────────────────┐
│                   ブラウザキャッシュ                  │
│                   (最も高速)                         │
└─────────────────────────────────────────────────────┘
                        │
┌─────────────────────────────────────────────────────┐
│                     CDN キャッシュ                   │
│                   (エッジロケーション)               │
└─────────────────────────────────────────────────────┘
                        │
┌─────────────────────────────────────────────────────┐
│               アプリケーションキャッシュ              │
│                   (Redis, Memcached)                │
└─────────────────────────────────────────────────────┘
                        │
┌─────────────────────────────────────────────────────┐
│                 データベースキャッシュ               │
│                   (クエリキャッシュ)                 │
└─────────────────────────────────────────────────────┘
```

## Next.js のキャッシング

### fetch キャッシュ

```typescript
// デフォルト: キャッシュ有効
const data = await fetch("https://api.example.com/data");

// キャッシュ無効
const data = await fetch("https://api.example.com/data", {
  cache: "no-store",
});

// 再検証間隔指定
const data = await fetch("https://api.example.com/data", {
  next: { revalidate: 3600 }, // 1時間
});

// タグベースの再検証
const data = await fetch("https://api.example.com/posts", {
  next: { tags: ["posts"] },
});
```

### unstable_cache (Next.js 15+)

```typescript
import { unstable_cache } from "next/cache";

const getCachedUser = unstable_cache(
  async (userId: string) => {
    return await prisma.user.findUnique({ where: { id: userId } });
  },
  ["user"], // キャッシュキー
  {
    revalidate: 3600,
    tags: ["users"],
  },
);

// 使用
const user = await getCachedUser("123");
```

### use cache (Next.js 16+)

```typescript
// コンポーネントレベルでのキャッシュ
async function UserProfile({ userId }: { userId: string }) {
  "use cache";

  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  return <div>{user.name}</div>;
}

// 関数レベルでのキャッシュ
async function getExpensiveData() {
  "use cache";

  // 重い計算やDBクエリ
  return await computeExpensiveData();
}
```

### 再検証

```typescript
import { revalidateTag, revalidatePath } from "next/cache";

// タグベース再検証
export async function updatePost(id: string, data: PostData) {
  await prisma.post.update({ where: { id }, data });
  revalidateTag("posts");
}

// パスベース再検証
export async function createPost(data: PostData) {
  await prisma.post.create({ data });
  revalidatePath("/posts");
}
```

## Redis キャッシュ

### セットアップ

```typescript
// lib/redis.ts
import { Redis } from "@upstash/redis";

export const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});
```

### 基本操作

```typescript
// 文字列
await redis.set("key", "value", { ex: 3600 }); // 1時間TTL
const value = await redis.get("key");

// JSON
await redis.set("user:123", JSON.stringify(user), { ex: 3600 });
const user = JSON.parse((await redis.get("user:123")) ?? "null");

// ハッシュ
await redis.hset("user:123", { name: "John", email: "john@example.com" });
const user = await redis.hgetall("user:123");
```

### キャッシュパターン

```typescript
// Cache-Aside パターン
async function getUser(userId: string) {
  // 1. キャッシュを確認
  const cached = await redis.get(`user:${userId}`);
  if (cached) return JSON.parse(cached);

  // 2. DBから取得
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) return null;

  // 3. キャッシュに保存
  await redis.set(`user:${userId}`, JSON.stringify(user), { ex: 3600 });

  return user;
}

// Write-Through パターン
async function updateUser(userId: string, data: UserData) {
  // 1. DBを更新
  const user = await prisma.user.update({
    where: { id: userId },
    data,
  });

  // 2. キャッシュを更新
  await redis.set(`user:${userId}`, JSON.stringify(user), { ex: 3600 });

  return user;
}
```

## HTTP キャッシュヘッダー

```typescript
// Route Handler でのキャッシュ制御
export async function GET() {
  const data = await fetchData();

  return new Response(JSON.stringify(data), {
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "public, max-age=3600, s-maxage=86400",
      ETag: generateETag(data),
    },
  });
}
```

### Cache-Control ディレクティブ

| ディレクティブ         | 説明                           |
| ---------------------- | ------------------------------ |
| public                 | CDN にキャッシュ可             |
| private                | ブラウザのみキャッシュ可       |
| max-age                | ブラウザキャッシュ期間（秒）   |
| s-maxage               | CDN キャッシュ期間（秒）       |
| stale-while-revalidate | 古いキャッシュを返しつつ再検証 |
| no-store               | キャッシュ禁止                 |

## キャッシュ戦略の選択

| ユースケース       | 戦略                                  |
| ------------------ | ------------------------------------- |
| 静的コンテンツ     | 長期キャッシュ + CDN                  |
| ユーザーデータ     | Redis + 短い TTL                      |
| リアルタイムデータ | キャッシュなし or 短い SWR            |
| ページ全体         | ISR (Incremental Static Regeneration) |

## ベストプラクティス

1. **キャッシュキーの設計**: 一意で予測可能に
2. **TTL の適切な設定**: データの更新頻度に応じて
3. **キャッシュの無効化**: 更新時に確実に無効化
4. **フォールバック**: キャッシュミス時の処理
5. **モニタリング**: ヒット率を監視

## 参考リソース

- [Next.js Caching](https://nextjs.org/docs/app/building-your-application/caching)
- [Vercel Edge Config](https://vercel.com/docs/storage/edge-config)
- [Upstash Redis](https://upstash.com/docs/redis/overall/getstarted)
