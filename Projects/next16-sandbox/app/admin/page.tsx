/**
 * 管理画面ページ
 *
 * Middleware で認証チェックされる保護されたページ
 */

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AdminPage() {
  const router = useRouter();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    setIsLoggingOut(true);

    // ログアウトAPI を呼び出し
    await fetch("/api/auth", {
      method: "DELETE",
    });

    // ログインページにリダイレクト
    router.push("/login");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 py-12 px-4">
      <div className="max-w-6xl mx-auto">
        {/* ヘッダー */}
        <div className="mb-8">
          <a
            href="/"
            className="text-blue-600 hover:text-blue-800 mb-4 inline-block"
          >
            ← ホームに戻る
          </a>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 mb-2">
                管理画面
              </h1>
              <p className="text-gray-600">
                Middleware で保護されたページ
              </p>
            </div>
            <button
              onClick={handleLogout}
              disabled={isLoggingOut}
              className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-gray-400 transition-colors"
            >
              {isLoggingOut ? "ログアウト中..." : "ログアウト"}
            </button>
          </div>
        </div>

        {/* 認証成功メッセージ */}
        <div className="bg-green-50 border-2 border-green-500 rounded-lg p-6 mb-8">
          <div className="flex items-center">
            <span className="text-4xl mr-4">✅</span>
            <div>
              <h2 className="text-xl font-semibold text-green-900 mb-1">
                認証成功
              </h2>
              <p className="text-green-700">
                Middleware の認証チェックをパスしました。このページは認証されたユーザーのみがアクセスできます。
              </p>
            </div>
          </div>
        </div>

        {/* Middleware の動作説明 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* 認証チェック */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">
              🔐 認証チェック
            </h3>
            <div className="space-y-3 text-gray-700">
              <p className="text-sm">
                <strong>1. リクエストインターセプト</strong>
                <br />
                Middleware が /admin パスへのアクセスを検知
              </p>
              <p className="text-sm">
                <strong>2. トークン確認</strong>
                <br />
                Cookie から auth-token を取得
              </p>
              <p className="text-sm">
                <strong>3. リダイレクト判定</strong>
                <br />
                トークンがない場合 → ログインページへ
                <br />
                トークンがある場合 → ページ表示
              </p>
            </div>
          </div>

          {/* カスタムヘッダー */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">
              📋 カスタムヘッダー
            </h3>
            <div className="space-y-2 text-sm font-mono text-gray-700 bg-gray-50 p-4 rounded">
              <p>x-authenticated: true</p>
              <p>x-custom-header: Next.js 16 Middleware</p>
              <p>x-request-path: /admin</p>
              <p>x-frame-options: DENY</p>
              <p>x-content-type-options: nosniff</p>
            </div>
            <p className="text-sm text-gray-600 mt-3">
              Middleware によって自動的に追加されたヘッダー
            </p>
          </div>
        </div>

        {/* 管理機能（デモ） */}
        <div className="bg-white rounded-lg shadow-md p-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-6">
            管理機能
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* ダッシュボード */}
            <div className="p-6 bg-blue-50 rounded-lg hover:shadow-md transition-shadow">
              <div className="text-3xl mb-3">📊</div>
              <h3 className="font-semibold text-gray-900 mb-2">
                ダッシュボード
              </h3>
              <p className="text-sm text-gray-600">
                統計情報とアナリティクス
              </p>
            </div>

            {/* ユーザー管理 */}
            <div className="p-6 bg-green-50 rounded-lg hover:shadow-md transition-shadow">
              <div className="text-3xl mb-3">👥</div>
              <h3 className="font-semibold text-gray-900 mb-2">
                ユーザー管理
              </h3>
              <p className="text-sm text-gray-600">
                ユーザーの追加・編集・削除
              </p>
            </div>

            {/* 設定 */}
            <div className="p-6 bg-purple-50 rounded-lg hover:shadow-md transition-shadow">
              <div className="text-3xl mb-3">⚙️</div>
              <h3 className="font-semibold text-gray-900 mb-2">
                システム設定
              </h3>
              <p className="text-sm text-gray-600">
                サイト設定とカスタマイズ
              </p>
            </div>
          </div>
        </div>

        {/* 実装コード */}
        <div className="mt-8 bg-white rounded-lg shadow-md p-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">
            📝 Middleware 実装コード
          </h2>
          <pre className="bg-gray-900 text-gray-100 p-6 rounded-lg overflow-x-auto text-sm">
{`// middleware.ts
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // /admin パスの認証チェック
  if (pathname.startsWith("/admin")) {
    const authToken = request.cookies.get("auth-token")?.value;

    // 認証トークンがない場合、ログインページへ
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
}`}
          </pre>
        </div>
      </div>
    </div>
  );
}
