# 14 - Best Practices（ベストプラクティス）

## この章で学ぶこと

- Server Actions のベストプラクティス総括
- パフォーマンス最適化
- テスト手法
- デバッグとトラブルシューティング
- 本番運用のヒント

## アーキテクチャのベストプラクティス

### ファイル構成

```
app/
├── actions/                    # Server Actions
│   ├── index.ts               # エクスポート集約
│   ├── post.ts                # 投稿関連
│   ├── comment.ts             # コメント関連
│   └── user.ts                # ユーザー関連
├── lib/
│   ├── validations/           # Zod スキーマ
│   │   ├── post.ts
│   │   └── user.ts
│   ├── auth.ts                # 認証ユーティリティ
│   ├── db.ts                  # データベース接続
│   └── types.ts               # 共通型定義
└── components/
    └── forms/                 # フォームコンポーネント
```

### 関心の分離

```typescript
// ❌ 悪い例: すべてを1つのアクションに
"use server";

export async function createPost(formData: FormData) {
  const session = await auth();
  if (!session) throw new Error("Unauthorized");

  const title = formData.get("title") as string;
  const content = formData.get("content") as string;

  if (!title || title.length < 3) {
    return { error: "タイトルは3文字以上必要です" };
  }

  const post = await db.post.create({
    data: { title, content, authorId: session.user.id },
  });

  revalidatePath("/posts");
  return { success: true, post };
}

// ✅ 良い例: 関心を分離
// lib/validations/post.ts
import { z } from "zod";

export const createPostSchema = z.object({
  title: z.string().min(3, "タイトルは3文字以上必要です"),
  content: z.string().optional(),
});

// lib/services/post.ts
export async function createPostInDb(data: CreatePostInput, authorId: string) {
  return db.post.create({
    data: { ...data, authorId },
  });
}

// app/actions/post.ts
("use server");

import { requireAuth } from "@/lib/auth";
import { createPostSchema } from "@/lib/validations/post";
import { createPostInDb } from "@/lib/services/post";

export async function createPost(formData: FormData) {
  const session = await requireAuth();

  const validation = createPostSchema.safeParse({
    title: formData.get("title"),
    content: formData.get("content"),
  });

  if (!validation.success) {
    return { success: false, errors: validation.error.flatten() };
  }

  const post = await createPostInDb(validation.data, session.user.id);

  revalidatePath("/posts");
  return { success: true, data: post };
}
```

## パフォーマンス最適化

### 不要な再レンダリングを避ける

```typescript
// ❌ 悪い例: 大きなオブジェクトを返す
export async function getUser(id: string) {
  return db.user.findUnique({
    where: { id },
    include: {
      posts: true,
      comments: true,
      followers: true,
      following: true,
    },
  });
}

// ✅ 良い例: 必要なフィールドのみを返す
export async function getUser(id: string) {
  return db.user.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      email: true,
      avatarUrl: true,
    },
  });
}

// ✅ 良い例: 関連データは別のアクションで取得
export async function getUserPosts(userId: string, page: number = 1) {
  return db.post.findMany({
    where: { authorId: userId },
    take: 10,
    skip: (page - 1) * 10,
  });
}
```

### 並列実行

```typescript
// ❌ 悪い例: 直列実行
export async function getDashboardData(userId: string) {
  const user = await getUser(userId);
  const posts = await getUserPosts(userId);
  const stats = await getUserStats(userId);
  const notifications = await getNotifications(userId);

  return { user, posts, stats, notifications };
}

// ✅ 良い例: 並列実行
export async function getDashboardData(userId: string) {
  const [user, posts, stats, notifications] = await Promise.all([
    getUser(userId),
    getUserPosts(userId),
    getUserStats(userId),
    getNotifications(userId),
  ]);

  return { user, posts, stats, notifications };
}
```

### キャッシュの適切な利用

```typescript
// lib/data.ts
import { unstable_cache } from "next/cache";

// 頻繁にアクセスされるデータはキャッシュ
export const getPopularPosts = unstable_cache(
  async () => {
    return db.post.findMany({
      where: { published: true },
      orderBy: { viewCount: "desc" },
      take: 10,
    });
  },
  ["popular-posts"],
  {
    revalidate: 300, // 5分
    tags: ["posts", "popular"],
  },
);

// ユーザー固有データはキャッシュしないか、短い有効期限
export async function getUserDrafts(userId: string) {
  // キャッシュなしで直接取得（頻繁に変わる可能性）
  return db.post.findMany({
    where: { authorId: userId, published: false },
  });
}
```

## エラーハンドリング

### 一貫したエラーレスポンス

