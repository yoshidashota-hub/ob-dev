# 第3章: ストレージ

## サービス比較

```
┌─────────────────────────────────────────────────────────────┐
│                    Storage Services                          │
│                                                             │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐ │
│  │     S3      │  │     EBS     │  │        EFS          │ │
│  │             │  │             │  │                     │ │
│  │ オブジェクト │  │   ブロック  │  │     ファイル        │ │
│  │ ストレージ  │  │ ストレージ  │  │    ストレージ       │ │
│  │             │  │             │  │                     │ │
│  │ 無制限容量  │  │ EC2専用    │  │   共有可能          │ │
│  └─────────────┘  └─────────────┘  └─────────────────────┘ │
│        ↑               ↑                    ↑              │
│   静的ファイル     ルートボリューム      NFSマウント         │
└─────────────────────────────────────────────────────────────┘
```

## S3（Simple Storage Service）

### バケット作成

```bash
# CLI でバケット作成
aws s3 mb s3://my-unique-bucket-name --region ap-northeast-1

# ファイルアップロード
aws s3 cp ./file.txt s3://my-bucket/

# ディレクトリ同期
aws s3 sync ./dist s3://my-bucket/static --delete
```

### SDK での操作

```typescript
// lib/s3.ts
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  ListObjectsV2Command,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const s3 = new S3Client({ region: "ap-northeast-1" });
const BUCKET = process.env.S3_BUCKET!;

// アップロード
export async function uploadFile(
  key: string,
  body: Buffer | string,
  contentType: string
) {
  await s3.send(
    new PutObjectCommand({
      Bucket: BUCKET,
      Key: key,
      Body: body,
      ContentType: contentType,
    })
  );

  return `https://${BUCKET}.s3.ap-northeast-1.amazonaws.com/${key}`;
}

// ダウンロード
export async function downloadFile(key: string): Promise<Buffer> {
  const response = await s3.send(
    new GetObjectCommand({
      Bucket: BUCKET,
      Key: key,
    })
  );

  return Buffer.from(await response.Body!.transformToByteArray());
}

// 署名付き URL（一時的なアクセス）
export async function getPresignedUrl(
  key: string,
  expiresIn: number = 3600
): Promise<string> {
  const command = new GetObjectCommand({
    Bucket: BUCKET,
    Key: key,
  });

  return getSignedUrl(s3, command, { expiresIn });
}

// アップロード用署名付き URL
export async function getPresignedUploadUrl(
  key: string,
  contentType: string,
  expiresIn: number = 3600
): Promise<string> {
  const command = new PutObjectCommand({
    Bucket: BUCKET,
    Key: key,
    ContentType: contentType,
  });

  return getSignedUrl(s3, command, { expiresIn });
}

// 一覧取得
export async function listFiles(prefix: string) {
  const response = await s3.send(
    new ListObjectsV2Command({
      Bucket: BUCKET,
      Prefix: prefix,
    })
  );

  return response.Contents || [];
}

// 削除
export async function deleteFile(key: string) {
  await s3.send(
    new DeleteObjectCommand({
      Bucket: BUCKET,
      Key: key,
    })
  );
}
```

### バケットポリシー

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "PublicReadForGetBucketObjects",
      "Effect": "Allow",
      "Principal": "*",
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::my-public-bucket/*"
    }
  ]
}
```

### CORS 設定

```json
[
  {
    "AllowedHeaders": ["*"],
    "AllowedMethods": ["GET", "PUT", "POST"],
    "AllowedOrigins": ["https://example.com"],
    "ExposeHeaders": ["ETag"],
    "MaxAgeSeconds": 3000
  }
]
```

### ライフサイクルルール

```typescript
// CDK でライフサイクル設定
import * as s3 from "aws-cdk-lib/aws-s3";

const bucket = new s3.Bucket(this, "MyBucket", {
  lifecycleRules: [
    {
      // 30日後に Glacier に移動
      transitions: [
        {
          storageClass: s3.StorageClass.GLACIER,
          transitionAfter: cdk.Duration.days(30),
        },
      ],
    },
    {
      // tmp/ プレフィックスは 7 日後に削除
      prefix: "tmp/",
      expiration: cdk.Duration.days(7),
    },
  ],
});
```

### ストレージクラス

```
┌────────────────────────────────────────────────────────────┐
│                   S3 Storage Classes                        │
│                                                            │
│  Standard          → 頻繁なアクセス（デフォルト）           │
│  Standard-IA       → 低頻度アクセス（30日以上保存）         │
│  One Zone-IA       → 単一 AZ、低頻度                        │
│  Glacier Instant   → アーカイブ、即時取得                   │
│  Glacier Flexible  → アーカイブ、分～時間で取得             │
│  Glacier Deep      → 長期アーカイブ、12時間以上              │
│  Intelligent-Tier  → 自動でクラス移動                       │
└────────────────────────────────────────────────────────────┘
```

