# 第7章: 監視とログ

## CloudWatch 概要

```
┌─────────────────────────────────────────────────────────────┐
│                    CloudWatch                                │
│                                                             │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐ │
│  │   Metrics   │  │    Logs     │  │      Alarms         │ │
│  │             │  │             │  │                     │ │
│  │ CPU, Memory │  │ アプリログ  │  │ 閾値監視           │ │
│  │ Request等   │  │ システムログ│  │ 自動通知           │ │
│  └─────────────┘  └─────────────┘  └─────────────────────┘ │
│                                                             │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐ │
│  │ Dashboards  │  │   Events    │  │     Insights        │ │
│  │             │  │             │  │                     │ │
│  │ 可視化      │  │ スケジュール│  │ ログ分析           │ │
│  │             │  │ トリガー    │  │ 異常検知           │ │
│  └─────────────┘  └─────────────┘  └─────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

## CloudWatch Logs

### Lambda ログ出力

```typescript
// 構造化ログ
interface LogContext {
  requestId: string;
  userId?: string;
  action: string;
  [key: string]: any;
}

function log(level: "INFO" | "WARN" | "ERROR", message: string, context: LogContext) {
  console.log(
    JSON.stringify({
      timestamp: new Date().toISOString(),
      level,
      message,
      ...context,
    })
  );
}

export async function handler(event: APIGatewayProxyEvent) {
  const requestId = event.requestContext.requestId;

  log("INFO", "Request received", {
    requestId,
    action: "handleRequest",
    path: event.path,
    method: event.httpMethod,
  });

  try {
    const result = await processRequest(event);

    log("INFO", "Request completed", {
      requestId,
      action: "handleRequest",
      statusCode: 200,
    });

    return { statusCode: 200, body: JSON.stringify(result) };
  } catch (error) {
    log("ERROR", "Request failed", {
      requestId,
      action: "handleRequest",
      error: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : undefined,
    });

    return { statusCode: 500, body: JSON.stringify({ error: "Internal Error" }) };
  }
}
```

### ログインサイトクエリ

```sql
-- エラーログの集計
fields @timestamp, @message, @logStream
| filter @message like /ERROR/
| stats count(*) as errorCount by bin(1h)
| sort @timestamp desc

-- レイテンシ分析
fields @timestamp, @message
| parse @message /Duration: (?<duration>\d+\.\d+) ms/
| stats avg(duration) as avgDuration, max(duration) as maxDuration by bin(5m)

-- 特定ユーザーのアクティビティ
fields @timestamp, @message
| filter @message like /userId.*user123/
| sort @timestamp desc
| limit 100

-- Lambda コールドスタート検出
fields @timestamp, @message, @logStream
| filter @message like /Init Duration/
| parse @message /Init Duration: (?<initDuration>\d+\.\d+) ms/
| stats count(*) as coldStarts, avg(initDuration) as avgInitDuration by bin(1h)
```

### ログ保持期間設定

```typescript
// CDK でログ保持期間設定
import * as logs from "aws-cdk-lib/aws-logs";

const logGroup = new logs.LogGroup(this, "AppLogGroup", {
  logGroupName: "/app/my-service",
  retention: logs.RetentionDays.ONE_MONTH,
  removalPolicy: cdk.RemovalPolicy.DESTROY,
});

// Lambda に関連付け
const fn = new lambda.Function(this, "MyFunction", {
  // ...
  logGroup,
});
```

## CloudWatch Metrics

### カスタムメトリクス

```typescript
// lib/metrics.ts
import {
  CloudWatchClient,
  PutMetricDataCommand,
} from "@aws-sdk/client-cloudwatch";

const cloudwatch = new CloudWatchClient({ region: "ap-northeast-1" });

