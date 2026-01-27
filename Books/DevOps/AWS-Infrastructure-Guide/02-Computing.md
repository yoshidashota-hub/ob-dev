# 第2章: コンピューティング

## サービス比較

```
┌─────────────────────────────────────────────────────────────┐
│                    Compute Services                          │
│                                                             │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐ │
│  │   Lambda    │  │  Fargate    │  │        EC2          │ │
│  │             │  │             │  │                     │ │
│  │ サーバーレス │  │ コンテナ    │  │   仮想サーバー      │ │
│  │ 関数単位    │  │ タスク単位  │  │   インスタンス単位  │ │
│  │             │  │             │  │                     │ │
│  │ 管理: なし  │  │ 管理: 少   │  │   管理: 多         │ │
│  └─────────────┘  └─────────────┘  └─────────────────────┘ │
│        ↑               ↑                    ↑              │
│    イベント駆動    マイクロサービス      フルコントロール    │
└─────────────────────────────────────────────────────────────┘
```

### 選択基準

| 要件         | Lambda            | Fargate            | EC2               |
| ------------ | ----------------- | ------------------ | ----------------- |
| 実行時間     | < 15分            | 無制限             | 無制限            |
| スケーリング | 自動              | 自動               | 手動/Auto Scaling |
| コスト       | 実行時間課金      | vCPU/メモリ課金    | インスタンス課金  |
| ユースケース | API, イベント処理 | Web アプリ, バッチ | 特殊要件          |

## Lambda

### 基本構成

```typescript
// handler.ts
import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";

export async function handler(
  event: APIGatewayProxyEvent,
): Promise<APIGatewayProxyResult> {
  try {
    const body = JSON.parse(event.body || "{}");

    // ビジネスロジック
    const result = await processRequest(body);

    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(result),
    };
  } catch (error) {
    console.error("Error:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Internal Server Error" }),
    };
  }
}
```

### デプロイ（CDK）

```typescript
// lib/lambda-stack.ts
import * as cdk from "aws-cdk-lib";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as apigateway from "aws-cdk-lib/aws-apigateway";

export class LambdaStack extends cdk.Stack {
  constructor(scope: cdk.App, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // Lambda 関数
    const fn = new lambda.Function(this, "MyFunction", {
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: "handler.handler",
      code: lambda.Code.fromAsset("dist"),
      timeout: cdk.Duration.seconds(30),
      memorySize: 256,
      environment: {
        NODE_ENV: "production",
      },
    });

    // API Gateway
    const api = new apigateway.RestApi(this, "MyApi", {
      restApiName: "My Service",
    });

    api.root.addMethod("POST", new apigateway.LambdaIntegration(fn));
  }
}
```

### イベントソース

```typescript
// S3 トリガー
import { S3Event } from "aws-lambda";

export async function s3Handler(event: S3Event) {
  for (const record of event.Records) {
    const bucket = record.s3.bucket.name;
    const key = record.s3.object.key;

    console.log(`Processing: s3://${bucket}/${key}`);
    // ファイル処理
  }
}

// SQS トリガー
import { SQSEvent } from "aws-lambda";

export async function sqsHandler(event: SQSEvent) {
  for (const record of event.Records) {
    const body = JSON.parse(record.body);
    await processMessage(body);
  }
}

// DynamoDB Streams トリガー
import { DynamoDBStreamEvent } from "aws-lambda";

export async function dynamoHandler(event: DynamoDBStreamEvent) {
  for (const record of event.Records) {
    if (record.eventName === "INSERT") {
      const newItem = record.dynamodb?.NewImage;
      // 新規レコード処理
    }
  }
}
```

### コールドスタート対策

```typescript
// 接続の再利用
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";

// グローバルスコープで初期化（再利用される）
const dynamodb = new DynamoDBClient({ region: "ap-northeast-1" });

export async function handler(event: any) {
  // dynamodb クライアントは再利用される
  // ...
}
```

```typescript
// Provisioned Concurrency（CDK）
const fn = new lambda.Function(this, "MyFunction", {
  // ... 設定
});

const alias = new lambda.Alias(this, "ProdAlias", {
  aliasName: "prod",
  version: fn.currentVersion,
  provisionedConcurrentExecutions: 5, // 常時 5 インスタンス待機
});
```

## ECS / Fargate

### アーキテクチャ

```
┌─────────────────────────────────────────────────────────────┐
│                      ECS Cluster                             │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │                    Service                           │   │
│  │  ┌─────────┐  ┌─────────┐  ┌─────────┐             │   │
│  │  │  Task   │  │  Task   │  │  Task   │             │   │
│  │  │Container│  │Container│  │Container│             │   │
│  │  └─────────┘  └─────────┘  └─────────┘             │   │
│  └─────────────────────────────────────────────────────┘   │
│                         ↑                                   │
│                    Task Definition                          │
│                   (コンテナ定義)                             │
└─────────────────────────────────────────────────────────────┘
```

### Dockerfile

```dockerfile
# Dockerfile
FROM node:20-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:20-alpine AS runner

WORKDIR /app
ENV NODE_ENV=production

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./

