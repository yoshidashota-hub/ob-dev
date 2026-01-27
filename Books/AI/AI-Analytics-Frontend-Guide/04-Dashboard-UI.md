# 第4章: ダッシュボード UI

## ダッシュボードの構成

```
┌─────────────────────────────────────────────────────┐
│                AI Analytics Dashboard                │
├─────────────────────────────────────────────────────┤
│  ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐                   │
│  │ KPI │ │ KPI │ │ KPI │ │ KPI │    ← KPI カード   │
│  └─────┘ └─────┘ └─────┘ └─────┘                   │
├─────────────────────────────────────────────────────┤
│  ┌───────────────────────┐ ┌───────────────────┐   │
│  │                       │ │                   │   │
│  │    時系列グラフ        │ │   AI インサイト   │   │
│  │                       │ │                   │   │
│  └───────────────────────┘ └───────────────────┘   │
├─────────────────────────────────────────────────────┤
│  ┌───────────────────────┐ ┌───────────────────┐   │
│  │    商品ランキング      │ │   カテゴリ分布    │   │
│  └───────────────────────┘ └───────────────────┘   │
└─────────────────────────────────────────────────────┘
```

## KPI カード

```typescript
// components/dashboard/KPICard.tsx
interface KPICardProps {
  title: string;
  value: string | number;
  change?: number;
  trend?: "up" | "down" | "stable";
  format?: "number" | "currency" | "percent";
  isLoading?: boolean;
}

export function KPICard({
  title,
  value,
  change,
  trend,
  format = "number",
  isLoading,
}: KPICardProps) {
  const formatValue = (v: string | number) => {
    if (typeof v === "string") return v;
    switch (format) {
      case "currency":
        return `¥${v.toLocaleString()}`;
      case "percent":
        return `${v.toFixed(1)}%`;
      default:
        return v.toLocaleString();
    }
  };

  const trendColor =
    trend === "up"
      ? "text-green-600"
      : trend === "down"
        ? "text-red-600"
        : "text-gray-600";

  const trendIcon =
    trend === "up" ? "↑" : trend === "down" ? "↓" : "→";

  if (isLoading) {
    return (
      <div className="bg-white p-6 rounded-lg shadow animate-pulse">
        <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
        <div className="h-8 bg-gray-200 rounded w-3/4"></div>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow hover:shadow-lg transition-shadow">
      <h3 className="text-sm font-medium text-gray-500">{title}</h3>
      <div className="mt-2 flex items-baseline gap-2">
        <span className="text-3xl font-bold text-gray-900">
          {formatValue(value)}
        </span>
        {change !== undefined && (
          <span className={`text-sm font-medium ${trendColor}`}>
            {trendIcon} {Math.abs(change).toFixed(1)}%
          </span>
        )}
      </div>
    </div>
  );
}
```

## 時系列チャート

```typescript
// components/dashboard/TimeSeriesChart.tsx
"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

interface TimeSeriesChartProps {
  data: Array<{
    period: string;
    value: number;
    [key: string]: any;
  }>;
  title: string;
  dataKey?: string;
  color?: string;
  formatValue?: (value: number) => string;
}

export function TimeSeriesChart({
  data,
  title,
  dataKey = "value",
  color = "#3b82f6",
  formatValue = (v) => v.toLocaleString(),
}: TimeSeriesChartProps) {
  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <h3 className="text-lg font-semibold mb-4">{title}</h3>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis
            dataKey="period"
            tick={{ fontSize: 12 }}
            tickFormatter={(v) => {
              const date = new Date(v);
              return `${date.getMonth() + 1}/${date.getDate()}`;
            }}
          />
          <YAxis
            tick={{ fontSize: 12 }}
            tickFormatter={formatValue}
          />
          <Tooltip
            formatter={(value: number) => [formatValue(value), title]}
            labelFormatter={(label) => new Date(label).toLocaleDateString("ja-JP")}
          />
          <Legend />
          <Line
            type="monotone"
            dataKey={dataKey}
            stroke={color}
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 6 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
```

## AI インサイトパネル

```typescript
// components/dashboard/AIInsights.tsx
"use client";

import { useInsights } from "@/hooks/useAnalytics";

interface Finding {
  title: string;
  value: string;
  trend: "up" | "down" | "stable";
  importance: "high" | "medium" | "low";
}

export function AIInsights({ days = 7 }: { days?: number }) {
  const { data, isLoading, error } = useInsights(days);

  if (isLoading) {
    return (
      <div className="bg-white p-6 rounded-lg shadow animate-pulse">
        <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-4 bg-gray-200 rounded"></div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white p-6 rounded-lg shadow">
        <p className="text-red-500">インサイトの取得に失敗しました</p>
      </div>
    );
  }

  const importanceColor = {
    high: "border-red-500 bg-red-50",
    medium: "border-yellow-500 bg-yellow-50",
    low: "border-gray-300 bg-gray-50",
  };

  const trendIcon = {
    up: "📈",
    down: "📉",
    stable: "➡️",
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <div className="flex items-center gap-2 mb-4">
        <span className="text-xl">🤖</span>
        <h3 className="text-lg font-semibold">AI インサイト</h3>
      </div>

      <p className="text-gray-600 mb-4">{data?.summary}</p>

      <div className="space-y-3">
        {data?.keyFindings.map((finding: Finding, i: number) => (
          <div
            key={i}
            className={`p-3 rounded-lg border-l-4 ${importanceColor[finding.importance]}`}
          >
            <div className="flex items-center justify-between">
              <span className="font-medium">{finding.title}</span>
              <span>{trendIcon[finding.trend]}</span>
            </div>
            <p className="text-sm text-gray-600 mt-1">{finding.value}</p>
          </div>
        ))}
      </div>

      {data?.recommendations && (
        <div className="mt-4 pt-4 border-t">
          <h4 className="font-medium mb-2">💡 推奨アクション</h4>
          <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
            {data.recommendations.map((rec: string, i: number) => (
              <li key={i}>{rec}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
```

