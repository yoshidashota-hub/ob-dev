"use client";

/**
 * 投稿作成フォーム
 *
 * useFormState でServer Actionとフォーム状態を統合
 * SubmitButton で送信中の状態を表示
 */

import { useFormState } from "react-dom";
import { createPost, type CreatePostFormState } from "../../actions/createPost";
import { SubmitButton } from "../../components/SubmitButton";

const initialState: CreatePostFormState = {};

export default function CreatePostPage() {
  const [state, formAction] = useFormState(createPost, initialState);

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-lg shadow-md p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">
            新規投稿作成
          </h1>

          {/* Server Action情報 */}
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
            <h2 className="text-sm font-semibold text-green-900 mb-2">
              ✨ Server Actions (Next.js 16)
            </h2>
            <p className="text-xs text-green-800">
              このフォームは<code className="bg-green-100 px-1 rounded">Server Actions</code>
              を使用しています。JavaScriptが無効でも動作します（Progressive Enhancement）。
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
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <label
                htmlFor="published"
                className="ml-2 text-sm text-gray-700"
              >
                すぐに公開する
              </label>
            </div>

            {/* ボタン */}
            <div className="flex gap-4">
              <SubmitButton>投稿を作成</SubmitButton>

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
            Server Actionsの仕組み
          </h2>

          <div className="space-y-3 text-sm text-gray-700">
            <div className="flex items-start gap-2">
              <span className="text-blue-600 font-bold">1.</span>
              <p>
                フォーム送信時、自動的にServer Actionが呼び出される
              </p>
            </div>

            <div className="flex items-start gap-2">
              <span className="text-blue-600 font-bold">2.</span>
              <p>
                <code className="bg-gray-100 px-1 rounded">useFormStatus</code>
                でSubmitButtonが送信中状態を検知
              </p>
            </div>

            <div className="flex items-start gap-2">
              <span className="text-blue-600 font-bold">3.</span>
              <p>
                サーバー側でバリデーション実行、エラーがあればstateに返す
              </p>
            </div>

            <div className="flex items-start gap-2">
              <span className="text-blue-600 font-bold">4.</span>
              <p>
                <code className="bg-gray-100 px-1 rounded">revalidatePath</code>
                でキャッシュを無効化
              </p>
            </div>

            <div className="flex items-start gap-2">
              <span className="text-blue-600 font-bold">5.</span>
              <p>成功時は一覧ページにリダイレクト</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
