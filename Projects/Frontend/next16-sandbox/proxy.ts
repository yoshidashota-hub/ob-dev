/**
 * Next.js Proxy (Next.js 16+)
 *
 * リクエストが完了する前に実行されるコード
 * 認証チェック、リダイレクト、ヘッダー追加、A/Bテストなどに使用
 *
 * Note: middleware.ts から proxy.ts に移行（Next.js 16+）
 */

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Proxy 関数（旧 middleware 関数）
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. 認証チェック（/admin パス）
  if (pathname.startsWith("/admin")) {
    const authToken = request.cookies.get("auth-token")?.value;

    // 認証トークンがない場合、ログインページにリダイレクト
    if (!authToken) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("redirect", pathname);
      return NextResponse.redirect(loginUrl);
    }

    // 認証済みの場合、リクエストを続行
    const response = NextResponse.next();
    response.headers.set("x-authenticated", "true");
    return response;
  }

  // 2. A/B テスト（/middleware-demo パス）
  if (pathname.startsWith("/middleware-demo")) {
    // ランダムにバリエーションを選択
    const abTestVariant = request.cookies.get("ab-test-variant")?.value;

    const response = NextResponse.next();

    // まだバリエーションが設定されていない場合
    if (!abTestVariant) {
      const variant = Math.random() < 0.5 ? "A" : "B";
      response.cookies.set("ab-test-variant", variant, {
        maxAge: 60 * 60 * 24 * 7, // 7日間
      });
      response.headers.set("x-ab-test-variant", variant);
    } else {
      response.headers.set("x-ab-test-variant", abTestVariant);
    }

    return response;
  }

  // 3. カスタムヘッダー追加（すべてのリクエスト）
  const response = NextResponse.next();

  // セキュリティヘッダー
  response.headers.set("x-frame-options", "DENY");
  response.headers.set("x-content-type-options", "nosniff");
  response.headers.set("referrer-policy", "origin-when-cross-origin");

  // カスタムヘッダー
  response.headers.set("x-custom-header", "Next.js 16 Proxy");
  response.headers.set("x-request-path", pathname);

  return response;
}

// Proxy を実行するパスを指定
export const config = {
  matcher: [
    /*
     * 以下を除くすべてのパスにマッチ:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (images, etc.)
     */
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
