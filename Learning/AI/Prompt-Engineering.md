# プロンプトエンジニアリング 学習ノート

## 概要

プロンプトエンジニアリングは、LLM から望む出力を得るためのプロンプト設計技術。

## 基本原則

### 1. 明確で具体的に

```
❌ 悪い例
「コードを書いて」

✅ 良い例
「TypeScriptでユーザー認証用のJWT検証関数を書いてください。
jose ライブラリを使用し、以下の仕様に従ってください：
- トークンの有効期限を検証
- ペイロードからユーザーIDを取得
- 無効なトークンの場合は適切なエラーを返す」
```

### 2. コンテキストを提供

```
「私は Next.js 16 を使用した Web アプリケーションを開発しています。
App Router を使用し、Server Components を中心に設計しています。

現在、以下のエラーが発生しています：
[エラーメッセージ]

関連コードは以下です：
[コード]」
```

### 3. 出力形式を指定

```
「以下の情報をJSON形式で出力してください：
- name: 製品名
- price: 価格（数値）
- description: 説明（100文字以内）」
```

## 高度なテクニック

### Chain of Thought (CoT)

```
「この問題を段階的に考えてください：

1. まず、現在の状況を分析
2. 次に、考えられる原因をリストアップ
3. 各原因の可能性を評価
4. 最も可能性の高い原因を特定
5. 解決策を提案」
```

### Few-shot Learning

```
「以下の例を参考に、コミットメッセージを生成してください。

例1:
変更: ログイン機能を追加
メッセージ: feat: add user authentication with JWT

例2:
変更: パフォーマンスバグを修正
メッセージ: fix: resolve memory leak in data fetching

今回の変更:
変更: ダークモードを実装
メッセージ:」
```

### Role Playing

```
「あなたは経験豊富なTypeScriptエンジニアです。
コードレビューの観点から、以下のコードの問題点を指摘し、
改善案を提示してください。

特に以下の観点でレビューしてください：
- 型安全性
- パフォーマンス
- 可読性
- セキュリティ」
```

## システムプロンプト設計

```typescript
const systemPrompt = `
あなたは Next.js と TypeScript の専門家です。

## 行動規範
- 常に最新のベストプラクティスに従う
- Server Components を優先的に使用
- 型安全性を重視
- パフォーマンスを考慮した実装を提案

## 出力形式
- コードブロックには言語を明記
- 重要なポイントは箇条書きで説明
- 複雑な実装には段階的な説明を追加

## 制約
- 非推奨のAPI（getServerSideProps等）は使用しない
- any型の使用は避ける
- 外部ライブラリは最小限に
`;
```

## Claude 特有のテクニック

### XML タグの活用

```
<context>
プロジェクト: ECサイト
フレームワーク: Next.js 16
主要技術: TypeScript, Prisma, Tailwind
</context>

<task>
商品検索機能を実装してください。
</task>

<requirements>
- キーワード検索
- カテゴリフィルター
- 価格範囲フィルター
- ページネーション
</requirements>
```

### 思考の構造化

```
<instructions>
以下の順序で回答してください：

1. <analysis>問題の分析</analysis>
2. <approach>アプローチの検討</approach>
3. <solution>解決策の提示</solution>
4. <caveats>注意点・制限事項</caveats>
</instructions>
```

## AI SDK での活用

```typescript
import { generateText } from "ai";
import { anthropic } from "@ai-sdk/anthropic";

const systemPrompt = `あなたはコードレビューアシスタントです...`;

const result = await generateText({
  model: anthropic("claude-sonnet-4-20250514"),
  system: systemPrompt,
  prompt: userPrompt,
  temperature: 0.3, // 一貫性重視
});
```

## ベストプラクティス

1. **イテレーション**: プロンプトを継続的に改善
2. **テスト**: 様々な入力で動作確認
3. **バージョン管理**: プロンプトも Git で管理
4. **ドキュメント化**: なぜそのプロンプトにしたかを記録
5. **評価**: 出力品質を定量的に測定

## 参考リソース

- [Anthropic Prompt Engineering Guide](https://docs.anthropic.com/en/docs/build-with-claude/prompt-engineering)
- [OpenAI Prompt Engineering](https://platform.openai.com/docs/guides/prompt-engineering)
