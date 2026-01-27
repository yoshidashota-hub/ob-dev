# 第5章: インフラ最適化

## CDN キャッシュ

### CloudFront 設定

```typescript
// CDK で CloudFront 最適化
const distribution = new cloudfront.Distribution(this, "CDN", {
  defaultBehavior: {
    origin: new origins.S3Origin(bucket),
    viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
    // キャッシュポリシー
    cachePolicy: new cloudfront.CachePolicy(this, "CachePolicy", {
      cachePolicyName: "OptimizedCaching",
      defaultTtl: cdk.Duration.days(1),
      maxTtl: cdk.Duration.days(365),
      minTtl: cdk.Duration.seconds(0),
      // クエリ文字列でキャッシュを分ける
      queryStringBehavior: cloudfront.CacheQueryStringBehavior.allowList(
        "v",
        "version"
      ),
      // ヘッダーでキャッシュを分ける（必要最小限）
      headerBehavior: cloudfront.CacheHeaderBehavior.allowList(
        "Accept-Encoding"
      ),
    }),
    // 圧縮を有効化
    compress: true,
  },
  // 静的アセット用ビヘイビア
  additionalBehaviors: {
    "/static/*": {
      origin: new origins.S3Origin(bucket),
      cachePolicy: cloudfront.CachePolicy.CACHING_OPTIMIZED,
      compress: true,
    },
    // API はキャッシュ無効
    "/api/*": {
      origin: new origins.HttpOrigin(apiDomain),
      cachePolicy: cloudfront.CachePolicy.CACHING_DISABLED,
      originRequestPolicy:
        cloudfront.OriginRequestPolicy.ALL_VIEWER_EXCEPT_HOST_HEADER,
    },
  },
});
```

### キャッシュヘッダー

```typescript
// Next.js でキャッシュヘッダー設定
// next.config.js
module.exports = {
  async headers() {
    return [
      {
        // 静的アセット（1年キャッシュ）
        source: "/_next/static/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
      {
        // 画像（1ヶ月キャッシュ）
        source: "/images/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=2592000, stale-while-revalidate=86400",
          },
        ],
      },
      {
        // HTML（短めのキャッシュ）
        source: "/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=0, must-revalidate",
          },
        ],
      },
    ];
  },
};
```

## Lambda 最適化

### コールドスタート削減

```typescript
// 1. 軽量な依存関係
// ❌ AWS SDK v2 全体
import AWS from "aws-sdk";

// ✅ 必要なクライアントのみ
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";

// 2. グローバルスコープで初期化
const dynamodb = new DynamoDBClient({ region: "ap-northeast-1" });

// 3. Bundling 最適化（esbuild）
// serverless.yml または CDK で設定
```

### メモリとパフォーマンス

```typescript
// CDK でメモリ設定
const fn = new lambda.Function(this, "Function", {
  runtime: lambda.Runtime.NODEJS_20_X,
  handler: "index.handler",
  code: lambda.Code.fromAsset("dist"),
  // メモリを増やすと CPU も増加
  memorySize: 1024, // 1GB
  timeout: cdk.Duration.seconds(30),
  // ARM64 は x86 より高速かつ安価
  architecture: lambda.Architecture.ARM_64,
  // SnapStart（Java 向け、Node.js は効果限定的）
});

// Provisioned Concurrency（常時起動）
const alias = new lambda.Alias(this, "ProdAlias", {
  aliasName: "prod",
  version: fn.currentVersion,
  provisionedConcurrentExecutions: 5,
});
```

### Lambda Power Tuning

```bash
# AWS Lambda Power Tuning を実行
# https://github.com/alexcasalboni/aws-lambda-power-tuning

# Step Functions で最適なメモリサイズを探索
# 結果例:
# 128MB: 2000ms, $0.000004
# 256MB: 1000ms, $0.000004
# 512MB:  500ms, $0.000004
# 1024MB: 300ms, $0.000005
# → 512MB がコスト効率最適
```

## ECS/Fargate 最適化

### リソース設定

