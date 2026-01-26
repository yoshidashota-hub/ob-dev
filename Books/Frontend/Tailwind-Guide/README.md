# Tailwind CSS Complete Guide

## 概要

Tailwind CSS はユーティリティファーストの CSS フレームワークです。事前定義されたクラスを組み合わせて、HTML から直接スタイリングを行います。

## 学習目標

このガイドを完了すると、以下のスキルを習得できます:

- [ ] Tailwind CSS の基本概念と設計思想を理解する
- [ ] ユーティリティクラスを使いこなす
- [ ] レスポンシブデザインの実装
- [ ] ダークモード対応
- [ ] カスタマイズと設定
- [ ] コンポーネントパターン
- [ ] パフォーマンス最適化

## 目次

### Part 1: 基礎編

- [00 - Introduction](./00-Introduction.md) - Tailwind CSS とは
- [01 - Setup](./01-Setup.md) - セットアップ
- [02 - Utility-First](./02-Utility-First.md) - ユーティリティファースト
- [03 - Core-Concepts](./03-Core-Concepts.md) - コアコンセプト

### Part 2: スタイリング編

- [04 - Layout](./04-Layout.md) - レイアウト（Flexbox, Grid）
- [05 - Spacing](./05-Spacing.md) - スペーシング（Margin, Padding）
- [06 - Typography](./06-Typography.md) - タイポグラフィ
- [07 - Colors](./07-Colors.md) - カラーシステム
- [08 - Backgrounds](./08-Backgrounds.md) - 背景とボーダー

### Part 3: レスポンシブ編

- [09 - Responsive](./09-Responsive.md) - レスポンシブデザイン
- [10 - Dark-Mode](./10-Dark-Mode.md) - ダークモード
- [11 - States](./11-States.md) - ホバー、フォーカス等の状態

### Part 4: カスタマイズ編

- [12 - Configuration](./12-Configuration.md) - tailwind.config.js
- [13 - Custom-Utilities](./13-Custom-Utilities.md) - カスタムユーティリティ
- [14 - Plugins](./14-Plugins.md) - プラグイン

### Part 5: 実践編

- [15 - Components](./15-Components.md) - コンポーネントパターン
- [16 - Best-Practices](./16-Best-Practices.md) - ベストプラクティス

## 前提知識

- HTML/CSS の基礎知識
- npm/yarn の基本操作

## 推定学習時間

- **基礎編**: 2 時間
- **スタイリング編**: 4 時間
- **レスポンシブ編**: 2 時間
- **カスタマイズ編**: 3 時間
- **実践編**: 3 時間
- **合計**: 約 14 時間

## 必要な環境

```bash
# Vite + React プロジェクト
npm create vite@latest my-app -- --template react-ts
cd my-app

# Tailwind CSS インストール
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p
```

## 関連リンク

- [Tailwind CSS 公式ドキュメント](https://tailwindcss.com/docs)
- [Tailwind UI](https://tailwindui.com)
- [Heroicons](https://heroicons.com)

## 作成日

2026-01-27

## 更新履歴

- 2026-01-27: 初版作成

---

**ステータス**: ✅ 完了
