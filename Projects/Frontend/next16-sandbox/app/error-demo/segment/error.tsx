"use client";

/**
 * セグメント専用のエラーページ
 *
 * /error-demo/segment セグメントで発生したエラーを処理
 */

import { useEffect } from "react";

export default function SegmentError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Segment error:", error);
  }, [error]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center px-4">
      <div className="max-w-2xl w-full">
        <div className="bg-white rounded-lg shadow-xl p-8 border-l-4 border-blue-500">
          {/* ヘッダー */}
          <div className="flex items-center mb-6">
            <div className="flex-shrink-0 mr-4">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                <svg
                  className="w-8 h-8 text-blue-600"
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
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                セグメントエラー
              </h1>
              <p className="text-sm text-gray-600">
                このセグメント（/error-demo/segment）で
                エラーが発生しました
              </p>
            </div>
          </div>

          {/* 説明バナー */}
          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-start gap-2">
              <svg
                className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                  clipRule="evenodd"
                />
              </svg>
              <div className="flex-1">
                <h3 className="text-sm font-semibold text-blue-900 mb-1">
                  セグメント別エラーハンドリング
                </h3>
                <p className="text-sm text-blue-800">
                  このエラーは <code className="bg-blue-100 px-1 rounded">
                    app/error-demo/segment/error.tsx
                  </code>{" "}
                  でキャッチされています。親のエラーページには影響しません。
                </p>
              </div>
            </div>
          </div>

          {/* エラー詳細 */}
          <div className="mb-6">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h2 className="text-sm font-semibold text-blue-800 mb-2">
                エラー内容:
              </h2>
              <p className="text-sm text-blue-700 font-mono break-all">
                {error.message}
              </p>
              {error.digest && (
                <p className="text-xs text-blue-600 mt-2">
                  エラーID: {error.digest}
                </p>
              )}
            </div>
          </div>

          {/* アクション */}
          <div className="flex flex-col sm:flex-row gap-3 mb-6">
            <button
              onClick={reset}
              className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold transition-colors"
            >
              🔄 このセグメントを再試行
            </button>
            <a
              href="/error-demo"
              className="flex-1 px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 font-semibold text-center transition-colors"
            >
              ← エラーデモに戻る
            </a>
          </div>

          {/* 追加情報 */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="text-sm font-semibold text-gray-700 mb-2">
              💡 ポイント
            </h3>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>
                • このエラーページは <code>/error-demo/segment</code>{" "}
                専用です
              </li>
              <li>
                • 「再試行」ボタンでこのセグメントのみをリセットできます
              </li>
              <li>• 他のページには影響しません</li>
              <li>• より細かいエラー制御が可能になります</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
