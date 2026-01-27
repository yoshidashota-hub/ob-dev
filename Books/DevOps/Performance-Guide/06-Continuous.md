# 第6章: 継続的改善

## パフォーマンスモニタリング

### CloudWatch ダッシュボード

```typescript
// CDK でパフォーマンスダッシュボード
const dashboard = new cloudwatch.Dashboard(this, "PerformanceDashboard", {
  dashboardName: "App-Performance",
});

// Lambda メトリクス
dashboard.addWidgets(
  new cloudwatch.GraphWidget({
    title: "Lambda Performance",
    left: [
      fn.metricDuration({ statistic: "p50", label: "p50" }),
      fn.metricDuration({ statistic: "p95", label: "p95" }),
      fn.metricDuration({ statistic: "p99", label: "p99" }),
    ],
    right: [fn.metricInvocations()],
    width: 12,
  }),
  new cloudwatch.GraphWidget({
    title: "Lambda Errors",
    left: [fn.metricErrors()],
    right: [fn.metricThrottles()],
    width: 12,
  })
);

// API Gateway メトリクス
dashboard.addWidgets(
  new cloudwatch.GraphWidget({
    title: "API Latency",
    left: [
      new cloudwatch.Metric({
        namespace: "AWS/ApiGateway",
        metricName: "Latency",
        dimensionsMap: { ApiName: api.restApiName },
        statistic: "p50",
      }),
      new cloudwatch.Metric({
        namespace: "AWS/ApiGateway",
        metricName: "Latency",
        dimensionsMap: { ApiName: api.restApiName },
        statistic: "p95",
      }),
    ],
    width: 12,
  })
);

// カスタムメトリクス
dashboard.addWidgets(
  new cloudwatch.SingleValueWidget({
    title: "Core Web Vitals - LCP",
    metrics: [
      new cloudwatch.Metric({
        namespace: "WebVitals",
        metricName: "LCP",
        statistic: "p75",
      }),
    ],
    width: 4,
  }),
  new cloudwatch.SingleValueWidget({
    title: "Core Web Vitals - INP",
    metrics: [
      new cloudwatch.Metric({
        namespace: "WebVitals",
        metricName: "INP",
        statistic: "p75",
      }),
    ],
    width: 4,
  }),
  new cloudwatch.SingleValueWidget({
    title: "Core Web Vitals - CLS",
    metrics: [
      new cloudwatch.Metric({
        namespace: "WebVitals",
        metricName: "CLS",
        statistic: "p75",
      }),
    ],
    width: 4,
  })
);
```

### パフォーマンスアラート

```typescript
// レイテンシアラート
const latencyAlarm = new cloudwatch.Alarm(this, "LatencyAlarm", {
  metric: new cloudwatch.Metric({
    namespace: "AWS/ApiGateway",
    metricName: "Latency",
    dimensionsMap: { ApiName: api.restApiName },
    statistic: "p95",
    period: cdk.Duration.minutes(5),
  }),
  threshold: 1000, // 1秒
  evaluationPeriods: 3,
  alarmDescription: "API p95 latency exceeded 1s",
});

// Core Web Vitals アラート
const lcpAlarm = new cloudwatch.Alarm(this, "LCPAlarm", {
  metric: new cloudwatch.Metric({
    namespace: "WebVitals",
    metricName: "LCP",
    statistic: "p75",
    period: cdk.Duration.hours(1),
  }),
  threshold: 2500, // 2.5秒
  evaluationPeriods: 1,
  alarmDescription: "LCP exceeded 2.5s threshold",
});

// SNS 通知
latencyAlarm.addAlarmAction(new cloudwatch_actions.SnsAction(alertTopic));
lcpAlarm.addAlarmAction(new cloudwatch_actions.SnsAction(alertTopic));
```

## CI/CD でのパフォーマンステスト

### Lighthouse CI

```yaml
# .github/workflows/performance.yml
name: Performance Tests

on:
  pull_request:
    branches: [main]

jobs:
  lighthouse:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: "npm"

      - name: Install dependencies
        run: npm ci

      - name: Build
        run: npm run build

      - name: Start server
        run: npm start &
        env:
          PORT: 3000

      - name: Wait for server
        run: npx wait-on http://localhost:3000

      - name: Run Lighthouse CI
        run: npx @lhci/cli autorun
        env:
          LHCI_GITHUB_APP_TOKEN: ${{ secrets.LHCI_GITHUB_APP_TOKEN }}

      - name: Upload results
        uses: actions/upload-artifact@v4
        with:
          name: lighthouse-results
          path: .lighthouseci/
```

### バンドルサイズチェック

