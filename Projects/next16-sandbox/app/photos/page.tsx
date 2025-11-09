/**
 * Photos Grid - メインページ
 *
 * 写真グリッドを表示し、クリックでモーダルを開く（Intercepting Routes）
 */

import Link from "next/link";

// サンプル写真データ
const photos = [
  { id: 1, title: "紅葉の山", emoji: "🏔️", color: "from-orange-400 to-red-600" },
  { id: 2, title: "夕焼けのビーチ", emoji: "🏖️", color: "from-yellow-400 to-orange-600" },
  { id: 3, title: "夜の東京タワー", emoji: "🗼", color: "from-blue-600 to-purple-800" },
  { id: 4, title: "桜並木", emoji: "🌸", color: "from-pink-300 to-pink-600" },
  { id: 5, title: "雪山の朝", emoji: "⛷️", color: "from-blue-200 to-blue-500" },
  { id: 6, title: "竹林の小径", emoji: "🎋", color: "from-green-400 to-green-700" },
  { id: 7, title: "星空キャンプ", emoji: "⛺", color: "from-indigo-900 to-purple-900" },
  { id: 8, title: "秋の京都", emoji: "🍁", color: "from-red-400 to-orange-500" },
  { id: 9, title: "富士山と湖", emoji: "🗻", color: "from-blue-300 to-blue-600" },
];

export default function PhotosPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 py-12 px-4">
      <div className="max-w-7xl mx-auto">
        {/* ヘッダー */}
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-gray-900 mb-4">
            📸 Photo Gallery
          </h1>
          <p className="text-xl text-gray-600 mb-2">
            Parallel & Intercepting Routes デモ
          </p>
          <p className="text-sm text-gray-500">
            写真をクリックするとモーダルで表示、直接URLアクセスで専用ページを表示
          </p>
        </div>

        {/* 写真グリッド */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {photos.map((photo) => (
            <Link
              key={photo.id}
              href={`/photos/photo/${photo.id}`}
              className="group block relative aspect-square rounded-lg overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300"
            >
              <div
                className={`w-full h-full bg-gradient-to-br ${photo.color} flex items-center justify-center`}
              >
                <span className="text-8xl group-hover:scale-110 transition-transform duration-300">
                  {photo.emoji}
                </span>
              </div>
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-4">
                <h3 className="text-white font-semibold text-lg">
                  {photo.title}
                </h3>
                <p className="text-white/80 text-sm">Photo #{photo.id}</p>
              </div>
            </Link>
          ))}
        </div>

        {/* 技術解説 */}
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            🔧 実装パターン
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Parallel Routes */}
            <div className="border-l-4 border-blue-500 pl-4">
              <h3 className="text-lg font-semibold text-blue-900 mb-3">
                Parallel Routes (@modal)
              </h3>
              <p className="text-gray-700 text-sm mb-3">
                layout.tsx で複数のスロットを同時にレンダリング
              </p>
              <div className="bg-gray-100 p-3 rounded text-xs font-mono">
                <div className="text-gray-600">app/photos/</div>
                <div className="ml-2">├── layout.tsx</div>
                <div className="ml-2">├── page.tsx</div>
                <div className="ml-2 text-blue-600">├── @modal/</div>
                <div className="ml-4">│   ├── (.)photo/[id]/</div>
                <div className="ml-4">│   └── default.tsx</div>
                <div className="ml-2">└── photo/[id]/</div>
              </div>
            </div>

            {/* Intercepting Routes */}
            <div className="border-l-4 border-green-500 pl-4">
              <h3 className="text-lg font-semibold text-green-900 mb-3">
                Intercepting Routes (.)
              </h3>
              <p className="text-gray-700 text-sm mb-3">
                クライアント遷移時にルートをインターセプト
              </p>
              <ul className="space-y-2 text-sm text-gray-700">
                <li>✓ クリック時 → モーダル表示</li>
                <li>✓ 直接URL → 専用ページ表示</li>
                <li>✓ リロード → 専用ページ表示</li>
                <li>✓ 戻るボタン → モーダルを閉じる</li>
              </ul>
            </div>
          </div>

          {/* インターセプトパターン */}
          <div className="mt-6 pt-6 border-t">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              インターセプトパターン
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
              <div className="bg-purple-50 p-3 rounded">
                <code className="text-purple-700 font-semibold">(.)</code>
                <p className="text-gray-600 mt-1">同じディレクトリ</p>
              </div>
              <div className="bg-blue-50 p-3 rounded">
                <code className="text-blue-700 font-semibold">(..)</code>
                <p className="text-gray-600 mt-1">1つ上のディレクトリ</p>
              </div>
              <div className="bg-green-50 p-3 rounded">
                <code className="text-green-700 font-semibold">(...)</code>
                <p className="text-gray-600 mt-1">ルートから</p>
              </div>
              <div className="bg-orange-50 p-3 rounded">
                <code className="text-orange-700 font-semibold">(..)(..)</code>
                <p className="text-gray-600 mt-1">2つ上のディレクトリ</p>
              </div>
            </div>
          </div>

          {/* 使い方 */}
          <div className="mt-6 pt-6 border-t">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              試してみよう
            </h3>
            <div className="space-y-3 text-sm text-gray-700">
              <div className="flex items-start">
                <span className="text-green-600 mr-2">1.</span>
                <div>
                  <strong>写真をクリック</strong>: モーダルで開き、URLは /photos/photo/1 に変わります
                </div>
              </div>
              <div className="flex items-start">
                <span className="text-green-600 mr-2">2.</span>
                <div>
                  <strong>直接URLを開く</strong>: 新しいタブで /photos/photo/1 を開くと、専用ページが表示されます
                </div>
              </div>
              <div className="flex items-start">
                <span className="text-green-600 mr-2">3.</span>
                <div>
                  <strong>モーダル内でリロード</strong>: F5でリロードすると、専用ページに切り替わります
                </div>
              </div>
              <div className="flex items-start">
                <span className="text-green-600 mr-2">4.</span>
                <div>
                  <strong>戻るボタン</strong>: ブラウザの戻るボタンでモーダルを閉じてグリッドに戻ります
                </div>
              </div>
            </div>
          </div>

          {/* ホームに戻る */}
          <div className="mt-8 text-center">
            <a
              href="/"
              className="inline-block px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all"
            >
              ← ホームに戻る
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
