# React Complete Guide

## 概要

React の基礎から応用まで、モダンな React 開発に必要な知識を体系的に学ぶガイドです。

## 学習目標

このガイドを完了すると、以下のスキルを習得できます:

- [ ] React の基本概念（コンポーネント、JSX、Props、State）を理解する
- [ ] Hooks を使った状態管理とライフサイクル制御
- [ ] カスタムフックの作成とロジックの再利用
- [ ] Context API によるグローバル状態管理
- [ ] パフォーマンス最適化（memo, useMemo, useCallback）
- [ ] エラーバウンダリとサスペンスの活用
- [ ] テスト駆動開発（React Testing Library）

## 目次

### Part 1: 基礎編

- [00 - Introduction](./00-Introduction.md) - React とは
- [01 - Components-JSX](./01-Components-JSX.md) - コンポーネントと JSX
- [02 - Props-State](./02-Props-State.md) - Props と State
- [03 - Event-Handling](./03-Event-Handling.md) - イベント処理

### Part 2: Hooks 編

- [04 - Basic-Hooks](./04-Basic-Hooks.md) - 基本的な Hooks (useState, useEffect)
- [05 - Advanced-Hooks](./05-Advanced-Hooks.md) - 高度な Hooks (useReducer, useContext)
- [06 - Custom-Hooks](./06-Custom-Hooks.md) - カスタムフック

### Part 3: 状態管理編

- [07 - Context-API](./07-Context-API.md) - Context API
- [08 - State-Libraries](./08-State-Libraries.md) - 状態管理ライブラリ (Zustand, Jotai)

### Part 4: 応用編

- [09 - Performance](./09-Performance.md) - パフォーマンス最適化
- [10 - Error-Boundaries](./10-Error-Boundaries.md) - エラーハンドリング
- [11 - Suspense-Concurrent](./11-Suspense-Concurrent.md) - Suspense と Concurrent 機能
- [12 - Testing](./12-Testing.md) - テスト

### Part 5: 実践編

- [13 - Patterns](./13-Patterns.md) - 設計パターン
- [14 - Best-Practices](./14-Best-Practices.md) - ベストプラクティス

## 前提知識

- JavaScript (ES6+) の基本知識
- HTML/CSS の基礎
- Node.js と npm の基本的な使い方

## 推定学習時間

- **基礎編**: 4 時間
- **Hooks 編**: 4 時間
- **状態管理編**: 3 時間
- **応用編**: 5 時間
- **実践編**: 4 時間
- **合計**: 約 20 時間

## 必要な環境

```bash
# Node.js 18+ 推奨
node -v

# Vite で React プロジェクトを作成
npm create vite@latest my-react-app -- --template react-ts
cd my-react-app
npm install
npm run dev
```

## 学習の進め方

1. **順番に読む**: 章は順序立てて構成されています
2. **手を動かす**: コード例は必ず自分で試してみる
3. **プロジェクトを作る**: 各章の最後には実践課題があります
4. **復習する**: 理解が浅いと感じた章は繰り返し読む

## 関連リンク

- [React 公式ドキュメント](https://react.dev/)
- [React GitHub](https://github.com/facebook/react)
- [React TypeScript Cheatsheet](https://react-typescript-cheatsheet.netlify.app/)

## 作成日

2026-01-11

## 更新履歴

- 2026-01-11: 初版作成

---

**ステータス**: 🚧 作業中
