# 第7章: セキュリティ

## Docker セキュリティの基本

```
┌─────────────────────────────────────────────────────┐
│              Security Layers                         │
│                                                     │
│  ┌─────────────────────────────────────────────┐   │
│  │  1. イメージセキュリティ                     │   │
│  │     - ベースイメージの選択                   │   │
│  │     - 脆弱性スキャン                         │   │
│  └─────────────────────────────────────────────┘   │
│  ┌─────────────────────────────────────────────┐   │
│  │  2. ビルドセキュリティ                       │   │
│  │     - シークレットの扱い                     │   │
│  │     - レイヤーの最小化                       │   │
│  └─────────────────────────────────────────────┘   │
│  ┌─────────────────────────────────────────────┐   │
│  │  3. ランタイムセキュリティ                   │   │
│  │     - 非rootユーザー                         │   │
│  │     - 読み取り専用ファイルシステム           │   │
│  │     - リソース制限                           │   │
│  └─────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────┘
```

## 非 root ユーザーで実行

### Node.js

```dockerfile
FROM node:20-alpine

WORKDIR /app

COPY --chown=node:node package*.json ./
RUN npm ci --only=production

COPY --chown=node:node . .

# 非rootユーザーに切り替え
USER node

CMD ["node", "server.js"]
```

### カスタムユーザー作成

```dockerfile
FROM alpine:3.19

# ユーザーとグループを作成
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

WORKDIR /app

COPY --chown=appuser:appgroup . .

USER appuser

CMD ["./app"]
```

## 最小限のベースイメージ

```dockerfile
# ❌ 大きい（1GB+）
FROM node:20

# ✅ 小さい（150MB）
FROM node:20-alpine

# ✅ さらに小さい（Node.js 不要な場合）
FROM alpine:3.19

# ✅ 最小（Go バイナリなど）
FROM scratch
```

### Distroless イメージ

```dockerfile
FROM gcr.io/distroless/nodejs20-debian12

WORKDIR /app

COPY --from=builder /app/dist ./dist

CMD ["dist/main.js"]
```

## シークレットの扱い

### ❌ 悪い例

```dockerfile
# シークレットがイメージに残る
ENV API_KEY=secret123
RUN curl -H "Authorization: $API_KEY" https://api.example.com
```

### ✅ ビルド時シークレット

```dockerfile
# syntax=docker/dockerfile:1.4

FROM node:20-alpine

WORKDIR /app

# シークレットをマウント（イメージに残らない）
RUN --mount=type=secret,id=npm_token \
    NPM_TOKEN=$(cat /run/secrets/npm_token) npm install
```

```bash
# ビルド時にシークレットを渡す
docker build --secret id=npm_token,src=.npmrc .
```

### ✅ 実行時の環境変数

```yaml
# docker-compose.yml
services:
  app:
    environment:
      - DATABASE_URL  # ホストの環境変数を渡す
    env_file:
      - .env  # ファイルから読み込み
```

### ✅ Docker Secrets（Swarm）

```yaml
services:
  app:
    secrets:
      - db_password

secrets:
  db_password:
    file: ./secrets/db_password.txt
```

## 読み取り専用ファイルシステム

```bash
docker run --read-only my-app

# 書き込みが必要な場所のみ許可
docker run --read-only --tmpfs /tmp my-app
```

```yaml
services:
  app:
    read_only: true
    tmpfs:
      - /tmp
      - /var/run
```

## リソース制限

```bash
docker run \
  --memory=512m \
  --memory-swap=512m \
  --cpus=0.5 \
  --pids-limit=100 \
  my-app
```

```yaml
services:
  app:
    deploy:
      resources:
        limits:
          cpus: "0.5"
          memory: 512M
        reservations:
          cpus: "0.25"
          memory: 256M
```

## ネットワーク分離

```yaml
services:
  web:
    networks:
      - frontend

  api:
    networks:
      - frontend
      - backend

  db:
    networks:
      - backend  # 外部からアクセス不可

networks:
  frontend:
  backend:
    internal: true
```

## 脆弱性スキャン

### Docker Scout

```bash
# イメージをスキャン
docker scout cves my-app:latest

# 詳細な分析
docker scout quickview my-app:latest

# SBOM を生成
docker scout sbom my-app:latest
```

### Trivy

```bash
# インストール
brew install aquasecurity/trivy/trivy

# スキャン
trivy image my-app:latest
trivy image --severity HIGH,CRITICAL my-app:latest
```

### CI での自動スキャン

```yaml
# .github/workflows/security.yml
name: Security Scan

on: [push, pull_request]

jobs:
  scan:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Build image
        run: docker build -t my-app .

      - name: Run Trivy
        uses: aquasecurity/trivy-action@master
        with:
          image-ref: my-app
          severity: HIGH,CRITICAL
          exit-code: 1
```

## セキュリティ設定の例

```dockerfile
FROM node:20-alpine

# セキュリティアップデート
RUN apk update && apk upgrade --no-cache

WORKDIR /app

# 非rootユーザー
COPY --chown=node:node package*.json ./
RUN npm ci --only=production && npm cache clean --force

COPY --chown=node:node . .

# 不要なファイルを削除
RUN rm -rf /var/cache/apk/* /tmp/*

USER node

# ヘルスチェック
HEALTHCHECK --interval=30s --timeout=3s \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/health || exit 1

CMD ["node", "server.js"]
```

## Docker Compose セキュリティ

```yaml
services:
  app:
    image: my-app:latest
    user: "1000:1000"
    read_only: true
    tmpfs:
      - /tmp
    security_opt:
      - no-new-privileges:true
    cap_drop:
      - ALL
    cap_add:
      - NET_BIND_SERVICE
    deploy:
      resources:
        limits:
          cpus: "0.5"
          memory: 256M
```

## 次のステップ

次章では、本番環境へのデプロイについて学びます。
