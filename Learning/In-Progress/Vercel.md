---
created: 2025-11-10
tags: [learning, vercel, deployment, nextjs, cloud, hosting]
status: 進行中
topic: Vercel
source: https://vercel.com/docs
---

# Vercel

## 概要

Vercel は、モダンな Web アプリケーションの構築とデプロイに特化したクラウドプラットフォーム。Next.js の開発元が提供しており、フロントエンド開発者向けに最適化された AI-First Infrastructure を提供している。

## 学んだこと

### 🌟 Vercel とは

**AI Cloud for Building and Deploying Modern Web Applications**

Vercel は、静的サイトから AI エージェントまで、あらゆる種類のアプリケーションをホスティングできるプラットフォーム。

**主要な特徴:**

- **ゼロコンフィグデプロイ**: Git と連携するだけで自動デプロイ
- **グローバル CDN**: 世界中で高速配信
- **プレビューデプロイメント**: PR ごとに自動デプロイ
- **自動 HTTPS/SSL**: 証明書管理不要
- **Edge Functions**: エッジで実行される関数
- **AI-First Infrastructure**: v0、AI SDK、AI Gateway など

**他のホスティングとの違い:**

| 項目 | Vercel | Netlify | AWS Amplify |
|------|--------|---------|-------------|
| Next.js 統合 | ネイティブ | 良好 | 良好 |
| プレビューデプロイ | 標準 | 標準 | 制限あり |
| Edge Functions | あり | あり | Lambda@Edge |
| 無料枠 | 充実 | 充実 | 従量課金 |
| セットアップ | 最も簡単 | 簡単 | 複雑 |

### 📦 デプロイ方法

#### 1. Git 連携（推奨）

**最も一般的な方法。** GitHub、GitLab、Bitbucket と連携可能。

**流れ:**

1. Vercel にリポジトリを接続
2. ブランチを指定（通常は `main` または `master`）
3. 自動的にビルド設定を検出
4. プッシュごとに自動デプロイ

**メリット:**

- プルリクエストごとにプレビュー環境が自動生成
- マージ時に本番環境が自動更新
- ロールバックが簡単

#### 2. Vercel CLI

**コマンドラインからデプロイ。**

```bash
# インストール
npm i -g vercel

# ログイン
vercel login

# デプロイ
vercel

# 本番環境にデプロイ
vercel --prod
```

**使用ケース:**

- ローカルからの手動デプロイ
- CI/CD パイプラインでの使用
- スクリプトでの自動化

#### 3. Vercel API

**プログラムからデプロイを制御。**

```javascript
const response = await fetch('https://api.vercel.com/v13/deployments', {
  method: 'POST',
  headers: {
    Authorization: `Bearer ${process.env.VERCEL_TOKEN}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    name: 'my-project',
    gitSource: {
      type: 'github',
      repo: 'username/repo',
      ref: 'main',
    },
  }),
});
```

### ⚙️ 設定ファイル（vercel.json）

**プロジェクトの動作をカスタマイズ。**

```json
{
  "buildCommand": "npm run build",
  "outputDirectory": ".next",
  "devCommand": "npm run dev",
  "installCommand": "npm install",
  "framework": "nextjs",
  "env": {
    "DATABASE_URL": "@database-url"
  },
  "build": {
    "env": {
      "NEXT_PUBLIC_API_URL": "https://api.example.com"
    }
  },
  "regions": ["iad1", "sfo1"],
  "headers": [
    {
      "source": "/api/(.*)",
      "headers": [
        {
          "key": "Cache-Control",
          "value": "s-maxage=3600, stale-while-revalidate"
        }
      ]
    }
  ],
  "redirects": [
    {
      "source": "/old-path",
      "destination": "/new-path",
      "permanent": true
    }
  ],
  "rewrites": [
    {
      "source": "/api/:path*",
      "destination": "https://backend.example.com/:path*"
    }
  ]
}
```

**主要な設定項目:**

- `buildCommand`: ビルドコマンド
- `outputDirectory`: ビルド出力先
- `env`: 環境変数
- `regions`: デプロイ先リージョン
- `headers`: HTTP ヘッダー設定
- `redirects`: リダイレクト設定
- `rewrites`: リライト設定

### 🔐 環境変数

**3 種類の環境:**

- **Production**: 本番環境（`main` ブランチ）
- **Preview**: プレビュー環境（PR）
- **Development**: ローカル開発

**設定方法:**

1. **Vercel Dashboard**: プロジェクト設定から追加
2. **Vercel CLI**:

```bash
vercel env add DATABASE_URL
```

3. **.env.local**: ローカル開発用

```bash
# ローカルに環境変数をダウンロード
vercel env pull .env.local
```

**システム環境変数（自動設定）:**

- `VERCEL`: `"1"` (Vercel 上で実行中)
- `VERCEL_ENV`: `"production"` | `"preview"` | `"development"`
- `VERCEL_URL`: デプロイ URL
- `VERCEL_GIT_COMMIT_SHA`: コミット SHA

### 🚀 Next.js との統合

**Vercel は Next.js の開発元が提供しているため、最も最適化されたホスティング環境。**

#### Next.js 固有の機能

**1. Turbopack のネイティブサポート**

Next.js 16 の Turbopack が完全にサポートされており、高速ビルドが可能。

**2. Edge Runtime**

Next.js の Edge Runtime が Vercel Edge Network 上で実行される。

```typescript
// app/api/edge/route.ts
export const runtime = 'edge';

