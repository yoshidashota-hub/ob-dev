# 第0章: はじめに

## Stripe とは

Stripe は、オンライン決済を簡単に実装できるプラットフォームです。

## 決済フローの概要

```
┌─────────────────────────────────────────────────────┐
│                Payment Intent Flow                   │
│                                                     │
│  ┌──────────┐     ┌──────────┐     ┌──────────┐   │
│  │  Client  │     │  Server  │     │  Stripe  │   │
│  └────┬─────┘     └────┬─────┘     └────┬─────┘   │
│       │                │                │          │
│       │ 1. 購入ボタン   │                │          │
│       │───────────────▶│                │          │
│       │                │ 2. PaymentIntent│          │
│       │                │───────────────▶│          │
│       │                │                │          │
│       │                │ 3. client_secret│         │
│       │◀───────────────│◀───────────────│          │
│       │                │                │          │
│       │ 4. カード情報入力                 │          │
│       │───────────────────────────────▶│          │
│       │                │                │          │
│       │ 5. 決済結果     │                │          │
│       │◀───────────────────────────────│          │
│       │                │                │          │
│       │                │ 6. Webhook     │          │
│       │                │◀───────────────│          │
└─────────────────────────────────────────────────────┘
```

## 主要な機能

| 機能 | 説明 |
|------|------|
| Payment Intent | 1回限りの決済 |
| Checkout Session | Stripe がホストする決済ページ |
| Subscriptions | 定期課金 |
| Invoices | 請求書発行 |
| Connect | マーケットプレイス決済 |
| Radar | 不正検知 |

## セットアップ

### 1. アカウント作成

[Stripe Dashboard](https://dashboard.stripe.com/) でアカウント作成

### 2. API キー取得

```env
# .env.local
STRIPE_SECRET_KEY=sk_test_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

### 3. SDK インストール

```bash
npm install stripe @stripe/stripe-js @stripe/react-stripe-js
```

### 4. サーバーサイド設定

```typescript
// lib/stripe.ts
import Stripe from 'stripe';

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16',
  typescript: true,
});
```

### 5. クライアントサイド設定

```typescript
// lib/stripe-client.ts
import { loadStripe } from '@stripe/stripe-js';

export const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!
);
```

## 最初の決済

```typescript
// 1. サーバー: PaymentIntent 作成
// app/api/payment/route.ts
export async function POST(req: Request) {
  const { amount } = await req.json();

  const paymentIntent = await stripe.paymentIntents.create({
    amount,
    currency: 'jpy',
    automatic_payment_methods: { enabled: true },
  });

  return Response.json({ clientSecret: paymentIntent.client_secret });
}

// 2. クライアント: 決済フォーム表示
'use client';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';

function CheckoutForm() {
  const stripe = useStripe();
  const elements = useElements();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) return;

    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/complete`,
      },
    });

    if (error) alert(error.message);
  };

  return (
    <form onSubmit={handleSubmit}>
      <PaymentElement />
      <button type="submit" disabled={!stripe}>支払う</button>
    </form>
  );
}

export function Checkout({ clientSecret }: { clientSecret: string }) {
  return (
    <Elements stripe={stripePromise} options={{ clientSecret }}>
      <CheckoutForm />
    </Elements>
  );
}
```

## テストカード

| カード番号 | 結果 |
|-----------|------|
| 4242424242424242 | 成功 |
| 4000000000000002 | カード拒否 |
| 4000002500003155 | 3D セキュア必要 |

## 料金体系

- 決済手数料: 3.6% (日本のカード)
- 月額固定費: なし
- 初期費用: なし

## 次のステップ

次章では、Stripe のセットアップと基本設定について詳しく学びます。