export async function putMetric(
  metricName: string,
  value: number,
  dimensions: Record<string, string> = {}
) {
  await cloudwatch.send(
    new PutMetricDataCommand({
      Namespace: "MyApp",
      MetricData: [
        {
          MetricName: metricName,
          Value: value,
          Unit: "Count",
          Dimensions: Object.entries(dimensions).map(([Name, Value]) => ({
            Name,
            Value,
          })),
          Timestamp: new Date(),
        },
      ],
    })
  );
}

// 使用例
await putMetric("OrderCreated", 1, { Environment: "prod", Region: "tokyo" });
await putMetric("OrderAmount", 5000, { Environment: "prod" });
```

### Embedded Metric Format（EMF）

```typescript
// EMF を使った効率的なメトリクス出力
function emitMetric(
  namespace: string,
  metrics: Record<string, number>,
  dimensions: Record<string, string>
) {
  const emfLog = {
    _aws: {
      Timestamp: Date.now(),
      CloudWatchMetrics: [
        {
          Namespace: namespace,
          Dimensions: [Object.keys(dimensions)],
          Metrics: Object.keys(metrics).map((name) => ({
            Name: name,
            Unit: "Count",
          })),
        },
      ],
    },
    ...dimensions,
    ...metrics,
  };

  console.log(JSON.stringify(emfLog));
}

// 使用例
emitMetric(
  "MyApp",
  { RequestCount: 1, Latency: 150 },
  { Service: "OrderService", Environment: "prod" }
);
```

## CloudWatch Alarms

### アラーム設定（CDK）

```typescript
// CDK でアラーム設定
import * as cloudwatch from "aws-cdk-lib/aws-cloudwatch";
import * as cloudwatch_actions from "aws-cdk-lib/aws-cloudwatch-actions";
import * as sns from "aws-cdk-lib/aws-sns";

// SNS トピック
const alertTopic = new sns.Topic(this, "AlertTopic", {
  topicName: "app-alerts",
});

// Lambda エラーアラーム
const errorAlarm = new cloudwatch.Alarm(this, "LambdaErrorAlarm", {
  metric: fn.metricErrors({
    period: cdk.Duration.minutes(5),
    statistic: "Sum",
  }),
  threshold: 5,
  evaluationPeriods: 1,
  alarmDescription: "Lambda errors exceeded threshold",
  treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
});

errorAlarm.addAlarmAction(new cloudwatch_actions.SnsAction(alertTopic));

// レイテンシアラーム
const latencyAlarm = new cloudwatch.Alarm(this, "LatencyAlarm", {
  metric: fn.metricDuration({
    period: cdk.Duration.minutes(5),
    statistic: "p95",
  }),
  threshold: 5000, // 5秒
  evaluationPeriods: 3,
  alarmDescription: "Lambda p95 latency too high",
});

// DynamoDB スロットリングアラーム
const throttleAlarm = new cloudwatch.Alarm(this, "DynamoThrottleAlarm", {
  metric: table.metricThrottledRequests({
    period: cdk.Duration.minutes(5),
  }),
  threshold: 1,
  evaluationPeriods: 1,
});
```

### 複合アラーム

```typescript
// 複合アラーム（複数条件）
const compositeAlarm = new cloudwatch.CompositeAlarm(this, "ServiceHealthAlarm", {
  alarmRule: cloudwatch.AlarmRule.anyOf(
    errorAlarm,
    cloudwatch.AlarmRule.allOf(latencyAlarm, throttleAlarm)
  ),
  alarmDescription: "Service health degraded",
});
```

## X-Ray トレーシング

### Lambda での有効化

```typescript
// CDK で X-Ray 有効化
const fn = new lambda.Function(this, "MyFunction", {
  // ...
  tracing: lambda.Tracing.ACTIVE,
});
```

```typescript
// アプリケーションコードでのトレーシング
import AWSXRay from "aws-xray-sdk";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";

// SDK をラップ
const dynamodb = AWSXRay.captureAWSv3Client(
  new DynamoDBClient({ region: "ap-northeast-1" })
);

