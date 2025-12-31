# 18 - Deployment

## 概要

この章では、Next.js アプリケーションのデプロイについて学びます。Vercel へのデプロイ、環境変数の設定、CI/CD パイプラインなどを解説します。

## Vercel へのデプロイ

### GitHub 連携

1. [Vercel](https://vercel.com) にサインアップ
2. GitHub アカウントを連携
3. リポジトリをインポート
4. デプロイ設定を確認
5. Deploy をクリック

### Vercel CLI

```bash
# CLI のインストール
npm install -g vercel

# ログイン
vercel login

# デプロイ
vercel

# 本番デプロイ
vercel --prod
```

### プロジェクト設定

```json
// vercel.json
{
  "buildCommand": "npm run build",
  "outputDirectory": ".next",
  "framework": "nextjs",
  "regions": ["hnd1"],
  "functions": {
    "app/**/*.ts": {
      "maxDuration": 30
    }
  }
}
```

## 環境変数

### Vercel での設定

1. プロジェクト設定 → Environment Variables
2. 変数名と値を入力
3. 環境を選択（Production, Preview, Development）

### 環境変数の種類

```bash
# .env.local（開発用）
DATABASE_URL=postgresql://localhost:5432/mydb
API_KEY=dev-api-key

# .env.production（本番用）- Vercel で設定
DATABASE_URL=postgresql://prod-server/mydb
API_KEY=prod-api-key
```

### Vercel CLI での設定

```bash
# 環境変数を追加
vercel env add DATABASE_URL

# 環境変数を一覧
vercel env ls

# 環境変数を取得
vercel env pull .env.local
```

### クライアント公開変数

```bash
# NEXT_PUBLIC_ プレフィックスでクライアントに公開
NEXT_PUBLIC_API_URL=https://api.example.com
```

## ビルド設定

### next.config.ts

```typescript
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 出力モード
  output: "standalone", // Docker 用

  // 画像最適化
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.example.com",
      },
    ],
  },

  // リダイレクト
  async redirects() {
    return [
      {
        source: "/old-page",
        destination: "/new-page",
        permanent: true,
      },
    ];
  },

  // ヘッダー
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "X-Frame-Options",
            value: "DENY",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
```

### ビルドコマンド

```bash
# ビルド
npm run build

# ビルドの確認
npm run start
```

## プレビューデプロイ

### PR ごとのプレビュー

Vercel は PR ごとに自動的にプレビュー URL を生成します:

```plaintext
https://project-name-git-branch-name-username.vercel.app
```

### コメントでのプレビュー

Vercel GitHub App が PR にプレビュー URL をコメントします。

## ドメイン設定

### カスタムドメイン

1. プロジェクト設定 → Domains
2. ドメインを追加
3. DNS 設定を確認

### DNS 設定

```plaintext
# A レコード
@ → 76.76.21.21

# CNAME レコード
www → cname.vercel-dns.com
```

### SSL 証明書

Vercel は自動的に SSL 証明書を発行します（Let's Encrypt）。

## CI/CD

### GitHub Actions

```yaml
# .github/workflows/ci.yml
name: CI

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: "20"
          cache: "npm"

      - name: Install dependencies
        run: npm ci

      - name: Run linter
        run: npm run lint

      - name: Run type check
        run: npm run type-check

      - name: Run tests
        run: npm run test

      - name: Build
        run: npm run build
```

### デプロイ前チェック

```json
// package.json
{
  "scripts": {
    "build": "next build",
    "lint": "next lint",
    "type-check": "tsc --noEmit",
    "test": "jest",
    "precommit": "npm run lint && npm run type-check"
  }
}
```

## Docker デプロイ

### Dockerfile

```dockerfile
# Dockerfile
FROM node:20-alpine AS base

# 依存関係のインストール
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

# ビルド
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

# 本番イメージ
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "server.js"]
```

### docker-compose.yml

```yaml
version: "3.8"
services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - DATABASE_URL=postgresql://postgres:password@db:5432/mydb
    depends_on:
      - db

  db:
    image: postgres:15
    environment:
      - POSTGRES_PASSWORD=password
      - POSTGRES_DB=mydb
    volumes:
      - postgres_data:/var/lib/postgresql/data

volumes:
  postgres_data:
```

### standalone 出力

```typescript
// next.config.ts
const nextConfig: NextConfig = {
  output: "standalone",
};
```

## 静的エクスポート

### 設定

```typescript
// next.config.ts
const nextConfig: NextConfig = {
  output: "export",
};
```

### 制限事項

静的エクスポートでは以下が使えません:

- 動的ルート（generateStaticParams なし）
- Server Actions
- ミドルウェア
- ISR

### ビルドと配信

```bash
npm run build
# out/ ディレクトリに静的ファイルが生成される
```

## モニタリング

### Vercel Analytics

```typescript
// app/layout.tsx
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

### Speed Insights

```typescript
// app/layout.tsx
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

## トラブルシューティング

### ビルドエラー

```bash
# ローカルでビルドを確認
npm run build

# 型チェック
npm run type-check

# Lint チェック
npm run lint
```

### 環境変数の問題

```bash
# Vercel から環境変数を取得
vercel env pull .env.local

# 環境変数を確認
vercel env ls
```

### デプロイログ

Vercel ダッシュボードの Deployments タブでログを確認できます。

## まとめ

- **Vercel** は Next.js の最適なデプロイ先
- **GitHub 連携**で自動デプロイ
- **環境変数**は Vercel で管理
- **プレビューデプロイ**で PR ごとに確認
- **Docker** で他のプラットフォームにもデプロイ可能
- **静的エクスポート**で CDN 配信

## 演習問題

1. Vercel にアプリをデプロイしてください
2. 環境変数を設定してください
3. カスタムドメインを設定してください
4. GitHub Actions で CI を設定してください

## 次のステップ

次の章では、パフォーマンス最適化について学びます。

⬅️ 前へ: [17-Database-Integration.md](./17-Database-Integration.md)
➡️ 次へ: [19-Performance-Optimization.md](./19-Performance-Optimization.md)
