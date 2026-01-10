# 12 - Metadata and SEO

## 概要

この章では、Next.js でのメタデータ設定と SEO 最適化について学びます。検索エンジン最適化、OGP 設定、構造化データなど、Web サイトの発見性を高める方法を解説します。

## メタデータの基本

### 静的メタデータ

```typescript
// app/layout.tsx
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "My App",
  description: "Welcome to my awesome application",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja">
      <body>{children}</body>
    </html>
  );
}
```

### ページごとのメタデータ

```typescript
// app/about/page.tsx
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "About Us",
  description: "Learn more about our company",
};

export default function AboutPage() {
  return <h1>About Us</h1>;
}
```

## Metadata オブジェクト

### 基本的なフィールド

```typescript
import type { Metadata } from "next";

export const metadata: Metadata = {
  // 基本
  title: "Page Title",
  description: "Page description for search engines",

  // キーワード
  keywords: ["Next.js", "React", "TypeScript"],

  // 作者
  authors: [{ name: "John Doe", url: "https://example.com" }],

  // クリエイター
  creator: "John Doe",

  // パブリッシャー
  publisher: "My Company",

  // カテゴリー
  category: "technology",
};
```

### タイトルの設定

```typescript
import type { Metadata } from "next";

export const metadata: Metadata = {
  // 文字列
  title: "My Page",

  // テンプレート
  title: {
    default: "My App", // デフォルトタイトル
    template: "%s | My App", // 子ページ用テンプレート
    absolute: "Absolute Title", // テンプレートを無視
  },
};
```

```typescript
// app/layout.tsx
export const metadata: Metadata = {
  title: {
    default: "My App",
    template: "%s | My App",
  },
};

// app/about/page.tsx
export const metadata: Metadata = {
  title: "About", // → "About | My App"
};

// app/special/page.tsx
export const metadata: Metadata = {
  title: {
    absolute: "Special Page", // → "Special Page"（テンプレート無視）
  },
};
```

### メタデータベース

```typescript
// app/layout.tsx
import type { Metadata } from "next";

export const metadata: Metadata = {
  metadataBase: new URL("https://example.com"),
  alternates: {
    canonical: "/",
    languages: {
      "en-US": "/en-US",
      "ja-JP": "/ja-JP",
    },
  },
};
```

## 動的メタデータ

### generateMetadata

```typescript
// app/blog/[slug]/page.tsx
import type { Metadata } from "next";

interface Props {
  params: Promise<{ slug: string }>;
}

async function getPost(slug: string) {
  const res = await fetch(`https://api.example.com/posts/${slug}`);
  return res.json();
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPost(slug);

  return {
    title: post.title,
    description: post.excerpt,
    authors: [{ name: post.author.name }],
  };
}

export default async function BlogPost({ params }: Props) {
  const { slug } = await params;
  const post = await getPost(slug);
  return <article>{post.content}</article>;
}
```

### 親メタデータの継承

```typescript
// app/blog/[slug]/page.tsx
import type { Metadata, ResolvingMetadata } from "next";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata(
  { params }: Props,
  parent: ResolvingMetadata
): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPost(slug);

  // 親のメタデータを取得
  const previousImages = (await parent).openGraph?.images || [];

  return {
    title: post.title,
    openGraph: {
      images: [post.image, ...previousImages],
    },
  };
}
```

## Open Graph

### 基本設定

```typescript
import type { Metadata } from "next";

export const metadata: Metadata = {
  openGraph: {
    title: "My App",
    description: "Welcome to my app",
    url: "https://example.com",
    siteName: "My App",
    images: [
      {
        url: "https://example.com/og.png",
        width: 1200,
        height: 630,
        alt: "My App",
      },
    ],
    locale: "ja_JP",
    type: "website",
  },
};
```

### 記事タイプ

```typescript
// app/blog/[slug]/page.tsx
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPost(slug);

  return {
    openGraph: {
      title: post.title,
      description: post.excerpt,
      type: "article",
      publishedTime: post.publishedAt,
      modifiedTime: post.updatedAt,
      authors: [post.author.name],
      tags: post.tags,
      images: [
        {
          url: post.coverImage,
          width: 1200,
          height: 630,
          alt: post.title,
        },
      ],
    },
  };
}
```

## Twitter Cards

### 基本設定

```typescript
import type { Metadata } from "next";

export const metadata: Metadata = {
  twitter: {
    card: "summary_large_image",
    title: "My App",
    description: "Welcome to my app",
    images: ["https://example.com/og.png"],
    creator: "@username",
    site: "@site",
  },
};
```

### 動的 Twitter Cards

```typescript
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPost(slug);

  return {
    twitter: {
      card: "summary_large_image",
      title: post.title,
      description: post.excerpt,
      images: [post.coverImage],
    },
  };
}
```

## ファビコンとアイコン

### 静的ファイル

```plaintext
app/
├── icon.png          # /favicon.ico として提供
├── icon.svg          # SVG アイコン
├── apple-icon.png    # Apple Touch Icon
└── opengraph-image.png  # OG 画像
```

### メタデータで設定

```typescript
import type { Metadata } from "next";

