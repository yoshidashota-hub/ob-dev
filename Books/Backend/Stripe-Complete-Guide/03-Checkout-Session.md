# 第3章: Checkout Session

## Checkout Session とは

Stripe がホストする決済ページ。カスタマイズ可能で安全な決済フローを提供。

```
┌─────────────────────────────────────────────────────┐
│               Checkout Flow                          │
│                                                     │
│  Your Site              Stripe Checkout             │
│  ┌─────────┐           ┌─────────────────┐         │
│  │ Cart    │──────────▶│ Payment Page    │         │
│  │ Page    │           │ (Stripe hosted) │         │
│  └─────────┘           └────────┬────────┘         │
│                                 │                   │
│       ┌─────────────────────────┘                   │
│       ▼                                             │
│  ┌─────────┐                                        │
│  │ Success │                                        │
│  │ Page    │                                        │
│  └─────────┘                                        │
└─────────────────────────────────────────────────────┘
```

## セッション作成

### 基本

```typescript
// app/api/checkout/session/route.ts
import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";

export async function POST(req: Request) {
  const { items } = await req.json();

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    payment_method_types: ["card"],
    line_items: items.map((item: any) => ({
      price_data: {
        currency: "jpy",
        product_data: {
          name: item.name,
          description: item.description,
          images: [item.image],
        },
        unit_amount: item.price,
      },
      quantity: item.quantity,
    })),
    success_url: `${process.env.NEXT_PUBLIC_APP_URL}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/checkout/cancel`,
  });

  return NextResponse.json({ url: session.url });
}
```

### 既存の Price を使用

```typescript
const session = await stripe.checkout.sessions.create({
  mode: "payment",
  line_items: [
    {
      price: "price_xxx",  // 事前に作成した Price ID
      quantity: 1,
    },
  ],
  success_url: `${process.env.NEXT_PUBLIC_APP_URL}/success`,
  cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/cancel`,
});
```

### 詳細オプション

```typescript
const session = await stripe.checkout.sessions.create({
  mode: "payment",
  line_items: [...],

  // 顧客
  customer: "cus_xxx",  // 既存顧客
  customer_email: "customer@example.com",  // または新規

  // 配送
  shipping_address_collection: {
    allowed_countries: ["JP"],
  },
  shipping_options: [
    {
      shipping_rate_data: {
        type: "fixed_amount",
        fixed_amount: { amount: 500, currency: "jpy" },
        display_name: "通常配送",
        delivery_estimate: {
          minimum: { unit: "business_day", value: 3 },
          maximum: { unit: "business_day", value: 5 },
        },
      },
    },
    {
      shipping_rate_data: {
        type: "fixed_amount",
        fixed_amount: { amount: 1000, currency: "jpy" },
        display_name: "速達",
        delivery_estimate: {
          minimum: { unit: "business_day", value: 1 },
          maximum: { unit: "business_day", value: 2 },
        },
      },
    },
  ],

  // 割引
  discounts: [{ coupon: "coupon_xxx" }],
  allow_promotion_codes: true,

  // 請求先住所
  billing_address_collection: "required",

  // メタデータ
  metadata: {
    orderId: "order_123",
  },

  // リダイレクト URL
  success_url: `${baseUrl}/success?session_id={CHECKOUT_SESSION_ID}`,
  cancel_url: `${baseUrl}/cancel`,

  // 有効期限（30分〜24時間）
  expires_at: Math.floor(Date.now() / 1000) + 30 * 60,

  // ロケール
  locale: "ja",
});
```

## サブスクリプションモード

```typescript
const session = await stripe.checkout.sessions.create({
  mode: "subscription",
  line_items: [
    {
      price: "price_xxx",  // recurring price
      quantity: 1,
    },
  ],
  subscription_data: {
    trial_period_days: 14,  // 無料トライアル
    metadata: {
      planType: "premium",
    },
  },
  success_url: `${baseUrl}/success`,
  cancel_url: `${baseUrl}/cancel`,
});
```

## クライアント側

### リダイレクト方式

```typescript
// components/CheckoutButton.tsx
"use client";

import { useState } from "react";

interface CartItem {
  name: string;
  price: number;
  quantity: number;
}

export function CheckoutButton({ items }: { items: CartItem[] }) {
  const [isLoading, setIsLoading] = useState(false);

  const handleCheckout = async () => {
    setIsLoading(true);

    const response = await fetch("/api/checkout/session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ items }),
    });

    const { url } = await response.json();
    window.location.href = url;  // Stripe Checkout にリダイレクト
  };

  return (
    <button onClick={handleCheckout} disabled={isLoading}>
      {isLoading ? "処理中..." : "購入手続きへ"}
    </button>
  );
}
```

### Stripe.js を使用

```typescript
import { loadStripe } from "@stripe/stripe-js";

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

export function CheckoutButton({ items }: { items: CartItem[] }) {
  const handleCheckout = async () => {
    const stripe = await stripePromise;
    if (!stripe) return;

    const response = await fetch("/api/checkout/session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ items }),
    });

    const { sessionId } = await response.json();

    const { error } = await stripe.redirectToCheckout({ sessionId });
    if (error) {
      console.error(error);
    }
  };

  return <button onClick={handleCheckout}>購入手続きへ</button>;
}
```

## 成功ページ

```typescript
// app/checkout/success/page.tsx
import { stripe } from "@/lib/stripe";

interface Props {
  searchParams: { session_id: string };
}

export default async function SuccessPage({ searchParams }: Props) {
  const session = await stripe.checkout.sessions.retrieve(
    searchParams.session_id,
    {
      expand: ["line_items", "customer"],
    },
  );

  return (
    <div>
      <h1>ご注文ありがとうございます</h1>
      <p>注文番号: {session.id}</p>
      <p>合計: ¥{session.amount_total?.toLocaleString()}</p>

      <h2>ご注文内容</h2>
      <ul>
        {session.line_items?.data.map((item) => (
          <li key={item.id}>
            {item.description} x {item.quantity} - ¥
            {item.amount_total.toLocaleString()}
          </li>
        ))}
      </ul>
    </div>
  );
}
```

## Embedded Checkout

ページ内に Checkout を埋め込む。

```typescript
// サーバー側
const session = await stripe.checkout.sessions.create({
  mode: "payment",
  line_items: [...],
  ui_mode: "embedded",
  return_url: `${baseUrl}/checkout/return?session_id={CHECKOUT_SESSION_ID}`,
});

return NextResponse.json({ clientSecret: session.client_secret });
```

```typescript
// クライアント側
"use client";

import { loadStripe } from "@stripe/stripe-js";
import {
  EmbeddedCheckoutProvider,
  EmbeddedCheckout,
} from "@stripe/react-stripe-js";
import { useCallback } from "react";

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

export function EmbeddedCheckoutPage() {
  const fetchClientSecret = useCallback(async () => {
    const response = await fetch("/api/checkout/embedded", {
      method: "POST",
    });
    const { clientSecret } = await response.json();
    return clientSecret;
  }, []);

  return (
    <EmbeddedCheckoutProvider
      stripe={stripePromise}
      options={{ fetchClientSecret }}
    >
      <EmbeddedCheckout />
    </EmbeddedCheckoutProvider>
  );
}
```

## セッションの取得

```typescript
// セッション情報の取得
const session = await stripe.checkout.sessions.retrieve("cs_xxx", {
  expand: ["line_items", "customer", "payment_intent"],
});

// セッションの一覧
const sessions = await stripe.checkout.sessions.list({
  limit: 10,
  customer: "cus_xxx",
});
```

## 次のステップ

次章では、サブスクリプションについて詳しく学びます。
