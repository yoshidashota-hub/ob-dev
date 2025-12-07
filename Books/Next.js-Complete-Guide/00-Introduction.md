# 00 - Introduction

## 概要

この章では、Next.js の基本概念と、なぜ Next.js を選ぶべきかについて説明します。

## このガイドについて

### 対象読者

- React の基本を理解している開発者
- モダンな Web アプリケーションを構築したい開発者
- パフォーマンスと SEO を重視するプロジェクトに携わる開発者

### 前提知識

- React の基礎（コンポーネント、Props、State、Hooks）
- JavaScript/TypeScript の基本
- HTML と CSS の理解
- Node.js と npm の使い方

### 学習目標

このガイドを完了すると、以下のことができるようになります:

- [ ] Next.js App Router を使った最新のアプリケーションを構築できる
- [ ] Server Components と Client Components を適切に使い分けられる
- [ ] データフェッチングとキャッシング戦略を実装できる
- [ ] 本番環境にデプロイできる高品質なアプリケーションを開発できる

## Next.js とは

### 定義

Next.js は、Vercel が開発した **React ベースのフルスタックフレームワーク**です。React だけでは実現しにくい機能を簡単に実装できます。

```typescript
// Pure React
import React from "react";
import ReactDOM from "react-dom";

function App() {
  return <h1>Hello React</h1>;
}

ReactDOM.render(<App />, document.getElementById("root"));
```

```typescript
// Next.js - より簡単に!
export default function Home() {
  return <h1>Hello Next.js</h1>;
}
// ルーティング、最適化、デプロイが自動で設定される
```

### 主要な特徴

#### 1. App Router（最新）

ファイルベースのルーティングシステム:

```
app/
├── page.tsx              → /
├── about/page.tsx        → /about
├── blog/
│   ├── page.tsx          → /blog
│   └── [slug]/page.tsx   → /blog/:slug
```

#### 2. Server Components

デフォルトでサーバーサイドレンダリング:

```typescript
// Server Component（デフォルト）
async function BlogPost({ params }: { params: { id: string } }) {
  const post = await fetchPost(params.id); // サーバーで実行
  return <article>{post.content}</article>;
}
```

#### 3. Server Actions

サーバーサイドロジックを簡単に実装:

```typescript
"use server";

export async function createPost(formData: FormData) {
  // サーバーでのみ実行される
  const title = formData.get("title");
  await db.posts.create({ title });
}
```

#### 4. 自動最適化

- 画像の自動最適化
- フォントの自動最適化
- コード分割
- プリフェッチング

## なぜ Next.js を選ぶのか

### 1. パフォーマンス

#### Pure React の課題

```typescript
// CSR（Client-Side Rendering）のみ
// - 初期表示が遅い
// - SEO に不利
function App() {
  const [data, setData] = useState(null);

  useEffect(() => {
    fetch("/api/data")
      .then((res) => res.json())
      .then(setData);
  }, []);

  if (!data) return <div>Loading...</div>;
  return <div>{data.content}</div>;
}
```

#### Next.js の解決策

```typescript
// SSR（Server-Side Rendering）
// - 初期表示が高速
// - SEO に有利
async function Page() {
  const data = await fetch("/api/data").then((res) => res.json());
  return <div>{data.content}</div>;
}
```

### 2. SEO の強化

#### メタデータの簡単な設定

```typescript
// app/blog/[slug]/page.tsx
export async function generateMetadata({ params }) {
  const post = await getPost(params.slug);

  return {
    title: post.title,
    description: post.excerpt,
    openGraph: {
      images: [post.coverImage],
    },
  };
}
```

### 3. 開発体験（DX）

- **ファイルベースルーティング**: ルーティング設定不要
- **TypeScript**: 標準でサポート
- **Hot Reload**: 高速な開発サイクル
- **エラー表示**: 詳細なエラーメッセージ

### 4. デプロイの簡単さ

```bash
# Vercel へのデプロイ（ゼロコンフィグ）
npx vercel
```

### 5. フルスタック開発

```typescript
// app/api/posts/route.ts
export async function GET() {
  const posts = await db.posts.findMany();
  return Response.json(posts);
}

export async function POST(request: Request) {
  const body = await request.json();
  const post = await db.posts.create({ data: body });
  return Response.json(post);
}
```

## Next.js vs 他のフレームワーク

### Next.js vs Create React App

