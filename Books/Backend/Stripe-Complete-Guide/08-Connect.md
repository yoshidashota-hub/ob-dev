# 第8章: Stripe Connect

## Connect とは

マーケットプレイスやプラットフォームビジネス向けの決済機能。

```
┌─────────────────────────────────────────────────────┐
│                 Connect Flow                         │
│                                                     │
│  Customer ──────▶ Platform ──────▶ Connected        │
│  (購入者)          (あなた)         Account         │
│                       │             (出品者)        │
│                       │                             │
│                       ▼                             │
│              Platform Fee                           │
│              (手数料)                               │
└─────────────────────────────────────────────────────┘
```

## アカウントタイプ

| タイプ | 説明 | ユースケース |
|--------|------|-------------|
| Standard | フル機能、Stripe管理 | 独立したビジネス |
| Express | 簡易オンボーディング | マーケットプレイス |
| Custom | 完全カスタマイズ | 大規模プラットフォーム |

## Express アカウントの作成

### オンボーディングリンクの生成

```typescript
// app/api/connect/onboard/route.ts
import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";

export async function POST(req: Request) {
  const { userId } = await req.json();

  // Connected Account 作成
  const account = await stripe.accounts.create({
    type: "express",
    country: "JP",
    email: "seller@example.com",
    capabilities: {
      card_payments: { requested: true },
      transfers: { requested: true },
    },
    metadata: {
      userId,
    },
  });

  // オンボーディングリンク作成
  const accountLink = await stripe.accountLinks.create({
    account: account.id,
    refresh_url: `${process.env.NEXT_PUBLIC_APP_URL}/connect/refresh`,
    return_url: `${process.env.NEXT_PUBLIC_APP_URL}/connect/complete`,
    type: "account_onboarding",
  });

  return NextResponse.json({
    accountId: account.id,
    url: accountLink.url,
  });
}
```

### ダッシュボードリンク

```typescript
// 出品者が自分のStripeダッシュボードにアクセス
const loginLink = await stripe.accounts.createLoginLink(accountId);
```

## 決済の処理

### Direct Charge（直接課金）

```typescript
// 出品者のアカウントに直接課金
const paymentIntent = await stripe.paymentIntents.create({
  amount: 10000,
  currency: "jpy",
  application_fee_amount: 1000,  // プラットフォーム手数料
}, {
  stripeAccount: "acct_xxx",  // Connected Account ID
});
```

### Destination Charge（送金先指定）

```typescript
// プラットフォームで課金し、出品者に送金
const paymentIntent = await stripe.paymentIntents.create({
  amount: 10000,
  currency: "jpy",
  transfer_data: {
    destination: "acct_xxx",
    amount: 9000,  // 出品者への送金額
  },
});
```

### Separate Charges and Transfers

```typescript
// 1. プラットフォームで課金
const paymentIntent = await stripe.paymentIntents.create({
  amount: 10000,
  currency: "jpy",
});

// 2. 後で出品者に送金
const transfer = await stripe.transfers.create({
  amount: 9000,
  currency: "jpy",
  destination: "acct_xxx",
  transfer_group: "ORDER_123",
});
```

## Checkout Session with Connect

```typescript
const session = await stripe.checkout.sessions.create({
  mode: "payment",
  line_items: [
    {
      price_data: {
        currency: "jpy",
        product_data: { name: "商品名" },
        unit_amount: 10000,
      },
      quantity: 1,
    },
  ],
  payment_intent_data: {
    application_fee_amount: 1000,
    transfer_data: {
      destination: "acct_xxx",
    },
  },
  success_url: `${baseUrl}/success`,
  cancel_url: `${baseUrl}/cancel`,
});
```

## アカウント情報の取得

```typescript
// アカウント情報取得
const account = await stripe.accounts.retrieve("acct_xxx");

// オンボーディング完了確認
const isOnboarded = account.details_submitted && account.charges_enabled;

// 残高確認
const balance = await stripe.balance.retrieve({
  stripeAccount: "acct_xxx",
});
```

## 支払いの管理

### 支払いスケジュール

```typescript
// アカウントの支払いスケジュール設定
await stripe.accounts.update("acct_xxx", {
  settings: {
    payouts: {
      schedule: {
        interval: "weekly",
        weekly_anchor: "monday",
      },
    },
  },
});
```

### 手動支払い

```typescript
// 手動で即時支払い
const payout = await stripe.payouts.create({
  amount: 5000,
  currency: "jpy",
}, {
  stripeAccount: "acct_xxx",
});
```

## Webhook イベント

```typescript
// Connect 関連のイベント
const connectEvents = [
  "account.updated",           // アカウント更新
  "account.application.deauthorized",  // 連携解除
  "account.external_account.created",  // 銀行口座追加
  "payout.created",            // 支払い作成
  "payout.paid",               // 支払い完了
  "payout.failed",             // 支払い失敗
];
```

### Webhook ハンドラー

```typescript
export async function handleAccountUpdated(account: Stripe.Account) {
  const userId = account.metadata?.userId;
  if (!userId) return;

  await prisma.seller.update({
    where: { userId },
    data: {
      stripeAccountId: account.id,
      chargesEnabled: account.charges_enabled,
      payoutsEnabled: account.payouts_enabled,
      detailsSubmitted: account.details_submitted,
    },
  });
}
```

## 実装パターン

### 出品者登録フロー

```typescript
// 1. ユーザーが出品者登録ボタンをクリック
const handleBecomesSeller = async () => {
  const response = await fetch("/api/connect/onboard", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId }),
  });

  const { url } = await response.json();
  window.location.href = url;  // Stripe オンボーディングへ
};

// 2. オンボーディング完了後、/connect/complete にリダイレクト
// 3. Webhook で account.updated を受信してDB更新
```

### 購入フロー

```typescript
// app/api/marketplace/checkout/route.ts
export async function POST(req: Request) {
  const { productId, sellerId } = await req.json();

  const product = await prisma.product.findUnique({
    where: { id: productId },
    include: { seller: true },
  });

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    line_items: [
      {
        price_data: {
          currency: "jpy",
          product_data: { name: product.name },
          unit_amount: product.price,
        },
        quantity: 1,
      },
    ],
    payment_intent_data: {
      application_fee_amount: Math.floor(product.price * 0.1),  // 10%手数料
      transfer_data: {
        destination: product.seller.stripeAccountId,
      },
    },
    success_url: `${baseUrl}/order/success`,
    cancel_url: `${baseUrl}/product/${productId}`,
  });

  return NextResponse.json({ url: session.url });
}
```

## 次のステップ

次章では、ベストプラクティスとセキュリティについて学びます。
