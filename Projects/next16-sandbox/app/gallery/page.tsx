"use client";

/**
 * View Transitions デモ: ギャラリーページ
 *
 * ページ遷移アニメーションのデモ
 */

interface Image {
  id: number;
  title: string;
  category: string;
  color: string;
  description: string;
}

const images: Image[] = [
  {
    id: 1,
    title: "Mountain Vista",
    category: "Nature",
    color: "from-blue-400 to-blue-600",
    description: "美しい山の景色",
  },
  {
    id: 2,
    title: "Ocean Waves",
    category: "Nature",
    color: "from-cyan-400 to-blue-500",
    description: "波打つ海の風景",
  },
  {
    id: 3,
    title: "Forest Path",
    category: "Nature",
    color: "from-green-400 to-green-600",
    description: "森の中の小道",
  },
  {
    id: 4,
    title: "Desert Sunset",
    category: "Nature",
    color: "from-orange-400 to-red-500",
    description: "砂漠の夕焼け",
  },
  {
    id: 5,
    title: "City Lights",
    category: "Urban",
    color: "from-purple-400 to-pink-500",
    description: "都市の夜景",
  },
  {
    id: 6,
    title: "Abstract Art",
    category: "Art",
    color: "from-yellow-400 to-orange-500",
    description: "抽象的なアート",
  },
  {
    id: 7,
    title: "Starry Night",
    category: "Nature",
    color: "from-indigo-500 to-purple-600",
    description: "星空の夜",
  },
  {
    id: 8,
    title: "Autumn Leaves",
    category: "Nature",
    color: "from-amber-400 to-red-600",
    description: "秋の紅葉",
  },
];

export default function GalleryPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* ヘッダー */}
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <h1 className="text-3xl font-bold text-gray-900">
            Image Gallery
          </h1>
          <p className="text-gray-600 mt-1">
            View Transitionsのデモ - スムーズなページ遷移
          </p>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* 情報バー */}
        <div className="mb-8 p-6 bg-blue-50 border border-blue-200 rounded-lg">
          <h2 className="text-lg font-semibold text-blue-900 mb-2">
            🎬 View Transitions
          </h2>
          <p className="text-sm text-blue-800 mb-3">
            Next.js 16では、ページ遷移時にスムーズなアニメーションを実装できます。
            画像カードをクリックするか、ダッシュボードに移動してみてください。
          </p>
          <a
            href="/dashboard"
            className="inline-block px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            ダッシュボードを見る →
          </a>
        </div>

        {/* ギャラリーグリッド */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {images.map((image, index) => (
            <div
              key={image.id}
              className="group cursor-pointer"
              style={{
                animation: `fadeInUp 0.5s ease-out ${index * 0.1}s both`,
              }}
            >
              <div className="bg-white rounded-lg shadow-md overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-2">
                {/* 画像プレースホルダー */}
                <div
                  className={`aspect-square bg-gradient-to-br ${image.color} flex items-center justify-center text-white text-6xl`}
                >
                  🖼️
                </div>

                {/* 画像情報 */}
                <div className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold text-gray-900">
                      {image.title}
                    </h3>
                    <span className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded">
                      {image.category}
                    </span>
                  </div>

                  <p className="text-sm text-gray-600 mb-3">
                    {image.description}
                  </p>

                  <button className="w-full py-2 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors text-sm font-medium">
                    詳細を見る
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* CSSアニメーションの説明 */}
        <div className="mt-12 bg-white rounded-lg shadow-md p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            実装されているアニメーション
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="border-l-4 border-blue-500 pl-4">
              <h3 className="font-semibold text-gray-900 mb-2">
                1. フェードイン + 上昇
              </h3>
              <p className="text-sm text-gray-600">
                各カードが順番に下から上にフェードインします。
                <code className="bg-gray-100 px-1 rounded">fadeInUp</code>アニメーション。
              </p>
            </div>

            <div className="border-l-4 border-green-500 pl-4">
              <h3 className="font-semibold text-gray-900 mb-2">
                2. ホバーエフェクト
              </h3>
              <p className="text-sm text-gray-600">
                カードにホバーすると影が濃くなり、上に浮き上がります。
                <code className="bg-gray-100 px-1 rounded">hover:-translate-y-2</code>
              </p>
            </div>

            <div className="border-l-4 border-purple-500 pl-4">
              <h3 className="font-semibold text-gray-900 mb-2">
                3. スムーズな遷移
              </h3>
              <p className="text-sm text-gray-600">
                すべての変化が滑らかに遷移します。
                <code className="bg-gray-100 px-1 rounded">transition-all</code>
              </p>
            </div>

            <div className="border-l-4 border-orange-500 pl-4">
              <h3 className="font-semibold text-gray-900 mb-2">
                4. グラデーション背景
              </h3>
              <p className="text-sm text-gray-600">
                各画像にカラフルなグラデーション背景。
                <code className="bg-gray-100 px-1 rounded">bg-gradient-to-br</code>
              </p>
            </div>
          </div>
        </div>

        {/* ナビゲーション */}
        <div className="mt-8 flex gap-4">
          <a
            href="/"
            className="inline-flex items-center px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
          >
            ← ホーム
          </a>
          <a
            href="/dashboard"
            className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            ダッシュボード →
          </a>
        </div>
      </div>

      {/* CSS Animations */}
      <style jsx>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
}
