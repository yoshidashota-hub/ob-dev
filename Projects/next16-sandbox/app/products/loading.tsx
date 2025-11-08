/**
 * 商品一覧ページのローディング UI
 *
 * Next.js が自動的に使用する loading.tsx
 * /products ルートの読み込み中に表示される
 */

import { GridSkeleton, HeaderSkeleton } from "@/app/components/skeletons";

export default function Loading() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 py-12 px-4">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* ヘッダースケルトン */}
        <HeaderSkeleton />

        {/* 商品グリッドスケルトン */}
        <GridSkeleton count={6} />
      </div>
    </div>
  );
}
