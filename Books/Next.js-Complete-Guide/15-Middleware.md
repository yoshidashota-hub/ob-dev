# 15 - Middleware

## 概要

この章では、Next.js のミドルウェアについて学びます。リクエストが完了する前にコードを実行し、認証、リダイレクト、ヘッダー操作などを行う方法を解説します。

## Middleware の基本

### 基本的な構文

```typescript
// middleware.ts（プロジェクトルートに配置）
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  return NextResponse.next();
}

export const config = {
  matcher: "/about/:path*",
};
```

### 配置場所

```plaintext
project/
├── middleware.ts   # ここに配置
├── app/
├── pages/
└── ...
```

## マッチャー設定

### 基本的なマッチャー

```typescript
export const config = {
  matcher: "/dashboard/:path*",
};
```

### 複数のパス

```typescript
export const config = {
  matcher: ["/dashboard/:path*", "/account/:path*", "/api/:path*"],
};
```

### 除外パターン

```typescript
export const config = {
  matcher: [
    // 静的ファイルと API を除外
    "/((?!api|_next/static|_next/image|favicon.ico).*)",
  ],
};
```

### 条件付きマッチング

```typescript
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  // パスベースの条件
  if (request.nextUrl.pathname.startsWith("/dashboard")) {
    // ダッシュボード用のロジック
  }

  if (request.nextUrl.pathname.startsWith("/api")) {
    // API 用のロジック
  }

  return NextResponse.next();
}
```

## 認証

### 基本的な認証チェック

```typescript
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const token = request.cookies.get("token")?.value;

  // 認証が必要なパス
  if (request.nextUrl.pathname.startsWith("/dashboard")) {
    if (!token) {
      return NextResponse.redirect(new URL("/login", request.url));
    }
  }

  // ログイン済みユーザーは認証ページにアクセスできない
  if (request.nextUrl.pathname.startsWith("/login")) {
    if (token) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/login"],
};
```

### JWT 検証

```typescript
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET);

async function verifyToken(token: string) {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return payload;
  } catch {
    return null;
  }
}

export async function middleware(request: NextRequest) {
  const token = request.cookies.get("token")?.value;

  if (request.nextUrl.pathname.startsWith("/dashboard")) {
    if (!token) {
      return NextResponse.redirect(new URL("/login", request.url));
    }

    const payload = await verifyToken(token);

    if (!payload) {
      const response = NextResponse.redirect(new URL("/login", request.url));
      response.cookies.delete("token");
      return response;
    }
  }

  return NextResponse.next();
}
```

### ロールベースアクセス制御

```typescript
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

interface JWTPayload {
  userId: string;
  role: "user" | "admin";
}

export async function middleware(request: NextRequest) {
  const token = request.cookies.get("token")?.value;

  if (!token) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  const payload = (await verifyToken(token)) as JWTPayload | null;

  if (!payload) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // 管理者ページ
  if (request.nextUrl.pathname.startsWith("/admin")) {
    if (payload.role !== "admin") {
      return NextResponse.redirect(new URL("/unauthorized", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/admin/:path*"],
};
```

## リダイレクト

### 基本的なリダイレクト

```typescript
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  // 古い URL から新しい URL へリダイレクト
  if (request.nextUrl.pathname === "/old-page") {
    return NextResponse.redirect(new URL("/new-page", request.url));
  }

  return NextResponse.next();
}
```

### 国際化リダイレクト

```typescript
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const locales = ["en", "ja", "ko"];
const defaultLocale = "en";

function getLocale(request: NextRequest) {
  const acceptLanguage = request.headers.get("accept-language");

  if (acceptLanguage) {
    const preferredLocale = acceptLanguage.split(",")[0].split("-")[0];
    if (locales.includes(preferredLocale)) {
      return preferredLocale;
    }
  }

  return defaultLocale;
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // ロケールがパスに含まれているかチェック
  const pathnameHasLocale = locales.some(
    (locale) => pathname.startsWith(`/${locale}/`) || pathname === `/${locale}`
  );

  if (pathnameHasLocale) return NextResponse.next();

  // ロケールを検出してリダイレクト
  const locale = getLocale(request);
  request.nextUrl.pathname = `/${locale}${pathname}`;

  return NextResponse.redirect(request.nextUrl);
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
```

## リライト

### URL の書き換え

```typescript
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  // ユーザーには /blog を見せるが、内部では /posts にルーティング
  if (request.nextUrl.pathname.startsWith("/blog")) {
    const newPath = request.nextUrl.pathname.replace("/blog", "/posts");
    return NextResponse.rewrite(new URL(newPath, request.url));
  }

  return NextResponse.next();
}
```

### A/B テスト

