# 第6章: セキュリティテスト

## テストの種類

```
┌────────────────────────────────────────────────────────────┐
│                セキュリティテストの種類                       │
│                                                            │
│  ┌─────────────────────────────────────────────────────┐  │
│  │  静的解析 (SAST)                                     │  │
│  │  • コードの脆弱性を検出                              │  │
│  │  • 依存関係の脆弱性チェック                          │  │
│  │  • 開発時に実行                                      │  │
│  └─────────────────────────────────────────────────────┘  │
│                                                            │
│  ┌─────────────────────────────────────────────────────┐  │
│  │  動的解析 (DAST)                                     │  │
│  │  • 実行中のアプリケーションをテスト                   │  │
│  │  • ブラックボックステスト                            │  │
│  │  • ステージング環境で実行                            │  │
│  └─────────────────────────────────────────────────────┘  │
│                                                            │
│  ┌─────────────────────────────────────────────────────┐  │
│  │  ペネトレーションテスト                               │  │
│  │  • 専門家による侵入テスト                            │  │
│  │  • 年1回以上推奨                                     │  │
│  │  • PCI DSS 要件                                      │  │
│  └─────────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────────┘
```

## 依存関係の脆弱性チェック

### npm audit

```bash
# 脆弱性チェック
npm audit

# 自動修正
npm audit fix

# 強制修正（破壊的変更あり）
npm audit fix --force

# CI での使用
npm audit --audit-level=high
```

### GitHub Dependabot

```yaml
# .github/dependabot.yml
version: 2
updates:
  - package-ecosystem: "npm"
    directory: "/"
    schedule:
      interval: "daily"
    open-pull-requests-limit: 10
    # セキュリティアップデートを優先
    groups:
      security:
        patterns:
          - "*"
        update-types:
          - "patch"
          - "minor"
```

### Snyk

```yaml
# .github/workflows/snyk.yml
name: Snyk Security Scan

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  snyk:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Run Snyk to check for vulnerabilities
        uses: snyk/actions/node@master
        env:
          SNYK_TOKEN: ${{ secrets.SNYK_TOKEN }}
        with:
          args: --severity-threshold=high
```

## 静的解析（SAST）

### ESLint セキュリティプラグイン

```bash
npm install -D eslint-plugin-security
```

```javascript
// .eslintrc.js
module.exports = {
  plugins: ["security"],
  extends: ["plugin:security/recommended"],
  rules: {
    "security/detect-object-injection": "error",
    "security/detect-non-literal-regexp": "warn",
    "security/detect-unsafe-regex": "error",
    "security/detect-buffer-noassert": "error",
    "security/detect-eval-with-expression": "error",
    "security/detect-no-csrf-before-method-override": "error",
    "security/detect-possible-timing-attacks": "warn",
  },
};
```

### Semgrep

```yaml
# .github/workflows/semgrep.yml
name: Semgrep

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  semgrep:
    runs-on: ubuntu-latest
    container:
      image: returntocorp/semgrep
    steps:
      - uses: actions/checkout@v4

      - name: Run Semgrep
        run: |
          semgrep ci \
            --config "p/security-audit" \
            --config "p/secrets" \
            --config "p/owasp-top-ten"
```

## 動的解析（DAST）

### OWASP ZAP

```yaml
# .github/workflows/zap.yml
name: OWASP ZAP Scan

on:
  schedule:
    - cron: "0 0 * * 0" # 毎週日曜

jobs:
  zap-scan:
    runs-on: ubuntu-latest
    steps:
      - name: ZAP Scan
        uses: zaproxy/action-full-scan@v0.10.0
        with:
          target: "https://staging.example.com"
          rules_file_name: ".zap/rules.tsv"
          cmd_options: "-a"

      - name: Upload Report
        uses: actions/upload-artifact@v4
        with:
          name: zap-report
          path: report_html.html
```

```
# .zap/rules.tsv
# ルールID	アクション	説明
10020	IGNORE	X-Frame-Options Header Not Set（CSP で対応）
10021	IGNORE	X-Content-Type-Options Header Missing（設定済み）
```

## シークレットスキャン

### git-secrets

```bash
# インストール
brew install git-secrets

# リポジトリに設定
git secrets --install
git secrets --register-aws

# カスタムパターン追加
git secrets --add 'PRIVATE_KEY'
git secrets --add 'sk_live_[0-9a-zA-Z]{24}'  # Stripe
git secrets --add 'ghp_[0-9a-zA-Z]{36}'      # GitHub

# スキャン
git secrets --scan
```

### Gitleaks

```yaml
# .github/workflows/gitleaks.yml
name: Gitleaks

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  gitleaks:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0

      - name: Gitleaks
        uses: gitleaks/gitleaks-action@v2
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

## セキュリティテストの自動化

### CI パイプライン統合

```yaml
# .github/workflows/security.yml
name: Security Pipeline

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  # 依存関係チェック
  dependency-check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
      - run: npm ci
      - run: npm audit --audit-level=high

  # 静的解析
  sast:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
      - run: npm ci
      - run: npm run lint
      - name: Semgrep
        uses: returntocorp/semgrep-action@v1

  # シークレットスキャン
  secret-scan:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0
      - uses: gitleaks/gitleaks-action@v2
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}

  # ビルド＆テスト後に DAST
  dast:
    needs: [dependency-check, sast, secret-scan]
    if: github.event_name == 'push' && github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    environment: staging
    steps:
      - name: Deploy to staging
        run: echo "Deploy to staging"

      - name: OWASP ZAP Scan
        uses: zaproxy/action-baseline@v0.12.0
        with:
          target: "https://staging.example.com"
```

## セキュリティレポート

```typescript
// scripts/security-report.ts
interface SecurityReport {
  timestamp: Date;
  npmAudit: AuditResult;
  dependabotAlerts: Alert[];
  zapFindings: Finding[];
}

async function generateSecurityReport(): Promise<SecurityReport> {
  // npm audit の結果
  const npmAudit = await runNpmAudit();

  // GitHub Dependabot アラート
  const dependabotAlerts = await fetchDependabotAlerts();

  // ZAP スキャン結果
  const zapFindings = await fetchZapResults();

  return {
    timestamp: new Date(),
    npmAudit,
    dependabotAlerts,
    zapFindings,
  };
}

// Slack 通知
async function notifySecurityIssues(report: SecurityReport) {
  const criticalIssues = [
    ...report.npmAudit.vulnerabilities.filter((v) => v.severity === "critical"),
    ...report.dependabotAlerts.filter((a) => a.severity === "critical"),
    ...report.zapFindings.filter((f) => f.risk === "High"),
  ];

  if (criticalIssues.length > 0) {
    await sendSlackAlert({
      channel: "#security-alerts",
      text: `セキュリティ警告: ${criticalIssues.length}件の重大な問題`,
      attachments: criticalIssues.map((issue) => ({
        color: "danger",
        title: issue.title,
        text: issue.description,
      })),
    });
  }
}
```

## 次のステップ

次章では、セキュリティのベストプラクティスをまとめます。
