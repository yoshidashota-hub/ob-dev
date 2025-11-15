# Claude Code セットアップガイド

このドキュメントは、ob-dev リポジトリで Claude Code を使用するための初期設定ガイドです。

## 📁 リポジトリ構成

```
ob-dev/
├── .obsidian/           # Obsidian設定（.gitignoreで管理）
├── Learning/            # 学習ノート
│   ├── In-Progress/     # 進行中の学習
│   │   ├── Vercel.md    # Vercel完全ガイド
│   │   └── Claude.md    # Claude完全ガイド
│   └── Completed/       # 完了した学習
├── Projects/            # 実践プロジェクト
│   └── next16-sandbox/  # Next.js 16 サンドボックス
├── Daily/              # 日次メモ
└── Templates/          # テンプレート
```

## 🚀 Claude Code セットアップ

### 1. インストール

```bash
# Claude Code のインストール（既にインストール済みの場合はスキップ）
npm install -g @anthropic-ai/claude-code
```

### 2. 認証

```bash
# Claude にログイン
claude login
```

### 3. プロジェクトで使用

```bash
# このリポジトリのディレクトリに移動
cd /Users/yoshidatakumi/study/ob-dev

# Claude Code を起動
claude
```

## 💡 よく使うコマンド

### ファイル操作

```bash
# ファイルを読む
Read: Learning/In-Progress/Vercel.md

# ファイルを検索
Glob: **/*.md

# コンテンツ検索
Grep: "Next.js" --type md
```

### Git 操作

```bash
# 変更を確認
git status

# コミット（Claude が自動でメッセージを生成）
git add .
git commit

# PR作成
gh pr create
```

### プロジェクト操作

```bash
# Next.js プロジェクトに移動
cd Projects/next16-sandbox

# 開発サーバー起動
npm run dev

# ビルド
npm run build
```

## 📝 このリポジトリでの作業フロー

### 1. 新しい学習トピックを追加

```bash
# 1. Learning/In-Progress/ に新しいファイルを作成
# 2. Claude に学習内容をまとめるよう依頼
# 3. 完了したら Learning/Completed/ に移動
```

### 2. プロジェクトで新機能を実装

```bash
# 1. Projects/next16-sandbox に移動
# 2. 機能を実装
# 3. テストとビルドを確認
# 4. コミット
```

### 3. 日次メモの作成

```bash
# Daily/ ディレクトリに日付でファイルを作成
# フォーマット: YYYY-MM-DD.md
```

## 🎯 Claude Code のベストプラクティス

### DO ✅

- **具体的な指示を出す**: 「〜を実装して」「〜を修正して」など明確に
- **コンテキストを提供**: 関連ファイルを先に Read で読み込む
- **段階的に進める**: 複雑なタスクは TodoWrite で分解
- **変更を確認**: git diff で差分を確認してからコミット

### DON'T ❌

- **曖昧な指示**: 「改善して」だけでは不十分
- **大量のファイルを一度に変更**: 段階的に進める
- **テストなしでコミット**: 必ず動作確認してからコミット
- **機密情報を含める**: API キーやパスワードは含めない

## 🔧 カスタム設定

### Obsidian との連携

このリポジトリは Obsidian Vault として管理されています。

```yaml
# .obsidian/config は .gitignore に含まれている
# プラグインのバイナリも除外されている
```

### Git の設定

```bash
# .gitignore で管理されているもの:
# - .obsidian/plugins/**/main.js
# - .obsidian/plugins/**/styles.css
# - .obsidian/workspace.json
# - node_modules/
# - .env*
```

## 📚 主要ドキュメント

### 詳細なガイド

- **Vercel**: `Learning/In-Progress/Vercel.md`
  - Storage (Blob, KV, Postgres)
  - AI 機能 (v0, AI SDK, Gateway, Agents)
  - Observability (Logs, Drains, OpenTelemetry)
  - Production Checklist

- **Claude**: `Learning/In-Progress/Claude.md`
  - モデルの種類と選び方
  - Claude Code CLI の使い方
  - API の使用方法
  - Prompt Engineering
  - ベストプラクティス

### プロジェクト

- **Next.js 16 Sandbox**: `Projects/next16-sandbox/`
  - Next.js 16 の新機能デモ
  - Server Actions, Streaming, Cache など
  - 統一された UI デザイン

## 🐛 トラブルシューティング

### Claude Code が起動しない

```bash
# ログイン状態を確認
claude whoami

# 再ログイン
claude logout
claude login
```

