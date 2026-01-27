# 第8章: 本番環境とベストプラクティス

## 本番環境チェックリスト

```
┌─────────────────────────────────────────────────────┐
│          Production Checklist                        │
│                                                     │
│  □ マルチステージビルドで最小イメージ               │
│  □ 非rootユーザーで実行                             │
│  □ ヘルスチェック設定                               │
│  □ リソース制限                                     │
│  □ 適切なログ設定                                   │
│  □ 環境変数でシークレット管理                       │
│  □ 脆弱性スキャン実施                               │
│  □ restart ポリシー設定                             │
└─────────────────────────────────────────────────────┘
```

## 本番用 Dockerfile

```dockerfile
# syntax=docker/dockerfile:1.4

# ビルドステージ
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# 本番ステージ
FROM node:20-alpine AS production

# セキュリティアップデート
RUN apk update && apk upgrade --no-cache

WORKDIR /app

# 本番依存関係のみ
COPY package*.json ./
RUN npm ci --only=production && npm cache clean --force

# ビルド成果物をコピー
COPY --from=builder --chown=node:node /app/dist ./dist

# 非rootユーザー
USER node

# メタデータ
LABEL maintainer="team@example.com"
LABEL version="1.0.0"

# ヘルスチェック
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/health || exit 1

EXPOSE 3000

CMD ["node", "dist/main.js"]
```

## 本番用 Docker Compose

```yaml
# docker-compose.prod.yml
services:
  app:
    image: ghcr.io/myorg/my-app:${VERSION:-latest}
    ports:
      - "3000:3000"
    environment:
      NODE_ENV: production
    env_file:
      - .env.production
    deploy:
      mode: replicated
      replicas: 2
      resources:
        limits:
          cpus: "0.5"
          memory: 512M
        reservations:
          cpus: "0.25"
          memory: 256M
      update_config:
        parallelism: 1
        delay: 10s
      restart_policy:
        condition: on-failure
        delay: 5s
        max_attempts: 3
    healthcheck:
      test: ["CMD", "wget", "--spider", "http://localhost:3000/health"]
      interval: 30s
      timeout: 10s
      retries: 3
    logging:
      driver: json-file
      options:
        max-size: "10m"
        max-file: "3"

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf:ro
      - ./certs:/etc/nginx/certs:ro
    depends_on:
      - app
    restart: unless-stopped

  db:
    image: postgres:15-alpine
    volumes:
      - postgres_data:/var/lib/postgresql/data
    environment:
      POSTGRES_USER: ${DB_USER}
      POSTGRES_PASSWORD: ${DB_PASSWORD}
      POSTGRES_DB: ${DB_NAME}
    restart: unless-stopped
    deploy:
      resources:
        limits:
          memory: 1G

volumes:
  postgres_data:
```

## CI/CD パイプライン

### GitHub Actions

```yaml
# .github/workflows/deploy.yml
name: Build and Deploy

on:
  push:
    branches: [main]
    tags: ["v*"]

env:
  REGISTRY: ghcr.io
  IMAGE_NAME: ${{ github.repository }}

jobs:
  build:
    runs-on: ubuntu-latest
    permissions:
      contents: read
      packages: write

    steps:
      - uses: actions/checkout@v4

      - name: Set up Docker Buildx
        uses: docker/setup-buildx-action@v3

      - name: Login to Container Registry
        uses: docker/login-action@v3
        with:
          registry: ${{ env.REGISTRY }}
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}

      - name: Extract metadata
        id: meta
        uses: docker/metadata-action@v5
        with:
          images: ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}
          tags: |
            type=ref,event=branch
            type=ref,event=pr
            type=semver,pattern={{version}}
            type=sha

      - name: Build and push
        uses: docker/build-push-action@v5
        with:
          context: .
          push: true
          tags: ${{ steps.meta.outputs.tags }}
          labels: ${{ steps.meta.outputs.labels }}
          cache-from: type=gha
          cache-to: type=gha,mode=max

      - name: Scan for vulnerabilities
        uses: aquasecurity/trivy-action@master
        with:
          image-ref: ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}:sha-${{ github.sha }}
          severity: HIGH,CRITICAL
```

## ログ管理

### JSON ログフォーマット

```typescript
// logger.ts
const log = (level: string, message: string, meta?: object) => {
  console.log(JSON.stringify({
    timestamp: new Date().toISOString(),
    level,
    message,
    ...meta,
  }));
};
```

### Docker ログ設定

```yaml
services:
  app:
    logging:
      driver: json-file
      options:
        max-size: "10m"
        max-file: "5"
        labels: "app,environment"
```

```bash
# ログ確認
docker logs my-app
docker logs -f my-app --tail 100

# Docker Compose
docker compose logs -f app
```

## ヘルスチェック

### アプリケーション側

```typescript
// health.ts (Express)
app.get("/health", (req, res) => {
  res.status(200).json({
    status: "healthy",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// 詳細なヘルスチェック
app.get("/health/ready", async (req, res) => {
  try {
    await db.query("SELECT 1");
    await redis.ping();
    res.status(200).json({ status: "ready" });
  } catch (error) {
    res.status(503).json({ status: "not ready", error: error.message });
  }
});
```

## Nginx リバースプロキシ

```nginx
# nginx.conf
upstream app {
    server app:3000;
}

server {
    listen 80;
    server_name example.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name example.com;

    ssl_certificate /etc/nginx/certs/fullchain.pem;
    ssl_certificate_key /etc/nginx/certs/privkey.pem;

    location / {
        proxy_pass http://app;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    location /health {
        proxy_pass http://app/health;
        access_log off;
    }
}
```

## デプロイコマンド

```bash
# イメージをプル
docker compose -f docker-compose.prod.yml pull

# ダウンタイムなしでデプロイ
docker compose -f docker-compose.prod.yml up -d --no-deps app

# 古いイメージを削除
docker image prune -f

# ロールバック
docker compose -f docker-compose.prod.yml up -d --no-deps \
  -e VERSION=v1.0.0 app
```

## まとめ

### ベストプラクティス

1. **最小イメージ**: マルチステージビルド + Alpine
2. **セキュリティ**: 非root、脆弱性スキャン、シークレット管理
3. **ヘルスチェック**: アプリケーションとコンテナの両方で
4. **ログ**: JSON フォーマット、ローテーション設定
5. **リソース制限**: メモリ、CPU の制限を設定
6. **再起動ポリシー**: `unless-stopped` または `on-failure`

### 参考リンク

- [Docker Documentation](https://docs.docker.com/)
- [Docker Compose File Reference](https://docs.docker.com/compose/compose-file/)
- [Dockerfile Best Practices](https://docs.docker.com/develop/develop-images/dockerfile_best-practices/)
