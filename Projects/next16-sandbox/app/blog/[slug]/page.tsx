/**
 * ブログ記事ページ - 動的メタデータの例
 *
 * Next.js 16 Metadata API - 動的 SEO 最適化
 */

import { Metadata } from "next";
import { notFound } from "next/navigation";

// ブログ記事のデータ型
type BlogPost = {
  slug: string;
  title: string;
  description: string;
  content: string;
  author: string;
  publishedAt: string;
  tags: string[];
  image?: string;
};

// サンプルのブログ記事データ
// 実際のプロジェクトではデータベースやCMSから取得
const blogPosts: BlogPost[] = [
  {
    slug: "nextjs-16-introduction",
    title: "Next.js 16 の新機能紹介",
    description:
      "Next.js 16 で導入された新機能について、実例を交えて詳しく解説します。Turbopack、Cache Components、Async Params など。",
    content: `
# Next.js 16 の新機能紹介

Next.js 16 では、開発体験とパフォーマンスが大幅に向上しました。

## 主な新機能

### 1. Turbopack（デフォルト有効）
開発サーバーとビルドが高速化されました。

### 2. Cache Components
\`use cache\` ディレクティブによる簡潔なキャッシング。

### 3. Async Params
動的ルートパラメータとsearchParamsが非同期化され、型安全性が向上。

### 4. View Transitions API
ページ遷移時のスムーズなアニメーション。

## まとめ
Next.js 16 は、最新のReact 19と組み合わせることで、より高速で開発しやすいフレームワークになりました。
    `,
    author: "Next.js Learner",
    publishedAt: "2025-11-08",
    tags: ["Next.js", "React", "Web Development"],
    image: "https://images.unsplash.com/photo-1633356122544-f134324a6cee",
  },
  {
    slug: "server-actions-guide",
    title: "Server Actions 完全ガイド",
    description:
      "Next.js 16 の Server Actions を使ったフォーム処理、データ更新、Optimistic UI の実装方法を徹底解説。",
    content: `
# Server Actions 完全ガイド

Server Actions は、Next.js でサーバーサイドの処理を簡単に書ける機能です。

## 基本的な使い方

\`\`\`typescript
'use server'

export async function createPost(formData: FormData) {
  const title = formData.get('title')
  // データベース処理...
  revalidatePath('/posts')
}
\`\`\`

## Optimistic UI
\`useOptimistic\` を使って、UXを向上させましょう。

## まとめ
Server Actions により、APIルートを書かずにサーバー処理が可能になります。
    `,
    author: "Next.js Learner",
    publishedAt: "2025-11-08",
    tags: ["Server Actions", "Forms", "Next.js"],
    image: "https://images.unsplash.com/photo-1555066931-4365d14bab8c",
  },
  {
    slug: "streaming-suspense",
    title: "Streaming と Suspense でパフォーマンス改善",
    description:
      "React Suspense と Next.js の Streaming SSR を使って、ユーザー体験を向上させる実装パターン。",
    content: `
# Streaming と Suspense でパフォーマンス改善

React 19 の Suspense と Next.js の Streaming SSR を組み合わせることで、段階的なレンダリングが可能になります。

## Suspense Boundaries の配置
遅いコンポーネントを Suspense でラップすることで、他の部分を先に表示できます。

## Loading Skeletons
読み込み中の状態を美しく表示しましょう。

## まとめ
ユーザーは待ち時間を感じにくくなり、体感速度が向上します。
    `,
    author: "Next.js Learner",
    publishedAt: "2025-11-08",
    tags: ["Streaming", "Suspense", "Performance"],
    image: "https://images.unsplash.com/photo-1460925895917-afdab827c52f",
  },
];

// 静的生成のためのパラメータ生成
export async function generateStaticParams() {
  return blogPosts.map((post) => ({
    slug: post.slug,
  }));
}

// ブログ記事を取得
async function getPost(slug: string): Promise<BlogPost | undefined> {
  // 実際のプロジェクトでは、データベースやCMSから取得
  return blogPosts.find((post) => post.slug === slug);
}

// 動的メタデータ生成
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPost(slug);

  if (!post) {
    return {
      title: "記事が見つかりません",
    };
  }

  return {
    title: post.title,
    description: post.description,
    keywords: post.tags,
    authors: [{ name: post.author }],
    openGraph: {
      title: post.title,
      description: post.description,
      type: "article",
      publishedTime: post.publishedAt,
      authors: [post.author],
      tags: post.tags,
      images: post.image
        ? [
            {
              url: post.image,
              width: 1200,
              height: 630,
              alt: post.title,
            },
          ]
        : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title: post.title,
      description: post.description,
      images: post.image ? [post.image] : undefined,
    },
  };
}

// ブログ記事ページ
export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = await getPost(slug);

  if (!post) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 py-12 px-4">
      <article className="max-w-4xl mx-auto bg-white rounded-lg shadow-lg p-8">
        {/* ヘッダー */}
        <div className="mb-8">
          <a
            href="/"
            className="text-blue-600 hover:text-blue-800 mb-4 inline-block"
          >
            ← ホームに戻る
          </a>

          {/* タイトル */}
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            {post.title}
          </h1>

          {/* メタ情報 */}
          <div className="flex items-center text-gray-600 text-sm mb-4">
            <span>{post.author}</span>
            <span className="mx-2">•</span>
            <time dateTime={post.publishedAt}>
              {new Date(post.publishedAt).toLocaleDateString("ja-JP", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </time>
          </div>

          {/* タグ */}
          <div className="flex flex-wrap gap-2 mb-6">
            {post.tags.map((tag) => (
              <span
                key={tag}
                className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
              >
                {tag}
              </span>
            ))}
          </div>

          {/* アイキャッチ画像 */}
          {post.image && (
            <div className="rounded-lg overflow-hidden mb-6">
              <img
                src={post.image}
                alt={post.title}
                className="w-full h-96 object-cover"
              />
            </div>
          )}

          {/* 説明 */}
          <p className="text-xl text-gray-700 leading-relaxed">
            {post.description}
          </p>
        </div>

        {/* 本文 */}
        <div className="prose prose-lg max-w-none">
          <div
            className="whitespace-pre-wrap text-gray-800 leading-relaxed"
            dangerouslySetInnerHTML={{ __html: post.content }}
          />
        </div>

        {/* フッター */}
        <div className="mt-12 pt-8 border-t border-gray-200">
          <div className="bg-blue-50 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              📊 メタデータ情報（デモ用）
            </h3>
            <div className="text-sm text-gray-700 space-y-2">
              <p>
                <strong>Title:</strong> {post.title}
              </p>
              <p>
                <strong>Description:</strong> {post.description}
              </p>
              <p>
                <strong>OG Image:</strong> {post.image || "なし"}
              </p>
              <p>
                <strong>Published:</strong> {post.publishedAt}
              </p>
              <p>
                <strong>Tags:</strong> {post.tags.join(", ")}
              </p>
            </div>
          </div>
        </div>
      </article>
    </div>
  );
}
