# オブザーバビリティ 学習ノート

## 概要

オブザーバビリティは、システムの内部状態を外部から観測可能にすること。ログ、メトリクス、トレースの3本柱で構成。

## 3本柱

```
┌─────────────────────────────────────────────────────┐
│                 Observability                        │
│                                                     │
│  ┌───────────┐  ┌───────────┐  ┌───────────┐       │
│  │   Logs    │  │  Metrics  │  │  Traces   │       │
│  │           │  │           │  │           │       │
│  │ 何が起き  │  │ どれくらい│  │ どこで    │       │
│  │ たか      │  │ の量か    │  │ 起きたか  │       │
│  └───────────┘  └───────────┘  └───────────┘       │
└─────────────────────────────────────────────────────┘
```

## ログ

### 構造化ログ

```typescript
// lib/logger.ts
import pino from "pino";

export const logger = pino({
  level: process.env.LOG_LEVEL ?? "info",
  formatters: {
    level: (label) => ({ level: label }),
  },
  timestamp: pino.stdTimeFunctions.isoTime,
});

// 使用例
logger.info({ userId: "123", action: "login" }, "User logged in");
logger.error({ error: err, requestId: "abc" }, "Request failed");
```

### ログレベル

| レベル | 用途             |
| ------ | ---------------- |
| error  | エラー、要対応   |
| warn   | 警告、注意が必要 |
| info   | 重要なイベント   |
| debug  | デバッグ情報     |
| trace  | 詳細なトレース   |

### Next.js でのログ

```typescript
// middleware.ts
import { logger } from "@/lib/logger";

export function middleware(request: NextRequest) {
  const requestId = crypto.randomUUID();
  const startTime = Date.now();

  logger.info(
    {
      requestId,
      method: request.method,
      url: request.url,
      userAgent: request.headers.get("user-agent"),
    },
    "Request started",
  );

  // レスポンス後にログ
  const response = NextResponse.next();

  logger.info(
    {
      requestId,
      duration: Date.now() - startTime,
      status: response.status,
    },
    "Request completed",
  );

  return response;
}
```

## メトリクス

### 主要なメトリクス種類

| 種類      | 説明     | 例             |
| --------- | -------- | -------------- |
| Counter   | 増加のみ | リクエスト数   |
| Gauge     | 増減可能 | 同時接続数     |
| Histogram | 分布     | レスポンス時間 |

### Vercel Analytics

```typescript
// app/layout.tsx
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        {children}
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
```

### カスタムメトリクス

```typescript
// lib/metrics.ts
import { track } from "@vercel/analytics";

export function trackApiLatency(endpoint: string, duration: number) {
  track("api_latency", {
    endpoint,
    duration,
    bucket: getBucket(duration),
  });
}

function getBucket(ms: number): string {
  if (ms < 100) return "fast";
  if (ms < 500) return "normal";
  if (ms < 1000) return "slow";
  return "very_slow";
}
```

## 分散トレーシング

### OpenTelemetry

```typescript
// instrumentation.ts
import { NodeSDK } from "@opentelemetry/sdk-node";
import { getNodeAutoInstrumentations } from "@opentelemetry/auto-instrumentations-node";
import { OTLPTraceExporter } from "@opentelemetry/exporter-trace-otlp-http";

const sdk = new NodeSDK({
  traceExporter: new OTLPTraceExporter({
    url: process.env.OTEL_EXPORTER_OTLP_ENDPOINT,
  }),
  instrumentations: [getNodeAutoInstrumentations()],
});

sdk.start();
```

### トレースの手動作成

```typescript
import { trace } from "@opentelemetry/api";

const tracer = trace.getTracer("my-app");

async function processOrder(orderId: string) {
  return tracer.startActiveSpan("process-order", async (span) => {
    try {
      span.setAttribute("order.id", orderId);

      // 子スパン
      await tracer.startActiveSpan("validate-order", async (childSpan) => {
        await validateOrder(orderId);
        childSpan.end();
      });

      await tracer.startActiveSpan("charge-payment", async (childSpan) => {
        await chargePayment(orderId);
        childSpan.end();
      });

      span.setStatus({ code: SpanStatusCode.OK });
    } catch (error) {
      span.setStatus({ code: SpanStatusCode.ERROR, message: error.message });
      span.recordException(error);
      throw error;
    } finally {
      span.end();
    }
  });
}
```

## エラートラッキング

### Sentry

```typescript
// sentry.client.config.ts
import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  tracesSampleRate: 1.0,
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,
});

// エラー報告
try {
  await riskyOperation();
} catch (error) {
  Sentry.captureException(error, {
    tags: { feature: "checkout" },
    extra: { orderId: "123" },
  });
  throw error;
}
```

## ダッシュボード

### Grafana + Prometheus 構成

```yaml
# docker-compose.yml
services:
  prometheus:
    image: prom/prometheus
    volumes:
      - ./prometheus.yml:/etc/prometheus/prometheus.yml

  grafana:
    image: grafana/grafana
    ports:
      - "3001:3000"
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=admin
```

## アラート設計

```yaml
# アラートルール例
groups:
  - name: api-alerts
    rules:
      - alert: HighErrorRate
        expr: rate(http_requests_total{status=~"5.."}[5m]) / rate(http_requests_total[5m]) > 0.05
        for: 5m
        labels:
          severity: critical
        annotations:
          summary: "High error rate detected"
          description: "Error rate is above 5% for 5 minutes"

      - alert: SlowResponses
        expr: histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m])) > 2
        for: 10m
        labels:
          severity: warning
```

## ベストプラクティス

1. **相関ID**: リクエスト全体を追跡可能に
2. **サンプリング**: 高トラフィック時はサンプリング
3. **アラート疲れ防止**: 重要なアラートのみ通知
4. **SLO/SLI 定義**: 目標値を明確に
5. **ダッシュボード**: 一目で状況把握可能に

## 参考リソース

- [OpenTelemetry](https://opentelemetry.io/)
- [Vercel Analytics](https://vercel.com/docs/analytics)
- [Sentry for Next.js](https://docs.sentry.io/platforms/javascript/guides/nextjs/)
