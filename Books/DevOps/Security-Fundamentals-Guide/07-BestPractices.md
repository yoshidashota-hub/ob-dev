# 第7章: ベストプラクティス

## セキュリティチェックリスト

### 認証・認可

```
□ パスワードは bcrypt でハッシュ化（cost 12以上）
□ パスワードポリシーを実装（12文字以上、複雑性要件）
□ MFA を提供/推奨
□ セッションの適切な有効期限設定
□ ログアウト時にセッションを完全に無効化
□ パスワードリセットは安全なトークンを使用
□ アカウントロックアウト機能を実装
□ 認証失敗のレート制限
□ 最小権限の原則に基づいた権限設計
□ 認可チェックをすべてのエンドポイントで実施
```

### 入力検証

```
□ すべての入力を検証（zod 等）
□ SQLインジェクション対策（パラメータ化クエリ/ORM）
□ XSS 対策（出力エスケープ、CSP）
□ CSRF 対策（トークン、SameSite Cookie）
□ ファイルアップロードの検証（タイプ、サイズ、名前）
□ URL の検証（SSRF 対策）
□ JSON パースのエラーハンドリング
```

### データ保護

```
□ 機密データは暗号化して保存
□ HTTPS のみ使用
□ Secrets Manager でシークレット管理
□ ログに機密情報を含めない
□ エラーメッセージで内部情報を漏らさない
□ PII の適切な取り扱い（マスキング、最小化）
□ データ保持ポリシーの実装
□ バックアップの暗号化
```

### 決済セキュリティ

```
□ カード情報は一切保存しない
□ PCI DSS 準拠レベルを確認
□ Stripe Elements/PayPay 等の安全な実装
□ Webhook の署名検証
□ 金額のサーバー側検証
□ 3D セキュア有効化
□ 不正検知ルールの設定
□ 監査ログの記録
```

### インフラ

```
□ IAM 最小権限
□ セキュリティグループの最小化
□ VPC エンドポイント使用
□ WAF 有効化
□ CloudTrail 有効化
□ GuardDuty 有効化
□ 定期的なセキュリティパッチ適用
□ 自動バックアップ設定
```

### テスト・監視

```
□ 依存関係の脆弱性チェック（npm audit）
□ 静的解析（ESLint security）
□ シークレットスキャン（Gitleaks）
□ 定期的な DAST（OWASP ZAP）
□ セキュリティアラートの設定
□ インシデント対応手順の文書化
```

## セキュリティヘッダー設定

```typescript
// next.config.js
const securityHeaders = [
  // XSS 対策
  {
    key: "X-XSS-Protection",
    value: "1; mode=block",
  },
  // クリックジャッキング対策
  {
    key: "X-Frame-Options",
    value: "DENY",
  },
  // MIME スニッフィング対策
  {
    key: "X-Content-Type-Options",
    value: "nosniff",
  },
  // Referrer 制御
  {
    key: "Referrer-Policy",
    value: "strict-origin-when-cross-origin",
  },
  // HTTPS 強制
  {
    key: "Strict-Transport-Security",
    value: "max-age=31536000; includeSubDomains; preload",
  },
  // CSP
  {
    key: "Content-Security-Policy",
    value: `
      default-src 'self';
      script-src 'self' 'unsafe-inline' https://js.stripe.com;
      style-src 'self' 'unsafe-inline';
      img-src 'self' data: https:;
      font-src 'self';
      connect-src 'self' https://api.stripe.com;
      frame-src https://js.stripe.com;
    `.replace(/\s+/g, " ").trim(),
  },
  // 権限ポリシー
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=()",
  },
];

module.exports = {
  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
    ];
  },
};
```

## 環境別設定

```typescript
// lib/config.ts
const config = {
  development: {
    // 開発環境
    logLevel: "debug",
    csrfEnabled: false, // 開発時は無効可
    rateLimitEnabled: false,
  },
  staging: {
    // ステージング環境
    logLevel: "info",
    csrfEnabled: true,
    rateLimitEnabled: true,
    rateLimitPerMinute: 100, // 緩め
  },
  production: {
    // 本番環境
    logLevel: "warn",
    csrfEnabled: true,
    rateLimitEnabled: true,
    rateLimitPerMinute: 30, // 厳しめ
    forceHttps: true,
    secureCookies: true,
  },
};

export const appConfig = config[process.env.NODE_ENV || "development"];
```

## インシデント対応

```
┌────────────────────────────────────────────────────────────┐
│                インシデント対応フロー                         │
│                                                            │
│  1. 検知                                                    │
│     • 監視アラート                                          │
│     • ユーザー報告                                          │
│     • 定期的なログレビュー                                   │
│                                                            │
│  2. 初期対応                                                │
│     • 影響範囲の特定                                        │
│     • 即時の緩和措置（IP ブロック、サービス停止等）          │
│     • 関係者への連絡                                        │
│                                                            │
│  3. 調査                                                    │
│     • ログ分析                                              │
│     • 侵入経路の特定                                        │
│     • 被害範囲の確認                                        │
│                                                            │
│  4. 復旧                                                    │
│     • 脆弱性の修正                                          │
│     • システムの復元                                        │
│     • 監視強化                                              │
│                                                            │
│  5. 事後対応                                                │
│     • 報告書作成                                            │
│     • 再発防止策の実施                                      │
│     • 必要に応じて関係機関へ報告                            │
└────────────────────────────────────────────────────────────┘
```

## セキュリティ文化

```
┌────────────────────────────────────────────────────────────┐
│              セキュリティを文化にする                         │
│                                                            │
│  1. Shift Left                                             │
│     • 開発初期からセキュリティを考慮                         │
│     • セキュリティレビューを CI に組み込む                   │
│                                                            │
│  2. 全員の責任                                              │
│     • セキュリティは専門チームだけの仕事ではない             │
│     • 全開発者がセキュリティを意識                          │
│                                                            │
│  3. 継続的な学習                                            │
│     • 最新の脅威情報をキャッチアップ                         │
│     • 定期的なセキュリティトレーニング                       │
│                                                            │
│  4. 透明性                                                  │
│     • セキュリティ問題を隠さない                            │
│     • オープンな議論と共有                                  │
│                                                            │
│  5. 継続的改善                                              │
│     • 定期的なセキュリティ評価                              │
│     • インシデントからの学習                                │
└────────────────────────────────────────────────────────────┘
```

## 参考リンク

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [OWASP Cheat Sheet Series](https://cheatsheetseries.owasp.org/)
- [AWS Security Best Practices](https://docs.aws.amazon.com/wellarchitected/latest/security-pillar/)
- [PCI DSS](https://www.pcisecuritystandards.org/)
- [CIS Benchmarks](https://www.cisecurity.org/cis-benchmarks/)
- [Stripe Security](https://stripe.com/docs/security)
