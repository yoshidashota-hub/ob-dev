# 09 - Error Handling（エラーハンドリング）

## この章で学ぶこと

- Server Action でのエラーハンドリングパターン
- エラー境界との連携
- ユーザーフレンドリーなエラーメッセージ
- エラーのログと監視

## エラーの種類

### 1. バリデーションエラー

ユーザー入力の問題（予期されるエラー）

### 2. ビジネスロジックエラー

権限不足、リソースの重複など

### 3. システムエラー

データベース障害、ネットワークエラーなど（予期しないエラー）

## 基本的なエラーハンドリング

### 結果オブジェクトパターン

```typescript
// app/actions/post.ts
"use server";

type ActionResult<T = void> =
  | { success: true; data: T }
  | { success: false; error: string; code?: string };

export async function createPost(
  prevState: ActionResult<{ id: string }> | null,
  formData: FormData,
): Promise<ActionResult<{ id: string }>> {
  const title = formData.get("title") as string;
  const content = formData.get("content") as string;

  // バリデーション
  if (!title || title.length < 3) {
    return {
      success: false,
      error: "タイトルは3文字以上で入力してください",
      code: "VALIDATION_ERROR",
    };
  }

  try {
    const post = await db.post.create({
      data: { title, content },
    });

    revalidatePath("/posts");
    return { success: true, data: { id: post.id } };
  } catch (error) {
    // エラーログ
    console.error("Failed to create post:", error);

    return {
      success: false,
      error: "投稿の作成に失敗しました。後でもう一度お試しください。",
      code: "INTERNAL_ERROR",
    };
  }
}
```

### フォームでの使用

```typescript
// app/components/CreatePostForm.tsx
'use client'

import { useActionState } from 'react';
import { createPost } from '@/app/actions/post';

export function CreatePostForm() {
  const [state, formAction, isPending] = useActionState(createPost, null);

  return (
    <form action={formAction}>
      <input name="title" placeholder="タイトル" />
      <textarea name="content" placeholder="内容" />

      {state?.success === false && (
        <div className="error-banner">
          <p>{state.error}</p>
          {state.code === 'VALIDATION_ERROR' && (
            <small>入力内容を確認してください</small>
          )}
        </div>
      )}

      {state?.success && (
        <div className="success-banner">
          <p>投稿が作成されました！</p>
        </div>
      )}

      <button type="submit" disabled={isPending}>
        {isPending ? '作成中...' : '投稿する'}
      </button>
    </form>
  );
}
```

## 詳細なエラー情報

### フィールド別エラー

```typescript
// app/actions/user.ts
"use server";

import { z } from "zod";

type FieldErrors = {
  [key: string]: string[];
};

type ActionResult = {
  success: boolean;
  errors?: {
    fields?: FieldErrors;
    form?: string;
  };
};

const userSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

export async function createUser(
  prevState: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const validation = userSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!validation.success) {
    return {
      success: false,
      errors: {
        fields: validation.error.flatten().fieldErrors,
      },
    };
  }

  try {
    // メール重複チェック
    const existing = await db.user.findUnique({
      where: { email: validation.data.email },
    });

    if (existing) {
      return {
        success: false,
        errors: {
          fields: { email: ["このメールアドレスは既に使用されています"] },
        },
      };
    }

    await db.user.create({ data: validation.data });
    return { success: true };
  } catch (error) {
    return {
      success: false,
      errors: {
        form: "アカウントの作成に失敗しました",
      },
    };
  }
}
```

## カスタムエラークラス

```typescript
// lib/errors.ts
export class ActionError extends Error {
  code: string;
  statusCode: number;

  constructor(
    message: string,
    code: string = "UNKNOWN_ERROR",
    statusCode: number = 500,
  ) {
    super(message);
    this.name = "ActionError";
    this.code = code;
    this.statusCode = statusCode;
  }
}

export class ValidationError extends ActionError {
  fields: Record<string, string[]>;

  constructor(fields: Record<string, string[]>) {
    super("Validation failed", "VALIDATION_ERROR", 400);
    this.name = "ValidationError";
    this.fields = fields;
  }
}

export class NotFoundError extends ActionError {
  constructor(resource: string) {
    super(`${resource} not found`, "NOT_FOUND", 404);
    this.name = "NotFoundError";
  }
}

export class UnauthorizedError extends ActionError {
  constructor(message = "認証が必要です") {
    super(message, "UNAUTHORIZED", 401);
    this.name = "UnauthorizedError";
  }
}

export class ForbiddenError extends ActionError {
  constructor(message = "アクセス権限がありません") {
    super(message, "FORBIDDEN", 403);
    this.name = "ForbiddenError";
  }
}
```

