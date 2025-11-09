---
created: 2025-11-08
tags: [nextjs, metadata, seo, opengraph, sitemap, examples]
status: 完了
related:
  - "[[optimization-examples]]"
  - "[[Next.js-16-Extended-Learning-Path]]"
---

# Metadata API (SEO) 実装例

Next.js 16 の Metadata API を使った SEO 最適化の実装例とベストプラクティス。

## 📋 概要

Next.js の Metadata API により、静的・動的メタデータ、Open Graph、Sitemap、Robots.txt を簡単に管理できます。

### 主な特徴

- **静的メタデータ** - layout.tsx や page.tsx で定義
- **動的メタデータ** - generateMetadata() 関数で生成
- **Open Graph 画像** - ImageResponse で動的生成
- **Sitemap/Robots.txt** - ファイルベースで自動生成
- **型安全性** - TypeScript による完全な型サポート

---

## 📝 静的メタデータ

### 1. ルートレイアウト (app/layout.tsx)

```typescript
import { Metadata } from "next";

export const metadata: Metadata = {
  title: {
    default: "Next.js 16 学習サンドボックス",
    template: "%s | Next.js 16 Sandbox",
  },
  description:
    "Next.js 16 の新機能を学ぶための実践的なサンドボックスプロジェクト",
  keywords: ["Next.js", "React", "TypeScript", "Server Actions"],
  authors: [{ name: "Next.js Learner" }],
  creator: "Next.js Learner",
  metadataBase: new URL("http://localhost:3000"),
  openGraph: {
    title: "Next.js 16 学習サンドボックス",
    description:
      "Next.js 16 の新機能を学ぶための実践的なサンドボックスプロジェクト",
    url: "http://localhost:3000",
    siteName: "Next.js 16 Sandbox",
    locale: "ja_JP",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Next.js 16 学習サンドボックス",
    description:
      "Next.js 16 の新機能を学ぶための実践的なサンドボックスプロジェクト",
    creator: "@nextjs_learner",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};
```

**ポイント:**

- `metadataBase` を設定することで、相対 URL が自動的に絶対 URL に変換される
- `template` を使うことで、子ページのタイトルが自動的にフォーマットされる
- Open Graph と Twitter Card 両方を設定することで、SNS シェアに対応

---

### 2. ページレベルメタデータ

```typescript
// app/blog/page.tsx
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "ブログ",
  description: "Next.js 16 の機能や実装パターンについて解説するブログ記事一覧",
};
```

**結果:**

- タイトル: "ブログ | Next.js 16 Sandbox" (layout.tsx の template が適用)
- description: ページ固有の説明文

---

## 🔄 動的メタデータ

### 1. generateMetadata() 関数

```typescript
// app/blog/[slug]/page.tsx
import { Metadata } from "next";

type Props = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPost(slug); // データ取得

  if (!post) {
    return {
      title: "記事が見つかりません",
    };
  }

  return {
    title: post.title,
    description: post.description,
    keywords: post.tags,
    authors: [{ name: post.author }],
    openGraph: {
      title: post.title,
      description: post.description,
      type: "article",
      publishedTime: post.publishedAt,
      authors: [post.author],
      tags: post.tags,
      images: post.image
        ? [
            {
              url: post.image,
              width: 1200,
              height: 630,
              alt: post.title,
            },
          ]
        : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title: post.title,
      description: post.description,
      images: post.image ? [post.image] : undefined,
    },
  };
}
```

**特徴:**

- 各記事ごとに異なるメタデータを生成
- データベースや CMS からデータを取得可能
- 記事固有の Open Graph 画像を設定

---

### 2. 静的生成との組み合わせ

```typescript
export async function generateStaticParams() {
  const posts = await getAllPosts();

  return posts.map((post) => ({
    slug: post.slug,
  }));
}
```

**利点:**

- ビルド時に全ページのメタデータを生成
- 高速なページ表示
- SEO に最適

---

## 🖼️ Open Graph 画像生成

### 1. 静的 OG 画像 (app/opengraph-image.tsx)

```typescript
import { ImageResponse } from "next/og";

export const size = {
  width: 1200,
  height: 630,
};

export const contentType = "image/png";

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          fontSize: 64,
          background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "white",
        }}
      >
        <div>Next.js 16 学習サンドボックス</div>
      </div>
    ),
    { ...size }
  );
}
```

**結果:**

- `/opengraph-image` で画像にアクセス可能
- 自動的に Open Graph メタタグに追加される

---

### 2. 動的 OG 画像 (app/blog/[slug]/opengraph-image.tsx)

```typescript
import { ImageResponse } from "next/og";

export default async function Image({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = await getPost(slug);

  return new ImageResponse(
    (
      <div
        style={{
          fontSize: 48,
          background: "white",
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div style={{ fontSize: 64, fontWeight: "bold" }}>{post.title}</div>
        <div style={{ fontSize: 32, marginTop: 20, color: "#666" }}>
          {post.author}
        </div>
      </div>
    ),
    { width: 1200, height: 630 }
  );
}
```

**ポイント:**

- 記事ごとに異なる画像を生成
- タイトルや著者名を動的に表示
- SNS シェア時に記事固有の画像が表示される

---

## 🗺️ Sitemap 生成

### app/sitemap.ts

```typescript
import { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = "http://localhost:3000";

  // 静的ページ
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1,
    },
    {
      url: `${baseUrl}/blog`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.8,
    },
  ];

  // 動的ページ（ブログ記事）
  const blogPosts: MetadataRoute.Sitemap = [
    {
      url: `${baseUrl}/blog/nextjs-16-introduction`,
      lastModified: new Date("2025-11-08"),
      changeFrequency: "monthly",
      priority: 0.7,
    },
    // ... 他の記事
  ];

  return [...staticPages, ...blogPosts];
}
```

