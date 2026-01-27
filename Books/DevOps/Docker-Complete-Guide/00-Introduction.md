# 第0章: はじめに

## Docker とは

Docker は、アプリケーションをコンテナという単位でパッケージ化し、どの環境でも同じように動作させるプラットフォームです。

## 仮想マシン vs コンテナ

```
┌─────────────────────────────────────────────────────┐
│              Virtual Machines                        │
│  ┌─────────┐  ┌─────────┐  ┌─────────┐             │
│  │   App   │  │   App   │  │   App   │             │
│  ├─────────┤  ├─────────┤  ├─────────┤             │
│  │  Guest  │  │  Guest  │  │  Guest  │             │
│  │   OS    │  │   OS    │  │   OS    │             │
│  └─────────┘  └─────────┘  └─────────┘             │
│  ┌─────────────────────────────────────────────┐   │
│  │              Hypervisor                      │   │
│  └─────────────────────────────────────────────┘   │
│  ┌─────────────────────────────────────────────┐   │
│  │              Host OS                         │   │
│  └─────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────┐
│                Containers                            │
│  ┌─────────┐  ┌─────────┐  ┌─────────┐             │
│  │   App   │  │   App   │  │   App   │             │
│  └─────────┘  └─────────┘  └─────────┘             │
│  ┌─────────────────────────────────────────────┐   │
│  │              Docker Engine                   │   │
│  └─────────────────────────────────────────────┘   │
│  ┌─────────────────────────────────────────────┐   │
│  │              Host OS                         │   │
│  └─────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────┘
```

### 比較

| 項目 | VM | コンテナ |
|------|-----|---------|
| 起動時間 | 分単位 | 秒単位 |
| サイズ | GB | MB |
| 分離レベル | 完全 | プロセスレベル |
| オーバーヘッド | 大 | 小 |

## 基本概念

### イメージ (Image)

アプリケーションの実行に必要なすべてを含むテンプレート。

```bash
# イメージのダウンロード
docker pull node:22-alpine

# イメージ一覧
docker images
```

### コンテナ (Container)

イメージから作成された実行インスタンス。

```bash
# コンテナの作成と起動
docker run -d -p 3000:3000 --name myapp myimage

# コンテナ一覧
docker ps -a

# コンテナの停止・削除
docker stop myapp
docker rm myapp
```

### レジストリ (Registry)

イメージを保存・共有する場所。

- Docker Hub
- GitHub Container Registry
- AWS ECR
- Google Container Registry

## Docker Desktop

### インストール

```bash
# macOS (Homebrew)
brew install --cask docker

# 確認
docker --version
docker-compose --version
```

## Hello Docker

```bash
# Hello World
docker run hello-world

# Node.js アプリを実行
docker run -it node:22-alpine node -e "console.log('Hello from Docker!')"
```

## Next.js プロジェクトの例

```dockerfile
# Dockerfile
FROM node:22-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

EXPOSE 3000

CMD ["npm", "start"]
```

```bash
# ビルド
docker build -t my-nextjs-app .

# 実行
docker run -p 3000:3000 my-nextjs-app
```

## なぜ Docker を使うのか

1. **開発環境の統一**: "Works on my machine" 問題を解決
2. **依存関係の隔離**: 異なるプロジェクト間の競合を防ぐ
3. **デプロイの簡素化**: イメージをビルドしてプッシュするだけ
4. **スケーリング**: コンテナオーケストレーションとの連携

## 次のステップ

次章では、Docker の基本コマンドを詳しく学びます。
