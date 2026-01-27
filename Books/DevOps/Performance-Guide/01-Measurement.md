# 第1章: 計測手法

## 計測ツール

```
┌─────────────────────────────────────────────────────────────┐
│                    計測ツール一覧                            │
│                                                             │
│  開発時:                                                     │
│  • Chrome DevTools (Performance/Network/Lighthouse)         │
│  • React DevTools (Profiler)                                │
│  • Web Vitals 拡張機能                                      │
│                                                             │
│  CI/CD:                                                     │
│  • Lighthouse CI                                            │
│  • Bundlesize                                               │
│  • @next/bundle-analyzer                                    │
│                                                             │
│  本番環境:                                                   │
│  • Google Search Console                                    │
│  • PageSpeed Insights                                       │
│  • Datadog RUM                                              │
│  • Sentry Performance                                       │
└─────────────────────────────────────────────────────────────┘
```

## Web Vitals 計測

### ブラウザ API

```typescript
// lib/web-vitals.ts
import { onCLS, onINP, onLCP, onFCP, onTTFB } from "web-vitals";

interface Metric {
  name: string;
  value: number;
  rating: "good" | "needs-improvement" | "poor";
  delta: number;
  id: string;
}

function sendToAnalytics(metric: Metric) {
  // Google Analytics 4 へ送信
  if (typeof gtag !== "undefined") {
    gtag("event", metric.name, {
      value: Math.round(metric.value),
      metric_id: metric.id,
      metric_delta: Math.round(metric.delta),
      metric_rating: metric.rating,
    });
  }

  // カスタムエンドポイントへ送信
  fetch("/api/analytics/vitals", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      ...metric,
      url: window.location.href,
      userAgent: navigator.userAgent,
      timestamp: Date.now(),
    }),
    keepalive: true,
  });
}

// 全メトリクスを収集
export function initWebVitals() {
  onCLS(sendToAnalytics);
  onINP(sendToAnalytics);
  onLCP(sendToAnalytics);
  onFCP(sendToAnalytics);
  onTTFB(sendToAnalytics);
}
```

### Next.js での設定

```typescript
// app/layout.tsx
import { WebVitals } from "@/components/WebVitals";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html>
      <body>
        {children}
        <WebVitals />
      </body>
    </html>
  );
}

// components/WebVitals.tsx
"use client";

import { useEffect } from "react";
import { initWebVitals } from "@/lib/web-vitals";

export function WebVitals() {
  useEffect(() => {
    initWebVitals();
  }, []);

  return null;
}
```

## Lighthouse CI

### セットアップ

```bash
npm install -D @lhci/cli
```

```javascript
// lighthouserc.js
module.exports = {
  ci: {
    collect: {
      url: [
        "http://localhost:3000/",
        "http://localhost:3000/products",
        "http://localhost:3000/checkout",
      ],
      startServerCommand: "npm run start",
      numberOfRuns: 3,
    },
    assert: {
      assertions: {
        "categories:performance": ["error", { minScore: 0.9 }],
        "categories:accessibility": ["error", { minScore: 0.9 }],
        "first-contentful-paint": ["error", { maxNumericValue: 2000 }],
        "largest-contentful-paint": ["error", { maxNumericValue: 2500 }],
        "cumulative-layout-shift": ["error", { maxNumericValue: 0.1 }],
        "total-blocking-time": ["error", { maxNumericValue: 300 }],
      },
    },
    upload: {
      target: "temporary-public-storage",
    },
  },
};
```

### GitHub Actions 統合

```yaml
# .github/workflows/lighthouse.yml
name: Lighthouse CI

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

      - name: Install dependencies
        run: npm ci

      - name: Build
        run: npm run build

      - name: Run Lighthouse CI
        run: |
          npm install -g @lhci/cli
          lhci autorun
        env:
          LHCI_GITHUB_APP_TOKEN: ${{ secrets.LHCI_GITHUB_APP_TOKEN }}
```

## バンドル分析

### Next.js Bundle Analyzer

```bash
npm install -D @next/bundle-analyzer
```

