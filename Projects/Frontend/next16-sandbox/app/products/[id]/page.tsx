/**
 * Async Params デモ: 商品詳細ページ
 *
 * 数値IDを使った動的ルートの例
 * TypeScriptの型安全性も確認
 */

interface PageProps {
  params: Promise<{
    id: string;
  }>;
}

interface Product {
  id: number;
  name: string;
  price: number;
  description: string;
  category: string;
  inStock: boolean;
  rating: number;
  reviews: number;
  imageUrl: string;
}

// ダミー商品データ
const products: Record<number, Product> = {
  1: {
    id: 1,
    name: "Next.js 16 完全ガイド",
    price: 3980,
    description:
      "Next.js 16の全機能を網羅した完全ガイドです。Turbopack、use cache、Async Paramsなど、最新機能を実践的に学べます。",
    category: "書籍",
    inStock: true,
    rating: 4.8,
    reviews: 124,
    imageUrl: "/placeholder-book.jpg",
  },
  2: {
    id: 2,
    name: "React 19 マスターコース",
    price: 4500,
    description:
      "React 19のCompilerや新しいHooksを完全マスター。パフォーマンス最適化からServer Componentsまで徹底解説。",
    category: "オンラインコース",
    inStock: true,
    rating: 4.9,
    reviews: 89,
    imageUrl: "/placeholder-course.jpg",
  },
  3: {
    id: 3,
    name: "TypeScript 実践プロジェクト",
    price: 5200,
    description:
      "実務で使えるTypeScriptのテクニックを、実際のプロジェクトを通して学習。型安全性とDX向上を両立する方法を習得。",
    category: "書籍",
    inStock: false,
    rating: 4.7,
    reviews: 201,
    imageUrl: "/placeholder-ts.jpg",
  },
};

async function fetchProduct(id: number): Promise<Product | null> {
  // APIシミュレーション
  await new Promise((resolve) => setTimeout(resolve, 50));
  return products[id] || null;
}

/**
 * 商品詳細ページ
 *
 * params.idを数値に変換し、型安全に扱う例
 */
