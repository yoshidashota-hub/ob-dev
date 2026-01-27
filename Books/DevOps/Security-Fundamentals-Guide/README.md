# Security Fundamentals Guide

Web アプリケーションセキュリティの基礎から決済セキュリティまでの実践ガイド。

## 概要

このガイドでは、Web アプリケーション開発で必要なセキュリティの基礎を学びます。特に決済機能を扱う場合に必須の知識を重点的にカバーします。

## 対象読者

- セキュリティの基礎を学びたい開発者
- 決済機能を実装する開発者
- PCI DSS 準拠が必要なプロジェクトの担当者

## 学べること

- OWASP Top 10 の対策
- 認証・認可のベストプラクティス
- 決済セキュリティと PCI DSS
- AWS でのセキュリティ設計
- セキュリティテストと監査

## 目次

1. [はじめに](00-Introduction.md) - セキュリティの基礎概念
2. [OWASP Top 10](01-OWASP.md) - 主要な脆弱性と対策
3. [認証・認可](02-Authentication.md) - 安全な認証システム
4. [データ保護](03-DataProtection.md) - 暗号化と機密情報管理
5. [決済セキュリティ](04-Payment.md) - PCI DSS と実装
6. [インフラセキュリティ](05-Infrastructure.md) - AWS セキュリティ
7. [セキュリティテスト](06-Testing.md) - 脆弱性診断
8. [ベストプラクティス](07-BestPractices.md) - チェックリスト

## 技術スタック

```
Framework:  Next.js, Node.js
Auth:       NextAuth.js, JWT, OAuth
Payment:    Stripe, PayPay
AWS:        IAM, KMS, WAF, Secrets Manager
Testing:    OWASP ZAP, npm audit
```
