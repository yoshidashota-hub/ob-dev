# Stripe 決済完全ガイド

Web アプリケーションに決済機能を実装するための Stripe ガイドです。

## 目次

1. [はじめに](./00-Introduction.md) - Stripe の概要
2. [セットアップ](./01-Setup.md) - アカウント・SDK 設定
3. [Payment Intent](./02-Payment-Intent.md) - カード決済の基本
4. [Checkout Session](./03-Checkout-Session.md) - リダイレクト型決済
5. [Elements](./04-Elements.md) - カスタム決済フォーム
6. [Webhook](./05-Webhook.md) - イベント処理
7. [サブスクリプション](./06-Subscriptions.md) - 定期課金
8. [顧客管理](./07-Customers.md) - 顧客・支払い方法
9. [請求書](./08-Invoices.md) - 請求書発行
10. [Connect](./09-Connect.md) - マーケットプレイス
11. [テスト](./10-Testing.md) - テスト手法
12. [本番運用](./11-Production.md) - セキュリティ・PCI DSS

## Stripe の特徴

- **開発者フレンドリー**: 優れた API と SDK
- **グローバル対応**: 135+ 通貨、45+ 国
- **豊富な決済手段**: カード、Apple Pay、コンビニ等
- **セキュリティ**: PCI DSS Level 1 準拠

## 対象読者

- EC サイトに決済を導入したい方
- SaaS でサブスクリプション課金を実装したい方
- マーケットプレイスを構築したい方

## 関連リソース

- [Learning/Backend/Payment.md](../../Learning/Backend/Payment.md)
- [Knowledge/Backend/stripe-examples.md](../../Knowledge/Backend/stripe-examples.md)
