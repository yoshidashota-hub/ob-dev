# 第2章: Payment Intents

## Payment Intent とは

1回限りの決済を処理するための API。

```
┌─────────────────────────────────────────────────────┐
│              Payment Intent Flow                     │
│                                                     │
│  1. Create PaymentIntent (server)                   │
│     │                                               │
│     ▼                                               │
│  2. Return client_secret to frontend                │
│     │                                               │
│     ▼                                               │
│  3. Collect payment details (client)                │
│     │                                               │
│     ▼                                               │
│  4. Confirm payment (client)                        │
│     │                                               │
│     ▼                                               │
│  5. Handle result / 3D Secure                       │
│     │                                               │
│     ▼                                               │
│  6. Receive webhook event (server)                  │
└─────────────────────────────────────────────────────┘
```

## PaymentIntent の作成

### 基本

```typescript
// app/api/create-payment-intent/route.ts
import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";

export async function POST(req: Request) {
  const { amount, currency = "jpy", metadata } = await req.json();

  const paymentIntent = await stripe.paymentIntents.create({
    amount,
    currency,
    automatic_payment_methods: { enabled: true },
    metadata,
  });

  return NextResponse.json({
    clientSecret: paymentIntent.client_secret,
    paymentIntentId: paymentIntent.id,
  });
}
```

### 詳細オプション

```typescript
const paymentIntent = await stripe.paymentIntents.create({
  amount: 10000,  // ¥10,000
  currency: "jpy",

  // 支払い方法
  automatic_payment_methods: { enabled: true },
  // または特定の支払い方法のみ
  // payment_method_types: ["card", "konbini"],

  // 顧客情報
  customer: "cus_xxx",  // 既存の顧客
  receipt_email: "customer@example.com",

  // メタデータ
  metadata: {
    orderId: "order_123",
    productId: "prod_456",
  },

  // 説明
  description: "商品購入",
  statement_descriptor: "MYSHOP",  // 明細に表示（22文字以内）

  // キャプチャ設定
  capture_method: "automatic",  // または "manual"

  // 配送情報
  shipping: {
    name: "田中太郎",
    address: {
      line1: "東京都渋谷区...",
      postal_code: "150-0001",
      country: "JP",
    },
  },
});
```

## クライアントでの確認

### PaymentElement（推奨）

```typescript
"use client";

import {
  PaymentElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";

export function CheckoutForm() {
  const stripe = useStripe();
  const elements = useElements();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) return;

    const { error, paymentIntent } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/checkout/complete`,
      },
      redirect: "if_required",
    });

    if (error) {
      console.error(error);
    } else if (paymentIntent?.status === "succeeded") {
      // 決済成功
      console.log("Payment succeeded!");
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <PaymentElement
        options={{
          layout: "tabs",  // または "accordion"
        }}
      />
      <button type="submit" disabled={!stripe}>
        支払う
      </button>
    </form>
  );
}
```

### CardElement（カードのみ）

```typescript
import { CardElement, useStripe, useElements } from "@stripe/react-stripe-js";

export function CardForm({ clientSecret }: { clientSecret: string }) {
  const stripe = useStripe();
  const elements = useElements();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) return;

    const cardElement = elements.getElement(CardElement);
    if (!cardElement) return;

    const { error, paymentIntent } = await stripe.confirmCardPayment(
      clientSecret,
      {
        payment_method: {
          card: cardElement,
          billing_details: {
            name: "田中太郎",
            email: "tanaka@example.com",
          },
        },
      },
    );

    if (error) {
      console.error(error);
    } else if (paymentIntent.status === "succeeded") {
      console.log("Payment succeeded!");
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <CardElement />
      <button type="submit">支払う</button>
    </form>
  );
}
```

## 手動キャプチャ

```typescript
// 1. オーソリゼーションのみ（capture_method: "manual"）
const paymentIntent = await stripe.paymentIntents.create({
  amount: 10000,
  currency: "jpy",
  capture_method: "manual",
});

// 2. 後でキャプチャ（7日以内）
const captured = await stripe.paymentIntents.capture(paymentIntent.id);

// 部分キャプチャ
const partialCapture = await stripe.paymentIntents.capture(paymentIntent.id, {
  amount_to_capture: 5000,  // 一部のみ
});

// キャンセル
const canceled = await stripe.paymentIntents.cancel(paymentIntent.id);
```

## 決済完了ページ

```typescript
// app/checkout/complete/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { stripePromise } from "@/lib/stripe-client";

export default function CompletePage() {
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");

  useEffect(() => {
    const clientSecret = searchParams.get("payment_intent_client_secret");
    if (!clientSecret) return;

    stripePromise.then(async (stripe) => {
      if (!stripe) return;

      const { paymentIntent } = await stripe.retrievePaymentIntent(clientSecret);

      switch (paymentIntent?.status) {
        case "succeeded":
          setStatus("success");
          break;
        case "processing":
          setStatus("loading");
          break;
        default:
          setStatus("error");
      }
    });
  }, [searchParams]);

  if (status === "loading") {
    return <p>処理中...</p>;
  }

  if (status === "success") {
    return (
      <div>
        <h1>決済完了</h1>
        <p>ご注文ありがとうございます。</p>
      </div>
    );
  }

  return (
    <div>
      <h1>決済失敗</h1>
      <p>決済処理に失敗しました。</p>
    </div>
  );
}
```

## 返金

```typescript
// 全額返金
const refund = await stripe.refunds.create({
  payment_intent: "pi_xxx",
});

// 部分返金
const partialRefund = await stripe.refunds.create({
  payment_intent: "pi_xxx",
  amount: 5000,  // ¥5,000 のみ返金
});

// 返金理由
const refundWithReason = await stripe.refunds.create({
  payment_intent: "pi_xxx",
  reason: "requested_by_customer",  // または "duplicate", "fraudulent"
});
```

## エラーハンドリング

```typescript
try {
  const paymentIntent = await stripe.paymentIntents.create({
    amount: 10000,
    currency: "jpy",
  });
} catch (error) {
  if (error instanceof Stripe.errors.StripeCardError) {
    // カードエラー
    console.log("Card declined:", error.message);
  } else if (error instanceof Stripe.errors.StripeRateLimitError) {
    // レート制限
    console.log("Too many requests");
  } else if (error instanceof Stripe.errors.StripeInvalidRequestError) {
    // 無効なリクエスト
    console.log("Invalid request:", error.message);
  } else {
    // その他のエラー
    console.log("Error:", error);
  }
}
```

## 次のステップ

次章では、Checkout Session について詳しく学びます。