```yaml
# .github/workflows/bundle.yml
name: Bundle Size Check

on:
  pull_request:
    branches: [main]

jobs:
  bundle:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: "npm"

      - name: Install dependencies
        run: npm ci

      - name: Build
        run: npm run build

      - name: Check bundle size
        run: npx bundlesize

      - name: Analyze bundle
        run: ANALYZE=true npm run build

      - name: Upload bundle analysis
        uses: actions/upload-artifact@v4
        with:
          name: bundle-analysis
          path: .next/analyze/
```

### 負荷テスト

```yaml
# .github/workflows/load-test.yml
name: Load Test

on:
  workflow_dispatch:
  schedule:
    - cron: "0 0 * * 0" # 毎週日曜

jobs:
  load-test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Install k6
        run: |
          curl https://github.com/grafana/k6/releases/download/v0.47.0/k6-v0.47.0-linux-amd64.tar.gz -L | tar xvz
          sudo mv k6-v0.47.0-linux-amd64/k6 /usr/local/bin/

      - name: Run load test
        run: k6 run tests/load/script.js
        env:
          K6_CLOUD_TOKEN: ${{ secrets.K6_CLOUD_TOKEN }}
```

```javascript
// tests/load/script.js
import http from "k6/http";
import { check, sleep } from "k6";

export const options = {
  stages: [
    { duration: "1m", target: 50 }, // ランプアップ
    { duration: "3m", target: 50 }, // 安定負荷
    { duration: "1m", target: 100 }, // スパイク
    { duration: "1m", target: 0 }, // ランプダウン
  ],
  thresholds: {
    http_req_duration: ["p(95)<500"], // p95 < 500ms
    http_req_failed: ["rate<0.01"], // エラー率 < 1%
  },
};

export default function () {
  const res = http.get("https://api.example.com/products");

  check(res, {
    "status is 200": (r) => r.status === 200,
    "response time < 500ms": (r) => r.timings.duration < 500,
  });

  sleep(1);
}
```

## パフォーマンスレポート

### 週次レポート生成

```typescript
// scripts/performance-report.ts
import { CloudWatchClient, GetMetricDataCommand } from "@aws-sdk/client-cloudwatch";

const cloudwatch = new CloudWatchClient({ region: "ap-northeast-1" });

async function generateWeeklyReport() {
  const endTime = new Date();
  const startTime = new Date(endTime.getTime() - 7 * 24 * 60 * 60 * 1000);

  // メトリクス取得
  const response = await cloudwatch.send(
    new GetMetricDataCommand({
      StartTime: startTime,
      EndTime: endTime,
      MetricDataQueries: [
        {
          Id: "lcp_p75",
          MetricStat: {
            Metric: {
              Namespace: "WebVitals",
              MetricName: "LCP",
            },
            Period: 86400,
            Stat: "p75",
          },
        },
        {
          Id: "api_p95",
          MetricStat: {
            Metric: {
              Namespace: "AWS/ApiGateway",
              MetricName: "Latency",
              Dimensions: [{ Name: "ApiName", Value: "MyAPI" }],
            },
            Period: 86400,
            Stat: "p95",
          },
        },
      ],
    })
  );

  // レポート生成
  const report = {
    period: { start: startTime, end: endTime },
    webVitals: {
      lcp: {
        p75: calculateAverage(response.MetricDataResults[0].Values),
        status: getStatus(calculateAverage(response.MetricDataResults[0].Values), 2500),
      },
    },
    api: {
      latency: {
        p95: calculateAverage(response.MetricDataResults[1].Values),
        status: getStatus(calculateAverage(response.MetricDataResults[1].Values), 500),
      },
    },
  };

  return report;
}

function getStatus(value: number, threshold: number): string {
  if (value <= threshold * 0.8) return "good";
  if (value <= threshold) return "needs-improvement";
  return "poor";
}
```

### Slack 通知

```typescript
// 週次パフォーマンスレポートを Slack に送信
async function sendSlackReport(report: PerformanceReport) {
  const blocks = [
    {
      type: "header",
      text: {
        type: "plain_text",
        text: `週次パフォーマンスレポート (${formatDate(report.period.start)} - ${formatDate(report.period.end)})`,
      },
    },
    {
      type: "section",
      fields: [
        {
          type: "mrkdwn",
          text: `*LCP (p75)*\n${report.webVitals.lcp.p75.toFixed(0)}ms ${getEmoji(report.webVitals.lcp.status)}`,
        },
        {
          type: "mrkdwn",
          text: `*API Latency (p95)*\n${report.api.latency.p95.toFixed(0)}ms ${getEmoji(report.api.latency.status)}`,
        },
      ],
    },
  ];

  await fetch(process.env.SLACK_WEBHOOK_URL!, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ blocks }),
  });
}

function getEmoji(status: string): string {
  switch (status) {
    case "good":
      return ":white_check_mark:";
    case "needs-improvement":
      return ":warning:";
    case "poor":
      return ":x:";
    default:
      return "";
  }
}
```

## 次のステップ

次章では、パフォーマンスのベストプラクティスをまとめます。
