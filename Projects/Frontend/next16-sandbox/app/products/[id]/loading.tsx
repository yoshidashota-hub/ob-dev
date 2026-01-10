/**
 * 商品詳細ページのローディング UI
 *
 * Next.js が自動的に使用する loading.tsx
 * /products/[id] ルートの読み込み中に表示される
 */

export default function Loading() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-8 animate-pulse">
          {/* 戻るボタン */}
          <div className="h-10 bg-gray-200 rounded w-32 mb-6"></div>

          <div className="grid md:grid-cols-2 gap-8">
            {/* 商品画像 */}
            <div className="h-96 bg-gray-200 rounded-lg"></div>

            {/* 商品情報 */}
            <div className="space-y-6">
              {/* 商品名 */}
              <div className="h-8 bg-gray-200 rounded w-3/4"></div>

              {/* 価格 */}
              <div className="h-10 bg-gray-200 rounded w-1/3"></div>

              {/* 説明 */}
              <div className="space-y-3">
                <div className="h-4 bg-gray-200 rounded"></div>
                <div className="h-4 bg-gray-200 rounded w-5/6"></div>
                <div className="h-4 bg-gray-200 rounded w-4/6"></div>
                <div className="h-4 bg-gray-200 rounded w-full"></div>
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              </div>

              {/* 特徴 */}
              <div className="space-y-3">
                <div className="h-5 bg-gray-300 rounded w-1/4 mb-2"></div>
                <div className="space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                </div>
              </div>

              {/* アクションボタン */}
              <div className="flex gap-4">
                <div className="h-12 bg-gray-200 rounded flex-1"></div>
                <div className="h-12 bg-gray-200 rounded w-12"></div>
              </div>
            </div>
          </div>

          {/* 関連情報 */}
          <div className="mt-12 pt-8 border-t border-gray-200">
            <div className="h-6 bg-gray-300 rounded w-1/4 mb-4"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[1, 2].map((i) => (
                <div key={i} className="border rounded-lg p-4">
                  <div className="h-5 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded w-full"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
