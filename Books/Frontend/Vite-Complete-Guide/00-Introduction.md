# 00 - Introduction

## Vite とは

Vite（フランス語で「速い」の意）は、Evan You（Vue.js 作者）が開発した次世代フロントエンドビルドツールです。

### 従来のバンドラーとの違い

```text
従来のバンドラー (Webpack など)
┌────────────────────────────────────────┐
│  すべてのモジュールをバンドル           │
│  ↓                                     │
│  開発サーバー起動（時間がかかる）       │
└────────────────────────────────────────┘

Vite
┌────────────────────────────────────────┐
│  ネイティブ ESM を活用                  │
│  ↓                                     │
│  必要なモジュールのみオンデマンドで変換 │
│  ↓                                     │
│  即座に開発サーバー起動                 │
└────────────────────────────────────────┘
```

## Vite の主な特徴

### 1. 高速な開発サーバー

- **ネイティブ ESM**: ブラウザのネイティブ ES Modules を活用
- **オンデマンド変換**: 必要なファイルのみを変換
- **HMR (Hot Module Replacement)**: 即座にモジュールを更新

### 2. 最適化されたビルド

- **Rollup ベース**: 本番ビルドには Rollup を使用
- **コード分割**: 自動的なチャンク分割
- **Tree Shaking**: 未使用コードの除去

### 3. 豊富なフレームワークサポート

```bash
# React
npm create vite@latest my-app -- --template react-ts

# Vue
npm create vite@latest my-app -- --template vue-ts

# Svelte
npm create vite@latest my-app -- --template svelte-ts

# Solid
npm create vite@latest my-app -- --template solid-ts
```

## なぜ Vite を学ぶのか

| 特徴             | 従来のバンドラー | Vite        |
| ---------------- | ---------------- | ----------- |
| 開発サーバー起動 | 数十秒〜数分     | 数百ミリ秒  |
| HMR 速度         | 変更量に依存     | 常に高速    |
| 設定の複雑さ     | 高い             | 低い        |
| プラグイン       | 独自 API         | Rollup 互換 |

## Vite のアーキテクチャ

```text
開発時
┌─────────────────────────────────────────┐
│  ブラウザ                                │
│    ↓ ESM import                         │
│  Vite 開発サーバー                       │
│    ↓ オンデマンド変換                    │
│  ソースファイル (.ts, .jsx, .vue など)   │
└─────────────────────────────────────────┘

本番ビルド時
┌─────────────────────────────────────────┐
│  ソースファイル                          │
│    ↓ Rollup                             │
│  最適化されたバンドル                    │
│    ↓                                    │
│  静的ファイル (HTML, JS, CSS)           │
└─────────────────────────────────────────┘
```

## このガイドで学ぶこと

### Part 1: 基礎編

- Vite プロジェクトの作成
- 基本的な設定
- 開発サーバーの機能

### Part 2: 設定編

- vite.config.ts の詳細
- 環境変数の管理
- CSS とアセットの処理

### Part 3: プラグイン編

- プラグインシステムの理解
- 公式プラグインの活用
- カスタムプラグインの作成

### Part 4: 応用編

- ビルド最適化
- SSR の設定
- ライブラリモード

### Part 5: 実践編

- デプロイ戦略
- ベストプラクティス

## クイックスタート

```bash
# プロジェクト作成
npm create vite@latest my-vite-app -- --template react-ts

# ディレクトリ移動
cd my-vite-app

# 依存関係インストール
npm install

# 開発サーバー起動
npm run dev
```

### 生成されるファイル構成

```text
my-vite-app/
├── public/              # 静的ファイル
├── src/
│   ├── App.tsx          # メインコンポーネント
│   ├── main.tsx         # エントリーポイント
│   └── vite-env.d.ts    # 型定義
├── index.html           # HTML テンプレート
├── package.json
├── tsconfig.json
└── vite.config.ts       # Vite 設定
```

## まとめ

- Vite は高速な開発体験を提供するビルドツール
- ネイティブ ESM とオンデマンド変換で即座に起動
- Rollup ベースの本番ビルドで最適化
- 多くのフレームワークをサポート

## 次のステップ

➡️ 次へ: [01 - Getting-Started](./01-Getting-Started.md)
