/**
 * ログインページ
 *
 * Middleware の認証チェックのデモ用
 */

"use client";

import { useSearchParams } from "next/navigation";
import { useState } from "react";

export default function LoginPage() {
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect") || "/admin";
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState("");

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage("");

    const formData = new FormData(e.currentTarget);
    const username = formData.get("username") as string;
    const password = formData.get("password") as string;

    // デモ用の簡易認証（実際のプロジェクトでは適切な認証を実装）
    if (username === "admin" && password === "password") {
      // API経由で認証トークンを設定
      const response = await fetch("/api/auth", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username, password }),
      });

      if (response.ok) {
        setMessage("ログイン成功！リダイレクト中...");
        // リダイレクト先へ移動
        setTimeout(() => {
          window.location.href = redirect;
        }, 1000);
      } else {
        setMessage("ログインに失敗しました");
        setIsLoading(false);
      }
    } else {
      setMessage("ユーザー名またはパスワードが正しくありません");
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center py-12 px-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8">
        {/* ヘッダー */}
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">ログイン</h1>
          <p className="text-gray-600">
            Middleware 認証チェックのデモ
          </p>
        </div>

        {/* ログインフォーム */}
        <form onSubmit={handleLogin} className="space-y-6">
          {/* ユーザー名 */}
          <div>
            <label
              htmlFor="username"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              ユーザー名
            </label>
            <input
              type="text"
              id="username"
              name="username"
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="admin"
            />
          </div>

          {/* パスワード */}
          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              パスワード
            </label>
            <input
              type="password"
              id="password"
              name="password"
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="password"
            />
          </div>

          {/* メッセージ */}
          {message && (
            <div
              className={`p-3 rounded ${
                message.includes("成功")
                  ? "bg-green-100 text-green-800"
                  : "bg-red-100 text-red-800"
              }`}
            >
              {message}
            </div>
          )}

          {/* ログインボタン */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
          >
            {isLoading ? "ログイン中..." : "ログイン"}
          </button>
        </form>

        {/* デモ用の認証情報 */}
        <div className="mt-8 p-4 bg-blue-50 rounded-lg">
          <h3 className="text-sm font-semibold text-blue-900 mb-2">
            デモ用認証情報
          </h3>
          <div className="text-sm text-blue-800 space-y-1">
            <p>
              <strong>ユーザー名:</strong> admin
            </p>
            <p>
              <strong>パスワード:</strong> password
            </p>
          </div>
        </div>

        {/* ホームに戻る */}
        <div className="mt-6 text-center">
          <a href="/" className="text-blue-600 hover:text-blue-800 text-sm">
            ← ホームに戻る
          </a>
        </div>
      </div>
    </div>
  );
}
