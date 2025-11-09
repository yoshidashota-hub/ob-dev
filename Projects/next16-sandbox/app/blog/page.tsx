/**
 * ブログ一覧ページ
 *
 * Metadata と SEO のデモページ
 */

import { Metadata } from "next";

export const metadata: Metadata = {
  title: "ブログ",
  description: "Next.js 16 の機能や実装パターンについて解説するブログ記事一覧",
};

// ブログ記事データ
const blogPosts = [
  {
    slug: "nextjs-16-introduction",
    title: "Next.js 16 の新機能紹介",
    description:
      "Next.js 16 で導入された新機能について、実例を交えて詳しく解説します。",
    publishedAt: "2025-11-08",
    tags: ["Next.js", "React", "Web Development"],
    image: "https://images.unsplash.com/photo-1633356122544-f134324a6cee",
  },
  {
    slug: "server-actions-guide",
    title: "Server Actions 完全ガイド",
    description:
      "Next.js 16 の Server Actions を使ったフォーム処理、データ更新、Optimistic UI の実装方法を徹底解説。",
    publishedAt: "2025-11-08",
    tags: ["Server Actions", "Forms", "Next.js"],
    image: "https://images.unsplash.com/photo-1555066931-4365d14bab8c",
  },
  {
    slug: "streaming-suspense",
    title: "Streaming と Suspense でパフォーマンス改善",
    description:
      "React Suspense と Next.js の Streaming SSR を使って、ユーザー体験を向上させる実装パターン。",
    publishedAt: "2025-11-08",
    tags: ["Streaming", "Suspense", "Performance"],
    image: "https://images.unsplash.com/photo-1460925895917-afdab827c52f",
  },
];

export default function BlogPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 py-12 px-4">
      <div className="max-w-6xl mx-auto">
        {/* ヘッダー */}
        <div className="mb-8">
          <a
            href="/"
            className="text-blue-600 hover:text-blue-800 mb-4 inline-block"
          >
            ← ホームに戻る
          </a>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">ブログ</h1>
          <p className="text-gray-600">
            Next.js 16 の機能や実装パターンについて解説
          </p>
        </div>

        {/* 記事一覧 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {blogPosts.map((post) => (
            <a
              key={post.slug}
              href={`/blog/${post.slug}`}
              className="group block bg-white rounded-lg shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden"
            >
              {/* アイキャッチ画像 */}
              <div className="relative h-48 overflow-hidden">
                <img
                  src={post.image}
                  alt={post.title}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                />
              </div>

              {/* コンテンツ */}
              <div className="p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-2 group-hover:text-blue-600">
                  {post.title}
                </h2>
                <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                  {post.description}
                </p>

                {/* タグ */}
                <div className="flex flex-wrap gap-2 mb-3">
                  {post.tags.slice(0, 2).map((tag) => (
                    <span
                      key={tag}
                      className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs"
                    >
                      {tag}
                    </span>
                  ))}
                </div>

                {/* 日付 */}
                <time className="text-xs text-gray-500">
                  {new Date(post.publishedAt).toLocaleDateString("ja-JP", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </time>
              </div>
            </a>
          ))}
        </div>

        {/* Metadata デモ情報 */}
        <div className="mt-12 bg-white rounded-lg shadow-md p-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">
            📊 Metadata API の機能
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">静的メタデータ</h3>
              <ul className="text-sm text-gray-700 space-y-1">
                <li>• このページ: layout.tsx で設定</li>
                <li>• title、description、keywords</li>
                <li>• Open Graph、Twitter Card</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">動的メタデータ</h3>
              <ul className="text-sm text-gray-700 space-y-1">
                <li>• 各記事: generateMetadata() で生成</li>
                <li>• 記事ごとの title、description</li>
                <li>• 記事固有の OG 画像</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">Sitemap</h3>
              <ul className="text-sm text-gray-700 space-y-1">
                <li>• /sitemap.xml で確認可能</li>
                <li>• 全ページの URL 一覧</li>
                <li>• 検索エンジンが効率的にクロール</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">Robots.txt</h3>
              <ul className="text-sm text-gray-700 space-y-1">
                <li>• /robots.txt で確認可能</li>
                <li>• クローラーの動作を制御</li>
                <li>• API エンドポイントは除外</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
