# Vite Complete Guide

## 概要

Vite は次世代のフロントエンドビルドツールです。ES モジュールを活用した高速な開発サーバーと、Rollup ベースの最適化されたプロダクションビルドを提供します。

## 学習目標

このガイドを完了すると、以下のスキルを習得できます:

- [ ] Vite の仕組みと高速な理由を理解する
- [ ] 各種フレームワークでのセットアップ
- [ ] 設定ファイルのカスタマイズ
- [ ] 環境変数の管理
- [ ] プラグインの活用
- [ ] ビルドの最適化
- [ ] 本番デプロイの準備

## 目次

### Part 1: 基礎編

- [00 - Introduction](./00-Introduction.md) - Vite とは
- [01 - Getting-Started](./01-Getting-Started.md) - はじめかた
- [02 - Project-Structure](./02-Project-Structure.md) - プロジェクト構成
- [03 - Dev-Server](./03-Dev-Server.md) - 開発サーバー

### Part 2: 設定編

- [04 - Configuration](./04-Configuration.md) - vite.config.ts
- [05 - Environment-Variables](./05-Environment-Variables.md) - 環境変数
- [06 - Assets](./06-Assets.md) - 静的アセット

### Part 3: ビルド編

- [07 - Build](./07-Build.md) - プロダクションビルド
- [08 - Optimization](./08-Optimization.md) - 最適化
- [09 - Code-Splitting](./09-Code-Splitting.md) - コード分割

### Part 4: 拡張編

- [10 - Plugins](./10-Plugins.md) - プラグイン
- [11 - TypeScript](./11-TypeScript.md) - TypeScript 統合
- [12 - CSS](./12-CSS.md) - CSS とプリプロセッサ

### Part 5: 実践編

- [13 - Testing](./13-Testing.md) - テスト（Vitest）
- [14 - Deployment](./14-Deployment.md) - デプロイ
- [15 - Best-Practices](./15-Best-Practices.md) - ベストプラクティス

## 前提知識

- JavaScript/TypeScript の基礎
- npm/yarn の基本操作
- ES モジュールの理解

## 推定学習時間

- **基礎編**: 2 時間
- **設定編**: 2 時間
- **ビルド編**: 3 時間
- **拡張編**: 3 時間
- **実践編**: 2 時間
- **合計**: 約 12 時間

## 必要な環境

```bash
# Node.js 18+ 推奨
node -v

# プロジェクト作成
npm create vite@latest my-app
cd my-app
npm install
npm run dev
```

## 関連リンク

- [Vite 公式ドキュメント](https://vitejs.dev)
- [Vite GitHub](https://github.com/vitejs/vite)
- [Awesome Vite](https://github.com/vitejs/awesome-vite)

## 作成日

2026-01-27

## 更新履歴

- 2026-01-27: 初版作成

---

**ステータス**: ✅ 完了
