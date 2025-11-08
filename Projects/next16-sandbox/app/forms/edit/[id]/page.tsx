"use client";

/**
 * 投稿編集フォーム
 *
 * 既存の投稿を編集するフォーム
 * useFormStateでServer Actionと統合
 */

import { useFormState } from "react-dom";
import { useEffect, useState } from "react";
import { updatePost, type UpdatePostFormState } from "../../../actions/updatePost";
import { getPostById, type Post } from "../../../actions/posts";
import { SubmitButton } from "../../../components/SubmitButton";

const initialState: UpdatePostFormState = {};

interface EditPostPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default function EditPostPage({ params }: EditPostPageProps) {
  const [post, setPost] = useState<Post | null>(null);
  const [id, setId] = useState<string>("");
  const [loading, setLoading] = useState(true);

  // paramsを解決
  useEffect(() => {
    params.then((p) => {
      setId(p.id);
      const foundPost = getPostById(p.id);
      setPost(foundPost || null);
      setLoading(false);
    });
  }, [params]);

  // updatePost用のactionを部分適用
  const updatePostWithId = updatePost.bind(null, id);
  const [state, formAction] = useFormState(updatePostWithId, initialState);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-12 px-4">
        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-lg shadow-md p-8">
            <div className="animate-pulse">
              <div className="h-8 bg-gray-200 rounded w-1/3 mb-6"></div>
              <div className="space-y-4">
                <div className="h-4 bg-gray-200 rounded"></div>
                <div className="h-4 bg-gray-200 rounded w-5/6"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="min-h-screen bg-gray-50 py-12 px-4">
        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-lg shadow-md p-8 text-center">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              投稿が見つかりません
            </h1>
            <p className="text-gray-600 mb-6">
              ID: <code className="bg-gray-100 px-2 py-1 rounded">{id}</code>
            </p>
            <a
              href="/forms"
              className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              一覧に戻る
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-lg shadow-md p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">
            投稿を編集
          </h1>

          {/* Server Action情報 */}
          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h2 className="text-sm font-semibold text-blue-900 mb-2">
              ✨ Server Actions - 更新処理
            </h2>
            <p className="text-xs text-blue-800">
              投稿ID: <code className="bg-blue-100 px-1 rounded">{id}</code>
              <br />
              <code className="bg-blue-100 px-1 rounded">updatePost</code>
              アクションで既存データを更新します。
            </p>
          </div>

          {/* エラーメッセージ */}
          {state.message && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-800">{state.message}</p>
            </div>
          )}

          <form action={formAction} className="space-y-6">
            {/* タイトル */}
            <div>
              <label
                htmlFor="title"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                タイトル <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="title"
                name="title"
                defaultValue={post.title}
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  state.errors?.title
                    ? "border-red-500"
                    : "border-gray-300"
                }`}
                placeholder="投稿のタイトルを入力"
              />
              {state.errors?.title && (
                <p className="mt-1 text-sm text-red-600">
                  {state.errors.title[0]}
                </p>
              )}
            </div>

            {/* 本文 */}
            <div>
              <label
                htmlFor="content"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                本文 <span className="text-red-500">*</span>
              </label>
              <textarea
                id="content"
                name="content"
                rows={8}
                defaultValue={post.content}
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  state.errors?.content
                    ? "border-red-500"
                    : "border-gray-300"
                }`}
                placeholder="投稿の本文を入力"
              />
              {state.errors?.content && (
                <p className="mt-1 text-sm text-red-600">
                  {state.errors.content[0]}
                </p>
              )}
            </div>

            {/* 著者 */}
            <div>
              <label
                htmlFor="author"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                著者名 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="author"
                name="author"
                defaultValue={post.author}
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  state.errors?.author
                    ? "border-red-500"
                    : "border-gray-300"
                }`}
                placeholder="著者名を入力"
              />
              {state.errors?.author && (
                <p className="mt-1 text-sm text-red-600">
                  {state.errors.author[0]}
                </p>
              )}
            </div>

            {/* 公開設定 */}
            <div className="flex items-center">
              <input
                type="checkbox"
                id="published"
                name="published"
                defaultChecked={post.published}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <label
                htmlFor="published"
                className="ml-2 text-sm text-gray-700"
              >
                公開する
              </label>
            </div>

            {/* メタ情報 */}
            <div className="p-4 bg-gray-50 rounded-lg text-sm text-gray-600">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <span className="font-medium">作成日:</span>{" "}
                  {post.createdAt.toLocaleString("ja-JP")}
                </div>
                <div>
                  <span className="font-medium">更新日:</span>{" "}
                  {post.updatedAt.toLocaleString("ja-JP")}
                </div>
              </div>
            </div>

            {/* ボタン */}
            <div className="flex gap-4">
              <SubmitButton>更新する</SubmitButton>

              <a
                href="/forms"
                className="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 font-semibold hover:bg-gray-50 transition-colors"
              >
                キャンセル
              </a>
            </div>
          </form>
        </div>

        {/* 技術説明 */}
        <div className="mt-8 bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">
            編集フォームの実装ポイント
          </h2>

          <div className="space-y-3 text-sm text-gray-700">
            <div className="flex items-start gap-2">
              <span className="text-blue-600 font-bold">1.</span>
              <p>
                <code className="bg-gray-100 px-1 rounded">defaultValue</code>
                で既存データを表示
              </p>
            </div>

            <div className="flex items-start gap-2">
              <span className="text-blue-600 font-bold">2.</span>
              <p>
                <code className="bg-gray-100 px-1 rounded">bind()</code>
                でIDを部分適用し、Server Actionに渡す
              </p>
            </div>

            <div className="flex items-start gap-2">
              <span className="text-blue-600 font-bold">3.</span>
              <p>
                更新成功時は自動的に
                <code className="bg-gray-100 px-1 rounded">redirect()</code>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
