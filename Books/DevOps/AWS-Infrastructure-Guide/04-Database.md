# 第4章: データベース

## サービス比較

```
┌─────────────────────────────────────────────────────────────┐
│                    Database Services                         │
│                                                             │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐ │
│  │    RDS      │  │  DynamoDB   │  │      Aurora         │ │
│  │             │  │             │  │                     │ │
│  │ リレーショナル│  │   NoSQL     │  │ 高性能 RDB         │ │
│  │ MySQL/PG等  │  │ Key-Value   │  │ MySQL/PG 互換      │ │
│  │             │  │             │  │                     │ │
│  │ 複雑なクエリ │  │ 高速・大規模│  │ スケーラブル       │ │
│  └─────────────┘  └─────────────┘  └─────────────────────┘ │
│        ↑               ↑                    ↑              │
│   トランザクション   シンプルな操作     エンタープライズ      │
└─────────────────────────────────────────────────────────────┘
```

### 選択基準

| 要件         | RDS              | DynamoDB           | Aurora           |
| ------------ | ---------------- | ------------------ | ---------------- |
| データモデル | リレーショナル   | Key-Value/Document | リレーショナル   |
| スケーリング | 垂直             | 水平（自動）       | 読み取りレプリカ |
| 運用負荷     | 中               | 低                 | 低               |
| コスト       | インスタンス課金 | 使用量課金         | インスタンス課金 |

## DynamoDB

### テーブル設計

```
┌────────────────────────────────────────────────────────────┐
│                    DynamoDB 基本概念                        │
│                                                            │
│  Primary Key:                                              │
│  ┌─────────────┐     ┌─────────────┐                      │
│  │ Partition   │  +  │    Sort     │  = Primary Key       │
│  │    Key      │     │    Key      │                      │
│  └─────────────┘     └─────────────┘                      │
│                                                            │
│  例: ユーザーの注文                                         │
│  PK: userId       SK: orderId                              │
│  PK: userId       SK: ORDER#2024-01-15#001                 │
└────────────────────────────────────────────────────────────┘
```

### SDK での操作

```typescript
// lib/dynamodb.ts
import {
  DynamoDBClient,
  QueryCommand,
  PutItemCommand,
  UpdateItemCommand,
  DeleteItemCommand,
} from "@aws-sdk/client-dynamodb";
import { marshall, unmarshall } from "@aws-sdk/util-dynamodb";

const dynamodb = new DynamoDBClient({ region: "ap-northeast-1" });
const TABLE_NAME = process.env.DYNAMODB_TABLE!;

// 型定義
interface Order {
  userId: string;
  orderId: string;
  amount: number;
  status: string;
  createdAt: string;
}

// 作成
export async function createOrder(order: Order) {
  await dynamodb.send(
    new PutItemCommand({
      TableName: TABLE_NAME,
      Item: marshall(order),
      ConditionExpression: "attribute_not_exists(userId)", // 重複防止
    }),
  );
}

// 取得（Query）
export async function getOrdersByUser(userId: string): Promise<Order[]> {
  const result = await dynamodb.send(
    new QueryCommand({
      TableName: TABLE_NAME,
      KeyConditionExpression: "userId = :userId",
      ExpressionAttributeValues: marshall({
        ":userId": userId,
      }),
      ScanIndexForward: false, // 降順
    }),
  );

  return (result.Items || []).map((item) => unmarshall(item) as Order);
}

// 更新
export async function updateOrderStatus(
  userId: string,
  orderId: string,
  status: string,
) {
  await dynamodb.send(
    new UpdateItemCommand({
      TableName: TABLE_NAME,
      Key: marshall({ userId, orderId }),
      UpdateExpression: "SET #status = :status, updatedAt = :updatedAt",
      ExpressionAttributeNames: {
        "#status": "status",
      },
      ExpressionAttributeValues: marshall({
        ":status": status,
        ":updatedAt": new Date().toISOString(),
      }),
    }),
  );
}

// 削除
export async function deleteOrder(userId: string, orderId: string) {
  await dynamodb.send(
    new DeleteItemCommand({
      TableName: TABLE_NAME,
      Key: marshall({ userId, orderId }),
    }),
  );
}
```

