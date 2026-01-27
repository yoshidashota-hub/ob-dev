# 第1章: IAM とセキュリティ

## IAM の概要

Identity and Access Management - AWS リソースへのアクセス制御。

```
┌─────────────────────────────────────────────────────┐
│                    IAM                               │
│                                                     │
│  ┌─────────┐  ┌─────────┐  ┌─────────┐            │
│  │  User   │  │  Group  │  │  Role   │            │
│  │         │  │         │  │         │            │
│  │ 個人    │  │ チーム  │  │ サービス │            │
│  └────┬────┘  └────┬────┘  └────┬────┘            │
│       │            │            │                  │
│       └────────────┴────────────┘                  │
│                    │                               │
│                    ▼                               │
│            ┌─────────────┐                        │
│            │   Policy    │                        │
│            │  (権限定義) │                        │
│            └─────────────┘                        │
└─────────────────────────────────────────────────────┘
```

## ユーザーとグループ

### ユーザー作成

```bash
# CLI でユーザー作成
aws iam create-user --user-name developer1

# アクセスキー作成
aws iam create-access-key --user-name developer1
```

### グループ管理

```bash
# グループ作成
aws iam create-group --group-name Developers

# ユーザーをグループに追加
aws iam add-user-to-group --user-name developer1 --group-name Developers

# ポリシーをグループにアタッチ
aws iam attach-group-policy \
  --group-name Developers \
  --policy-arn arn:aws:iam::aws:policy/PowerUserAccess
```

## IAM ポリシー

### ポリシー構造

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "AllowS3Access",
      "Effect": "Allow",
      "Action": ["s3:GetObject", "s3:PutObject"],
      "Resource": "arn:aws:s3:::my-bucket/*",
      "Condition": {
        "IpAddress": {
          "aws:SourceIp": "203.0.113.0/24"
        }
      }
    }
  ]
}
```

### 最小権限の原則

```json
// ❌ 広すぎる権限
{
  "Effect": "Allow",
  "Action": "s3:*",
  "Resource": "*"
}

// ✅ 必要な権限のみ
{
  "Effect": "Allow",
  "Action": [
    "s3:GetObject",
    "s3:PutObject"
  ],
  "Resource": "arn:aws:s3:::my-app-bucket/uploads/*"
}
```

## IAM ロール

### Lambda 用ロール

```json
// 信頼ポリシー（誰がこのロールを使えるか）
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "Service": "lambda.amazonaws.com"
      },
      "Action": "sts:AssumeRole"
    }
  ]
}
```

```json
// 権限ポリシー（何ができるか）
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "logs:CreateLogGroup",
        "logs:CreateLogStream",
        "logs:PutLogEvents"
      ],
      "Resource": "arn:aws:logs:*:*:*"
    },
    {
      "Effect": "Allow",
      "Action": ["dynamodb:GetItem", "dynamodb:PutItem"],
      "Resource": "arn:aws:dynamodb:*:*:table/MyTable"
    }
  ]
}
```

### クロスアカウントアクセス

```json
// アカウント B のロール信頼ポリシー
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "AWS": "arn:aws:iam::ACCOUNT_A_ID:root"
      },
      "Action": "sts:AssumeRole"
    }
  ]
}
```

## Secrets Manager

### シークレット作成

```bash
aws secretsmanager create-secret \
  --name my-app/database \
  --secret-string '{"username":"admin","password":"secret123"}'
```

### シークレット取得（Node.js）

```typescript
import {
  SecretsManagerClient,
  GetSecretValueCommand,
} from "@aws-sdk/client-secrets-manager";

const client = new SecretsManagerClient({ region: "ap-northeast-1" });

async function getSecret(secretName: string) {
  const response = await client.send(
    new GetSecretValueCommand({ SecretId: secretName }),
  );
  return JSON.parse(response.SecretString!);
}

// 使用例
const dbCredentials = await getSecret("my-app/database");
console.log(dbCredentials.username);
```

### Lambda での使用

```typescript
// Lambda 関数
import { getSecret } from "./secrets";

let cachedSecret: any = null;

export async function handler(event: any) {
  // 初回のみ取得（コールドスタート時）
  if (!cachedSecret) {
    cachedSecret = await getSecret("my-app/database");
  }

  // シークレットを使用
  const connection = await connectDB(cachedSecret);
  // ...
}
```

## セキュリティベストプラクティス

### MFA の有効化

```bash
# 仮想 MFA デバイス作成
aws iam create-virtual-mfa-device \
  --virtual-mfa-device-name developer1-mfa \
  --outfile QRCode.png \
  --bootstrap-method QRCodePNG
```

### パスワードポリシー

```bash
aws iam update-account-password-policy \
  --minimum-password-length 14 \
  --require-symbols \
  --require-numbers \
  --require-uppercase-characters \
  --require-lowercase-characters \
  --max-password-age 90 \
  --password-reuse-prevention 12
```

### CloudTrail 監査

```bash
# 証跡の作成
aws cloudtrail create-trail \
  --name my-audit-trail \
  --s3-bucket-name my-cloudtrail-logs \
  --is-multi-region-trail
```

## 次のステップ

次章では、コンピューティングサービスについて学びます。
