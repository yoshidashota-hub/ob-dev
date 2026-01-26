# 12 - Security（セキュリティ）

## この章で学ぶこと

- Server Actions のセキュリティモデル
- 認証・認可の実装
- CSRF 対策
- 入力サニタイズと SQL インジェクション対策
- Rate Limiting の実装

## Server Actions のセキュリティモデル

### 基本的なセキュリティ特性

```typescript
// Server Actions は自動的に以下を提供:
// 1. POST リクエストのみ受け付け
// 2. 暗号化されたアクションID
// 3. Content-Type のチェック
// 4. Origin ヘッダーの検証（CSRF 対策）

"use server";

export async function secureAction(formData: FormData) {
  // このコードはサーバーでのみ実行される
  // クライアントには暗号化されたリファレンスのみ公開
}
```

### 認証チェック

```typescript
// app/actions/post.ts
"use server";

import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";

export async function createPost(formData: FormData) {
  // 認証チェック（必須）
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }

  const title = formData.get("title") as string;
  const content = formData.get("content") as string;

  await db.post.create({
    data: {
      title,
      content,
      authorId: session.user.id,
    },
  });
}
```

## 認可パターン

### 所有者チェック

```typescript
// app/actions/post.ts
"use server";

import { auth } from "@/lib/auth";

export async function updatePost(postId: string, formData: FormData) {
  const session = await auth();
  if (!session?.user) {
    return { error: "認証が必要です" };
  }

  // 投稿の所有者を確認
  const post = await db.post.findUnique({
    where: { id: postId },
    select: { authorId: true },
  });

  if (!post) {
    return { error: "投稿が見つかりません" };
  }

  if (post.authorId !== session.user.id) {
    return { error: "この投稿を編集する権限がありません" };
  }

  // 安全に更新
  await db.post.update({
    where: { id: postId },
    data: {
      title: formData.get("title") as string,
      content: formData.get("content") as string,
    },
  });

  return { success: true };
}
```

### ロールベースの認可

```typescript
// lib/auth-utils.ts
import { auth } from "@/lib/auth";

export async function requireAuth() {
  const session = await auth();
  if (!session?.user) {
    throw new Error("認証が必要です");
  }
  return session;
}

export async function requireRole(allowedRoles: string[]) {
  const session = await requireAuth();
  if (!allowedRoles.includes(session.user.role)) {
    throw new Error("権限がありません");
  }
  return session;
}

// app/actions/admin.ts
("use server");

import { requireRole } from "@/lib/auth-utils";

export async function deleteUser(userId: string) {
  await requireRole(["admin"]);

  await db.user.delete({ where: { id: userId } });
  return { success: true };
}

export async function moderateContent(contentId: string) {
  await requireRole(["admin", "moderator"]);

  await db.content.update({
    where: { id: contentId },
    data: { status: "approved" },
  });
  return { success: true };
}
```

### 権限チェックのヘルパー

```typescript
// lib/permissions.ts
import { auth } from "@/lib/auth";

type Resource = "post" | "comment" | "user";
type Action = "create" | "read" | "update" | "delete";

const permissions: Record<string, Record<Resource, Action[]>> = {
  user: {
    post: ["create", "read"],
    comment: ["create", "read", "delete"],
    user: ["read"],
  },
  moderator: {
    post: ["create", "read", "update"],
    comment: ["create", "read", "update", "delete"],
    user: ["read"],
  },
  admin: {
    post: ["create", "read", "update", "delete"],
    comment: ["create", "read", "update", "delete"],
    user: ["create", "read", "update", "delete"],
  },
};

export async function can(
  resource: Resource,
  action: Action,
): Promise<boolean> {
  const session = await auth();
  if (!session?.user) return false;

  const role = session.user.role || "user";
  return permissions[role]?.[resource]?.includes(action) ?? false;
}

// app/actions/post.ts
("use server");

export async function deletePost(postId: string) {
  if (!(await can("post", "delete"))) {
    return { error: "権限がありません" };
  }

  await db.post.delete({ where: { id: postId } });
  return { success: true };
}
```

## 入力のサニタイズ

### XSS 対策

```typescript
// lib/sanitize.ts
import DOMPurify from "isomorphic-dompurify";

export function sanitizeHtml(dirty: string): string {
  return DOMPurify.sanitize(dirty, {
    ALLOWED_TAGS: ["b", "i", "em", "strong", "a", "p", "br"],
    ALLOWED_ATTR: ["href"],
  });
}

export function escapeHtml(text: string): string {
  const map: Record<string, string> = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;",
  };
  return text.replace(/[&<>"']/g, (char) => map[char]);
}

// app/actions/comment.ts
("use server");

import { sanitizeHtml } from "@/lib/sanitize";

export async function createComment(postId: string, formData: FormData) {
  const content = formData.get("content") as string;

  // HTML をサニタイズ
  const sanitizedContent = sanitizeHtml(content);

  await db.comment.create({
    data: {
      postId,
      content: sanitizedContent,
    },
  });
}
```

### SQL インジェクション対策

```typescript
// ❌ 悪い例: 文字列連結
export async function searchPosts(query: string) {
  // 脆弱: SQLインジェクションの可能性
  return db.$queryRaw`SELECT * FROM posts WHERE title LIKE '%${query}%'`;
}

// ✅ 良い例: パラメータ化クエリ（Prisma は自動的に対応）
export async function searchPosts(query: string) {
  return db.post.findMany({
    where: {
      title: {
        contains: query,
        mode: "insensitive",
      },
    },
  });
}

// ✅ 生のSQLを使う場合は $queryRaw のテンプレートリテラルを使用
export async function searchPostsRaw(query: string) {
  return db.$queryRaw`
    SELECT * FROM posts
    WHERE title ILIKE ${`%${query}%`}
  `;
}
```

