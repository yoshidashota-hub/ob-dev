---
created: 2025-11-08
tags: [example, nextjs, async-params, migration, typescript]
status: 完了
related:
  - "[[Next.js-16-Setup]]"
  - "[[use-cache-examples]]"
---

# Async Params 移行ガイド

## 概要

Next.js 16 では、`params`と`searchParams`が**非同期（Promise）**になりました。
この変更により、パラメータの取得が統一され、型安全性が向上しています。

## 実装場所

```
Projects/next16-sandbox/app/
├── blog/[slug]/page.tsx                    # 単一パラメータ + searchParams
├── products/[id]/page.tsx                  # 数値IDのバリデーション
└── users/[userId]/posts/[postId]/page.tsx  # ネストしたパラメータ
```

## 主な変更点

### Next.js 15 以前

```typescript
// 同期的にparamsを受け取る
export default function Page({ params }: { params: { slug: string } }) {
  const { slug } = params; // 直接アクセス可能
  return <div>{slug}</div>;
}
```

### Next.js 16 以降

```typescript
// ✅ paramsはPromiseとして受け取り、awaitで解決
export default async function Page({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params; // awaitが必要
  return <div>{slug}</div>;
}
```

## 実装パターン

### 1. 基本的な動的ルート

**ファイル**: `app/blog/[slug]/page.tsx`

```typescript
interface PageProps {
  params: Promise<{
    slug: string;
  }>;
  searchParams: Promise<{
    preview?: string;
    lang?: string;
  }>;
}

export default async function BlogPostPage({
  params,
  searchParams,
}: PageProps) {
  // ✅ paramsとsearchParamsの両方をawait
  const { slug } = await params;
  const { preview, lang } = await searchParams;

  console.log("Slug:", slug);
  console.log("Preview:", preview);
  console.log("Language:", lang);

  return (
    <div>
      <h1>記事: {slug}</h1>
      {preview && <p>プレビューモード</p>}
      {lang && <p>言語: {lang}</p>}
    </div>
  );
}
```

**使用例**:

- `/blog/nextjs-16-features`
- `/blog/typescript-best-practices?preview=true`
- `/blog/react-19-compiler?lang=ja`

### 2. 数値 ID の扱い

**ファイル**: `app/products/[id]/page.tsx`

```typescript
interface PageProps {
  params: Promise<{
    id: string; // URLパラメータは常に文字列
  }>;
}

export default async function ProductPage({ params }: PageProps) {
  const { id: idStr } = await params;

  // ✅ 文字列を数値に変換
  const id = parseInt(idStr, 10);

  // ✅ バリデーション
  if (isNaN(id)) {
    return <div>無効なID: {idStr}</div>;
  }

  const product = await fetchProduct(id);

  return <div>{product.name}</div>;
}
```

**バリデーション例**:

- `/products/1` → OK (id = 1)
- `/products/abc` → NG (NaN)
- `/products/-5` → OK (id = -5) ※ビジネスロジックで追加検証が必要
- `/products/1.5` → OK (id = 1) ※ parseInt は小数点以下を切り捨て

### 3. ネストした動的ルート

**ファイル**: `app/users/[userId]/posts/[postId]/page.tsx`

```typescript
interface PageProps {
  params: Promise<{
    userId: string;
    postId: string;
  }>;
}

export default async function UserPostPage({ params }: PageProps) {
  // ✅ 複数のparamsを同時にawait
  const { userId: userIdStr, postId: postIdStr } = await params;

  // 数値変換
  const userId = parseInt(userIdStr, 10);
  const postId = parseInt(postIdStr, 10);

  // バリデーション
  if (isNaN(userId) || isNaN(postId)) {
    return <div>無効なパラメータ</div>;
  }

  // 並列でデータ取得
  const [user, post] = await Promise.all([
    fetchUser(userId),
    fetchPost(userId, postId),
  ]);

  return (
    <div>
      <h1>{user.name}</h1>
      <article>{post.title}</article>
    </div>
  );
}
```

**使用例**:

- `/users/1/posts/1`
- `/users/2/posts/3`

## 移行チェックリスト

