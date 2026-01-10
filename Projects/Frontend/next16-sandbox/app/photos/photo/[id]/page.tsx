/**
 * Dedicated Photo Page
 *
 * 直接URLアクセス時、またはリロード時に表示される専用ページ
 * Intercepting Routes でインターセプトされない場合のフルページ表示
 */

import Link from "next/link";
import { use } from "react";

// 写真データ（実際のアプリではAPIから取得）
const photosData = [
  { id: 1, title: "紅葉の山", emoji: "🏔️", color: "from-orange-400 to-red-600", description: "秋の山々が紅葉で彩られた美しい風景", location: "北アルプス", date: "2024年10月" },
  { id: 2, title: "夕焼けのビーチ", emoji: "🏖️", color: "from-yellow-400 to-orange-600", description: "夕日が海に沈む幻想的な瞬間", location: "湘南海岸", date: "2024年8月" },
  { id: 3, title: "夜の東京タワー", emoji: "🗼", color: "from-blue-600 to-purple-800", description: "ライトアップされた東京タワーの夜景", location: "東京都", date: "2024年12月" },
  { id: 4, title: "桜並木", emoji: "🌸", color: "from-pink-300 to-pink-600", description: "満開の桜が作る桜のトンネル", location: "京都", date: "2024年4月" },
  { id: 5, title: "雪山の朝", emoji: "⛷️", color: "from-blue-200 to-blue-500", description: "朝日に照らされた雪化粧の山々", location: "白馬", date: "2025年1月" },
  { id: 6, title: "竹林の小径", emoji: "🎋", color: "from-green-400 to-green-700", description: "静寂に包まれた竹林の道", location: "嵐山", date: "2024年6月" },
  { id: 7, title: "星空キャンプ", emoji: "⛺", color: "from-indigo-900 to-purple-900", description: "満天の星空の下でのキャンプ", location: "富士五湖", date: "2024年9月" },
  { id: 8, title: "秋の京都", emoji: "🍁", color: "from-red-400 to-orange-500", description: "古都京都の秋の風情", location: "清水寺", date: "2024年11月" },
  { id: 9, title: "富士山と湖", emoji: "🗻", color: "from-blue-300 to-blue-600", description: "湖面に映る逆さ富士", location: "河口湖", date: "2024年5月" },
];

export default function PhotoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const photo = photosData.find((p) => p.id === parseInt(id));

  if (!photo) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            写真が見つかりません
          </h1>
          <Link
            href="/photos"
            className="text-blue-600 hover:text-blue-700 underline"
          >
            ギャラリーに戻る
          </Link>
        </div>
      </div>
    );
  }

  // 他の写真（レコメンデーション）
  const otherPhotos = photosData.filter((p) => p.id !== photo.id).slice(0, 3);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100">
      {/* ヘッダー */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link
            href="/photos"
            className="flex items-center text-gray-600 hover:text-gray-900 transition-colors"
          >
            <span className="text-xl mr-2">←</span>
            <span className="font-medium">ギャラリーに戻る</span>
          </Link>
          <div className="flex items-center space-x-4">
            <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
              ダウンロード
            </button>
            <button className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
              共有
            </button>
          </div>
        </div>
      </header>

      {/* メインコンテンツ */}
      <main className="max-w-6xl mx-auto px-4 py-12">
        {/* 写真表示エリア */}
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden mb-12">
          {/* 画像 */}
          <div
            className={`w-full h-[500px] bg-gradient-to-br ${photo.color} flex items-center justify-center`}
          >
            <span className="text-[200px]">{photo.emoji}</span>
          </div>

          {/* 写真情報 */}
          <div className="p-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              {photo.title}
            </h1>
            <p className="text-xl text-gray-600 mb-6">{photo.description}</p>

            {/* メタデータ */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
              <div>
                <div className="text-sm text-gray-500 mb-1">撮影場所</div>
                <div className="font-semibold text-gray-900">{photo.location}</div>
              </div>
              <div>
                <div className="text-sm text-gray-500 mb-1">撮影日</div>
                <div className="font-semibold text-gray-900">{photo.date}</div>
              </div>
              <div>
                <div className="text-sm text-gray-500 mb-1">サイズ</div>
                <div className="font-semibold text-gray-900">1920 × 1080</div>
              </div>
              <div>
                <div className="text-sm text-gray-500 mb-1">Photo ID</div>
                <div className="font-semibold text-gray-900">#{photo.id}</div>
              </div>
            </div>

            {/* ルーティング説明 */}
            <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">
                📍 専用ページ表示モード
              </h3>
              <p className="text-sm text-gray-700 mb-3">
                この画面は、直接URLアクセスまたはリロード時に表示される専用ページです。
              </p>
              <ul className="space-y-2 text-sm text-gray-700">
                <li className="flex items-start">
                  <span className="text-green-600 mr-2">✓</span>
                  <span>ギャラリーから写真をクリック → モーダル表示</span>
                </li>
                <li className="flex items-start">
                  <span className="text-green-600 mr-2">✓</span>
                  <span>この URL を直接開く → この専用ページ表示</span>
                </li>
                <li className="flex items-start">
                  <span className="text-green-600 mr-2">✓</span>
                  <span>モーダル表示中にリロード → この専用ページに切り替え</span>
                </li>
              </ul>
              <div className="mt-4 bg-white rounded p-3 text-xs font-mono text-gray-600">
                <div>実装場所:</div>
                <div className="text-blue-600">app/photos/photo/[id]/page.tsx</div>
                <div className="mt-2">インターセプト:</div>
                <div className="text-green-600">app/photos/@modal/(.)photo/[id]/page.tsx</div>
              </div>
            </div>
          </div>
        </div>

        {/* 関連写真 */}
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            他の写真を見る
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {otherPhotos.map((otherPhoto) => (
              <Link
                key={otherPhoto.id}
                href={`/photos/photo/${otherPhoto.id}`}
                className="group block relative aspect-square rounded-lg overflow-hidden shadow-md hover:shadow-xl transition-all duration-300"
              >
                <div
                  className={`w-full h-full bg-gradient-to-br ${otherPhoto.color} flex items-center justify-center`}
                >
                  <span className="text-6xl group-hover:scale-110 transition-transform duration-300">
                    {otherPhoto.emoji}
                  </span>
                </div>
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-4">
                  <h3 className="text-white font-semibold">
                    {otherPhoto.title}
                  </h3>
                  <p className="text-white/80 text-sm">Photo #{otherPhoto.id}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
