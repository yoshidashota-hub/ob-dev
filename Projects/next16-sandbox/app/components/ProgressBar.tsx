/**
 * ページ遷移時のプログレスバー
 *
 * ページ遷移中にトップに表示される進捗バー
 * usePathname と useEffect を使用してページ遷移を検知
 */

"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

export function ProgressBar() {
  const pathname = usePathname();
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    // ページ遷移開始
    setIsLoading(true);
    setProgress(0);

    // プログレスバーのアニメーション
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 90) {
          clearInterval(interval);
          return prev;
        }
        return prev + 10;
      });
    }, 100);

    // ページ遷移完了
    const timeout = setTimeout(() => {
      setProgress(100);
      setTimeout(() => {
        setIsLoading(false);
        setProgress(0);
      }, 200);
    }, 500);

    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
    };
  }, [pathname]);

  if (!isLoading) return null;

  return (
    <div
      className="fixed top-0 left-0 right-0 h-1 bg-blue-500 z-50 transition-all duration-300"
      style={{ width: `${progress}%` }}
    >
      <div className="h-full bg-gradient-to-r from-blue-500 to-purple-500 shadow-lg"></div>
    </div>
  );
}

/**
 * スピナーローディング
 *
 * ボタンやカード内で使用する小さなスピナー
 */
export function Spinner({ size = "md" }: { size?: "sm" | "md" | "lg" }) {
  const sizeClasses = {
    sm: "w-4 h-4 border-2",
    md: "w-8 h-8 border-3",
    lg: "w-12 h-12 border-4",
  };

  return (
    <div
      className={`${sizeClasses[size]} border-blue-500 border-t-transparent rounded-full animate-spin`}
    ></div>
  );
}

/**
 * ページ中央のローディング
 *
 * ページ全体のローディングインジケーター
 */
export function PageLoader() {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-8 shadow-2xl flex flex-col items-center">
        <Spinner size="lg" />
        <p className="mt-4 text-gray-700 font-medium">読み込み中...</p>
      </div>
    </div>
  );
}

/**
 * ボタンローディング
 *
 * ボタン内で使用するローディング状態
 */
export function ButtonLoader({ text = "処理中..." }: { text?: string }) {
  return (
    <div className="flex items-center gap-2">
      <Spinner size="sm" />
      <span>{text}</span>
    </div>
  );
}

/**
 * ドットローディング
 *
 * シンプルな3点アニメーション
 */
export function DotLoader() {
  return (
    <div className="flex gap-1">
      <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
      <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
      <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
    </div>
  );
}

/**
 * パルスローディング
 *
 * パルスアニメーション（全画面）
 */
export function PulseLoader({ text = "読み込み中..." }: { text?: string }) {
  return (
    <div className="flex flex-col items-center justify-center p-8">
      <div className="relative w-16 h-16">
        <div className="absolute inset-0 bg-blue-500 rounded-full opacity-75 animate-ping"></div>
        <div className="relative bg-blue-600 rounded-full w-16 h-16"></div>
      </div>
      <p className="mt-4 text-gray-700 font-medium">{text}</p>
    </div>
  );
}
