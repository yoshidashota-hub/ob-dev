# tRPC Complete Guide

## 概要

tRPC は、TypeScript で型安全な API を構築するためのフレームワークです。スキーマ定義なしでエンドツーエンドの型安全性を実現します。

## 学習目標

このガイドを完了すると、以下のスキルを習得できます:

- [ ] tRPC の基本概念と従来の REST/GraphQL との違いを理解する
- [ ] tRPC サーバーとクライアントのセットアップ
- [ ] プロシージャ（Query, Mutation, Subscription）の定義
- [ ] 入力バリデーション（Zod 連携）
- [ ] ミドルウェアとコンテキストの活用
- [ ] React Query との統合
- [ ] Next.js での tRPC 活用

## 目次

### Part 1: 基礎編

- [00 - Introduction](./00-Introduction.md) - tRPC とは
- [01 - Getting-Started](./01-Getting-Started.md) - はじめかた
- [02 - Router-Procedures](./02-Router-Procedures.md) - Router と Procedures
- [03 - Input-Validation](./03-Input-Validation.md) - 入力バリデーション

### Part 2: サーバー編

- [04 - Context](./04-Context.md) - コンテキスト
- [05 - Middleware](./05-Middleware.md) - ミドルウェア
- [06 - Error-Handling](./06-Error-Handling.md) - エラーハンドリング

### Part 3: クライアント編

- [07 - React-Client](./07-React-Client.md) - React クライアント
- [08 - React-Query](./08-React-Query.md) - React Query 統合
- [09 - Subscriptions](./09-Subscriptions.md) - リアルタイム通信

### Part 4: フレームワーク統合編

- [10 - NextJS-App-Router](./10-NextJS-App-Router.md) - Next.js App Router
- [11 - NextJS-Pages-Router](./11-NextJS-Pages-Router.md) - Next.js Pages Router
- [12 - Express-Fastify](./12-Express-Fastify.md) - Express / Fastify

### Part 5: 実践編

- [13 - Testing](./13-Testing.md) - テスト
- [14 - Best-Practices](./14-Best-Practices.md) - ベストプラクティス

## 前提知識

- TypeScript の基礎知識
- React の基本的な使い方
- REST API の概念理解

## 推定学習時間

- **基礎編**: 3 時間
- **サーバー編**: 3 時間
- **クライアント編**: 3 時間
- **フレームワーク統合編**: 3 時間
- **実践編**: 2 時間
- **合計**: 約 14 時間

## 必要な環境

```bash
# Next.js + tRPC プロジェクト
npx create-next-app@latest my-trpc-app --typescript
cd my-trpc-app

# tRPC と関連パッケージ
npm install @trpc/server @trpc/client @trpc/react-query @trpc/next
npm install @tanstack/react-query zod
```

## 関連リンク

- [tRPC 公式ドキュメント](https://trpc.io/)
- [tRPC GitHub](https://github.com/trpc/trpc)
- [create-t3-app](https://create.t3.gg/)

## 作成日

2026-01-11

## 更新履歴

- 2026-01-11: 初版作成

---

**ステータス**: 🚧 作業中
