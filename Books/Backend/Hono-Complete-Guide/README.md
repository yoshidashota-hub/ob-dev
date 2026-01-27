# Hono 完全ガイド

軽量・高速な Web フレームワーク Hono を学ぶためのガイドです。

## 目次

1. [はじめに](./00-Introduction.md) - Hono の概要と特徴
2. [ルーティング](./01-Routing.md) - パス定義とパラメータ
3. [ミドルウェア](./02-Middleware.md) - 処理の共通化
4. [コンテキスト](./03-Context.md) - リクエスト/レスポンス操作
5. [バリデーション](./04-Validation.md) - Zod 統合
6. [エラーハンドリング](./05-Error-Handling.md) - 例外処理
7. [認証](./06-Authentication.md) - JWT と Bearer
8. [データベース](./07-Database.md) - Prisma / Drizzle 統合
9. [テスト](./08-Testing.md) - ユニットテスト
10. [デプロイ](./09-Deployment.md) - Cloudflare Workers / Vercel
11. [ベストプラクティス](./10-Best-Practices.md) - 実践パターン

## Hono の特徴

- **超軽量**: ゼロ依存、小さなバンドルサイズ
- **高速**: Web Standard API ベース
- **マルチランタイム**: Node.js, Deno, Bun, Edge で動作
- **TypeScript**: 完全な型サポート
- **モダン**: Middleware, Validation, OpenAPI 対応

## 対象読者

- TypeScript の基礎を理解している方
- 軽量な API サーバーを構築したい方
- Edge ランタイムでの開発に興味がある方

## 関連リソース

- [Hono 公式ドキュメント](https://hono.dev/)
- [Learning/Backend/Hono.md](../../Learning/Backend/Hono.md) - 学習ノート
