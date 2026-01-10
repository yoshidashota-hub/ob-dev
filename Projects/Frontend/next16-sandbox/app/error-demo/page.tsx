/**
 * エラーハンドリングデモページ
 *
 * 各種エラーを意図的にトリガーして、
 * エラーページの動作を確認できるデモ
 */

"use client";

import { useState } from "react";

export default function ErrorDemoPage() {
  const [showSuccess, setShowSuccess] = useState(false);

  // エラーをトリガーする関数
  function triggerError() {
    throw new Error("これはテスト用のエラーです（error.tsx で処理されます）");
  }

  function triggerTypeError() {
    // @ts-ignore
    const obj = null;
    // @ts-ignore
    obj.property.nested; // TypeErrorをトリガー
  }

  function triggerReferenceError() {
    // @ts-ignore
    nonExistentFunction(); // ReferenceErrorをトリガー
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* ヘッダー */}
        <div className="bg-white rounded-lg shadow-md p-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            エラーハンドリング デモ
          </h1>
          <p className="text-lg text-gray-600 mb-6">
            Next.js 16のエラーハンドリング機能を実際に試せるデモページです
          </p>

          <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
            <h2 className="text-lg font-semibold text-amber-900 mb-3">
              ⚠️ このページについて
            </h2>
            <div className="space-y-2 text-sm text-amber-800">
              <p>
                <strong>目的:</strong>{" "}
                各種エラーページの動作を確認するためのテストページです
              </p>
              <p>
                <strong>注意:</strong>{" "}
                ボタンをクリックすると意図的にエラーが発生します
              </p>
              <p>
                <strong>復帰方法:</strong>{" "}
                エラーページの「もう一度試す」ボタンで復帰できます
              </p>
            </div>
          </div>
        </div>

        {/* エラートリガーボタン */}
        <div className="bg-white rounded-lg shadow-md p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            エラーをトリガー
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* 基本的なエラー */}
            <div className="border-2 border-red-200 rounded-lg p-6 hover:border-red-400 transition-colors">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                1️⃣ 基本的なエラー
              </h3>
              <p className="text-sm text-gray-600 mb-4">
                標準的なErrorオブジェクトを投げます
              </p>
              <button
                onClick={triggerError}
                className="w-full px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 font-semibold transition-colors"
              >
                エラーを発生させる
              </button>
            </div>

            {/* TypeError */}
            <div className="border-2 border-orange-200 rounded-lg p-6 hover:border-orange-400 transition-colors">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                2️⃣ TypeError
              </h3>
              <p className="text-sm text-gray-600 mb-4">
                nullのプロパティアクセスでTypeErrorを発生
              </p>
              <button
                onClick={triggerTypeError}
                className="w-full px-4 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 font-semibold transition-colors"
              >
                TypeErrorを発生させる
              </button>
            </div>

            {/* ReferenceError */}
            <div className="border-2 border-yellow-200 rounded-lg p-6 hover:border-yellow-400 transition-colors">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                3️⃣ ReferenceError
              </h3>
              <p className="text-sm text-gray-600 mb-4">
                存在しない関数を呼び出してエラーを発生
              </p>
              <button
                onClick={triggerReferenceError}
                className="w-full px-4 py-3 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 font-semibold transition-colors"
              >
                ReferenceErrorを発生させる
              </button>
            </div>

            {/* 404エラー */}
            <div className="border-2 border-purple-200 rounded-lg p-6 hover:border-purple-400 transition-colors">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                4️⃣ 404 Not Found
              </h3>
              <p className="text-sm text-gray-600 mb-4">
                存在しないページにアクセス
              </p>
              <a
                href="/this-page-does-not-exist"
                className="block w-full px-4 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-semibold text-center transition-colors"
              >
                404ページを表示
              </a>
            </div>
          </div>
        </div>

        {/* エラーハンドリングの仕組み */}
        <div className="bg-white rounded-lg shadow-md p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            Next.js のエラーハンドリング
          </h2>

          <div className="space-y-6">
            {/* error.tsx */}
            <div className="border-l-4 border-red-500 pl-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                error.tsx
              </h3>
              <p className="text-sm text-gray-600 mb-3">
                各ルートセグメントでのエラーをキャッチするError Boundary
              </p>
              <div className="bg-gray-50 rounded p-3 text-sm font-mono">
                <div className="text-gray-600">app/</div>
                <div className="text-gray-600 ml-4">├── error.tsx</div>
                <div className="text-gray-600 ml-4">└── page.tsx</div>
              </div>
            </div>

            {/* global-error.tsx */}
            <div className="border-l-4 border-orange-500 pl-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                global-error.tsx
              </h3>
              <p className="text-sm text-gray-600 mb-3">
                ルートレイアウトでのエラーもキャッチする最後の砦
              </p>
              <div className="bg-gray-50 rounded p-3 text-sm font-mono">
                <div className="text-gray-600">app/</div>
                <div className="text-gray-600 ml-4">
                  ├── global-error.tsx
                </div>
                <div className="text-gray-600 ml-4">├── layout.tsx</div>
                <div className="text-gray-600 ml-4">└── page.tsx</div>
              </div>
            </div>

            {/* not-found.tsx */}
            <div className="border-l-4 border-purple-500 pl-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                not-found.tsx
              </h3>
              <p className="text-sm text-gray-600 mb-3">
                404エラー（存在しないページ）用のカスタムページ
              </p>
              <div className="bg-gray-50 rounded p-3 text-sm font-mono">
                <div className="text-gray-600">app/</div>
                <div className="text-gray-600 ml-4">├── not-found.tsx</div>
                <div className="text-gray-600 ml-4">└── page.tsx</div>
              </div>
            </div>
          </div>
        </div>

        {/* 特徴 */}
        <div className="bg-white rounded-lg shadow-md p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">主な特徴</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="border-l-4 border-blue-500 pl-4">
              <h3 className="font-semibold text-gray-900 mb-2">
                自動エラーリカバリー
              </h3>
              <p className="text-sm text-gray-600">
                resetボタンでコンポーネントを再レンダリングし、エラーから復帰
              </p>
            </div>

            <div className="border-l-4 border-green-500 pl-4">
              <h3 className="font-semibold text-gray-900 mb-2">
                階層的エラーハンドリング
              </h3>
              <p className="text-sm text-gray-600">
                各ルートセグメントごとに独立したエラー処理が可能
              </p>
            </div>

            <div className="border-l-4 border-purple-500 pl-4">
              <h3 className="font-semibold text-gray-900 mb-2">
                ユーザーフレンドリー
              </h3>
              <p className="text-sm text-gray-600">
                技術的なエラーを分かりやすいメッセージに変換して表示
              </p>
            </div>

            <div className="border-l-4 border-orange-500 pl-4">
              <h3 className="font-semibold text-gray-900 mb-2">
                エラー監視連携
              </h3>
              <p className="text-sm text-gray-600">
                エラーログを外部監視サービスに送信可能（Sentry等）
              </p>
            </div>
          </div>
        </div>

        {/* ナビゲーション */}
        <div className="flex gap-4">
          <a
            href="/"
            className="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 font-semibold transition-colors"
          >
            ← ホームに戻る
          </a>
          <a
            href="/error-demo/segment"
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold transition-colors"
          >
            セグメント別エラー →
          </a>
        </div>

        {/* 成功メッセージ（reset後） */}
        {showSuccess && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <p className="text-green-800 font-semibold">
              ✓ エラーから正常に復帰しました！
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
