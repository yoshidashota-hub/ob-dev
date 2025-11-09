---
created: 2025-11-08
tags: [nextjs, middleware, authentication, redirect, headers, examples]
status: 完了
related:
  - "[[metadata-seo-examples]]"
  - "[[Next.js-16-Extended-Learning-Path]]"
---

# Middleware 実装例

Next.js 16 の Middleware を使ったリクエストインターセプト、認証、リダイレクト、ヘッダー追加の実装例。

## 📋 概要

Middleware は、リクエストが完了する前に実行されるコードです。Edge Runtime で動作し、高速な処理が可能です。

### 主な特徴

- **リクエストインターセプト** - すべてのリクエストを処理前にキャッチ
- **認証チェック** - ページアクセス前の認証確認
- **リダイレクト** - 条件に応じた自動リダイレクト
- **ヘッダー追加** - カスタムヘッダーの自動付与
- **A/B テスト** - ユーザーごとにバリエーション分岐
- **Edge Runtime** - 高速な処理とグローバル配信

---

## 🚀 基本的な使い方

### 1. Middleware ファイルの作成

プロジェクトルートに `middleware.ts` を作成します。

```typescript
// middleware.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  console.log("Middleware が実行されました:", request.nextUrl.pathname);
  return NextResponse.next();
}

// Middleware を実行するパスを指定
export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
```

**ポイント:**

- `middleware()` 関数で処理を定義
- `NextResponse.next()` でリクエストを続行
- `matcher` で適用するパスを指定

---

## 🔐 認証チェック

### 実装例: 保護されたルート

```typescript
// middleware.ts
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // /admin パスの認証チェック
  if (pathname.startsWith("/admin")) {
    const authToken = request.cookies.get("auth-token")?.value;

    // 認証トークンがない場合、ログインページにリダイレクト
    if (!authToken) {
      const loginUrl = new URL("/login", request.url);
      // リダイレクト後に元のページに戻れるよう、クエリパラメータを追加
      loginUrl.searchParams.set("redirect", pathname);
      return NextResponse.redirect(loginUrl);
    }

    // 認証済みの場合、カスタムヘッダーを追加してリクエストを続行
    const response = NextResponse.next();
    response.headers.set("x-authenticated", "true");
    return response;
  }

  return NextResponse.next();
}
```

**使用例:**

- `/admin` → 認証されていない場合 → `/login?redirect=/admin`
- `/admin` → 認証済み → ページ表示

---

## 🔄 リダイレクト

### 1. 条件付きリダイレクト

```typescript
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 古いURLから新しいURLへリダイレクト
  if (pathname === "/old-page") {
    return NextResponse.redirect(new URL("/new-page", request.url));
  }

  // ロケールに応じたリダイレクト
  const locale = request.cookies.get("locale")?.value || "ja";
  if (pathname === "/") {
    return NextResponse.redirect(new URL(`/${locale}`, request.url));
  }

  return NextResponse.next();
}
```

---

### 2. メンテナンスモード

```typescript
export function middleware(request: NextRequest) {
  const isMaintenanceMode = process.env.MAINTENANCE_MODE === "true";
  const { pathname } = request.nextUrl;

  // メンテナンスページ以外へのアクセスをブロック
  if (isMaintenanceMode && pathname !== "/maintenance") {
    return NextResponse.redirect(new URL("/maintenance", request.url));
  }

  return NextResponse.next();
}
```

---

## 📋 カスタムヘッダー追加

### 1. セキュリティヘッダー

```typescript
export function middleware(request: NextRequest) {
  const response = NextResponse.next();

  // セキュリティヘッダーを追加
  response.headers.set("x-frame-options", "DENY");
  response.headers.set("x-content-type-options", "nosniff");
  response.headers.set("x-xss-protection", "1; mode=block");
  response.headers.set("referrer-policy", "origin-when-cross-origin");
  response.headers.set(
    "permissions-policy",
    "camera=(), microphone=(), geolocation=()"
  );

  return response;
}
```

---

### 2. CORS ヘッダー

```typescript
export function middleware(request: NextRequest) {
  const response = NextResponse.next();

  // CORS ヘッダーを追加
  response.headers.set("Access-Control-Allow-Origin", "*");
  response.headers.set(
    "Access-Control-Allow-Methods",
    "GET, POST, PUT, DELETE, OPTIONS"
  );
  response.headers.set(
    "Access-Control-Allow-Headers",
    "Content-Type, Authorization"
  );

  return response;
}
```

