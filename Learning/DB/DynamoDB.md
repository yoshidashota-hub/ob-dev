# DynamoDB 学習ノート

## 概要

Amazon DynamoDB は AWS のフルマネージド NoSQL データベース。高速でスケーラブル、サーバーレスアーキテクチャに最適。

## 基本概念

```
┌─────────────────────────────────────────────────────┐
│                    DynamoDB                          │
│                                                     │
│  ┌─────────────────────────────────────────────┐   │
│  │                   Table                      │   │
│  │  ┌─────────────────────────────────────┐    │   │
│  │  │            Item (レコード)            │    │   │
│  │  │  PK: user#123                        │    │   │
│  │  │  SK: profile                         │    │   │
│  │  │  name: "John"                        │    │   │
│  │  │  email: "john@example.com"           │    │   │
│  │  └─────────────────────────────────────┘    │   │
│  └─────────────────────────────────────────────┘   │
│                                                     │
│  PK = Partition Key (必須)                          │
│  SK = Sort Key (オプション)                         │
└─────────────────────────────────────────────────────┘
```

## セットアップ

```bash
npm install @aws-sdk/client-dynamodb @aws-sdk/lib-dynamodb
```

```typescript
// lib/dynamodb.ts
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';

const client = new DynamoDBClient({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

export const docClient = DynamoDBDocumentClient.from(client);
```

## CRUD 操作

### 作成・更新 (Put)

```typescript
import { PutCommand } from '@aws-sdk/lib-dynamodb';

await docClient.send(new PutCommand({
  TableName: 'Users',
  Item: {
    PK: 'USER#123',
    SK: 'PROFILE',
    name: 'John',
    email: 'john@example.com',
    createdAt: new Date().toISOString(),
  },
}));
```

### 取得 (Get)

```typescript
import { GetCommand } from '@aws-sdk/lib-dynamodb';

const result = await docClient.send(new GetCommand({
  TableName: 'Users',
  Key: {
    PK: 'USER#123',
    SK: 'PROFILE',
  },
}));

const user = result.Item;
```

### 更新 (Update)

```typescript
import { UpdateCommand } from '@aws-sdk/lib-dynamodb';

await docClient.send(new UpdateCommand({
  TableName: 'Users',
  Key: {
    PK: 'USER#123',
    SK: 'PROFILE',
  },
  UpdateExpression: 'SET #name = :name, updatedAt = :updatedAt',
  ExpressionAttributeNames: {
    '#name': 'name',
  },
  ExpressionAttributeValues: {
    ':name': 'Jane',
    ':updatedAt': new Date().toISOString(),
  },
  ReturnValues: 'ALL_NEW',
}));
```

### 削除 (Delete)

```typescript
import { DeleteCommand } from '@aws-sdk/lib-dynamodb';

await docClient.send(new DeleteCommand({
  TableName: 'Users',
  Key: {
    PK: 'USER#123',
    SK: 'PROFILE',
  },
}));
```

## クエリ

```typescript
import { QueryCommand } from '@aws-sdk/lib-dynamodb';

// ユーザーの全アイテム取得
const result = await docClient.send(new QueryCommand({
  TableName: 'Users',
  KeyConditionExpression: 'PK = :pk',
  ExpressionAttributeValues: {
    ':pk': 'USER#123',
  },
}));

// ソートキーで絞り込み
const posts = await docClient.send(new QueryCommand({
  TableName: 'Users',
  KeyConditionExpression: 'PK = :pk AND begins_with(SK, :sk)',
  ExpressionAttributeValues: {
    ':pk': 'USER#123',
    ':sk': 'POST#',
  },
  ScanIndexForward: false, // 降順
  Limit: 10,
}));
```

## Single Table Design

```typescript
// 1テーブルで複数エンティティを管理
const TABLE_NAME = 'MyApp';

// ユーザー
const userItem = {
  PK: 'USER#123',
  SK: 'PROFILE',
  GSI1PK: 'USER',
  GSI1SK: 'USER#123',
  type: 'User',
  name: 'John',
  email: 'john@example.com',
};

// 投稿
const postItem = {
  PK: 'USER#123',
  SK: 'POST#2024-01-15T10:00:00Z#abc123',
  GSI1PK: 'POST',
  GSI1SK: '2024-01-15T10:00:00Z',
  type: 'Post',
  title: 'Hello World',
  content: '...',
};

// コメント
const commentItem = {
  PK: 'POST#abc123',
  SK: 'COMMENT#2024-01-15T11:00:00Z#xyz789',
  GSI1PK: 'USER#456',
  GSI1SK: 'COMMENT#2024-01-15T11:00:00Z',
  type: 'Comment',
  content: 'Great post!',
  authorId: 'USER#456',
};
```

## GSI (Global Secondary Index)

```typescript
// GSI でクエリ
const recentPosts = await docClient.send(new QueryCommand({
  TableName: 'MyApp',
  IndexName: 'GSI1',
  KeyConditionExpression: 'GSI1PK = :pk',
  ExpressionAttributeValues: {
    ':pk': 'POST',
  },
  ScanIndexForward: false,
  Limit: 20,
}));
```

## トランザクション

```typescript
import { TransactWriteCommand } from '@aws-sdk/lib-dynamodb';

await docClient.send(new TransactWriteCommand({
  TransactItems: [
    {
      Put: {
        TableName: 'MyApp',
        Item: { PK: 'USER#123', SK: 'ORDER#abc', ... },
      },
    },
    {
      Update: {
        TableName: 'MyApp',
        Key: { PK: 'PRODUCT#xyz', SK: 'INVENTORY' },
        UpdateExpression: 'SET quantity = quantity - :qty',
        ExpressionAttributeValues: { ':qty': 1 },
        ConditionExpression: 'quantity >= :qty',
      },
    },
  ],
}));
```

## バッチ操作

```typescript
import { BatchWriteCommand } from '@aws-sdk/lib-dynamodb';

// 25件まで一括書き込み
await docClient.send(new BatchWriteCommand({
  RequestItems: {
    'MyApp': items.map(item => ({
      PutRequest: { Item: item },
    })),
  },
}));
```

## ベストプラクティス

1. **適切なキー設計**: アクセスパターンから逆算
2. **Single Table Design**: 関連データを1テーブルに
3. **GSI の活用**: 異なるアクセスパターンに対応
4. **TTL でデータ削除**: 自動的に古いデータを削除
5. **On-Demand vs Provisioned**: トラフィックに応じて選択

## 参考リソース

- [DynamoDB ドキュメント](https://docs.aws.amazon.com/dynamodb/)
- [Alex DeBrie - The DynamoDB Book](https://www.dynamodbbook.com/)
