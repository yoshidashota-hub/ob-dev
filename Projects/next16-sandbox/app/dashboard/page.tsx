"use client";

/**
 * View Transitions デモ: ダッシュボードページ
 *
 * データ可視化とページ遷移アニメーション
 */

interface Stat {
  id: number;
  label: string;
  value: string;
  change: string;
  trend: "up" | "down" | "neutral";
  icon: string;
  color: string;
}

const stats: Stat[] = [
  {
    id: 1,
    label: "総ユーザー数",
    value: "12,543",
    change: "+12.5%",
    trend: "up",
    icon: "👥",
    color: "blue",
  },
  {
    id: 2,
    label: "アクティブセッション",
    value: "3,891",
    change: "+8.2%",
    trend: "up",
    icon: "⚡",
    color: "green",
  },
  {
    id: 3,
    label: "収益",
    value: "¥2,450,000",
    change: "+15.3%",
    trend: "up",
    icon: "💰",
    color: "purple",
  },
  {
    id: 4,
    label: "エラー率",
    value: "0.24%",
    change: "-3.1%",
    trend: "down",
    icon: "🐛",
    color: "red",
  },
];

interface Activity {
  id: number;
  user: string;
  action: string;
  time: string;
  type: "success" | "warning" | "info";
}

const activities: Activity[] = [
  {
    id: 1,
    user: "山田太郎",
    action: "新規プロジェクトを作成しました",
    time: "2分前",
    type: "success",
  },
  {
    id: 2,
    user: "佐藤花子",
    action: "レポートをエクスポートしました",
    time: "15分前",
    type: "info",
  },
  {
    id: 3,
    user: "鈴木一郎",
    action: "システムアラート: メモリ使用率 85%",
    time: "1時間前",
    type: "warning",
  },
  {
    id: 4,
    user: "田中美咲",
    action: "ユーザー設定を更新しました",
    time: "2時間前",
    type: "info",
  },
  {
    id: 5,
    user: "高橋健太",
    action: "新規メンバーを招待しました",
    time: "3時間前",
    type: "success",
  },
];

