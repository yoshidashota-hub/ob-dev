---
created: 2025-11-08
tags: [nextjs, optimization, image, font, performance, examples]
status: 完了
related:
  - "[[loading-ui-examples]]"
  - "[[Next.js-16-Extended-Learning-Path]]"
---

# Image & Font Optimization 実装例

Next.js 16 の画像・フォント最適化機能の実装例とベストプラクティス。

## 📋 概要

Next.js は画像とフォントを自動的に最適化し、パフォーマンスを向上させます。

### 主な特徴

- **next/image による画像最適化**
- **next/font による Google Fonts 最適化**
- **自動 WebP/AVIF 変換**
- **レイアウトシフト防止**
- **遅延読み込み（Lazy Loading）**

---

## 🖼️ Image Optimization

### 1. 基本的な使い方

```typescript
import Image from "next/image";

export default function Page() {
  return (
    <Image
      src="/images/photo.jpg"
      alt="Description"
      width={600}
      height={400}
    />
  );
}
```

**特徴:**
- 自動的に WebP/AVIF 形式に変換
- デバイスに応じた適切なサイズ
- Lazy Loading 自動適用

---

### 2. レスポンシブ画像（fill）

```typescript
<div className="relative w-full h-96">
  <Image
    src="/images/hero.jpg"
    alt="Hero"
    fill
    className="object-cover"
  />
</div>
```

**ポイント:**
- 親要素を `relative` に設定
- `fill` で親要素のサイズに合わせる
- `object-cover` で aspect ratio 維持

---

### 3. Priority Loading

```typescript
<Image
  src="/images/hero.jpg"
  alt="Hero"
  width={1200}
  height={600}
  priority
/>
```

**用途:**
- Above-the-fold の重要な画像
- LCP（Largest Contentful Paint）の改善
- ヒーロー画像やファーストビュー

---

### 4. Placeholder（ぼかし効果）

```typescript
<Image
  src="/images/photo.jpg"
  alt="Photo"
  width={600}
  height={400}
  placeholder="blur"
  blurDataURL="data:image/jpeg;base64,..."
/>
```

**効果:**
- 読み込み中の UX 改善
- レイアウトシフト防止
- スムーズな表示

---

### 5. next.config.ts 設定

```typescript
// next.config.ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
    ],
    formats: ["image/avif", "image/webp"],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },
};

export default nextConfig;
```

**設定項目:**
- `remotePatterns`: 外部画像ドメイン許可
- `formats`: 画像フォーマット優先順位
- `deviceSizes`: レスポンシブサイズ
- `imageSizes`: 固定サイズ

---

## 🔤 Font Optimization

### 1. Google Fonts（Variable Font）

```typescript
import { Inter } from "next/font/google";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export default function Layout({ children }) {
  return (
    <html className={inter.variable}>
      <body>{children}</body>
    </html>
  );
}
```

**特徴:**
- Variable Font - 1ファイルで全ウェイト
- 自動サブセット化
- セルフホスティング

---

### 2. 固定ウェイトフォント

```typescript
import { Roboto } from "next/font/google";

const roboto = Roboto({
  weight: ["400", "700"],
  subsets: ["latin"],
  display: "swap",
});
```

**利点:**
- 必要なウェイトのみダウンロード
- ファイルサイズ最小化
- パフォーマンス向上

---

### 3. 日本語フォント

```typescript
import { Noto_Sans_JP } from "next/font/google";

const notoSansJP = Noto_Sans_JP({
  weight: ["400", "700"],
  subsets: ["latin"],
  variable: "--font-noto-sans-jp",
  display: "swap",
});
```

**最適化:**
- サブセット自動化
- 文字セット最適化
- 高速読み込み

---

### 4. 複数フォントの使い分け

```typescript
import { Geist, Geist_Mono, Playfair_Display } from "next/font/google";

const geistSans = Geist({ subsets: ["latin"] });
const geistMono = Geist_Mono({ subsets: ["latin"] });
const playfair = Playfair_Display({ subsets: ["latin"] });

// 使い分け
<p className={geistSans.className}>本文テキスト</p>
<code className={geistMono.className}>コード</code>
<h1 className={playfair.className}>タイトル</h1>
```

---

### 5. CSS Variables

```typescript
const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

// layout.tsx
<body className={inter.variable}>

// CSS/Tailwind で使用
<p className="font-[var(--font-inter)]">
```

**利点:**
- グローバルに利用可能
- CSS で柔軟に使用
- Tailwind との統合

---

## 💡 ベストプラクティス

### Image

1. **適切な width/height を指定**
   - レイアウトシフト防止
   - CLS（Cumulative Layout Shift）改善

2. **priority は重要な画像のみ**
   - Above-the-fold の画像
   - ヒーロー画像

3. **外部画像は remotePatterns で許可**
   - セキュリティ確保
   - 明示的な許可

4. **quality 設定を調整**
   - デフォルト: 75
   - サムネイル: 50-60
   - 重要画像: 80-90

### Font

1. **Variable Font を優先**
   - ファイルサイズ削減
   - 柔軟なウェイト

2. **display: "swap" 推奨**
   - FOUT（Flash of Unstyled Text）対策
   - 即座にテキスト表示

3. **サブセットを指定**
   - 必要な文字セットのみ
   - パフォーマンス向上

4. **CSS Variables 活用**
   - グローバル管理
   - 再利用性向上

---

## 🚀 実装済みファイル

### プロジェクト内の実装

```
next16-sandbox/
├── app/
│   ├── images/
│   │   └── page.tsx          # next/image デモ
│   ├── fonts/
│   │   └── page.tsx          # フォント最適化デモ
│   └── layout.tsx            # Geist フォント設定
├── next.config.ts            # 画像最適化設定
└── public/
    └── (画像ファイル)
```

### デモページ

- **`/images`** - next/image の様々な使い方
- **`/fonts`** - Google Fonts 最適化デモ

---

## 📊 パフォーマンス指標

### Core Web Vitals 改善

**LCP（Largest Contentful Paint）:**
- priority 付き画像
- 画像最適化
- 適切なサイズ指定

**CLS（Cumulative Layout Shift）:**
- width/height 指定
- aspect-ratio 設定
- font-display: swap

**FID（First Input Delay）:**
- フォントプリロード
- 遅延読み込み

---

## 📚 参考リンク

- [Next.js Image Optimization](https://nextjs.org/docs/app/building-your-application/optimizing/images)
- [Next.js Font Optimization](https://nextjs.org/docs/app/building-your-application/optimizing/fonts)
- [Google Fonts](https://fonts.google.com/)

---

## 🎓 学習のポイント

1. **画像最適化** - next/image の活用
2. **フォント最適化** - next/font の活用
3. **パフォーマンス** - Core Web Vitals 改善
4. **設定** - next.config.ts の適切な設定
5. **UX** - レイアウトシフト防止

---

**作成日**: 2025-11-08
**Phase 1.5**: Image & Font Optimization 実装完了