```javascript
// next.config.js
const withBundleAnalyzer = require("@next/bundle-analyzer")({
  enabled: process.env.ANALYZE === "true",
});

module.exports = withBundleAnalyzer({
  // Next.js config
});
```

```bash
# バンドル分析実行
ANALYZE=true npm run build
```

### バンドルサイズ制限

```json
// package.json
{
  "bundlesize": [
    {
      "path": ".next/static/chunks/*.js",
      "maxSize": "100 kB"
    },
    {
      "path": ".next/static/css/*.css",
      "maxSize": "20 kB"
    }
  ]
}
```

## API パフォーマンス計測

### サーバーサイド計測

```typescript
// lib/metrics.ts
import { performance } from "perf_hooks";

interface Timer {
  end: () => number;
}

export function startTimer(): Timer {
  const start = performance.now();
  return {
    end: () => performance.now() - start,
  };
}

// ミドルウェアでの使用
export async function withTiming<T>(
  name: string,
  operation: () => Promise<T>
): Promise<{ result: T; duration: number }> {
  const timer = startTimer();
  const result = await operation();
  const duration = timer.end();

  console.log(
    JSON.stringify({
      type: "timing",
      name,
      duration,
      timestamp: new Date().toISOString(),
    })
  );

  return { result, duration };
}

// 使用例
export async function handler(req: Request) {
  const { result: users, duration } = await withTiming("fetchUsers", () =>
    db.user.findMany()
  );

  return Response.json(users, {
    headers: {
      "Server-Timing": `db;dur=${duration}`,
    },
  });
}
```

### Server-Timing ヘッダー

```typescript
// Server-Timing ヘッダーで詳細なタイミング情報を提供
function createServerTimingHeader(timings: Record<string, number>): string {
  return Object.entries(timings)
    .map(([name, duration]) => `${name};dur=${duration.toFixed(2)}`)
    .join(", ");
}

// 使用例
const timings = {
  db: 45.2,
  cache: 2.1,
  render: 12.5,
};

// Server-Timing: db;dur=45.20, cache;dur=2.10, render;dur=12.50
```

## データベースクエリ計測

### Prisma でのログ

```typescript
// lib/db.ts
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient({
  log: [
    { emit: "event", level: "query" },
    { emit: "event", level: "error" },
  ],
});

// クエリ時間をログ
prisma.$on("query", (e) => {
  console.log(
    JSON.stringify({
      type: "query",
      query: e.query,
      params: e.params,
      duration: e.duration,
      timestamp: new Date().toISOString(),
    })
  );

  // 遅いクエリをアラート
  if (e.duration > 100) {
    console.warn(`Slow query detected: ${e.duration}ms`);
  }
});

export { prisma };
```

## パフォーマンスダッシュボード

```typescript
// API でメトリクス集計を提供
// app/api/metrics/route.ts
import { prisma } from "@/lib/db";

export async function GET() {
  const [vitals, apiLatency, dbLatency] = await Promise.all([
    // Web Vitals 平均
    prisma.webVital.groupBy({
      by: ["name"],
      _avg: { value: true },
      _count: true,
      where: {
        timestamp: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
      },
    }),

    // API レイテンシ p50/p95/p99
    prisma.$queryRaw`
      SELECT
        percentile_cont(0.5) WITHIN GROUP (ORDER BY duration) as p50,
        percentile_cont(0.95) WITHIN GROUP (ORDER BY duration) as p95,
        percentile_cont(0.99) WITHIN GROUP (ORDER BY duration) as p99
      FROM api_logs
      WHERE timestamp > NOW() - INTERVAL '24 hours'
    `,

    // DBクエリ時間
    prisma.$queryRaw`
      SELECT
        AVG(duration) as avg_duration,
        MAX(duration) as max_duration,
        COUNT(*) as query_count
      FROM query_logs
      WHERE timestamp > NOW() - INTERVAL '1 hour'
    `,
  ]);

  return Response.json({
    vitals,
    apiLatency,
    dbLatency,
    timestamp: new Date().toISOString(),
  });
}
```

## 次のステップ

次章では、フロントエンドの最適化手法を学びます。
