# TypeScript 完全ガイド

## 📚 概要

TypeScript の基礎から応用まで、実践的なコード例とともに体系的に学べる完全ガイドです。型システムの理解から、実際のプロジェクトでの活用方法まで網羅しています。

## 🎯 学習目標

このガイドを完了すると、以下のスキルを習得できます:

- [ ] TypeScript の型システムを完全に理解し、活用できる
- [ ] ジェネリクスを使った再利用可能なコードを書ける
- [ ] 高度な型操作（Conditional Types、Mapped Types など）を使いこなせる
- [ ] 実際のプロジェクトで TypeScript を効果的に導入・活用できる
- [ ] 型安全性を保ちながら、生産性の高いコードを書ける

## 📖 目次

### Part 1: 基礎編

- [00 - Introduction](./00-Introduction.md) - TypeScript とは何か
- [01 - Getting Started](./01-Getting-Started.md) - 環境構築と基本セットアップ
- [02 - Basic Types](./02-Basic-Types.md) - 基本的な型
- [03 - Functions](./03-Functions.md) - 関数の型定義
- [04 - Objects and Interfaces](./04-Objects-and-Interfaces.md) - オブジェクトとインターフェース

### Part 2: 中級編

- [05 - Classes](./05-Classes.md) - クラスとオブジェクト指向
- [06 - Generics](./06-Generics.md) - ジェネリクス
- [07 - Type Aliases and Union Types](./07-Type-Aliases-and-Union-Types.md) - 型エイリアスとユニオン型
- [08 - Advanced Types](./08-Advanced-Types.md) - 高度な型（Intersection、Conditional など）

### Part 3: 応用編

- [09 - Type Manipulation](./09-Type-Manipulation.md) - 型操作（Mapped Types、Template Literal Types）
- [10 - Utility Types](./10-Utility-Types.md) - ユーティリティ型
- [11 - Decorators](./11-Decorators.md) - デコレータ
- [12 - Modules and Namespaces](./12-Modules-and-Namespaces.md) - モジュールと名前空間

### Part 4: 実践編

- [13 - Configuration](./13-Configuration.md) - tsconfig.json の設定
- [14 - Best Practices](./14-Best-Practices.md) - ベストプラクティス
- [15 - Real World Examples](./15-Real-World-Examples.md) - 実践例
- [16 - Migration Guide](./16-Migration-Guide.md) - JavaScript から TypeScript への移行

## 📋 前提知識

- JavaScript の基本的な知識（変数、関数、オブジェクト、配列など）
- ES6+ の構文（アロー関数、分割代入、スプレッド構文など）
- Node.js の基本的な使い方

## ⏱️ 推定学習時間

- **基礎編**: 8 時間
- **中級編**: 10 時間
- **応用編**: 12 時間
- **実践編**: 10 時間
- **合計**: 約 40 時間

## 🛠️ 必要な環境

```bash
# Node.js のインストール（v18以上推奨）
node --version

# TypeScript のインストール
npm install -g typescript

# バージョン確認
tsc --version

# プロジェクトでの使用
npm install --save-dev typescript
npx tsc --init
```

## 📝 学習の進め方

1. **順番に読む**: 章は順序立てて構成されています。基礎から順に進めてください。
2. **手を動かす**: コード例は必ず自分で試してみてください。
3. **演習問題を解く**: 各章の最後には実践課題があります。
4. **復習する**: 理解が浅いと感じた章は繰り返し読んでください。
5. **実践する**: 学んだ内容を自分のプロジェクトで使ってみましょう。

## 💡 効果的な学習方法

### コードを書く環境

```bash
# 練習用のディレクトリを作成
mkdir typescript-practice
cd typescript-practice
npm init -y
npm install --save-dev typescript @types/node

# tsconfig.json を生成
npx tsc --init

# コードを書いて実行
echo "const greeting: string = 'Hello TypeScript';" > index.ts
npx tsc
node index.js
```

### VS Code の設定

VS Code を使用すると、TypeScript の型チェックがリアルタイムで確認できます:

- TypeScript の拡張機能が組み込まれている
- 型エラーが即座に表示される
- インテリセンスで補完が効く

## 🔗 関連リンク

- [TypeScript 公式ドキュメント](https://www.typescriptlang.org/docs/)
- [TypeScript Playground](https://www.typescriptlang.org/play) - ブラウザで試せる
- [DefinitelyTyped](https://github.com/DefinitelyTyped/DefinitelyTyped) - 型定義ファイルのリポジトリ
- [TypeScript Deep Dive](https://basarat.gitbook.io/typescript/) - 詳細なガイド

## 📅 作成日

2025-12-07

## 📝 更新履歴

- 2025-12-07: 初版作成

---

**ステータス**: 🚧 作業中