### GSI（グローバルセカンダリインデックス）

```typescript
// CDK でテーブル + GSI 作成
import * as dynamodb from "aws-cdk-lib/aws-dynamodb";

const table = new dynamodb.Table(this, "OrdersTable", {
  partitionKey: { name: "userId", type: dynamodb.AttributeType.STRING },
  sortKey: { name: "orderId", type: dynamodb.AttributeType.STRING },
  billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
  pointInTimeRecovery: true,
});

// ステータス別検索用 GSI
table.addGlobalSecondaryIndex({
  indexName: "StatusIndex",
  partitionKey: { name: "status", type: dynamodb.AttributeType.STRING },
  sortKey: { name: "createdAt", type: dynamodb.AttributeType.STRING },
});
```

```typescript
// GSI を使ったクエリ
export async function getOrdersByStatus(status: string): Promise<Order[]> {
  const result = await dynamodb.send(
    new QueryCommand({
      TableName: TABLE_NAME,
      IndexName: "StatusIndex",
      KeyConditionExpression: "#status = :status",
      ExpressionAttributeNames: {
        "#status": "status",
      },
      ExpressionAttributeValues: marshall({
        ":status": status,
      }),
    }),
  );

  return (result.Items || []).map((item) => unmarshall(item) as Order);
}
```

### シングルテーブル設計

```typescript
// 単一テーブルで複数エンティティを管理
interface DynamoItem {
  PK: string; // パーティションキー
  SK: string; // ソートキー
  GSI1PK?: string;
  GSI1SK?: string;
  type: string;
  [key: string]: any;
}

// ユーザー: PK=USER#123, SK=PROFILE
// 注文: PK=USER#123, SK=ORDER#2024-01-15#001
// 商品: PK=PRODUCT#456, SK=DETAIL

const userItem: DynamoItem = {
  PK: "USER#123",
  SK: "PROFILE",
  type: "User",
  name: "田中太郎",
  email: "tanaka@example.com",
};

const orderItem: DynamoItem = {
  PK: "USER#123",
  SK: "ORDER#2024-01-15#001",
  GSI1PK: "ORDER",
  GSI1SK: "2024-01-15",
  type: "Order",
  amount: 5000,
  status: "pending",
};
```

## RDS

### インスタンス作成（CDK）

```typescript
// lib/rds-stack.ts
import * as rds from "aws-cdk-lib/aws-rds";
import * as ec2 from "aws-cdk-lib/aws-ec2";

const vpc = new ec2.Vpc(this, "VPC");

// PostgreSQL インスタンス
const database = new rds.DatabaseInstance(this, "Database", {
  engine: rds.DatabaseInstanceEngine.postgres({
    version: rds.PostgresEngineVersion.VER_15,
  }),
  instanceType: ec2.InstanceType.of(
    ec2.InstanceClass.T3,
    ec2.InstanceSize.MICRO,
  ),
  vpc,
  vpcSubnets: {
    subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
  },
  multiAz: false, // 本番は true
  allocatedStorage: 20,
  maxAllocatedStorage: 100,
  storageType: rds.StorageType.GP3,
  databaseName: "myapp",
  credentials: rds.Credentials.fromGeneratedSecret("dbadmin"),
  backupRetention: cdk.Duration.days(7),
});

// 接続情報を Secrets Manager に保存（自動）
```

### 接続（Prisma）

```typescript
// prisma/schema.prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id        String   @id @default(cuid())
  email     String   @unique
  name      String?
  orders    Order[]
  createdAt DateTime @default(now())
}

model Order {
  id        String   @id @default(cuid())
  userId    String
  user      User     @relation(fields: [userId], references: [id])
  amount    Int
  status    String   @default("pending")
  createdAt DateTime @default(now())
}
```