```typescript
// lib/types.ts
export type ActionResult<T = void> =
  | { success: true; data: T }
  | {
      success: false;
      error: string;
      code?: string;
      fieldErrors?: Record<string, string[]>;
    };

// lib/errors.ts
export class ActionError extends Error {
  constructor(
    message: string,
    public code: string = "UNKNOWN_ERROR",
    public fieldErrors?: Record<string, string[]>,
  ) {
    super(message);
    this.name = "ActionError";
  }
}

export class ValidationError extends ActionError {
  constructor(message: string, fieldErrors: Record<string, string[]>) {
    super(message, "VALIDATION_ERROR", fieldErrors);
  }
}

export class AuthError extends ActionError {
  constructor(message: string = "認証が必要です") {
    super(message, "AUTH_ERROR");
  }
}

// lib/action-wrapper.ts
import { ActionResult, ActionError } from "@/lib/types";

export function withErrorHandling<TInput, TOutput>(
  action: (input: TInput) => Promise<TOutput>,
): (input: TInput) => Promise<ActionResult<TOutput>> {
  return async (input: TInput) => {
    try {
      const data = await action(input);
      return { success: true, data };
    } catch (error) {
      if (error instanceof ActionError) {
        return {
          success: false,
          error: error.message,
          code: error.code,
          fieldErrors: error.fieldErrors,
        };
      }

      console.error("Unhandled error:", error);
      return {
        success: false,
        error: "予期せぬエラーが発生しました",
        code: "INTERNAL_ERROR",
      };
    }
  };
}
```

### クライアント側でのエラー表示

```typescript
// components/forms/CreatePostForm.tsx
"use client";

import { useActionState } from "react";
import { createPost } from "@/app/actions/post";

export function CreatePostForm() {
  const [state, action, isPending] = useActionState(createPost, null);

  return (
    <form action={action}>
      {/* グローバルエラー */}
      {state?.success === false && !state.fieldErrors && (
        <div className="alert alert-error">{state.error}</div>
      )}

      <div>
        <label htmlFor="title">タイトル</label>
        <input
          type="text"
          id="title"
          name="title"
          className={state?.fieldErrors?.title ? "border-red-500" : ""}
        />
        {/* フィールドエラー */}
        {state?.fieldErrors?.title && (
          <p className="text-red-500 text-sm">{state.fieldErrors.title[0]}</p>
        )}
      </div>

      <button type="submit" disabled={isPending}>
        {isPending ? "送信中..." : "投稿"}
      </button>
    </form>
  );
}
```

## テスト

### Server Actions のユニットテスト

```typescript
// __tests__/actions/post.test.ts
import { createPost } from "@/app/actions/post";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";

// モックの設定
jest.mock("@/lib/db");
jest.mock("@/lib/auth");
jest.mock("next/cache", () => ({
  revalidatePath: jest.fn(),
  revalidateTag: jest.fn(),
}));

describe("createPost", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("認証されていない場合はエラーを返す", async () => {
    (auth as jest.Mock).mockResolvedValue(null);

    const formData = new FormData();
    formData.set("title", "Test Post");

    const result = await createPost(formData);

    expect(result.success).toBe(false);
    expect(result.error).toContain("認証");
  });

  it("タイトルが空の場合はバリデーションエラーを返す", async () => {
    (auth as jest.Mock).mockResolvedValue({ user: { id: "1" } });

    const formData = new FormData();
    formData.set("title", "");

    const result = await createPost(formData);

    expect(result.success).toBe(false);
    expect(result.fieldErrors?.title).toBeDefined();
  });

  it("正常に投稿を作成できる", async () => {
    (auth as jest.Mock).mockResolvedValue({ user: { id: "1" } });
    (db.post.create as jest.Mock).mockResolvedValue({
      id: "post-1",
      title: "Test Post",
    });

    const formData = new FormData();
    formData.set("title", "Test Post");
    formData.set("content", "Test content");

    const result = await createPost(formData);

    expect(result.success).toBe(true);
    expect(db.post.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        title: "Test Post",
        content: "Test content",
        authorId: "1",
      }),
    });
  });
});
```

### E2E テスト

```typescript
// e2e/post.spec.ts
import { test, expect } from "@playwright/test";

test.describe("Post creation", () => {
  test.beforeEach(async ({ page }) => {
    // ログイン状態をセットアップ
    await page.goto("/login");
    await page.fill('input[name="email"]', "test@example.com");
    await page.fill('input[name="password"]', "password");
    await page.click('button[type="submit"]');
    await page.waitForURL("/dashboard");
  });

  test("should create a new post", async ({ page }) => {
    await page.goto("/posts/new");

    await page.fill('input[name="title"]', "Test Post");
    await page.fill('textarea[name="content"]', "Test content");
    await page.click('button[type="submit"]');

    // 成功メッセージを確認
    await expect(page.locator(".toast-success")).toBeVisible();

    // 投稿一覧に遷移していることを確認
    await expect(page).toHaveURL("/posts");
    await expect(page.locator("text=Test Post")).toBeVisible();
  });

  test("should show validation error for empty title", async ({ page }) => {
    await page.goto("/posts/new");

    await page.click('button[type="submit"]');

    // バリデーションエラーを確認
    await expect(page.locator(".field-error")).toContainText("タイトル");
  });
});
```

