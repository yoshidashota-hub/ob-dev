import Link from "next/link";

export default function Home() {
  const features = [
    {
      category: "Routing & Navigation",
      items: [
        {
          name: "Async Params",
          href: "/dashboard",
          icon: "🔄",
          description: "非同期パラメータと動的ルーティング",
          color: "indigo",
        },
        {
          name: "Route Groups",
          href: "/about",
          icon: "📂",
          description: "複数レイアウトとルートグループ化",
          color: "rose",
        },
        {
          name: "Parallel Routes",
          href: "/photos",
          icon: "🔀",
          description: "並列ルートとインターセプト",
          color: "emerald",
        },
        {
          name: "Middleware",
          href: "/middleware-demo",
          icon: "🛡️",
          description: "認証、リダイレクト、A/Bテスト",
          color: "yellow",
        },
      ],
    },
    {
      category: "Data Fetching",
      items: [
        {
          name: "Server Actions",
          href: "/forms",
          icon: "📝",
          description: "フォーム処理とOptimistic UI",
          color: "blue",
        },
        {
          name: "Route Handlers",
          href: "/api-demo",
          icon: "🚀",
          description: "RESTful APIエンドポイント",
          color: "teal",
        },
        {
          name: "Streaming",
          href: "/streaming",
          icon: "🌊",
          description: "Suspenseと段階的レンダリング",
          color: "green",
        },
        {
          name: "Cache",
          href: "/cache-demo",
          icon: "⚡",
          description: "キャッシング戦略と最適化",
          color: "purple",
        },
      ],
    },
    {
      category: "Optimization",
      items: [
        {
          name: "Image & Font",
          href: "/images",
          icon: "🎨",
          description: "next/imageとフォント最適化",
          color: "amber",
        },
        {
          name: "Metadata & SEO",
          href: "/blog",
          icon: "🔍",
          description: "メタデータAPIとSEO対策",
          color: "cyan",
        },
        {
          name: "View Transitions",
          href: "/gallery",
          icon: "✨",
          description: "ページ遷移アニメーション",
          color: "pink",
        },
      ],
    },
    {
      category: "Error Handling",
      items: [
        {
          name: "Error Boundaries",
          href: "/error-demo",
          icon: "⚠️",
          description: "エラーバウンダリーと404ページ",
          color: "red",
        },
      ],
    },
  ];

  return (
    <div className="space-y-12">
      {/* Hero Section */}
      <div className="text-center py-12 bg-gradient-to-br from-blue-50 to-purple-50 rounded-2xl px-6">
        <h1 className="text-5xl font-bold text-gray-900 mb-4">
          Welcome to Next.js 16 Sandbox
        </h1>
        <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
          Next.js 16の新機能を体験できる実践的な学習プラットフォーム
        </p>
        <div className="flex justify-center gap-4 flex-wrap">
          <Link
            href="/forms"
            className="px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors"
          >
            Get Started
          </Link>
          <a
            href="https://nextjs.org/docs"
            target="_blank"
            rel="noopener noreferrer"
            className="px-6 py-3 bg-white text-gray-900 rounded-lg font-semibold border-2 border-gray-200 hover:border-gray-300 transition-colors"
          >
            View Docs →
          </a>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg p-6 border border-gray-200">
          <div className="text-3xl font-bold text-blue-600 mb-2">13+</div>
          <div className="text-sm text-gray-600">Demo Features</div>
        </div>
        <div className="bg-white rounded-lg p-6 border border-gray-200">
          <div className="text-3xl font-bold text-green-600 mb-2">100%</div>
          <div className="text-sm text-gray-600">TypeScript</div>
        </div>
        <div className="bg-white rounded-lg p-6 border border-gray-200">
          <div className="text-3xl font-bold text-purple-600 mb-2">16.0</div>
          <div className="text-sm text-gray-600">Next.js Version</div>
        </div>
        <div className="bg-white rounded-lg p-6 border border-gray-200">
          <div className="text-3xl font-bold text-orange-600 mb-2">19.2</div>
          <div className="text-sm text-gray-600">React Version</div>
        </div>
      </div>

      {/* Features by Category */}
      {features.map((category) => (
        <div key={category.category}>
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            {category.category}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {category.items.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`group block p-6 bg-white rounded-xl border-2 border-gray-200 hover:border-${item.color}-500 hover:shadow-lg transition-all duration-300`}
              >
                <div className="flex items-start">
                  <span className="text-4xl mr-4">{item.icon}</span>
                  <div className="flex-1">
                    <h3
                      className={`text-xl font-semibold text-gray-900 mb-2 group-hover:text-${item.color}-600 transition-colors`}
                    >
                      {item.name}
                    </h3>
                    <p className="text-sm text-gray-600">{item.description}</p>
                  </div>
                </div>
                <div className="mt-4 flex items-center text-sm font-medium text-gray-400 group-hover:text-gray-600">
                  View Demo
                  <svg
                    className="ml-1 w-4 h-4 transform group-hover:translate-x-1 transition-transform"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </div>
              </Link>
            ))}
          </div>
        </div>
      ))}

      {/* Tech Stack */}
      <div className="bg-white rounded-xl p-8 border border-gray-200">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">
          Built with Modern Stack
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <div className="text-center">
            <div className="w-16 h-16 bg-black rounded-lg mx-auto mb-3 flex items-center justify-center text-white font-bold text-xl">
              N
            </div>
            <div className="font-semibold text-gray-900">Next.js 16</div>
            <div className="text-sm text-gray-600">React Framework</div>
          </div>
          <div className="text-center">
            <div className="w-16 h-16 bg-blue-500 rounded-lg mx-auto mb-3 flex items-center justify-center text-white font-bold text-xl">
              R
            </div>
            <div className="font-semibold text-gray-900">React 19</div>
            <div className="text-sm text-gray-600">UI Library</div>
          </div>
          <div className="text-center">
            <div className="w-16 h-16 bg-blue-600 rounded-lg mx-auto mb-3 flex items-center justify-center text-white font-bold text-xl">
              TS
            </div>
            <div className="font-semibold text-gray-900">TypeScript 5</div>
            <div className="text-sm text-gray-600">Type Safety</div>
          </div>
          <div className="text-center">
            <div className="w-16 h-16 bg-cyan-500 rounded-lg mx-auto mb-3 flex items-center justify-center text-white font-bold text-xl">
              T
            </div>
            <div className="font-semibold text-gray-900">Tailwind CSS</div>
            <div className="text-sm text-gray-600">Styling</div>
          </div>
        </div>
      </div>

      {/* CTA */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl p-8 text-center text-white">
        <h2 className="text-3xl font-bold mb-4">Ready to Learn?</h2>
        <p className="text-lg mb-6 opacity-90">
          左のサイドバーから気になる機能を選んで、今すぐ体験してみましょう
        </p>
        <Link
          href="/forms"
          className="inline-block px-8 py-3 bg-white text-blue-600 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
        >
          Start Exploring
        </Link>
      </div>
    </div>
  );
}
