# 第2章: Dockerfile

## Dockerfile とは

イメージをビルドするための命令書。

```
┌─────────────────────────────────────────────────────┐
│                 Dockerfile Flow                      │
│                                                     │
│  Dockerfile ──▶ docker build ──▶ Image              │
│                                                     │
│  FROM node:20     Build        ┌──────────────┐    │
│  WORKDIR /app     Process      │    Image     │    │
│  COPY . .         ──────▶      │   my-app     │    │
│  RUN npm install               │              │    │
│  CMD ["npm"]                   └──────────────┘    │
└─────────────────────────────────────────────────────┘
```

## 基本構文

```dockerfile
# Dockerfile

# ベースイメージ
FROM node:20-alpine

# 作業ディレクトリ
WORKDIR /app

# ファイルをコピー
COPY package*.json ./

# コマンド実行（ビルド時）
RUN npm install

# 残りのファイルをコピー
COPY . .

# ポート公開
EXPOSE 3000

# コンテナ起動時のコマンド
CMD ["npm", "start"]
```

## 主要な命令

### FROM

```dockerfile
# 公式イメージ
FROM node:20-alpine
FROM python:3.12-slim
FROM golang:1.22-alpine

# 特定のダイジェスト
FROM node@sha256:abcd1234...

# スクラッチ（空のイメージ）
FROM scratch

# ビルドステージ名
FROM node:20-alpine AS builder
```

### WORKDIR

```dockerfile
# 作業ディレクトリを設定
WORKDIR /app

# 存在しない場合は作成される
WORKDIR /home/node/app

# 相対パスも可能
WORKDIR src
```

### COPY と ADD

```dockerfile
# COPY: ファイルをコピー
COPY package.json ./
COPY package*.json ./
COPY . .
COPY --chown=node:node . .

# マルチステージビルドから
COPY --from=builder /app/dist ./dist

# ADD: COPY + 追加機能（tar展開、URL取得）
ADD app.tar.gz /app/
# 基本的にはCOPYを使用
```

### RUN

```dockerfile
# シェル形式
RUN npm install
RUN apt-get update && apt-get install -y curl

# exec 形式
RUN ["npm", "install"]

# 複数コマンドを1つのレイヤーに
RUN apt-get update \
    && apt-get install -y curl wget \
    && rm -rf /var/lib/apt/lists/*
```

### CMD と ENTRYPOINT

```dockerfile
# CMD: デフォルトコマンド（上書き可能）
CMD ["npm", "start"]
CMD npm start

# ENTRYPOINT: メインコマンド（上書き困難）
ENTRYPOINT ["node"]
CMD ["app.js"]
# docker run my-app → node app.js
# docker run my-app other.js → node other.js

# 組み合わせ
ENTRYPOINT ["npm"]
CMD ["start"]
# docker run my-app → npm start
# docker run my-app test → npm test
```

### ENV と ARG

```dockerfile
# ENV: 環境変数（ビルド時 + 実行時）
ENV NODE_ENV=production
ENV PORT=3000

# 複数行
ENV NODE_ENV=production \
    PORT=3000

# ARG: ビルド引数（ビルド時のみ）
ARG NODE_VERSION=20
FROM node:${NODE_VERSION}-alpine

ARG BUILD_DATE
ENV BUILD_DATE=${BUILD_DATE}
```

```bash
# ビルド時に引数を渡す
docker build --build-arg NODE_VERSION=18 .
```

### EXPOSE

```dockerfile
# ドキュメント目的（実際のポート公開は -p で指定）
EXPOSE 3000
EXPOSE 3000/tcp
EXPOSE 3000/udp
```

### USER

```dockerfile
# 非rootユーザーで実行
RUN addgroup -S appgroup && adduser -S appuser -G appgroup
USER appuser

# または既存ユーザー
USER node
```

### HEALTHCHECK

```dockerfile
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3000/health || exit 1
```

## Node.js アプリケーション

### 基本

```dockerfile
FROM node:20-alpine

WORKDIR /app

# 依存関係を先にインストール（キャッシュ活用）
COPY package*.json ./
RUN npm ci --only=production

# ソースコードをコピー
COPY . .

# 非rootユーザー
USER node

EXPOSE 3000

CMD ["node", "server.js"]
```

### Next.js

```dockerfile
# ビルドステージ
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# 実行ステージ
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production

# standalone モードの場合
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public

USER node

EXPOSE 3000

CMD ["node", "server.js"]
```

## Python アプリケーション

```dockerfile
FROM python:3.12-slim

WORKDIR /app

# 依存関係をインストール
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

USER nobody

EXPOSE 8000

CMD ["python", "-m", "uvicorn", "main:app", "--host", "0.0.0.0"]
```

## .dockerignore

```
# .dockerignore
node_modules
npm-debug.log
.git
.gitignore
.env
.env.*
Dockerfile
docker-compose.yml
.dockerignore
README.md
.next
dist
coverage
*.log
```

## ビルド

```bash
# 基本
docker build -t my-app .

# タグ付き
docker build -t my-app:1.0.0 .
docker build -t username/my-app:latest .

# Dockerfile を指定
docker build -f Dockerfile.prod -t my-app .

# ビルド引数
docker build --build-arg NODE_ENV=production -t my-app .

# キャッシュなし
docker build --no-cache -t my-app .

# プラットフォーム指定
docker build --platform linux/amd64 -t my-app .
```

## 次のステップ

次章では、Docker Compose について学びます。
