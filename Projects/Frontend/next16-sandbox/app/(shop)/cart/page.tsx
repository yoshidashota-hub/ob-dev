/**
 * カートページ
 *
 * Route Groups の (shop) グループに属するページ
 * URL: /cart （グループ名は URL に含まれない）
 */

"use client";

import { useState } from "react";

type CartItem = {
  id: number;
  name: string;
  price: number;
  quantity: number;
  image: string;
};

export default function CartPage() {
  const [cartItems, setCartItems] = useState<CartItem[]>([
    {
      id: 1,
      name: "Next.js 16 完全ガイド",
      price: 3980,
      quantity: 1,
      image: "📘",
    },
    {
      id: 2,
      name: "React 19 実践マスター",
      price: 4200,
      quantity: 2,
      image: "📗",
    },
    {
      id: 3,
      name: "TypeScript 開発入門",
      price: 3500,
      quantity: 1,
      image: "📕",
    },
  ]);

  const updateQuantity = (id: number, newQuantity: number) => {
    if (newQuantity < 1) return;
    setCartItems(
      cartItems.map((item) =>
        item.id === id ? { ...item, quantity: newQuantity } : item
      )
    );
  };

  const removeItem = (id: number) => {
    setCartItems(cartItems.filter((item) => item.id !== id));
  };

  const subtotal = cartItems.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );
  const shipping = subtotal > 5000 ? 0 : 500;
  const tax = Math.floor(subtotal * 0.1);
  const total = subtotal + shipping + tax;

  return (
    <div className="py-12 px-4">
      <div className="max-w-6xl mx-auto">
        {/* ヘッダー */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-blue-900 mb-2">
            ショッピングカート
          </h1>
          <p className="text-gray-600">
            {cartItems.length} 点の商品がカートに入っています
          </p>
        </div>

        {cartItems.length === 0 ? (
          // カートが空の場合
          <div className="bg-white rounded-lg shadow-lg p-12 text-center">
            <div className="text-6xl mb-4">🛒</div>
            <h2 className="text-2xl font-semibold text-gray-900 mb-2">
              カートは空です
            </h2>
            <p className="text-gray-600 mb-6">
              商品を追加してお買い物を始めましょう
            </p>
            <a
              href="/products"
              className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              商品を見る
            </a>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* カート商品一覧 */}
            <div className="lg:col-span-2 space-y-4">
              {cartItems.map((item) => (
                <div
                  key={item.id}
                  className="bg-white rounded-lg shadow-md p-6 flex items-center"
                >
                  {/* 商品画像 */}
                  <div className="text-6xl mr-6">{item.image}</div>

                  {/* 商品情報 */}
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">
                      {item.name}
                    </h3>
                    <p className="text-blue-600 font-medium">
                      ¥{item.price.toLocaleString()}
                    </p>

                    {/* 数量調整 */}
                    <div className="flex items-center mt-3 space-x-3">
                      <button
                        onClick={() =>
                          updateQuantity(item.id, item.quantity - 1)
                        }
                        className="w-8 h-8 flex items-center justify-center bg-gray-200 hover:bg-gray-300 rounded"
                      >
                        -
                      </button>
                      <span className="font-medium">{item.quantity}</span>
                      <button
                        onClick={() =>
                          updateQuantity(item.id, item.quantity + 1)
                        }
                        className="w-8 h-8 flex items-center justify-center bg-gray-200 hover:bg-gray-300 rounded"
                      >
                        +
                      </button>
                    </div>
                  </div>

                  {/* 小計と削除ボタン */}
                  <div className="text-right">
                    <p className="text-xl font-bold text-gray-900 mb-3">
                      ¥{(item.price * item.quantity).toLocaleString()}
                    </p>
                    <button
                      onClick={() => removeItem(item.id)}
                      className="text-red-600 hover:text-red-700 text-sm"
                    >
                      削除
                    </button>
                  </div>
                </div>
              ))}

              {/* Route Groups 説明 */}
              <div className="bg-gradient-to-r from-blue-100 to-green-100 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-blue-900 mb-3">
                  📂 Route Groups デモ
                </h3>
                <p className="text-gray-800 text-sm mb-2">
                  このページは{" "}
                  <code className="bg-white px-2 py-1 rounded text-xs">
                    (shop)
                  </code>{" "}
                  Route Group に属し、ショップ用レイアウトが適用されています。
                </p>
                <ul className="space-y-1 text-gray-700 text-sm">
                  <li>✓ URL は /cart （グループ名は含まれない）</li>
                  <li>✓ ショップ専用のヘッダー・フッター</li>
                  <li>✓ カート数バッジ表示</li>
                  <li>✓ 検索バーとカテゴリナビゲーション</li>
                </ul>
              </div>
            </div>

            {/* 注文サマリー */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-lg shadow-lg p-6 sticky top-24">
                <h2 className="text-xl font-semibold text-gray-900 mb-6">
                  注文サマリー
                </h2>

                {/* 金額詳細 */}
                <div className="space-y-3 mb-6">
                  <div className="flex justify-between text-gray-700">
                    <span>小計</span>
                    <span>¥{subtotal.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-gray-700">
                    <span>配送料</span>
                    <span>
                      {shipping === 0 ? (
                        <span className="text-green-600 font-medium">無料</span>
                      ) : (
                        `¥${shipping.toLocaleString()}`
                      )}
                    </span>
                  </div>
                  {shipping > 0 && (
                    <p className="text-xs text-gray-500">
                      ¥5,000以上のご注文で送料無料
                    </p>
                  )}
                  <div className="flex justify-between text-gray-700">
                    <span>消費税（10%）</span>
                    <span>¥{tax.toLocaleString()}</span>
                  </div>
                  <div className="border-t pt-3 flex justify-between text-lg font-bold text-gray-900">
                    <span>合計</span>
                    <span>¥{total.toLocaleString()}</span>
                  </div>
                </div>

                {/* レジへ進むボタン */}
                <button className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg hover:bg-blue-700 transition-colors font-medium mb-3">
                  レジへ進む
                </button>

                {/* お買い物を続けるボタン */}
                <a
                  href="/products"
                  className="block w-full text-center border border-blue-600 text-blue-600 py-3 px-6 rounded-lg hover:bg-blue-50 transition-colors"
                >
                  お買い物を続ける
                </a>

                {/* お支払い方法 */}
                <div className="mt-6 pt-6 border-t">
                  <p className="text-sm text-gray-600 mb-2">
                    ご利用可能なお支払い方法
                  </p>
                  <div className="flex space-x-2 text-2xl">
                    <span>💳</span>
                    <span>🏦</span>
                    <span>📱</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
