/**
 * Async Params デモ: ブログ記事ページ
 *
 * Next.js 16では、paramsとsearchParamsが非同期になりました。
 * Promiseとして受け取り、awaitで解決する必要があります。
 */

interface PageProps {
  params: Promise<{
    slug: string;
  }>;
  searchParams: Promise<{
    preview?: string;
    lang?: string;
  }>;
}

interface BlogPost {
  slug: string;
  title: string;
  content: string;
  author: string;
  publishedAt: string;
  tags: string[];
}

// ダミーのブログデータ
const blogPosts: Record<string, BlogPost> = {
  "nextjs-16-features": {
    slug: "nextjs-16-features",
    title: "Next.js 16の新機能まとめ",
    content:
      "Next.js 16では、TurbopackがデフォルトになりuseCacheディレクティブが追加されました。また、paramsとsearchParamsが非同期になるなど、多くの改善が行われています。",
    author: "Tech Writer",
    publishedAt: "2025-11-08",
    tags: ["nextjs", "react", "web-development"],
  },
  "typescript-best-practices": {
    slug: "typescript-best-practices",
    title: "TypeScriptのベストプラクティス2025",
    content:
      "TypeScript 5の新機能を活用した、モダンなTypeScript開発のベストプラクティスを紹介します。型安全性を保ちながら、開発効率を向上させるテクニックをまとめました。",
    author: "TypeScript Expert",
    publishedAt: "2025-11-05",
    tags: ["typescript", "programming", "best-practices"],
  },
  "react-19-compiler": {
    slug: "react-19-compiler",
    title: "React 19 Compilerの仕組み",
    content:
      "React 19で導入されたCompilerは、自動的にメモ化を行い、パフォーマンスを向上させます。従来のuseMemoやuseCallbackが不要になる場面も増えてきました。",
    author: "React Team",
    publishedAt: "2025-11-03",
    tags: ["react", "performance", "compiler"],
  },
};

async function fetchBlogPost(slug: string): Promise<BlogPost | null> {
  // 実際のアプリではDBやCMSから取得
  await new Promise((resolve) => setTimeout(resolve, 100)); // 遅延をシミュレート
  return blogPosts[slug] || null;
}

/**
 * Next.js 16のAsync Params実装例
 *
 * paramsはPromise<{}>として受け取り、awaitで解決する
 */