| 項目         | Create React App    | Next.js        |
| ------------ | ------------------- | -------------- |
| レンダリング | CSR のみ            | SSR/SSG/ISR    |
| ルーティング | React Router が必要 | ファイルベース |
| SEO          | 不利                | 有利           |
| API ルート   | なし                | あり           |
| 画像最適化   | 手動                | 自動           |
| デプロイ     | 設定必要            | ゼロコンフィグ |

### Next.js vs Remix

| 項目           | Remix          | Next.js           |
| -------------- | -------------- | ----------------- |
| ルーティング   | ファイルベース | ファイルベース    |
| データフェッチ | Loader         | Server Components |
| フォーム       | Action         | Server Actions    |
| コミュニティ   | 成長中         | 巨大              |
| ホスティング   | 柔軟           | Vercel 推奨       |

### Next.js vs Gatsby

| 項目         | Gatsby           | Next.js      |
| ------------ | ---------------- | ------------ |
| 主な用途     | 静的サイト       | フルスタック |
| ビルド時間   | 長い（大規模時） | 短い         |
| データソース | GraphQL          | 柔軟         |
| 動的ルート   | 制限あり         | 柔軟         |

## App Router vs Pages Router

Next.js には 2 つのルーティングシステムがあります:

### Pages Router（旧）

```typescript
// pages/index.tsx
export default function Home() {
  return <h1>Home</h1>;
}

export async function getServerSideProps() {
  const data = await fetchData();
  return { props: { data } };
}
```

### App Router（新・推奨）

```typescript
// app/page.tsx
async function Home() {
  const data = await fetchData();
  return <h1>Home</h1>;
}
```

**このガイドでは App Router のみを扱います。**

## Next.js のレンダリング戦略

### 1. Server-Side Rendering (SSR)

リクエストごとにサーバーで HTML を生成:

```typescript
// 動的データ - キャッシュなし
async function Page() {
  const data = await fetch("https://api.example.com/data", {
    cache: "no-store",
  });
  return <div>{data}</div>;
}
```

### 2. Static Site Generation (SSG)

ビルド時に HTML を生成:

```typescript
// 静的データ - ビルド時に生成
async function Page() {
  const data = await fetch("https://api.example.com/data", {
    cache: "force-cache",
  });
  return <div>{data}</div>;
}
```

### 3. Incremental Static Regeneration (ISR)

静的ページを定期的に再生成:

```typescript
// 一定時間ごとに再生成
async function Page() {
  const data = await fetch("https://api.example.com/data", {
    next: { revalidate: 3600 }, // 1時間ごと
  });
  return <div>{data}</div>;
}
```

## Next.js のエコシステム

### 公式ツール

- **Vercel**: デプロイプラットフォーム
- **Next.js Image**: 画像最適化
- **Next.js Font**: フォント最適化
- **Next.js Analytics**: パフォーマンス分析

### 人気のライブラリ

- **認証**: NextAuth.js, Clerk
- **データベース**: Prisma, Drizzle
- **スタイリング**: Tailwind CSS, CSS Modules
- **状態管理**: Zustand, Jotai
- **フォーム**: React Hook Form, Zod

## 学習ロードマップ

```
基礎編
├── 環境構築
├── App Router の基本
├── ルーティング
└── レイアウト

コンポーネント編
├── Server Components
├── Client Components
└── 構成パターン

データフェッチング編
├── データ取得
├── キャッシング
├── ストリーミング
└── Server Actions

高度な機能編
├── メタデータ/SEO
├── 画像とフォントの最適化
├── API ルート
└── ミドルウェア

実践編
├── 認証
├── データベース
├── デプロイ
├── パフォーマンス最適化
└── ベストプラクティス
```

## よくある質問

### Q: React の経験がなくても学べますか?

A: いいえ、React の基礎知識が必要です。まず React を学習してから Next.js に進むことをお勧めします。

### Q: Pages Router は学ぶべきですか?

A: 新規プロジェクトでは App Router を使用してください。既存のコードを保守する場合のみ Pages Router の知識が必要です。

### Q: Vercel 以外にデプロイできますか?

A: はい、Docker を使えば任意のホスティングサービスにデプロイできます。

### Q: TypeScript は必須ですか?

A: 必須ではありませんが、強く推奨します。このガイドではすべて TypeScript を使用します。

## まとめ

- Next.js は React ベースのフルスタックフレームワーク
- App Router が最新の推奨ルーティングシステム
- SSR/SSG/ISR による柔軟なレンダリング
- パフォーマンスと SEO に優れている
- 豊富なエコシステムと簡単なデプロイ

## 次のステップ

次の章では、Next.js の環境構築と最初のプロジェクトを作成します。

➡️ 次へ: [01-Getting-Started.md](./01-Getting-Started.md)
