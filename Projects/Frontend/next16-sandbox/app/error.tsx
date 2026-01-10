"use client";

/**
 * ルートレベルのエラーページ
 *
 * アプリケーション全体でキャッチされないエラーをハンドリング
 * Error Boundary として機能
 */

import { useEffect } from "react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // エラーログを送信（本番環境ではログサービスへ送信）
    console.error("Application error:", error);
  }, [error]);

  return (
    <html>
      <body>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
          <div className="max-w-2xl w-full">
            {/* エラーカード */}
            <div className="bg-white rounded-lg shadow-lg p-8 border-l-4 border-red-500">
              {/* アイコンとタイトル */}
              <div className="flex items-center mb-6">
                <div className="flex-shrink-0">
                  <svg
                    className="h-12 w-12 text-red-500"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                    />
                  </svg>
                </div>
                <div className="ml-4">
                  <h1 className="text-3xl font-bold text-gray-900">
                    エラーが発生しました
                  </h1>
                  <p className="text-sm text-gray-500 mt-1">
                    申し訳ございません。予期しないエラーが発生しました。
                  </p>
                </div>
              </div>

              {/* エラー詳細 */}
              <div className="mb-6">
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <h2 className="text-sm font-semibold text-red-800 mb-2">
                    エラー詳細:
                  </h2>
                  <p className="text-sm text-red-700 font-mono break-all">
                    {error.message || "不明なエラー"}
                  </p>
                  {error.digest && (
                    <p className="text-xs text-red-600 mt-2">
                      エラーID: {error.digest}
                    </p>
                  )}
                </div>
              </div>

              {/* アクションボタン */}
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={reset}
                  className="flex-1 px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                >
                  🔄 もう一度試す
                </button>
                <a
                  href="/"
                  className="flex-1 px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 font-semibold text-center transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
                >
                  🏠 ホームに戻る
                </a>
              </div>

              {/* サポート情報 */}
              <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                <h3 className="text-sm font-semibold text-gray-700 mb-2">
                  問題が解決しない場合:
                </h3>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• ページを再読み込みしてください</li>
                  <li>• ブラウザのキャッシュをクリアしてください</li>
                  <li>• しばらく時間をおいてから再度お試しください</li>
                  <li>
                    • 問題が続く場合は、サポートチームにお問い合わせください
                  </li>
                </ul>
              </div>
            </div>

            {/* デバッグ情報（開発環境のみ） */}
            {process.env.NODE_ENV === "development" && (
              <div className="mt-4 bg-gray-800 text-gray-100 rounded-lg p-4">
                <h3 className="text-sm font-semibold mb-2">
                  🔧 開発者情報（本番環境では非表示）
                </h3>
                <pre className="text-xs overflow-x-auto">
                  {error.stack || "スタックトレースなし"}
                </pre>
              </div>
            )}
          </div>
        </div>
      </body>
    </html>
  );
}