---

## 🔬 A/B テスト

### 実装例: ランダムバリエーション

```typescript
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith("/experiment")) {
    const abTestVariant = request.cookies.get("ab-test-variant")?.value;
    const response = NextResponse.next();

    // 初回アクセス時、ランダムにバリエーションを選択
    if (!abTestVariant) {
      const variant = Math.random() < 0.5 ? "A" : "B";
      response.cookies.set("ab-test-variant", variant, {
        maxAge: 60 * 60 * 24 * 7, // 7日間保持
        httpOnly: true,
        sameSite: "lax",
      });
      response.headers.set("x-ab-test-variant", variant);
    } else {
      response.headers.set("x-ab-test-variant", abTestVariant);
    }

    return response;
  }

  return NextResponse.next();
}
```

**ページ側での利用:**

```typescript
// app/experiment/page.tsx
import { cookies } from "next/headers";

export default async function ExperimentPage() {
  const cookieStore = await cookies();
  const variant = cookieStore.get("ab-test-variant")?.value;

  return (
    <div>
      {variant === "A" && <VariantA />}
      {variant === "B" && <VariantB />}
    </div>
  );
}
```

---

## 🌍 ロケール判定

### 実装例: 自動言語振り分け

```typescript
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // すでにロケールが含まれている場合はスキップ
  if (pathname.startsWith("/ja") || pathname.startsWith("/en")) {
    return NextResponse.next();
  }

  // Accept-Language ヘッダーから言語を判定
  const acceptLanguage = request.headers.get("accept-language") || "";
  const locale = acceptLanguage.startsWith("ja") ? "ja" : "en";

  // Cookie から言語設定を取得（優先）
  const savedLocale = request.cookies.get("locale")?.value || locale;

  // ロケール付きURLにリダイレクト
  return NextResponse.redirect(
    new URL(`/${savedLocale}${pathname}`, request.url)
  );
}
```

---

## 🚦 レート制限

### 実装例: 簡易レート制限

```typescript
// Map を使った簡易的なレート制限（本番環境では Redis などを使用）
const rateLimit = new Map<string, { count: number; resetTime: number }>();

export function middleware(request: NextRequest) {
  const ip = request.ip || "unknown";
  const now = Date.now();
  const windowMs = 60 * 1000; // 1分間
  const maxRequests = 100; // 1分間に100リクエストまで

  const record = rateLimit.get(ip);

  if (record) {
    if (now < record.resetTime) {
      // ウィンドウ内
      if (record.count >= maxRequests) {
        return new NextResponse("Too Many Requests", { status: 429 });
      }
      record.count++;
    } else {
      // ウィンドウリセット
      rateLimit.set(ip, { count: 1, resetTime: now + windowMs });
    }
  } else {
    // 初回リクエスト
    rateLimit.set(ip, { count: 1, resetTime: now + windowMs });
  }

  return NextResponse.next();
}
```

**注意:** Edge Runtime では永続的なストレージがないため、本番環境では Redis や外部サービスを使用してください。

---

## 🔧 Matcher の設定

### 1. 基本的なパスマッチング

```typescript
export const config = {
  matcher: [
    "/admin/:path*", // /admin 配下すべて
    "/api/:path*", // /api 配下すべて
    "/((?!public).*)", // public 以外すべて
  ],
};
```

---

### 2. 除外パターン

```typescript
export const config = {
  matcher: [
    /*
     * 以下を除くすべてのパスにマッチ:
     * - api (API routes)
     * - _next/static (静的ファイル)
     * - _next/image (画像最適化)
     * - favicon.ico
     * - 画像ファイル (.svg, .png, .jpg など)
     */
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
```

---

### 3. 複数の Matcher

```typescript
export const config = {
  matcher: ["/admin/:path*", "/dashboard/:path*", "/profile/:path*"],
};
```

---

## 💡 ベストプラクティス

### 1. Middleware の実行順序

Middleware は **単一ファイル** のみサポートされます。複数の処理を行う場合は、条件分岐で管理します。

```typescript
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. 認証チェック
  if (pathname.startsWith("/admin")) {
    // 認証処理...
  }

  // 2. A/B テスト
  if (pathname.startsWith("/experiment")) {
    // A/B テスト処理...
  }

  // 3. 共通ヘッダー追加
  const response = NextResponse.next();
  response.headers.set("x-custom-header", "value");
  return response;
}
```

