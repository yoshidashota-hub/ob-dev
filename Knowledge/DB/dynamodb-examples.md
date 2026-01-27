# DynamoDB サンプル集

## 接続設定

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

## Single Table Design

```typescript
// テーブル設計: MyApp
// PK: パーティションキー
// SK: ソートキー
// GSI1PK, GSI1SK: Global Secondary Index

const ENTITY_TYPES = {
  USER: 'USER',
  POST: 'POST',
  COMMENT: 'COMMENT',
} as const;

// ユーザーエンティティ
interface UserItem {
  PK: `USER#${string}`;
  SK: 'PROFILE';
  GSI1PK: 'USER';
  GSI1SK: `USER#${string}`;
  entityType: 'USER';
  email: string;
  name: string;
  createdAt: string;
}

// 投稿エンティティ
interface PostItem {
  PK: `USER#${string}`;
  SK: `POST#${string}`;
  GSI1PK: 'POST';
  GSI1SK: string; // timestamp
  entityType: 'POST';
  postId: string;
  title: string;
  content: string;
  createdAt: string;
}
```

## CRUD 操作

```typescript
import {
  PutCommand,
  GetCommand,
  UpdateCommand,
  DeleteCommand,
  QueryCommand,
} from '@aws-sdk/lib-dynamodb';

const TABLE_NAME = 'MyApp';

// Create
async function createUser(user: { id: string; email: string; name: string }) {
  await docClient.send(new PutCommand({
    TableName: TABLE_NAME,
    Item: {
      PK: `USER#${user.id}`,
      SK: 'PROFILE',
      GSI1PK: 'USER',
      GSI1SK: `USER#${user.id}`,
      entityType: 'USER',
      email: user.email,
      name: user.name,
      createdAt: new Date().toISOString(),
    },
    ConditionExpression: 'attribute_not_exists(PK)',
  }));
}

// Read
async function getUser(userId: string) {
  const result = await docClient.send(new GetCommand({
    TableName: TABLE_NAME,
    Key: {
      PK: `USER#${userId}`,
      SK: 'PROFILE',
    },
  }));
  return result.Item;
}

// Update
async function updateUser(userId: string, updates: { name?: string }) {
  const result = await docClient.send(new UpdateCommand({
    TableName: TABLE_NAME,
    Key: {
      PK: `USER#${userId}`,
      SK: 'PROFILE',
    },
    UpdateExpression: 'SET #name = :name, updatedAt = :updatedAt',
    ExpressionAttributeNames: { '#name': 'name' },
    ExpressionAttributeValues: {
      ':name': updates.name,
      ':updatedAt': new Date().toISOString(),
    },
    ReturnValues: 'ALL_NEW',
  }));
  return result.Attributes;
}

// Delete
async function deleteUser(userId: string) {
  await docClient.send(new DeleteCommand({
    TableName: TABLE_NAME,
    Key: {
      PK: `USER#${userId}`,
      SK: 'PROFILE',
    },
  }));
}
```

## クエリパターン

```typescript
// ユーザーの全投稿を取得
async function getUserPosts(userId: string) {
  const result = await docClient.send(new QueryCommand({
    TableName: TABLE_NAME,
    KeyConditionExpression: 'PK = :pk AND begins_with(SK, :sk)',
    ExpressionAttributeValues: {
      ':pk': `USER#${userId}`,
      ':sk': 'POST#',
    },
    ScanIndexForward: false, // 降順
  }));
  return result.Items;
}

// 最新の投稿を取得（GSI使用）
async function getRecentPosts(limit = 20) {
  const result = await docClient.send(new QueryCommand({
    TableName: TABLE_NAME,
    IndexName: 'GSI1',
    KeyConditionExpression: 'GSI1PK = :pk',
    ExpressionAttributeValues: {
      ':pk': 'POST',
    },
    ScanIndexForward: false,
    Limit: limit,
  }));
  return result.Items;
}