export const metadata: Metadata = {
  icons: {
    icon: "/favicon.ico",
    shortcut: "/shortcut-icon.png",
    apple: "/apple-icon.png",
    other: {
      rel: "apple-touch-icon-precomposed",
      url: "/apple-touch-icon-precomposed.png",
    },
  },
};
```

### 複数サイズのアイコン

```typescript
export const metadata: Metadata = {
  icons: {
    icon: [
      { url: "/icon-16.png", sizes: "16x16", type: "image/png" },
      { url: "/icon-32.png", sizes: "32x32", type: "image/png" },
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [
      { url: "/apple-icon-180.png", sizes: "180x180", type: "image/png" },
    ],
  },
};
```

## 動的 OG 画像

### ImageResponse

```typescript
// app/api/og/route.tsx
import { ImageResponse } from "next/og";

export const runtime = "edge";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const title = searchParams.get("title") || "My App";

  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#1a1a1a",
          color: "#fff",
        }}
      >
        <div style={{ fontSize: 60, fontWeight: "bold" }}>{title}</div>
        <div style={{ fontSize: 30, marginTop: 20 }}>example.com</div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    }
  );
}
```

### opengraph-image.tsx

```typescript
// app/blog/[slug]/opengraph-image.tsx
import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "Blog Post";
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";

export default async function Image({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = await fetch(`https://api.example.com/posts/${slug}`).then((r) =>
    r.json()
  );

  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#000",
          color: "#fff",
          padding: 40,
        }}
      >
        <div style={{ fontSize: 48, fontWeight: "bold", textAlign: "center" }}>
          {post.title}
        </div>
        <div style={{ fontSize: 24, marginTop: 20, color: "#888" }}>
          {post.author.name}
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}
```

## 構造化データ（JSON-LD）

### 基本的な設定

```typescript
// app/page.tsx
export default function HomePage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "My App",
    url: "https://example.com",
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <main>
        <h1>Welcome</h1>
      </main>
    </>
  );
}
```

### 記事の構造化データ

```typescript
// app/blog/[slug]/page.tsx
export default async function BlogPost({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = await getPost(slug);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title,
    description: post.excerpt,
    image: post.coverImage,
    datePublished: post.publishedAt,
    dateModified: post.updatedAt,
    author: {
      "@type": "Person",
      name: post.author.name,
      url: post.author.url,
    },
    publisher: {
      "@type": "Organization",
      name: "My Blog",
      logo: {
        "@type": "ImageObject",
        url: "https://example.com/logo.png",
      },
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <article>
        <h1>{post.title}</h1>
        <div>{post.content}</div>
      </article>
    </>
  );
}
```

### 組織の構造化データ

```typescript
// app/layout.tsx
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "My Company",
    url: "https://example.com",
    logo: "https://example.com/logo.png",
    sameAs: [
      "https://twitter.com/mycompany",
      "https://github.com/mycompany",
      "https://linkedin.com/company/mycompany",
    ],
    contactPoint: {
      "@type": "ContactPoint",
      telephone: "+1-555-555-5555",
      contactType: "customer service",
    },
  };

  return (
    <html lang="ja">
      <body>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        {children}
      </body>
    </html>
  );
}
```

## robots.txt と sitemap.xml

### robots.txt

```typescript
// app/robots.ts
import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/admin/", "/private/"],
    },
    sitemap: "https://example.com/sitemap.xml",
  };
}
```

### sitemap.xml

```typescript
// app/sitemap.ts
import type { MetadataRoute } from "next";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const posts = await getPosts();

  const blogUrls = posts.map((post) => ({
    url: `https://example.com/blog/${post.slug}`,
    lastModified: post.updatedAt,
    changeFrequency: "weekly" as const,
    priority: 0.8,
  }));

  return [
    {
      url: "https://example.com",
      lastModified: new Date(),
      changeFrequency: "yearly",
      priority: 1,
    },
    {
      url: "https://example.com/about",
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.8,
    },
    ...blogUrls,
  ];
}
```

### 動的サイトマップ

```typescript
// app/sitemap.ts
import type { MetadataRoute } from "next";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = "https://example.com";

  // 静的ページ
  const staticPages = [
    { url: baseUrl, priority: 1 },
    { url: `${baseUrl}/about`, priority: 0.8 },
    { url: `${baseUrl}/contact`, priority: 0.5 },
  ];

  // ブログ記事
  const posts = await fetch(`${baseUrl}/api/posts`).then((r) => r.json());
  const blogPages = posts.map((post: { slug: string; updatedAt: string }) => ({
    url: `${baseUrl}/blog/${post.slug}`,
    lastModified: new Date(post.updatedAt),
    changeFrequency: "weekly" as const,
    priority: 0.7,
  }));

  // 商品ページ
  const products = await fetch(`${baseUrl}/api/products`).then((r) => r.json());
  const productPages = products.map(
    (product: { id: string; updatedAt: string }) => ({
      url: `${baseUrl}/products/${product.id}`,
      lastModified: new Date(product.updatedAt),
      changeFrequency: "daily" as const,
      priority: 0.9,
    })
  );

  return [...staticPages, ...blogPages, ...productPages];
}
```

## マニフェスト

```typescript
// app/manifest.ts
import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "My App",
    short_name: "App",
    description: "My awesome application",
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#000000",
    icons: [
      {
        src: "/icon-192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/icon-512.png",
        sizes: "512x512",
        type: "image/png",
      },
    ],
  };
}
```

## まとめ

- **metadata export** で静的メタデータを設定
- **generateMetadata** で動的メタデータを生成
- **Open Graph** でソーシャルシェアを最適化
- **構造化データ** で検索エンジンに情報を提供
- **robots.txt** と **sitemap.xml** でクロールを制御
- **動的 OG 画像** で視覚的なシェアを実現

## 演習問題

1. ブログ記事の動的メタデータを実装してください
2. 動的 OG 画像を生成してください
3. 構造化データを記事ページに追加してください
4. sitemap.xml を動的に生成してください

## 次のステップ

次の章では、画像とフォントの最適化について学びます。

⬅️ 前へ: [11-Server-Actions.md](./11-Server-Actions.md)
➡️ 次へ: [13-Image-and-Font-Optimization.md](./13-Image-and-Font-Optimization.md)