### Git コミットが失敗する

```bash
# コミット前に必ずステータスを確認
git status

# 差分を確認
git diff

# ステージングを確認
git diff --staged
```

### Next.js プロジェクトでエラー

```bash
# node_modules を再インストール
cd Projects/next16-sandbox
rm -rf node_modules
npm install

# キャッシュをクリア
rm -rf .next
npm run dev
```

### Obsidian のプラグインが追跡される

```bash
# .gitignore を確認
cat .gitignore

# 既に追跡されているファイルを削除
git rm --cached .obsidian/plugins/**/main.js
git rm --cached .obsidian/plugins/**/styles.css
git commit -m "Remove plugin binaries from tracking"
```

## 🔐 セキュリティ

### 機密情報の取り扱い

```bash
# .env ファイルは .gitignore に含める
echo "ANTHROPIC_API_KEY=your-key" > .env

# .gitignore に追加されているか確認
cat .gitignore | grep .env
```

### コミット前のチェック

```bash
# 機密情報が含まれていないか確認
git diff | grep -i "api_key\|password\|secret\|token"
```

## 📖 参考リンク

### 公式ドキュメント

- [Claude Code ドキュメント](https://docs.claude.com/en/docs/claude-code)
- [Next.js ドキュメント](https://nextjs.org/docs)
- [Vercel ドキュメント](https://vercel.com/docs)
- [Obsidian ドキュメント](https://help.obsidian.md)

### このリポジトリの詳細ガイド

- Vercel 完全ガイド: `Learning/In-Progress/Vercel.md`
- Claude 完全ガイド: `Learning/In-Progress/Claude.md`

## 🚦 クイックスタート

新しいメンバーがこのリポジトリで作業を始める手順：

1. **リポジトリをクローン**

   ```bash
   git clone <repository-url>
   cd ob-dev
   ```

2. **Claude Code にログイン**

   ```bash
   claude login
   ```

3. **Obsidian で開く**
   - Obsidian を起動
   - "Open folder as vault" で ob-dev を選択

4. **Next.js プロジェクトをセットアップ**

   ```bash
   cd Projects/next16-sandbox
   npm install
   npm run dev
   ```

5. **Claude に聞く**
   ```bash
   claude
   # 何か質問や依頼をする
   ```

## 📝 タスク管理

Claude Code の TodoWrite 機能を活用：

```typescript
// 複雑なタスクは TodoWrite で分解
TodoWrite: [
  { content: "タスク1", status: "pending", activeForm: "実行中..." },
  { content: "タスク2", status: "in_progress", activeForm: "実行中..." },
  { content: "タスク3", status: "completed", activeForm: "完了" }
]
```

## 🎨 コーディングスタイル

### TypeScript

```typescript
// ✅ 良い例
interface User {
  id: string;
  email: string;
  name: string;
}

async function getUser(id: string): Promise<User> {
  // 実装
}

// ❌ 悪い例
function getUser(id) {
  // 型がない
}
```

### React / Next.js

```typescript
// ✅ Server Component (デフォルト)
export default async function Page() {
  const data = await fetchData();
  return <div>{data}</div>;
}

// ✅ Client Component（必要な場合のみ）
"use client";
export default function InteractiveComponent() {
  const [state, setState] = useState();
  return <button onClick={() => setState(...)}>Click</button>;
}
```

### コミットメッセージ

```bash
# ✅ 良い例
git commit -m "Add user authentication feature

Implemented JWT-based authentication with:
- Login endpoint
- Token validation middleware
- Logout functionality

🤖 Generated with Claude Code

Co-Authored-By: Claude <noreply@anthropic.com>"

# ❌ 悪い例
git commit -m "Update files"
```

## 🔄 定期的なメンテナンス

### 週次

- [ ] 学習ノートを整理
- [ ] 完了したトピックを Completed/ に移動
- [ ] プロジェクトの依存関係を更新

### 月次

- [ ] ドキュメントを最新化
- [ ] 不要なファイルを削除
- [ ] バックアップを確認

## 📞 サポート

### Claude Code の問題

- [GitHub Issues](https://github.com/anthropics/claude-code/issues)
- [Discord コミュニティ](https://discord.gg/anthropic)

### このリポジトリの問題

- Git の issue を作成
- CLAUDE.md を更新してナレッジを共有

---

**最終更新**: 2025 年 11 月

**メンテナンス**: このファイルは定期的に更新してください
