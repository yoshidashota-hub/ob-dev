/**
 * Route Handlers デモページ
 *
 * フロントエンドからAPI呼び出しの実装例
 * - fetch API の使用
 * - エラーハンドリング
 * - ローディング状態管理
 */

"use client";

import { useState } from "react";

type Post = {
  id: string;
  title: string;
  content: string;
  author: string;
  published: boolean;
  createdAt: string;
  updatedAt: string;
};

type ApiResponse<T> = {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  count?: number;
};

export default function ApiDemoPage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<string | null>(null);

  // GET /api/posts - すべての投稿を取得
  const fetchPosts = async () => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch("/api/posts");
      const data: ApiResponse<Post[]> = await response.json();

      if (data.success && data.data) {
        setPosts(data.data);
        setResult(`✅ ${data.count}件の投稿を取得しました`);
      } else {
        setError(data.error || "Failed to fetch posts");
      }
    } catch (err) {
      setError("Network error occurred");
    } finally {
      setLoading(false);
    }
  };

  // GET /api/posts?published=true - 公開済み投稿のみ取得
  const fetchPublishedPosts = async () => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch("/api/posts?published=true");
      const data: ApiResponse<Post[]> = await response.json();

      if (data.success && data.data) {
        setPosts(data.data);
        setResult(`✅ ${data.count}件の公開済み投稿を取得しました`);
      } else {
        setError(data.error || "Failed to fetch published posts");
      }
    } catch (err) {
      setError("Network error occurred");
    } finally {
      setLoading(false);
    }
  };

  // POST /api/posts - 新しい投稿を作成
  const createPost = async () => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch("/api/posts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: "APIテスト投稿",
          content: "Route Handlersを使って作成されました",
          author: "テストユーザー",
          published: true,
        }),
      });

      const data: ApiResponse<Post> = await response.json();

      if (data.success && data.data) {
        setResult(`✅ 投稿を作成しました: "${data.data.title}"`);
        // 再取得
        fetchPosts();
      } else {
        setError(data.error || "Failed to create post");
      }
    } catch (err) {
      setError("Network error occurred");
    } finally {
      setLoading(false);
    }
  };

  // PUT /api/posts/[id] - 投稿を更新
  const updatePost = async (id: string) => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch(`/api/posts/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: "更新されたタイトル",
        }),
      });

      const data: ApiResponse<Post> = await response.json();

      if (data.success && data.data) {
        setResult(`✅ 投稿を更新しました: "${data.data.title}"`);
        fetchPosts();
      } else {
        setError(data.error || "Failed to update post");
      }
    } catch (err) {
      setError("Network error occurred");
    } finally {
      setLoading(false);
    }
  };

  // DELETE /api/posts/[id] - 投稿を削除
  const deletePost = async (id: string) => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch(`/api/posts/${id}`, {
        method: "DELETE",
      });

      const data: ApiResponse<null> = await response.json();

      if (data.success) {
        setResult(`✅ 投稿を削除しました`);
        fetchPosts();
      } else {
        setError(data.error || "Failed to delete post");
      }
    } catch (err) {
      setError("Network error occurred");
    } finally {
      setLoading(false);
    }
  };

  // POST /api/auth - ログイン
  const login = async () => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch("/api/auth", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: "user@example.com",
          password: "password123",
        }),
      });

      const data: ApiResponse<{ user: any; token: string }> =
        await response.json();

      if (data.success && data.data) {
        setResult(`✅ ログイン成功: ${data.data.user.name}`);
      } else {
        setError(data.error || "Login failed");
      }
    } catch (err) {
      setError("Network error occurred");
    } finally {
      setLoading(false);
    }
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
            Route Handlers デモ
          </h1>
          <p className="text-gray-600">フロントエンドからAPIを呼び出す実装例</p>
        </div>

        {/* アクションボタン */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">API操作</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <button
              onClick={fetchPosts}
              disabled={loading}
              className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded disabled:opacity-50"
            >
              📋 すべての投稿を取得
            </button>
            <button
              onClick={fetchPublishedPosts}
              disabled={loading}
              className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded disabled:opacity-50"
            >
              ✅ 公開済み投稿のみ
            </button>
            <button
              onClick={createPost}
              disabled={loading}
              className="bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded disabled:opacity-50"
            >
              ➕ 新規投稿作成
            </button>
            <button
              onClick={login}
              disabled={loading}
              className="bg-indigo-500 hover:bg-indigo-600 text-white px-4 py-2 rounded disabled:opacity-50"
            >
              🔐 ログインテスト
            </button>
          </div>
        </div>

        {/* ローディング・エラー・成功メッセージ */}
        {loading && (
          <div className="bg-blue-100 border-l-4 border-blue-500 text-blue-700 p-4 mb-6">
            <p className="font-semibold">処理中...</p>
          </div>
        )}
        {error && (
          <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6">
            <p className="font-semibold">エラー</p>
            <p>{error}</p>
          </div>
        )}
        {result && (
          <div className="bg-green-100 border-l-4 border-green-500 text-green-700 p-4 mb-6">
            <p>{result}</p>
          </div>
        )}

        {/* 投稿一覧 */}
        {posts.length > 0 && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              投稿一覧 ({posts.length}件)
            </h2>
            <div className="space-y-4">
              {posts.map((post) => (
                <div
                  key={post.id}
                  className="border border-gray-200 rounded-lg p-4"
                >
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">
                        {post.title}
                      </h3>
                      <p className="text-sm text-gray-600">
                        by {post.author} •{" "}
                        {post.published ? "✅ 公開" : "⏸️ 非公開"}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => updatePost(post.id)}
                        disabled={loading}
                        className="text-sm bg-yellow-500 hover:bg-yellow-600 text-white px-3 py-1 rounded disabled:opacity-50"
                      >
                        編集
                      </button>
                      <button
                        onClick={() => deletePost(post.id)}
                        disabled={loading}
                        className="text-sm bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded disabled:opacity-50"
                      >
                        削除
                      </button>
                    </div>
                  </div>
                  <p className="text-gray-700">{post.content}</p>
                  <p className="text-xs text-gray-500 mt-2">
                    ID: {post.id} • 作成:{" "}
                    {new Date(post.createdAt).toLocaleString("ja-JP")}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* API エンドポイント情報 */}
        <div className="bg-white rounded-lg shadow-md p-6 mt-6">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">
            📖 実装済みエンドポイント
          </h2>
          <div className="space-y-2 text-sm font-mono">
            <div className="flex gap-2">
              <span className="bg-green-100 text-green-800 px-2 py-1 rounded">
                GET
              </span>
              <span>/api/posts</span>
            </div>
            <div className="flex gap-2">
              <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded">
                POST
              </span>
              <span>/api/posts</span>
            </div>
            <div className="flex gap-2">
              <span className="bg-green-100 text-green-800 px-2 py-1 rounded">
                GET
              </span>
              <span>/api/posts/[id]</span>
            </div>
            <div className="flex gap-2">
              <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded">
                PUT
              </span>
              <span>/api/posts/[id]</span>
            </div>
            <div className="flex gap-2">
              <span className="bg-red-100 text-red-800 px-2 py-1 rounded">
                DELETE
              </span>
              <span>/api/posts/[id]</span>
            </div>
            <div className="flex gap-2">
              <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded">
                POST
              </span>
              <span>/api/auth</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
