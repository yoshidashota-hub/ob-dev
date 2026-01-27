# 決済システム 学習ノート

## 概要

Web アプリケーションにおける決済システムの実装。Stripe を中心に学ぶ。

## 決済フロー

```
┌──────────┐     ┌──────────┐     ┌──────────┐
│  Client  │ ──▶ │  Server  │ ──▶ │  Stripe  │
│          │     │          │     │          │
│ カード情報 │     │ Intent   │     │ 決済処理  │
│ 入力      │ ◀── │ 作成     │ ◀── │          │
└──────────┘     └──────────┘     └──────────┘
```

## Stripe セットアップ

```bash
npm install stripe @stripe/stripe-js @stripe/react-stripe-js
```

```env
# .env.local
STRIPE_SECRET_KEY=sk_test_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

## Payment Intent（推奨）

### サーバーサイド

```typescript
// lib/stripe.ts
import Stripe from 'stripe';

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16',
});

// app/api/payment/create-intent/route.ts
import { stripe } from '@/lib/stripe';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  const { amount, currency = 'jpy', metadata } = await req.json();

  const paymentIntent = await stripe.paymentIntents.create({
    amount,
    currency,
    automatic_payment_methods: { enabled: true },
    metadata,
  });

  return NextResponse.json({
    clientSecret: paymentIntent.client_secret,
  });
}
```

### クライアントサイド

```typescript
// components/CheckoutForm.tsx
'use client';

import { loadStripe } from '@stripe/stripe-js';
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements,
} from '@stripe/react-stripe-js';
import { useState } from 'react';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

function CheckoutForm() {
  const stripe = useStripe();
  const elements = useElements();
  const [error, setError] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) return;

    setProcessing(true);
    setError(null);

    const { error: submitError } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/payment/complete`,
      },
    });

    if (submitError) {
      setError(submitError.message ?? 'Payment failed');
      setProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <PaymentElement />
      {error && <p className="text-red-500">{error}</p>}
      <button
        type="submit"
        disabled={!stripe || processing}
        className="mt-4 px-4 py-2 bg-blue-500 text-white rounded"
      >
        {processing ? '処理中...' : '支払う'}
      </button>
    </form>
  );
}

export function Checkout({ clientSecret }: { clientSecret: string }) {
  return (
    <Elements
      stripe={stripePromise}
      options={{
        clientSecret,
        appearance: { theme: 'stripe' },
      }}
    >
      <CheckoutForm />
    </Elements>
  );
}
```

## Webhook 処理

```typescript
// app/api/webhook/stripe/route.ts
import { stripe } from '@/lib/stripe';
import { headers } from 'next/headers';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  const body = await req.text();
  const signature = headers().get('stripe-signature')!;

  let event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  switch (event.type) {
    case 'payment_intent.succeeded':
      const paymentIntent = event.data.object;
      await handlePaymentSuccess(paymentIntent);
      break;

    case 'payment_intent.payment_failed':
      const failedIntent = event.data.object;
      await handlePaymentFailure(failedIntent);
      break;

    case 'customer.subscription.created':
    case 'customer.subscription.updated':
    case 'customer.subscription.deleted':
      const subscription = event.data.object;
      await handleSubscriptionChange(subscription);
      break;
  }

  return NextResponse.json({ received: true });
}

async function handlePaymentSuccess(paymentIntent: any) {
  await prisma.order.update({
    where: { paymentIntentId: paymentIntent.id },
    data: { status: 'paid', paidAt: new Date() },
  });
}
```

## サブスクリプション

```typescript
// サブスクリプション作成
export async function createSubscription(customerId: string, priceId: string) {
  const subscription = await stripe.subscriptions.create({
    customer: customerId,
    items: [{ price: priceId }],
    payment_behavior: 'default_incomplete',
    expand: ['latest_invoice.payment_intent'],
  });

  return {
    subscriptionId: subscription.id,
    clientSecret: (subscription.latest_invoice as any).payment_intent.client_secret,
  };
}

// 顧客作成
export async function createCustomer(email: string, name: string) {
  return stripe.customers.create({ email, name });
}

// サブスクリプション解約
export async function cancelSubscription(subscriptionId: string) {
  return stripe.subscriptions.cancel(subscriptionId);
}
```

## Checkout Session（簡易版）

```typescript
// app/api/checkout/route.ts
export async function POST(req: Request) {
  const { priceId, successUrl, cancelUrl } = await req.json();

  const session = await stripe.checkout.sessions.create({
    mode: 'subscription', // 'payment' | 'subscription' | 'setup'
    payment_method_types: ['card'],
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: successUrl,
    cancel_url: cancelUrl,
  });

  return NextResponse.json({ url: session.url });
}
```

## セキュリティ

1. **秘密鍵はサーバーサイドのみ**
2. **Webhook 署名を検証**
3. **冪等性キーを使用**
4. **PCI DSS 準拠**（カード情報は Stripe が処理）

## テスト

```typescript
// テスト用カード番号
const TEST_CARDS = {
  success: '4242424242424242',
  decline: '4000000000000002',
  requires3DS: '4000002500003155',
};
```

## 参考リソース

- [Stripe ドキュメント](https://stripe.com/docs)
- [Stripe + Next.js](https://github.com/vercel/nextjs-subscription-payments)