export async function handler(event: any) {
  // カスタムサブセグメント
  const segment = AWSXRay.getSegment();
  const subsegment = segment?.addNewSubsegment("ProcessOrder");

  try {
    subsegment?.addAnnotation("orderId", event.orderId);
    subsegment?.addMetadata("orderDetails", event);

    const result = await processOrder(event);

    subsegment?.close();
    return result;
  } catch (error) {
    subsegment?.addError(error as Error);
    subsegment?.close();
    throw error;
  }
}
```

### サービスマップ

```
┌────────────────────────────────────────────────────────────┐
│                    X-Ray Service Map                        │
│                                                            │
│  Client → API Gateway → Lambda → DynamoDB                  │
│                           │                                │
│                           └──→ S3                          │
│                           │                                │
│                           └──→ External API                │
│                                                            │
│  各ノードで確認できる情報:                                   │
│  • レイテンシ分布                                           │
│  • エラー率                                                 │
│  • スループット                                             │
│  • 接続先サービス                                           │
└────────────────────────────────────────────────────────────┘
```

## CloudWatch ダッシュボード

### CDK でダッシュボード作成

```typescript
// CDK でダッシュボード
const dashboard = new cloudwatch.Dashboard(this, "ServiceDashboard", {
  dashboardName: "MyService-Dashboard",
});

// Lambda メトリクス
dashboard.addWidgets(
  new cloudwatch.GraphWidget({
    title: "Lambda Invocations",
    left: [fn.metricInvocations({ period: cdk.Duration.minutes(5) })],
    right: [fn.metricErrors({ period: cdk.Duration.minutes(5) })],
    width: 12,
  }),
  new cloudwatch.GraphWidget({
    title: "Lambda Duration",
    left: [
      fn.metricDuration({ statistic: "p50", period: cdk.Duration.minutes(5) }),
      fn.metricDuration({ statistic: "p95", period: cdk.Duration.minutes(5) }),
      fn.metricDuration({ statistic: "p99", period: cdk.Duration.minutes(5) }),
    ],
    width: 12,
  })
);

// DynamoDB メトリクス
dashboard.addWidgets(
  new cloudwatch.GraphWidget({
    title: "DynamoDB Operations",
    left: [
      table.metricConsumedReadCapacityUnits(),
      table.metricConsumedWriteCapacityUnits(),
    ],
    width: 12,
  })
);

// カスタムメトリクス
dashboard.addWidgets(
  new cloudwatch.SingleValueWidget({
    title: "Total Orders Today",
    metrics: [
      new cloudwatch.Metric({
        namespace: "MyApp",
        metricName: "OrderCreated",
        statistic: "Sum",
        period: cdk.Duration.days(1),
      }),
    ],
    width: 6,
  })
);
```

## アラート通知（Slack）

```typescript
// Lambda で Slack 通知
import { SNSEvent } from "aws-lambda";

const SLACK_WEBHOOK_URL = process.env.SLACK_WEBHOOK_URL!;

export async function handler(event: SNSEvent) {
  for (const record of event.Records) {
    const message = JSON.parse(record.Sns.Message);

    const slackPayload = {
      username: "AWS CloudWatch",
      icon_emoji: ":warning:",
      attachments: [
        {
          color: message.NewStateValue === "ALARM" ? "danger" : "good",
          title: message.AlarmName,
          text: message.AlarmDescription,
          fields: [
            {
              title: "State",
              value: message.NewStateValue,
              short: true,
            },
            {
              title: "Region",
              value: message.Region,
              short: true,
            },
            {
              title: "Reason",
              value: message.NewStateReason,
              short: false,
            },
          ],
          ts: Math.floor(Date.now() / 1000),
        },
      ],
    };

    await fetch(SLACK_WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(slackPayload),
    });
  }
}
```

## 次のステップ

次章では、コスト最適化について学びます。
