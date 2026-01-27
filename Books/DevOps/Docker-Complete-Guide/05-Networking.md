# 第5章: ネットワーキング

## Docker ネットワーク

コンテナ間およびコンテナと外部の通信を管理。

```
┌─────────────────────────────────────────────────────┐
│                 Docker Networks                      │
│                                                     │
│  ┌─────────────────────────────────────────────┐   │
│  │              bridge (default)               │   │
│  │  ┌─────────┐  ┌─────────┐  ┌─────────┐    │   │
│  │  │  App    │  │   DB    │  │  Redis  │    │   │
│  │  │ 172.17. │  │ 172.17. │  │ 172.17. │    │   │
│  │  │  0.2    │  │  0.3    │  │  0.4    │    │   │
│  │  └─────────┘  └─────────┘  └─────────┘    │   │
│  │              172.17.0.1 (gateway)          │   │
│  └─────────────────────────────────────────────┘   │
│                        │                           │
│                    Host Network                    │
│                        │                           │
│                    Internet                        │
└─────────────────────────────────────────────────────┘
```

## ネットワークドライバー

| ドライバー | 説明 | 用途 |
|-----------|------|------|
| bridge | デフォルト。分離されたネットワーク | 単一ホスト |
| host | ホストのネットワークを直接使用 | パフォーマンス |
| none | ネットワークなし | 分離 |
| overlay | 複数ホスト間 | Swarm |

## 基本コマンド

```bash
# ネットワーク一覧
docker network ls

# ネットワーク作成
docker network create my-network
docker network create --driver bridge my-network

# ネットワーク詳細
docker network inspect my-network

# コンテナをネットワークに接続
docker network connect my-network my-container
docker network disconnect my-network my-container

# ネットワーク削除
docker network rm my-network
docker network prune  # 未使用を削除
```

## Bridge ネットワーク

### デフォルト bridge

```bash
# デフォルトbridge でコンテナ起動
docker run -d --name app nginx
docker run -d --name db postgres

# IP アドレスで通信可能
docker inspect app | grep IPAddress
# コンテナ名での通信は不可（デフォルトbridge）
```

### ユーザー定義 bridge（推奨）

```bash
# カスタムネットワーク作成
docker network create app-network

# コンテナをネットワークに接続
docker run -d --name app --network app-network nginx
docker run -d --name db --network app-network postgres

# コンテナ名で通信可能
docker exec app ping db
```

## Docker Compose でのネットワーク

### デフォルト動作

```yaml
# docker-compose.yml
services:
  app:
    image: nginx

  db:
    image: postgres
```

```bash
# Compose は自動でネットワークを作成
# プロジェクト名_default (例: myapp_default)
# サービス名でDNS解決可能
# app から db にアクセス: postgres://db:5432
```

### カスタムネットワーク

```yaml
services:
  app:
    image: nginx
    networks:
      - frontend
      - backend

  db:
    image: postgres
    networks:
      - backend

  nginx:
    image: nginx
    networks:
      - frontend
    ports:
      - "80:80"

networks:
  frontend:
  backend:
```

### 外部ネットワーク

```yaml
services:
  app:
    networks:
      - existing-network

networks:
  existing-network:
    external: true
```

## ポートマッピング

```bash
# 基本
docker run -p 8080:80 nginx  # ホスト:コンテナ

# 全インターフェースにバインド
docker run -p 0.0.0.0:8080:80 nginx

# localhost のみ
docker run -p 127.0.0.1:8080:80 nginx

# ランダムなホストポート
docker run -p 80 nginx
docker port <container>  # ポートを確認

# UDP
docker run -p 53:53/udp dns-server
```

## コンテナ間通信

### サービス名で通信

```yaml
services:
  app:
    environment:
      DATABASE_URL: postgresql://user:pass@db:5432/mydb
      REDIS_URL: redis://redis:6379

  db:
    image: postgres:15-alpine

  redis:
    image: redis:7-alpine
```

### DNS エイリアス

```yaml
services:
  db:
    image: postgres:15-alpine
    networks:
      default:
        aliases:
          - database
          - postgres

  # app から db, database, postgres のいずれでもアクセス可能
```

## Host ネットワーク

```bash
# ホストのネットワークスタックを直接使用
docker run --network host nginx

# ポートマッピング不要
# コンテナはホストの IP で直接リッスン
```

```yaml
services:
  app:
    network_mode: host
```

## ネットワーク分離

```yaml
services:
  # フロントエンド
  web:
    networks:
      - frontend

  # API
  api:
    networks:
      - frontend
      - backend

  # データベース（外部から直接アクセス不可）
  db:
    networks:
      - backend

networks:
  frontend:
  backend:
    internal: true  # 外部アクセス不可
```

## デバッグ

```bash
# コンテナのネットワーク設定を確認
docker inspect --format='{{json .NetworkSettings}}' container_name

# コンテナ間の接続テスト
docker exec app ping db
docker exec app curl http://api:3000/health

# ネットワークに接続されたコンテナ一覧
docker network inspect my-network

# DNS 解決の確認
docker exec app nslookup db
```

## 次のステップ

次章では、マルチステージビルドについて学びます。