## CloudFront + S3

### 静的サイトホスティング

```typescript
// CDK で CloudFront + S3
import * as cloudfront from "aws-cdk-lib/aws-cloudfront";
import * as origins from "aws-cdk-lib/aws-cloudfront-origins";
import * as s3 from "aws-cdk-lib/aws-s3";
import * as s3deploy from "aws-cdk-lib/aws-s3-deployment";

// S3 バケット
const bucket = new s3.Bucket(this, "WebsiteBucket", {
  blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
});

// CloudFront ディストリビューション
const distribution = new cloudfront.Distribution(this, "Distribution", {
  defaultBehavior: {
    origin: new origins.S3Origin(bucket),
    viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
    cachePolicy: cloudfront.CachePolicy.CACHING_OPTIMIZED,
  },
  defaultRootObject: "index.html",
  errorResponses: [
    {
      httpStatus: 404,
      responseHttpStatus: 200,
      responsePagePath: "/index.html", // SPA 用
    },
  ],
});

// デプロイ
new s3deploy.BucketDeployment(this, "DeployWebsite", {
  sources: [s3deploy.Source.asset("./dist")],
  destinationBucket: bucket,
  distribution,
  distributionPaths: ["/*"],
});
```

## EBS（Elastic Block Store）

### ボリュームタイプ

| タイプ | 用途 | IOPS | スループット |
|--------|------|------|------------|
| gp3 | 汎用 SSD | 最大 16,000 | 最大 1,000 MB/s |
| gp2 | 汎用 SSD（旧） | 容量に比例 | - |
| io2 | 高性能 SSD | 最大 64,000 | - |
| st1 | スループット最適化 HDD | - | 最大 500 MB/s |
| sc1 | コールド HDD | - | 最大 250 MB/s |

### CDK での設定

```typescript
// EC2 + EBS
const instance = new ec2.Instance(this, "Instance", {
  // ...
  blockDevices: [
    {
      deviceName: "/dev/xvda",
      volume: ec2.BlockDeviceVolume.ebs(30, {
        volumeType: ec2.EbsDeviceVolumeType.GP3,
        iops: 3000,
        throughput: 125,
        encrypted: true,
      }),
    },
  ],
});
```

### スナップショット

```bash
# スナップショット作成
aws ec2 create-snapshot \
  --volume-id vol-1234567890abcdef0 \
  --description "Daily backup"

# スナップショットから復元
aws ec2 create-volume \
  --snapshot-id snap-1234567890abcdef0 \
  --availability-zone ap-northeast-1a
```

## EFS（Elastic File System）

### 特徴

```
┌────────────────────────────────────────────────────────────┐
│                        EFS                                  │
│                                                            │
│  • 複数 EC2/ECS から同時マウント可能                        │
│  • 自動スケーリング（容量無制限）                           │
│  • NFS v4 プロトコル                                       │
│  • リージョン内の複数 AZ にレプリケート                     │
│                                                            │
│  ユースケース:                                              │
│  • 共有ファイルストレージ                                   │
│  • コンテンツ管理システム                                   │
│  • 開発環境の共有                                          │
└────────────────────────────────────────────────────────────┘
```

### CDK での設定

```typescript
// EFS + ECS
import * as efs from "aws-cdk-lib/aws-efs";

// EFS ファイルシステム
const fileSystem = new efs.FileSystem(this, "MyEfs", {
  vpc,
  lifecyclePolicy: efs.LifecyclePolicy.AFTER_14_DAYS,
  performanceMode: efs.PerformanceMode.GENERAL_PURPOSE,
  throughputMode: efs.ThroughputMode.BURSTING,
  encrypted: true,
});

// ECS タスク定義にマウント
const taskDefinition = new ecs.FargateTaskDefinition(this, "TaskDef");

const volumeName = "efs-volume";
taskDefinition.addVolume({
  name: volumeName,
  efsVolumeConfiguration: {
    fileSystemId: fileSystem.fileSystemId,
  },
});

const container = taskDefinition.addContainer("AppContainer", {
  image: ecs.ContainerImage.fromRegistry("my-app"),
});

container.addMountPoints({
  sourceVolume: volumeName,
  containerPath: "/data",
  readOnly: false,
});
```

## ユースケース別選択

```
┌────────────────────────────────────────────────────────────┐
│                    選択ガイド                               │
│                                                            │
│  静的ファイル配信 → S3 + CloudFront                        │
│  ユーザーアップロード → S3（署名付き URL）                  │
│  データベースストレージ → EBS（gp3/io2）                   │
│  複数サーバー共有 → EFS                                    │
│  アーカイブ → S3 Glacier                                   │
│  バックアップ → S3 + ライフサイクル                        │
└────────────────────────────────────────────────────────────┘
```

## 次のステップ

次章では、データベースサービスについて学びます。