// ページネーション
async function getPaginatedPosts(
  limit: number,
  lastEvaluatedKey?: Record<string, any>
) {
  const result = await docClient.send(new QueryCommand({
    TableName: TABLE_NAME,
    IndexName: 'GSI1',
    KeyConditionExpression: 'GSI1PK = :pk',
    ExpressionAttributeValues: { ':pk': 'POST' },
    ScanIndexForward: false,
    Limit: limit,
    ExclusiveStartKey: lastEvaluatedKey,
  }));

  return {
    items: result.Items,
    lastEvaluatedKey: result.LastEvaluatedKey,
    hasMore: !!result.LastEvaluatedKey,
  };
}
```

## トランザクション

```typescript
import { TransactWriteCommand } from '@aws-sdk/lib-dynamodb';

async function createPostWithUpdate(
  userId: string,
  post: { id: string; title: string; content: string }
) {
  await docClient.send(new TransactWriteCommand({
    TransactItems: [
      {
        Put: {
          TableName: TABLE_NAME,
          Item: {
            PK: `USER#${userId}`,
            SK: `POST#${new Date().toISOString()}#${post.id}`,
            GSI1PK: 'POST',
            GSI1SK: new Date().toISOString(),
            entityType: 'POST',
            postId: post.id,
            title: post.title,
            content: post.content,
            createdAt: new Date().toISOString(),
          },
        },
      },
      {
        Update: {
          TableName: TABLE_NAME,
          Key: { PK: `USER#${userId}`, SK: 'PROFILE' },
          UpdateExpression: 'SET postCount = if_not_exists(postCount, :zero) + :one',
          ExpressionAttributeValues: { ':zero': 0, ':one': 1 },
        },
      },
    ],
  }));
}
```

## バッチ操作

```typescript
import { BatchWriteCommand, BatchGetCommand } from '@aws-sdk/lib-dynamodb';

// バッチ書き込み（25件まで）
async function batchCreatePosts(posts: any[]) {
  const chunks = [];
  for (let i = 0; i < posts.length; i += 25) {
    chunks.push(posts.slice(i, i + 25));
  }

  for (const chunk of chunks) {
    await docClient.send(new BatchWriteCommand({
      RequestItems: {
        [TABLE_NAME]: chunk.map((post) => ({
          PutRequest: { Item: post },
        })),
      },
    }));
  }
}

// バッチ取得（100件まで）
async function batchGetUsers(userIds: string[]) {
  const result = await docClient.send(new BatchGetCommand({
    RequestItems: {
      [TABLE_NAME]: {
        Keys: userIds.map((id) => ({
          PK: `USER#${id}`,
          SK: 'PROFILE',
        })),
      },
    },
  }));
  return result.Responses?.[TABLE_NAME] || [];
}
```

## Next.js API Route

```typescript
// app/api/posts/route.ts
import { docClient } from '@/lib/dynamodb';
import { QueryCommand, PutCommand } from '@aws-sdk/lib-dynamodb';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const cursor = searchParams.get('cursor');
  const limit = parseInt(searchParams.get('limit') || '20');

  const result = await docClient.send(new QueryCommand({
    TableName: 'MyApp',
    IndexName: 'GSI1',
    KeyConditionExpression: 'GSI1PK = :pk',
    ExpressionAttributeValues: { ':pk': 'POST' },
    ScanIndexForward: false,
    Limit: limit,
    ExclusiveStartKey: cursor ? JSON.parse(atob(cursor)) : undefined,
  }));

  return Response.json({
    data: result.Items,
    nextCursor: result.LastEvaluatedKey
      ? btoa(JSON.stringify(result.LastEvaluatedKey))
      : null,
  });
}

export async function POST(req: Request) {
  const body = await req.json();
  const postId = crypto.randomUUID();
  const timestamp = new Date().toISOString();

  await docClient.send(new PutCommand({
    TableName: 'MyApp',
    Item: {
      PK: `USER#${body.userId}`,
      SK: `POST#${timestamp}#${postId}`,
      GSI1PK: 'POST',
      GSI1SK: timestamp,
      entityType: 'POST',
      postId,
      ...body,
      createdAt: timestamp,
    },
  }));

  return Response.json({ data: { id: postId } }, { status: 201 });
}
```

## TTL（自動削除）

```typescript
// セッションに TTL を設定
await docClient.send(new PutCommand({
  TableName: 'MyApp',
  Item: {
    PK: `SESSION#${sessionId}`,
    SK: 'SESSION',
    userId,
    ttl: Math.floor(Date.now() / 1000) + 60 * 60 * 24, // 24時間後に削除
  },
}));
```
