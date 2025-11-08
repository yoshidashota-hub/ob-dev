/**
 * 共通スケルトンローディングコンポーネント
 *
 * 様々なページで再利用可能なスケルトンコンポーネント集
 */

/**
 * 基本的なスケルトン（テキスト行）
 */
export function Skeleton() {
  return (
    <div className="animate-pulse">
      <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
      <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
      <div className="h-4 bg-gray-200 rounded w-5/6"></div>
    </div>
  );
}

/**
 * カードスケルトン
 */
export function CardSkeleton() {
  return (
    <div className="border rounded-lg p-6 bg-white animate-pulse">
      <div className="h-6 bg-gray-200 rounded w-1/2 mb-4"></div>
      <div className="space-y-3">
        <div className="h-4 bg-gray-200 rounded"></div>
        <div className="h-4 bg-gray-200 rounded w-5/6"></div>
        <div className="h-4 bg-gray-200 rounded w-4/6"></div>
      </div>
      <div className="mt-4 h-10 bg-gray-200 rounded w-1/3"></div>
    </div>
  );
}

/**
 * 統計カードスケルトン
 */
export function StatsSkeleton() {
  return (
    <div className="bg-white rounded-lg p-6 text-center animate-pulse">
      <div className="h-12 bg-gray-200 rounded w-24 mx-auto mb-2"></div>
      <div className="h-4 bg-gray-200 rounded w-32 mx-auto"></div>
    </div>
  );
}

/**
 * リストスケルトン
 */
export function ListSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-4">
      {Array.from({ length: count }).map((_, i) => (
        <CardSkeleton key={i} />
      ))}
    </div>
  );
}

/**
 * 商品カードスケルトン
 */
export function ProductCardSkeleton() {
  return (
    <div className="border rounded-lg p-6 bg-white shadow-md animate-pulse">
      {/* 商品画像 */}
      <div className="h-48 bg-gray-200 rounded mb-4"></div>

      {/* 商品名 */}
      <div className="h-6 bg-gray-200 rounded w-3/4 mb-3"></div>

      {/* 価格 */}
      <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>

      {/* 説明 */}
      <div className="space-y-2">
        <div className="h-4 bg-gray-200 rounded"></div>
        <div className="h-4 bg-gray-200 rounded w-5/6"></div>
      </div>

      {/* ボタン */}
      <div className="mt-6 h-10 bg-gray-200 rounded"></div>
    </div>
  );
}

/**
 * グリッドスケルトン（商品一覧など）
 */
export function GridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {Array.from({ length: count }).map((_, i) => (
        <ProductCardSkeleton key={i} />
      ))}
    </div>
  );
}

/**
 * テーブル行スケルトン
 */
export function TableRowSkeleton() {
  return (
    <div className="flex gap-4 py-4 border-b border-gray-200 animate-pulse">
      <div className="h-4 bg-gray-200 rounded w-1/4"></div>
      <div className="h-4 bg-gray-200 rounded w-1/4"></div>
      <div className="h-4 bg-gray-200 rounded w-1/4"></div>
      <div className="h-4 bg-gray-200 rounded w-1/4"></div>
    </div>
  );
}

/**
 * テーブルスケルトン
 */
export function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      {/* ヘッダー */}
      <div className="flex gap-4 pb-4 border-b-2 border-gray-300 mb-4 animate-pulse">
        <div className="h-5 bg-gray-300 rounded w-1/4"></div>
        <div className="h-5 bg-gray-300 rounded w-1/4"></div>
        <div className="h-5 bg-gray-300 rounded w-1/4"></div>
        <div className="h-5 bg-gray-300 rounded w-1/4"></div>
      </div>

      {/* 行 */}
      {Array.from({ length: rows }).map((_, i) => (
        <TableRowSkeleton key={i} />
      ))}
    </div>
  );
}

/**
 * ヘッダースケルトン
 */
export function HeaderSkeleton() {
  return (
    <div className="bg-white rounded-lg shadow-md p-8 animate-pulse">
      <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
      <div className="h-4 bg-gray-200 rounded w-2/3"></div>
    </div>
  );
}

/**
 * ダッシュボードスケルトン
 */
export function DashboardSkeleton() {
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* ヘッダー */}
        <HeaderSkeleton />

        {/* 統計カード */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <StatsSkeleton key={i} />
          ))}
        </div>

        {/* コンテンツ */}
        <ListSkeleton count={3} />
      </div>
    </div>
  );
}

/**
 * ページ全体スケルトン（汎用）
 */
export function PageSkeleton() {
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-6xl mx-auto space-y-6">
        <HeaderSkeleton />
        <div className="bg-white rounded-lg shadow-md p-8">
          <ListSkeleton count={4} />
        </div>
      </div>
    </div>
  );
}
