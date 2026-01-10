"use client";

/**
 * OptimisticList コンポーネント
 *
 * useOptimistic を使用して、削除アクション中に楽観的UI更新を表示
 * Server Actionの完了を待たずにUIを更新
 */

import { useOptimistic } from "react";
import { deletePost } from "../actions/deletePost";
import type { Post } from "../actions/posts";

interface OptimisticListProps {
  posts: Post[];
}

export function OptimisticList({ posts }: OptimisticListProps) {
  // useOptimistic: 楽観的UI更新
  const [optimisticPosts, setOptimisticPosts] = useOptimistic(
    posts,
    (currentPosts, deletedId: string) => {
      // 削除されたIDの投稿を除外
      return currentPosts.filter((post) => post.id !== deletedId);
    }
  );

  // 削除ハンドラ
  async function handleDelete(id: string) {
    // 楽観的に削除（即座にUIから消す）
    setOptimisticPosts(id);

    // 実際のServer Action実行
    const result = await deletePost(id);

    if (!result.success) {
      // エラー時の処理（本来はトーストなどで通知）
      console.error(result.message);
    }
  }

  return (
    <div className="space-y-4">
      {optimisticPosts.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500">投稿がありません</p>
          <a
            href="/forms/create"
            className="mt-4 inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            最初の投稿を作成
          </a>
        </div>
      ) : (
        optimisticPosts.map((post) => (
          <div
            key={post.id}
            className="bg-white border rounded-lg p-6 hover:shadow-md transition-shadow"
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1">
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  {post.title}
                </h3>
                <p className="text-gray-600 mb-3 line-clamp-2">
                  {post.content}
                </p>
              </div>

              <div className="ml-4">
                {post.published ? (
                  <span className="inline-block px-3 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">
                    公開中
                  </span>
                ) : (
                  <span className="inline-block px-3 py-1 text-xs font-medium bg-gray-100 text-gray-600 rounded-full">
                    下書き
                  </span>
                )}
              </div>
            </div>

            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-4 text-gray-500">
                <span>👤 {post.author}</span>
                <span>📅 {post.createdAt.toLocaleDateString("ja-JP")}</span>
              </div>

              <div className="flex items-center gap-2">
                <a
                  href={`/forms/edit/${post.id}`}
                  className="px-4 py-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                >
                  編集
                </a>

                <button
                  type="button"
                  onClick={() => handleDelete(post.id)}
                  className="px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                >
                  削除
                </button>
              </div>
            </div>
          </div>
        ))
      )}
    </div>
  );
}
