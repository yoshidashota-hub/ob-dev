# Vercel AI SDK 完全ガイド

AI アプリケーション開発のための Vercel AI SDK を学ぶガイドです。

## 目次

1. [はじめに](./00-Introduction.md) - AI SDK の概要
2. [テキスト生成](./01-Text-Generation.md) - generateText
3. [ストリーミング](./02-Streaming.md) - streamText
4. [構造化出力](./03-Structured-Output.md) - generateObject
5. [ツール呼び出し](./04-Tools.md) - Function Calling
6. [マルチモーダル](./05-Multimodal.md) - 画像・音声
7. [React Hooks](./06-React-Hooks.md) - useChat, useCompletion
8. [RAG](./07-RAG.md) - 検索拡張生成
9. [エージェント](./08-Agents.md) - 自律型 AI
10. [プロンプト設計](./09-Prompting.md) - 効果的なプロンプト
11. [本番運用](./10-Production.md) - エラー処理・コスト管理

## AI SDK とは

Vercel が開発した、AI アプリケーション構築のための統合ライブラリ。

### 主な特徴

- **プロバイダー非依存**: OpenAI, Anthropic, Google 等を統一 API で使用
- **ストリーミング**: リアルタイムレスポンス
- **型安全**: TypeScript 完全サポート
- **React 統合**: 専用 Hooks

## 対象読者

- AI 機能を Web アプリに組み込みたい方
- ChatGPT のようなインターフェースを作りたい方
- RAG やエージェントを実装したい方

## 関連リソース

- [Learning/AI/AI-SDK.md](../../Learning/AI/AI-SDK.md)
- [Learning/AI/RAG.md](../../Learning/AI/RAG.md)
- [Learning/AI/Prompt-Engineering.md](../../Learning/AI/Prompt-Engineering.md)
