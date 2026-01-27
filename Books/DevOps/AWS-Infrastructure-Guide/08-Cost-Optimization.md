# 第8章: コスト最適化

## コスト管理の基本

```
┌─────────────────────────────────────────────────────────────┐
│                 AWS Cost Management                          │
│                                                             │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐ │
│  │Cost Explorer│  │  Budgets    │  │    Cost Anomaly     │ │
│  │             │  │             │  │     Detection       │ │
│  │ 可視化      │  │ 予算設定    │  │ 異常検知           │ │
│  │ 分析        │  │ アラート    │  │ 自動通知           │ │
│  └─────────────┘  └─────────────┘  └─────────────────────┘ │
│                                                             │
│  主なコスト要因:                                             │
│  • コンピューティング（Lambda, ECS, EC2）                    │
│  • ストレージ（S3, EBS）                                     │
│  • データ転送（特にアウトバウンド）                          │
│  • データベース（RDS, DynamoDB）                             │
└─────────────────────────────────────────────────────────────┘
```

## 予算とアラート

### AWS Budgets 設定

```bash
# CLI で予算作成
aws budgets create-budget \
  --account-id 123456789012 \
  --budget '{
    "BudgetName": "Monthly-Budget",
    "BudgetLimit": {
      "Amount": "100",
      "Unit": "USD"
    },
    "BudgetType": "COST",
    "TimeUnit": "MONTHLY"
  }' \
  --notifications-with-subscribers '[
    {
      "Notification": {
        "NotificationType": "ACTUAL",
        "ComparisonOperator": "GREATER_THAN",
        "Threshold": 80,
        "ThresholdType": "PERCENTAGE"
      },
      "Subscribers": [
        {
          "SubscriptionType": "EMAIL",
          "Address": "admin@example.com"
        }
      ]
    }
  ]'
```

### CDK で予算設定

```typescript
// CDK で予算とアラート
import * as budgets from "aws-cdk-lib/aws-budgets";

new budgets.CfnBudget(this, "MonthlyBudget", {
  budget: {
    budgetName: "Monthly-Budget",
    budgetType: "COST",
    timeUnit: "MONTHLY",
    budgetLimit: {
      amount: 100,
      unit: "USD",
    },
  },
  notificationsWithSubscribers: [
    {
      notification: {
        notificationType: "ACTUAL",
        comparisonOperator: "GREATER_THAN",
        threshold: 50,
        thresholdType: "PERCENTAGE",
      },
      subscribers: [
        {
          subscriptionType: "EMAIL",
          address: "admin@example.com",
        },
      ],
    },
    {
      notification: {
        notificationType: "ACTUAL",
        comparisonOperator: "GREATER_THAN",
        threshold: 80,
        thresholdType: "PERCENTAGE",
      },
      subscribers: [
        {
          subscriptionType: "EMAIL",
          address: "admin@example.com",
        },
      ],
    },
  ],
});
```

## サービス別最適化

### Lambda

```
┌────────────────────────────────────────────────────────────┐
│                 Lambda コスト最適化                          │
│                                                            │
│  1. 適切なメモリサイズ                                      │
│     • メモリ増加 = CPU 増加 = 実行時間短縮                  │
│     • AWS Lambda Power Tuning で最適値を探す               │
│                                                            │
│  2. コールドスタート削減                                    │
│     • Provisioned Concurrency（高コスト注意）               │
│     • 定期的な warm-up 呼び出し                             │
│                                                            │
│  3. コード最適化                                            │
│     • 初期化コードを最小化                                  │
│     • 依存関係を削減                                        │
│     • Layer で共通コードを共有                              │
└────────────────────────────────────────────────────────────┘
```

```typescript
// Lambda Power Tuning 結果を反映
const fn = new lambda.Function(this, "OptimizedFunction", {
  runtime: lambda.Runtime.NODEJS_20_X,
  memorySize: 1024, // Power Tuning で最適化した値
  timeout: cdk.Duration.seconds(10),
  // Arm64 は x86 より 20% 安い
  architecture: lambda.Architecture.ARM_64,
});
```

