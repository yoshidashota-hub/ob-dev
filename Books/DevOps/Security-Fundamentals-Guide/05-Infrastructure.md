# 第5章: インフラセキュリティ

## AWS セキュリティ基礎

```
┌─────────────────────────────────────────────────────────────┐
│              AWS セキュリティサービス                         │
│                                                             │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐ │
│  │    IAM      │  │     KMS     │  │  Secrets Manager    │ │
│  │  認証・認可 │  │  暗号化鍵   │  │  シークレット管理   │ │
│  └─────────────┘  └─────────────┘  └─────────────────────┘ │
│                                                             │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐ │
│  │     WAF     │  │ CloudTrail  │  │    GuardDuty        │ │
│  │ Web 防御   │  │  監査ログ   │  │  脅威検知           │ │
│  └─────────────┘  └─────────────┘  └─────────────────────┘ │
│                                                             │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐ │
│  │Security Hub │  │   Config    │  │     Inspector       │ │
│  │  統合管理   │  │  設定監査   │  │  脆弱性スキャン     │ │
│  └─────────────┘  └─────────────┘  └─────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

## IAM セキュリティ

### 最小権限ポリシー

```typescript
// CDK で最小権限ポリシー
import * as iam from "aws-cdk-lib/aws-iam";

// ❌ 広すぎる権限
const badPolicy = new iam.PolicyStatement({
  actions: ["s3:*"],
  resources: ["*"],
});

// ✅ 必要最小限
const goodPolicy = new iam.PolicyStatement({
  actions: ["s3:GetObject", "s3:PutObject"],
  resources: [`${bucket.bucketArn}/uploads/*`],
  conditions: {
    // IP 制限
    IpAddress: {
      "aws:SourceIp": ["203.0.113.0/24"],
    },
  },
});

// Lambda 用ロール
const lambdaRole = new iam.Role(this, "LambdaRole", {
  assumedBy: new iam.ServicePrincipal("lambda.amazonaws.com"),
  // 必要な権限のみ
  inlinePolicies: {
    main: new iam.PolicyDocument({
      statements: [
        new iam.PolicyStatement({
          actions: ["logs:CreateLogGroup", "logs:CreateLogStream", "logs:PutLogEvents"],
          resources: ["arn:aws:logs:*:*:*"],
        }),
        new iam.PolicyStatement({
          actions: ["dynamodb:GetItem", "dynamodb:PutItem", "dynamodb:Query"],
          resources: [table.tableArn],
        }),
      ],
    }),
  },
});
```

### サービスコントロールポリシー（SCP）

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "DenyRootUser",
      "Effect": "Deny",
      "Action": "*",
      "Resource": "*",
      "Condition": {
        "StringEquals": {
          "aws:PrincipalType": "Root"
        }
      }
    },
    {
      "Sid": "RequireMFA",
      "Effect": "Deny",
      "Action": "*",
      "Resource": "*",
      "Condition": {
        "BoolIfExists": {
          "aws:MultiFactorAuthPresent": "false"
        }
      }
    }
  ]
}
```

## WAF（Web Application Firewall）

### WAF ルール設定

```typescript
// CDK で WAF 設定
import * as wafv2 from "aws-cdk-lib/aws-wafv2";

const webAcl = new wafv2.CfnWebACL(this, "WebACL", {
  defaultAction: { allow: {} },
  scope: "CLOUDFRONT",
  visibilityConfig: {
    cloudWatchMetricsEnabled: true,
    metricName: "WebACL",
    sampledRequestsEnabled: true,
  },
  rules: [
    // AWS マネージドルール - 一般的な攻撃
    {
      name: "AWSManagedRulesCommonRuleSet",
      priority: 1,
      statement: {
        managedRuleGroupStatement: {
          vendorName: "AWS",
          name: "AWSManagedRulesCommonRuleSet",
        },
      },
      overrideAction: { none: {} },
      visibilityConfig: {
        cloudWatchMetricsEnabled: true,
        metricName: "CommonRules",
        sampledRequestsEnabled: true,
      },
    },
    // SQL インジェクション対策
    {
      name: "AWSManagedRulesSQLiRuleSet",
      priority: 2,
      statement: {
        managedRuleGroupStatement: {
          vendorName: "AWS",
          name: "AWSManagedRulesSQLiRuleSet",
        },
      },
      overrideAction: { none: {} },
      visibilityConfig: {
        cloudWatchMetricsEnabled: true,
        metricName: "SQLiRules",
        sampledRequestsEnabled: true,
      },
    },
    // レート制限
    {
      name: "RateLimitRule",
      priority: 3,
      statement: {
        rateBasedStatement: {
          limit: 2000, // 5分間で2000リクエスト
          aggregateKeyType: "IP",
        },
      },
      action: { block: {} },
      visibilityConfig: {
        cloudWatchMetricsEnabled: true,
        metricName: "RateLimit",
        sampledRequestsEnabled: true,
      },
    },
    // 地理的制限
    {
      name: "GeoBlockRule",
      priority: 4,
      statement: {
        geoMatchStatement: {
          countryCodes: ["KP", "IR", "CU"], // 制裁対象国
        },
      },
      action: { block: {} },
      visibilityConfig: {
        cloudWatchMetricsEnabled: true,
        metricName: "GeoBlock",
        sampledRequestsEnabled: true,
      },
    },
  ],
});
```

