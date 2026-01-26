# 14 - Deployment（デプロイ）

## この章で学ぶこと

- ビルドの最適化
- 各プラットフォームへのデプロイ
- CI/CD の設定
- 環境別の設定

## ビルドの準備

### プロダクションビルド

```bash
# ビルド
npm run build

# プレビュー
npm run preview
```

### ビルド出力の確認

```
dist/
├── index.html
├── assets/
│   ├── index-abc123.js      # メインバンドル
│   ├── vendor-def456.js     # ベンダーチャンク
│   ├── index-xyz789.css     # スタイル
│   └── logo-123abc.svg      # アセット
└── favicon.ico
```

## Vercel へのデプロイ

### 基本設定

```json
// vercel.json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "framework": "vite"
}
```

### 環境変数

```bash
# Vercel ダッシュボードで設定
# または CLI で設定
vercel env add VITE_API_URL production
```

### デプロイ

```bash
# Vercel CLI でデプロイ
npm install -g vercel
vercel

# 本番デプロイ
vercel --prod
```

### GitHub 連携

```yaml
# .github/workflows/vercel.yml
name: Vercel Production Deployment
on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: "20"
      - run: npm ci
      - run: npm run build
      - uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.ORG_ID }}
          vercel-project-id: ${{ secrets.PROJECT_ID }}
          vercel-args: "--prod"
```

## Netlify へのデプロイ

### 設定ファイル

```toml
# netlify.toml
[build]
  command = "npm run build"
  publish = "dist"

[build.environment]
  NODE_VERSION = "20"

# SPA のルーティング
[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200

# キャッシュ設定
[[headers]]
  for = "/assets/*"
  [headers.values]
    Cache-Control = "public, max-age=31536000, immutable"
```

### デプロイ

```bash
# Netlify CLI
npm install -g netlify-cli
netlify deploy

# 本番デプロイ
netlify deploy --prod
```

## Cloudflare Pages

### 設定

```toml
# wrangler.toml
name = "my-vite-app"
compatibility_date = "2024-01-01"

[site]
bucket = "./dist"
```

### デプロイ

```bash
# Wrangler CLI
npm install -g wrangler
wrangler pages deploy dist
```

### GitHub 連携

```yaml
# .github/workflows/cloudflare.yml
name: Deploy to Cloudflare Pages
on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
      - run: npm ci
      - run: npm run build
      - uses: cloudflare/pages-action@v1
        with:
          apiToken: ${{ secrets.CF_API_TOKEN }}
          accountId: ${{ secrets.CF_ACCOUNT_ID }}
          projectName: my-vite-app
          directory: dist
```

## AWS S3 + CloudFront

### S3 バケット設定

```bash
# バケット作成
aws s3 mb s3://my-vite-app

# 静的ウェブサイトホスティング有効化
aws s3 website s3://my-vite-app \
  --index-document index.html \
  --error-document index.html
```

### デプロイスクリプト

```bash
#!/bin/bash
# deploy.sh

# ビルド
npm run build

# S3 にアップロード
aws s3 sync dist/ s3://my-vite-app \
  --delete \
  --cache-control "max-age=31536000,public"

# index.html は短いキャッシュ
aws s3 cp dist/index.html s3://my-vite-app/index.html \
  --cache-control "max-age=0,no-cache,no-store,must-revalidate"

# CloudFront キャッシュ無効化
aws cloudfront create-invalidation \
  --distribution-id $CF_DISTRIBUTION_ID \
  --paths "/*"
```

### GitHub Actions

```yaml
name: Deploy to AWS
on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
      - run: npm ci
      - run: npm run build

      - uses: aws-actions/configure-aws-credentials@v4
        with:
          aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
          aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          aws-region: ap-northeast-1

      - run: |
          aws s3 sync dist/ s3://${{ secrets.S3_BUCKET }} --delete
          aws cloudfront create-invalidation \
            --distribution-id ${{ secrets.CF_DISTRIBUTION_ID }} \
            --paths "/*"
```

## Docker デプロイ

### Dockerfile

```dockerfile
# Build stage
FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Production stage
FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/nginx.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

### nginx.conf

```nginx
events {
    worker_connections 1024;
}

http {
    include /etc/nginx/mime.types;
    default_type application/octet-stream;

    server {
        listen 80;
        root /usr/share/nginx/html;
        index index.html;

        # SPA ルーティング
        location / {
            try_files $uri $uri/ /index.html;
        }

        # アセットのキャッシュ
        location /assets/ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }

        # gzip 圧縮
        gzip on;
        gzip_types text/plain text/css application/json application/javascript;
    }
}
```

### docker-compose.yml

```yaml
version: "3.8"
services:
  app:
    build: .
    ports:
      - "80:80"
    restart: unless-stopped
```

## CI/CD パイプライン

### GitHub Actions（汎用）

```yaml
# .github/workflows/ci.yml
name: CI/CD

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  # 型チェック
  type-check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: "20"
          cache: "npm"
      - run: npm ci
      - run: npm run type-check

  # リント
  lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: "20"
          cache: "npm"
      - run: npm ci
      - run: npm run lint

  # テスト
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: "20"
          cache: "npm"
      - run: npm ci
      - run: npm run test:coverage

  # ビルド
  build:
    needs: [type-check, lint, test]
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: "20"
          cache: "npm"
      - run: npm ci
      - run: npm run build
      - uses: actions/upload-artifact@v4
        with:
          name: dist
          path: dist

  # デプロイ（main ブランチのみ）
  deploy:
    if: github.ref == 'refs/heads/main'
    needs: build
    runs-on: ubuntu-latest
    steps:
      - uses: actions/download-artifact@v4
        with:
          name: dist
          path: dist
      # デプロイ処理
```

## 環境別設定

### 環境変数の管理

```bash
# .env.development
VITE_API_URL=http://localhost:3000
VITE_DEBUG=true

# .env.staging
VITE_API_URL=https://staging-api.example.com
VITE_DEBUG=true

# .env.production
VITE_API_URL=https://api.example.com
VITE_DEBUG=false
```

### vite.config.ts

```typescript
import { defineConfig, loadEnv } from "vite";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");

  return {
    define: {
      __APP_ENV__: JSON.stringify(mode),
    },
    server: {
      proxy:
        mode === "development"
          ? {
              "/api": env.VITE_API_URL,
            }
          : undefined,
    },
  };
});
```

### package.json

```json
{
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "build:staging": "vite build --mode staging",
    "build:production": "vite build --mode production",
    "preview": "vite preview"
  }
}
```

## プレビュー環境

### Vercel Preview

```json
// vercel.json
{
  "github": {
    "enabled": true,
    "silent": true
  }
}
```

### Netlify Deploy Preview

```toml
# netlify.toml
[context.deploy-preview]
  command = "npm run build"

[context.deploy-preview.environment]
  VITE_API_URL = "https://staging-api.example.com"
```

## まとめ

- ビルド出力は dist/ ディレクトリ
- 各プラットフォームで簡単にデプロイ可能
- CI/CD で自動化
- 環境変数で環境別設定

## 確認問題

1. Vercel にデプロイする手順を説明してください
2. SPA のルーティング設定を行ってください
3. CI/CD パイプラインを構築してください

## 次の章へ

[15 - Best Practices](./15-Best-Practices.md) では、ベストプラクティスについて学びます。
