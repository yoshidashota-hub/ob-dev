# CI/CD 学習ノート

## 概要

CI (Continuous Integration) / CD (Continuous Delivery/Deployment) は、コードの変更を自動的にテスト・ビルド・デプロイするプラクティス。

## 基本概念

```
CI = コードを頻繁に統合し、自動テストで品質を担保
CD = テスト済みコードを自動的に本番環境へデプロイ
```

## GitHub Actions

### 基本構成

```yaml
# .github/workflows/ci.yml
name: CI

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: "22"
          cache: "npm"

      - name: Install dependencies
        run: npm ci

      - name: Run linter
        run: npm run lint

      - name: Run type check
        run: npm run type-check

      - name: Run tests
        run: npm run test

      - name: Build
        run: npm run build
```

### Next.js 用ワークフロー

```yaml
name: Next.js CI/CD

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

env:
  VERCEL_ORG_ID: ${{ secrets.VERCEL_ORG_ID }}
  VERCEL_PROJECT_ID: ${{ secrets.VERCEL_PROJECT_ID }}

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: "22"
          cache: "npm"

      - run: npm ci
      - run: npm run lint
      - run: npm run test
      - run: npm run build

  deploy-preview:
    needs: test
    if: github.event_name == 'pull_request'
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}

  deploy-production:
    needs: test
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          vercel-args: "--prod"
```

### マトリックスビルド

```yaml
jobs:
  test:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        node-version: [20, 22]
        os: [ubuntu-latest, macos-latest]

    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: ${{ matrix.node-version }}
      - run: npm ci
      - run: npm test
```

## Vercel CI/CD

Vercel は Git プッシュで自動デプロイ。

```bash
# vercel.json
{
  "buildCommand": "npm run build",
  "outputDirectory": ".next",
  "framework": "nextjs",
  "regions": ["hnd1"]
}
```

### プレビューデプロイ

- PRごとにプレビュー環境が自動作成
- マージ後に本番デプロイ

## パイプライン設計

### 標準的なステージ

```
1. Checkout    - コード取得
2. Install     - 依存関係インストール
3. Lint        - 静的解析
4. Type Check  - 型チェック
5. Unit Test   - 単体テスト
6. Build       - ビルド
7. E2E Test    - E2Eテスト（オプション）
8. Deploy      - デプロイ
```

### 環境戦略

```
develop → Preview 環境
staging → Staging 環境
main    → Production 環境
```

## ベストプラクティス

1. **高速化**
   - キャッシュ活用（node_modules, .next/cache）
   - 並列実行
2. **セキュリティ**
   - シークレット管理
   - 依存関係の脆弱性チェック
3. **可視化**
   - ステータスバッジ
   - Slack/Discord 通知

## 参考リソース

- [GitHub Actions ドキュメント](https://docs.github.com/actions)
- [Vercel CI/CD](https://vercel.com/docs/deployments/git)
