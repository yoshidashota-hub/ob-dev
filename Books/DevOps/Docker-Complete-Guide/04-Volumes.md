# 第4章: ボリュームとデータ永続化

## ボリュームとは

コンテナのデータを永続化する仕組み。

```
┌─────────────────────────────────────────────────────┐
│                 Volume Types                         │
│                                                     │
│  1. Named Volume (推奨)                             │
│  ┌─────────────┐      ┌─────────────┐              │
│  │  Container  │◀────▶│   Volume    │              │
│  │  /app/data  │      │  my_data    │              │
│  └─────────────┘      └─────────────┘              │
│                         Docker管理                  │
│                                                     │
│  2. Bind Mount                                      │
│  ┌─────────────┐      ┌─────────────┐              │
│  │  Container  │◀────▶│   Host      │              │
│  │  /app       │      │  ./src      │              │
│  └─────────────┘      └─────────────┘              │
│                         ホストFS                    │
│                                                     │
│  3. tmpfs Mount                                     │
│  ┌─────────────┐                                   │
│  │  Container  │      メモリ上（揮発性）            │
│  │  /tmp       │                                   │
│  └─────────────┘                                   │
└─────────────────────────────────────────────────────┘
```

## 名前付きボリューム

### 作成と管理

```bash
# ボリューム作成
docker volume create my_data

# ボリューム一覧
docker volume ls

# ボリューム詳細
docker volume inspect my_data

# ボリューム削除
docker volume rm my_data

# 未使用ボリュームを削除
docker volume prune
```

### 使用

```bash
# コンテナで使用
docker run -v my_data:/app/data my-image

# Docker Compose
```

```yaml
services:
  db:
    image: postgres:15-alpine
    volumes:
      - postgres_data:/var/lib/postgresql/data

volumes:
  postgres_data:
```

### ボリュームのバックアップ

```bash
# バックアップ
docker run --rm \
  -v postgres_data:/data \
  -v $(pwd):/backup \
  alpine tar czf /backup/postgres_backup.tar.gz -C /data .

# リストア
docker run --rm \
  -v postgres_data:/data \
  -v $(pwd):/backup \
  alpine sh -c "cd /data && tar xzf /backup/postgres_backup.tar.gz"
```

## バインドマウント

ホストのディレクトリをコンテナにマウント。

```bash
# docker run
docker run -v $(pwd):/app my-image
docker run -v $(pwd)/src:/app/src:ro my-image  # 読み取り専用

# Docker Compose
```

```yaml
services:
  app:
    volumes:
      # 相対パス
      - ./src:/app/src
      - .:/app

      # 絶対パス
      - /home/user/data:/app/data

      # 読み取り専用
      - ./config:/app/config:ro
```

### 開発環境でのホットリロード

```yaml
services:
  app:
    build: .
    volumes:
      # ソースコードをマウント
      - .:/app
      # node_modules は除外（名前付きボリューム）
      - node_modules:/app/node_modules
    command: npm run dev

volumes:
  node_modules:
```

## tmpfs マウント

メモリ上にマウント。機密データの一時保存に便利。

```bash
docker run --tmpfs /tmp my-image
docker run --mount type=tmpfs,destination=/tmp,tmpfs-size=100m my-image
```

```yaml
services:
  app:
    tmpfs:
      - /tmp
      - /run
```

## データベースの永続化

### PostgreSQL

```yaml
services:
  db:
    image: postgres:15-alpine
    environment:
      POSTGRES_USER: user
      POSTGRES_PASSWORD: password
      POSTGRES_DB: mydb
    volumes:
      # データ永続化
      - postgres_data:/var/lib/postgresql/data
      # 初期化スクリプト
      - ./init.sql:/docker-entrypoint-initdb.d/init.sql:ro
    ports:
      - "5432:5432"

volumes:
  postgres_data:
```

### MySQL

```yaml
services:
  db:
    image: mysql:8
    environment:
      MYSQL_ROOT_PASSWORD: rootpassword
      MYSQL_DATABASE: mydb
      MYSQL_USER: user
      MYSQL_PASSWORD: password
    volumes:
      - mysql_data:/var/lib/mysql
      - ./init.sql:/docker-entrypoint-initdb.d/init.sql:ro
    ports:
      - "3306:3306"

volumes:
  mysql_data:
```

### MongoDB

```yaml
services:
  db:
    image: mongo:7
    environment:
      MONGO_INITDB_ROOT_USERNAME: root
      MONGO_INITDB_ROOT_PASSWORD: password
    volumes:
      - mongo_data:/data/db
    ports:
      - "27017:27017"

volumes:
  mongo_data:
```

### Redis

```yaml
services:
  redis:
    image: redis:7-alpine
    volumes:
      - redis_data:/data
    command: redis-server --appendonly yes
    ports:
      - "6379:6379"

volumes:
  redis_data:
```

## ボリュームドライバー

### ローカルドライバーのオプション

```yaml
volumes:
  my_volume:
    driver: local
    driver_opts:
      type: none
      device: /path/on/host
      o: bind
```

### NFS マウント

```yaml
volumes:
  nfs_data:
    driver: local
    driver_opts:
      type: nfs
      o: addr=192.168.1.100,rw
      device: ":/path/to/share"
```

## ベストプラクティス

### 1. データとコードを分離

```yaml
services:
  app:
    volumes:
      # データは名前付きボリューム
      - app_data:/app/data
      # コードはビルドに含める（本番）
```

### 2. 機密データは tmpfs

```yaml
services:
  app:
    tmpfs:
      - /app/secrets
    secrets:
      - db_password

secrets:
  db_password:
    file: ./secrets/db_password.txt
```

### 3. 開発と本番で使い分け

```yaml
# docker-compose.yml (共通)
services:
  app:
    volumes:
      - app_data:/app/data

# docker-compose.dev.yml
services:
  app:
    volumes:
      - .:/app  # 開発用バインドマウント

# docker-compose.prod.yml
# バインドマウントなし
```

## 次のステップ

次章では、ネットワーキングについて学びます。
