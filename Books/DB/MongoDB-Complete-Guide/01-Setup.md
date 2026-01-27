# 第1章: セットアップ

## インストール方法

### Docker（推奨）

```bash
# MongoDB コンテナを起動
docker run -d \
  --name mongodb \
  -p 27017:27017 \
  -e MONGO_INITDB_ROOT_USERNAME=admin \
  -e MONGO_INITDB_ROOT_PASSWORD=password \
  -v mongodb_data:/data/db \
  mongo:7

# ログを確認
docker logs mongodb

# コンテナに接続
docker exec -it mongodb mongosh -u admin -p password
```

### docker-compose

```yaml
# docker-compose.yml
version: '3.8'
services:
  mongodb:
    image: mongo:7
    container_name: mongodb
    ports:
      - '27017:27017'
    environment:
      MONGO_INITDB_ROOT_USERNAME: admin
      MONGO_INITDB_ROOT_PASSWORD: password
      MONGO_INITDB_DATABASE: myapp
    volumes:
      - mongodb_data:/data/db
      - ./init-mongo.js:/docker-entrypoint-initdb.d/init-mongo.js:ro

volumes:
  mongodb_data:
```

```javascript
// init-mongo.js（初期化スクリプト）
db = db.getSiblingDB('myapp');

db.createUser({
  user: 'appuser',
  pwd: 'apppassword',
  roles: [{ role: 'readWrite', db: 'myapp' }],
});

db.createCollection('users');
```

### macOS（Homebrew）

```bash
# インストール
brew tap mongodb/brew
brew install mongodb-community

# サービス起動
brew services start mongodb-community

# 状態確認
brew services list
```

### MongoDB Atlas（クラウド）

1. [MongoDB Atlas](https://www.mongodb.com/atlas) にアクセス
2. 無料アカウントを作成
3. クラスターを作成（M0 Free Tier）
4. データベースユーザーを作成
5. IP アクセスリストを設定
6. 接続文字列を取得

```bash
# 接続文字列の形式
mongodb+srv://<username>:<password>@<cluster>.mongodb.net/<database>?retryWrites=true&w=majority
```

## MongoDB Shell (mongosh)

### 基本操作

```javascript
// 接続
mongosh "mongodb://localhost:27017"
mongosh "mongodb+srv://user:pass@cluster.mongodb.net/mydb"

// データベース一覧
show dbs

// データベース選択/作成
use myapp

// コレクション一覧
show collections

// ヘルプ
help
db.help()
db.users.help()

// 終了
exit
```

### よく使うコマンド

```javascript
// 現在のデータベース
db

// データベース統計
db.stats()

// コレクション統計
db.users.stats()

// インデックス一覧
db.users.getIndexes()

// データベース削除（危険！）
db.dropDatabase()

// コレクション削除
db.users.drop()
```

## Node.js ドライバー

### インストール

```bash
npm install mongodb
```

### 接続

```typescript
// lib/mongodb.ts
import { MongoClient, Db } from 'mongodb';

const uri = process.env.MONGODB_URI!;
const options = {};

let client: MongoClient;
let clientPromise: Promise<MongoClient>;

if (process.env.NODE_ENV === 'development') {
  // 開発環境: グローバル変数を使用してホットリロード時の再接続を防ぐ
  const globalWithMongo = global as typeof globalThis & {
    _mongoClientPromise?: Promise<MongoClient>;
  };

  if (!globalWithMongo._mongoClientPromise) {
    client = new MongoClient(uri, options);
    globalWithMongo._mongoClientPromise = client.connect();
  }
  clientPromise = globalWithMongo._mongoClientPromise;
} else {
  // 本番環境
  client = new MongoClient(uri, options);
  clientPromise = client.connect();
}

export default clientPromise;

// DB インスタンスを取得するヘルパー
export async function getDb(): Promise<Db> {
  const client = await clientPromise;
  return client.db('myapp');
}
```

### 使用例

```typescript
// app/api/users/route.ts
import { getDb } from '@/lib/mongodb';

export async function GET() {
  const db = await getDb();
  const users = await db.collection('users').find({}).toArray();

  return Response.json(users);
}

export async function POST(req: Request) {
  const db = await getDb();
  const body = await req.json();

  const result = await db.collection('users').insertOne({
    ...body,
    createdAt: new Date(),
  });

  return Response.json({ id: result.insertedId });
}
```

## 接続オプション

```typescript
const options = {
  // 接続プール
  maxPoolSize: 10,
  minPoolSize: 5,

  // タイムアウト
  connectTimeoutMS: 10000,
  socketTimeoutMS: 45000,

  // 再試行
  retryWrites: true,
  retryReads: true,

  // 書き込み確認
  w: 'majority',
  journal: true,

  // 読み取り設定
  readPreference: 'primary',

  // TLS/SSL
  tls: true,
  tlsCAFile: '/path/to/ca.pem',
};
```

## 環境変数

```env
# .env.local
# ローカル開発
MONGODB_URI=mongodb://admin:password@localhost:27017/myapp?authSource=admin

# Atlas
MONGODB_URI=mongodb+srv://user:password@cluster.xxxxx.mongodb.net/myapp?retryWrites=true&w=majority
```

## MongoDB Compass（GUI）

MongoDB の公式 GUI ツール。

### インストール

```bash
# macOS
brew install --cask mongodb-compass
```

### 機能

- **接続管理**: 複数の接続を保存
- **ドキュメント操作**: GUI での CRUD
- **クエリビルダー**: 視覚的なクエリ作成
- **インデックス管理**: インデックスの作成・削除
- **Aggregation Pipeline**: パイプラインのビルダー
- **Schema 分析**: コレクションの構造を可視化
- **パフォーマンス**: Explain プランの確認

## トラブルシューティング

### 接続できない

```bash
# MongoDB が起動しているか確認
docker ps | grep mongo
brew services list | grep mongodb

# ポートが使用されているか確認
lsof -i :27017

# ファイアウォールの確認（Atlas の場合）
# IP アクセスリストに自分の IP を追加
```

### 認証エラー

```javascript
// 認証データベースを指定
mongosh "mongodb://user:pass@localhost:27017/mydb?authSource=admin"

// Node.js
const uri = 'mongodb://user:pass@localhost:27017/mydb?authSource=admin';
```

### 接続タイムアウト

```typescript
// タイムアウトを延長
const options = {
  connectTimeoutMS: 30000,
  serverSelectionTimeoutMS: 30000,
};
```

## 次のステップ

次章では、ドキュメントの基本的な操作（CRUD）を学びます。
