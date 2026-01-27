# 第3章: Docker Compose

## Docker Compose とは

複数コンテナのアプリケーションを定義・実行するツール。

```
┌─────────────────────────────────────────────────────┐
│              Docker Compose                          │
│                                                     │
│  docker-compose.yml                                 │
│  ┌───────────────────────────────────────────────┐ │
│  │ services:                                     │ │
│  │   app:                                        │ │
│  │     build: .                                  │ │
│  │     ports:                                    │ │
│  │       - "3000:3000"                           │ │
│  │   db:                                         │ │
│  │     image: postgres:15                        │ │
│  └───────────────────────────────────────────────┘ │
│                                                     │
│           ┌──────────────────────┐                 │
│           │       Network        │                 │
│  ┌────────┴────────┐  ┌─────────┴────────┐        │
│  │       App       │  │        DB        │        │
│  │     Container   │  │     Container    │        │
│  └─────────────────┘  └──────────────────┘        │
└─────────────────────────────────────────────────────┘
```

## 基本構文

```yaml
# docker-compose.yml

services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=development
      - DATABASE_URL=postgresql://user:password@db:5432/mydb
    depends_on:
      - db
    volumes:
      - .:/app
      - /app/node_modules

  db:
    image: postgres:15-alpine
    environment:
      POSTGRES_USER: user
      POSTGRES_PASSWORD: password
      POSTGRES_DB: mydb
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"

volumes:
  postgres_data:
```

## 基本コマンド

```bash
# コンテナ起動
docker compose up
docker compose up -d        # バックグラウンド

# コンテナ停止
docker compose down
docker compose down -v      # ボリュームも削除

# ログ確認
docker compose logs
docker compose logs -f app  # フォロー

# コンテナ一覧
docker compose ps

# コンテナ内でコマンド実行
docker compose exec app sh
docker compose exec db psql -U user -d mydb

# 再ビルド
docker compose build
docker compose up --build

# 特定のサービスのみ起動
docker compose up app
```

## 設定オプション

### build

```yaml
services:
  app:
    # 簡単な指定
    build: .

    # 詳細な指定
    build:
      context: .
      dockerfile: Dockerfile.prod
      args:
        NODE_ENV: production
      target: production
```

### ports

```yaml
services:
  app:
    ports:
      - "3000:3000"           # ホスト:コンテナ
      - "3000"                # ランダムなホストポート
      - "127.0.0.1:3000:3000" # 特定のIPのみ
```

### volumes

```yaml
services:
  app:
    volumes:
      # バインドマウント
      - ./src:/app/src
      - .:/app:ro              # 読み取り専用

      # 名前付きボリューム
      - node_modules:/app/node_modules

      # 匿名ボリューム
      - /app/node_modules

volumes:
  node_modules:
```

### environment

```yaml
services:
  app:
    # リスト形式
    environment:
      - NODE_ENV=production
      - DATABASE_URL=${DATABASE_URL}

    # マップ形式
    environment:
      NODE_ENV: production
      DATABASE_URL: ${DATABASE_URL}

    # ファイルから
    env_file:
      - .env
      - .env.local
```

### depends_on

```yaml
services:
  app:
    depends_on:
      - db
      - redis

    # 条件付き（v2.1+）
    depends_on:
      db:
        condition: service_healthy
      redis:
        condition: service_started
```

### healthcheck

```yaml
services:
  db:
    image: postgres:15-alpine
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U user -d mydb"]
      interval: 10s
      timeout: 5s
      retries: 5
      start_period: 30s
```

### networks

```yaml
services:
  app:
    networks:
      - frontend
      - backend

  db:
    networks:
      - backend

networks:
  frontend:
  backend:
    driver: bridge
```

## 開発環境の例

### Node.js + PostgreSQL + Redis

```yaml
# docker-compose.yml
services:
  app:
    build:
      context: .
      target: development
    ports:
      - "3000:3000"
    environment:
      NODE_ENV: development
      DATABASE_URL: postgresql://user:password@db:5432/mydb
      REDIS_URL: redis://redis:6379
    volumes:
      - .:/app
      - /app/node_modules
    depends_on:
      db:
        condition: service_healthy
      redis:
        condition: service_started
    command: npm run dev

  db:
    image: postgres:15-alpine
    environment:
      POSTGRES_USER: user
      POSTGRES_PASSWORD: password
      POSTGRES_DB: mydb
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./init.sql:/docker-entrypoint-initdb.d/init.sql
    ports:
      - "5432:5432"
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U user -d mydb"]
      interval: 5s
      timeout: 5s
      retries: 5

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data

  adminer:
    image: adminer
    ports:
      - "8080:8080"
    depends_on:
      - db

volumes:
  postgres_data:
  redis_data:
```

### 本番環境用

```yaml
# docker-compose.prod.yml
services:
  app:
    build:
      context: .
      target: production
    ports:
      - "3000:3000"
    environment:
      NODE_ENV: production
    env_file:
      - .env.production
    restart: unless-stopped
    deploy:
      replicas: 2
      resources:
        limits:
          cpus: "0.5"
          memory: 512M

  db:
    image: postgres:15-alpine
    env_file:
      - .env.production
    volumes:
      - postgres_data:/var/lib/postgresql/data
    restart: unless-stopped

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

volumes:
  postgres_data:
```

## 複数 Compose ファイル

```bash
# ベースと開発用をマージ
docker compose -f docker-compose.yml -f docker-compose.dev.yml up

# 本番用
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d
```

## プロファイル

```yaml
services:
  app:
    # 常に起動

  debug-tools:
    profiles:
      - debug
    image: nicolaka/netshoot

  monitoring:
    profiles:
      - monitoring
    image: grafana/grafana
```

```bash
# デフォルト
docker compose up

# プロファイル指定
docker compose --profile debug up
docker compose --profile debug --profile monitoring up
```

## 次のステップ

次章では、ボリュームとデータ永続化について学びます。
