/**
 * 投稿一覧ページ
 *
 * OptimisticList を使用して楽観的UI更新を実装
 */

import { getAllPosts } from "../actions/posts";
import { OptimisticList } from "../components/OptimisticList";

export default function FormsPage() {
  const posts = getAllPosts();

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* ヘッダー */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            投稿管理
          </h1>
          <p className="text-gray-600">
            Server Actionsを使った投稿の作成・編集・削除のデモ
          </p>
        </div>

        {/* Server Actions情報 */}
        <div className="mb-8 p-6 bg-purple-50 border border-purple-200 rounded-lg">
          <h2 className="text-lg font-semibold text-purple-900 mb-3">
            ✨ Server Actions & Optimistic UI
          </h2>
          <div className="space-y-2 text-sm text-purple-800">
            <div className="flex items-start gap-2">
              <span>🎯</span>
              <p>
                <strong>useFormState:</strong> フォームとServer Actionを統合
              </p>
            </div>
            <div className="flex items-start gap-2">
              <span>⚡</span>
              <p>
                <strong>useFormStatus:</strong> 送信中の状態を検知
              </p>
            </div>
            <div className="flex items-start gap-2">
              <span>✨</span>
              <p>
                <strong>useOptimistic:</strong> 削除ボタン押下で即座にUIを更新（楽観的UI）
              </p>
            </div>
            <div className="flex items-start gap-2">
              <span>🔄</span>
              <p>
                <strong>revalidatePath:</strong> キャッシュを自動無効化
              </p>
            </div>
          </div>
        </div>

        {/* アクションボタン */}
        <div className="mb-8 flex gap-4">
          <a
            href="/forms/create"
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold transition-colors"
          >
            新規投稿を作成
          </a>

          <a
            href="/"
            className="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 font-semibold transition-colors"
          >
            ← ホームに戻る
          </a>
        </div>

        {/* 統計 */}
        <div className="mb-8 grid grid-cols-3 gap-4">
          <div className="bg-white rounded-lg p-6 text-center">
            <div className="text-3xl font-bold text-blue-600">
              {posts.length}
            </div>
            <div className="text-sm text-gray-600 mt-1">総投稿数</div>
          </div>

          <div className="bg-white rounded-lg p-6 text-center">
            <div className="text-3xl font-bold text-green-600">
              {posts.filter((p) => p.published).length}
            </div>
            <div className="text-sm text-gray-600 mt-1">公開中</div>
          </div>

          <div className="bg-white rounded-lg p-6 text-center">
            <div className="text-3xl font-bold text-gray-600">
              {posts.filter((p) => !p.published).length}
            </div>
            <div className="text-sm text-gray-600 mt-1">下書き</div>
          </div>
        </div>

        {/* 投稿一覧（Optimistic UI） */}
        <OptimisticList posts={posts} />

        {/* 技術説明 */}
        <div className="mt-12 bg-white rounded-lg shadow-md p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            Server Actionsの主な機能
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="border-l-4 border-blue-500 pl-4">
              <h3 className="font-semibold text-gray-900 mb-2">
                Progressive Enhancement
              </h3>
              <p className="text-sm text-gray-600">
                JavaScriptが無効でもフォームが動作。
                段階的な機能強化を実現。
              </p>
            </div>

            <div className="border-l-4 border-green-500 pl-4">
              <h3 className="font-semibold text-gray-900 mb-2">
                Optimistic UI
              </h3>
              <p className="text-sm text-gray-600">
                サーバーの応答を待たずにUIを更新。
                快適なユーザー体験を提供。
              </p>
            </div>

            <div className="border-l-4 border-purple-500 pl-4">
              <h3 className="font-semibold text-gray-900 mb-2">
                自動キャッシュ管理
              </h3>
              <p className="text-sm text-gray-600">
                revalidatePath/Tagで自動的にキャッシュを無効化。
                常に最新データを表示。
              </p>
            </div>

            <div className="border-l-4 border-orange-500 pl-4">
              <h3 className="font-semibold text-gray-900 mb-2">
                型安全性
              </h3>
              <p className="text-sm text-gray-600">
                TypeScriptで完全に型付け。
                エラーを事前に検出。
              </p>
            </div>
          </div>
        </div>

        {/* 次のステップ */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-blue-900 mb-3">
            🚀 次のステップ
          </h3>
          <ul className="space-y-2 text-sm text-blue-800">
            <li className="flex items-start gap-2">
              <span>→</span>
              <span>
                Zodライブラリを使った高度なバリデーション
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span>→</span>
              <span>
                Prisma/Drizzleを使った実際のデータベース連携
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span>→</span>
              <span>
                認証機能の追加（NextAuth.js等）
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span>→</span>
              <span>
                ファイルアップロード機能
              </span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