EXPOSE 3000
CMD ["node", "dist/main.js"]
```

### タスク定義（CDK）

```typescript
// lib/ecs-stack.ts
import * as cdk from "aws-cdk-lib";
import * as ecs from "aws-cdk-lib/aws-ecs";
import * as ec2 from "aws-cdk-lib/aws-ec2";
import * as elbv2 from "aws-cdk-lib/aws-elasticloadbalancingv2";

export class EcsStack extends cdk.Stack {
  constructor(scope: cdk.App, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // VPC
    const vpc = new ec2.Vpc(this, "MyVpc", {
      maxAzs: 2,
    });

    // ECS クラスター
    const cluster = new ecs.Cluster(this, "MyCluster", {
      vpc,
    });

    // タスク定義
    const taskDefinition = new ecs.FargateTaskDefinition(this, "TaskDef", {
      memoryLimitMiB: 512,
      cpu: 256,
    });

    // コンテナ
    const container = taskDefinition.addContainer("AppContainer", {
      image: ecs.ContainerImage.fromAsset("./app"),
      logging: ecs.LogDrivers.awsLogs({ streamPrefix: "my-app" }),
      environment: {
        NODE_ENV: "production",
      },
    });

    container.addPortMappings({
      containerPort: 3000,
    });

    // サービス
    const service = new ecs.FargateService(this, "MyService", {
      cluster,
      taskDefinition,
      desiredCount: 2,
    });

    // ALB
    const lb = new elbv2.ApplicationLoadBalancer(this, "ALB", {
      vpc,
      internetFacing: true,
    });

    const listener = lb.addListener("Listener", {
      port: 80,
    });

    listener.addTargets("Target", {
      port: 3000,
      targets: [service],
      healthCheck: {
        path: "/health",
      },
    });
  }
}
```

### Auto Scaling

```typescript
// オートスケーリング設定
const scaling = service.autoScaleTaskCount({
  minCapacity: 2,
  maxCapacity: 10,
});

// CPU 使用率でスケール
scaling.scaleOnCpuUtilization("CpuScaling", {
  targetUtilizationPercent: 70,
  scaleInCooldown: cdk.Duration.seconds(60),
  scaleOutCooldown: cdk.Duration.seconds(60),
});

// リクエスト数でスケール
scaling.scaleOnRequestCount("RequestScaling", {
  requestsPerTarget: 1000,
  targetGroup: listener.defaultTargetGroup,
});
```

## EC2

### インスタンス作成

```bash
# CLI でインスタンス起動
aws ec2 run-instances \
  --image-id ami-0abcdef1234567890 \
  --instance-type t3.micro \
  --key-name my-key \
  --security-group-ids sg-12345678 \
  --subnet-id subnet-12345678 \
  --tag-specifications 'ResourceType=instance,Tags=[{Key=Name,Value=MyServer}]'
```

### CDK でのセットアップ

```typescript
// lib/ec2-stack.ts
import * as cdk from "aws-cdk-lib";
import * as ec2 from "aws-cdk-lib/aws-ec2";

export class Ec2Stack extends cdk.Stack {
  constructor(scope: cdk.App, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const vpc = new ec2.Vpc(this, "MyVpc");

    // セキュリティグループ
    const sg = new ec2.SecurityGroup(this, "MySG", {
      vpc,
      allowAllOutbound: true,
    });

    sg.addIngressRule(ec2.Peer.anyIpv4(), ec2.Port.tcp(22), "SSH");
    sg.addIngressRule(ec2.Peer.anyIpv4(), ec2.Port.tcp(80), "HTTP");

    // EC2 インスタンス
    const instance = new ec2.Instance(this, "MyInstance", {
      vpc,
      instanceType: ec2.InstanceType.of(
        ec2.InstanceClass.T3,
        ec2.InstanceSize.MICRO,
      ),
      machineImage: ec2.MachineImage.latestAmazonLinux2023(),
      securityGroup: sg,
    });
  }
}
```

## ユースケース別選択

```
┌────────────────────────────────────────────────────────────┐
│                    選択フローチャート                        │
│                                                            │
│  リクエストの性質は？                                        │
│       │                                                    │
│       ├─ イベント駆動/短時間 → Lambda                       │
│       │                                                    │
│       ├─ 常時稼働/コンテナ → Fargate                        │
│       │                                                    │
│       └─ 特殊要件/GPU → EC2                                │
│                                                            │
│  API Gateway + Lambda:                                     │
│    • REST API、GraphQL                                     │
│    • Webhook 受信                                          │
│    • 軽量な処理                                             │
│                                                            │
│  ALB + Fargate:                                            │
│    • Web アプリケーション                                   │
│    • マイクロサービス                                       │
│    • 長時間実行タスク                                       │
│                                                            │
│  EC2:                                                      │
│    • GPU/ML ワークロード                                    │
│    • 特殊なネットワーク要件                                  │
│    • レガシーアプリケーション                                │
└────────────────────────────────────────────────────────────┘
```

## 次のステップ

次章では、ストレージサービスについて学びます。