```typescript
// タスク定義の最適化
const taskDefinition = new ecs.FargateTaskDefinition(this, "TaskDef", {
  // メモリと CPU の組み合わせ
  memoryLimitMiB: 1024,
  cpu: 512,
  // ARM64 で 20% コスト削減
  runtimePlatform: {
    cpuArchitecture: ecs.CpuArchitecture.ARM64,
    operatingSystemFamily: ecs.OperatingSystemFamily.LINUX,
  },
});

// コンテナ設定
const container = taskDefinition.addContainer("App", {
  image: ecs.ContainerImage.fromRegistry("my-app"),
  // ヘルスチェック
  healthCheck: {
    command: ["CMD-SHELL", "curl -f http://localhost:3000/health || exit 1"],
    interval: cdk.Duration.seconds(30),
    timeout: cdk.Duration.seconds(5),
    retries: 3,
  },
  // ログ設定
  logging: ecs.LogDrivers.awsLogs({
    streamPrefix: "app",
    logRetention: logs.RetentionDays.ONE_MONTH,
  }),
});
```

### Auto Scaling

```typescript
// CPU/メモリベースのスケーリング
const scaling = service.autoScaleTaskCount({
  minCapacity: 2,
  maxCapacity: 20,
});

scaling.scaleOnCpuUtilization("CpuScaling", {
  targetUtilizationPercent: 70,
  scaleInCooldown: cdk.Duration.seconds(60),
  scaleOutCooldown: cdk.Duration.seconds(60),
});

// リクエストベースのスケーリング
scaling.scaleOnRequestCount("RequestScaling", {
  requestsPerTarget: 1000,
  targetGroup: targetGroup,
});
```

## ElastiCache 活用

### Redis 設定

```typescript
// CDK で ElastiCache
const redis = new elasticache.CfnReplicationGroup(this, "Redis", {
  replicationGroupDescription: "App Cache",
  engine: "redis",
  cacheNodeType: "cache.t3.micro",
  numCacheClusters: 2, // Multi-AZ
  automaticFailoverEnabled: true,
  atRestEncryptionEnabled: true,
  transitEncryptionEnabled: true,
  // クラスターモード
  // numNodeGroups: 3,
  // replicasPerNodeGroup: 1,
});
```

### キャッシュパターン

```typescript
// lib/cache.ts
import Redis from "ioredis";

const redis = new Redis({
  host: process.env.REDIS_HOST,
  port: 6379,
  maxRetriesPerRequest: 3,
  retryDelayOnFailover: 100,
});

// 1. Read-Through キャッシュ
async function getWithCache<T>(
  key: string,
  fetchFn: () => Promise<T>,
  ttl: number = 300
): Promise<T> {
  const cached = await redis.get(key);
  if (cached) return JSON.parse(cached);

  const data = await fetchFn();
  await redis.setex(key, ttl, JSON.stringify(data));
  return data;
}

// 2. Write-Through キャッシュ
async function setWithCache<T>(
  key: string,
  data: T,
  saveFn: (data: T) => Promise<void>,
  ttl: number = 300
): Promise<void> {
  await saveFn(data);
  await redis.setex(key, ttl, JSON.stringify(data));
}

// 3. Cache-Aside（明示的な無効化）
async function invalidateCache(pattern: string): Promise<void> {
  const keys = await redis.keys(pattern);
  if (keys.length > 0) {
    await redis.del(...keys);
  }
}
```

## ネットワーク最適化

### VPC エンドポイント

```typescript
// NAT Gateway を経由しないで AWS サービスにアクセス
const vpc = new ec2.Vpc(this, "VPC");

// S3 Gateway エンドポイント（無料）
vpc.addGatewayEndpoint("S3Endpoint", {
  service: ec2.GatewayVpcEndpointAwsService.S3,
});

// DynamoDB Gateway エンドポイント（無料）
vpc.addGatewayEndpoint("DynamoEndpoint", {
  service: ec2.GatewayVpcEndpointAwsService.DYNAMODB,
});

// その他のサービス用 Interface エンドポイント
vpc.addInterfaceEndpoint("SecretsEndpoint", {
  service: ec2.InterfaceVpcEndpointAwsService.SECRETS_MANAGER,
});
```

### HTTP/2 と Keep-Alive

```typescript
// ALB で HTTP/2 有効化（デフォルト）
const alb = new elbv2.ApplicationLoadBalancer(this, "ALB", {
  vpc,
  internetFacing: true,
});

// ターゲットグループで Keep-Alive 設定
const targetGroup = new elbv2.ApplicationTargetGroup(this, "TG", {
  vpc,
  port: 3000,
  protocol: elbv2.ApplicationProtocol.HTTP,
  healthCheck: {
    path: "/health",
    interval: cdk.Duration.seconds(30),
  },
  deregistrationDelay: cdk.Duration.seconds(30),
});
```

## 次のステップ

次章では、継続的なパフォーマンス改善について学びます。