export async function GET(request: Request) {
  return new Response('Hello from the edge!');
}
```

**3. Incremental Static Regeneration (ISR)**

ISR が完全にサポートされており、静的ページを定期的に再生成できる。

```typescript
// app/posts/[id]/page.tsx
export const revalidate = 60; // 60秒ごとに再生成

export default async function Post({ params }) {
  const post = await getPost(params.id);
  return <article>{post.content}</article>;
}
```

**4. Image Optimization**

Next.js の `next/image` が Vercel の Image Optimization で最適化される。

```typescript
import Image from 'next/image';

<Image
  src="/photo.jpg"
  width={800}
  height={600}
  alt="Photo"
  priority
/>
```

**5. Middleware**

Next.js Middleware が Vercel Edge Network 上で実行される。

```typescript
// middleware.ts
import { NextResponse } from 'next/server';

export function middleware(request: Request) {
  return NextResponse.next();
}
```

#### ビルド設定

**自動検出:**

Vercel は `package.json` を読み取り、自動的に最適なビルド設定を適用。

```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start"
  }
}
```

**カスタムビルド:**

```json
{
  "framework": "nextjs",
  "buildCommand": "npm run build",
  "outputDirectory": ".next"
}
```

#### Functions

**Vercel Functions は Next.js API Routes と統合。**

- **Serverless Functions**: 各 API Route が独立した関数として実行
- **Edge Functions**: Edge Runtime で実行される関数
- **自動スケーリング**: トラフィックに応じて自動的にスケール

**制限:**

- Serverless Functions: 50MB（Hobby）、250MB（Pro）
- Edge Functions: 1MB（コード + 依存関係）
- 実行時間: 10 秒（Hobby）、60 秒（Pro）

### 🌐 Edge Functions 3.0

**2025 年の最新リリース。グローバルレイテンシ 100ms 以下を実現。**

**主要な改善:**

- **コールドスタート時間 50% 短縮**: 頻繁に呼ばれる関数で高速化
- **大容量メモリ**: 関数あたり最大 4GB まで割り当て可能
- **Vercel Blob Storage**: Edge での永続的なファイルストレージ
- **データベース統合**: PostgreSQL、Redis などの統合サポート

**使用例:**

```typescript
// app/api/hello/route.ts
export const runtime = 'edge';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const name = searchParams.get('name') || 'World';

  return new Response(`Hello, ${name}!`, {
    status: 200,
    headers: {
      'Content-Type': 'text/plain',
    },
  });
}
```

**Edge Middleware:**

```typescript
// middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // 地理情報に基づいてリダイレクト
  const country = request.geo?.country;

  if (country === 'JP') {
    return NextResponse.redirect(new URL('/ja', request.url));
  }

  return NextResponse.next();
}
```

### 📊 Web Analytics

**プライバシー重視の分析ツール。** Cookie 不要で GDPR 準拠。

**2025 年の価格改定（79% 値下げ）:**

- **従来**: $14 per 100K events
- **現在**: $3 per 100K events ($0.00003 per event)

**プラン別の無料枠:**

| プラン | 無料枠 | 以前 | 増加率 |
|--------|--------|------|--------|
| Hobby | 50K events/月 | 2.5K | 20 倍 |
| Pro | 100K events/月 | 25K | 4 倍 |

**機能:**

- リアルタイム分析
- ページビュー、訪問者数
- トラフィックソース
- デバイス、ブラウザ情報
- Core Web Vitals（LCP、FID、CLS）

**Web Analytics Plus（Pro プラン限定）:**

- $10/月（以前は $50/月）
- 拡張レポート期間
- より詳細なデータ

**有効化:**

```typescript
// next.config.js
module.exports = {
  analytics: {
    id: 'your-analytics-id',
  },
};
```

### 🔄 プレビューデプロイメント

**プルリクエストごとに自動生成される一時的な環境。**

**特徴:**

- PR を作成すると自動的にデプロイ
- 独自の URL が発行される（例: `project-pr-123.vercel.app`）
- 本番環境と同じ設定で動作
- PR にデプロイ URL がコメントされる

**使用例:**

1. ブランチを作成してコードを変更
2. プルリクエストを作成
3. Vercel が自動的にビルド＆デプロイ
4. PR にプレビュー URL が表示される
5. レビュアーが実際の動作を確認できる
6. 変更をプッシュするたびに更新される

**メリット:**

- 本番環境に影響せずテストできる
- チーム全体で動作確認が容易
- クライアントにプレビューを共有できる
- 複数のブランチを並行してテスト可能

### 🌍 カスタムドメイン

**独自ドメインの追加と管理。**

**設定手順:**

1. Vercel Dashboard でドメインを追加
2. DNS レコードを設定（A レコードまたは CNAME）
3. 自動的に SSL 証明書が発行される

**DNS 設定例:**

```
# A レコード
Type: A
Name: @
Value: 76.76.21.21

