import { CachedProduct, UncachedProduct } from "../components/CachedProduct";
import {
  getCachedUser,
  getCachedUserPosts,
  calculateFibonacci,
  getStatistics,
} from "../actions/cachedActions";

/**
 * キャッシュ機能のデモページ
 *
 * 3種類のキャッシュパターンを実演:
 * 1. ページキャッシュ
 * 2. コンポーネントキャッシュ
 * 3. 関数キャッシュ
 */

export default async function CacheDemoPage() {
  const startTime = Date.now();

  // 関数キャッシュの使用例
  const user = await getCachedUser(1);
  const posts = await getCachedUserPosts(1);
  const fibonacci40 = await calculateFibonacci(40);
  const stats = await getStatistics();

  const loadTime = Date.now() - startTime;

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-6xl mx-auto space-y-8">
        <div className="bg-white rounded-lg shadow-md p-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Cache Components デモ
          </h1>
          <p className="text-lg text-gray-600 mb-6">
            Next.js 16 の<code className="bg-gray-100 px-2 py-1 rounded">unstable_cache</code>
            と fetch キャッシュを使った3種類のキャッシュパターン
          </p>

          <div className="grid grid-cols-3 gap-4 p-4 bg-blue-50 border border-blue-200 rounded">
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600">{loadTime}ms</div>
              <div className="text-sm text-blue-800">読み込み時間</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600">5</div>
              <div className="text-sm text-green-800">キャッシュAPI</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-600">3</div>
              <div className="text-sm text-purple-800">キャッシュタイプ</div>
            </div>
          </div>
        </div>

        {/* 関数キャッシュデモ */}
        <section className="bg-white rounded-lg shadow-md p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            1️⃣ 関数キャッシュ (Function Cache)
          </h2>
          <p className="text-gray-600 mb-6">
            個別の関数に<code className="bg-gray-100 px-1 rounded">unstable_cache</code>
            を適用し、戻り値をキャッシュ
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="border rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-3">
                ユーザー情報（getCachedUser）
              </h3>
              <dl className="space-y-2 text-sm">
                <div>
                  <dt className="font-medium text-gray-500">名前</dt>
                  <dd className="text-gray-900">{user.name}</dd>
                </div>
                <div>
                  <dt className="font-medium text-gray-500">ユーザー名</dt>
                  <dd className="text-gray-900">@{user.username}</dd>
                </div>
                <div>
                  <dt className="font-medium text-gray-500">メール</dt>
                  <dd className="text-gray-900">{user.email}</dd>
                </div>
                <div>
                  <dt className="font-medium text-gray-500">会社</dt>
                  <dd className="text-gray-900">{user.company.name}</dd>
                </div>
              </dl>
            </div>

            <div className="border rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-3">
                投稿数（getCachedUserPosts）
              </h3>
              <div className="text-center py-8">
                <div className="text-6xl font-bold text-blue-600">
                  {posts.length}
                </div>
                <div className="text-gray-600 mt-2">件の投稿</div>
              </div>
              <p className="text-xs text-gray-500 mt-4">
                最新投稿: {posts[0]?.title}
              </p>
            </div>

            <div className="border rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-3">
                計算結果（calculateFibonacci）
              </h3>
              <div className="text-center py-8">
                <div className="text-sm text-gray-600 mb-2">
                  fibonacci(40) =
                </div>
                <div className="text-4xl font-bold text-purple-600">
                  {fibonacci40.toLocaleString()}
                </div>
              </div>
              <p className="text-xs text-gray-500 mt-4">
                キャッシュがあれば瞬時に計算結果を返す
              </p>
            </div>

            <div className="border rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-3">
                統計情報（getStatistics）
              </h3>
              <dl className="space-y-2 text-sm">
                <div>
                  <dt className="font-medium text-gray-500">総ユーザー数</dt>
                  <dd className="text-gray-900">{stats.totalUsers}</dd>
                </div>
                <div>
                  <dt className="font-medium text-gray-500">総投稿数</dt>
                  <dd className="text-gray-900">{stats.totalPosts}</dd>
                </div>
                <div>
                  <dt className="font-medium text-gray-500">平均投稿数</dt>
                  <dd className="text-gray-900">
                    {stats.averagePostsPerUser} 件/人
                  </dd>
                </div>
                <div>
                  <dt className="font-medium text-gray-500">計算時刻</dt>
                  <dd className="text-xs text-gray-600">
                    {new Date(stats.calculatedAt).toLocaleString("ja-JP")}
                  </dd>
                </div>
              </dl>
            </div>
          </div>
        </section>

        {/* コンポーネントキャッシュデモ */}
        <section className="bg-white rounded-lg shadow-md p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            2️⃣ コンポーネントキャッシュ (Component Cache)
          </h2>
          <p className="text-gray-600 mb-6">
            個別のコンポーネントをキャッシュし、パフォーマンスを向上
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-sm font-semibold text-green-700 mb-3 flex items-center gap-2">
                <span className="bg-green-100 px-2 py-1 rounded">✓ キャッシュあり</span>
              </h3>
              <CachedProduct productId={1} />
            </div>

            <div>
              <h3 className="text-sm font-semibold text-red-700 mb-3 flex items-center gap-2">
                <span className="bg-red-100 px-2 py-1 rounded">✗ キャッシュなし</span>
              </h3>
              <UncachedProduct productId={1} />
            </div>
          </div>

          <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded">
            <p className="text-sm text-yellow-800">
              <strong>比較ポイント:</strong> ページをリロードして、
              両コンポーネントの「時刻」を比較してください。
              キャッシュありの方は時刻が変わりません。
            </p>
          </div>
        </section>

        {/* ナビゲーション */}
        <div className="bg-white rounded-lg shadow-md p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            3️⃣ ページキャッシュ (Page Cache)
          </h2>
          <p className="text-gray-600 mb-6">
            ページ全体をキャッシュする例は別ページで確認できます
          </p>

          <div className="flex gap-4">
            <a
              href="/"
              className="inline-flex items-center px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              ← ホーム
            </a>
            <a
              href="/cached-page"
              className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              ページキャッシュのデモ →
            </a>
          </div>
        </div>

        {/* 技術説明 */}
        <div className="bg-white rounded-lg shadow-md p-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">
            キャッシュの仕組み
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="border-l-4 border-blue-500 pl-4">
              <h3 className="font-semibold text-gray-900 mb-2">ページキャッシュ</h3>
              <p className="text-sm text-gray-600">
                ページ全体をキャッシュ。静的コンテンツに最適。
              </p>
              <code className="text-xs bg-gray-100 p-1 rounded block mt-2">
                fetch with cache: &quot;force-cache&quot;
              </code>
            </div>

            <div className="border-l-4 border-green-500 pl-4">
              <h3 className="font-semibold text-gray-900 mb-2">コンポーネントキャッシュ</h3>
              <p className="text-sm text-gray-600">
                個別コンポーネントをキャッシュ。部分的な静的化に最適。
              </p>
              <code className="text-xs bg-gray-100 p-1 rounded block mt-2">
                Component with cache options
              </code>
            </div>

            <div className="border-l-4 border-purple-500 pl-4">
              <h3 className="font-semibold text-gray-900 mb-2">関数キャッシュ</h3>
              <p className="text-sm text-gray-600">
                関数の戻り値をキャッシュ。API呼び出しや重い計算に最適。
              </p>
              <code className="text-xs bg-gray-100 p-1 rounded block mt-2">
                unstable_cache(fn, keys, tags)
              </code>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