## Rate Limiting

### 基本的な実装

```typescript
// lib/rate-limit.ts
import { headers } from "next/headers";

const rateLimit = new Map<string, { count: number; timestamp: number }>();

export async function checkRateLimit(
  action: string,
  limit: number = 10,
  windowMs: number = 60000,
): Promise<{ success: boolean; remaining: number }> {
  const headersList = await headers();
  const ip = headersList.get("x-forwarded-for") || "unknown";
  const key = `${action}:${ip}`;
  const now = Date.now();

  const record = rateLimit.get(key);

  if (!record || now - record.timestamp > windowMs) {
    rateLimit.set(key, { count: 1, timestamp: now });
    return { success: true, remaining: limit - 1 };
  }

  if (record.count >= limit) {
    return { success: false, remaining: 0 };
  }

  record.count++;
  return { success: true, remaining: limit - record.count };
}

// app/actions/auth.ts
("use server");

import { checkRateLimit } from "@/lib/rate-limit";

export async function login(formData: FormData) {
  // ログイン試行を制限（1分間に5回まで）
  const rateLimitResult = await checkRateLimit("login", 5, 60000);

  if (!rateLimitResult.success) {
    return {
      error: "ログイン試行回数が上限に達しました。しばらくお待ちください。",
    };
  }

  // ログイン処理...
}
```

### Redis を使った本番用 Rate Limiting

```typescript
// lib/rate-limit-redis.ts
import { Redis } from "@upstash/redis";
import { Ratelimit } from "@upstash/ratelimit";

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

const ratelimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(10, "1 m"), // 1分間に10リクエスト
  analytics: true,
});

export async function checkRateLimit(identifier: string) {
  const { success, remaining, reset } = await ratelimit.limit(identifier);
  return { success, remaining, reset };
}

// app/actions/api.ts
("use server");

import { headers } from "next/headers";
import { checkRateLimit } from "@/lib/rate-limit-redis";

export async function sensitiveAction(formData: FormData) {
  const headersList = await headers();
  const ip = headersList.get("x-forwarded-for") || "anonymous";

  const { success, remaining } = await checkRateLimit(`sensitive:${ip}`);

  if (!success) {
    return {
      error: "リクエスト数の上限に達しました",
      retryAfter: 60,
    };
  }

  // 処理を続行...
}
```

## CSRF 対策

### Next.js のビルトイン対策

```typescript
// Server Actions は自動的にCSRF対策を提供:
// - Same-Origin チェック
// - POST リクエストのみ受け付け
// - Content-Type の検証

// 追加のカスタムトークン検証が必要な場合
// lib/csrf.ts
import { cookies } from "next/headers";
import { randomBytes, createHmac } from "crypto";

const SECRET = process.env.CSRF_SECRET!;

export async function generateCsrfToken(): Promise<string> {
  const token = randomBytes(32).toString("hex");
  const signature = createHmac("sha256", SECRET).update(token).digest("hex");

  const cookieStore = await cookies();
  cookieStore.set("csrf-token", `${token}.${signature}`, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
  });

  return token;
}

export async function verifyCsrfToken(token: string): Promise<boolean> {
  const cookieStore = await cookies();
  const stored = cookieStore.get("csrf-token")?.value;

  if (!stored) return false;

  const [storedToken, storedSignature] = stored.split(".");
  const expectedSignature = createHmac("sha256", SECRET)
    .update(storedToken)
    .digest("hex");

  return storedToken === token && storedSignature === expectedSignature;
}
```

## セキュリティヘッダー

### middleware.ts での設定

```typescript
// middleware.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const response = NextResponse.next();

  // セキュリティヘッダーを追加
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-XSS-Protection", "1; mode=block");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");

  // CSP ヘッダー
  response.headers.set(
    "Content-Security-Policy",
    "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline';",
  );

  return response;
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
```

## センシティブデータの保護

### 環境変数の管理

```typescript
// ❌ 悪い例: ハードコード
export async function connectToDatabase() {
  return new Client({
    connectionString: "postgres://user:password@localhost:5432/db",
  });
}

// ✅ 良い例: 環境変数を使用
export async function connectToDatabase() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is not defined");
  }
  return new Client({
    connectionString: process.env.DATABASE_URL,
  });
}
```

### レスポンスからの機密情報除外

```typescript
// app/actions/user.ts
"use server";

export async function getUser(userId: string) {
  const user = await db.user.findUnique({
    where: { id: userId },
  });

  if (!user) return null;

  // パスワードハッシュなどの機密情報を除外
  const { passwordHash, twoFactorSecret, ...safeUser } = user;

  return safeUser;
}
```

## まとめ

- すべての Server Actions で認証・認可をチェック
- 入力は必ずサニタイズ・検証する
- Rate Limiting で悪用を防止
- Prisma などの ORM で SQL インジェクションを防止
- センシティブデータは環境変数で管理
- レスポンスから機密情報を除外

## 確認問題

1. Server Actions がデフォルトで提供するセキュリティ機能を説明してください
2. ロールベースの認可を実装してください
3. Rate Limiting の実装方法を説明してください
4. XSS 対策と SQL インジェクション対策の違いを説明してください

## 次の章へ

[13 - Patterns](./13-Patterns.md) では、Server Actions の実践的なパターンを学びます。