# CNAME レコード（サブドメイン）
Type: CNAME
Name: www
Value: cname.vercel-dns.com
```

**複数ドメイン:**

- プロダクションドメイン: メインドメイン
- プレビュードメイン: ブランチごとのドメイン

### 🚦 Rolling Releases（2025 新機能）

**段階的なロールアウトでリスクを軽減。**

**特徴:**

- 一部のユーザーに新バージョンを配信
- 組み込みモニタリング
- カスタムルーティング不要
- 問題があれば即座にロールバック

**使用例:**

```typescript
// vercel.json
{
  "rollout": {
    "percentage": 10,
    "monitoring": true
  }
}
```

**段階的なロールアウト:**

1. 10% のユーザーに配信
2. エラー率をモニタリング
3. 問題なければ 25% に増加
4. 段階的に 50%、75%、100% に拡大

### 🛡️ セキュリティ機能

**2025 年の新機能: 高度な脅威保護**

**Bot ID（Kasada との提携）:**

- ボットの自動フィルタリング
- ユーザー操作不要（CAPTCHA なし）
- 不正アクセスの防止

**その他のセキュリティ:**

- DDoS 保護
- 自動 SSL/TLS 証明書
- WAF（Web Application Firewall）- Enterprise プラン
- 認証保護（Vercel Authentication）

### 💰 料金プラン（2025 年版）

**Hobby（無料）:**

- 個人プロジェクト向け
- 無制限のプロジェクト
- 100GB 帯域幅/月
- 6,000 ビルド分/月
- Web Analytics: 50K events/月

**Pro（$20/月）:**

- 商用プロジェクト向け
- チームコラボレーション
- 1TB 帯域幅/月
- 24,000 ビルド分/月
- Web Analytics: 100K events/月
- パスワード保護
- カスタムエラーページ

**Enterprise:**

- カスタム価格
- 専用サポート
- SLA
- SAML SSO
- WAF

## 実例・サンプルコード

### 基本的な Next.js プロジェクトのデプロイ

```bash
# 1. Next.js プロジェクトを作成
npx create-next-app@latest my-app
cd my-app

# 2. Git リポジトリを初期化
git init
git add .
git commit -m "Initial commit"

# 3. GitHub にプッシュ
gh repo create my-app --public --source=. --remote=origin
git push -u origin main

# 4. Vercel にデプロイ
vercel login
vercel --prod
```

### Environment Variables の使用

```typescript
// app/api/data/route.ts
export async function GET() {
  // 環境変数を使用
  const apiKey = process.env.API_KEY;
  const dbUrl = process.env.DATABASE_URL;

  const response = await fetch('https://api.example.com/data', {
    headers: {
      'Authorization': `Bearer ${apiKey}`,
    },
  });

  const data = await response.json();
  return Response.json(data);
}
```

### Edge Functions で地理情報を使用

```typescript
// app/api/geo/route.ts
export const runtime = 'edge';

