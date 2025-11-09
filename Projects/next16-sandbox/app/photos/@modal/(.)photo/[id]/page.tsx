/**
 * Intercepting Route - Photo Modal
 *
 * クライアント遷移時に /photos/photo/[id] をインターセプトしてモーダル表示
 * (.) は同じディレクトリレベル（/photos）からのインターセプト
 */

"use client";

import { useRouter } from "next/navigation";
import { use } from "react";

// 写真データ（実際のアプリではAPIから取得）
const photosData = [
  { id: 1, title: "紅葉の山", emoji: "🏔️", color: "from-orange-400 to-red-600", description: "秋の山々が紅葉で彩られた美しい風景" },
  { id: 2, title: "夕焼けのビーチ", emoji: "🏖️", color: "from-yellow-400 to-orange-600", description: "夕日が海に沈む幻想的な瞬間" },
  { id: 3, title: "夜の東京タワー", emoji: "🗼", color: "from-blue-600 to-purple-800", description: "ライトアップされた東京タワーの夜景" },
  { id: 4, title: "桜並木", emoji: "🌸", color: "from-pink-300 to-pink-600", description: "満開の桜が作る桜のトンネル" },
  { id: 5, title: "雪山の朝", emoji: "⛷️", color: "from-blue-200 to-blue-500", description: "朝日に照らされた雪化粧の山々" },
  { id: 6, title: "竹林の小径", emoji: "🎋", color: "from-green-400 to-green-700", description: "静寂に包まれた竹林の道" },
  { id: 7, title: "星空キャンプ", emoji: "⛺", color: "from-indigo-900 to-purple-900", description: "満天の星空の下でのキャンプ" },
  { id: 8, title: "秋の京都", emoji: "🍁", color: "from-red-400 to-orange-500", description: "古都京都の秋の風情" },
  { id: 9, title: "富士山と湖", emoji: "🗻", color: "from-blue-300 to-blue-600", description: "湖面に映る逆さ富士" },
];

export default function PhotoModal({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();
  const { id } = use(params);
  const photo = photosData.find((p) => p.id === parseInt(id));

  if (!photo) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
      onClick={() => router.back()}
    >
      <div
        className="relative bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 閉じるボタン */}
        <button
          onClick={() => router.back()}
          className="absolute top-4 right-4 z-10 w-10 h-10 flex items-center justify-center bg-white/90 hover:bg-white rounded-full shadow-lg transition-all"
          aria-label="閉じる"
        >
          <span className="text-2xl text-gray-700">×</span>
        </button>

        {/* 画像エリア */}
        <div
          className={`w-full h-96 bg-gradient-to-br ${photo.color} flex items-center justify-center`}
        >
          <span className="text-9xl">{photo.emoji}</span>
        </div>

        {/* 写真情報 */}
        <div className="p-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            {photo.title}
          </h2>
          <p className="text-gray-600 mb-6">{photo.description}</p>

          {/* メタ情報 */}
          <div className="flex items-center justify-between text-sm text-gray-500 mb-6">
            <div className="flex items-center space-x-4">
              <span>Photo #{photo.id}</span>
              <span>•</span>
              <span>1920 × 1080</span>
            </div>
            <button className="text-blue-600 hover:text-blue-700 font-medium">
              ダウンロード
            </button>
          </div>

          {/* インターセプト説明 */}
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-4">
            <p className="text-sm text-gray-700">
              <strong className="text-blue-700">💡 Intercepting Routes デモ:</strong>{" "}
              このモーダルは <code className="bg-white px-1 rounded">(.)photo/[id]</code>{" "}
              によるルートインターセプトで表示されています。
              <span className="block mt-2">
                直接 URL にアクセスするか、リロードすると専用ページが表示されます。
              </span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
