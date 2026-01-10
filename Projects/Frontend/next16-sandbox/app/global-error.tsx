"use client";

/**
 * グローバルエラーページ
 *
 * ルートレイアウトでキャッチされないエラーをハンドリング
 * 最後の砦として機能
 */

import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // 重大なエラーログを送信
    console.error("Critical global error:", error);

    // 本番環境ではエラー監視サービスに送信
    // if (typeof window !== 'undefined') {
    //   trackError(error);
    // }
  }, [error]);

  return (
    <html>
      <body>
        <div className="min-h-screen bg-gradient-to-br from-red-50 to-red-100 flex items-center justify-center px-4">
          <div className="max-w-2xl w-full">
            <div className="bg-white rounded-2xl shadow-2xl p-8 border-4 border-red-500">
              {/* 重大なエラー表示 */}
              <div className="text-center mb-8">
                <div className="inline-block p-4 bg-red-100 rounded-full mb-4">
                  <svg
                    className="h-16 w-16 text-red-600"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
                <h1 className="text-4xl font-bold text-gray-900 mb-2">
                  重大なエラー
                </h1>
                <p className="text-lg text-gray-600">
                  アプリケーションで予期しない問題が発生しました
                </p>
              </div>

              {/* エラーメッセージ */}
              <div className="mb-6">
                <div className="bg-red-50 border-2 border-red-300 rounded-lg p-6">
                  <div className="flex items-start">
                    <svg
                      className="h-5 w-5 text-red-600 mt-0.5 mr-3 flex-shrink-0"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <div className="flex-1">
                      <h3 className="text-sm font-semibold text-red-900 mb-1">
                        エラーの内容
                      </h3>
                      <p className="text-sm text-red-800 font-mono">
                        {error.message || "システムエラーが発生しました"}
                      </p>
                      {error.digest && (
                        <p className="text-xs text-red-600 mt-2">
                          エラーコード: {error.digest}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* アクション */}
              <div className="space-y-3 mb-6">
                <button
                  onClick={reset}
                  className="w-full px-6 py-4 bg-red-600 text-white rounded-lg hover:bg-red-700 font-bold text-lg transition-all transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-red-300"
                >
                  🔄 アプリケーションを再起動
                </button>
                <a
                  href="/"
                  className="block w-full px-6 py-4 bg-gray-700 text-white rounded-lg hover:bg-gray-800 font-bold text-lg text-center transition-all transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-gray-400"
                >
                  🏠 ホームページへ
                </a>
              </div>

              {/* 緊急サポート */}
              <div className="bg-yellow-50 border-2 border-yellow-300 rounded-lg p-4">
                <div className="flex items-start">
                  <svg
                    className="h-5 w-5 text-yellow-600 mt-0.5 mr-3 flex-shrink-0"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <div>
                    <h3 className="text-sm font-semibold text-yellow-900 mb-1">
                      問題が解決しない場合
                    </h3>
                    <p className="text-sm text-yellow-800">
                      お手数ですが、サポートチームまでお問い合わせください。
                      <br />
                      エラーコードを併せてお伝えいただくとスムーズです。
                    </p>
                  </div>
                </div>
              </div>

              {/* フッター */}
              <div className="mt-6 pt-6 border-t border-gray-200 text-center text-sm text-gray-500">
                ご不便をおかけして申し訳ございません
              </div>
            </div>
          </div>
        </div>
      </body>
    </html>
  );
}