### エラークラスの使用

```typescript
// app/actions/post.ts
"use server";

import { NotFoundError, ForbiddenError, ActionError } from "@/lib/errors";
import { auth } from "@/lib/auth";

export async function deletePost(
  id: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    const session = await auth();
    if (!session?.user) {
      throw new UnauthorizedError();
    }

    const post = await db.post.findUnique({ where: { id } });
    if (!post) {
      throw new NotFoundError("投稿");
    }

    if (post.authorId !== session.user.id) {
      throw new ForbiddenError("この投稿を削除する権限がありません");
    }

    await db.post.delete({ where: { id } });
    revalidatePath("/posts");

    return { success: true };
  } catch (error) {
    if (error instanceof ActionError) {
      return { success: false, error: error.message };
    }
    console.error("Unexpected error:", error);
    return { success: false, error: "予期しないエラーが発生しました" };
  }
}
```

## エラー境界との連携

### 重大なエラーを throw する

```typescript
// app/actions/critical.ts
"use server";

export async function performCriticalAction() {
  const session = await auth();

  // 認証エラーは throw（エラー境界で処理）
  if (!session?.user) {
    throw new Error("Unauthorized");
  }

  try {
    await criticalOperation();
    return { success: true };
  } catch (error) {
    // 回復可能なエラーは結果として返す
    return { success: false, error: "操作に失敗しました" };
  }
}
```

### error.tsx でキャッチ

```typescript
// app/posts/error.tsx
'use client'

import { useEffect } from 'react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // エラーログサービスに送信
    console.error(error);
  }, [error]);

  return (
    <div className="error-page">
      <h2>エラーが発生しました</h2>
      <p>{error.message}</p>
      <button onClick={() => reset()}>もう一度試す</button>
    </div>
  );
}
```

## リトライ機能

```typescript
'use client'

import { useState, useTransition } from 'react';
import { performAction } from '@/app/actions/action';

export function RetryableAction() {
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [isPending, startTransition] = useTransition();

  const MAX_RETRIES = 3;

  const handleAction = async () => {
    setError(null);

    startTransition(async () => {
      const result = await performAction();

      if (!result.success) {
        setError(result.error);
      }
    });
  };

  const handleRetry = () => {
    if (retryCount < MAX_RETRIES) {
      setRetryCount(c => c + 1);
      handleAction();
    }
  };

  return (
    <div>
      <button onClick={handleAction} disabled={isPending}>
        {isPending ? '処理中...' : '実行'}
      </button>

      {error && (
        <div className="error">
          <p>{error}</p>
          {retryCount < MAX_RETRIES && (
            <button onClick={handleRetry}>
              再試行 ({MAX_RETRIES - retryCount} 回まで)
            </button>
          )}
        </div>
      )}
    </div>
  );
}
```

## エラーのログと監視

```typescript
// lib/logger.ts
import * as Sentry from "@sentry/nextjs";

export function logError(error: unknown, context?: Record<string, unknown>) {
  if (process.env.NODE_ENV === "production") {
    Sentry.captureException(error, {
      extra: context,
    });
  } else {
    console.error("Error:", error);
    if (context) {
      console.error("Context:", context);
    }
  }
}

// Server Action での使用
export async function riskyAction(formData: FormData) {
  try {
    // 処理...
  } catch (error) {
    logError(error, {
      action: "riskyAction",
      formData: Object.fromEntries(formData),
    });
    return { success: false, error: "処理に失敗しました" };
  }
}
```

## まとめ

- 結果オブジェクトパターンで予期されるエラーを返す
- カスタムエラークラスで詳細なエラー情報を管理
- 重大なエラーは throw してエラー境界で処理
- リトライ機能でユーザー体験を向上
- 本番環境ではエラーログを適切に収集

## 確認問題

1. 結果オブジェクトパターンと throw の使い分けを説明してください
2. バリデーションエラーとシステムエラーの違いを説明してください
3. エラー境界がキャッチするエラーの条件を説明してください
4. リトライ機能を実装する際の注意点を挙げてください

## 次の章へ

[10 - Revalidation](./10-Revalidation.md) では、キャッシュの再検証について学びます。