export async function GET(request: Request) {
  // リクエストから地理情報を取得
  const { geo } = request as any;

  return Response.json({
    country: geo?.country,
    region: geo?.region,
    city: geo?.city,
    latitude: geo?.latitude,
    longitude: geo?.longitude,
  });
}
```

### Incremental Static Regeneration

```typescript
// app/posts/page.tsx
export const revalidate = 60; // 60秒ごとに再生成

async function getPosts() {
  const res = await fetch('https://api.example.com/posts', {
    next: { revalidate: 60 },
  });
  return res.json();
}

export default async function PostsPage() {
  const posts = await getPosts();

  return (
    <div>
      <h1>Posts</h1>
      {posts.map((post: any) => (
        <article key={post.id}>
          <h2>{post.title}</h2>
          <p>{post.excerpt}</p>
        </article>
      ))}
    </div>
  );
}
```

### Middleware で認証チェック

```typescript
// middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // 認証トークンをチェック
  const token = request.cookies.get('auth-token');

  // 保護されたルート
  if (request.nextUrl.pathname.startsWith('/dashboard')) {
    if (!token) {
      return NextResponse.redirect(new URL('/login', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*'],
};
```

### カスタムヘッダーとキャッシュ制御

```json
{
  "headers": [
    {
      "source": "/api/(.*)",
      "headers": [
        {
          "key": "Cache-Control",
          "value": "s-maxage=3600, stale-while-revalidate=86400"
        },
        {
          "key": "Access-Control-Allow-Origin",
          "value": "*"
        }
      ]
    },
    {
      "source": "/(.*).html",
      "headers": [
        {
          "key": "Cache-Control",
          "value": "public, max-age=31536000, immutable"
        }
      ]
    }
  ]
}
```

### リダイレクトとリライト

```json
{
  "redirects": [
    {
      "source": "/old-blog/:slug",
      "destination": "/blog/:slug",
      "permanent": true
    },
    {
      "source": "/docs",
      "destination": "/documentation",
      "permanent": false
    }
  ],
  "rewrites": [
    {
      "source": "/api/:path*",
      "destination": "https://backend.example.com/api/:path*"
    },
    {
      "source": "/images/:path*",
      "destination": "https://cdn.example.com/:path*"
    }
  ]
}
```

## 疑問点・次にやること

- [ ] Rolling Releases の実践的な使い方を試す
- [ ] Web Analytics Plus の詳細機能を確認
- [ ] Edge Functions でのデータベース接続パターンを調査
- [ ] Vercel Blob Storage の使用方法を学ぶ
- [ ] Monorepo での Vercel デプロイ戦略を調査
- [ ] Bot ID のセットアップと効果測定
- [ ] Enterprise プランの機能を詳しく調査

## 関連リンク

- [Vercel 公式ドキュメント](https://vercel.com/docs)
- [Vercel CLI リファレンス](https://vercel.com/docs/cli)
- [Next.js on Vercel](https://vercel.com/docs/frameworks/nextjs)
- [Edge Functions ドキュメント](https://vercel.com/docs/functions/edge-functions)
- [Vercel Ship 2025 Recap](https://vercel.com/blog/vercel-ship-2025-recap)
- [Pricing ページ](https://vercel.com/pricing)

## メモ

### Vercel を選ぶ理由

**Next.js との完璧な統合:**

- Vercel は Next.js の開発元なので、最も最適化されたホスティング環境
- 新機能が最も早くサポートされる
- トラブルシューティングが容易

**開発体験の向上:**

- Git プッシュだけで自動デプロイ
- プレビュー環境で安全にテスト
- ロールバックが簡単

**パフォーマンス:**

- グローバル CDN で高速配信
- Edge Functions で低レイテンシ
- 自動的な最適化

### 注意点

**コスト:**

- 帯域幅やビルド時間の制限に注意
- 大規模アプリケーションでは Pro プラン以上が必要
- Edge Functions の実行時間制限（10 秒）

**ベンダーロックイン:**

- Vercel 固有の機能に依存しすぎると移行が困難
- 可能な限り標準的な Next.js の機能を使用すべき

### ベストプラクティス

1. **環境変数の管理**: 機密情報は必ず環境変数に格納
2. **プレビューデプロイの活用**: 本番環境に影響せずテスト
3. **Edge Functions の適切な使用**: 低レイテンシが必要な場合のみ
4. **キャッシュ戦略**: ISR や Cache-Control を適切に設定
5. **モニタリング**: Web Analytics でパフォーマンスを監視

---

_最終更新: 2025-11-10_
