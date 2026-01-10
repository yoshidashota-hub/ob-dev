# 00 - Introduction

## React とは

React は Meta（旧 Facebook）が開発した、ユーザーインターフェース構築のための JavaScript ライブラリです。

### 主な特徴

1. **コンポーネントベース**: UI を再利用可能な部品（コンポーネント）として構築
2. **宣言的 UI**: 状態に基づいて UI を宣言的に記述
3. **仮想 DOM**: 効率的な DOM 更新による高パフォーマンス
4. **単方向データフロー**: 予測可能な状態管理

## なぜ React を学ぶのか

```
React のエコシステム
┌─────────────────────────────────────────────┐
│  React (UI ライブラリ)                       │
├─────────────────────────────────────────────┤
│  Next.js / Remix (フルスタックフレームワーク) │
│  React Native (モバイルアプリ)               │
│  Electron (デスクトップアプリ)               │
└─────────────────────────────────────────────┘
```

- **広い採用**: 世界中の多くの企業で使用
- **豊富なエコシステム**: 多数のライブラリとツール
- **活発なコミュニティ**: 継続的な開発とサポート
- **キャリア**: フロントエンド開発者として高い需要

## React の歴史

| 年   | 出来事                              |
| ---- | ----------------------------------- |
| 2013 | React 公開                          |
| 2015 | React Native 登場                   |
| 2016 | React 15 (関数コンポーネント強化)   |
| 2018 | React 16.8 (Hooks 導入)             |
| 2022 | React 18 (Concurrent 機能)          |
| 2024 | React 19 (Server Components 安定化) |

## このガイドで学ぶこと

### Part 1: 基礎編

- コンポーネントの作成方法
- JSX の書き方
- Props によるデータ受け渡し
- State による状態管理

### Part 2: Hooks 編

- useState, useEffect の使い方
- useReducer, useContext
- カスタムフックの作成

### Part 3: 状態管理編

- Context API
- 外部ライブラリ (Zustand, Jotai)

### Part 4: 応用編

- パフォーマンス最適化
- エラーハンドリング
- Suspense と Concurrent 機能
- テスト

### Part 5: 実践編

- 設計パターン
- ベストプラクティス

## 環境構築

### 推奨セットアップ

```bash
# Vite + React + TypeScript
npm create vite@latest my-react-app -- --template react-ts
cd my-react-app
npm install
npm run dev
```

### プロジェクト構成

```
my-react-app/
├── src/
│   ├── components/     # コンポーネント
│   ├── hooks/          # カスタムフック
│   ├── contexts/       # Context
│   ├── utils/          # ユーティリティ
│   ├── App.tsx         # ルートコンポーネント
│   └── main.tsx        # エントリーポイント
├── public/
├── package.json
├── tsconfig.json
└── vite.config.ts
```

## 最初のコンポーネント

```tsx
// src/App.tsx
function App() {
  return (
    <div>
      <h1>Hello, React!</h1>
      <p>最初の React アプリケーション</p>
    </div>
  );
}

export default App;
```

## まとめ

- React は UI 構築のための宣言的なライブラリ
- コンポーネントベースで再利用性が高い
- 豊富なエコシステムとコミュニティ
- このガイドで基礎から応用まで体系的に学習

## 次のステップ

➡️ 次へ: [01 - Components-JSX](./01-Components-JSX.md)