### 型定義の更新

```typescript
// ❌ 旧: 同期的な型定義
interface PageProps {
  params: { slug: string };
}

// ✅ 新: 非同期の型定義
interface PageProps {
  params: Promise<{ slug: string }>;
}
```

### 関数を async に変更

```typescript
// ❌ 旧: 同期関数
export default function Page({ params }: PageProps) {
  const { slug } = params;
  return <div>{slug}</div>;
}

// ✅ 新: async関数
export default async function Page({ params }: PageProps) {
  const { slug } = await params;
  return <div>{slug}</div>;
}
```

### searchParams も同様に更新

```typescript
// ✅ searchParamsもPromise
interface PageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{
    q?: string;
    page?: string;
  }>;
}

export default async function Page({ params, searchParams }: PageProps) {
  const { slug } = await params;
  const { q, page } = await searchParams;

  return (
    <div>
      <h1>{slug}</h1>
      <p>検索: {q}</p>
      <p>ページ: {page}</p>
    </div>
  );
}
```

## TypeScript 型安全性

### 基本的な型定義

```typescript
interface PageProps {
  params: Promise<{
    slug: string;
  }>;
  searchParams: Promise<{
    preview?: string;
    sort?: "asc" | "desc";
    page?: string;
  }>;
}
```

### 型ガード

```typescript
function isValidSort(sort: string): sort is "asc" | "desc" {
  return sort === "asc" || sort === "desc";
}

export default async function Page({ searchParams }: PageProps) {
  const { sort } = await searchParams;

  if (sort && !isValidSort(sort)) {
    return <div>無効なソート順: {sort}</div>;
  }

  // ここではsortは "asc" | "desc" | undefined
  const data = await fetchData(sort);

  return <div>{/* ... */}</div>;
}
```

### Zod によるバリデーション

```typescript
import { z } from "zod";

const searchParamsSchema = z.object({
  page: z.string().regex(/^\d+$/).transform(Number).default("1"),
  limit: z.string().regex(/^\d+$/).transform(Number).default("10"),
  sort: z.enum(["asc", "desc"]).default("asc"),
});

export default async function Page({ searchParams }: PageProps) {
  const rawParams = await searchParams;

  // ✅ Zodでバリデーション + 型変換
  const validated = searchParamsSchema.safeParse(rawParams);

  if (!validated.success) {
    return <div>無効なパラメータ: {validated.error.message}</div>;
  }

  const { page, limit, sort } = validated.data;
  // page: number, limit: number, sort: "asc" | "desc"

  return <div>Page {page}</div>;
}
```

## generateStaticParams

`generateStaticParams`は引き続き同期関数として動作します。

```typescript
export async function generateStaticParams() {
  const posts = await fetchAllPosts();

  return posts.map((post) => ({
    slug: post.slug, // 文字列を返す
  }));
}
```

## エラーハンドリング

### 404 処理

```typescript
export default async function Page({ params }: PageProps) {
  const { id } = await params;

  const data = await fetchData(id);

  if (!data) {
    // Next.jsのnotFound関数を使用
    notFound();
  }

  return <div>{data.title}</div>;
}
```

### バリデーションエラー

```typescript
export default async function Page({ params }: PageProps) {
  const { id: idStr } = await params;
  const id = parseInt(idStr, 10);

  if (isNaN(id) || id <= 0) {
    return (
      <div className="error">
        <h1>無効なID</h1>
        <p>IDは正の整数である必要があります: {idStr}</p>
      </div>
    );
  }

  // 正常処理
  const data = await fetchData(id);
  return <div>{data.title}</div>;
}
```

## パフォーマンス最適化

### 並列データ取得

```typescript
export default async function Page({ params, searchParams }: PageProps) {
  // ✅ params と searchParams を並列で解決
  const [{ slug }, { preview, lang }] = await Promise.all([
    params,
    searchParams,
  ]);

  // ✅ 複数のデータ取得も並列化
  const [post, relatedPosts, author] = await Promise.all([
    fetchPost(slug),
    fetchRelatedPosts(slug),
    fetchAuthor(slug),
  ]);

  return <div>{/* ... */}</div>;
}
```

