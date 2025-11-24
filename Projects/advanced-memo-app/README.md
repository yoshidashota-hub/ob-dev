# Advanced Memo App

AI駆動開発 × 仕様駆動開発で構築する高品質なメモアプリケーション

## 🎯 プロジェクト概要

このプロジェクトは、`ob-dev/Learning/In-Progress` の学習内容を統合し、実践的に学ぶための実装プロジェクトです。

### 技術スタック

- **Frontend**: Next.js 16 (App Router), React 19, TypeScript
- **Styling**: Tailwind CSS
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: JWT with bcryptjs
- **Validation**: Zod
- **Testing**: Vitest, Testing Library
- **Development**: AI駆動開発 (Claude Code, GitHub Copilot)
- **Methodology**: SDD (仕様駆動開発)

## 🚀 セットアップ

### 前提条件

- Node.js 18以上
- PostgreSQL (ローカルまたはVercel Postgres)
- npm または yarn

### インストール

```bash
# 依存関係のインストール
npm install

# 環境変数の設定
cp .env.example .env
# .envファイルを編集してDATABASE_URLなどを設定

# Prismaのセットアップ
npx prisma generate
npx prisma db push

# 開発サーバーの起動
npm run dev
```

アプリケーションは <http://localhost:3000> で起動します。

## 📁 プロジェクト構造

```
advanced-memo-app/
├── app/                    # Next.js App Router
│   ├── (auth)/            # 認証関連ページ
│   ├── (dashboard)/       # ダッシュボード
│   ├── api/               # API Routes
│   ├── layout.tsx         # ルートレイアウト
│   └── page.tsx           # ホームページ
├── lib/                   # ユーティリティ
│   ├── prisma.ts         # Prismaクライアント
│   └── schemas/          # Zodスキーマ
├── prisma/               # Prismaスキーマ
│   └── schema.prisma
├── specs/                # 仕様ドキュメント (SDD)
│   └── features/         # Gherkin仕様
├── tests/                # テスト
│   ├── unit/            # ユニットテスト
│   ├── integration/     # 統合テスト
│   └── e2e/             # E2Eテスト
└── public/              # 静的ファイル
```

## 🧪 テスト

```bash
# ユニットテストの実行
npm test

# テストUIの起動
npm run test:ui

# カバレッジレポート
npm run test:coverage
```

## 📝 開発フロー (SDD)

このプロジェクトは仕様駆動開発 (SDD) に従っています:

1. **仕様作成**: `specs/features/` にGherkin形式で仕様を記述
2. **テスト作成**: 仕様を実行可能なテストとして実装
3. **実装**: テストが通るようにコードを実装
4. **リファクタリング**: 仕様を維持しながらコードを改善

### 例: 新機能の追加

```bash
# 1. 仕様を作成
touch specs/features/new-feature.feature

# 2. テストを作成
touch tests/unit/new-feature.spec.ts

# 3. 実装
# app/ または lib/ にコードを追加

# 4. テスト実行
npm test
```

## 🗄️ データベース

### マイグレーション

```bash
# マイグレーションの作成
npx prisma migrate dev --name feature_name

# マイグレーションの適用
npx prisma migrate deploy

# Prisma Studioの起動
npm run db:studio
```

## 🌐 デプロイ (Vercel)

```bash
# Vercel CLIのインストール
npm i -g vercel

# プロジェクトのリンク
vercel link

# 環境変数の設定
vercel env add DATABASE_URL
vercel env add JWT_SECRET

# デプロイ
vercel --prod
```

## 📖 学習内容の統合

このプロジェクトでは以下の学習トピックを実践しています:

- ✅ **Next.js 16**: App Router, Server Actions, Streaming
- ✅ **AI駆動開発**: Claude Code, GitHub Copilotを活用
- ✅ **SDD**: 仕様駆動開発で品質を担保
- ✅ **Clean Architecture**: レイヤー分離、依存性の逆転
- ✅ **DDD/CQRS**: ドメイン駆動設計 (Phase 2で実装予定)
- ✅ **Event-Driven**: イベント駆動アーキテクチャ (Phase 3で実装予定)

## 📋 実装計画

詳細な実装計画は `../IMPLEMENTATION-PLAN.md` を参照してください。

### Phase 1: MVP (2週間) - **現在進行中**
- ✅ プロジェクトセットアップ
- ✅ Prismaスキーマ設計
- ⏳ 認証機能実装
- ⏳ メモCRUD機能実装
- ⏳ タグ・検索機能実装

### Phase 2: アーキテクチャ改善 (2週間)
- Clean Architecture適用
- DDD/CQRS実装

### Phase 3: スケーラビリティ (2週間)
- Event-Driven Architecture
- パフォーマンス最適化

### Phase 4: 代替実装 (2週間)
- NestJS版
- Hono版

## 🤝 コントリビューション

このプロジェクトは個人の学習プロジェクトですが、フィードバックやアイデアは大歓迎です！

## 📄 ライセンス

MIT

## 📚 参考資料

- [Next.js ドキュメント](https://nextjs.org/docs)
- [Prisma ドキュメント](https://www.prisma.io/docs)
- [実装計画](../IMPLEMENTATION-PLAN.md)
- [学習ノート](../../Learning/In-Progress/)

---

**作成日**: 2025-11-23
**ステータス**: Phase 1 進行中