## デバッグ

### ロギング

```typescript
// lib/logger.ts
const isDev = process.env.NODE_ENV === "development";

export const logger = {
  info: (message: string, data?: any) => {
    if (isDev) {
      console.log(`[INFO] ${message}`, data ?? "");
    }
  },
  error: (message: string, error?: any) => {
    console.error(`[ERROR] ${message}`, error ?? "");
  },
  debug: (message: string, data?: any) => {
    if (isDev) {
      console.log(`[DEBUG] ${message}`, data ?? "");
    }
  },
};

// app/actions/post.ts
("use server");

import { logger } from "@/lib/logger";

export async function createPost(formData: FormData) {
  logger.debug("createPost called", {
    title: formData.get("title"),
  });

  try {
    // ...処理
    logger.info("Post created", { id: post.id });
    return { success: true, data: post };
  } catch (error) {
    logger.error("Failed to create post", error);
    return { success: false, error: "投稿の作成に失敗しました" };
  }
}
```

### 開発ツール

```typescript
// lib/dev-utils.ts
export function measureTime<T>(name: string, fn: () => Promise<T>): Promise<T> {
  if (process.env.NODE_ENV !== "development") {
    return fn();
  }

  const start = performance.now();
  return fn().finally(() => {
    const duration = performance.now() - start;
    console.log(`[PERF] ${name}: ${duration.toFixed(2)}ms`);
  });
}

// 使用例
export async function getPosts() {
  return measureTime("getPosts", async () => {
    return db.post.findMany();
  });
}
```

## 本番運用のヒント

### エラー監視

```typescript
// lib/monitoring.ts
import * as Sentry from "@sentry/nextjs";

export function captureError(error: Error, context?: Record<string, any>) {
  if (process.env.NODE_ENV === "production") {
    Sentry.captureException(error, {
      extra: context,
    });
  } else {
    console.error(error, context);
  }
}

// app/actions/post.ts
import { captureError } from "@/lib/monitoring";

export async function createPost(formData: FormData) {
  try {
    // ...
  } catch (error) {
    captureError(error as Error, {
      action: "createPost",
      formData: Object.fromEntries(formData),
    });
    return { success: false, error: "投稿の作成に失敗しました" };
  }
}
```

### Rate Limiting（本番用）

```typescript
// lib/rate-limit.ts
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

export const ratelimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(10, "10 s"),
  analytics: true,
});

// middleware.ts
import { ratelimit } from "@/lib/rate-limit";
import { headers } from "next/headers";

export async function checkRateLimit() {
  const headersList = await headers();
  const ip = headersList.get("x-forwarded-for") ?? "127.0.0.1";

  const { success, remaining } = await ratelimit.limit(ip);

  if (!success) {
    throw new Error("Rate limit exceeded");
  }

  return { remaining };
}
```

## チェックリスト

### 開発時

- [ ] すべてのアクションで認証チェックを実装
- [ ] 入力バリデーションを Zod で実装
- [ ] エラーハンドリングを統一
- [ ] 適切なキャッシュ戦略を選択
- [ ] TypeScript の型を厳密に定義

### デプロイ前

- [ ] 環境変数が正しく設定されているか確認
- [ ] Rate Limiting が設定されているか確認
- [ ] エラー監視が設定されているか確認
- [ ] セキュリティヘッダーが設定されているか確認
- [ ] テストがすべてパスしているか確認

### 本番運用

- [ ] エラーログを定期的に確認
- [ ] パフォーマンスメトリクスを監視
- [ ] キャッシュヒット率を確認
- [ ] Rate Limit の設定を調整

## まとめ

このガイドで学んだことの総括：

1. **基礎**: Server Actions の仕組みと基本的な使い方
2. **フォーム**: useActionState、useFormStatus を使った状態管理
3. **UX**: Optimistic Updates で即座にフィードバック
4. **バリデーション**: Zod との統合、エラーハンドリング
5. **キャッシュ**: revalidatePath/revalidateTag、キャッシュ戦略
6. **セキュリティ**: 認証・認可、Rate Limiting
7. **パターン**: ファイルアップロード、ページネーション、検索
8. **ベストプラクティス**: テスト、デバッグ、本番運用

Server Actions を適切に使うことで、シンプルで安全、そして高パフォーマンスな Web アプリケーションを構築できます。

## 参考リンク

- [Next.js Server Actions ドキュメント](https://nextjs.org/docs/app/building-your-application/data-fetching/server-actions-and-mutations)
- [React Server Actions RFC](https://github.com/reactjs/rfcs/blob/main/text/0227-server-actions.md)
- [Zod ドキュメント](https://zod.dev)
- [Upstash Rate Limiting](https://upstash.com/docs/ratelimit/introduction)

---

**おめでとうございます！Server Actions Complete Guide を完了しました！**
