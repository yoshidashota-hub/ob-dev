/**
 * Streaming & Suspense デモページ
 *
 * Next.js 16 の Streaming SSR と Suspense を活用した
 * 段階的レンダリングの実装例
 */

import { Suspense } from "react";
import {
  SlowComponent,
  UserStatsComponent,
  RecentPostsComponent,
  ParallelFetchDemo,
} from "./components/SlowComponent";
import { CardSkeleton, StatsSkeleton, ListSkeleton } from "./components/Skeleton";

export default function StreamingPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* ヘッダー（即座に表示） */}
        <div className="bg-white rounded-lg shadow-md p-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Streaming & Suspense デモ
          </h1>
          <p className="text-lg text-gray-600 mb-6">
            ページの一部が読み込み中でも、準備できた部分から順次表示されます
          </p>

          <div className="p-4 bg-blue-50 border border-blue-200 rounded">
            <h2 className="text-lg font-semibold text-blue-900 mb-3">
              🌊 Streaming SSR の仕組み
            </h2>
            <div className="space-y-2 text-sm text-blue-800">
              <div className="flex items-start gap-2">
                <span>1️⃣</span>
                <p>
                  <strong>即座に表示:</strong> このヘッダーはすぐに表示されます
                </p>
              </div>
              <div className="flex items-start gap-2">
                <span>2️⃣</span>
                <p>
                  <strong>段階的読み込み:</strong> 下の各セクションは準備できた順に表示
                </p>
              </div>
              <div className="flex items-start gap-2">
                <span>3️⃣</span>
                <p>
                  <strong>スケルトン表示:</strong> 読み込み中はスケルトンを表示
                </p>
              </div>
              <div className="flex items-start gap-2">
                <span>4️⃣</span>
                <p>
                  <strong>ユーザー体験:</strong> 全体の読み込みを待たずに閲覧開始
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* アクションボタン */}
        <div className="flex gap-4">
          <a
            href="/streaming"
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold transition-colors"
          >
            🔄 ページをリロード
          </a>
          <a
            href="/"
            className="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 font-semibold transition-colors"
          >
            ← ホームに戻る
          </a>
        </div>

        {/* セクション1: 統計情報（1.5秒） */}
        <section className="space-y-4">
          <h2 className="text-2xl font-bold text-gray-900">
            📊 統計情報（1.5秒で読み込み）
          </h2>
          <Suspense
            fallback={
              <div className="grid grid-cols-3 gap-4">
                <StatsSkeleton />
                <StatsSkeleton />
                <StatsSkeleton />
              </div>
            }
          >
            <UserStatsComponent />
          </Suspense>
        </section>

        {/* セクション2: 遅延コンポーネント（2秒） */}
        <section className="space-y-4">
          <h2 className="text-2xl font-bold text-gray-900">
            ⏱️ 遅延コンポーネント（2秒で読み込み）
          </h2>
          <Suspense fallback={<CardSkeleton />}>
            <SlowComponent delay={2000} />
          </Suspense>
        </section>

        {/* セクション3: 最近の投稿（2.5秒） */}
        <section className="space-y-4">
          <h2 className="text-2xl font-bold text-gray-900">
            📝 最近の投稿（2.5秒で読み込み）
          </h2>
          <Suspense fallback={<ListSkeleton count={3} />}>
            <RecentPostsComponent />
          </Suspense>
        </section>

        {/* セクション4: 並列フェッチング */}
        <section className="space-y-4">
          <h2 className="text-2xl font-bold text-gray-900">
            🚀 並列データフェッチング
          </h2>
          <p className="text-gray-600">
            複数のデータを並列で取得し、全て準備できたら一度に表示
          </p>
          <Suspense
            fallback={
              <div className="grid grid-cols-2 gap-4">
                <CardSkeleton />
                <CardSkeleton />
              </div>
            }
          >
            <ParallelFetchDemo />
          </Suspense>
        </section>

        {/* セクション5: ネストしたSuspense */}
        <section className="space-y-4">
          <h2 className="text-2xl font-bold text-gray-900">
            🎯 ネストしたSuspense
          </h2>
          <p className="text-gray-600">
            複数のSuspenseを組み合わせて、より細かい制御が可能
          </p>
          <div className="grid grid-cols-2 gap-4">
            <Suspense fallback={<CardSkeleton />}>
              <SlowComponent delay={1000} />
            </Suspense>
            <Suspense fallback={<CardSkeleton />}>
              <SlowComponent delay={1500} />
            </Suspense>
          </div>
        </section>

        {/* 技術説明 */}
        <div className="bg-white rounded-lg shadow-md p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            Streaming の利点
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="border-l-4 border-blue-500 pl-4">
              <h3 className="font-semibold text-gray-900 mb-2">
                Time to First Byte (TTFB) 改善
              </h3>
              <p className="text-sm text-gray-600">
                全データの読み込みを待たずに、HTMLの配信を開始できます
              </p>
            </div>

            <div className="border-l-4 border-green-500 pl-4">
              <h3 className="font-semibold text-gray-900 mb-2">
                First Contentful Paint (FCP) 改善
              </h3>
              <p className="text-sm text-gray-600">
                重要なコンテンツを優先的に表示し、UXを向上
              </p>
            </div>

            <div className="border-l-4 border-purple-500 pl-4">
              <h3 className="font-semibold text-gray-900 mb-2">
                段階的なハイドレーション
              </h3>
              <p className="text-sm text-gray-600">
                準備できた部分から順次インタラクティブに
              </p>
            </div>

            <div className="border-l-4 border-orange-500 pl-4">
              <h3 className="font-semibold text-gray-900 mb-2">
                SEO への影響最小化
              </h3>
              <p className="text-sm text-gray-600">
                クローラーは完全なHTMLを取得可能
              </p>
            </div>
          </div>
        </div>

        {/* パフォーマンス比較 */}
        <div className="bg-white rounded-lg shadow-md p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            ⚡ パフォーマンス比較
          </h2>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    レンダリング方式
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    初期表示
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    完全表示
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    ユーザー体験
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                <tr>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    従来のSSR
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    2.5秒後
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    2.5秒後
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    😐 待ち時間長い
                  </td>
                </tr>
                <tr className="bg-green-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    Streaming SSR
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600 font-semibold">
                    即座
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    2.5秒後
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600">
                    😊 すぐ閲覧開始
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* 次のステップ */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-blue-900 mb-3">
            🚀 次のステップ
          </h3>
          <ul className="space-y-2 text-sm text-blue-800">
            <li className="flex items-start gap-2">
              <span>→</span>
              <span>エラーハンドリング（error.tsx）の実装</span>
            </li>
            <li className="flex items-start gap-2">
              <span>→</span>
              <span>Loading UI（loading.tsx）のカスタマイズ</span>
            </li>
            <li className="flex items-start gap-2">
              <span>→</span>
              <span>Route Groups と Parallel Routes の活用</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
