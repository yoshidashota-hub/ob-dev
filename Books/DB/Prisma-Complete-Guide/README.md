# Prisma 完全ガイド

TypeScript 向け ORM Prisma を使ったデータベース開発を学ぶガイドです。

## 目次

1. [はじめに](./00-Introduction.md) - Prisma の概要
2. [スキーマ設計](./01-Schema.md) - データモデル定義
3. [マイグレーション](./02-Migrations.md) - スキーマ管理
4. [CRUD 操作](./03-CRUD.md) - 基本的なデータ操作
5. [リレーション](./04-Relations.md) - 関連データの操作
6. [クエリ最適化](./05-Query-Optimization.md) - パフォーマンス
7. [トランザクション](./06-Transactions.md) - データ整合性
8. [Raw Query](./07-Raw-Query.md) - 生 SQL
9. [Next.js 統合](./08-NextJS-Integration.md) - 実践パターン
10. [テスト](./09-Testing.md) - モック・テスト戦略
11. [本番運用](./10-Production.md) - Prisma Accelerate

## Prisma とは

Prisma は、TypeScript/Node.js 向けの次世代 ORM です。

### 主な特徴

- **型安全**: スキーマから自動生成される型
- **直感的な API**: 学習しやすいクエリ構文
- **マイグレーション**: スキーマ変更の追跡
- **Prisma Studio**: GUI でデータ確認

## 対象読者

- TypeScript でデータベースを扱いたい方
- SQL を直接書かずに安全にクエリしたい方
- Next.js アプリでデータ永続化したい方

## 関連リソース

- [Learning/Backend/Prisma.md](../../Learning/Backend/Prisma.md)
- [Books/Backend/NestJS-Complete-Guide](../Backend/NestJS-Complete-Guide) - NestJS との統合