## VPC セキュリティ

### セキュリティグループ

```typescript
// 最小限のインバウンドルール
const albSg = new ec2.SecurityGroup(this, "ALB-SG", {
  vpc,
  description: "ALB Security Group",
});
albSg.addIngressRule(ec2.Peer.anyIpv4(), ec2.Port.tcp(443), "HTTPS");

const appSg = new ec2.SecurityGroup(this, "App-SG", {
  vpc,
  description: "Application Security Group",
});
// ALB からのみアクセス許可
appSg.addIngressRule(albSg, ec2.Port.tcp(3000), "From ALB");

const dbSg = new ec2.SecurityGroup(this, "DB-SG", {
  vpc,
  description: "Database Security Group",
});
// アプリケーションからのみアクセス許可
dbSg.addIngressRule(appSg, ec2.Port.tcp(5432), "PostgreSQL from App");
```

### ネットワーク ACL

```typescript
// プライベートサブネット用 NACL
const nacl = new ec2.NetworkAcl(this, "PrivateNACL", {
  vpc,
  subnetSelection: { subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS },
});

// インバウンド: VPC 内からのみ許可
nacl.addEntry("AllowVPCInbound", {
  ruleNumber: 100,
  cidr: ec2.AclCidr.ipv4(vpc.vpcCidrBlock),
  traffic: ec2.AclTraffic.allTraffic(),
  direction: ec2.TrafficDirection.INGRESS,
  ruleAction: ec2.Action.ALLOW,
});

// アウトバウンド: 必要なポートのみ
nacl.addEntry("AllowHTTPSOutbound", {
  ruleNumber: 100,
  cidr: ec2.AclCidr.anyIpv4(),
  traffic: ec2.AclTraffic.tcpPort(443),
  direction: ec2.TrafficDirection.EGRESS,
  ruleAction: ec2.Action.ALLOW,
});
```

## 監査とログ

### CloudTrail

```typescript
// CDK で CloudTrail 設定
import * as cloudtrail from "aws-cdk-lib/aws-cloudtrail";

const trail = new cloudtrail.Trail(this, "AuditTrail", {
  bucket: logBucket,
  sendToCloudWatchLogs: true,
  cloudWatchLogsRetention: logs.RetentionDays.ONE_YEAR,
  // データイベント（S3、Lambda）も記録
  enableFileValidation: true,
  includeGlobalServiceEvents: true,
  isMultiRegionTrail: true,
});

// 特定の S3 バケットへのアクセスを記録
trail.addS3EventSelector([{ bucket: sensitiveBucket }], {
  readWriteType: cloudtrail.ReadWriteType.ALL,
});
```

### GuardDuty

```typescript
// CDK で GuardDuty 有効化
import * as guardduty from "aws-cdk-lib/aws-guardduty";

const detector = new guardduty.CfnDetector(this, "GuardDuty", {
  enable: true,
  findingPublishingFrequency: "FIFTEEN_MINUTES",
  dataSources: {
    s3Logs: { enable: true },
    kubernetes: {
      auditLogs: { enable: true },
    },
  },
});

// 検出結果を SNS に送信
const rule = new events.Rule(this, "GuardDutyRule", {
  eventPattern: {
    source: ["aws.guardduty"],
    detailType: ["GuardDuty Finding"],
  },
});

rule.addTarget(new targets.SnsTopic(alertTopic));
```

## セキュリティ監視アラート

```typescript
// 不正アクセス検知アラート
const rootLoginAlarm = new cloudwatch.Alarm(this, "RootLoginAlarm", {
  metric: new cloudwatch.Metric({
    namespace: "CloudTrailMetrics",
    metricName: "RootAccountUsage",
    statistic: "Sum",
    period: cdk.Duration.minutes(5),
  }),
  threshold: 1,
  evaluationPeriods: 1,
  alarmDescription: "Root account login detected",
});

// IAM ポリシー変更検知
const iamChangeAlarm = new cloudwatch.Alarm(this, "IAMChangeAlarm", {
  metric: new cloudwatch.Metric({
    namespace: "CloudTrailMetrics",
    metricName: "IAMPolicyChanges",
    statistic: "Sum",
    period: cdk.Duration.minutes(5),
  }),
  threshold: 1,
  evaluationPeriods: 1,
  alarmDescription: "IAM policy changed",
});
```

## 次のステップ

次章では、セキュリティテストについて学びます。
