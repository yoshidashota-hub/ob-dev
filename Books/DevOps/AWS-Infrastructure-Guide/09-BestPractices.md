# 第9章: ベストプラクティス

## Well-Architected Framework

```
┌─────────────────────────────────────────────────────────────┐
│               AWS Well-Architected の 6 本柱                 │
│                                                             │
│  1. 運用上の優秀性 (Operational Excellence)                  │
│     → 運用の自動化、継続的改善                               │
│                                                             │
│  2. セキュリティ (Security)                                  │
│     → 最小権限、暗号化、監査                                 │
│                                                             │
│  3. 信頼性 (Reliability)                                     │
│     → 障害回復、スケーリング                                 │
│                                                             │
│  4. パフォーマンス効率 (Performance Efficiency)              │
│     → 適切なリソース選択、モニタリング                       │
│                                                             │
│  5. コスト最適化 (Cost Optimization)                         │
│     → 無駄の排除、適切なサイジング                           │
│                                                             │
│  6. 持続可能性 (Sustainability)                              │
│     → 環境負荷の最小化                                       │
└─────────────────────────────────────────────────────────────┘
```

## セキュリティベストプラクティス

### 最小権限の原則

```typescript
// ❌ 広すぎる権限
const badPolicy = new iam.PolicyStatement({
  actions: ["*"],
  resources: ["*"],
});

// ✅ 必要最小限の権限
const goodPolicy = new iam.PolicyStatement({
  actions: ["dynamodb:GetItem", "dynamodb:PutItem", "dynamodb:Query"],
  resources: [table.tableArn, `${table.tableArn}/index/*`],
});

// Lambda に必要な権限のみ付与
fn.addToRolePolicy(goodPolicy);
```

### シークレット管理

```typescript
// 環境変数に直接書かない
// ❌ Bad
const badFn = new lambda.Function(this, "BadFunction", {
  environment: {
    DB_PASSWORD: "secret123", // 危険！
  },
});

// ✅ Secrets Manager を使用
const secret = secretsmanager.Secret.fromSecretNameV2(
  this,
  "DbSecret",
  "my-app/database",
);

const goodFn = new lambda.Function(this, "GoodFunction", {
  environment: {
    SECRET_ARN: secret.secretArn,
  },
});

secret.grantRead(goodFn);
```

### 暗号化

```typescript
// S3 暗号化
const encryptedBucket = new s3.Bucket(this, "EncryptedBucket", {
  encryption: s3.BucketEncryption.S3_MANAGED,
  enforceSSL: true,
  blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
});

// DynamoDB 暗号化
const encryptedTable = new dynamodb.Table(this, "EncryptedTable", {
  encryption: dynamodb.TableEncryption.AWS_MANAGED,
  // ...
});

// RDS 暗号化
const encryptedDb = new rds.DatabaseInstance(this, "EncryptedDb", {
  storageEncrypted: true,
  // ...
});
```

## 信頼性ベストプラクティス

### マルチ AZ 構成

```typescript
// VPC を複数 AZ に展開
const vpc = new ec2.Vpc(this, "Vpc", {
  maxAzs: 3, // 3つの AZ を使用
});

// RDS マルチ AZ
const database = new rds.DatabaseInstance(this, "Database", {
  multiAz: true, // 本番環境では必須
  vpc,
  // ...
});

// ECS サービスを複数 AZ に分散
const service = new ecs.FargateService(this, "Service", {
  cluster,
  taskDefinition,
  desiredCount: 3, // 各 AZ に 1 タスク
  // ...
});
```

### 障害回復

```typescript
// DynamoDB のポイントインタイムリカバリ
const table = new dynamodb.Table(this, "Table", {
  pointInTimeRecovery: true,
  // ...
});

// S3 バージョニング
const bucket = new s3.Bucket(this, "Bucket", {
  versioned: true,
  // ...
});

// RDS 自動バックアップ
const database = new rds.DatabaseInstance(this, "Database", {
  backupRetention: cdk.Duration.days(7),
  deletionProtection: true, // 誤削除防止
  // ...
});
```

### サーキットブレーカー

```typescript
// ECS サーキットブレーカー
const service = new ecs.FargateService(this, "Service", {
  cluster,
  taskDefinition,
  circuitBreaker: {
    rollback: true, // デプロイ失敗時にロールバック
  },
});
```

## パフォーマンスベストプラクティス

### キャッシング戦略

```
┌────────────────────────────────────────────────────────────┐
│                 キャッシュ層                                 │
│                                                            │
│  L1: アプリケーション内キャッシュ                            │
│      → メモリ内（Lambda グローバル変数等）                   │
│                                                            │
│  L2: 分散キャッシュ                                         │
│      → ElastiCache (Redis/Memcached)                       │
│                                                            │
│  L3: CDN キャッシュ                                         │
│      → CloudFront                                          │
│                                                            │
│  L4: データベースキャッシュ                                  │
│      → DAX (DynamoDB Accelerator)                          │
└────────────────────────────────────────────────────────────┘
```

### 非同期処理

```typescript
// SQS で非同期化
const queue = new sqs.Queue(this, "ProcessingQueue", {
  visibilityTimeout: cdk.Duration.seconds(300),
  deadLetterQueue: {
    queue: dlq,
    maxReceiveCount: 3,
  },
});

// API は即座にレスポンス
export async function apiHandler(event: APIGatewayProxyEvent) {
  const message = JSON.parse(event.body!);

  // キューに投入（非同期）
  await sqs.send(
    new SendMessageCommand({
      QueueUrl: process.env.QUEUE_URL,
      MessageBody: JSON.stringify(message),
    }),
  );

  // 即座にレスポンス
  return {
    statusCode: 202,
    body: JSON.stringify({ status: "accepted" }),
  };
}

// ワーカーで処理
export async function workerHandler(event: SQSEvent) {
  for (const record of event.Records) {
    const message = JSON.parse(record.body);
    await processMessage(message);
  }
}
```

## 運用ベストプラクティス

### Infrastructure as Code

```typescript
// すべてを CDK で管理
const app = new cdk.App();

// 環境ごとにスタックを分離
new MyAppStack(app, "MyApp-Dev", {
  env: { region: "ap-northeast-1" },
  stage: "dev",
});

new MyAppStack(app, "MyApp-Prod", {
  env: { region: "ap-northeast-1" },
  stage: "prod",
});

// スタック間の依存関係を明示
interface MyAppStackProps extends cdk.StackProps {
  stage: string;
}

class MyAppStack extends cdk.Stack {
  constructor(scope: cdk.App, id: string, props: MyAppStackProps) {
    super(scope, id, props);

    // 環境に応じた設定
    const isProd = props.stage === "prod";

    const database = new rds.DatabaseInstance(this, "Database", {
      multiAz: isProd,
      instanceType: isProd
        ? ec2.InstanceType.of(ec2.InstanceClass.R6G, ec2.InstanceSize.LARGE)
        : ec2.InstanceType.of(ec2.InstanceClass.T3, ec2.InstanceSize.MICRO),
      // ...
    });
  }
}
```

### CI/CD パイプライン

```typescript
// CDK Pipelines
import * as pipelines from "aws-cdk-lib/pipelines";

const pipeline = new pipelines.CodePipeline(this, "Pipeline", {
  pipelineName: "MyAppPipeline",
  synth: new pipelines.ShellStep("Synth", {
    input: pipelines.CodePipelineSource.gitHub("owner/repo", "main"),
    commands: ["npm ci", "npm run build", "npx cdk synth"],
  }),
});

// ステージを追加
pipeline.addStage(new MyAppStage(this, "Dev", { stage: "dev" }));

pipeline.addStage(new MyAppStage(this, "Prod", { stage: "prod" }), {
  pre: [new pipelines.ManualApprovalStep("PromoteToProd")],
});
```

## チェックリスト

```
セキュリティ:
□ IAM は最小権限
□ シークレットは Secrets Manager に保存
□ 保存データは暗号化
□ 転送データは SSL/TLS
□ CloudTrail で監査ログ有効

信頼性:
□ マルチ AZ 構成
□ 自動バックアップ有効
□ ヘルスチェック設定
□ Auto Scaling 設定
□ 障害時の復旧手順を文書化

パフォーマンス:
□ CloudFront でキャッシュ
□ 適切なインスタンスサイズ
□ データベースインデックス最適化
□ 重い処理は非同期化

コスト:
□ 不要リソースの削除
□ 開発環境は夜間停止
□ リザーブド/Savings Plans 検討
□ コストタグ付け

運用:
□ すべてのリソースは IaC 管理
□ 監視アラート設定
□ ログ保持期間設定
□ CI/CD パイプライン構築
□ ドキュメント整備
```

## 参考リンク

- [AWS Well-Architected](https://aws.amazon.com/architecture/well-architected/)
- [AWS CDK ドキュメント](https://docs.aws.amazon.com/cdk/)
- [AWS Security Best Practices](https://docs.aws.amazon.com/wellarchitected/latest/security-pillar/)
