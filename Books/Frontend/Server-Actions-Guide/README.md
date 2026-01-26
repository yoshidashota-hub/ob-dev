# Server Actions Complete Guide

## 概要

Server Actions は Next.js の機能で、サーバー上で実行される非同期関数をクライアントから直接呼び出すことができます。フォーム送信やデータ変更を簡潔に実装できます。

## 学習目標

このガイドを完了すると、以下のスキルを習得できます:

- [ ] Server Actions の基本概念と仕組みを理解する
- [ ] フォームでの Server Actions の活用
- [ ] useActionState / useFormStatus の使い方
- [ ] 楽観的更新（Optimistic Updates）の実装
- [ ] バリデーションとエラーハンドリング
- [ ] revalidatePath / revalidateTag によるキャッシュ制御
- [ ] セキュリティのベストプラクティス

## 目次

### Part 1: 基礎編

- [00 - Introduction](./00-Introduction.md) - Server Actions とは
- [01 - Basic-Usage](./01-Basic-Usage.md) - 基本的な使い方
- [02 - Form-Integration](./02-Form-Integration.md) - フォームとの統合
- [03 - Client-Invocation](./03-Client-Invocation.md) - クライアントからの呼び出し

### Part 2: 状態管理編

- [04 - useActionState](./04-useActionState.md) - useActionState フック
- [05 - useFormStatus](./05-useFormStatus.md) - useFormStatus フック
- [06 - Optimistic-Updates](./06-Optimistic-Updates.md) - 楽観的更新

### Part 3: バリデーション編

- [07 - Input-Validation](./07-Input-Validation.md) - 入力バリデーション
- [08 - Zod-Integration](./08-Zod-Integration.md) - Zod との統合
- [09 - Error-Handling](./09-Error-Handling.md) - エラーハンドリング

### Part 4: キャッシュ編

- [10 - Revalidation](./10-Revalidation.md) - revalidatePath / revalidateTag
- [11 - Cache-Strategies](./11-Cache-Strategies.md) - キャッシュ戦略

### Part 5: 実践編

- [12 - Security](./12-Security.md) - セキュリティ
- [13 - Patterns](./13-Patterns.md) - 実践パターン
- [14 - Best-Practices](./14-Best-Practices.md) - ベストプラクティス

## 前提知識

- React の基礎知識
- Next.js App Router の基本
- TypeScript の基礎

## 推定学習時間

- **基礎編**: 2 時間
- **状態管理編**: 3 時間
- **バリデーション編**: 2 時間
- **キャッシュ編**: 2 時間
- **実践編**: 3 時間
- **合計**: 約 12 時間

## 必要な環境

```bash
# Next.js 14+ プロジェクト
npx create-next-app@latest my-app --typescript
cd my-app

# バリデーション用（オプション）
npm install zod
```

## 関連リンク

- [Next.js Server Actions ドキュメント](https://nextjs.org/docs/app/building-your-application/data-fetching/server-actions-and-mutations)
- [React Server Actions RFC](https://github.com/reactjs/rfcs/blob/main/text/0227-server-actions.md)

## 作成日

2026-01-11

## 更新履歴

- 2026-01-11: 初版作成
- 2026-01-27: 全章完成

---

**ステータス**: ✅ 完了
