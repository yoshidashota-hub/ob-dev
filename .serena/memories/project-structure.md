# ob-dev プロジェクト構造

## 概要

Obsidian Vault として管理される学習・開発用リポジトリ。Claude Code と連携して使用。

## 主要ディレクトリ

### 📥 +Inbox/

一時的なメモやアイデアを入れる場所

### 📚 Learning/

学習ノートの管理

- **In-Progress/**: 進行中の学習トピック
  - AI-Driven-Development.md
  - Claude.md
  - CleanArchitecture.md
  - DDD-CQRS.md
  - EventDrivenArchitecture.md
  - Hono.md
  - Microservices.md
  - NestJS.md
  - Next.js 16.md
  - OpenAPI.md
  - SDD.md
  - SystemDesign-Fundamentals.md
  - TanStack.md
  - Vercel.md
  - next-admin.md
- **Mastered/**: 習得済みのトピック

### 📖 Books/

体系的な学習ガイド集

- **\_template/**: Book 作成用テンプレート
- **Next.js-Complete-Guide/**: Next.js 完全ガイド
- **TypeScript-Complete-Guide/**: TypeScript 完全ガイド

### 🛠️ Projects/

実践プロジェクト

#### next16-sandbox/

Next.js 16 の機能を試すサンドボックス

- Server Actions, Streaming, Cache のデモ
- Route Groups, Parallel/Intercepting Routes
- API Routes, Middleware

#### advanced-memo-app/

高度なメモアプリプロジェクト

- Prisma による DB 管理
- 認証機能
- Vitest によるテスト

#### Knowledge/

プロジェクト内のナレッジベース

### 📅 Daily/

日次メモ（YYYY-MM-DD.md 形式）

### 🧠 Knowledge/

ナレッジベース

- **Examples/**: コード例集
  - Next.js 関連（middleware, error-handling, server-actions 等）
  - Vercel 関連（blob, kv, postgres, ai-sdk 等）
- **Concepts/**: 概念説明
- **HowTo/**: ハウツーガイド

### 📝 Templates/

ノートテンプレート

- HowTo.md
- 学習ノート.md
- デイリーノート.md
- 概念メモ.md
- プロジェクト.md

### 🎨 Excalidraw/

図解・ダイアグラム

### 📁 Index/

インデックス・ホームページ

## 設定ファイル

### .obsidian/

Obsidian 設定（プラグイン含む）

- obsidian-icon-folder
- obsidian-tasks-plugin
- calendar
- obsidian-git
- dataview
- obsidian-style-settings
- obsidian-excalidraw-plugin
- obsidian-kanban
- obsidian-memos
- templater-obsidian

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
- **フレームワーク**: Next.js 16
- **データベース**: Prisma
- **テスト**: Vitest
- **スタイリング**: Tailwind CSS
- **ノート管理**: Obsidian
