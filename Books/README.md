# 📚 Books - 学習ガイド集

Learning ディレクトリでの学習を体系的にまとめた、本のような構造化されたガイド集です。

## 🎯 Books の目的

### Learning との違い

| ディレクトリ  | 目的             | 構造       | 更新頻度 |
| ------------- | ---------------- | ---------- | -------- |
| **Learning/** | 学習ノート、メモ | 自由形式   | 頻繁     |
| **Books/**    | 体系的なガイド   | 章立て構造 | 低頻度   |

**Learning** は日々の学習メモや進行中の調査を記録する場所です。
**Books** は Learning で得た知識を整理し、他者（または未来の自分）が体系的に学べるようまとめた場所です。

## 📖 利用可能な Books

### 完成済み

現在、完成済みの Book はありません。

### 作業中

#### [TypeScript 完全ガイド](./TypeScript-Complete-Guide/README.md)

TypeScript の基礎から応用まで、実践的なコード例とともに体系的に学べるガイドです。

- **推定学習時間**: 約 40 時間
- **ステータス**: 🚧 作業中
- **トピック**: 型システム、ジェネリクス、高度な型操作、実践的な使い方

#### [Next.js 完全ガイド](./Next.js-Complete-Guide/README.md)

Next.js 15 の App Router を使った最新のフルスタック開発ガイドです。

- **推定学習時間**: 約 55 時間
- **ステータス**: 🚧 作業中
- **トピック**: App Router、Server Components、Server Actions、データフェッチング、デプロイ

## 🚀 新しい Book の作成方法

### クイックスタート

```bash
# Books ディレクトリに移動
cd Books

# 新しい Book のディレクトリを作成
mkdir Your-Topic-Name
cd Your-Topic-Name

# テンプレートからファイルをコピー
cp ../_template/00-Introduction.md .
cp ../_template/README.md .

# README を編集して目次を作成
# 各章のファイルを作成
```

### 詳細なガイド

新しい Book を作成する際の詳細な手順は、以下を参照してください:

➡️ [Book 作成ガイド](./_template/GUIDE.md)

## 📐 Book の構造

各 Book は以下の構造を持ちます:

```
Book-Name/
├── README.md              # Book の概要と目次
├── 00-Introduction.md     # イントロダクション（必須）
├── 01-Basics.md          # 基本概念
├── 02-Advanced.md        # 応用
└── ...                   # その他の章
```

### ファイル命名規則

- **章のファイル**: `[番号]-[タイトル].md`
  - 例: `01-Getting-Started.md`, `02-Core-Concepts.md`
- **番号**: 2 桁のゼロパディング（00, 01, 02, ...）
- **タイトル**: ケバブケース（単語を `-` で連結）

## 🎨 Book の典型的な構成

### パターン 1: 基礎から応用

技術やフレームワークの学習に適した構成:

```
00-Introduction.md          # イントロダクション
01-Getting-Started.md       # 環境構築と基本
02-Core-Concepts.md         # コア概念
03-Advanced-Topics.md       # 応用トピック
04-Best-Practices.md        # ベストプラクティス
05-Real-World-Examples.md   # 実践例
```

### パターン 2: トピック別

複数の独立したトピックを扱う場合:

```
00-Introduction.md
01-Topic-A.md
02-Topic-B.md
03-Topic-C.md
04-Integration.md
```

### パターン 3: プロジェクトベース

実際のプロジェクトを通じて学ぶ構成:

```
00-Introduction.md
01-Project-Setup.md
02-Feature-Implementation.md
03-Testing.md
04-Deployment.md
05-Optimization.md
```

## ✍️ Book を書く際のベストプラクティス

### 内容について

1. **段階的な学習曲線**

   - 簡単な概念から徐々に難易度を上げる
   - 各章で前の章の知識を前提とする

2. **実践的な内容**

   - 理論だけでなく、動作するコード例を含める
   - 実際のユースケースを示す

3. **明確な学習目標**

   - 各章の冒頭で学習目標を明示
   - 章の最後でまとめと次のステップを提示

4. **チェックポイント**
   - 理解度を確認できる課題や演習を含める
   - 重要な概念はチェックリスト形式で復習

### フォーマットについて

1. **一貫性のある構造**

   - すべての章で同じフォーマットを使用
   - 見出しレベルを統一

2. **ナビゲーション**

   - 各章の最後に前後の章へのリンクを配置
   - README の目次から各章にリンク

3. **コードブロック**

   - 言語を指定してシンタックスハイライトを有効化
   - 良い例と悪い例を対比して示す

4. **視覚的な要素**
   - 必要に応じて図や表を使用
   - 重要なポイントは絵文字や記号で強調

## 📊 Book のステータス管理

各 Book の README には現在のステータスを明記してください:

- 🚧 **作業中**: まだ執筆中
- 📝 **レビュー中**: 内容のレビュー待ち
- ✅ **完了**: 学習可能な状態
- 🔄 **更新中**: 既存の内容を更新中
- 🗄️ **アーカイブ**: 古い情報のため非推奨

## 🔄 Learning から Books への移行フロー

Learning で学習した内容を Books にまとめる際のフロー:

```
Learning/In-Progress/
    └── Topic.md              # 学習ノート（雑多な情報）
           ↓
    [学習完了・知識が体系化]
           ↓
Learning/Completed/
    └── Topic.md              # 完了した学習ノート
           ↓
    [他者にも役立つ形式に整理]
           ↓
Books/Topic-Name/
    ├── README.md             # 体系的なガイド
    ├── 00-Introduction.md
    ├── 01-Basics.md
    └── ...
```

## 🎯 いつ Book を作成すべきか

以下の条件を満たす場合、Book の作成を検討してください:

- [ ] Learning で十分な知識を蓄積した
- [ ] その技術を体系的に説明できる
- [ ] 他者（または未来の自分）に教えたい内容がある
- [ ] 複数の章に分けられるほどの情報量がある
- [ ] 長期的に参照したい内容である

## 📝 Book 作成のワークフロー例

### ステップ 1: 企画

```markdown
# 何について書くか決める

- トピック: Next.js 15
- 対象読者: Next.js 初心者〜中級者
- 推定ページ数: 10 章
- 推定学習時間: 20 時間
```

### ステップ 2: 構成を決める

```markdown
# 章立てを考える

0.  Introduction
1.  Getting Started
2.  Routing
3.  Data Fetching
4.  Server Components
5.  API Routes
6.  Authentication
7.  Database Integration
8.  Deployment
9.  Best Practices
```

### ステップ 3: 執筆

```bash
# ディレクトリとファイルを作成
mkdir Books/Next.js-15-Complete-Guide
cd Books/Next.js-15-Complete-Guide

# 各章を執筆
# - 00-Introduction.md から順番に
# - 1章ずつ完成させる
```

### ステップ 4: レビュー

```markdown
# チェック項目

- [ ] すべての章が論理的につながっているか
- [ ] コード例は動作するか
- [ ] 誤字脱字はないか
- [ ] ナビゲーションリンクは正しいか
- [ ] 学習目標は達成可能か
```

### ステップ 5: 公開

```bash
# このREADMEの「利用可能なBooks」セクションに追加
# Git にコミット
git add Books/Next.js-15-Complete-Guide
git commit -m "Add Next.js 15 Complete Guide"
```

## 🛠️ 便利なツール

### Obsidian での執筆

このリポジトリは Obsidian Vault として管理されています:

- **内部リンク**: `[[ファイル名]]` で他の章にリンク
- **プレビュー**: ライブプレビューで執筆しながら確認
- **グラフビュー**: 章間の関連性を視覚化

### Claude Code での支援

Claude Code を使って Book 作成を効率化:

```bash
# 新しい章の構造を生成
"Books/Topic-Name/03-Advanced.md に標準的な章の構造を作成して"

# コード例の追加
"この章に TypeScript の型システムの例を追加して"

# レビュー
"この Book の構成をレビューして、改善点を提案して"
```

## 📚 推奨 Book トピック

以下のトピックは Book として整理する価値があります:

### フレームワーク・ライブラリ

- [ ] Next.js Complete Guide
- [ ] TypeScript Handbook
- [ ] React Patterns
- [ ] Node.js Best Practices

### 開発手法・ツール

- [ ] Git Workflow Guide
- [ ] Testing Strategies
- [ ] CI/CD Implementation
- [ ] Docker for Developers

### アーキテクチャ・設計

- [ ] Clean Architecture
- [ ] Design Patterns
- [ ] Microservices Guide
- [ ] API Design Principles

### クラウド・インフラ

- [ ] AWS Essentials
- [ ] Vercel Deployment Guide
- [ ] Database Design
- [ ] Performance Optimization

## 🔗 参考リンク

- [Markdown ガイド](https://www.markdownguide.org/)
- [Obsidian ドキュメント](https://help.obsidian.md/)
- [GitHub Flavored Markdown](https://github.github.com/gfm/)

## 📞 サポート

Books の作成や構成について質問がある場合:

1. [\_template/GUIDE.md](./_template/GUIDE.md) を確認
2. 既存の Book（作成後）を参考にする
3. Claude Code に質問する

---

**最終更新**: 2025-12-07
**メンテナンス**: 新しい Book を追加したら、このファイルの「利用可能な Books」セクションを更新してください