### キャッシュとの組み合わせ

```typescript
import { getCachedPost } from "../actions/cachedActions";

export default async function Page({ params }: PageProps) {
  const { slug } = await params;

  // ✅ キャッシュされた関数を使用
  const post = await getCachedPost(slug);

  return <div>{post.title}</div>;
}
```

## よくある問題と解決策

### 問題 1: await を忘れる

```typescript
// ❌ エラー: paramsはPromise
export default async function Page({ params }: PageProps) {
  const { slug } = params; // TypeError
  return <div>{slug}</div>;
}

// ✅ 正しい: awaitで解決
export default async function Page({ params }: PageProps) {
  const { slug } = await params;
  return <div>{slug}</div>;
}
```

### 問題 2: 関数を async にしていない

```typescript
// ❌ エラー: awaitはasync関数内でのみ使用可能
export default function Page({ params }: PageProps) {
  const { slug } = await params; // SyntaxError
  return <div>{slug}</div>;
}

// ✅ 正しい: async関数に変更
export default async function Page({ params }: PageProps) {
  const { slug } = await params;
  return <div>{slug}</div>;
}
```

### 問題 3: 型定義が古い

```typescript
// ❌ 旧: 同期的な型
interface PageProps {
  params: { slug: string };
}

// ✅ 新: Promise型
interface PageProps {
  params: Promise<{ slug: string }>;
}
```

## ベストプラクティス

### 1. 早期にバリデーション

```typescript
export default async function Page({ params }: PageProps) {
  const { id } = await params;

  // ✅ 早期リターンでバリデーション
  const numId = parseInt(id, 10);
  if (isNaN(numId) || numId <= 0) {
    return <ErrorPage />;
  }

  // 以降は正常なIDとして扱える
  const data = await fetchData(numId);
  return <div>{data.title}</div>;
}
```

### 2. 型安全性を確保

```typescript
// ✅ 明示的な型定義
interface PageProps {
  params: Promise<{
    slug: string;
  }>;
  searchParams: Promise<{
    preview?: "true" | "false";
    page?: string;
  }>;
}
```

### 3. デフォルト値の設定

```typescript
export default async function Page({ searchParams }: PageProps) {
  const { page = "1", limit = "10" } = await searchParams;

  const pageNum = parseInt(page, 10);
  const limitNum = parseInt(limit, 10);

  return <div>Page {pageNum}</div>;
}
```

### 4. Zod などでバリデーション

```typescript
import { z } from "zod";

const paramsSchema = z.object({
  id: z.string().regex(/^\d+$/).transform(Number),
});

export default async function Page({ params }: PageProps) {
  const rawParams = await params;
  const validated = paramsSchema.safeParse(rawParams);

  if (!validated.success) {
    return <ErrorPage errors={validated.error} />;
  }

  const { id } = validated.data; // id: number
  return <div>ID: {id}</div>;
}
```

## 移行の影響範囲

### 影響を受けるファイル

- ✅ `app/**/page.tsx` - すべての動的ルートページ
- ✅ `app/**/layout.tsx` - params を使用するレイアウト
- ❌ `app/**/route.ts` - API Routes は影響なし
- ❌ `generateStaticParams` - 引き続き同期関数

### 自動移行ツール

Next.js 16 では、codemod（自動変換ツール）が提供されています：

```bash
npx @next/codemod@latest upgrade
```

## まとめ

### 変更点

- `params`と`searchParams`が`Promise`型に
- ページコンポーネントは`async`関数に
- `await`でパラメータを解決

### メリット

- ✅ 型安全性の向上
- ✅ 統一された API
- ✅ より良いエラーハンドリング
- ✅ パフォーマンス最適化の機会

### 移行ステップ

1. 型定義を`Promise<>`に更新
2. コンポーネントを`async`に変更
3. `params`と`searchParams`を`await`
4. バリデーションを追加
5. テストして動作確認

---

**実装日**: 2025-11-08
**プロジェクト**: `Projects/next16-sandbox/`
**Next.js**: 16.0.1
