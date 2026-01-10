/**
 * セグメント別エラーハンドリングデモ
 *
 * このセグメント専用のエラーページで処理されることを確認
 */

"use client";

export default function SegmentPage() {
  function triggerSegmentError() {
    throw new Error(
      "これはセグメントエラーです（error-demo/segment/error.tsx で処理されます）"
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="bg-white rounded-lg shadow-md p-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            セグメント別エラーハンドリング
          </h1>
          <p className="text-lg text-gray-600 mb-6">
            このセグメント（/error-demo/segment）専用のエラーページで
            エラーがキャッチされることを確認できます
          </p>

          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg mb-6">
            <h2 className="text-lg font-semibold text-blue-900 mb-3">
              🎯 セグメント別エラーとは
            </h2>
            <div className="space-y-2 text-sm text-blue-800">
              <p>
                Next.js
                では、各ルートセグメントごとに独自のエラーページを配置できます
              </p>
              <p>
                このページのエラーは <code className="bg-blue-100 px-1 rounded">
                  error-demo/segment/error.tsx
                </code>{" "}
                で処理されます
              </p>
              <p>
                親のエラーページ（error-demo/error.tsx）には影響しません
              </p>
            </div>
          </div>

          <button
            onClick={triggerSegmentError}
            className="w-full px-6 py-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-bold text-lg transition-colors mb-6"
          >
            セグメントエラーを発生させる
          </button>

          <div className="bg-white border-2 border-gray-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              ファイル構造
            </h3>
            <pre className="bg-gray-50 rounded p-4 text-sm font-mono overflow-x-auto">
              {`app/
├── error.tsx                    ← ルートレベルのエラー
└── error-demo/
    ├── page.tsx                 ← メインデモページ
    ├── error.tsx               ← error-demoセグメントのエラー
    └── segment/
        ├── page.tsx            ← このページ
        └── error.tsx          ← このセグメント専用のエラー
`}
            </pre>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            セグメント別エラーの利点
          </h2>

          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-8 h-8 bg-green-100 rounded-full flex items-center justify-center text-green-600 font-bold">
                1
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">
                  影響範囲の限定
                </h3>
                <p className="text-sm text-gray-600">
                  エラーが発生しても、他のセグメントには影響しません
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold">
                2
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">
                  カスタマイズ可能
                </h3>
                <p className="text-sm text-gray-600">
                  セグメントごとに異なるエラーメッセージやUIを表示できます
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center text-purple-600 font-bold">
                3
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">
                  部分的な復帰
                </h3>
                <p className="text-sm text-gray-600">
                  エラーが発生したセグメントのみをリセットできます
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex gap-4">
          <a
            href="/error-demo"
            className="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 font-semibold transition-colors"
          >
            ← エラーデモに戻る
          </a>
          <a
            href="/"
            className="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 font-semibold transition-colors"
          >
            ホームに戻る
          </a>
        </div>
      </div>
    </div>
  );
}