```typescript
// lib/db.ts
import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["query"] : [],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
```

## Aurora

### Aurora Serverless v2

```typescript
// CDK で Aurora Serverless v2
import * as rds from "aws-cdk-lib/aws-rds";

const cluster = new rds.DatabaseCluster(this, "AuroraCluster", {
  engine: rds.DatabaseClusterEngine.auroraPostgres({
    version: rds.AuroraPostgresEngineVersion.VER_15_4,
  }),
  serverlessV2MinCapacity: 0.5,
  serverlessV2MaxCapacity: 8,
  writer: rds.ClusterInstance.serverlessV2("writer"),
  readers: [
    rds.ClusterInstance.serverlessV2("reader", {
      scaleWithWriter: true,
    }),
  ],
  vpc,
  defaultDatabaseName: "myapp",
  credentials: rds.Credentials.fromGeneratedSecret("dbadmin"),
});
```

### Data API（サーバーレス向け）

```typescript
// Aurora Data API の使用
import {
  RDSDataClient,
  ExecuteStatementCommand,
} from "@aws-sdk/client-rds-data";

const client = new RDSDataClient({ region: "ap-northeast-1" });

export async function executeQuery(sql: string, parameters: any[] = []) {
  const result = await client.send(
    new ExecuteStatementCommand({
      resourceArn: process.env.AURORA_ARN!,
      secretArn: process.env.AURORA_SECRET_ARN!,
      database: "myapp",
      sql,
      parameters: parameters.map((value, i) => ({
        name: `p${i}`,
        value: { stringValue: String(value) },
      })),
    }),
  );

  return result.records;
}
```

## ElastiCache

### Redis クラスター

```typescript
// CDK で ElastiCache Redis
import * as elasticache from "aws-cdk-lib/aws-elasticache";

const subnetGroup = new elasticache.CfnSubnetGroup(this, "SubnetGroup", {
  description: "Redis subnet group",
  subnetIds: vpc.privateSubnets.map((s) => s.subnetId),
});

const redis = new elasticache.CfnCacheCluster(this, "RedisCluster", {
  cacheNodeType: "cache.t3.micro",
  engine: "redis",
  numCacheNodes: 1,
  cacheSubnetGroupName: subnetGroup.ref,
  vpcSecurityGroupIds: [securityGroup.securityGroupId],
});
```

### Redis クライアント

```typescript
// lib/redis.ts
import { createClient } from "redis";

const redis = createClient({
  url: `redis://${process.env.REDIS_HOST}:6379`,
});

redis.on("error", (err) => console.error("Redis error:", err));

await redis.connect();

// キャッシュ操作
export async function getCache<T>(key: string): Promise<T | null> {
  const data = await redis.get(key);
  return data ? JSON.parse(data) : null;
}

export async function setCache(key: string, value: any, ttl: number = 3600) {
  await redis.setEx(key, ttl, JSON.stringify(value));
}

export async function deleteCache(key: string) {
  await redis.del(key);
}

// キャッシュ付きクエリ
export async function cachedQuery<T>(
  key: string,
  queryFn: () => Promise<T>,
  ttl: number = 3600,
): Promise<T> {
  const cached = await getCache<T>(key);
  if (cached) return cached;

  const result = await queryFn();
  await setCache(key, result, ttl);
  return result;
}
```

## ユースケース別選択

```
┌────────────────────────────────────────────────────────────┐
│                    選択ガイド                               │
│                                                            │
│  シンプルな CRUD → DynamoDB                                 │
│  複雑なリレーション → RDS/Aurora                           │
│  高スケーラビリティ → DynamoDB + DAX                       │
│  リアルタイム分析 → Aurora + ElastiCache                   │
│  セッション管理 → ElastiCache (Redis)                      │
│  全文検索 → OpenSearch（別サービス）                       │
└────────────────────────────────────────────────────────────┘
```

## 次のステップ

次章では、ネットワークサービスについて学びます。
