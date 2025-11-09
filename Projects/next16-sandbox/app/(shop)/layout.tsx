/**
 * ショップセクション用レイアウト
 *
 * Route Groups を使用して、URL に影響を与えずにレイアウトをグループ化
 */

"use client";

import { useState } from "react";

export default function ShopLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [cartCount] = useState(3); // デモ用のカート数

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-blue-50 via-white to-green-50">
      {/* ショップヘッダー */}
      <header className="bg-white border-b border-blue-200 shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            {/* ロゴ */}
            <a href="/" className="flex items-center space-x-2">
              <span className="text-2xl">🛒</span>
              <span className="text-xl font-bold text-blue-900">
                Shop Hub
              </span>
            </a>

            {/* 検索バー */}
            <div className="hidden md:flex flex-1 max-w-md mx-8">
              <input
                type="text"
                placeholder="商品を検索..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* ナビゲーション */}
            <nav className="flex items-center space-x-4">
              <a
                href="/products"
                className="text-gray-600 hover:text-blue-900 transition-colors hidden md:block"
              >
                商品一覧
              </a>
              <a
                href="/cart"
                className="relative text-gray-600 hover:text-blue-900 transition-colors"
              >
                <span className="text-2xl">🛒</span>
                {cartCount > 0 && (
                  <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                    {cartCount}
                  </span>
                )}
              </a>
              <button className="text-gray-600 hover:text-blue-900 transition-colors">
                <span className="text-2xl">👤</span>
              </button>
            </nav>
          </div>

          {/* カテゴリナビゲーション */}
          <div className="mt-4 hidden md:flex items-center space-x-6 text-sm">
            <a
              href="/products?category=electronics"
              className="text-gray-600 hover:text-blue-900"
            >
              電化製品
            </a>
            <a
              href="/products?category=fashion"
              className="text-gray-600 hover:text-blue-900"
            >
              ファッション
            </a>
            <a
              href="/products?category=home"
              className="text-gray-600 hover:text-blue-900"
            >
              ホーム
            </a>
            <a
              href="/products?category=sports"
              className="text-gray-600 hover:text-blue-900"
            >
              スポーツ
            </a>
            <a
              href="/products?category=sale"
              className="text-red-600 hover:text-red-700 font-medium"
            >
              🔥 セール
            </a>
          </div>
        </div>
      </header>

      {/* メインコンテンツ */}
      <main className="flex-1">
        {children}
      </main>

      {/* ショップフッター */}
      <footer className="bg-blue-900 text-white py-8 mt-auto">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-6">
            {/* ショップ情報 */}
            <div>
              <h3 className="text-lg font-semibold mb-3">ショップ情報</h3>
              <ul className="space-y-2 text-blue-200 text-sm">
                <li>
                  <a href="/about" className="hover:text-white">
                    会社概要
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white">
                    配送について
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white">
                    返品・交換
                  </a>
                </li>
              </ul>
            </div>

            {/* カスタマーサポート */}
            <div>
              <h3 className="text-lg font-semibold mb-3">
                カスタマーサポート
              </h3>
              <ul className="space-y-2 text-blue-200 text-sm">
                <li>
                  <a href="/contact" className="hover:text-white">
                    お問い合わせ
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white">
                    よくある質問
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white">
                    注文履歴
                  </a>
                </li>
              </ul>
            </div>

            {/* お支払い方法 */}
            <div>
              <h3 className="text-lg font-semibold mb-3">お支払い方法</h3>
              <div className="flex space-x-2 text-2xl">
                <span>💳</span>
                <span>🏦</span>
                <span>📱</span>
              </div>
              <p className="text-blue-200 text-xs mt-2">
                クレジットカード、銀行振込、電子マネー
              </p>
            </div>

            {/* ニュースレター */}
            <div>
              <h3 className="text-lg font-semibold mb-3">ニュースレター</h3>
              <p className="text-blue-200 text-sm mb-3">
                お得な情報をお届けします
              </p>
              <div className="flex">
                <input
                  type="email"
                  placeholder="メールアドレス"
                  className="flex-1 px-3 py-2 rounded-l text-gray-900 text-sm"
                />
                <button className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded-r text-sm">
                  登録
                </button>
              </div>
            </div>
          </div>

          <div className="border-t border-blue-700 pt-6 text-center text-blue-200 text-sm">
            <p>© 2025 Next.js 16 Sandbox Shop. All rights reserved.</p>
            <p className="mt-2 text-xs">
              Route Groups デモ - ショップレイアウト
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
