/**
 * ページレベルのキャッシュ実装
 *
 * Next.js 16.0.1 では "use cache" がサポートされていないため、
 * fetch の cache オプションを使用してキャッシュを実装
 */

interface GitHubRepo {
  name: string;
  description: string;
  stargazers_count: number;
  forks_count: number;
  open_issues_count: number;
  updated_at: string;
}

async function fetchNextJsRepo(): Promise<GitHubRepo> {
  // force-cache でデータをキャッシュ
  const response = await fetch("https://api.github.com/repos/vercel/next.js", {
    cache: "force-cache",
    next: { revalidate: 3600 }, // 1時間ごとに再検証
  });

  if (!response.ok) {
    throw new Error("Failed to fetch repository data");
  }

  return response.json();
}

export default async function CachedPage() {
  const repo = await fetchNextJsRepo();
  const now = new Date().toISOString();

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-3xl mx-auto">
        <div className="bg-white rounded-lg shadow-md p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            ページレベルキャッシュのデモ
          </h1>

          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded">
            <p className="text-sm text-blue-800">
              <strong>キャッシュ動作:</strong> このページは fetch の<code className="bg-blue-100 px-1 rounded">cache: &quot;force-cache&quot;</code>
              でキャッシュされています。ページをリロードしても、同じタイムスタンプが表示されます。
            </p>
          </div>

          <div className="space-y-4">
            <div>
              <h2 className="text-xl font-semibold text-gray-800 mb-2">
                Next.js リポジトリ情報
              </h2>
              <dl className="grid grid-cols-1 gap-4">
                <div className="border-b pb-2">
                  <dt className="text-sm font-medium text-gray-500">リポジトリ名</dt>
                  <dd className="text-lg font-semibold text-gray-900">{repo.name}</dd>
                </div>

                <div className="border-b pb-2">
                  <dt className="text-sm font-medium text-gray-500">説明</dt>
                  <dd className="text-gray-900">{repo.description}</dd>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <dt className="text-sm font-medium text-gray-500">⭐ Stars</dt>
                    <dd className="text-lg font-semibold text-gray-900">
                      {repo.stargazers_count.toLocaleString()}
                    </dd>
                  </div>

                  <div>
                    <dt className="text-sm font-medium text-gray-500">🍴 Forks</dt>
                    <dd className="text-lg font-semibold text-gray-900">
                      {repo.forks_count.toLocaleString()}
                    </dd>
                  </div>

                  <div>
                    <dt className="text-sm font-medium text-gray-500">🐛 Issues</dt>
                    <dd className="text-lg font-semibold text-gray-900">
                      {repo.open_issues_count.toLocaleString()}
                    </dd>
                  </div>
                </div>

                <div className="border-b pb-2">
                  <dt className="text-sm font-medium text-gray-500">最終更新</dt>
                  <dd className="text-gray-900">
                    {new Date(repo.updated_at).toLocaleString("ja-JP")}
                  </dd>
                </div>
              </dl>
            </div>

            <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded">
              <p className="text-sm text-yellow-800">
                <strong>レンダリング時刻:</strong> {now}
              </p>
              <p className="text-xs text-yellow-700 mt-2">
                この時刻はキャッシュが有効な間は変わりません。
              </p>
            </div>

            <div className="mt-6 flex gap-4">
              <a
                href="/"
                className="inline-flex items-center px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors"
              >
                ← ホームに戻る
              </a>
              <a
                href="/cached-page"
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
              >
                🔄 ページをリロード
              </a>
            </div>
          </div>
        </div>

        <div className="mt-8 bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-3">
            キャッシュの仕組み
          </h3>
          <div className="space-y-2 text-sm text-gray-600">
            <p>
              <code className="bg-gray-100 px-2 py-1 rounded">cache: &quot;force-cache&quot;</code>
              を使用すると:
            </p>
            <ul className="list-disc list-inside space-y-1 ml-4">
              <li>fetch でのデータ取得がビルド時または初回アクセス時にキャッシュされる</li>
              <li>API呼び出しは1回のみ実行される</li>
              <li>後続のリクエストはキャッシュから提供される</li>
              <li>revalidate オプションで再検証タイミングを制御可能</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
