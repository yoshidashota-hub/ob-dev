# Serena MCP Server セットアップガイド

Serena は Oraios AI が開発したコーディングエージェントツールキットで、セマンティックコード検索と編集機能を提供します。

## ✅ 完了した設定

### 1. MCP 設定ファイルの更新

**ファイル**: `~/Library/Application Support/Code/User/mcp.json`

```json
{
  "servers": {
    "serena": {
      "command": "uvx",
      "args": ["serena-mcp"],
      "env": {},
      "type": "stdio"
    },
    // ... 他の MCP サーバー
  }
}
```

## 📦 Serena の主な機能

### コード検索・編集

- **30+ プログラミング言語対応**: TypeScript, JavaScript, Python, Go, Rust, C#, Java など
- **セマンティック検索**: コードの意味を理解した検索
- **LSP 統合**: Language Server Protocol サポート
- **無料・オープンソース**: サブスクリプション不要

### 利用可能な MCP ツール

Serena MCP サーバーは以下のツールを提供します（予定）：

1. **code_search** - セマンティックコード検索
2. **code_edit** - コードの編集
3. **file_operations** - ファイル操作
4. **symbol_search** - シンボル検索
5. **reference_finder** - 参照検索

## 🚀 使用方法

### Claude Code での使用

Serena は Claude Code で自動的に利用可能になります。設定後、以下のようなリクエストができます：

```
# 例1: コード検索
"このプロジェクトで認証に関連するファイルを探して"

# 例2: セマンティック編集
"ユーザー登録機能に email validation を追加して"

# 例3: リファクタリング
"この関数を TypeScript の最新ベストプラクティスにリファクタリングして"
```

### 利用可能な MCP ツール一覧の確認

Claude Code で以下のコマンドを実行:

```
利用可能な MCP ツールを表示して
```

または:

```
Serena のツールを一覧表示して
```

## 🔧 トラブルシューティング

### Serena が認識されない

```bash
# uv が正しくインストールされているか確認
which uv

# uv のバージョン確認
uv --version

# serena-mcp パッケージの確認
uvx serena-mcp --help
```

### MCP 設定の確認

```bash
# 設定ファイルの内容を確認
cat ~/Library/Application\ Support/Code/User/mcp.json
```

### Claude Code の再起動

設定を変更した後は、Claude Code を再起動する必要があります：

1. Claude Code を完全に終了
2. 再度起動
3. MCP サーバーが接続されたか確認

## 📝 代替インストール方法

### 方法 1: uv 経由（推奨）

```bash
# uv で serena をインストール
uv pip install serena-mcp
```

### 方法 2: pip 経由

```bash
# pip でインストール
pip install serena-mcp
```

### 方法 3: GitHub から直接

```bash
# Git clone してインストール
git clone https://github.com/oraios/serena.git
cd serena
uv pip install -e .
```

## 🎯 次のステップ

1. **Claude Code を再起動**
2. **MCP ツールの確認**: 利用可能なツールをリストアップ
3. **Serena を試す**: コード検索や編集機能を試す

## 🔗 参考リンク

- [Serena GitHub](https://github.com/oraios/serena)
- [MCP Documentation](https://mcp.so/server/serena/oraios)
- [Serena Setup Guide](https://smartscope.blog/en/generative-ai/claude/serena-mcp-implementation-guide/)

## 💡 使用例

### 例1: プロジェクト全体のコード検索

```
"next16-sandbox プロジェクトで、API ルートを全て検索して一覧にして"
```

### 例2: 特定の機能の実装箇所を探す

```
"認証ロジックが実装されているファイルを特定して、
その実装内容を説明して"
```

### 例3: コードのリファクタリング

```
"app/api/auth/route.ts のコードを、
最新の Next.js 16 のベストプラクティスに沿って
リファクタリングして"
```

### 例4: セキュリティチェック

```
"このプロジェクトで、セキュリティ上の問題がある
可能性のあるコードを検索して"
```

## 📊 Serena vs 他のツールとの比較

| 機能 | Serena | GitHub Copilot | Cursor |
|------|--------|----------------|--------|
| セマンティック検索 | ✅ | ❌ | ✅ |
| コード編集 | ✅ | ✅ | ✅ |
| 無料 | ✅ | ❌ | 部分的 |
| LSP 統合 | ✅ | ❌ | ✅ |
| MCP サポート | ✅ | ❌ | ❌ |
| 30+ 言語対応 | ✅ | ✅ | ✅ |

## 🎓 学習リソース

1. **公式ドキュメント**: [serena docs](https://github.com/oraios/serena#readme)
2. **MCP Integration**: [MCP Server Documentation](https://deepwiki.com/oraios/serena/3.2-mcp-server-integration)
3. **チュートリアル**: [Serena MCP Setup Guide](https://smartscope.blog/en/generative-ai/claude/serena-mcp-implementation-guide/)

---

**最終更新**: 2025年11月
**ステータス**: 設定完了（Claude Code 再起動が必要）

## ⚠️ 重要

MCP 設定を変更した後は、**必ず Claude Code を再起動**してください。
再起動後、Serena の MCP ツールが利用可能になります。
