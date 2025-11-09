/**
 * Next.js 16 学習サンドボックス
 *
 * Phase 1.5 の実装例へのナビゲーション
 */

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 py-12 px-4">
      <div className="max-w-6xl mx-auto">
        {/* ヘッダー */}
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-gray-900 mb-4">
            Next.js 16 学習サンドボックス
          </h1>
          <p className="text-xl text-gray-600">
            Phase 1.5: 実践応用（拡張）の実装例
          </p>
        </div>

        {/* デモカード */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Server Actions & Forms */}
          <a
            href="/forms"
            className="group block p-6 bg-white rounded-lg shadow-md hover:shadow-xl transition-all duration-300 border-2 border-transparent hover:border-blue-500"
          >
            <div className="flex items-center mb-4">
              <span className="text-4xl mr-3">📝</span>
              <h2 className="text-2xl font-semibold text-gray-900 group-hover:text-blue-600">
                Server Actions
              </h2>
            </div>
            <p className="text-gray-600 mb-4">
              フォーム処理、CRUD操作、Optimistic UIの実装例
            </p>
            <div className="space-y-1 text-sm text-gray-500">
              <div>✓ useFormState</div>
              <div>✓ useFormStatus</div>
              <div>✓ useOptimistic</div>
              <div>✓ Progressive Enhancement</div>
            </div>
          </a>

          {/* Streaming & Suspense */}
          <a
            href="/streaming"
            className="group block p-6 bg-white rounded-lg shadow-md hover:shadow-xl transition-all duration-300 border-2 border-transparent hover:border-green-500"
          >
            <div className="flex items-center mb-4">
              <span className="text-4xl mr-3">🌊</span>
              <h2 className="text-2xl font-semibold text-gray-900 group-hover:text-green-600">
                Streaming
              </h2>
            </div>
            <p className="text-gray-600 mb-4">
              Suspense、段階的レンダリング、並列データフェッチング
            </p>
            <div className="space-y-1 text-sm text-gray-500">
              <div>✓ Suspense Boundaries</div>
              <div>✓ Loading Skeletons</div>
              <div>✓ Parallel Fetching</div>
              <div>✓ Streaming SSR</div>
            </div>
          </a>

          {/* Cache Components */}
          <a
            href="/cache-demo"
            className="group block p-6 bg-white rounded-lg shadow-md hover:shadow-xl transition-all duration-300 border-2 border-transparent hover:border-purple-500"
          >
            <div className="flex items-center mb-4">
              <span className="text-4xl mr-3">⚡</span>
              <h2 className="text-2xl font-semibold text-gray-900 group-hover:text-purple-600">
                Cache
              </h2>
            </div>
            <p className="text-gray-600 mb-4">
              unstable_cache、fetch キャッシング、パフォーマンス最適化
            </p>
            <div className="space-y-1 text-sm text-gray-500">
              <div>✓ unstable_cache</div>
              <div>✓ Force Cache</div>
              <div>✓ Revalidation</div>
              <div>✓ Cache Tags</div>
            </div>
          </a>

          {/* Turbopack */}
          <a
            href="/turbopack"
            className="group block p-6 bg-white rounded-lg shadow-md hover:shadow-xl transition-all duration-300 border-2 border-transparent hover:border-orange-500"
          >
            <div className="flex items-center mb-4">
              <span className="text-4xl mr-3">⚙️</span>
              <h2 className="text-2xl font-semibold text-gray-900 group-hover:text-orange-600">
                Turbopack
              </h2>
            </div>
            <p className="text-gray-600 mb-4">
              Next.js 16 のデフォルトバンドラー、高速開発体験
            </p>
            <div className="space-y-1 text-sm text-gray-500">
              <div>✓ Fast Refresh</div>
              <div>✓ HMR</div>
              <div>✓ Build Performance</div>
              <div>✓ Dev Experience</div>
            </div>
          </a>

          {/* View Transitions */}
          <a
            href="/gallery"
            className="group block p-6 bg-white rounded-lg shadow-md hover:shadow-xl transition-all duration-300 border-2 border-transparent hover:border-pink-500"
          >
            <div className="flex items-center mb-4">
              <span className="text-4xl mr-3">✨</span>
              <h2 className="text-2xl font-semibold text-gray-900 group-hover:text-pink-600">
                View Transitions
              </h2>
            </div>
            <p className="text-gray-600 mb-4">
              ページ遷移アニメーション、スムーズなUX
            </p>
            <div className="space-y-1 text-sm text-gray-500">
              <div>✓ Page Transitions</div>
              <div>✓ Shared Elements</div>
              <div>✓ Smooth Navigation</div>
              <div>✓ Modern UX</div>
            </div>
          </a>

          {/* Async Params */}
          <a
            href="/dashboard"
            className="group block p-6 bg-white rounded-lg shadow-md hover:shadow-xl transition-all duration-300 border-2 border-transparent hover:border-indigo-500"
          >
            <div className="flex items-center mb-4">
              <span className="text-4xl mr-3">🔄</span>
              <h2 className="text-2xl font-semibold text-gray-900 group-hover:text-indigo-600">
                Async Params
              </h2>
            </div>
            <p className="text-gray-600 mb-4">
              非同期パラメータ、動的ルーティング
            </p>
            <div className="space-y-1 text-sm text-gray-500">
              <div>✓ Dynamic Routes</div>
              <div>✓ Async params/searchParams</div>
              <div>✓ Type Safety</div>
              <div>✓ Migration Pattern</div>
            </div>
          </a>

          {/* Error Handling */}
          <a
            href="/error-demo"
            className="group block p-6 bg-white rounded-lg shadow-md hover:shadow-xl transition-all duration-300 border-2 border-transparent hover:border-red-500"
          >
            <div className="flex items-center mb-4">
              <span className="text-4xl mr-3">⚠️</span>
              <h2 className="text-2xl font-semibold text-gray-900 group-hover:text-red-600">
                Error Handling
              </h2>
            </div>
            <p className="text-gray-600 mb-4">
              エラーバウンダリー、404ページ、エラーリカバリー
            </p>
            <div className="space-y-1 text-sm text-gray-500">
              <div>✓ error.tsx</div>
              <div>✓ global-error.tsx</div>
              <div>✓ not-found.tsx</div>
              <div>✓ Segment-specific Errors</div>
            </div>
          </a>

          {/* Route Handlers (API Routes) */}
          <a
            href="/api-demo"
            className="group block p-6 bg-white rounded-lg shadow-md hover:shadow-xl transition-all duration-300 border-2 border-transparent hover:border-teal-500"
          >
            <div className="flex items-center mb-4">
              <span className="text-4xl mr-3">🚀</span>
              <h2 className="text-2xl font-semibold text-gray-900 group-hover:text-teal-600">
                Route Handlers
              </h2>
            </div>
            <p className="text-gray-600 mb-4">
              RESTful API、GET/POST/PUT/DELETE、認証サンプル
            </p>
            <div className="space-y-1 text-sm text-gray-500">
              <div>✓ /api/posts (GET, POST)</div>
              <div>✓ /api/posts/[id] (GET, PUT, DELETE)</div>
              <div>✓ /api/auth (POST, DELETE)</div>
              <div>✓ CORS & Error Handling</div>
            </div>
          </a>

          {/* Image & Font Optimization */}
          <a
            href="/images"
            className="group block p-6 bg-white rounded-lg shadow-md hover:shadow-xl transition-all duration-300 border-2 border-transparent hover:border-amber-500"
          >
            <div className="flex items-center mb-4">
              <span className="text-4xl mr-3">🎨</span>
              <h2 className="text-2xl font-semibold text-gray-900 group-hover:text-amber-600">
                Image & Font
              </h2>
            </div>
            <p className="text-gray-600 mb-4">
              next/image、フォント最適化、WebP/AVIF変換
            </p>
            <div className="space-y-1 text-sm text-gray-500">
              <div>✓ next/image コンポーネント</div>
              <div>✓ Google Fonts 最適化</div>
              <div>✓ Variable Fonts</div>
              <div>✓ Lazy Loading & Priority</div>
            </div>
          </a>

          {/* Metadata API (SEO) */}
          <a
            href="/blog"
            className="group block p-6 bg-white rounded-lg shadow-md hover:shadow-xl transition-all duration-300 border-2 border-transparent hover:border-cyan-500"
          >
            <div className="flex items-center mb-4">
              <span className="text-4xl mr-3">🔍</span>
              <h2 className="text-2xl font-semibold text-gray-900 group-hover:text-cyan-600">
                Metadata & SEO
              </h2>
            </div>
            <p className="text-gray-600 mb-4">
              メタデータAPI、Open Graph、Sitemap、Robots.txt
            </p>
            <div className="space-y-1 text-sm text-gray-500">
              <div>✓ 静的・動的メタデータ</div>
              <div>✓ Open Graph 画像生成</div>
              <div>✓ Sitemap.xml 自動生成</div>
              <div>✓ SEO 最適化</div>
            </div>
          </a>

          {/* Middleware */}
          <a
            href="/middleware-demo"
            className="group block p-6 bg-white rounded-lg shadow-md hover:shadow-xl transition-all duration-300 border-2 border-transparent hover:border-yellow-500"
          >
            <div className="flex items-center mb-4">
              <span className="text-4xl mr-3">🛡️</span>
              <h2 className="text-2xl font-semibold text-gray-900 group-hover:text-yellow-600">
                Middleware
              </h2>
            </div>
            <p className="text-gray-600 mb-4">
              認証チェック、リダイレクト、ヘッダー追加、A/Bテスト
            </p>
            <div className="space-y-1 text-sm text-gray-500">
              <div>✓ 認証・認可チェック</div>
              <div>✓ 条件付きリダイレクト</div>
              <div>✓ カスタムヘッダー追加</div>
              <div>✓ A/B テスト実装</div>
            </div>
          </a>
        </div>

        {/* フッター情報 */}
        <div className="mt-12 p-6 bg-white rounded-lg shadow-md">
          <h3 className="text-xl font-semibold text-gray-900 mb-4">
            📚 実装済み機能
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
            <div>
              <h4 className="font-semibold text-gray-900 mb-2">Phase 1: 実践基礎</h4>
              <ul className="space-y-1">
                <li>✅ Turbopack （デフォルト有効）</li>
                <li>✅ Cache Components → unstable_cache</li>
                <li>✅ Async params/searchParams</li>
                <li>✅ View Transitions</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 mb-2">Phase 1.5: 実践応用</h4>
              <ul className="space-y-1">
                <li>✅ Server Actions & Forms</li>
                <li>✅ Streaming & Suspense</li>
                <li>✅ Error Handling</li>
                <li>✅ Route Handlers (API Routes)</li>
                <li>✅ Loading UI & Skeletons</li>
                <li>✅ Image & Font Optimization</li>
                <li>✅ Metadata API (SEO)</li>
                <li>✅ Middleware</li>
                <li>⏳ Route Groups （次回）</li>
              </ul>
            </div>
          </div>
        </div>

        {/* 技術スタック */}
        <div className="mt-6 text-center text-sm text-gray-500">
          <p>Next.js 16.0.1 • React 19.2.0 • TypeScript 5 • Tailwind CSS 3</p>
          <p className="mt-2">
            📖 ドキュメント:{" "}
            <code className="bg-gray-100 px-2 py-1 rounded text-xs">
              Knowledge/Examples/
            </code>
          </p>
        </div>
      </div>
    </div>
  );
}
