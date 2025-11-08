/**
 * Async Params デモ: ネストした動的ルート
 *
 * 複数のパラメータ（userId, postId）を扱う例
 * /users/[userId]/posts/[postId] のパターン
 */

interface PageProps {
  params: Promise<{
    userId: string;
    postId: string;
  }>;
}

interface User {
  id: number;
  name: string;
  username: string;
  email: string;
}

interface Post {
  id: number;
  userId: number;
  title: string;
  body: string;
  publishedAt: string;
  tags: string[];
}

// ダミーデータ
const users: Record<number, User> = {
  1: {
    id: 1,
    name: "山田太郎",
    username: "yamada_taro",
    email: "yamada@example.com",
  },
  2: {
    id: 2,
    name: "佐藤花子",
    username: "sato_hanako",
    email: "sato@example.com",
  },
  3: {
    id: 3,
    name: "鈴木一郎",
    username: "suzuki_ichiro",
    email: "suzuki@example.com",
  },
};

const posts: Record<string, Post> = {
  "1-1": {
    id: 1,
    userId: 1,
    title: "Next.js 16を使ってみた感想",
    body: "Turbopackの高速化が素晴らしい！開発体験が大幅に向上しました。特にHMRの速度が劇的に改善されています。",
    publishedAt: "2025-11-08",
    tags: ["nextjs", "turbopack", "web開発"],
  },
  "1-2": {
    id: 2,
    userId: 1,
    title: "use cacheディレクティブの使い方",
    body: "キャッシュ機能が非常に簡単に使えます。パフォーマンス改善に大きな効果がありました。",
    publishedAt: "2025-11-07",
    tags: ["nextjs", "cache", "performance"],
  },
  "2-1": {
    id: 1,
    userId: 2,
    title: "React 19 Compilerの仕組み",
    body: "自動メモ化により、useMemoやuseCallbackの使用頻度が減りました。コードがシンプルになって嬉しいです。",
    publishedAt: "2025-11-06",
    tags: ["react", "compiler", "optimization"],
  },
  "2-2": {
    id: 2,
    userId: 2,
    title: "TypeScriptの型安全性を活かす",
    body: "Next.js 16とTypeScriptの組み合わせで、開発時の型エラーがほぼなくなりました。",
    publishedAt: "2025-11-05",
    tags: ["typescript", "nextjs", "dx"],
  },
  "3-1": {
    id: 1,
    userId: 3,
    title: "Async Paramsの移行ガイド",
    body: "Next.js 15からの移行は思ったよりスムーズでした。パラメータをawaitするだけです。",
    publishedAt: "2025-11-04",
    tags: ["nextjs", "migration", "async"],
  },
};

async function fetchUser(userId: number): Promise<User | null> {
  await new Promise((resolve) => setTimeout(resolve, 30));
  return users[userId] || null;
}

async function fetchPost(
  userId: number,
  postId: number
): Promise<Post | null> {
  await new Promise((resolve) => setTimeout(resolve, 30));
  const key = `${userId}-${postId}`;
  const post = posts[key];

  // 投稿が存在し、かつuserIdが一致する場合のみ返す
  if (post && post.userId === userId) {
    return post;
  }

  return null;
}

/**
 * ネストした動的ルートのページ
 *
 * params.userId と params.postId の両方を await で取得
 */
