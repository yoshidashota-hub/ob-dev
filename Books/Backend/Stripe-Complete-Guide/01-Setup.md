# 第1章: セットアップ

## Stripe アカウント

### アカウント作成

1. [Stripe Dashboard](https://dashboard.stripe.com/register) でアカウント作成
2. メール認証
3. ビジネス情報の入力（テストモードでは不要）

### API キー取得

```
Dashboard → Developers → API keys

テスト用:
- Publishable key: pk_test_...
- Secret key: sk_test_...

本番用:
- Publishable key: pk_live_...
- Secret key: sk_live_...
```

## Next.js プロジェクトのセットアップ

### インストール

```bash
npm install stripe @stripe/stripe-js @stripe/react-stripe-js
```

### 環境変数

```env
# .env.local
STRIPE_SECRET_KEY=sk_test_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

### サーバーサイド設定

```typescript
// lib/stripe.ts
import Stripe from "stripe";

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2024-04-10",
  typescript: true,
});
```

### クライアントサイド設定

```typescript
// lib/stripe-client.ts
import { loadStripe } from "@stripe/stripe-js";

export const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!,
);
```

## Stripe CLI

### インストール

```bash
# macOS
brew install stripe/stripe-cli/stripe

# Windows
scoop install stripe

# Linux
# https://stripe.com/docs/stripe-cli
```

### ログイン

```bash
stripe login
```

### よく使うコマンド

```bash
# Webhook イベントのリッスン
stripe listen --forward-to localhost:3000/api/webhooks/stripe

# イベントのトリガー
stripe trigger payment_intent.succeeded

# ログの確認
stripe logs tail

# リソースの一覧
stripe customers list
stripe products list
stripe prices list
```

## テストカード

| カード番号 | 説明 |
|-----------|------|
| 4242 4242 4242 4242 | 成功 |
| 4000 0000 0000 0002 | カード拒否 |
| 4000 0000 0000 9995 | 残高不足 |
| 4000 0025 0000 3155 | 3D セキュア必要 |
| 4000 0000 0000 0341 | カード番号エラー |

### テストカードの使用

```
カード番号: 4242 4242 4242 4242
有効期限: 未来の日付（例: 12/34）
CVC: 任意の3桁（例: 123）
郵便番号: 任意の5桁（例: 12345）
```

## プロジェクト構成

```
src/
├── app/
│   ├── api/
│   │   ├── checkout/
│   │   │   └── route.ts
│   │   ├── webhooks/
│   │   │   └── stripe/
│   │   │       └── route.ts
│   │   └── stripe/
│   │       ├── create-payment-intent/
│   │       ├── create-subscription/
│   │       └── create-customer/
│   └── checkout/
│       └── page.tsx
├── components/
│   └── stripe/
│       ├── CheckoutForm.tsx
│       ├── PaymentForm.tsx
│       └── SubscriptionForm.tsx
└── lib/
    ├── stripe.ts        # サーバーサイド
    └── stripe-client.ts # クライアントサイド
```

## 最初の決済テスト

### サーバー側

```typescript
// app/api/checkout/route.ts
import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";

export async function POST(req: Request) {
  try {
    const { amount } = await req.json();

    const paymentIntent = await stripe.paymentIntents.create({
      amount,  // 最小単位（円）
      currency: "jpy",
      automatic_payment_methods: { enabled: true },
    });

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Payment intent creation failed" },
      { status: 500 },
    );
  }
}
```

### クライアント側

```typescript
// app/checkout/page.tsx
"use client";

import { useState, useEffect } from "react";
import { Elements } from "@stripe/react-stripe-js";
import { stripePromise } from "@/lib/stripe-client";
import { PaymentForm } from "@/components/stripe/PaymentForm";

export default function CheckoutPage() {
  const [clientSecret, setClientSecret] = useState("");

  useEffect(() => {
    fetch("/api/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ amount: 1000 }),  // ¥1,000
    })
      .then((res) => res.json())
      .then((data) => setClientSecret(data.clientSecret));
  }, []);

  if (!clientSecret) {
    return <div>Loading...</div>;
  }

  return (
    <Elements
      stripe={stripePromise}
      options={{
        clientSecret,
        appearance: { theme: "stripe" },
      }}
    >
      <PaymentForm />
    </Elements>
  );
}
```

```typescript
// components/stripe/PaymentForm.tsx
"use client";

import { useState } from "react";
import {
  PaymentElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";

export function PaymentForm() {
  const stripe = useStripe();
  const elements = useElements();
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) return;

    setIsLoading(true);

    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/checkout/complete`,
      },
    });

    if (error) {
      setMessage(error.message || "決済エラーが発生しました");
    }

    setIsLoading(false);
  };

  return (
    <form onSubmit={handleSubmit}>
      <PaymentElement />
      <button disabled={!stripe || isLoading}>
        {isLoading ? "処理中..." : "支払う"}
      </button>
      {message && <p>{message}</p>}
    </form>
  );
}
```

## 次のステップ

次章では、Payment Intent について詳しく学びます。