export default function DashboardPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* ヘッダー */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
              <p className="text-gray-600 mt-1">
                システムの概要とアクティビティ
              </p>
            </div>
            <div className="text-sm text-gray-500">
              最終更新: {new Date().toLocaleTimeString("ja-JP")}
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* View Transitions情報 */}
        <div className="mb-8 p-6 bg-purple-50 border border-purple-200 rounded-lg">
          <h2 className="text-lg font-semibold text-purple-900 mb-2">
            🎬 Page Transitions
          </h2>
          <p className="text-sm text-purple-800 mb-3">
            ダッシュボードの各要素が順番にアニメーションで表示されます。
            ギャラリーページに戻るときもスムーズな遷移が実装されています。
          </p>
          <a
            href="/gallery"
            className="inline-block px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            ← ギャラリーに戻る
          </a>
        </div>

        {/* 統計カード */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {stats.map((stat, index) => {
            const colorClasses = {
              blue: "from-blue-500 to-blue-600",
              green: "from-green-500 to-green-600",
              purple: "from-purple-500 to-purple-600",
              red: "from-red-500 to-red-600",
            };

            return (
              <div
                key={stat.id}
                className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-all duration-300"
                style={{
                  animation: `slideIn 0.5s ease-out ${index * 0.1}s both`,
                }}
              >
                <div
                  className={`h-2 bg-gradient-to-r ${
                    colorClasses[stat.color as keyof typeof colorClasses]
                  }`}
                ></div>
                <div className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-4xl">{stat.icon}</span>
                    <span
                      className={`text-sm font-medium px-2 py-1 rounded ${
                        stat.trend === "up"
                          ? "bg-green-100 text-green-800"
                          : stat.trend === "down"
                          ? "bg-red-100 text-red-800"
                          : "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {stat.change}
                    </span>
                  </div>
                  <div className="text-sm text-gray-600 mb-1">{stat.label}</div>
                  <div className="text-3xl font-bold text-gray-900">
                    {stat.value}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* グリッドレイアウト */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* アクティビティフィード */}
          <div
            className="lg:col-span-2 bg-white rounded-lg shadow-md p-6"
            style={{ animation: "fadeIn 0.5s ease-out 0.5s both" }}
          >
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              最近のアクティビティ
            </h2>

            <div className="space-y-4">
              {activities.map((activity) => {
                const typeStyles = {
                  success: "bg-green-100 border-green-200",
                  warning: "bg-yellow-100 border-yellow-200",
                  info: "bg-blue-100 border-blue-200",
                };

                return (
                  <div
                    key={activity.id}
                    className={`p-4 border-l-4 rounded ${
                      typeStyles[activity.type]
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="font-semibold text-gray-900">
                          {activity.user}
                        </div>
                        <div className="text-sm text-gray-600 mt-1">
                          {activity.action}
                        </div>
                      </div>
                      <div className="text-xs text-gray-500 ml-4">
                        {activity.time}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <button className="mt-6 w-full py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium">
              すべてのアクティビティを見る →
            </button>
          </div>

          {/* クイックアクション */}
          <div
            className="bg-white rounded-lg shadow-md p-6"
            style={{ animation: "fadeIn 0.5s ease-out 0.6s both" }}
          >
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              クイックアクション
            </h2>

            <div className="space-y-3">
              <button className="w-full py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium">
                📊 新規レポート作成
              </button>
              <button className="w-full py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium">
                👥 メンバーを招待
              </button>
              <button className="w-full py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium">
                ⚙️ 設定を変更
              </button>
              <button className="w-full py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors font-medium">
                📥 データをエクスポート
              </button>
            </div>

            <div className="mt-6 p-4 bg-gray-50 rounded-lg">
              <div className="text-sm font-semibold text-gray-900 mb-2">
                💡 ヒント
              </div>
              <p className="text-xs text-gray-600">
                ダッシュボードはリアルタイムで更新されます。
                最新の情報を常に確認できます。
              </p>
            </div>
          </div>
        </div>

        {/* アニメーション説明 */}
        <div
          className="mt-8 bg-white rounded-lg shadow-md p-8"
          style={{ animation: "fadeIn 0.5s ease-out 0.7s both" }}
        >
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            実装されているアニメーション
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="border-l-4 border-blue-500 pl-4">
              <h3 className="font-semibold text-gray-900 mb-2">
                1. スライドイン
              </h3>
              <p className="text-sm text-gray-600">
                統計カードが左からスライドインします。
                <code className="bg-gray-100 px-1 rounded">slideIn</code>
              </p>
            </div>

            <div className="border-l-4 border-green-500 pl-4">
              <h3 className="font-semibold text-gray-900 mb-2">
                2. フェードイン
              </h3>
              <p className="text-sm text-gray-600">
                各セクションが時間差でフェードイン。
                <code className="bg-gray-100 px-1 rounded">fadeIn</code>
              </p>
            </div>

            <div className="border-l-4 border-purple-500 pl-4">
              <h3 className="font-semibold text-gray-900 mb-2">
                3. ホバー効果
              </h3>
              <p className="text-sm text-gray-600">
                カードやボタンのホバー時の変化。
                <code className="bg-gray-100 px-1 rounded">transition-all</code>
              </p>
            </div>
          </div>
        </div>

        {/* ナビゲーション */}
        <div className="mt-8 flex flex-wrap gap-4">
          <a
            href="/"
            className="inline-flex items-center px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
          >
            ← ホーム
          </a>
          <a
            href="/gallery"
            className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            ギャラリー
          </a>
          <a
            href="/cache-demo"
            className="inline-flex items-center px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700"
          >
            キャッシュデモ
          </a>
          <a
            href="/blog/nextjs-16-features"
            className="inline-flex items-center px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
          >
            ブログ
          </a>
        </div>
      </div>

      {/* CSS Animations */}
      <style jsx>{`
        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateX(-30px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
}
