# Docker 学習ノート

## 概要

Docker はコンテナ仮想化プラットフォーム。アプリケーションを環境ごとパッケージ化し、どこでも同じように動作させることができる。

## 基本概念

### イメージ vs コンテナ

```
イメージ = アプリケーションのテンプレート（読み取り専用）
コンテナ = イメージから作成された実行環境（書き込み可能）
```

### Dockerfile

```dockerfile
# ベースイメージ
FROM node:22-alpine

# 作業ディレクトリ
WORKDIR /app

# 依存関係のコピーとインストール
COPY package*.json ./
RUN npm ci --only=production

# アプリケーションコード
COPY . .

# ビルド
RUN npm run build

# ポート公開
EXPOSE 3000

# 起動コマンド
CMD ["npm", "start"]
```

## マルチステージビルド

```dockerfile
# ビルドステージ
FROM node:22-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# 本番ステージ
FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

# 非rootユーザー
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000
ENV PORT=3000

CMD ["node", "server.js"]
```

## Docker Compose

```yaml
# docker-compose.yml
version: "3.8"

services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - DATABASE_URL=postgresql://user:pass@db:5432/mydb
    depends_on:
      - db
      - redis

  db:
    image: postgres:16-alpine
    environment:
      POSTGRES_USER: user
      POSTGRES_PASSWORD: pass
      POSTGRES_DB: mydb
    volumes:
      - postgres_data:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"

volumes:
  postgres_data:
```

## よく使うコマンド

```bash
# イメージビルド
docker build -t myapp:latest .

# コンテナ実行
docker run -d -p 3000:3000 --name myapp myapp:latest

# コンテナ一覧
docker ps -a

# ログ確認
docker logs -f myapp

# コンテナに入る
docker exec -it myapp sh

# クリーンアップ
docker system prune -a
```

## ベストプラクティス

### 1. .dockerignore を使う

```
node_modules
.next
.git
*.log
.env*
```

### 2. キャッシュを活用

```dockerfile
# 変更頻度の低いものを先にコピー
COPY package*.json ./
RUN npm ci

# 変更頻度の高いものは後で
COPY . .
```

### 3. セキュリティ

- 非rootユーザーで実行
- 最小限のベースイメージ（alpine）
- 機密情報は環境変数で

## Next.js での活用

```yaml
# next.config.js で standalone 出力を有効化
output: "standalone";
```

## 参考リソース

- [Docker 公式ドキュメント](https://docs.docker.com/)
- [Next.js Docker デプロイ](https://nextjs.org/docs/deployment#docker-image)
