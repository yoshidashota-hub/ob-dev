# 第1章: Docker の基礎

## Docker とは

アプリケーションをコンテナとしてパッケージ化・実行するプラットフォーム。

```
┌─────────────────────────────────────────────────────┐
│                 Docker Architecture                  │
│                                                     │
│  ┌──────────────────────────────────────────────┐  │
│  │              Docker Host                      │  │
│  │  ┌────────────┐  ┌────────────┐             │  │
│  │  │ Container  │  │ Container  │             │  │
│  │  │  ┌──────┐  │  │  ┌──────┐  │             │  │
│  │  │  │ App  │  │  │  │ App  │  │             │  │
│  │  │  └──────┘  │  │  └──────┘  │             │  │
│  │  │  Image A   │  │  Image B   │             │  │
│  │  └────────────┘  └────────────┘             │  │
│  │                                              │  │
│  │  ┌────────────────────────────────────────┐ │  │
│  │  │           Docker Engine                 │ │  │
│  │  └────────────────────────────────────────┘ │  │
│  └──────────────────────────────────────────────┘  │
│                                                     │
│  ┌──────────────────────────────────────────────┐  │
│  │              Host OS (Linux/Mac/Win)         │  │
│  └──────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────┘
```

## インストール

### macOS

```bash
# Homebrew でインストール
brew install --cask docker

# Docker Desktop を起動
open /Applications/Docker.app
```

### Linux

```bash
# Ubuntu
sudo apt-get update
sudo apt-get install docker.io docker-compose-plugin

# 現在のユーザーを docker グループに追加
sudo usermod -aG docker $USER
```

### 確認

```bash
docker --version
docker compose version
```

## イメージとコンテナ

```
┌─────────────────────────────────────────────────────┐
│           Image vs Container                         │
│                                                     │
│  Image (イメージ)          Container (コンテナ)     │
│  ┌──────────────┐         ┌──────────────┐         │
│  │ 読み取り専用  │   run   │ 実行中の     │         │
│  │ テンプレート  │ ──────▶ │ インスタンス │         │
│  │              │         │              │         │
│  │ node:20      │         │ my-app       │         │
│  └──────────────┘         └──────────────┘         │
│                                                     │
│  - 変更不可                 - 変更可能               │
│  - レイヤー構造             - 書き込み可能レイヤー    │
│  - 共有可能                 - 状態を持つ             │
└─────────────────────────────────────────────────────┘
```

## 基本コマンド

### イメージ操作

```bash
# イメージ一覧
docker images
docker image ls

# イメージ取得
docker pull node:20-alpine

# イメージ削除
docker rmi node:20-alpine
docker image rm node:20-alpine

# 未使用イメージ削除
docker image prune -a
```

### コンテナ操作

```bash
# コンテナ実行
docker run -it node:20-alpine sh

# バックグラウンドで実行
docker run -d --name my-app -p 3000:3000 my-image

# コンテナ一覧
docker ps          # 実行中のみ
docker ps -a       # 全て

# コンテナ停止・開始
docker stop my-app
docker start my-app

# コンテナ削除
docker rm my-app

# ログ確認
docker logs my-app
docker logs -f my-app  # フォロー

# コンテナ内でコマンド実行
docker exec -it my-app sh
docker exec my-app ls -la
```

### コンテナ実行オプション

```bash
docker run \
  -d \                          # デタッチモード（バックグラウンド）
  --name my-app \               # コンテナ名
  -p 3000:3000 \                # ポートマッピング
  -v $(pwd):/app \              # ボリュームマウント
  -e NODE_ENV=production \      # 環境変数
  --rm \                        # 終了時に自動削除
  -w /app \                     # 作業ディレクトリ
  node:20-alpine npm start
```

## Hello World

### 最初のコンテナ

```bash
# Hello World
docker run hello-world

# Node.js で Hello World
docker run node:20-alpine node -e "console.log('Hello from Docker!')"

# Ubuntu シェル
docker run -it ubuntu bash
```

### 簡単な Web サーバー

```bash
# nginx を起動
docker run -d -p 8080:80 nginx

# ブラウザで http://localhost:8080 にアクセス

# 停止
docker stop $(docker ps -q --filter ancestor=nginx)
```

## イメージのレイヤー

```
┌─────────────────────────────────────────────────────┐
│                 Image Layers                         │
│                                                     │
│  ┌─────────────────────────────────────┐ ◀─ 書込可  │
│  │     Container Layer (writable)      │            │
│  └─────────────────────────────────────┘            │
│  ┌─────────────────────────────────────┐            │
│  │     App Layer (npm install)         │            │
│  └─────────────────────────────────────┘            │
│  ┌─────────────────────────────────────┐            │
│  │     Node.js Layer                   │            │
│  └─────────────────────────────────────┘            │
│  ┌─────────────────────────────────────┐            │
│  │     Alpine Linux Layer              │            │
│  └─────────────────────────────────────┘ ◀─ 読取専用│
└─────────────────────────────────────────────────────┘
```

```bash
# イメージの履歴（レイヤー）を確認
docker history node:20-alpine

# イメージの詳細
docker inspect node:20-alpine
```

## Docker Hub

```bash
# ログイン
docker login

# イメージをプッシュ
docker tag my-app username/my-app:latest
docker push username/my-app:latest

# イメージをプル
docker pull username/my-app:latest
```

## クリーンアップ

```bash
# 停止したコンテナを削除
docker container prune

# 未使用イメージを削除
docker image prune -a

# 未使用ボリュームを削除
docker volume prune

# 全ての未使用リソースを削除
docker system prune -a

# ディスク使用量確認
docker system df
```

## 次のステップ

次章では、Dockerfile の書き方について学びます。
