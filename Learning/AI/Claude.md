# Claude 完全ガイド

Claude は Anthropic が開発した AI アシスタントで、高度な推論能力、長文理解、コード生成などの機能を提供します。

## 目次

1. [Claude モデル](#claude-モデル)
2. [Claude Code (CLI)](#claude-code-cli)
3. [Claude API](#claude-api)
4. [Prompt Engineering](#prompt-engineering)
5. [機能とユースケース](#機能とユースケース)
6. [制限事項](#制限事項)
7. [料金体系](#料金体系)
8. [ベストプラクティス](#ベストプラクティス)

---

## Claude モデル

### モデルの種類

#### Claude 3.5 Sonnet

- **最新モデル**: claude-sonnet-4-5-20250929 (Sonnet 4.5)
- **特徴**:
  - 最高レベルの知能と性能
  - 200K トークンのコンテキストウィンドウ
  - 優れたコード生成能力
  - 高度な推論と分析
- **用途**: 複雑なタスク、コード生成、長文分析

#### Claude 3 Opus

- **model**: claude-3-opus-20240229
- **特徴**:
  - 最高レベルの性能（3 シリーズ）
  - 複雑なタスクに最適
  - 200K トークンのコンテキスト
- **用途**: 研究、複雑な分析、クリエイティブ作業

#### Claude 3 Sonnet

- **model**: claude-3-sonnet-20240229
- **特徴**:
  - バランスの取れた性能とコスト
  - 200K トークンのコンテキスト
  - 幅広いタスクに対応
- **用途**: 一般的なタスク、データ処理、要約

#### Claude 3 Haiku

- **model**: claude-3-haiku-20240307
- **特徴**:
  - 最速の応答速度
  - コスト効率が高い
  - 200K トークンのコンテキスト
- **用途**: 簡単なタスク、高速処理、大量のリクエスト

### モデルの選び方

```
タスクの複雑さ × コスト × 速度

┌─────────────────────────────────────┐
│ 複雑なタスク → Claude 3.5 Sonnet   │
│ バランス重視 → Claude 3 Sonnet      │
│ 高速処理    → Claude 3 Haiku        │
│ 最高品質    → Claude 3 Opus         │
└─────────────────────────────────────┘
```

---

## Claude Code (CLI)

### 概要

Claude Code は、ターミナルから Claude を使用できる公式 CLI ツールです。

### 主な機能

#### 1. ファイル操作

- **Read**: ファイルの読み取り（2000 行まで、オフセット可）
- **Write**: 新規ファイルの作成
- **Edit**: 既存ファイルの編集（exact string replacement）
- **Glob**: パターンマッチングによるファイル検索
- **Grep**: コンテンツ検索（ripgrep ベース）

```typescript
// Read の使用例
Read: /path/to/file.ts
Options: offset=100, limit=50

// Glob の使用例
Pattern: **/*.tsx
Path: app/components

// Grep の使用例
Pattern: "export function.*"
Type: ts
Output: files_with_matches
```

#### 2. コマンド実行

- **Bash**: シェルコマンドの実行
  - バックグラウンド実行サポート
  - タイムアウト設定（最大 10 分）
  - 並列実行可能

```bash
# 並列実行の例
Bash: git status
Bash: npm test
Bash: ls -la

# バックグラウンド実行
Bash: npm run dev
Options: run_in_background=true
```

#### 3. Git 統合

- **自動コミット**: ファイル変更を検出して適切なコミットメッセージを生成
- **PR 作成**: GitHub CLI (gh) を使用して PR 作成

```bash
# コミットの流れ
1. git status で変更を確認
2. git diff で差分を確認
3. git log で履歴を確認
4. 変更をステージング
5. コミットメッセージを生成
6. git commit -m "message\n\nCo-Authored-By: Claude"
```

#### 4. タスク管理

- **TodoWrite**: タスクリストの作成と更新
- **ステータス**: pending, in_progress, completed

```typescript
// Todo の構造
{
  content: "タスクの説明",
  status: "in_progress",
  activeForm: "実行中の形式"
}
```

#### 5. Agent システム

- **general-purpose**: 複雑なタスクを自律的に処理
- **Explore**: コードベースの探索に特化
- **並列実行**: 複数のエージェントを同時に実行可能

```typescript
// Agent の使用例
Task: subagent_type: "Explore";
prompt: "Find all API endpoints and their authentication methods";
description: "Explore API structure";
```

#### 6. Web 機能

- **WebFetch**: URL からコンテンツを取得して分析
- **WebSearch**: Web 検索を実行（US のみ）

#### 7. MCP (Model Context Protocol)

- **IDE 統合**: VS Code との連携
  - getDiagnostics: 診断情報の取得
  - executeCode: Jupyter kernel でコード実行

### CLI の設定

#### Slash Commands

`.claude/commands/` ディレクトリにカスタムコマンドを作成できます。

```markdown
# .claude/commands/review.md

コードレビューを実行して、以下を確認:

- コード品質
- セキュリティ
- パフォーマンス
- ベストプラクティス
```

#### Hooks

`.claude/settings.yaml` でイベントフックを設定できます。

```yaml
hooks:
  user-prompt-submit:
    command: "echo 'Processing request...'"
  tool-call-pre:
    command: "validate_tool_call.sh"
```

---

## Claude API

### 基本的な使用方法

#### 1. 認証

```typescript
import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});
```

#### 2. Messages API

```typescript
const message = await client.messages.create({
  model: "claude-sonnet-4-5-20250929",
  max_tokens: 1024,
  messages: [
    {
      role: "user",
      content: "Hello, Claude!",
    },
  ],
});

console.log(message.content);
```

#### 3. Streaming

```typescript
const stream = await client.messages.create({
  model: "claude-sonnet-4-5-20250929",
  max_tokens: 1024,
  messages: [{ role: "user", content: "Write a story" }],
  stream: true,
});

for await (const event of stream) {
  if (event.type === "content_block_delta") {
    console.log(event.delta.text);
  }
}
```

#### 4. Vision (画像解析)

```typescript
const message = await client.messages.create({
  model: "claude-sonnet-4-5-20250929",
  max_tokens: 1024,
  messages: [
    {
      role: "user",
      content: [
        {
          type: "image",
          source: {
            type: "base64",
            media_type: "image/png",
            data: base64Image,
          },
        },
        {
          type: "text",
          text: "この画像を説明してください",
        },
      ],
    },
  ],
});
```

#### 5. Tool Use (Function Calling)

```typescript
const message = await client.messages.create({
  model: 'claude-sonnet-4-5-20250929',
  max_tokens: 1024,
  tools: [
    {
      name: 'get_weather',
      description: '指定された場所の天気を取得',
      input_schema: {
        type: 'object',
        properties: {
          location: {
            type: 'string',
            description: '都市名'
          }
        },
        required: ['location']
      }
    }
  ],
  messages: [
    {
      role: 'user',
      content: '東京の天気を教えて'
    }
  ]
});

// Tool の実行
if (message.stop_reason === 'tool_use') {
  const toolUse = message.content.find(c => c.type === 'tool_use');
  const result = getWeather(toolUse.input.location);

  // 結果を返す
  const response = await client.messages.create({
    model: 'claude-sonnet-4-5-20250929',
    max_tokens: 1024,
    messages: [
      { role: 'user', content: '東京の天気を教えて' },
      { role: 'assistant', content: message.content },
      {
        role: 'user',
        content: [
          {
            type: 'tool_result',
            tool_use_id: toolUse.id,
            content: JSON.stringify(result)
          }
        ]
      }
    ],
    tools: [...]
  });
}
```

#### 6. System Prompts

```typescript
const message = await client.messages.create({
  model: "claude-sonnet-4-5-20250929",
  max_tokens: 1024,
  system: `あなたは親切で専門的なプログラミングアシスタントです。
コードの説明は日本語で、コメントも日本語で書いてください。`,
  messages: [
    {
      role: "user",
      content: "React のカスタムフックを作成して",
    },
  ],
});
```

### レート制限

```
┌──────────────────────────────────────────┐
│ モデル           │ RPM   │ TPM         │
├──────────────────┼───────┼─────────────┤
│ Claude 3.5 Sonnet│ 50    │ 40,000      │
│ Claude 3 Opus    │ 50    │ 20,000      │
│ Claude 3 Sonnet  │ 50    │ 40,000      │
│ Claude 3 Haiku   │ 50    │ 50,000      │
└──────────────────────────────────────────┘

RPM = Requests Per Minute
TPM = Tokens Per Minute
```

---

## Prompt Engineering

### 基本原則

#### 1. 明確で具体的な指示

❌ **悪い例**:

```
このコードを改善して
```

✅ **良い例**:

```
このReactコンポーネントを以下の点で改善してください:
1. TypeScriptの型安全性を向上
2. useMemoでパフォーマンス最適化
3. エラーハンドリングを追加
4. アクセシビリティ対応
```

#### 2. コンテキストの提供

```
## 状況
Next.js 16 のプロジェクトで、サーバーアクションを使用したフォームを実装中です。

## 問題
フォーム送信後、楽観的更新が正しく動作していません。

## 期待する動作
送信直後にUIを更新し、サーバーレスポンス後に確定させたい。

## コード
[コードを貼り付け]
```

#### 3. 思考過程の誘導

```
以下の手順で考えてください:

1. 現在のコードの問題点を分析
2. 可能な解決策を3つ提案
3. 各解決策のメリット・デメリットを比較
4. 最適な解決策を選択して実装
```

#### 4. 出力フォーマットの指定

```
以下のJSON形式で応答してください:

{
  "analysis": "問題の分析",
  "solutions": [
    {
      "name": "解決策の名前",
      "pros": ["メリット1", "メリット2"],
      "cons": ["デメリット1"],
      "code": "実装コード"
    }
  ],
  "recommendation": "推奨する解決策"
}
```

### Advanced テクニック

#### 1. Few-Shot Learning

```
以下の例に従って、新しいAPIエンドポイントを作成してください:

例1:
Input: GET /users/:id
Output:
export async function GET(request: Request, { params }: { params: { id: string } }) {
  const user = await db.user.findUnique({ where: { id: params.id } });
  return Response.json(user);
}

例2:
Input: POST /posts
Output:
export async function POST(request: Request) {
  const body = await request.json();
  const post = await db.post.create({ data: body });
  return Response.json(post);
}

新しいタスク:
Input: DELETE /comments/:id
```

#### 2. Chain of Thought (CoT)

```
ステップバイステップで考えてください:

問題: この関数のパフォーマンスを改善したい

1. まず、現在の実装を分析して、ボトルネックを特定してください
2. 次に、各ボトルネックに対する最適化案を提案してください
3. 最後に、最も効果的な最適化を実装してください

各ステップで、あなたの思考過程を説明してください。
```

#### 3. Self-Consistency

```
以下の問題に対して、3つの異なるアプローチで解決してください:

問題: ユーザー認証システムの実装

アプローチ1: JWT ベース
アプローチ2: セッションベース
アプローチ3: OAuth 2.0

各アプローチの実装例と、プロジェクトの要件に最適なものを推奨してください。
```

#### 4. Role Playing

```
あなたは10年の経験を持つシニアReact開発者です。
後輩開発者が以下のコードレビューを依頼してきました。

コードレビューの観点:
- パフォーマンス
- セキュリティ
- 保守性
- ベストプラクティス

建設的で具体的なフィードバックを提供してください。
```

### プロンプトテンプレート

#### コードレビュー

```
# コードレビュー依頼

## ファイル
[ファイルパス]

## 変更内容
[変更の説明]

## レビューポイント
- [ ] コード品質
- [ ] パフォーマンス
- [ ] セキュリティ
- [ ] テスト
- [ ] ドキュメント

## 追加情報
[コンテキストや注意点]
```

#### バグ修正

```
# バグレポート

## 症状
[何が起きているか]

## 再現手順
1. [ステップ1]
2. [ステップ2]
3. [ステップ3]

## 期待する動作
[本来どうあるべきか]

## 環境
- OS: [OS名]
- ブラウザ: [ブラウザ名]
- Node.js: [バージョン]

## エラーメッセージ
```

[エラー内容]

```

## 関連コード
[該当するコード]
```

#### 機能実装

```
# 機能実装リクエスト

## 機能名
[機能の名前]

## 目的
[なぜこの機能が必要か]

## 要件
### 必須
- [必須要件1]
- [必須要件2]

### オプション
- [オプション要件1]

## 技術スタック
- フレームワーク: [例: Next.js 16]
- 言語: [例: TypeScript]
- スタイリング: [例: Tailwind CSS]

## 参考
[参考になるリソースやサイト]
```

---

## 機能とユースケース

### 1. コード生成

#### 特徴

- 複数の言語に対応（TypeScript, Python, Rust, Go など）
- フレームワークの理解（React, Next.js, Vue など）
- ベストプラクティスの適用
- テストコードの生成

#### 使用例

```typescript
// プロンプト: "Next.js 16 のサーバーアクションで、ユーザー登録機能を実装"

"use server";

import { db } from "@/lib/db";
import { z } from "zod";
import bcrypt from "bcrypt";
import { redirect } from "next/navigation";

// バリデーションスキーマ
const registerSchema = z.object({
  email: z.string().email("有効なメールアドレスを入力してください"),
  password: z
    .string()
    .min(8, "パスワードは8文字以上である必要があります")
    .regex(/[A-Z]/, "大文字を含める必要があります")
    .regex(/[0-9]/, "数字を含める必要があります"),
  name: z.string().min(1, "名前を入力してください"),
});

export async function registerUser(formData: FormData) {
  // フォームデータの取得
  const rawData = {
    email: formData.get("email"),
    password: formData.get("password"),
    name: formData.get("name"),
  };

  // バリデーション
  const validated = registerSchema.safeParse(rawData);
  if (!validated.success) {
    return {
      success: false,
      errors: validated.error.flatten().fieldErrors,
    };
  }

  const { email, password, name } = validated.data;

  try {
    // 既存ユーザーチェック
    const existingUser = await db.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return {
        success: false,
        errors: { email: ["このメールアドレスは既に登録されています"] },
      };
    }

    // パスワードのハッシュ化
    const hashedPassword = await bcrypt.hash(password, 10);

    // ユーザーの作成
    const user = await db.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
      },
    });

    // セッションの作成（実装は省略）
    // await createSession(user.id);

    return {
      success: true,
      data: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
    };
  } catch (error) {
    console.error("Registration error:", error);
    return {
      success: false,
      errors: { _form: ["登録に失敗しました。もう一度お試しください。"] },
    };
  }
}
```

### 2. コードレビューと最適化

#### リファクタリング例

```typescript
// Before: 非効率なコード
function processUsers(users: User[]) {
  const result = [];
  for (let i = 0; i < users.length; i++) {
    if (users[i].age >= 18) {
      result.push({
        name: users[i].name.toUpperCase(),
        email: users[i].email.toLowerCase(),
        isAdult: true,
      });
    }
  }
  return result;
}

// After: Claude の最適化
function processUsers(users: User[]): ProcessedUser[] {
  return users
    .filter((user) => user.age >= 18)
    .map((user) => ({
      name: user.name.toUpperCase(),
      email: user.email.toLowerCase(),
      isAdult: true as const,
    }));
}

// 型定義も追加
interface ProcessedUser {
  name: string;
  email: string;
  isAdult: true;
}
```

### 3. データ分析と可視化

```typescript
// プロンプト: "このCSVデータを分析して、トレンドを可視化するコードを書いて"

import { parse } from "csv-parse/sync";
import { readFileSync } from "fs";

interface SalesData {
  date: string;
  revenue: number;
  customers: number;
}

// データの読み込みと解析
function analyzeSalesData(filePath: string) {
  const fileContent = readFileSync(filePath, "utf-8");
  const records = parse(fileContent, {
    columns: true,
    skip_empty_lines: true,
  }) as SalesData[];

  // 月別の集計
  const monthlyData = records.reduce((acc, record) => {
    const month = record.date.substring(0, 7); // YYYY-MM
    if (!acc[month]) {
      acc[month] = { revenue: 0, customers: 0, count: 0 };
    }
    acc[month].revenue += record.revenue;
    acc[month].customers += record.customers;
    acc[month].count += 1;
    return acc;
  }, {} as Record<string, { revenue: number; customers: number; count: number }>);

  // 統計の計算
  const stats = Object.entries(monthlyData).map(([month, data]) => ({
    month,
    avgRevenue: data.revenue / data.count,
    avgCustomers: data.customers / data.count,
    totalRevenue: data.revenue,
    totalCustomers: data.customers,
  }));

  // トレンド分析
  const trend = calculateTrend(stats.map((s) => s.totalRevenue));

  return {
    stats,
    trend,
    summary: {
      totalRevenue: stats.reduce((sum, s) => sum + s.totalRevenue, 0),
      avgMonthlyRevenue:
        stats.reduce((sum, s) => sum + s.avgRevenue, 0) / stats.length,
      growth: trend.slope > 0 ? "increasing" : "decreasing",
    },
  };
}

function calculateTrend(values: number[]) {
  const n = values.length;
  const indices = Array.from({ length: n }, (_, i) => i);

  const sumX = indices.reduce((a, b) => a + b, 0);
  const sumY = values.reduce((a, b) => a + b, 0);
  const sumXY = indices.reduce((sum, x, i) => sum + x * values[i], 0);
  const sumX2 = indices.reduce((sum, x) => sum + x * x, 0);

  const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
  const intercept = (sumY - slope * sumX) / n;

  return { slope, intercept };
}
```

### 4. ドキュメント生成

````typescript
/**
 * ユーザー認証サービス
 *
 * このサービスは、アプリケーションのユーザー認証を管理します。
 * JWT トークンベースの認証を使用し、リフレッシュトークンをサポートします。
 *
 * @example
 * ```typescript
 * const authService = new AuthService();
 * const result = await authService.login('user@example.com', 'password');
 * if (result.success) {
 *   console.log('Access token:', result.accessToken);
 * }
 * ```
 */
export class AuthService {
  /**
   * ユーザーのログイン
   *
   * メールアドレスとパスワードを検証し、成功した場合は
   * アクセストークンとリフレッシュトークンを返します。
   *
   * @param email - ユーザーのメールアドレス
   * @param password - ユーザーのパスワード
   * @returns 認証結果（トークンまたはエラー）
   *
   * @throws {ValidationError} メールアドレスまたはパスワードが無効な場合
   * @throws {AuthenticationError} 認証情報が正しくない場合
   * @throws {DatabaseError} データベース接続エラーが発生した場合
   */
  async login(email: string, password: string): Promise<AuthResult> {
    // 実装...
  }
}
````

### 5. テスト生成

```typescript
// プロンプト: "この関数のテストを書いて"

import { describe, it, expect, beforeEach, vi } from "vitest";
import { registerUser } from "./actions";
import { db } from "@/lib/db";
import bcrypt from "bcrypt";

// モック設定
vi.mock("@/lib/db", () => ({
  db: {
    user: {
      findUnique: vi.fn(),
      create: vi.fn(),
    },
  },
}));

vi.mock("bcrypt", () => ({
  default: {
    hash: vi.fn(),
  },
}));

describe("registerUser", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("有効なデータで登録が成功する", async () => {
    // Arrange
    const formData = new FormData();
    formData.append("email", "test@example.com");
    formData.append("password", "Password123");
    formData.append("name", "Test User");

    vi.mocked(db.user.findUnique).mockResolvedValue(null);
    vi.mocked(bcrypt.hash).mockResolvedValue("hashed_password" as never);
    vi.mocked(db.user.create).mockResolvedValue({
      id: "1",
      email: "test@example.com",
      name: "Test User",
      password: "hashed_password",
      createdAt: new Date(),
    } as never);

    // Act
    const result = await registerUser(formData);

    // Assert
    expect(result.success).toBe(true);
    expect(result.data).toEqual({
      id: "1",
      email: "test@example.com",
      name: "Test User",
    });
  });

  it("無効なメールアドレスでエラーを返す", async () => {
    // Arrange
    const formData = new FormData();
    formData.append("email", "invalid-email");
    formData.append("password", "Password123");
    formData.append("name", "Test User");

    // Act
    const result = await registerUser(formData);

    // Assert
    expect(result.success).toBe(false);
    expect(result.errors?.email).toBeDefined();
  });

  it("短いパスワードでエラーを返す", async () => {
    // Arrange
    const formData = new FormData();
    formData.append("email", "test@example.com");
    formData.append("password", "short");
    formData.append("name", "Test User");

    // Act
    const result = await registerUser(formData);

    // Assert
    expect(result.success).toBe(false);
    expect(result.errors?.password).toBeDefined();
  });

  it("既存のユーザーでエラーを返す", async () => {
    // Arrange
    const formData = new FormData();
    formData.append("email", "existing@example.com");
    formData.append("password", "Password123");
    formData.append("name", "Test User");

    vi.mocked(db.user.findUnique).mockResolvedValue({
      id: "2",
      email: "existing@example.com",
    } as never);

    // Act
    const result = await registerUser(formData);

    // Assert
    expect(result.success).toBe(false);
    expect(result.errors?.email).toContain(
      "このメールアドレスは既に登録されています"
    );
  });
});
```

### 6. 長文要約と分析

Claude は 200K トークンのコンテキストウィンドウを持ち、長文の処理に優れています。

```
プロンプト例:

この技術ドキュメント（50ページ）を読んで、以下をまとめてください:

1. エグゼクティブサマリー（3-5文）
2. 主要なポイント（箇条書き）
3. 技術的な詳細（重要なもののみ）
4. 実装の推奨事項
5. 潜在的なリスクと対策

対象読者: 技術マネージャー
```

---

## 制限事項

### 1. 知識のカットオフ

- **カットオフ日**: 2025 年 1 月
- **影響**: それ以降の情報は知らない可能性がある
- **対策**: WebSearch や WebFetch を使用して最新情報を取得

### 2. ファイルサイズ制限

- **Read ツール**: 1 回あたり 2000 行（オフセット可）
- **コンテキスト**: 200K トークン（約 150,000 単語）
- **対策**: 大きなファイルは分割して読み取る

### 3. 実行時間制限

- **Bash コマンド**: デフォルト 2 分、最大 10 分
- **対策**: 長時間のタスクはバックグラウンド実行

### 4. レート制限

```
API Tier 1:
- 50 requests per minute
- 40,000 tokens per minute (Claude 3.5 Sonnet)

超過時の対策:
- リクエストの間隔を空ける
- バッチ処理を使用
- Tier のアップグレードを検討
```

### 5. セキュリティ制限

Claude は以下のタスクを拒否します:

- **攻撃的なセキュリティタスク**:

  - マルウェアの作成
  - 認証情報の収集
  - 悪意のあるコードの生成

- **許可されるタスク**:
  - セキュリティ分析
  - 脆弱性の説明
  - 防御的なツールの作成
  - セキュリティドキュメント

### 6. 実行環境の制限

- **ファイルシステム**: 作業ディレクトリ内のみアクセス可能
- **ネットワーク**: WebFetch と WebSearch のみ
- **リソース**: メモリや CPU の制限あり

---

## 料金体系

### API 料金（2025 年 1 月時点）

```
┌─────────────────────────────────────────────────────────┐
│ モデル              │ Input         │ Output          │
├─────────────────────┼───────────────┼─────────────────┤
│ Claude 3.5 Sonnet   │ $3 / 1M tokens│ $15 / 1M tokens │
│ Claude 3 Opus       │ $15/ 1M tokens│ $75 / 1M tokens │
│ Claude 3 Sonnet     │ $3 / 1M tokens│ $15 / 1M tokens │
│ Claude 3 Haiku      │ $0.25/ 1M tok │ $1.25/ 1M tokens│
└─────────────────────────────────────────────────────────┘
```

### コスト最適化のヒント

#### 1. 適切なモデルの選択

```typescript
// 簡単なタスク → Haiku
const summary = await claude.messages.create({
  model: "claude-3-haiku-20240307",
  messages: [{ role: "user", content: "Summarize this in 2 sentences" }],
});

// 複雑なタスク → Sonnet
const analysis = await claude.messages.create({
  model: "claude-sonnet-4-5-20250929",
  messages: [{ role: "user", content: "Analyze this codebase architecture" }],
});
```

#### 2. トークン数の削減

```typescript
// ❌ 冗長なプロンプト
const bad = `
Please analyze this code and tell me what it does.
I would like you to explain in detail every single line.
Also, please provide examples and alternative implementations.
Furthermore, I need you to...
`;

// ✅ 簡潔なプロンプト
const good = `
Analyze this code:
1. What it does
2. Line-by-line explanation
3. Alternative implementations
`;
```

#### 3. キャッシングの活用

```typescript
// 同じシステムプロンプトを再利用
const systemPrompt = `You are a TypeScript expert...`;

// 複数のリクエストで同じプロンプトを使用
const requests = tasks.map((task) =>
  claude.messages.create({
    model: "claude-sonnet-4-5-20250929",
    system: systemPrompt, // キャッシュされる
    messages: [{ role: "user", content: task }],
  })
);
```

#### 4. ストリーミングの使用

```typescript
// ストリーミングで早期終了が可能
const stream = await claude.messages.create({
  model: "claude-3-haiku-20240307",
  messages: [{ role: "user", content: "List 100 items" }],
  stream: true,
});

let count = 0;
for await (const event of stream) {
  if (count++ > 10) {
    stream.controller.abort(); // 必要な情報を得たら停止
    break;
  }
}
```

---

## ベストプラクティス

### 1. エラーハンドリング

```typescript
import Anthropic from "@anthropic-ai/sdk";

async function robustClaudeCall(prompt: string) {
  const client = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY,
  });

  let retries = 3;
  while (retries > 0) {
    try {
      const response = await client.messages.create({
        model: "claude-sonnet-4-5-20250929",
        max_tokens: 1024,
        messages: [{ role: "user", content: prompt }],
      });

      return {
        success: true,
        data: response.content[0].text,
      };
    } catch (error) {
      if (error instanceof Anthropic.APIError) {
        // レート制限エラー
        if (error.status === 429) {
          const retryAfter = parseInt(error.headers?.["retry-after"] || "60");
          console.log(`Rate limited. Retrying after ${retryAfter}s`);
          await new Promise((resolve) =>
            setTimeout(resolve, retryAfter * 1000)
          );
          retries--;
          continue;
        }

        // 認証エラー
        if (error.status === 401) {
          return {
            success: false,
            error: "Invalid API key",
          };
        }

        // サーバーエラー
        if (error.status >= 500) {
          console.log("Server error. Retrying...");
          retries--;
          await new Promise((resolve) => setTimeout(resolve, 1000));
          continue;
        }
      }

      // その他のエラー
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  return {
    success: false,
    error: "Max retries exceeded",
  };
}
```

### 2. プロンプトのバージョン管理

```typescript
// prompts/code-review.ts
export const codeReviewPrompt = {
  version: "1.0.0",
  template: `
# Code Review

## File: {{filename}}

## Changes:
{{changes}}

## Review Points:
- Code quality and readability
- Performance implications
- Security concerns
- Best practices adherence
- Test coverage

Please provide:
1. Overall assessment (1-5 stars)
2. Specific issues (if any)
3. Suggestions for improvement
4. Positive aspects
`,
  variables: ["filename", "changes"],
};

// 使用
function renderPrompt(template: string, vars: Record<string, string>) {
  return Object.entries(vars).reduce(
    (acc, [key, value]) => acc.replace(`{{${key}}}`, value),
    template
  );
}

const prompt = renderPrompt(codeReviewPrompt.template, {
  filename: "auth.ts",
  changes: diffContent,
});
```

### 3. 構造化された出力

```typescript
import { z } from "zod";

// スキーマ定義
const CodeAnalysisSchema = z.object({
  complexity: z.enum(["low", "medium", "high"]),
  issues: z.array(
    z.object({
      line: z.number(),
      severity: z.enum(["error", "warning", "info"]),
      message: z.string(),
    })
  ),
  metrics: z.object({
    linesOfCode: z.number(),
    functions: z.number(),
    classes: z.number(),
  }),
  suggestions: z.array(z.string()),
});

async function analyzeCode(code: string) {
  const prompt = `
Analyze this code and respond ONLY with valid JSON matching this schema:

{
  "complexity": "low" | "medium" | "high",
  "issues": [
    {
      "line": number,
      "severity": "error" | "warning" | "info",
      "message": string
    }
  ],
  "metrics": {
    "linesOfCode": number,
    "functions": number,
    "classes": number
  },
  "suggestions": [string]
}

Code:
\`\`\`
${code}
\`\`\`
`;

  const response = await claude.messages.create({
    model: "claude-sonnet-4-5-20250929",
    max_tokens: 2048,
    messages: [{ role: "user", content: prompt }],
  });

  const jsonText = response.content[0].text;
  const parsed = JSON.parse(jsonText);

  // バリデーション
  const validated = CodeAnalysisSchema.parse(parsed);

  return validated;
}
```

### 4. コンテキストの管理

```typescript
class ConversationManager {
  private messages: Array<{ role: "user" | "assistant"; content: string }> = [];
  private maxTokens = 100000; // コンテキストの上限

  async addMessage(role: "user" | "assistant", content: string) {
    this.messages.push({ role, content });
    await this.trimContext();
  }

  private async trimContext() {
    // トークン数を概算（正確にはtiktoken等を使用）
    const estimatedTokens = this.messages.reduce(
      (sum, msg) => sum + msg.content.length / 4,
      0
    );

    // 上限を超えたら古いメッセージを削除
    while (estimatedTokens > this.maxTokens && this.messages.length > 2) {
      // 最初のユーザーメッセージとアシスタントの応答を削除
      this.messages.splice(0, 2);
    }
  }

  async chat(userMessage: string) {
    await this.addMessage("user", userMessage);

    const response = await claude.messages.create({
      model: "claude-sonnet-4-5-20250929",
      max_tokens: 2048,
      messages: this.messages,
    });

    const assistantMessage = response.content[0].text;
    await this.addMessage("assistant", assistantMessage);

    return assistantMessage;
  }

  getHistory() {
    return [...this.messages];
  }

  clear() {
    this.messages = [];
  }
}

// 使用例
const conversation = new ConversationManager();
await conversation.chat("Hello");
await conversation.chat("How are you?");
const history = conversation.getHistory();
```

### 5. パフォーマンス最適化

```typescript
// 並列処理
async function analyzeMultipleFiles(files: string[]) {
  // ファイルを読み取り
  const fileContents = await Promise.all(
    files.map(async (file) => ({
      path: file,
      content: await readFile(file, "utf-8"),
    }))
  );

  // 並列でClaudeに送信（レート制限に注意）
  const batchSize = 5;
  const results = [];

  for (let i = 0; i < fileContents.length; i += batchSize) {
    const batch = fileContents.slice(i, i + batchSize);
    const batchResults = await Promise.all(
      batch.map(({ path, content }) =>
        analyzeCode(content).then((result) => ({ path, result }))
      )
    );
    results.push(...batchResults);

    // レート制限を避けるため、バッチ間で待機
    if (i + batchSize < fileContents.length) {
      await new Promise((resolve) => setTimeout(resolve, 2000));
    }
  }

  return results;
}
```

### 6. セキュリティ

```typescript
// 機密情報のフィルタリング
function sanitizeCode(code: string): string {
  return (
    code
      // API キーを削除
      .replace(/(['"`])[\w-]{20,}(['"`])/g, "$1***REDACTED***$2")
      // パスワードを削除
      .replace(
        /password\s*[:=]\s*(['"`]).*?\1/gi,
        "password=$1***REDACTED***$1"
      )
      // トークンを削除
      .replace(/token\s*[:=]\s*(['"`]).*?\1/gi, "token=$1***REDACTED***$1")
      // 環境変数を削除
      .replace(/process\.env\.\w+/g, "process.env.***REDACTED***")
  );
}

// 使用
async function reviewCode(code: string) {
  const sanitized = sanitizeCode(code);
  return await claude.messages.create({
    model: "claude-sonnet-4-5-20250929",
    messages: [
      {
        role: "user",
        content: `Review this code:\n\`\`\`\n${sanitized}\n\`\`\``,
      },
    ],
  });
}
```

### 7. モニタリングとログ

```typescript
import { createLogger, format, transports } from "winston";

const logger = createLogger({
  format: format.combine(format.timestamp(), format.json()),
  transports: [new transports.File({ filename: "claude-api.log" })],
});

async function loggedClaudeCall(prompt: string) {
  const startTime = Date.now();
  const requestId = crypto.randomUUID();

  logger.info("Claude API Request", {
    requestId,
    promptLength: prompt.length,
  });

  try {
    const response = await claude.messages.create({
      model: "claude-sonnet-4-5-20250929",
      max_tokens: 1024,
      messages: [{ role: "user", content: prompt }],
    });

    const duration = Date.now() - startTime;
    const tokens = {
      input: response.usage.input_tokens,
      output: response.usage.output_tokens,
      total: response.usage.input_tokens + response.usage.output_tokens,
    };

    logger.info("Claude API Success", {
      requestId,
      duration,
      tokens,
      model: response.model,
    });

    return response;
  } catch (error) {
    const duration = Date.now() - startTime;

    logger.error("Claude API Error", {
      requestId,
      duration,
      error: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : undefined,
    });

    throw error;
  }
}
```

---

## 実践的な統合例

### Next.js との統合

```typescript
// app/api/ai/analyze/route.ts
import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const { code, task } = await request.json();

    if (!code || !task) {
      return NextResponse.json(
        { error: "Code and task are required" },
        { status: 400 }
      );
    }

    const response = await client.messages.create({
      model: "claude-sonnet-4-5-20250929",
      max_tokens: 2048,
      messages: [
        {
          role: "user",
          content: `Task: ${task}\n\nCode:\n\`\`\`\n${code}\n\`\`\``,
        },
      ],
    });

    return NextResponse.json({
      success: true,
      result: response.content[0].text,
      usage: response.usage,
    });
  } catch (error) {
    console.error("AI Analysis Error:", error);
    return NextResponse.json({ error: "Analysis failed" }, { status: 500 });
  }
}

// ストリーミング版
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const prompt = searchParams.get("prompt");

  if (!prompt) {
    return NextResponse.json({ error: "Prompt is required" }, { status: 400 });
  }

  const stream = await client.messages.create({
    model: "claude-sonnet-4-5-20250929",
    max_tokens: 1024,
    messages: [{ role: "user", content: prompt }],
    stream: true,
  });

  const encoder = new TextEncoder();
  const readableStream = new ReadableStream({
    async start(controller) {
      for await (const event of stream) {
        if (event.type === "content_block_delta") {
          const text = event.delta.text;
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ text })}\n\n`)
          );
        }
      }
      controller.close();
    },
  });

  return new Response(readableStream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
```

### React Hook の作成

```typescript
// hooks/useClaude.ts
import { useState, useCallback } from "react";

interface UseClaude {
  analyze: (code: string, task: string) => Promise<void>;
  result: string | null;
  loading: boolean;
  error: string | null;
}

export function useClaude(): UseClaude {
  const [result, setResult] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const analyze = useCallback(async (code: string, task: string) => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch("/api/ai/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, task }),
      });

      if (!response.ok) {
        throw new Error("Analysis failed");
      }

      const data = await response.json();
      setResult(data.result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }, []);

  return { analyze, result, loading, error };
}

// コンポーネントでの使用
export function CodeAnalyzer() {
  const { analyze, result, loading, error } = useClaude();
  const [code, setCode] = useState("");

  const handleAnalyze = () => {
    analyze(code, "Review this code and suggest improvements");
  };

  return (
    <div>
      <textarea
        value={code}
        onChange={(e) => setCode(e.target.value)}
        placeholder="Paste your code here"
      />
      <button onClick={handleAnalyze} disabled={loading}>
        {loading ? "Analyzing..." : "Analyze Code"}
      </button>
      {error && <div className="error">{error}</div>}
      {result && <div className="result">{result}</div>}
    </div>
  );
}
```

---

## まとめ

Claude は、以下の用途に特に優れています:

1. **コード生成**: TypeScript, React, Next.js などの最新技術に対応
2. **コードレビュー**: セキュリティ、パフォーマンス、ベストプラクティスの観点
3. **長文処理**: 200K トークンのコンテキストで大規模なドキュメントを処理
4. **データ分析**: CSV、JSON、ログファイルの分析と可視化
5. **ドキュメント生成**: コメント、README、API ドキュメントの自動生成
6. **テスト生成**: ユニットテスト、統合テストの自動作成

### 効果的な使い方のポイント

✅ **明確で具体的なプロンプト**を書く
✅ **適切なモデル**を選択する（タスクに応じて）
✅ **構造化された出力**を要求する
✅ **エラーハンドリング**を実装する
✅ **コストを最適化**する（トークン数削減、キャッシング）
✅ **セキュリティ**に注意する（機密情報のフィルタリング）

### 参考リンク

- 公式ドキュメント: https://docs.claude.com
- Claude Code ドキュメント: https://docs.claude.com/en/docs/claude-code
- API リファレンス: https://docs.claude.com/en/api
- GitHub: https://github.com/anthropics/anthropic-sdk-typescript
- コミュニティ: https://discord.gg/anthropic

---

最終更新: 2025 年 11 月
