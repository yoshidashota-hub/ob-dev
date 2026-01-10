# Next.js 完全ガイド

## 📚 概要

Next.js の基礎から最新機能まで、実践的なアプリケーション開発を通じて体系的に学べる完全ガイドです。App Router、Server Components、Server Actions など、Next.js 15 の最新機能を網羅しています。

## 🎯 学習目標

このガイドを完了すると、以下のスキルを習得できます:

- [ ] Next.js の App Router を使った最新のアプリケーション開発ができる
- [ ] Server Components と Client Components を適切に使い分けられる
- [ ] Server Actions を使ったフォーム処理とデータ変更ができる
- [ ] 効果的なデータフェッチングとキャッシング戦略を実装できる
- [ ] パフォーマンスに優れた本番環境対応アプリケーションを構築できる

## 📖 目次

### Part 1: 基礎編

- [00 - Introduction](./00-Introduction.md) - Next.js とは何か
- [01 - Getting Started](./01-Getting-Started.md) - 環境構築とプロジェクト作成
- [02 - App Router Basics](./02-App-Router-Basics.md) - App Router の基本
- [03 - Routing](./03-Routing.md) - ルーティングとナビゲーション
- [04 - Layouts and Templates](./04-Layouts-and-Templates.md) - レイアウトとテンプレート

### Part 2: コンポーネント編

- [05 - Server Components](./05-Server-Components.md) - Server Components の理解
- [06 - Client Components](./06-Client-Components.md) - Client Components の使い方
- [07 - Composition Patterns](./07-Composition-Patterns.md) - コンポーネント構成パターン

### Part 3: データフェッチング編

- [08 - Data Fetching](./08-Data-Fetching.md) - データフェッチングの基本
- [09 - Caching](./09-Caching.md) - キャッシング戦略
- [10 - Streaming and Suspense](./10-Streaming-and-Suspense.md) - ストリーミングと Suspense
- [11 - Server Actions](./11-Server-Actions.md) - Server Actions によるデータ変更

### Part 4: 高度な機能編

- [12 - Metadata and SEO](./12-Metadata-and-SEO.md) - メタデータと SEO
- [13 - Image and Font Optimization](./13-Image-and-Font-Optimization.md) - 画像とフォントの最適化
- [14 - API Routes](./14-API-Routes.md) - API ルートの作成
- [15 - Middleware](./15-Middleware.md) - ミドルウェア

### Part 5: 実践編

- [16 - Authentication](./16-Authentication.md) - 認証の実装
- [17 - Database Integration](./17-Database-Integration.md) - データベース連携
- [18 - Deployment](./18-Deployment.md) - Vercel へのデプロイ
- [19 - Performance Optimization](./19-Performance-Optimization.md) - パフォーマンス最適化
- [20 - Best Practices](./20-Best-Practices.md) - ベストプラクティス

## 📋 前提知識

- React の基本的な知識（コンポーネント、Props、State、Hooks）
- JavaScript/TypeScript の基礎
- HTML と CSS の基本
- Node.js と npm の使い方

## ⏱️ 推定学習時間

- **基礎編**: 10 時間
- **コンポーネント編**: 8 時間
- **データフェッチング編**: 12 時間
- **高度な機能編**: 10 時間
- **実践編**: 15 時間
- **合計**: 約 55 時間

## 🛠️ 必要な環境

```bash
# Node.js のインストール（v18.17以上必須）
node --version

# Next.js プロジェクトの作成
npx create-next-app@latest my-app

# 開発サーバーの起動
cd my-app
npm run dev
```

## 📝 学習の進め方

1. **順番に読む**: App Router は Pages Router と大きく異なります。基礎から順に進めてください。
2. **コードを書く**: 各章のコード例を必ず自分で実装してみてください。
3. **実践プロジェクト**: 章ごとの演習問題に取り組んでください。
4. **公式ドキュメント**: 公式ドキュメントも併せて参照してください。
5. **デプロイする**: 作成したアプリを Vercel にデプロイして確認しましょう。

## 💡 このガイドの特徴

### Next.js 15 / App Router に特化

- **Pages Router は扱いません**: App Router（app ディレクトリ）のみに焦点を当てています
- **最新機能**: Server Actions、Partial Prerendering など最新機能をカバー
- **ベストプラクティス**: 公式推奨のパターンに準拠

### 実践的な内容

- **実際のアプリ開発**: 理論だけでなく、実装例が豊富
- **パフォーマンス重視**: 本番環境を意識した最適化手法
- **TypeScript**: すべてのコード例で TypeScript を使用

## 🔗 関連リンク

- [Next.js 公式ドキュメント](https://nextjs.org/docs)
- [Next.js Learn](https://nextjs.org/learn) - 公式チュートリアル
- [Vercel](https://vercel.com/) - デプロイプラットフォーム
- [React 公式ドキュメント](https://react.dev/)

## 📚 推奨環境

### エディタ

VS Code を推奨します:

- **Next.js 用拡張機能**: ES7+ React/Redux/React-Native snippets
- **Prettier**: コードフォーマッター
- **ESLint**: 静的解析ツール
- **Tailwind CSS IntelliSense**: CSS ユーティリティの補完

### ブラウザ

- Chrome または Edge（開発者ツールが充実）
- React Developer Tools 拡張機能

## 🎨 学習用プロジェクト例

このガイドでは、以下のようなアプリケーションを構築します:

### ブログアプリケーション

```
機能:
- 記事一覧表示（SSG）
- 記事詳細ページ（Dynamic Routes）
- マークダウンサポート
- メタデータとOGP
```

### タスク管理アプリ

```
機能:
- CRUD 操作（Server Actions）
- リアルタイム更新
- 認証機能
- データベース連携（Prisma + PostgreSQL）
```

### E コマースサイト

```
機能:
- 商品一覧・詳細
- ショッピングカート
- 画像最適化
- 検索機能
```

## 📅 作成日

2025-12-07

## 📝 更新履歴

- 2025-12-07: 初版作成（Next.js 15 対応）

## 🔄 バージョン情報

このガイドは以下のバージョンに対応しています:

- **Next.js**: 15.x
- **React**: 19.x
- **Node.js**: 18.17 以上

---

**ステータス**: 🚧 作業中
