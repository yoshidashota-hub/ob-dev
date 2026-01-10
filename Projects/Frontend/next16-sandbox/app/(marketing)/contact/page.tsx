/**
 * Contact ページ
 *
 * Route Groups の (marketing) グループに属するページ
 * URL: /contact （グループ名は URL に含まれない）
 */

"use client";

import { Metadata } from "next";
import { useState } from "react";

export default function ContactPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setMessage("");

    // デモ用の送信処理（実際はServer Actionを使用）
    await new Promise((resolve) => setTimeout(resolve, 1500));

    setMessage("お問い合わせありがとうございます。確認後、ご連絡いたします。");
    setIsSubmitting(false);

    // フォームをリセット
    (e.target as HTMLFormElement).reset();
  };

  return (
    <div className="py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* ヘッダー */}
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-purple-900 mb-4">Contact Us</h1>
          <p className="text-xl text-gray-600">
            お問い合わせはこちらから
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* お問い合わせフォーム */}
          <div className="bg-white rounded-lg shadow-lg p-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-6">
              お問い合わせフォーム
            </h2>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* 名前 */}
              <div>
                <label
                  htmlFor="name"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  お名前 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="山田 太郎"
                />
              </div>

              {/* メールアドレス */}
              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  メールアドレス <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="example@email.com"
                />
              </div>

              {/* 件名 */}
              <div>
                <label
                  htmlFor="subject"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  件名 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="subject"
                  name="subject"
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="お問い合わせ内容"
                />
              </div>

              {/* メッセージ */}
              <div>
                <label
                  htmlFor="message"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  メッセージ <span className="text-red-500">*</span>
                </label>
                <textarea
                  id="message"
                  name="message"
                  required
                  rows={5}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                  placeholder="お問い合わせ内容をご記入ください"
                />
              </div>

              {/* 送信メッセージ */}
              {message && (
                <div className="p-4 bg-green-100 text-green-800 rounded-lg">
                  {message}
                </div>
              )}

              {/* 送信ボタン */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-purple-600 text-white py-3 px-6 rounded-lg hover:bg-purple-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-medium"
              >
                {isSubmitting ? "送信中..." : "送信する"}
              </button>
            </form>
          </div>

          {/* 連絡先情報 */}
          <div className="space-y-6">
            {/* 会社情報 */}
            <div className="bg-purple-50 rounded-lg p-6">
              <h3 className="text-xl font-semibold text-purple-900 mb-4">
                📍 会社情報
              </h3>
              <div className="space-y-3 text-gray-700">
                <div>
                  <p className="font-medium">住所</p>
                  <p className="text-sm">
                    〒100-0001
                    <br />
                    東京都千代田区 1-2-3
                    <br />
                    サンドボックスビル 5F
                  </p>
                </div>
                <div>
                  <p className="font-medium">電話番号</p>
                  <p className="text-sm">03-1234-5678</p>
                </div>
                <div>
                  <p className="font-medium">メール</p>
                  <p className="text-sm">info@example.com</p>
                </div>
              </div>
            </div>

            {/* 営業時間 */}
            <div className="bg-pink-50 rounded-lg p-6">
              <h3 className="text-xl font-semibold text-pink-900 mb-4">
                ⏰ 営業時間
              </h3>
              <div className="space-y-2 text-gray-700 text-sm">
                <div className="flex justify-between">
                  <span>月曜日 - 金曜日</span>
                  <span className="font-medium">9:00 - 18:00</span>
                </div>
                <div className="flex justify-between">
                  <span>土曜日</span>
                  <span className="font-medium">10:00 - 15:00</span>
                </div>
                <div className="flex justify-between">
                  <span>日曜日・祝日</span>
                  <span className="font-medium">休業</span>
                </div>
              </div>
            </div>

            {/* Route Groups 説明 */}
            <div className="bg-gradient-to-r from-purple-100 to-pink-100 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-purple-900 mb-3">
                📂 Route Groups デモ
              </h3>
              <p className="text-gray-800 text-sm mb-2">
                このページは{" "}
                <code className="bg-white px-2 py-1 rounded text-xs">
                  (marketing)
                </code>{" "}
                Route Group に属し、マーケティング用レイアウトが適用されています。
              </p>
              <p className="text-gray-700 text-sm">
                URL は <strong>/contact</strong> で、グループ名は含まれません。
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