### S3

```typescript
// ライフサイクルルールでコスト削減
const bucket = new s3.Bucket(this, "OptimizedBucket", {
  lifecycleRules: [
    {
      // 30日後に IA に移動
      transitions: [
        {
          storageClass: s3.StorageClass.INFREQUENT_ACCESS,
          transitionAfter: cdk.Duration.days(30),
        },
        // 90日後に Glacier に移動
        {
          storageClass: s3.StorageClass.GLACIER,
          transitionAfter: cdk.Duration.days(90),
        },
      ],
    },
    {
      // ログは 30 日で削除
      prefix: "logs/",
      expiration: cdk.Duration.days(30),
    },
    {
      // 不完全なマルチパートアップロードを削除
      abortIncompleteMultipartUploadAfter: cdk.Duration.days(7),
    },
  ],
  // Intelligent-Tiering で自動最適化
  intelligentTieringConfigurations: [
    {
      name: "auto-tier",
      archiveAccessTierTime: cdk.Duration.days(90),
      deepArchiveAccessTierTime: cdk.Duration.days(180),
    },
  ],
});
```

### DynamoDB

```typescript
// オンデマンドキャパシティ（変動ワークロード向け）
const onDemandTable = new dynamodb.Table(this, "OnDemandTable", {
  partitionKey: { name: "pk", type: dynamodb.AttributeType.STRING },
  billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
});

// プロビジョニング（安定ワークロード向け・最大70%割引）
const provisionedTable = new dynamodb.Table(this, "ProvisionedTable", {
  partitionKey: { name: "pk", type: dynamodb.AttributeType.STRING },
  billingMode: dynamodb.BillingMode.PROVISIONED,
  readCapacity: 5,
  writeCapacity: 5,
});

// Auto Scaling
const readScaling = provisionedTable.autoScaleReadCapacity({
  minCapacity: 5,
  maxCapacity: 100,
});

readScaling.scaleOnUtilization({
  targetUtilizationPercent: 70,
});
```

### RDS

```
┌────────────────────────────────────────────────────────────┐
│                   RDS コスト最適化                           │
│                                                            │
│  1. リザーブドインスタンス                                   │
│     • 1年: 約30%割引                                        │
│     • 3年: 約50%割引                                        │
│                                                            │
│  2. Aurora Serverless v2                                   │
│     • 使用量に応じて自動スケール                             │
│     • 最小 0.5 ACU から                                     │
│                                                            │
│  3. 開発環境の停止                                          │
│     • 夜間・週末は停止                                      │
│     • EventBridge でスケジュール                            │
└────────────────────────────────────────────────────────────┘
```

```typescript
// RDS 自動停止（開発環境）
import * as events from "aws-cdk-lib/aws-events";
import * as targets from "aws-cdk-lib/aws-events-targets";

// 停止 Lambda
const stopDbFn = new lambda.Function(this, "StopDbFunction", {
  runtime: lambda.Runtime.NODEJS_20_X,
  handler: "index.handler",
  code: lambda.Code.fromInline(`
    const { RDSClient, StopDBInstanceCommand } = require("@aws-sdk/client-rds");
    const rds = new RDSClient({});
    exports.handler = async () => {
      await rds.send(new StopDBInstanceCommand({
        DBInstanceIdentifier: process.env.DB_INSTANCE_ID
      }));
    };
  `),
  environment: {
    DB_INSTANCE_ID: database.instanceIdentifier,
  },
});

// 毎日 20:00 に停止
new events.Rule(this, "StopDbRule", {
  schedule: events.Schedule.cron({ hour: "11", minute: "0" }), // UTC
  targets: [new targets.LambdaFunction(stopDbFn)],
});
```

