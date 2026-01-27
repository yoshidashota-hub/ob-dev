# 第3章: 自然言語クエリ

## 自然言語からSQLへの変換

```
┌─────────────────────────────────────────────────────┐
│            Natural Language to SQL                   │
│                                                     │
│  "先月の売上トップ5カテゴリを教えて"                 │
│                    │                                │
│                    ▼                                │
│  ┌─────────────────────────────────────────────┐   │
│  │                 AI                           │   │
│  │  • 意図解析                                  │   │
│  │  • エンティティ抽出                          │   │
│  │  • SQL生成                                   │   │
│  └─────────────────────────────────────────────┘   │
│                    │                                │
│                    ▼                                │
│  SELECT category, SUM(total_amount) as revenue     │
│  FROM sales                                         │
│  WHERE timestamp >= '2024-01-01'                   │
│  GROUP BY category                                  │
│  ORDER BY revenue DESC                             │
│  LIMIT 5                                           │
└─────────────────────────────────────────────────────┘
```

## Text-to-SQL ツール

```typescript
// lib/ai/text-to-sql.ts
import { generateObject } from "ai";
import { openai } from "@ai-sdk/openai";
import { z } from "zod";

const sqlSchema = z.object({
  sql: z.string().describe("生成されたSQLクエリ"),
  explanation: z.string().describe("クエリの説明"),
  tables: z.array(z.string()).describe("使用するテーブル"),
  filters: z.array(z.string()).describe("適用されるフィルター条件"),
});

const schemaDescription = `
## 利用可能なテーブル

### analytics.events
- id: STRING (イベントID)
- event_name: STRING (イベント名: page_view, button_click, purchase, signup など)
- user_id: STRING (ユーザーID)
- session_id: STRING (セッションID)
- properties: JSON (イベントプロパティ)
- timestamp: TIMESTAMP (イベント発生時刻)

### analytics.sales
- id: STRING (売上ID)
- order_id: STRING (注文ID)
- product_id: STRING (商品ID)
- product_name: STRING (商品名)
- category: STRING (カテゴリ)
- quantity: INT64 (数量)
- unit_price: NUMERIC (単価)
- total_amount: NUMERIC (合計金額)
- user_id: STRING (ユーザーID)
- timestamp: TIMESTAMP (売上発生時刻)

### analytics.daily_kpis
- date: DATE (日付)
- sessions: INT64 (セッション数)
- users: INT64 (ユニークユーザー数)
- purchases: INT64 (購入数)
- revenue: NUMERIC (売上)

## 日付の扱い
- 今日: CURRENT_DATE()
- N日前から: DATE_SUB(CURRENT_DATE(), INTERVAL N DAY)
- 先月: DATE_TRUNC(DATE_SUB(CURRENT_DATE(), INTERVAL 1 MONTH), MONTH)
`;

export async function textToSQL(question: string) {
  const result = await generateObject({
    model: openai("gpt-4o"),
    schema: sqlSchema,
    prompt: `以下の質問に対応するBigQuery SQLを生成してください。

${schemaDescription}

## 質問
${question}

## ルール
1. 必ず有効なBigQuery SQLを生成する
2. 適切な集計関数を使用する
3. 日付フィルターを適切に設定する
4. 結果は最大1000行に制限する
5. SELECT * は避け、必要な列のみ選択する`,
  });

  return result.object;
}
```

## クエリ検証と実行

```typescript
// lib/ai/query-executor.ts
import { BigQuery } from "@google-cloud/bigquery";
import { textToSQL } from "./text-to-sql";

const bigquery = new BigQuery();

// 禁止パターン
const FORBIDDEN_PATTERNS = [
  /\bDROP\b/i,
  /\bDELETE\b/i,
  /\bUPDATE\b/i,
  /\bINSERT\b/i,
  /\bTRUNCATE\b/i,
  /\bALTER\b/i,
  /\bCREATE\b/i,
];

function validateSQL(sql: string): { valid: boolean; error?: string } {
  for (const pattern of FORBIDDEN_PATTERNS) {
    if (pattern.test(sql)) {
      return { valid: false, error: "データ変更クエリは実行できません" };
    }
  }
  return { valid: true };
}

export async function executeNaturalLanguageQuery(question: string) {
  // 1. SQLを生成
  const generated = await textToSQL(question);

  // 2. SQLを検証
  const validation = validateSQL(generated.sql);
  if (!validation.valid) {
    throw new Error(validation.error);
  }

  // 3. ドライラン（コスト確認）
  const [dryRunJob] = await bigquery.createQueryJob({
    query: generated.sql,
    dryRun: true,
  });

  const bytesProcessed = parseInt(
    dryRunJob.metadata.statistics.totalBytesProcessed,
  );
  const estimatedCost = (bytesProcessed / 1e12) * 5; // $5/TB

  // 4. コストが高すぎる場合は警告
  if (estimatedCost > 1) {
    return {
      ...generated,
      warning: `このクエリは約$${estimatedCost.toFixed(2)}かかります`,
      requiresConfirmation: true,
    };
  }

  // 5. クエリ実行
  const [rows] = await bigquery.query({ query: generated.sql });

  return {
    ...generated,
    results: rows.slice(0, 100), // 最大100行
    totalRows: rows.length,
    bytesProcessed,
    estimatedCost,
  };
}
```

## API エンドポイント

