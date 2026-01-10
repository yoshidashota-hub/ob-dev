# 13 - Image and Font Optimization

## 概要

この章では、Next.js での画像とフォントの最適化について学びます。next/image と next/font を使って、パフォーマンスを向上させる方法を解説します。

## next/image

### 基本的な使い方

```typescript
import Image from "next/image";

export default function Page() {
  return <Image src="/hero.png" alt="Hero image" width={800} height={600} />;
}
```

### Image コンポーネントの機能

- **自動最適化**: WebP/AVIF への変換
- **遅延読み込み**: ビューポートに入るまでロードしない
- **レスポンシブ**: デバイスに応じたサイズ提供
- **プレースホルダー**: 読み込み中の表示
- **レイアウトシフト防止**: 自動的なスペース確保

### Props

```typescript
<Image
  src="/image.png" // 必須: 画像パス
  alt="Description" // 必須: 代替テキスト
  width={800} // 必須（fill以外）: 幅
  height={600} // 必須（fill以外）: 高さ
  priority // LCP画像用
  quality={75} // 品質（1-100）
  placeholder="blur" // プレースホルダー
  blurDataURL="..." // ブラーのデータURL
  loading="lazy" // eager | lazy
  sizes="100vw" // レスポンシブサイズ
  fill // 親要素を埋める
  style={{ objectFit: "cover" }}
/>
```

## 画像の配置パターン

### 固定サイズ

```typescript
import Image from "next/image";

export function Avatar({ src, name }: { src: string; name: string }) {
  return (
    <Image
      src={src}
      alt={name}
      width={48}
      height={48}
      className="rounded-full"
    />
  );
}
```

### レスポンシブ

```typescript
import Image from "next/image";

export function Hero() {
  return (
    <div className="relative w-full h-[400px]">
      <Image
        src="/hero.jpg"
        alt="Hero"
        fill
        sizes="100vw"
        style={{ objectFit: "cover" }}
        priority
      />
    </div>
  );
}
```

### sizes 属性

```typescript
// レスポンシブなサイズ指定
<Image
  src="/image.jpg"
  alt="Responsive image"
  fill
  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
/>
```

### アスペクト比の維持

```typescript
// Tailwind CSS を使用
<div className="relative aspect-video">
  <Image
    src="/video-thumbnail.jpg"
    alt="Video thumbnail"
    fill
    className="object-cover"
  />
</div>

// 16:9
<div className="relative aspect-[16/9]">
  <Image src="/image.jpg" alt="Image" fill />
</div>

// 4:3
<div className="relative aspect-[4/3]">
  <Image src="/image.jpg" alt="Image" fill />
</div>
```

## 外部画像

### next.config.ts の設定

```typescript
// next.config.ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.example.com",
        port: "",
        pathname: "/uploads/**",
      },
      {
        protocol: "https",
        hostname: "cdn.example.com",
      },
      {
        protocol: "https",
        hostname: "*.amazonaws.com",
      },
    ],
  },
};

export default nextConfig;
```

### 外部画像の使用

```typescript
import Image from "next/image";

export function UserAvatar({ imageUrl }: { imageUrl: string }) {
  return (
    <Image
      src={imageUrl} // https://images.example.com/uploads/user.jpg
      alt="User avatar"
      width={100}
      height={100}
    />
  );
}
```

## プレースホルダー

### blur プレースホルダー

```typescript
import Image from "next/image";
import heroImage from "@/public/hero.jpg"; // 静的インポート

export function Hero() {
  return (
    <Image
      src={heroImage}
      alt="Hero"
      placeholder="blur" // 自動的に blurDataURL が生成される
    />
  );
}
```

### カスタム blurDataURL

```typescript
// 動的画像の場合
<Image
  src={post.coverImage}
  alt={post.title}
  width={800}
  height={400}
  placeholder="blur"
  blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/4gHYSUNDX..."
/>
```

### プレースホルダーの生成

```typescript
// lib/blur.ts
import { getPlaiceholder } from "plaiceholder";

export async function getBlurDataUrl(imageUrl: string) {
  const res = await fetch(imageUrl);
  const buffer = await res.arrayBuffer();
  const { base64 } = await getPlaiceholder(Buffer.from(buffer));
  return base64;
}
```

## priority 属性

### LCP 画像

```typescript
// ファーストビューの重要な画像に priority を設定
export function HeroSection() {
  return (
    <section>
      <Image
        src="/hero.jpg"
        alt="Hero"
        width={1200}
        height={600}
        priority // プリロードされる
      />
    </section>
  );
}
```

### いつ priority を使うか

- ファーストビューに表示される画像
- LCP（Largest Contentful Paint）の対象
- ヒーローイメージやバナー

## next/font

### Google Fonts

```typescript
// app/layout.tsx
import { Inter, Roboto_Mono } from "next/font/google";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

const robotoMono = Roboto_Mono({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-roboto-mono",
});

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja" className={`${inter.variable} ${robotoMono.variable}`}>
      <body className={inter.className}>{children}</body>
    </html>
  );
}
```