---

### 2. パフォーマンス最適化

**❌ 悪い例:**

```typescript
// 重い処理を Middleware に書く
export function middleware(request: NextRequest) {
  const data = await fetchFromDatabase(); // 遅い！
  // ...
}
```

**✅ 良い例:**

```typescript
// 軽量な処理のみ Middleware で行う
export function middleware(request: NextRequest) {
  const token = request.cookies.get("auth-token");
  if (!token) {
    return NextResponse.redirect(new URL("/login", request.url));
  }
  return NextResponse.next();
}
```

**推奨:**

- Cookie/ヘッダーの確認のみ
- データベースアクセスは避ける
- 重い処理は Server Component で行う

---

### 3. Edge Runtime の制限

Middleware は Edge Runtime で実行されるため、一部の Node.js API が使えません。

**使用不可:**

- `fs` モジュール
- データベースの直接接続
- 一部の npm パッケージ

**使用可能:**

- `fetch` API
- Cookie/ヘッダー操作
- URL 操作
- 軽量な計算

---

## 🚀 実装済みファイル

### プロジェクト内の実装

```
next16-sandbox/
├── middleware.ts              # ルート Middleware
├── app/
│   ├── login/
│   │   └── page.tsx           # ログインページ
│   ├── admin/
│   │   └── page.tsx           # 認証が必要なページ
│   └── middleware-demo/
│       └── page.tsx           # A/B テストデモ
```

### アクセス方法

- **ログイン**: http://localhost:3000/login
  - ユーザー名: `admin`
  - パスワード: `password`
- **管理画面**: http://localhost:3000/admin （認証必要）
- **Middleware デモ**: http://localhost:3000/middleware-demo

---

## 📊 実装パターン

### パターン 1: 認証 + リダイレクト

```typescript
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 保護されたルートリスト
  const protectedRoutes = ["/admin", "/dashboard", "/profile"];
  const isProtectedRoute = protectedRoutes.some((route) =>
    pathname.startsWith(route)
  );

  if (isProtectedRoute) {
    const token = request.cookies.get("auth-token")?.value;

    if (!token) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("redirect", pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}
```

---

### パターン 2: ロール別アクセス制御

```typescript
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith("/admin")) {
    const role = request.cookies.get("user-role")?.value;

    // 管理者のみアクセス可能
    if (role !== "admin") {
      return NextResponse.redirect(new URL("/unauthorized", request.url));
    }
  }

  return NextResponse.next();
}
```

---

### パターン 3: 地域制限

```typescript
export function middleware(request: NextRequest) {
  // Vercel では自動的に地域情報が取得できる
  const country = request.geo?.country || "US";

  // 特定の国からのアクセスを制限
  if (country === "XX") {
    return new NextResponse("Access Denied", { status: 403 });
  }

  // 国別にコンテンツを変える
  const response = NextResponse.next();
  response.headers.set("x-user-country", country);
  return response;
}
```

---

## 🔍 デバッグ

### console.log の使用

```typescript
export function middleware(request: NextRequest) {
  console.log("=== Middleware Debug ===");
  console.log("Path:", request.nextUrl.pathname);
  console.log("Method:", request.method);
  console.log("Cookies:", request.cookies.getAll());
  console.log("Headers:", Object.fromEntries(request.headers));
  console.log("========================");

  return NextResponse.next();
}
```

**注意:** Edge Runtime のログは Vercel のログで確認できます。ローカルでは開発サーバーのターミナルに出力されます。

---

## 📚 参考リンク

- [Next.js Middleware Documentation](https://nextjs.org/docs/app/building-your-application/routing/middleware)
- [Edge Runtime](https://nextjs.org/docs/app/api-reference/edge)
- [NextResponse API](https://nextjs.org/docs/app/api-reference/functions/next-response)

---

## 🎓 学習のポイント

1. **リクエストインターセプト** - すべてのリクエストを処理前にキャッチ
2. **認証フロー** - Cookie/トークンベースの認証
3. **条件付きリダイレクト** - URL 書き換えとリダイレクト
4. **ヘッダー操作** - セキュリティヘッダーとカスタムヘッダー
5. **Edge Runtime** - 高速処理と制約の理解

---

**作成日**: 2025-11-08
**Phase 1.5**: Middleware 実装完了
