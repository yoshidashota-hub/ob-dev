/**
 * Middleware デモページ
 *
 * A/Bテスト、カスタムヘッダー、その他の Middleware 機能を実演
 */

import { cookies, headers } from "next/headers";

export default async function MiddlewareDemoPage() {
  // Cookie と Headers を取得（Server Component）
  const cookieStore = await cookies();
  const headersList = await headers();

  const abTestVariant = cookieStore.get("ab-test-variant")?.value || "未設定";
  const authToken = cookieStore.get("auth-token")?.value;

  // Middleware によって追加されたヘッダーを取得
  const middlewareHeaders = {
    authenticated: headersList.get("x-authenticated") || "false",
    customHeader: headersList.get("x-custom-header") || "なし",
    requestPath: headersList.get("x-request-path") || "なし",
    frameOptions: headersList.get("x-frame-options") || "なし",
    contentTypeOptions: headersList.get("x-content-type-options") || "なし",
    referrerPolicy: headersList.get("referrer-policy") || "なし",
    abTestVariant: headersList.get("x-ab-test-variant") || "未設定",
  };

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
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Middleware デモ
          </h1>
          <p className="text-gray-600">
            A/B テスト、カスタムヘッダー、リダイレクトなど
          </p>
        </div>

        {/* A/B テストバリエーション表示 */}
        <div className="mb-8">
          {abTestVariant === "A" && (
            <div className="bg-blue-50 border-2 border-blue-500 rounded-lg p-8">
              <h2 className="text-3xl font-bold text-blue-900 mb-4">
                バリエーション A
              </h2>
              <p className="text-blue-800 mb-4">
                これは A/B テストのバリエーション A です。
                青いテーマで表示されています。
              </p>
              <button className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                バリエーション A のボタン
              </button>
            </div>
          )}

          {abTestVariant === "B" && (
            <div className="bg-green-50 border-2 border-green-500 rounded-lg p-8">
              <h2 className="text-3xl font-bold text-green-900 mb-4">
                バリエーション B
              </h2>
              <p className="text-green-800 mb-4">
                これは A/B テストのバリエーション B です。
                緑のテーマで表示されています。
              </p>
              <button className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
                バリエーション B のボタン
              </button>
            </div>
          )}

          {abTestVariant === "未設定" && (
            <div className="bg-gray-50 border-2 border-gray-300 rounded-lg p-8">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                A/B テストバリエーション未設定
              </h2>
              <p className="text-gray-700 mb-4">
                ページをリロードすると、ランダムにバリエーション A または B
                が割り当てられます。
              </p>
              <button
                onClick={() => window.location.reload()}
                className="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
              >
                リロード
              </button>
            </div>
          )}
        </div>

        {/* Middleware 情報 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* Cookie 情報 */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">
              🍪 Cookie 情報
            </h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between py-2 border-b">
                <span className="font-medium text-gray-700">
                  A/B テストバリエーション:
                </span>
                <span
                  className={`px-3 py-1 rounded font-mono ${
                    abTestVariant === "A"
                      ? "bg-blue-100 text-blue-800"
                      : abTestVariant === "B"
                        ? "bg-green-100 text-green-800"
                        : "bg-gray-100 text-gray-800"
                  }`}
                >
                  {abTestVariant}
                </span>
              </div>
              <div className="flex justify-between py-2 border-b">
                <span className="font-medium text-gray-700">認証トークン:</span>
                <span
                  className={`px-3 py-1 rounded font-mono ${
                    authToken
                      ? "bg-green-100 text-green-800"
                      : "bg-red-100 text-red-800"
                  }`}
                >
                  {authToken ? "あり" : "なし"}
                </span>
              </div>
            </div>
          </div>

          {/* Headers 情報 */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">
              📋 カスタムヘッダー
            </h3>
            <div className="space-y-1 text-xs font-mono bg-gray-50 p-4 rounded max-h-64 overflow-y-auto">
              <div>x-authenticated: {middlewareHeaders.authenticated}</div>
              <div>x-custom-header: {middlewareHeaders.customHeader}</div>
              <div>x-request-path: {middlewareHeaders.requestPath}</div>
              <div>x-ab-test-variant: {middlewareHeaders.abTestVariant}</div>
              <div>x-frame-options: {middlewareHeaders.frameOptions}</div>
              <div>
                x-content-type-options: {middlewareHeaders.contentTypeOptions}
              </div>
              <div>referrer-policy: {middlewareHeaders.referrerPolicy}</div>
            </div>
          </div>
        </div>

        {/* Middleware の仕組み */}
        <div className="bg-white rounded-lg shadow-md p-8 mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-6">
            ⚙️ Middleware の仕組み
          </h2>

          <div className="space-y-6">
            {/* A/B テスト */}
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-3">
                1. A/B テスト
              </h3>
              <div className="bg-blue-50 p-4 rounded-lg">
                <p className="text-sm text-blue-900 mb-2">
                  <strong>仕組み:</strong>
                </p>
                <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
                  <li>
                    初回アクセス時、Middleware がランダムにバリエーション（A or
                    B）を選択
                  </li>
                  <li>
                    選択されたバリエーションを Cookie に保存（7日間有効）
                  </li>
                  <li>
                    カスタムヘッダー（x-ab-test-variant）にもバリエーション情報を追加
                  </li>
                  <li>
                    Server Component
                    で Cookie を読み取り、適切なUIを表示
                  </li>
                </ul>
              </div>
            </div>

            {/* 認証チェック */}
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-3">
                2. 認証チェック
              </h3>
              <div className="bg-green-50 p-4 rounded-lg">
                <p className="text-sm text-green-900 mb-2">
                  <strong>保護されたルート:</strong> /admin
                </p>
                <p className="text-sm text-green-800 mb-2">
                  認証トークンがない場合、自動的にログインページ（/login）にリダイレクトされます。
                </p>
                <a
                  href="/admin"
                  className="inline-block px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 text-sm"
                >
                  管理画面へ →
                </a>
              </div>
            </div>

            {/* セキュリティヘッダー */}
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-3">
                3. セキュリティヘッダー
              </h3>
              <div className="bg-purple-50 p-4 rounded-lg">
                <p className="text-sm text-purple-900 mb-2">
                  <strong>自動追加されるヘッダー:</strong>
                </p>
                <ul className="text-sm text-purple-800 space-y-1 list-disc list-inside">
                  <li>
                    <code>x-frame-options: DENY</code> - クリックジャッキング対策
                  </li>
                  <li>
                    <code>x-content-type-options: nosniff</code> - MIME
                    スニッフィング防止
                  </li>
                  <li>
                    <code>referrer-policy: origin-when-cross-origin</code> -
                    リファラー制御
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* 実装コード */}
        <div className="bg-white rounded-lg shadow-md p-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">
            📝 実装コード
          </h2>
          <pre className="bg-gray-900 text-gray-100 p-6 rounded-lg overflow-x-auto text-sm">
{`// middleware.ts
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // A/B テスト
  if (pathname.startsWith("/middleware-demo")) {
    const abTestVariant = request.cookies.get("ab-test-variant")?.value;
    const response = NextResponse.next();

    if (!abTestVariant) {
      const variant = Math.random() < 0.5 ? "A" : "B";
      response.cookies.set("ab-test-variant", variant, {
        maxAge: 60 * 60 * 24 * 7, // 7日間
      });
      response.headers.set("x-ab-test-variant", variant);
    } else {
      response.headers.set("x-ab-test-variant", abTestVariant);
    }

    return response;
  }

  // セキュリティヘッダー追加
  const response = NextResponse.next();
  response.headers.set("x-frame-options", "DENY");
  response.headers.set("x-content-type-options", "nosniff");
  return response;
}`}
          </pre>
        </div>
      </div>
    </div>
  );
}
