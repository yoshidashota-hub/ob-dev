# MCP (Model Context Protocol) 学習ノート

## 概要

MCP は Anthropic が策定した、LLM とツール/データソースを接続するためのプロトコル。Claude Code や他の AI アプリケーションで外部システムとの統合を標準化。

## アーキテクチャ

```
┌─────────────────────────────────────────────────────┐
│                    Host Application                  │
│                  (Claude Code, IDE)                  │
│                                                     │
│  ┌──────────────────────────────────────────────┐  │
│  │              MCP Client                       │  │
│  └──────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────┘
                        │ JSON-RPC
        ┌───────────────┼───────────────┐
        ▼               ▼               ▼
┌───────────┐   ┌───────────┐   ┌───────────┐
│ MCP Server│   │ MCP Server│   │ MCP Server│
│ (GitHub)  │   │ (Database)│   │ (Custom)  │
└───────────┘   └───────────┘   └───────────┘
```

## MCP の主要機能

### 1. Tools（ツール）

LLM が呼び出せる関数。

```typescript
// ツール定義
{
  name: "search_code",
  description: "Search code in repository",
  inputSchema: {
    type: "object",
    properties: {
      query: { type: "string", description: "Search query" },
      path: { type: "string", description: "Path to search in" }
    },
    required: ["query"]
  }
}
```

### 2. Resources（リソース）

読み取り可能なデータソース。

```typescript
// リソース定義
{
  uri: "file:///path/to/document.md",
  name: "README",
  mimeType: "text/markdown",
  description: "Project documentation"
}
```

### 3. Prompts（プロンプト）

再利用可能なプロンプトテンプレート。

```typescript
// プロンプト定義
{
  name: "code_review",
  description: "Review code for best practices",
  arguments: [
    { name: "language", description: "Programming language" },
    { name: "code", description: "Code to review" }
  ]
}
```

## MCP サーバー実装

### TypeScript でサーバー作成

```typescript
// server.ts
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";

const server = new Server(
  { name: "my-mcp-server", version: "1.0.0" },
  { capabilities: { tools: {}, resources: {} } },
);

// ツール定義
server.setRequestHandler("tools/list", async () => ({
  tools: [
    {
      name: "get_weather",
      description: "Get weather for a location",
      inputSchema: {
        type: "object",
        properties: {
          location: { type: "string", description: "City name" },
        },
        required: ["location"],
      },
    },
  ],
}));

// ツール実行
server.setRequestHandler("tools/call", async (request) => {
  const { name, arguments: args } = request.params;

  if (name === "get_weather") {
    const weather = await fetchWeather(args.location);
    return { content: [{ type: "text", text: JSON.stringify(weather) }] };
  }

  throw new Error(`Unknown tool: ${name}`);
});

// サーバー起動
const transport = new StdioServerTransport();
await server.connect(transport);
```

### リソース提供

```typescript
// リソース一覧
server.setRequestHandler("resources/list", async () => ({
  resources: [
    {
      uri: "notes://all",
      name: "All Notes",
      mimeType: "application/json",
    },
  ],
}));

// リソース読み取り
server.setRequestHandler("resources/read", async (request) => {
  const { uri } = request.params;

  if (uri === "notes://all") {
    const notes = await getAllNotes();
    return {
      contents: [
        { uri, mimeType: "application/json", text: JSON.stringify(notes) },
      ],
    };
  }
});
```

## Claude Code での設定

```json
// .mcp.json
{
  "mcpServers": {
    "my-server": {
      "command": "node",
      "args": ["/path/to/server.js"],
      "env": {
        "API_KEY": "..."
      }
    },
    "github": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-github"],
      "env": {
        "GITHUB_TOKEN": "..."
      }
    }
  }
}
```

## 公式 MCP サーバー

| サーバー                                | 用途         |
| --------------------------------------- | ------------ |
| @modelcontextprotocol/server-github     | GitHub 操作  |
| @modelcontextprotocol/server-filesystem | ファイル操作 |
| @modelcontextprotocol/server-postgres   | PostgreSQL   |
| @modelcontextprotocol/server-slack      | Slack 連携   |
| @modelcontextprotocol/server-puppeteer  | ブラウザ操作 |

## カスタムサーバー例：ノートアプリ

```typescript
// notes-mcp-server.ts
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const server = new Server(
  { name: "notes-server", version: "1.0.0" },
  { capabilities: { tools: {}, resources: {} } },
);

// ツール: ノート作成
server.setRequestHandler("tools/list", async () => ({
  tools: [
    {
      name: "create_note",
      description: "Create a new note",
      inputSchema: {
        type: "object",
        properties: {
          title: { type: "string" },
          content: { type: "string" },
        },
        required: ["title", "content"],
      },
    },
    {
      name: "search_notes",
      description: "Search notes by keyword",
      inputSchema: {
        type: "object",
        properties: {
          query: { type: "string" },
        },
        required: ["query"],
      },
    },
  ],
}));

server.setRequestHandler("tools/call", async (request) => {
  const { name, arguments: args } = request.params;

  switch (name) {
    case "create_note": {
      const note = await prisma.note.create({
        data: { title: args.title, content: args.content },
      });
      return { content: [{ type: "text", text: `Created note: ${note.id}` }] };
    }
    case "search_notes": {
      const notes = await prisma.note.findMany({
        where: {
          OR: [
            { title: { contains: args.query } },
            { content: { contains: args.query } },
          ],
        },
      });
      return { content: [{ type: "text", text: JSON.stringify(notes) }] };
    }
  }
});
```

## ベストプラクティス

1. **明確なツール説明**: LLM が適切に使えるよう詳細に
2. **入力バリデーション**: 不正な入力を適切に処理
3. **エラーハンドリング**: わかりやすいエラーメッセージ
4. **最小権限**: 必要な機能のみ提供
5. **ロギング**: デバッグ用のログ出力

## 参考リソース

- [MCP 公式ドキュメント](https://modelcontextprotocol.io/)
- [MCP Servers リポジトリ](https://github.com/modelcontextprotocol/servers)
- [Claude Code MCP 設定](https://docs.anthropic.com/en/docs/claude-code)
