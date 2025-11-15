# Vercel Analytics & Speed Insights 実装例

Next.js アプリケーションにパフォーマンス測定とユーザー行動分析を追加する方法の完全ガイド。

---

## 📋 目次

1. [概要](#概要)
2. [セットアップ](#セットアップ)
3. [Analytics の実装](#analytics-の実装)
4. [Speed Insights の実装](#speed-insights-の実装)
5. [カスタムイベントの追跡](#カスタムイベントの追跡)
6. [ダッシュボードでの確認](#ダッシュボードでの確認)
7. [トラブルシューティング](#トラブルシューティング)

---

## 概要

### Vercel Analytics とは

リアルタイムでユーザー行動を分析するツール：

- ページビュー数
- ユーザー数（訪問者数）
- デバイス・ブラウザ分析
- 地域別アクセス
- カスタムイベント追跡

### Speed Insights とは

Core Web Vitals を測定し、パフォーマンスを可視化：

- **FCP** (First Contentful Paint) - 初期コンテンツの表示速度
- **LCP** (Largest Contentful Paint) - メインコンテンツの表示速度
- **CLS** (Cumulative Layout Shift) - レイアウトの安定性
- **FID** (First Input Delay) - 応答性

---

## セットアップ

### パッケージのインストール

```bash
npm install @vercel/analytics @vercel/speed-insights
```

### 依存関係

```json
{
  "dependencies": {
    "@vercel/analytics": "^1.3.1",
    "@vercel/speed-insights": "^1.0.12",
    "next": "^16.0.1",
    "react": "^19.2.0"
  }
}
```

---

## Analytics の実装

### 基本的な実装

**ファイル**: `app/layout.tsx`

```typescript
import { Analytics } from "@vercel/analytics/react";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja">
      <body>
        {children}
        <Analytics />
      </body>
    </html>
  );
}
```

### 開発環境での動作

```typescript
import { Analytics } from "@vercel/analytics/react";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja">
      <body>
        {children}
        {/* 開発環境でもイベントを送信（デバッグ用） */}
        <Analytics mode="development" />
      </body>
    </html>
  );
}
```

### カスタム設定

```typescript
import { Analytics } from "@vercel/analytics/react";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja">
      <body>
        {children}
        <Analytics
          // デバッグモード
          debug={process.env.NODE_ENV === "development"}
          // 自動ページビュー追跡を無効化（手動で追跡したい場合）
          beforeSend={(event) => {
            // イベントを修正または除外
            if (event.url.includes("/admin")) {
              return null; // 管理者ページは追跡しない
            }
            return event;
          }}
        />
      </body>
    </html>
  );
}
```

---

## Speed Insights の実装

### 基本的な実装

**ファイル**: `app/layout.tsx`

```typescript
import { SpeedInsights } from "@vercel/speed-insights/next";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja">
      <body>
        {children}
        <SpeedInsights />
      </body>
    </html>
  );
}
```

### Analytics と Speed Insights を両方使用

```typescript
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja">
      <body>
        {children}
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
```

### カスタムサンプリング

```typescript
import { SpeedInsights } from "@vercel/speed-insights/next";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja">
      <body>
        {children}
        {/* 10%のユーザーのみを測定（トラフィックが多い場合） */}
        <SpeedInsights sampleRate={0.1} />
      </body>
    </html>
  );
}
```

---

## カスタムイベントの追跡

### イベント送信の基本

```typescript
"use client";

import { track } from "@vercel/analytics";

export default function ProductPage() {
  const handlePurchase = () => {
    // カスタムイベントを送信
    track("purchase", {
      productId: "prod_123",
      price: 29.99,
      currency: "USD",
    });
  };

  return <button onClick={handlePurchase}>購入する</button>;
}
```

### よくあるイベント例

#### 1. ボタンクリック追跡

```typescript
"use client";

import { track } from "@vercel/analytics";

export default function CTAButton() {
  const handleClick = () => {
    track("cta_clicked", {
      button: "signup",
      location: "header",
    });
  };

  return <button onClick={handleClick}>今すぐ登録</button>;
}
```

#### 2. フォーム送信追跡

```typescript
"use client";

import { track } from "@vercel/analytics";
import { useState } from "react";

export default function ContactForm() {
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // フォーム送信を追跡
    track("form_submitted", {
      form: "contact",
      fields: 3,
    });

    // API送信処理...
  };

  return <form onSubmit={handleSubmit}>{/* フォームフィールド */}</form>;
}
```

#### 3. 検索イベント追跡

```typescript
"use client";

import { track } from "@vercel/analytics";
import { useState } from "react";

export default function SearchBar() {
  const [query, setQuery] = useState("");

  const handleSearch = () => {
    track("search", {
      query,
      resultsCount: 10,
    });
  };

  return (
    <div>
      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="検索..."
      />
      <button onClick={handleSearch}>検索</button>
    </div>
  );
}
```

#### 4. エラー追跡

```typescript
"use client";

import { track } from "@vercel/analytics";

export default function DataFetcher() {
  const fetchData = async () => {
    try {
      const response = await fetch("/api/data");
      // ...
    } catch (error) {
      // エラーを追跡
      track("error", {
        type: "api_error",
        endpoint: "/api/data",
        message: error instanceof Error ? error.message : "Unknown error",
      });
    }
  };

  return <button onClick={fetchData}>データ取得</button>;
}
```

#### 5. ユーザーエンゲージメント追跡

```typescript
"use client";

import { track } from "@vercel/analytics";
import { useEffect } from "react";

export default function VideoPlayer({ videoId }: { videoId: string }) {
  useEffect(() => {
    // 動画再生時間を追跡
    const trackWatchTime = () => {
      track("video_watched", {
        videoId,
        duration: "30s",
        completed: false,
      });
    };

    const timer = setTimeout(trackWatchTime, 30000); // 30秒後
    return () => clearTimeout(timer);
  }, [videoId]);

  return <video src={`/videos/${videoId}.mp4`} />;
}
```

---

## ダッシュボードでの確認

### Analytics ダッシュボード

1. **Vercel ダッシュボードにアクセス**

   - プロジェクトを選択
   - "Analytics" タブをクリック

2. **確認できるメトリクス**

   - リアルタイム訪問者数
   - ページビュー数
   - トップページ
   - デバイス内訳
   - ブラウザ内訳
   - 地域別アクセス
   - カスタムイベント

3. **フィルター機能**
   ```
   - 期間: 24時間、7日、30日、カスタム
   - パス: 特定のページのみ
   - イベント: カスタムイベントで絞り込み
   ```

### Speed Insights ダッシュボード

1. **Speed Insights タブ**

   - プロジェクト → "Speed Insights"

2. **Core Web Vitals スコア**

   - FCP: 緑（良い） < 1.8s
   - LCP: 緑（良い） < 2.5s
   - CLS: 緑（良い） < 0.1
   - FID: 緑（良い） < 100ms

3. **改善提案**
   - 遅いページの特定
   - デバイス別パフォーマンス
   - 最適化の推奨事項

---

## デモページの実装

### Analytics デモページ

**ファイル**: `app/analytics-demo/page.tsx`

```typescript
import Link from "next/link";

export default function AnalyticsDemo() {
  return (
    <div className="max-w-4xl mx-auto p-8">
      <h1 className="text-4xl font-bold mb-6">📊 Analytics & Speed Insights</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Analytics カード */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-2xl font-semibold mb-4">📊 Analytics</h2>
          <p className="text-gray-600 mb-4">
            ページビュー、ユーザー数、イベントトラッキングを確認できます。
          </p>
          <ul className="space-y-2 text-sm text-gray-700">
            <li>✅ リアルタイム訪問者数</li>
            <li>✅ ページ別パフォーマンス</li>
            <li>✅ デバイス・ブラウザ分析</li>
            <li>✅ 地域別アクセス</li>
          </ul>
        </div>

        {/* Speed Insights カード */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-2xl font-semibold mb-4">⚡ Speed Insights</h2>
          <p className="text-gray-600 mb-4">
            Core Web Vitals を測定し、パフォーマンスを最適化。
          </p>
          <ul className="space-y-2 text-sm text-gray-700">
            <li>✅ FCP (First Contentful Paint)</li>
            <li>✅ LCP (Largest Contentful Paint)</li>
            <li>✅ CLS (Cumulative Layout Shift)</li>
            <li>✅ FID (First Input Delay)</li>
          </ul>
        </div>
      </div>

      <div className="mt-8 p-6 bg-blue-50 rounded-lg">
        <h3 className="text-xl font-semibold mb-3">📈 確認方法</h3>
        <ol className="space-y-2 text-gray-700">
          <li>1. Vercel にデプロイ</li>
          <li>2. ダッシュボードの "Analytics" タブを開く</li>
          <li>3. "Speed Insights" タブでパフォーマンスを確認</li>
        </ol>
      </div>

      <div className="mt-8 p-6 bg-green-50 rounded-lg">
        <h3 className="text-xl font-semibold mb-3">💡 ベストプラクティス</h3>
        <ul className="space-y-2 text-gray-700">
          <li>✅ 重要なユーザーアクションにカスタムイベントを設定</li>
          <li>✅ ページごとのパフォーマンスを定期的に確認</li>
          <li>✅ Core Web Vitals のスコアが緑になるよう最適化</li>
          <li>✅ デバイス別のパフォーマンス差をチェック</li>
        </ul>
      </div>
    </div>
  );
}
```

---

## トラブルシューティング

### Analytics が動作しない

#### 原因 1: 本番環境でない

```typescript
// 解決策: 開発モードを有効化
<Analytics mode="development" />
```

#### 原因 2: Vercel にデプロイされていない

```bash
# Analytics は Vercel プロジェクトでのみ動作
vercel --prod
```

#### 原因 3: イベントが送信されない

```typescript
// デバッグモードで確認
<Analytics debug={true} />
```

### Speed Insights のデータが表示されない

#### 原因 1: トラフィックが少ない

```
解決策:
- 最低限のトラフィックが必要（目安: 100+ ページビュー/日）
- サンプリングレートを調整
```

#### 原因 2: スクリプトがブロックされている

```typescript
// Content Security Policy の確認
// next.config.js
module.exports = {
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          {
            key: "Content-Security-Policy",
            value:
              "script-src 'self' 'unsafe-inline' vitals.vercel-insights.com",
          },
        ],
      },
    ];
  },
};
```

### カスタムイベントが記録されない

#### デバッグ方法

```typescript
"use client";

import { track } from "@vercel/analytics";

// コンソールで確認
track("test_event", { test: "value" });
console.log("Event sent");

// Network タブで確認
// https://vitals.vercel-analytics.com/v1/vitals へのリクエストを確認
```

---

## パフォーマンスの最適化

### Core Web Vitals の改善

#### LCP の改善

```typescript
// 画像の最適化
import Image from "next/image";

export default function Hero() {
  return (
    <Image
      src="/hero.jpg"
      alt="Hero"
      width={1200}
      height={600}
      priority // LCP 要素には priority を設定
    />
  );
}
```

#### CLS の改善

```typescript
// レイアウトシフトを防ぐ
export default function ImageCard() {
  return (
    <div className="relative aspect-video">
      <Image
        src="/card.jpg"
        alt="Card"
        fill // アスペクト比を維持
        sizes="(max-width: 768px) 100vw, 50vw"
      />
    </div>
  );
}
```

#### FCP の改善

```typescript
// フォントの最適化
// app/layout.tsx
import { Inter } from "next/font/google";

const inter = Inter({
  subsets: ["latin"],
  display: "swap", // FOUT を防ぐ
});

export default function RootLayout({ children }) {
  return (
    <html lang="ja" className={inter.className}>
      <body>{children}</body>
    </html>
  );
}
```

---

## まとめ

### チェックリスト

- [ ] @vercel/analytics をインストール
- [ ] @vercel/speed-insights をインストール
- [ ] layout.tsx に Analytics コンポーネントを追加
- [ ] layout.tsx に SpeedInsights コンポーネントを追加
- [ ] 重要なユーザーアクションにカスタムイベントを追加
- [ ] Vercel にデプロイ
- [ ] Analytics ダッシュボードでデータを確認
- [ ] Speed Insights でパフォーマンススコアを確認
- [ ] Core Web Vitals を改善

### 次のステップ

- Vercel Blob でファイルアップロード機能を実装
- Vercel KV でキャッシュとセッション管理
- AI SDK でチャットボット機能を追加

---

**最終更新**: 2025 年 11 月
**難易度**: ★☆☆☆☆
**所要時間**: 30 分
