# 00 - Introduction

## 概要

この章では、TypeScript の基本的な概念と、なぜ TypeScript を学ぶべきかについて説明します。

## このガイドについて

### 対象読者

- JavaScript の基礎を理解している開発者
- 型安全なコードを書きたい開発者
- 大規模なプロジェクトでコードの品質を向上させたい開発者

### 前提知識

- JavaScript の基本（変数、関数、オブジェクト、配列）
- ES6+ の構文（const/let、アロー関数、分割代入など）
- Node.js と npm の基本的な使い方

### 学習目標

このガイドを完了すると、以下のことができるようになります:

- [ ] TypeScript の型システムを理解し、効果的に使える
- [ ] 型安全なコードを書いて、バグを事前に防げる
- [ ] ジェネリクスや高度な型を使った柔軟なコードが書ける
- [ ] 実際のプロジェクトに TypeScript を導入できる

## TypeScript とは

### 定義

TypeScript は、Microsoft が開発した **JavaScript のスーパーセット**です。JavaScript に静的型付けを追加した言語で、最終的には JavaScript にコンパイルされます。

```typescript
// TypeScript
function greet(name: string): string {
  return `Hello, ${name}!`;
}

// コンパイル後の JavaScript
function greet(name) {
  return `Hello, ${name}!`;
}
```

### 主要な特徴

#### 1. 静的型付け

変数や関数の型を宣言でき、コンパイル時に型チェックが行われます:

```typescript
let age: number = 25;
age = "twenty-five"; // ❌ エラー: Type 'string' is not assignable to type 'number'
```

#### 2. JavaScript との互換性

TypeScript は JavaScript のスーパーセットなので、すべての JavaScript コードは有効な TypeScript コードです:

```typescript
// 有効な JavaScript = 有効な TypeScript
const sum = (a, b) => a + b;
```

#### 3. 強力な IDE サポート

型情報により、VS Code などの IDE で優れた補完とエラー検出が可能です。

#### 4. 最新の JavaScript 機能

ES6+ の機能をサポートし、古いブラウザ向けにトランスパイルできます。

## なぜ TypeScript を学ぶのか

### 1. バグの早期発見

型チェックにより、実行前にエラーを検出できます:

```typescript
// ❌ JavaScript: 実行時にエラー
function divide(a, b) {
  return a / b;
}
divide(10, "2"); // 実行時に予期しない結果

// ✅ TypeScript: コンパイル時にエラー
function divide(a: number, b: number): number {
  return a / b;
}
divide(10, "2"); // コンパイルエラー
```

### 2. コードの可読性と保守性

型定義がドキュメントの役割を果たします:

```typescript
interface User {
  id: string;
  name: string;
  email: string;
  age?: number; // オプショナル
}

function createUser(data: User): User {
  // 引数と戻り値の型が明確
  return data;
}
```

### 3. リファクタリングの安全性

型システムにより、安全にコードを変更できます:

```typescript
// 関数のシグネチャを変更すると
function greet(firstName: string, lastName: string) {
  return `Hello, ${firstName} ${lastName}`;
}

// すべての呼び出し箇所でエラーが表示される
greet("John"); // ❌ エラー: Expected 2 arguments, but got 1
```

### 4. 大規模開発に適している

チームでの開発や大規模なプロジェクトで真価を発揮:

- 型による契約（インターフェース）
- 自動補完による開発速度向上
- コードレビューが容易

### 5. エコシステムの成熟

多くの人気ライブラリが TypeScript をサポート:

- React、Vue、Angular などのフレームワーク
- Express、NestJS などのバックエンド
- 豊富な型定義ファイル（@types/\*）

## TypeScript の使用例

### フロントエンド

```typescript
// React コンポーネント
interface Props {
  name: string;
  age: number;
}

const UserCard: React.FC<Props> = ({ name, age }) => {
  return (
    <div>
      <h2>{name}</h2>
      <p>Age: {age}</p>
    </div>
  );
};
```

### バックエンド

```typescript
// Express API
import express, { Request, Response } from "express";

interface CreateUserRequest {
  name: string;
  email: string;
}

app.post("/users", (req: Request<{}, {}, CreateUserRequest>, res: Response) => {
  const { name, email } = req.body;
  // 型安全な処理
});
```

### ライブラリ開発

```typescript
// 再利用可能なユーティリティ
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}
```

## TypeScript vs JavaScript

| 項目           | JavaScript | TypeScript   |
| -------------- | ---------- | ------------ |
| 型チェック     | 実行時     | コンパイル時 |
| 学習曲線       | 緩やか     | やや急       |
| エラー検出     | 実行時     | 開発時       |
| IDE サポート   | 限定的     | 強力         |
| ビルドステップ | 不要       | 必要         |
| コミュニティ   | 巨大       | 急成長中     |

## 学習ロードマップ

このガイドでは、以下の順序で学習を進めます:

```
基礎編
├── 環境構築
├── 基本的な型
├── 関数の型定義
└── オブジェクトとインターフェース

中級編
├── クラス
├── ジェネリクス
├── ユニオン型・交差型
└── 高度な型

応用編
├── 型操作
├── ユーティリティ型
├── デコレータ
└── モジュール

実践編
├── 設定ファイル
├── ベストプラクティス
├── 実践例
└── 移行ガイド
```

## よくある誤解

### ❌ 「TypeScript は JavaScript の代替」

TypeScript は JavaScript のスーパーセットであり、JavaScript を置き換えるものではありません。最終的には JavaScript にコンパイルされます。

### ❌ 「TypeScript は複雑すぎる」

基本的な型から始めれば、段階的に学習できます。すべての機能を最初から使う必要はありません。

### ❌ 「小さなプロジェクトには不要」

小規模なプロジェクトでも、型による補完やエラー検出のメリットがあります。

### ❌ 「JavaScript を完璧に知る必要がある」

JavaScript の基礎があれば始められます。TypeScript を学びながら JavaScript の理解も深まります。

## まとめ

- TypeScript は JavaScript に型を追加した言語
- コンパイル時の型チェックでバグを早期発見
- IDE サポートが強力で開発効率が向上
- 大規模開発やチーム開発に適している
- JavaScript の知識があれば学習を始められる

## 次のステップ

次の章では、TypeScript の環境構築と基本的な使い方について学びます。

➡️ 次へ: [01-Getting-Started.md](./01-Getting-Started.md)
