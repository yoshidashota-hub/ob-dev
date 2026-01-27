# Clean Architecture 実践ガイド

TypeScript/Next.js プロジェクトで Clean Architecture を実践するためのガイドです。

## 目次

1. [はじめに](./00-Introduction.md) - Clean Architecture の原則
2. [レイヤー構成](./01-Layers.md) - 各層の責務
3. [エンティティ](./02-Entities.md) - ドメインモデル
4. [ユースケース](./03-Use-Cases.md) - アプリケーションロジック
5. [インターフェース](./04-Interfaces.md) - 境界の定義
6. [依存性注入](./05-Dependency-Injection.md) - 依存関係の管理
7. [リポジトリパターン](./06-Repository.md) - データアクセス
8. [プレゼンター](./07-Presenter.md) - 出力の変換
9. [Next.js での実装](./08-NextJS-Implementation.md) - 実践例
10. [テスト戦略](./09-Testing.md) - 各層のテスト
11. [ベストプラクティス](./10-Best-Practices.md) - 実践的なパターン

## Clean Architecture とは

Robert C. Martin（Uncle Bob）が提唱したアーキテクチャパターン。

### 核心原則

1. **依存関係のルール**: 内側の層は外側の層を知らない
2. **関心の分離**: 各層は単一の責務を持つ
3. **テスト容易性**: ビジネスロジックを独立してテスト可能
4. **フレームワーク非依存**: ビジネスルールはフレームワークに依存しない

## 対象読者

- 大規模プロジェクトを設計したい方
- テスト可能なコードを書きたい方
- 保守性の高いアーキテクチャを学びたい方

## 関連リソース

- [Learning/Architecture/CleanArchitecture.md](../../Learning/Architecture/CleanArchitecture.md)
- [Learning/Architecture/DDD-CQRS.md](../../Learning/Architecture/DDD-CQRS.md)