export default async function ProductPage({ params }: PageProps) {
  // ✅ Next.js 16: paramsを await で解決
  const { id: idStr } = await params;

  // 文字列IDを数値に変換
  const id = parseInt(idStr, 10);

  // バリデーション: IDが数値でない場合
  if (isNaN(id)) {
    return (
      <div className="min-h-screen bg-gray-50 py-12 px-4">
        <div className="max-w-3xl mx-auto">
          <div className="bg-white rounded-lg shadow-md p-8">
            <h1 className="text-3xl font-bold text-red-600 mb-4">
              ⚠️ 無効なIDです
            </h1>
            <p className="text-gray-600 mb-4">
              IDは数値である必要があります:{" "}
              <code className="bg-gray-100 px-2 py-1 rounded">{idStr}</code>
            </p>
            <a
              href="/products/1"
              className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              商品1を見る
            </a>
          </div>
        </div>
      </div>
    );
  }

  // 商品データを取得
  const product = await fetchProduct(id);

  // 404処理
  if (!product) {
    return (
      <div className="min-h-screen bg-gray-50 py-12 px-4">
        <div className="max-w-3xl mx-auto">
          <div className="bg-white rounded-lg shadow-md p-8 text-center">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              商品が見つかりません
            </h1>
            <p className="text-gray-600 mb-6">
              商品ID: <code className="bg-gray-100 px-2 py-1 rounded">{id}</code>
            </p>
            <div className="flex gap-4 justify-center">
              <a
                href="/products/1"
                className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                商品1
              </a>
              <a
                href="/products/2"
                className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                商品2
              </a>
              <a
                href="/products/3"
                className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                商品3
              </a>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-5xl mx-auto">
        {/* Async Params情報 */}
        <div className="mb-6 p-6 bg-green-50 border border-green-200 rounded-lg">
          <h2 className="text-lg font-semibold text-green-900 mb-3">
            ✨ Async Params (Next.js 16)
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-green-800">
            <div>
              <div className="font-semibold mb-1">受け取った値</div>
              <code className="bg-green-100 px-2 py-1 rounded block">
                params.id = &quot;{idStr}&quot; (string)
              </code>
            </div>
            <div>
              <div className="font-semibold mb-1">変換後</div>
              <code className="bg-green-100 px-2 py-1 rounded block">
                id = {id} (number)
              </code>
            </div>
            <div>
              <div className="font-semibold mb-1">型安全性</div>
              <code className="bg-green-100 px-2 py-1 rounded block">
                TypeScript ✓
              </code>
            </div>
          </div>
        </div>

        {/* 商品詳細 */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 p-8">
            {/* 商品画像エリア */}
            <div className="aspect-square bg-gradient-to-br from-blue-100 to-purple-100 rounded-lg flex items-center justify-center">
              <div className="text-center">
                <div className="text-6xl mb-4">📦</div>
                <div className="text-sm text-gray-600">商品画像プレースホルダー</div>
              </div>
            </div>

            {/* 商品情報 */}
            <div className="flex flex-col">
              <div className="mb-2">
                <span className="inline-block px-3 py-1 text-sm font-medium text-blue-800 bg-blue-100 rounded-full">
                  {product.category}
                </span>
              </div>

              <h1 className="text-3xl font-bold text-gray-900 mb-4">
                {product.name}
              </h1>

              <div className="flex items-center gap-4 mb-6">
                <div className="flex items-center">
                  <span className="text-yellow-500 text-xl">⭐</span>
                  <span className="ml-1 text-lg font-semibold text-gray-900">
                    {product.rating}
                  </span>
                </div>
                <span className="text-gray-500">
                  ({product.reviews} レビュー)
                </span>
              </div>

              <div className="mb-6">
                <div className="text-4xl font-bold text-blue-600 mb-2">
                  ¥{product.price.toLocaleString()}
                </div>
                <div className="text-sm text-gray-600">税込</div>
              </div>

              <div className="mb-6">
                {product.inStock ? (
                  <span className="inline-flex items-center gap-2 px-4 py-2 bg-green-100 text-green-800 rounded-lg">
                    <span className="w-2 h-2 bg-green-600 rounded-full"></span>
                    在庫あり
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-2 px-4 py-2 bg-red-100 text-red-800 rounded-lg">
                    <span className="w-2 h-2 bg-red-600 rounded-full"></span>
                    在庫切れ
                  </span>
                )}
              </div>

              <p className="text-gray-700 mb-8 leading-relaxed">
                {product.description}
              </p>

              <div className="mt-auto">
                <button
                  disabled={!product.inStock}
                  className={`w-full py-4 rounded-lg font-semibold text-white transition-colors ${
                    product.inStock
                      ? "bg-blue-600 hover:bg-blue-700"
                      : "bg-gray-400 cursor-not-allowed"
                  }`}
                >
                  {product.inStock ? "カートに追加" : "在庫切れ"}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* テスト用リンク */}
        <div className="mt-8 bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            🔗 他の商品を見る
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {Object.values(products)
              .filter((p) => p.id !== id)
              .map((p) => (
                <a
                  key={p.id}
                  href={`/products/${p.id}`}
                  className="block p-4 border rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors"
                >
                  <div className="font-semibold text-gray-900 mb-2">
                    {p.name}
                  </div>
                  <div className="text-lg font-bold text-blue-600 mb-1">
                    ¥{p.price.toLocaleString()}
                  </div>
                  <div className="text-sm text-gray-600">
                    ⭐ {p.rating} ({p.reviews})
                  </div>
                </a>
              ))}
          </div>
        </div>

        {/* エッジケースのテスト */}
        <div className="mt-8 bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            🧪 エッジケースのテスト
          </h3>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <a
              href="/products/999"
              className="px-4 py-2 text-sm text-center bg-red-100 text-red-800 rounded hover:bg-red-200"
            >
              存在しないID (999)
            </a>
            <a
              href="/products/abc"
              className="px-4 py-2 text-sm text-center bg-orange-100 text-orange-800 rounded hover:bg-orange-200"
            >
              無効なID (abc)
            </a>
            <a
              href="/products/-1"
              className="px-4 py-2 text-sm text-center bg-yellow-100 text-yellow-800 rounded hover:bg-yellow-200"
            >
              負の数 (-1)
            </a>
            <a
              href="/products/1.5"
              className="px-4 py-2 text-sm text-center bg-purple-100 text-purple-800 rounded hover:bg-purple-200"
            >
              小数 (1.5)
            </a>
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
            href="/blog/nextjs-16-features"
            className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            ブログを見る →
          </a>
        </div>
      </div>
    </div>
  );
}

/**
 * 静的パスの生成
 */
export async function generateStaticParams() {
  return Object.keys(products).map((id) => ({
    id,
  }));
}