**結果:**

- `/sitemap.xml` で XML Sitemap にアクセス可能
- 検索エンジンが効率的にクロール
- 最終更新日や優先度を指定可能

**priority の目安:**

- 1.0: トップページ
- 0.8-0.9: 主要なカテゴリページ
- 0.6-0.7: 個別記事ページ
- 0.5 以下: その他のページ

**changeFrequency の目安:**

- `always`: 毎回変わるページ（ほぼ使わない）
- `hourly`: ニュースサイトのトップ
- `daily`: ブログトップ
- `weekly`: 通常のブログ記事
- `monthly`: アーカイブページ
- `yearly`: 固定ページ
- `never`: 変更されないページ

---

## 🤖 Robots.txt 生成

### app/robots.ts

```typescript
import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = "http://localhost:3000";

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/api/", // API エンドポイント
          "/admin/", // 管理画面
          "/*?*", // クエリパラメータ付きURL
        ],
      },
      {
        userAgent: "Googlebot",
        allow: "/",
        disallow: ["/api/", "/admin/"],
        crawlDelay: 0,
      },
      {
        userAgent: "Bingbot",
        allow: "/",
        disallow: ["/api/", "/admin/"],
        crawlDelay: 1,
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
```

**結果:**

- `/robots.txt` でアクセス可能
- クローラーの動作を制御
- Sitemap へのリンクを含む

**ポイント:**

- `userAgent: "*"` は全クローラーに適用
- `disallow` でクロール不要なパスを指定
- `crawlDelay` でクロール速度を調整

---

## 💡 ベストプラクティス

### 1. メタデータの優先度

```
動的メタデータ > ページメタデータ > レイアウトメタデータ
```

子ページのメタデータが親のメタデータを上書きします。

---

### 2. metadataBase の設定

```typescript
// 本番環境では環境変数を使用
export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"
  ),
};
```

**理由:**

- Open Graph や Twitter Card で絶対 URL が必要
- 環境ごとに異なる URL に対応

---

### 3. Open Graph 画像のサイズ

**推奨サイズ:**

- 1200 x 630 px（Facebook、Twitter 推奨）
- 最小: 600 x 315 px
- アスペクト比: 1.91:1

**ファイルサイズ:**

- 8MB 以下（Facebook 制限）
- できるだけ軽量に（1MB 以下推奨）

---

### 4. title の最適な長さ

**Google:**

- デスクトップ: 60 文字程度
- モバイル: 40 文字程度

**Twitter:**

- 70 文字程度

**Facebook:**

- 60-90 文字

---

### 5. description の最適な長さ

**Google:**

- 120-156 文字（デスクトップ）
- 120 文字以下（モバイル）

**ポイント:**

- 最初の 120 文字に重要な情報を含める
- Call to Action を含めると効果的

---

## 🔍 SEO チェックリスト

### 必須項目

- [x] title タグが全ページに設定されている
- [x] description が全ページに設定されている
- [x] Open Graph メタタグが設定されている
- [x] Twitter Card メタタグが設定されている
- [x] sitemap.xml が生成されている
- [x] robots.txt が設定されている
- [x] canonical URL が設定されている（必要に応じて）

### 推奨項目

- [x] metadataBase が設定されている
- [x] keywords が適切に設定されている
- [x] 構造化データ（JSON-LD）を追加（必要に応じて）
- [x] OG 画像が設定されている
- [x] favicon が設定されている

---

## 🚀 実装済みファイル

### プロジェクト内の実装

```
next16-sandbox/
├── app/
│   ├── layout.tsx              # ルートメタデータ
│   ├── sitemap.ts              # Sitemap生成
│   ├── robots.ts               # Robots.txt生成
│   ├── opengraph-image.tsx     # ルートOG画像
│   ├── blog/
│   │   ├── page.tsx            # ブログ一覧（静的メタデータ）
│   │   └── [slug]/
│   │       └── page.tsx        # ブログ記事（動的メタデータ）
│   └── ...
```

### アクセス方法

- **Sitemap**: http://localhost:3000/sitemap.xml
- **Robots**: http://localhost:3000/robots.txt
- **OG 画像**: http://localhost:3000/opengraph-image
- **ブログ**: http://localhost:3000/blog

---

## 📊 SEO 効果測定

### Google Search Console

1. サイトを登録
2. Sitemap を送信
3. インデックス状況を確認
4. 検索パフォーマンスを分析

### 確認ツール

- **Google Rich Results Test**: 構造化データの確認
- **Facebook Sharing Debugger**: OG 画像の確認
- **Twitter Card Validator**: Twitter Card の確認
- **Lighthouse**: SEO スコアの測定

---

## 📚 参考リンク

- [Next.js Metadata API](https://nextjs.org/docs/app/api-reference/functions/generate-metadata)
- [Open Graph Protocol](https://ogp.me/)
- [Twitter Cards](https://developer.twitter.com/en/docs/twitter-for-websites/cards/overview/abouts-cards)
- [Google SEO Starter Guide](https://developers.google.com/search/docs/beginner/seo-starter-guide)

---

## 🎓 学習のポイント

1. **静的 vs 動的メタデータ** - 適切な使い分け
2. **Open Graph** - SNS シェア最適化
3. **Sitemap/Robots** - 検索エンジン最適化
4. **型安全性** - TypeScript による安全な実装
5. **パフォーマンス** - 静的生成とキャッシング

---

**作成日**: 2025-11-08
**Phase 1.5**: Metadata API (SEO) 実装完了