```typescript
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  if (request.nextUrl.pathname === "/") {
    // Cookie でバリアントを保持
    const variant = request.cookies.get("ab-variant")?.value;

    if (!variant) {
      // 50/50 で振り分け
      const newVariant = Math.random() < 0.5 ? "a" : "b";
      const response = NextResponse.rewrite(
        new URL(`/home/${newVariant}`, request.url)
      );
      response.cookies.set("ab-variant", newVariant);
      return response;
    }

    return NextResponse.rewrite(new URL(`/home/${variant}`, request.url));
  }

  return NextResponse.next();
}
```

## ヘッダー操作

### リクエストヘッダー

```typescript
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  // リクエストヘッダーを追加
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-request-id", crypto.randomUUID());
  requestHeaders.set("x-pathname", request.nextUrl.pathname);

  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
}
```

### レスポンスヘッダー

```typescript
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const response = NextResponse.next();

  // セキュリティヘッダー
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("Referrer-Policy", "origin-when-cross-origin");
  response.headers.set(
    "Content-Security-Policy",
    "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval';"
  );

  return response;
}
```

## Cookie 操作

### Cookie の読み書き

```typescript
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  // Cookie を読む
  const theme = request.cookies.get("theme")?.value || "light";
  const visitCount = parseInt(request.cookies.get("visits")?.value || "0");

  const response = NextResponse.next();

  // Cookie を設定
  response.cookies.set("theme", theme);
  response.cookies.set("visits", String(visitCount + 1), {
    maxAge: 60 * 60 * 24 * 365, // 1年
  });

  // Cookie を削除
  if (request.nextUrl.pathname === "/logout") {
    response.cookies.delete("token");
  }

  return response;
}
```

## レート制限

### 簡易レート制限

```typescript
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const rateLimit = new Map<string, { count: number; timestamp: number }>();

const WINDOW_SIZE = 60 * 1000; // 1分
const MAX_REQUESTS = 100;

export function middleware(request: NextRequest) {
  if (request.nextUrl.pathname.startsWith("/api")) {
    const ip = request.headers.get("x-forwarded-for") || "anonymous";
    const now = Date.now();

    const record = rateLimit.get(ip);

    if (!record || now - record.timestamp > WINDOW_SIZE) {
      rateLimit.set(ip, { count: 1, timestamp: now });
    } else if (record.count >= MAX_REQUESTS) {
      return new NextResponse("Too Many Requests", { status: 429 });
    } else {
      record.count++;
    }
  }

  return NextResponse.next();
}
```

## ロギング

```typescript
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const start = Date.now();

  const response = NextResponse.next();

  // リクエストログ
  console.log({
    method: request.method,
    path: request.nextUrl.pathname,
    timestamp: new Date().toISOString(),
    userAgent: request.headers.get("user-agent"),
    ip: request.headers.get("x-forwarded-for"),
  });

  return response;
}
```

## 完全な例

```typescript
// middleware.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET);

const publicPaths = ["/", "/login", "/register", "/api/auth"];
const adminPaths = ["/admin"];

async function verifyToken(token: string) {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return payload as { userId: string; role: string };
  } catch {
    return null;
  }
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // リクエスト ID を追加
  const requestId = crypto.randomUUID();
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-request-id", requestId);

  // 公開パスはスキップ
  if (publicPaths.some((path) => pathname.startsWith(path))) {
    return NextResponse.next({
      request: { headers: requestHeaders },
    });
  }

  // 認証チェック
  const token = request.cookies.get("token")?.value;

  if (!token) {
    const url = new URL("/login", request.url);
    url.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(url);
  }

  const payload = await verifyToken(token);

  if (!payload) {
    const response = NextResponse.redirect(new URL("/login", request.url));
    response.cookies.delete("token");
    return response;
  }

  // 管理者チェック
  if (adminPaths.some((path) => pathname.startsWith(path))) {
    if (payload.role !== "admin") {
      return NextResponse.redirect(new URL("/unauthorized", request.url));
    }
  }

  // ユーザー情報をヘッダーに追加
  requestHeaders.set("x-user-id", payload.userId);
  requestHeaders.set("x-user-role", payload.role);

  const response = NextResponse.next({
    request: { headers: requestHeaders },
  });

  // セキュリティヘッダー
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-Content-Type-Options", "nosniff");

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
```

## まとめ

- **middleware.ts** はプロジェクトルートに配置
- **matcher** でルートをフィルタリング
- **NextResponse.redirect()** でリダイレクト
- **NextResponse.rewrite()** で URL を書き換え
- **NextResponse.next()** で処理を継続
- **ヘッダー**と **Cookie** を操作可能
- **認証**、**国際化**、**A/B テスト**に活用

## 演習問題

1. 認証ミドルウェアを実装してください
2. 国際化リダイレクトを実装してください
3. セキュリティヘッダーを追加してください
4. レート制限を実装してください

## 次のステップ

次の章では、認証の実装について学びます。

⬅️ 前へ: [14-API-Routes.md](./14-API-Routes.md)
➡️ 次へ: [16-Authentication.md](./16-Authentication.md)