## ランキングテーブル

```typescript
// components/dashboard/RankingTable.tsx
"use client";

interface Product {
  product_id: string;
  product_name: string;
  category: string;
  total_quantity: number;
  total_revenue: number;
}

interface RankingTableProps {
  data: Product[];
  title: string;
  isLoading?: boolean;
}

export function RankingTable({ data, title, isLoading }: RankingTableProps) {
  if (isLoading) {
    return (
      <div className="bg-white p-6 rounded-lg shadow animate-pulse">
        <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="h-12 bg-gray-200 rounded mb-2"></div>
        ))}
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <h3 className="text-lg font-semibold mb-4">{title}</h3>
      <table className="w-full">
        <thead>
          <tr className="text-left text-sm text-gray-500 border-b">
            <th className="pb-2 w-8">#</th>
            <th className="pb-2">商品名</th>
            <th className="pb-2 text-right">売上</th>
          </tr>
        </thead>
        <tbody>
          {data.map((product, index) => (
            <tr key={product.product_id} className="border-b last:border-0">
              <td className="py-3 text-gray-400">{index + 1}</td>
              <td className="py-3">
                <div>
                  <p className="font-medium">{product.product_name}</p>
                  <p className="text-sm text-gray-500">{product.category}</p>
                </div>
              </td>
              <td className="py-3 text-right font-medium">
                ¥{product.total_revenue.toLocaleString()}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
```

## メインダッシュボード

```typescript
// app/dashboard/page.tsx
"use client";

import { useState } from "react";
import { KPICard } from "@/components/dashboard/KPICard";
import { TimeSeriesChart } from "@/components/dashboard/TimeSeriesChart";
import { AIInsights } from "@/components/dashboard/AIInsights";
import { RankingTable } from "@/components/dashboard/RankingTable";
import { useKPIs, useTimeSeries, useTopProducts } from "@/hooks/useAnalytics";

export default function DashboardPage() {
  const [days, setDays] = useState(7);

  const { data: kpis, isLoading: kpisLoading } = useKPIs(days);
  const { data: timeSeries, isLoading: timeSeriesLoading } = useTimeSeries(
    "revenue",
    days
  );
  const { data: topProducts, isLoading: productsLoading } = useTopProducts(
    days,
    10
  );

  // 最新のKPIを取得
  const latestKPI = kpis?.[0];
  const previousKPI = kpis?.[1];

  const calculateChange = (current?: number, previous?: number) => {
    if (!current || !previous) return undefined;
    return ((current - previous) / previous) * 100;
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* ヘッダー */}
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">ダッシュボード</h1>
          <select
            value={days}
            onChange={(e) => setDays(parseInt(e.target.value))}
            className="p-2 border rounded-lg"
          >
            <option value={7}>過去7日間</option>
            <option value={14}>過去14日間</option>
            <option value={30}>過去30日間</option>
            <option value={90}>過去90日間</option>
          </select>
        </div>

        {/* KPI カード */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <KPICard
            title="売上"
            value={latestKPI?.revenue || 0}
            change={calculateChange(latestKPI?.revenue, previousKPI?.revenue)}
            trend={
              latestKPI?.revenue > previousKPI?.revenue
                ? "up"
                : latestKPI?.revenue < previousKPI?.revenue
                  ? "down"
                  : "stable"
            }
            format="currency"
            isLoading={kpisLoading}
          />
          <KPICard
            title="ユーザー数"
            value={latestKPI?.users || 0}
            change={calculateChange(latestKPI?.users, previousKPI?.users)}
            trend={
              latestKPI?.users > previousKPI?.users ? "up" : "down"
            }
            isLoading={kpisLoading}
          />
          <KPICard
            title="セッション数"
            value={latestKPI?.sessions || 0}
            change={calculateChange(latestKPI?.sessions, previousKPI?.sessions)}
            isLoading={kpisLoading}
          />
          <KPICard
            title="コンバージョン率"
            value={latestKPI?.conversion_rate || 0}
            change={calculateChange(
              latestKPI?.conversion_rate,
              previousKPI?.conversion_rate
            )}
            format="percent"
            isLoading={kpisLoading}
          />
        </div>

        {/* メインコンテンツ */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          <div className="lg:col-span-2">
            <TimeSeriesChart
              data={timeSeries || []}
              title="売上推移"
              formatValue={(v) => `¥${(v / 1000).toFixed(0)}K`}
            />
          </div>
          <div>
            <AIInsights days={days} />
          </div>
        </div>

        {/* ランキング */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <RankingTable
            data={topProducts || []}
            title="売上トップ10"
            isLoading={productsLoading}
          />
        </div>
      </div>
    </div>
  );
}
```

## 次のステップ

次章では、リアルタイム更新の実装について学びます。
