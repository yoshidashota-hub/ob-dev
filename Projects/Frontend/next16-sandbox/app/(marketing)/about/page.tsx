/**
 * About ページ
 *
 * Route Groups の (marketing) グループに属するページ
 * URL: /about （グループ名は URL に含まれない）
 */

import { Metadata } from "next";

export const metadata: Metadata = {
  title: "About Us",
  description: "Next.js 16 学習プロジェクトについて",
};

export default function AboutPage() {
  return (
    <div className="py-12 px-4">
      <div className="max-w-5xl mx-auto">
        {/* ヘッダー */}
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-purple-900 mb-4">About Us</h1>
          <p className="text-xl text-gray-600">
            Next.js 16 学習プロジェクトについて
          </p>
        </div>

        {/* コンテンツ */}
        <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
          <h2 className="text-3xl font-semibold text-gray-900 mb-6">
            プロジェクトの目的
          </h2>
          <p className="text-gray-700 leading-relaxed mb-4">
            このプロジェクトは、Next.js 16
            の新機能を実践的に学ぶためのサンドボックスです。
            Server Actions、Streaming、Middleware、Route Groups
            など、最新の機能を網羅的に実装し、
            実際の開発で使えるパターンを習得することを目指しています。
          </p>
          <p className="text-gray-700 leading-relaxed">
            各機能の実装例とドキュメントを通じて、Next.js 16
            の深い理解と実践力を身につけることができます。
          </p>
        </div>

        {/* 特徴 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="bg-purple-50 rounded-lg p-6">
            <h3 className="text-xl font-semibold text-purple-900 mb-3">
              📚 体系的な学習
            </h3>
            <p className="text-gray-700 text-sm">
              Phase 1
              から順序立てて学習できる構成。基礎から応用まで段階的に習得できます。
            </p>
          </div>

          <div className="bg-pink-50 rounded-lg p-6">
            <h3 className="text-xl font-semibold text-pink-900 mb-3">
              💻 実践的なコード
            </h3>
            <p className="text-gray-700 text-sm">
              実際のプロジェクトで使える実装例。TypeScript
              と型安全性を重視したコード。
            </p>
          </div>

          <div className="bg-indigo-50 rounded-lg p-6">
            <h3 className="text-xl font-semibold text-indigo-900 mb-3">
              📖 詳細なドキュメント
            </h3>
            <p className="text-gray-700 text-sm">
              各機能の詳細な解説とベストプラクティス。Examples
              フォルダに体系的に整理。
            </p>
          </div>

          <div className="bg-blue-50 rounded-lg p-6">
            <h3 className="text-xl font-semibold text-blue-900 mb-3">
              🚀 最新技術
            </h3>
            <p className="text-gray-700 text-sm">
              Next.js 16、React 19、TypeScript
              5、Turbopack。最新のエコシステムを活用。
            </p>
          </div>
        </div>

        {/* Route Groups の説明 */}
        <div className="bg-gradient-to-r from-purple-100 to-pink-100 rounded-lg p-8">
          <h2 className="text-2xl font-semibold text-purple-900 mb-4">
            📂 Route Groups デモ
          </h2>
          <p className="text-gray-800 mb-4">
            このページは <code className="bg-white px-2 py-1 rounded text-sm">(marketing)</code>{" "}
            Route Group に属しています。
          </p>
          <ul className="space-y-2 text-gray-700">
            <li className="flex items-start">
              <span className="mr-2">✓</span>
              <span>
                <strong>URL は /about</strong> - グループ名 (marketing) は URL
                に含まれない
              </span>
            </li>
            <li className="flex items-start">
              <span className="mr-2">✓</span>
              <span>
                <strong>専用レイアウト</strong> - マーケティング用のヘッダー・フッター
              </span>
            </li>
            <li className="flex items-start">
              <span className="mr-2">✓</span>
              <span>
                <strong>グループ化</strong> - 関連するページを論理的に整理
              </span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