```typescript
// app/api/query/natural/route.ts
import { NextResponse } from "next/server";
import { executeNaturalLanguageQuery } from "@/lib/ai/query-executor";

export async function POST(req: Request) {
  try {
    const { question, confirmed } = await req.json();

    if (!question) {
      return NextResponse.json(
        { error: "質問を入力してください" },
        { status: 400 },
      );
    }

    const result = await executeNaturalLanguageQuery(question);

    // 確認が必要な場合
    if (result.requiresConfirmation && !confirmed) {
      return NextResponse.json({
        requiresConfirmation: true,
        warning: result.warning,
        sql: result.sql,
        explanation: result.explanation,
      });
    }

    return NextResponse.json({
      sql: result.sql,
      explanation: result.explanation,
      results: result.results,
      totalRows: result.totalRows,
    });
  } catch (error) {
    console.error("Query error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "クエリ実行エラー" },
      { status: 500 },
    );
  }
}
```

## チャットインターフェース

```typescript
// components/chat/QueryChat.tsx
"use client";

import { useState } from "react";
import { useChat } from "ai/react";

interface QueryResult {
  sql: string;
  explanation: string;
  results: any[];
  totalRows: number;
}

export function QueryChat() {
  const [queryResult, setQueryResult] = useState<QueryResult | null>(null);

  const { messages, input, handleInputChange, handleSubmit, isLoading } =
    useChat({
      api: "/api/ai/analyze",
      onFinish: (message) => {
        // ツール結果からデータを抽出
        const toolResults = message.toolInvocations?.filter(
          (t) => t.state === "result"
        );
        if (toolResults?.length) {
          const sqlResult = toolResults.find(
            (t) => t.toolName === "executeSQL"
          );
          if (sqlResult) {
            setQueryResult(sqlResult.result);
          }
        }
      },
    });

  return (
    <div className="flex flex-col h-full">
      {/* メッセージ表示 */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${
              message.role === "user" ? "justify-end" : "justify-start"
            }`}
          >
            <div
              className={`max-w-[80%] p-4 rounded-lg ${
                message.role === "user"
                  ? "bg-blue-500 text-white"
                  : "bg-gray-100"
              }`}
            >
              <p className="whitespace-pre-wrap">{message.content}</p>

              {/* ツール呼び出しの表示 */}
              {message.toolInvocations?.map((tool) => (
                <div key={tool.toolCallId} className="mt-2 text-sm">
                  {tool.toolName === "executeSQL" && tool.state === "result" && (
                    <details className="cursor-pointer">
                      <summary className="text-blue-600">
                        SQLクエリを実行しました
                      </summary>
                      <pre className="mt-2 p-2 bg-gray-800 text-green-400 rounded text-xs overflow-x-auto">
                        {tool.args.sql}
                      </pre>
                    </details>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-gray-100 p-4 rounded-lg">
              <span className="animate-pulse">分析中...</span>
            </div>
          </div>
        )}
      </div>

      {/* クエリ結果テーブル */}
      {queryResult && queryResult.results?.length > 0 && (
        <div className="border-t p-4 max-h-64 overflow-auto">
          <h3 className="font-bold mb-2">クエリ結果</h3>
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-100">
                {Object.keys(queryResult.results[0]).map((key) => (
                  <th key={key} className="p-2 text-left">
                    {key}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {queryResult.results.slice(0, 10).map((row, i) => (
                <tr key={i} className="border-b">
                  {Object.values(row).map((value, j) => (
                    <td key={j} className="p-2">
                      {String(value)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
          {queryResult.totalRows > 10 && (
            <p className="text-sm text-gray-500 mt-2">
              他 {queryResult.totalRows - 10} 件
            </p>
          )}
        </div>
      )}

      {/* 入力フォーム */}
      <form onSubmit={handleSubmit} className="border-t p-4">
        <div className="flex gap-2">
          <input
            value={input}
            onChange={handleInputChange}
            placeholder="データについて質問してください..."
            className="flex-1 p-3 border rounded-lg"
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={isLoading}
            className="px-6 py-3 bg-blue-500 text-white rounded-lg disabled:opacity-50"
          >
            送信
          </button>
        </div>
        <div className="mt-2 text-sm text-gray-500">
          例: 「先月の売上トップ10商品」「今週と先週の売上を比較」
        </div>
      </form>
    </div>
  );
}
```

## クエリ候補のサジェスト

```typescript
// lib/ai/query-suggestions.ts
import { generateObject } from "ai";
import { openai } from "@ai-sdk/openai";
import { z } from "zod";

const suggestionsSchema = z.object({
  suggestions: z.array(
    z.object({
      query: z.string().describe("提案するクエリ"),
      category: z
        .enum(["sales", "users", "products", "trends"])
        .describe("クエリカテゴリ"),
    }),
  ),
});

export async function getQuerySuggestions(context?: string) {
  const result = await generateObject({
    model: openai("gpt-4o-mini"),
    schema: suggestionsSchema,
    prompt: `ビジネスアナリストが興味を持ちそうなデータ分析クエリを5つ提案してください。

${context ? `コンテキスト: ${context}` : ""}

カテゴリ:
- sales: 売上関連
- users: ユーザー関連
- products: 商品関連
- trends: トレンド分析

具体的で実用的なクエリを提案してください。`,
  });

  return result.object.suggestions;
}
```

## 次のステップ

次章では、ダッシュボード UI の構築について学びます。
