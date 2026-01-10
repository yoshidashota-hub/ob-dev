# Tailwind CSS Complete Guide

## 概要

Tailwind CSS は、ユーティリティファーストの CSS フレームワークです。事前定義されたクラスを組み合わせて、HTML 内で直接スタイリングを行います。

## 学習目標

このガイドを完了すると、以下のスキルを習得できます:

- [ ] Tailwind CSS の基本概念とユーティリティクラス
- [ ] レスポンシブデザインの実装
- [ ] ダークモード対応
- [ ] カスタムテーマの設定
- [ ] コンポーネントの抽出と再利用
- [ ] アニメーションとトランジション
- [ ] Tailwind CSS v4 の新機能

## 目次

### Part 1: 基礎編

- [00 - Introduction](./00-Introduction.md) - Tailwind CSS とは
- [01 - Getting-Started](./01-Getting-Started.md) - はじめかた
- [02 - Utility-Classes](./02-Utility-Classes.md) - ユーティリティクラス
- [03 - Responsive-Design](./03-Responsive-Design.md) - レスポンシブデザイン

### Part 2: レイアウト編

- [04 - Flexbox](./04-Flexbox.md) - Flexbox
- [05 - Grid](./05-Grid.md) - CSS Grid
- [06 - Spacing](./06-Spacing.md) - スペーシング
- [07 - Sizing](./07-Sizing.md) - サイジング

### Part 3: スタイリング編

- [08 - Colors](./08-Colors.md) - カラー
- [09 - Typography](./09-Typography.md) - タイポグラフィ
- [10 - Borders-Shadows](./10-Borders-Shadows.md) - ボーダーとシャドウ
- [11 - Backgrounds](./11-Backgrounds.md) - 背景

### Part 4: インタラクション編

- [12 - States](./12-States.md) - 状態（hover, focus, active）
- [13 - Dark-Mode](./13-Dark-Mode.md) - ダークモード
- [14 - Animations](./14-Animations.md) - アニメーション

### Part 5: カスタマイズ編

- [15 - Configuration](./15-Configuration.md) - 設定ファイル
- [16 - Custom-Theme](./16-Custom-Theme.md) - カスタムテーマ
- [17 - Plugins](./17-Plugins.md) - プラグイン

### Part 6: 実践編

- [18 - Component-Patterns](./18-Component-Patterns.md) - コンポーネントパターン
- [19 - Best-Practices](./19-Best-Practices.md) - ベストプラクティス

## 前提知識

- HTML の基礎知識
- CSS の基本的な理解
- Node.js と npm の基本的な使い方

## 推定学習時間

- **基礎編**: 2 時間
- **レイアウト編**: 3 時間
- **スタイリング編**: 3 時間
- **インタラクション編**: 2 時間
- **カスタマイズ編**: 3 時間
- **実践編**: 2 時間
- **合計**: 約 15 時間

## 必要な環境

```bash
# Vite + React + Tailwind CSS
npm create vite@latest my-app -- --template react-ts
cd my-app
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p
```

```javascript
// tailwind.config.js
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {},
  },
  plugins: [],
};
```

```css
/* src/index.css */
@tailwind base;
@tailwind components;
@tailwind utilities;
```

## 関連リンク

- [Tailwind CSS 公式ドキュメント](https://tailwindcss.com/)
- [Tailwind CSS GitHub](https://github.com/tailwindlabs/tailwindcss)
- [Tailwind UI](https://tailwindui.com/)
- [Headless UI](https://headlessui.com/)

## 作成日

2026-01-11

## 更新履歴

- 2026-01-11: 初版作成

---

**ステータス**: 🚧 作業中