export default async function BlogPostPage({
  params,
  searchParams,
}: PageProps) {
  // ✅ Next.js 16: paramsを await で解決
  const { slug } = await params;

  // ✅ Next.js 16: searchParamsを await で解決
  const { preview, lang } = await searchParams;

  // ブログ記事を取得
  const post = await fetchBlogPost(slug);

  // 404処理
  if (!post) {
    return (
      <div className="min-h-screen bg-gray-50 py-12 px-4">
        <div className="max-w-3xl mx-auto">
          <div className="bg-white rounded-lg shadow-md p-8 text-center">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              記事が見つかりません
            </h1>
            <p className="text-gray-600 mb-6">
              スラッグ:{" "}
              <code className="bg-gray-100 px-2 py-1 rounded">{slug}</code>
            </p>
            <a
              href="/blog/nextjs-16-features"
              className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              サンプル記事を見る
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <article className="max-w-3xl mx-auto">
        {/* プレビューモード表示 */}
        {preview === "true" && (
          <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-sm text-yellow-800">
              <strong>📝 プレビューモード:</strong>{" "}
              この記事はプレビュー表示されています
            </p>
          </div>
        )}

        {/* 言語設定表示 */}
        {lang && (
          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-800">
              <strong>🌐 言語設定:</strong> {lang}
            </p>
          </div>
        )}

        {/* Async Params情報 */}
        <div className="mb-6 p-6 bg-green-50 border border-green-200 rounded-lg">
          <h2 className="text-lg font-semibold text-green-900 mb-3">
            ✨ Async Params (Next.js 16)
          </h2>
          <div className="space-y-2 text-sm text-green-800">
            <div className="flex items-start gap-2">
              <span className="font-mono bg-green-100 px-2 py-1 rounded">
                params
              </span>
              <span>→</span>
              <code className="bg-green-100 px-2 py-1 rounded">
                await params = {JSON.stringify({ slug })}
              </code>
            </div>
            <div className="flex items-start gap-2">
              <span className="font-mono bg-green-100 px-2 py-1 rounded">
                searchParams
              </span>
              <span>→</span>
              <code className="bg-green-100 px-2 py-1 rounded">
                await searchParams = {JSON.stringify({ preview, lang })}
              </code>
            </div>
          </div>
        </div>

        {/* 記事コンテンツ */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="p-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              {post.title}
            </h1>

            <div className="flex items-center gap-4 text-sm text-gray-600 mb-6">
              <span>👤 {post.author}</span>
              <span>•</span>
              <span>📅 {post.publishedAt}</span>
            </div>

            <div className="flex flex-wrap gap-2 mb-8">
              {post.tags.map((tag) => (
                <span
                  key={tag}
                  className="px-3 py-1 text-sm font-medium text-blue-800 bg-blue-100 rounded-full"
                >
                  #{tag}
                </span>
              ))}
            </div>

            <div className="prose max-w-none">
              <p className="text-lg text-gray-700 leading-relaxed">
                {post.content}
              </p>
            </div>
          </div>
        </div>

        {/* デモリンク */}
        <div className="mt-8 bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            🔗 URLパラメータのテスト
          </h3>

          <div className="space-y-3">
            <div>
              <p className="text-sm text-gray-600 mb-2">
                プレビューモードを試す:
              </p>
              <a
                href={`/blog/${slug}?preview=true`}
                className="inline-block px-4 py-2 text-sm bg-yellow-100 text-yellow-800 rounded hover:bg-yellow-200"
              >
                ?preview=true を追加
              </a>
            </div>

            <div>
              <p className="text-sm text-gray-600 mb-2">
                言語パラメータを試す:
              </p>
              <div className="flex gap-2">
                <a
                  href={`/blog/${slug}?lang=ja`}
                  className="inline-block px-4 py-2 text-sm bg-blue-100 text-blue-800 rounded hover:bg-blue-200"
                >
                  ?lang=ja
                </a>
                <a
                  href={`/blog/${slug}?lang=en`}
                  className="inline-block px-4 py-2 text-sm bg-blue-100 text-blue-800 rounded hover:bg-blue-200"
                >
                  ?lang=en
                </a>
              </div>
            </div>

            <div>
              <p className="text-sm text-gray-600 mb-2">複数パラメータ:</p>
              <a
                href={`/blog/${slug}?preview=true&lang=ja`}
                className="inline-block px-4 py-2 text-sm bg-purple-100 text-purple-800 rounded hover:bg-purple-200"
              >
                ?preview=true&lang=ja
              </a>
            </div>
          </div>
        </div>

        {/* 他の記事へのリンク */}
        <div className="mt-8 bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            📚 他の記事
          </h3>

          <div className="space-y-2">
            {Object.values(blogPosts)
              .filter((p) => p.slug !== slug)
              .map((p) => (
                <a
                  key={p.slug}
                  href={`/blog/${p.slug}`}
                  className="block p-3 rounded hover:bg-gray-50 transition-colors"
                >
                  <div className="font-medium text-gray-900">{p.title}</div>
                  <div className="text-sm text-gray-600">
                    {p.author} • {p.publishedAt}
                  </div>
                </a>
              ))}
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
            href="/cache-demo"
            className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            キャッシュデモ →
          </a>
        </div>
      </article>
    </div>
  );
}

/**
 * 静的パスの生成（オプション）
 *
 * ビルド時に生成する静的ページを指定
 */
export async function generateStaticParams() {
  return Object.keys(blogPosts).map((slug) => ({
    slug,
  }));
}
