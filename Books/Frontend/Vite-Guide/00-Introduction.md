# 00 - Introduction（Vite とは）

## この章で学ぶこと

- Vite の概要と特徴
- 従来のバンドラーとの違い
- なぜ Vite は高速なのか
- Vite を選ぶ理由

## Vite とは

Vite（フランス語で「速い」）は、Evan You（Vue.js 作者）が開発した次世代のフロントエンドビルドツールです。

### 2 つのモード

1. **開発モード**: ES モジュールを直接ブラウザに配信
2. **本番モード**: Rollup でバンドル・最適化

## 従来のバンドラーとの違い

### 従来のバンドラー（webpack 等）

```
ソースコード → バンドル → 開発サーバー → ブラウザ

問題点:
- 起動が遅い（全ファイルをバンドル）
- HMR が遅い（依存関係を再構築）
- プロジェクトが大きくなると指数関数的に遅くなる
```

### Vite のアプローチ

```
ソースコード → 開発サーバー → ブラウザ（ES モジュール）

利点:
- 即座に起動
- 高速な HMR
- プロジェクトサイズに影響されない
```

## なぜ Vite は高速なのか

### 1. ネイティブ ES モジュール

```javascript
// ブラウザが直接 ES モジュールをインポート
import { createApp } from "vue"; // ブラウザがリクエスト
import App from "./App.vue"; // 必要な時に取得

// バンドル不要！
```

### 2. 依存関係の事前バンドル（esbuild）

```
node_modules の依存関係
       ↓
   esbuild で事前バンドル（超高速）
       ↓
   キャッシュして再利用
```

esbuild は Go で書かれており、JavaScript バンドラーより 10〜100 倍高速です。

### 3. オンデマンド変換

```
リクエストされたファイルのみ変換

/src/main.ts → リクエスト → 変換 → レスポンス
/src/App.vue → リクエストされるまで何もしない
```

## 機能一覧

### 開発時

- ⚡️ 即座のサーバー起動
- 🔥 高速な HMR（Hot Module Replacement）
- 📦 ネイティブ ES モジュール
- 🎨 CSS / PostCSS / CSS Modules サポート
- 📄 TypeScript サポート
- 🖼️ 静的アセットの最適化

### ビルド時

- 📦 Rollup によるバンドル
- 🗜️ 自動コード分割
- 📊 Tree-shaking
- 🔧 プラグインシステム
- 📱 レガシーブラウザ対応

## 対応フレームワーク

```bash
# Vanilla JavaScript/TypeScript
npm create vite@latest my-app -- --template vanilla-ts

# React
npm create vite@latest my-app -- --template react-ts

# Vue
npm create vite@latest my-app -- --template vue-ts

# Svelte
npm create vite@latest my-app -- --template svelte-ts

# Preact
npm create vite@latest my-app -- --template preact-ts

# Lit
npm create vite@latest my-app -- --template lit-ts

# Solid
npm create vite@latest my-app -- --template solid-ts

# Qwik
npm create vite@latest my-app -- --template qwik-ts
```

## webpack vs Vite

| 機能           | webpack             | Vite                  |
| -------------- | ------------------- | --------------------- |
| 起動速度       | 遅い（バンドル必要) | 即座                  |
| HMR            | 遅い                | 非常に高速            |
| 設定           | 複雑                | シンプル              |
| プラグイン     | 豊富                | 増加中                |
| 本番ビルド     | webpack             | Rollup                |
| Tree-shaking   | ○                   | ○（Rollup）           |
| コード分割     | ○                   | ○                     |
| レガシー対応   | ○                   | プラグインで対応      |
| エコシステム   | 成熟                | 成長中                |
| Node.js 互換性 | 高い                | ESM ベースで一部制限  |

## Vite を選ぶべきケース

### ✅ 推奨

- 新規プロジェクト
- モダンブラウザをターゲット
- 開発体験を重視
- React / Vue / Svelte などのモダンフレームワーク

### ⚠️ 検討が必要

- 既存の webpack プロジェクト（移行コスト）
- 特殊な webpack プラグインに依存
- IE11 対応が必須（@vitejs/plugin-legacy で対応可能）

## まとめ

- Vite は ES モジュールを活用した高速ビルドツール
- 開発時はバンドルなし、本番時は Rollup でビルド
- esbuild による高速な依存関係処理
- 設定がシンプルでモダンな開発体験

## 次の章へ

[01 - Getting-Started](./01-Getting-Started.md) では、Vite プロジェクトの作成方法を学びます。
