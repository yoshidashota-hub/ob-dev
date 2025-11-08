/**
 * 404 Not Found ページ
 *
 * 存在しないルートへのアクセス時に表示
 */

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-pink-50 flex items-center justify-center px-4">
      <div className="max-w-2xl w-full text-center">
        {/* 404イラスト */}
        <div className="mb-8">
          <h1 className="text-9xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600 mb-4">
            404
          </h1>
          <div className="text-6xl mb-4">🔍</div>
        </div>

        {/* メッセージ */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            ページが見つかりません
          </h2>
          <p className="text-lg text-gray-600 mb-2">
            お探しのページは存在しないか、移動または削除された可能性があります。
          </p>
          <p className="text-sm text-gray-500">
            URLをご確認いただくか、下のボタンからホームページにお戻りください。
          </p>
        </div>

        {/* アクションボタン */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
          <a
            href="/"
            className="px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 font-bold text-lg transition-all transform hover:scale-105 shadow-lg"
          >
            🏠 ホームに戻る
          </a>
          <button
            onClick={() => window.history.back()}
            className="px-8 py-4 bg-white text-gray-700 rounded-lg hover:bg-gray-100 font-bold text-lg transition-all border-2 border-gray-300"
          >
            ← 前のページへ
          </button>
        </div>

        {/* おすすめリンク */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            こちらのページもご覧ください
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <a
              href="/forms"
              className="p-3 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
            >
              <div className="text-2xl mb-1">📝</div>
              <div className="text-sm font-semibold text-gray-800">
                Server Actions
              </div>
            </a>
            <a
              href="/streaming"
              className="p-3 bg-green-50 rounded-lg hover:bg-green-100 transition-colors"
            >
              <div className="text-2xl mb-1">🌊</div>
              <div className="text-sm font-semibold text-gray-800">
                Streaming
              </div>
            </a>
            <a
              href="/cache-demo"
              className="p-3 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors"
            >
              <div className="text-2xl mb-1">⚡</div>
              <div className="text-sm font-semibold text-gray-800">Cache</div>
            </a>
          </div>
        </div>

        {/* フッター */}
        <div className="mt-8 text-sm text-gray-500">
          <p>
            問題が解決しない場合は、
            <a
              href="mailto:support@example.com"
              className="text-purple-600 hover:underline"
            >
              サポートチーム
            </a>
            までお問い合わせください
          </p>
        </div>
      </div>
    </div>
  );
}