## データ転送コスト

```
┌────────────────────────────────────────────────────────────┐
│               データ転送コスト削減                           │
│                                                            │
│  無料:                                                      │
│  • インバウンド（AWS への転送）                              │
│  • 同一 AZ 内のプライベート IP 通信                          │
│                                                            │
│  有料:                                                      │
│  • インターネットへのアウトバウンド                          │
│  • AZ 間通信                                                │
│  • リージョン間通信                                         │
│                                                            │
│  最適化:                                                    │
│  • CloudFront でキャッシュ                                  │
│  • VPC エンドポイントで NAT Gateway バイパス                │
│  • 圧縮を活用                                               │
└────────────────────────────────────────────────────────────┘
```

### VPC エンドポイント

```typescript
// VPC エンドポイントで NAT Gateway コスト削減
const vpc = new ec2.Vpc(this, "Vpc");

// S3 Gateway エンドポイント（無料）
vpc.addGatewayEndpoint("S3Endpoint", {
  service: ec2.GatewayVpcEndpointAwsService.S3,
});

// DynamoDB Gateway エンドポイント（無料）
vpc.addGatewayEndpoint("DynamoEndpoint", {
  service: ec2.GatewayVpcEndpointAwsService.DYNAMODB,
});

// Secrets Manager Interface エンドポイント（有料だが NAT より安い場合も）
vpc.addInterfaceEndpoint("SecretsManagerEndpoint", {
  service: ec2.InterfaceVpcEndpointAwsService.SECRETS_MANAGER,
});
```

## コストタグ付け

```typescript
// すべてのリソースにタグを付与
import { Tags } from "aws-cdk-lib";

// スタック全体にタグを適用
Tags.of(this).add("Environment", "production");
Tags.of(this).add("Project", "my-app");
Tags.of(this).add("CostCenter", "engineering");
Tags.of(this).add("Owner", "team-a");

// 特定リソースにタグを追加
Tags.of(fn).add("Service", "api");
```

### コスト配分レポート

```bash
# Cost Explorer API でコスト取得
aws ce get-cost-and-usage \
  --time-period Start=2024-01-01,End=2024-01-31 \
  --granularity MONTHLY \
  --metrics BlendedCost \
  --group-by Type=TAG,Key=Project
```

## Savings Plans / Reserved Instances

```
┌────────────────────────────────────────────────────────────┐
│              Savings Plans vs Reserved Instances            │
│                                                            │
│  Savings Plans:                                            │
│  • Compute SP: Lambda, Fargate, EC2 に適用                 │
│  • EC2 Instance SP: EC2 のみ（より高割引）                  │
│  • 柔軟性が高い                                             │
│                                                            │
│  Reserved Instances:                                       │
│  • 特定インスタンスタイプに固定                             │
│  • より高い割引率                                           │
│  • RDS, ElastiCache 等にも適用可能                         │
│                                                            │
│  推奨:                                                      │
│  • 安定したワークロード → Reserved Instances               │
│  • 変動するワークロード → Savings Plans                    │
└────────────────────────────────────────────────────────────┘
```

## コスト監視ダッシュボード

```typescript
// コスト異常検知
import * as ce from "aws-cdk-lib/aws-ce";

new ce.CfnAnomalyMonitor(this, "AnomalyMonitor", {
  monitorName: "ServiceCostMonitor",
  monitorType: "DIMENSIONAL",
  monitorDimension: "SERVICE",
});

new ce.CfnAnomalySubscription(this, "AnomalySubscription", {
  subscriptionName: "CostAnomalyAlert",
  monitorArnList: [/* monitor ARN */],
  subscribers: [
    {
      type: "EMAIL",
      address: "admin@example.com",
    },
  ],
  threshold: 10, // $10 以上の異常で通知
  frequency: "DAILY",
});
```

## 次のステップ

次章では、ベストプラクティスについて学びます。