export default async function UserPostPage({ params }: PageProps) {
  // ✅ Next.js 16: 複数のparamsを await で解決
  const { userId: userIdStr, postId: postIdStr } = await params;

  // 文字列を数値に変換
  const userId = parseInt(userIdStr, 10);
  const postId = parseInt(postIdStr, 10);

  // バリデーション
  if (isNaN(userId) || isNaN(postId)) {
    return (
      <div className="min-h-screen bg-gray-50 py-12 px-4">
        <div className="max-w-3xl mx-auto">
          <div className="bg-white rounded-lg shadow-md p-8">
            <h1 className="text-3xl font-bold text-red-600 mb-4">
              ⚠️ 無効なパラメータです
            </h1>
            <div className="space-y-2 text-gray-600">
              <p>
                userId: <code className="bg-gray-100 px-2 py-1 rounded">{userIdStr}</code>
                {isNaN(userId) && <span className="text-red-600 ml-2">← 無効</span>}
              </p>
              <p>
                postId: <code className="bg-gray-100 px-2 py-1 rounded">{postIdStr}</code>
                {isNaN(postId) && <span className="text-red-600 ml-2">← 無効</span>}
              </p>
            </div>
            <a
              href="/users/1/posts/1"
              className="mt-6 inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              正しいURLを見る
            </a>
          </div>
        </div>
      </div>
    );
  }

  // データ取得
  const [user, post] = await Promise.all([
    fetchUser(userId),
    fetchPost(userId, postId),
  ]);

  // ユーザーが見つからない
  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 py-12 px-4">
        <div className="max-w-3xl mx-auto">
          <div className="bg-white rounded-lg shadow-md p-8 text-center">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              ユーザーが見つかりません
            </h1>
            <p className="text-gray-600 mb-6">
              User ID: <code className="bg-gray-100 px-2 py-1 rounded">{userId}</code>
            </p>
            <div className="flex gap-4 justify-center">
              {Object.values(users).slice(0, 3).map((u) => (
                <a
                  key={u.id}
                  href={`/users/${u.id}/posts/1`}
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  {u.name}
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 投稿が見つからない
  if (!post) {
    const userPosts = Object.values(posts).filter((p) => p.userId === userId);

    return (
      <div className="min-h-screen bg-gray-50 py-12 px-4">
        <div className="max-w-3xl mx-auto">
          <div className="bg-white rounded-lg shadow-md p-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              投稿が見つかりません
            </h1>
            <p className="text-gray-600 mb-6">
              <strong>{user.name}</strong>の投稿ID{" "}
              <code className="bg-gray-100 px-2 py-1 rounded">{postId}</code>{" "}
              は存在しません
            </p>

            {userPosts.length > 0 && (
              <div>
                <h2 className="text-lg font-semibold text-gray-800 mb-3">
                  {user.name}の他の投稿:
                </h2>
                <div className="space-y-2">
                  {userPosts.map((p) => (
                    <a
                      key={p.id}
                      href={`/users/${userId}/posts/${p.id}`}
                      className="block p-3 border rounded hover:border-blue-500 hover:bg-blue-50"
                    >
                      {p.title}
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Async Params情報 */}
        <div className="mb-6 p-6 bg-green-50 border border-green-200 rounded-lg">
          <h2 className="text-lg font-semibold text-green-900 mb-3">
            ✨ ネストした Async Params (Next.js 16)
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <div className="font-semibold text-green-900 mb-2">
                URLパターン:
              </div>
              <code className="bg-green-100 px-2 py-1 rounded text-green-800 block">
                /users/[userId]/posts/[postId]
              </code>
            </div>
            <div>
              <div className="font-semibold text-green-900 mb-2">
                実際のURL:
              </div>
              <code className="bg-green-100 px-2 py-1 rounded text-green-800 block">
                /users/{userId}/posts/{postId}
              </code>
            </div>
            <div className="md:col-span-2">
              <div className="font-semibold text-green-900 mb-2">
                取得したパラメータ:
              </div>
              <code className="bg-green-100 px-2 py-1 rounded text-green-800 block">
                const &#123; userId, postId &#125; = await params;
              </code>
            </div>
          </div>
        </div>

        {/* ユーザー情報 */}
        <div className="mb-6 bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center text-white text-2xl font-bold">
              {user.name[0]}
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">{user.name}</h2>
              <p className="text-gray-600">@{user.username}</p>
              <p className="text-sm text-gray-500">{user.email}</p>
            </div>
          </div>
        </div>

        {/* 投稿内容 */}
        <article className="bg-white rounded-lg shadow-md p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            {post.title}
          </h1>

          <div className="flex items-center gap-4 text-sm text-gray-600 mb-6">
            <span>📅 {post.publishedAt}</span>
            <span>•</span>
            <span>👤 {user.name}</span>
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
            <p className="text-lg text-gray-700 leading-relaxed">{post.body}</p>
          </div>
        </article>

        {/* 他の投稿 */}
        <div className="mt-8 bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            {user.name}の他の投稿
          </h3>

          <div className="space-y-3">
            {Object.values(posts)
              .filter((p) => p.userId === userId && p.id !== postId)
              .map((p) => (
                <a
                  key={p.id}
                  href={`/users/${userId}/posts/${p.id}`}
                  className="block p-4 border rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors"
                >
                  <div className="font-semibold text-gray-900 mb-2">
                    {p.title}
                  </div>
                  <div className="flex gap-2">
                    {p.tags.map((tag) => (
                      <span
                        key={tag}
                        className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </a>
              ))}
          </div>
        </div>

        {/* 他のユーザー */}
        <div className="mt-8 bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            他のユーザーの投稿
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {Object.values(users)
              .filter((u) => u.id !== userId)
              .map((u) => (
                <a
                  key={u.id}
                  href={`/users/${u.id}/posts/1`}
                  className="block p-4 border rounded-lg hover:border-blue-500 hover:bg-blue-50"
                >
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center text-white text-lg font-bold mb-2">
                    {u.name[0]}
                  </div>
                  <div className="font-semibold text-gray-900">{u.name}</div>
                  <div className="text-sm text-gray-600">@{u.username}</div>
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
            href="/products/1"
            className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            商品ページ →
          </a>
        </div>
      </div>
    </div>
  );
}

/**
 * 静的パスの生成（オプション）
 */
export async function generateStaticParams() {
  const params: { userId: string; postId: string }[] = [];

  Object.values(posts).forEach((post) => {
    params.push({
      userId: post.userId.toString(),
      postId: post.id.toString(),
    });
  });

  return params;
}