### Tailwind CSS との統合

```typescript
// tailwind.config.ts
import type { Config } from "tailwindcss";

const config: Config = {
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-inter)", "sans-serif"],
        mono: ["var(--font-roboto-mono)", "monospace"],
      },
    },
  },
};

export default config;
```

```typescript
// 使用
<p className="font-sans">Sans serif text</p>
<code className="font-mono">Monospace code</code>
```

### フォントオプション

```typescript
const inter = Inter({
  subsets: ["latin", "latin-ext"],
  weight: ["400", "500", "600", "700"],
  style: ["normal", "italic"],
  display: "swap", // auto | block | swap | fallback | optional
  preload: true,
  fallback: ["system-ui", "arial"],
  adjustFontFallback: true,
  variable: "--font-inter",
});
```

### 日本語フォント

```typescript
import { Noto_Sans_JP } from "next/font/google";

const notoSansJP = Noto_Sans_JP({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  display: "swap",
  preload: false, // 日本語は文字数が多いため
});
```

## ローカルフォント

### 基本的な使い方

```typescript
import localFont from "next/font/local";

const myFont = localFont({
  src: "./fonts/MyFont.woff2",
  display: "swap",
});

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja" className={myFont.className}>
      <body>{children}</body>
    </html>
  );
}
```

### 複数のウェイト

```typescript
const myFont = localFont({
  src: [
    {
      path: "./fonts/MyFont-Regular.woff2",
      weight: "400",
      style: "normal",
    },
    {
      path: "./fonts/MyFont-Medium.woff2",
      weight: "500",
      style: "normal",
    },
    {
      path: "./fonts/MyFont-Bold.woff2",
      weight: "700",
      style: "normal",
    },
    {
      path: "./fonts/MyFont-Italic.woff2",
      weight: "400",
      style: "italic",
    },
  ],
  display: "swap",
  variable: "--font-my-font",
});
```

## 画像最適化の設定

### next.config.ts

```typescript
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // 許可するドメイン
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.example.com",
      },
    ],

    // デバイスサイズ
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],

    // 画像サイズ
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],

    // フォーマット
    formats: ["image/avif", "image/webp"],

    // ローダー
    loader: "default",

    // 最小キャッシュ TTL
    minimumCacheTTL: 60,

    // 外部画像の最適化を無効化
    unoptimized: false,
  },
};

export default nextConfig;
```

### カスタムローダー

```typescript
// lib/cloudinaryLoader.ts
export default function cloudinaryLoader({
  src,
  width,
  quality,
}: {
  src: string;
  width: number;
  quality?: number;
}) {
  const params = ["f_auto", "c_limit", `w_${width}`, `q_${quality || "auto"}`];
  return `https://res.cloudinary.com/demo/image/upload/${params.join(
    ","
  )}${src}`;
}
```

```typescript
// next.config.ts
const nextConfig: NextConfig = {
  images: {
    loader: "custom",
    loaderFile: "./lib/cloudinaryLoader.ts",
  },
};
```

## パフォーマンスのベストプラクティス

### 画像

```typescript
// ✅ 良い例
// 1. 適切なサイズを指定
<Image src="/image.jpg" width={800} height={600} alt="Description" />

// 2. レスポンシブに対応
<Image
  src="/image.jpg"
  fill
  sizes="(max-width: 768px) 100vw, 50vw"
  alt="Description"
/>

// 3. LCP 画像に priority
<Image src="/hero.jpg" priority width={1200} height={600} alt="Hero" />

// 4. プレースホルダーを使用
<Image src={image} placeholder="blur" alt="Description" />
```

```typescript
// ❌ 悪い例
// 1. サイズなしで fill を使わない
<Image src="/image.jpg" alt="Description" /> // エラー

// 2. 大きすぎる画像
<Image src="/huge-image.jpg" width={4000} height={3000} alt="Description" />

// 3. すべてに priority
<Image src="/small-icon.png" priority width={24} height={24} alt="Icon" />
```

### フォント

```typescript
// ✅ 良い例
// 1. 必要なサブセットのみ
const font = Inter({ subsets: ["latin"] });

// 2. display: swap を使用
const font = Inter({ subsets: ["latin"], display: "swap" });

// 3. 変数フォントを活用
const font = Inter({ variable: "--font-inter" });
```

## まとめ

- **next/image** で自動的に画像を最適化
- **fill** と **sizes** でレスポンシブ対応
- **priority** で LCP 画像をプリロード
- **placeholder="blur"** でロード中の UX 向上
- **next/font** でフォントを最適化
- **variable** でカスタムプロパティとして使用

## 演習問題

1. レスポンシブなヒーロー画像を実装してください
2. 外部画像の最適化を設定してください
3. Google Fonts を使ってフォントを設定してください
4. ローカルフォントを読み込んでください

## 次のステップ

次の章では、API ルートの作成について学びます。

⬅️ 前へ: [12-Metadata-and-SEO.md](./12-Metadata-and-SEO.md)
➡️ 次へ: [14-API-Routes.md](./14-API-Routes.md)
