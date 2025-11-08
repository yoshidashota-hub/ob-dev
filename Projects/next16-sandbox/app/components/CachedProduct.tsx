/**
 * コンポーネントレベルのキャッシュ実装
 *
 * Next.js 16.0.1 では "use cache" がサポートされていないため、
 * fetch の cache オプションを使用してキャッシュを実装
 */

interface Product {
  id: number;
  title: string;
  price: number;
  description: string;
  category: string;
  rating: {
    rate: number;
    count: number;
  };
}

async function fetchProduct(id: number, useCache: boolean = true): Promise<Product> {
  const response = await fetch(`https://fakestoreapi.com/products/${id}`, {
    cache: useCache ? "force-cache" : "no-store",
    next: useCache ? { revalidate: 3600 } : undefined,
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch product ${id}`);
  }

  return response.json();
}

interface CachedProductProps {
  productId: number;
}

/**
 * キャッシュされる商品コンポーネント
 *
 * fetch の cache: "force-cache" によってキャッシュされるため、
 * 同じproductIdに対するAPI呼び出しは1回のみ実行される
 */
export async function CachedProduct({ productId }: CachedProductProps) {
  const product = await fetchProduct(productId, true);
  const fetchTime = new Date().toISOString();

  return (
    <div className="border rounded-lg p-6 bg-white shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            {product.title}
          </h3>
          <span className="inline-block px-3 py-1 text-xs font-medium text-blue-800 bg-blue-100 rounded-full">
            {product.category}
          </span>
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold text-green-600">
            ${product.price.toFixed(2)}
          </p>
        </div>
      </div>

      <p className="text-gray-600 mb-4 line-clamp-3">{product.description}</p>

      <div className="flex items-center justify-between border-t pt-4">
        <div className="flex items-center gap-2">
          <span className="text-yellow-500">⭐</span>
          <span className="font-semibold">{product.rating.rate}</span>
          <span className="text-sm text-gray-500">
            ({product.rating.count} reviews)
          </span>
        </div>

        <div className="text-xs text-gray-400">
          Cached at: {new Date(fetchTime).toLocaleTimeString("ja-JP")}
        </div>
      </div>

      <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded">
        <p className="text-xs text-green-800">
          <strong>✓ キャッシュ済み:</strong> このコンポーネントは<code className="bg-green-100 px-1 rounded">cache: &quot;force-cache&quot;</code>
          でキャッシュされています
        </p>
      </div>
    </div>
  );
}

/**
 * キャッシュされない商品コンポーネント（比較用）
 */
export async function UncachedProduct({ productId }: CachedProductProps) {
  const product = await fetchProduct(productId, false);
  const fetchTime = new Date().toISOString();

  return (
    <div className="border rounded-lg p-6 bg-white shadow-sm hover:shadow-md transition-shadow border-red-200">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            {product.title}
          </h3>
          <span className="inline-block px-3 py-1 text-xs font-medium text-red-800 bg-red-100 rounded-full">
            {product.category}
          </span>
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold text-green-600">
            ${product.price.toFixed(2)}
          </p>
        </div>
      </div>

      <p className="text-gray-600 mb-4 line-clamp-3">{product.description}</p>

      <div className="flex items-center justify-between border-t pt-4">
        <div className="flex items-center gap-2">
          <span className="text-yellow-500">⭐</span>
          <span className="font-semibold">{product.rating.rate}</span>
          <span className="text-sm text-gray-500">
            ({product.rating.count} reviews)
          </span>
        </div>

        <div className="text-xs text-gray-400">
          Fetched at: {new Date(fetchTime).toLocaleTimeString("ja-JP")}
        </div>
      </div>

      <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded">
        <p className="text-xs text-red-800">
          <strong>⚠ キャッシュなし:</strong> このコンポーネントは毎回APIを呼び出します
        </p>
      </div>
    </div>
  );
}
