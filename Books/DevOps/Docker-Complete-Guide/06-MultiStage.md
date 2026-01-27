# 第6章: マルチステージビルド

## マルチステージビルドとは

複数のステージを使って最終イメージを最小化する手法。

```
┌─────────────────────────────────────────────────────┐
│              Multi-stage Build                       │
│                                                     │
│  Stage 1: Builder                                   │
│  ┌─────────────────────────────────────────────┐   │
│  │  FROM node:20 AS builder                    │   │
│  │  - 開発ツール                                │   │
│  │  - ビルドに必要な依存関係                    │   │
│  │  - ソースコード                              │   │
│  │  → npm run build                            │   │
│  │  → /app/dist (成果物)                       │   │
│  └─────────────────────────────────────────────┘   │
│                        │                           │
│                        ▼ COPY --from=builder       │
│                                                     │
│  Stage 2: Runner (最終イメージ)                    │
│  ┌─────────────────────────────────────────────┐   │
│  │  FROM node:20-alpine                        │   │
│  │  - 最小限のランタイム                        │   │
│  │  - 本番依存関係のみ                          │   │
│  │  - ビルド成果物                              │   │
│  │  サイズ: 約100MB (vs 1GB+)                  │   │
│  └─────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────┘
```

## 基本構文

```dockerfile
# Stage 1: ビルドステージ
FROM node:20 AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# Stage 2: 実行ステージ
FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

# ビルドステージから成果物をコピー
COPY --from=builder /app/dist ./dist

USER node

CMD ["node", "dist/main.js"]
```

## Node.js アプリケーション

### Express / NestJS

```dockerfile
# ビルドステージ
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# 本番ステージ
FROM node:20-alpine AS production

WORKDIR /app

# 本番依存関係のみインストール
COPY package*.json ./
RUN npm ci --only=production && npm cache clean --force

# ビルド成果物をコピー
COPY --from=builder /app/dist ./dist

USER node

EXPOSE 3000

CMD ["node", "dist/main.js"]
```

### Next.js（Standalone モード）

```dockerfile
# 依存関係インストール
FROM node:20-alpine AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci

# ビルド
FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

ENV NEXT_TELEMETRY_DISABLED 1
RUN npm run build

# 実行
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# standalone モード用ファイルをコピー
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT 3000
ENV HOSTNAME "0.0.0.0"

CMD ["node", "server.js"]
```

### 開発と本番で分岐

```dockerfile
# ベースステージ
FROM node:20-alpine AS base
WORKDIR /app
COPY package*.json ./

# 開発ステージ
FROM base AS development
RUN npm install
COPY . .
CMD ["npm", "run", "dev"]

# ビルドステージ
FROM base AS builder
RUN npm ci
COPY . .
RUN npm run build

# 本番ステージ
FROM base AS production
RUN npm ci --only=production
COPY --from=builder /app/dist ./dist
USER node
CMD ["node", "dist/main.js"]
```

```bash
# 開発用イメージをビルド
docker build --target development -t my-app:dev .

# 本番用イメージをビルド
docker build --target production -t my-app:prod .
```

## Go アプリケーション

```dockerfile
# ビルドステージ
FROM golang:1.22-alpine AS builder

WORKDIR /app

COPY go.mod go.sum ./
RUN go mod download

COPY . .
RUN CGO_ENABLED=0 GOOS=linux go build -o main .

# 実行ステージ（scratch = 空のイメージ）
FROM scratch

COPY --from=builder /app/main /main

ENTRYPOINT ["/main"]
```

### Alpine 使用版

```dockerfile
FROM golang:1.22-alpine AS builder

WORKDIR /app

COPY go.mod go.sum ./
RUN go mod download

COPY . .
RUN go build -o main .

# Alpine を使用（デバッグしやすい）
FROM alpine:3.19

RUN apk --no-cache add ca-certificates

COPY --from=builder /app/main /main

ENTRYPOINT ["/main"]
```

## Python アプリケーション

```dockerfile
# ビルドステージ
FROM python:3.12-slim AS builder

WORKDIR /app

RUN pip install poetry
COPY pyproject.toml poetry.lock ./
RUN poetry export -f requirements.txt > requirements.txt

# 実行ステージ
FROM python:3.12-slim

WORKDIR /app

COPY --from=builder /app/requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

USER nobody

CMD ["python", "-m", "uvicorn", "main:app", "--host", "0.0.0.0"]
```

## 外部イメージからコピー

```dockerfile
FROM node:20-alpine

# 他のイメージから直接コピー
COPY --from=nginx:alpine /etc/nginx/nginx.conf /etc/nginx/
COPY --from=busybox:latest /bin/wget /usr/local/bin/
```

## イメージサイズの比較

```bash
# シングルステージ
FROM node:20
# サイズ: 約 1GB

# マルチステージ（Alpine）
FROM node:20-alpine
# サイズ: 約 150MB

# Go + scratch
FROM scratch
# サイズ: 約 10-20MB
```

## キャッシュの最適化

```dockerfile
FROM node:20-alpine AS builder

WORKDIR /app

# 依存関係のキャッシュ（変更が少ない）
COPY package*.json ./
RUN npm ci

# ソースコードは後でコピー（変更が多い）
COPY . .
RUN npm run build

FROM node:20-alpine
# ...
```

## 次のステップ

次章では、セキュリティベストプラクティスについて学びます。
