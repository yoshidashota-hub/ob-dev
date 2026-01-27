# ob-dev プロジェクト構造

## 概要

Obsidian Vault として管理される学習・開発用リポジトリ。Claude Code と連携して使用。

## 主要ディレクトリ

### 📚 Learning/

学習ノートの管理（カテゴリ別）

- **Frontend/**: Next.js 16, TanStack, next-admin, Interview-Frontend
- **Backend/**: NestJS, Hono, OpenAPI, SDD, GraphQL, Prisma, Testing, Security
- **Architecture/**: CleanArchitecture, DDD-CQRS, EventDrivenArchitecture, Microservices, SystemDesign-Fundamentals, API-Design, Caching, Observability
- **DevOps/**: Vercel, Docker, CI-CD, Kubernetes, Terraform
- **AI/**: Claude, AI-Driven-Development, Prompt-Engineering, AI-SDK, RAG, MCP

### 📖 Books/

体系的な学習ガイド集

- **_template/**: Book 作成用テンプレート
- **Frontend/**: 
  - Next.js-Complete-Guide
  - TypeScript-Complete-Guide
  - React-Complete-Guide
  - Tailwind-Guide, Vite-Guide
  - tRPC-Complete-Guide
  - Server-Actions-Guide
- **Backend/**: 
  - NestJS-Complete-Guide
  - Hono-Complete-Guide
- **Architecture/**: 
  - Clean-Architecture-Guide
- **DevOps/**: 
  - Docker-Complete-Guide
- **AI/**: 
  - AI-SDK-Complete-Guide
- **DB/**: 
  - Prisma-Complete-Guide

### 🛠️ Projects/

実践プロジェクト（カテゴリ別）

- **Frontend/**: next16-sandbox, advanced-memo-app
- **Backend/**: (nestjs-notes, hono-notes 等を追加予定)
- **Architecture/**: (アーキテクチャ実践プロジェクト)
- **DevOps/**: (インフラ設定プロジェクト)
- **AI/**: (AI 機能実装プロジェクト)

### 🧠 Knowledge/

ナレッジベース（サンプル集）

- **Frontend/**: middleware, error-handling, server-actions, streaming-suspense 等
- **Backend/**: nestjs-examples, hono-examples, prisma-examples
- **Architecture/**: clean-architecture-examples, ddd-examples
- **DevOps/**: vercel-blob, vercel-kv, vercel-postgres 等
- **AI/**: vercel-ai-sdk-examples, ai-sdk-advanced-examples

### 📝 Templates/

ノートテンプレート

- HowTo.md
- 学習ノート.md
- デイリーノート.md
- 概念メモ.md
- プロジェクト.md

## 設定ファイル

### .obsidian/

Obsidian 設定（プラグイン含む）

### .serena/

Serena MCP 設定

### .claude/

Claude Code 設定

### その他

- CLAUDE.md: Claude Code セットアップガイド
- .mcp.json: MCP 設定
- README.md: リポジトリ説明

## 技術スタック

- **言語**: TypeScript, Markdown
- **フレームワーク**: Next.js 16, NestJS, Hono
- **データベース**: Prisma, PostgreSQL
- **テスト**: Vitest, Playwright
- **スタイリング**: Tailwind CSS
- **AI**: Vercel AI SDK, Claude API
- **DevOps**: Docker, GitHub Actions, Vercel
- **ノート管理**: Obsidian
