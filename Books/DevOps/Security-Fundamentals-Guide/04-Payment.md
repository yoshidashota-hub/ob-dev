# 第4章: 決済セキュリティ

## PCI DSS 概要

```
┌────────────────────────────────────────────────────────────┐
│           PCI DSS (Payment Card Industry                    │
│            Data Security Standard)                          │
│                                                            │
│  カード情報を扱う全ての事業者が準拠すべきセキュリティ基準     │
│                                                            │
│  6つの目標と12の要件:                                       │
│                                                            │
│  1. 安全なネットワークの構築                                │
│     • 要件1: ファイアウォールの設置                        │
│     • 要件2: デフォルトパスワードの変更                     │
│                                                            │
│  2. カード会員データの保護                                  │
│     • 要件3: 保存データの保護                              │
│     • 要件4: 転送データの暗号化                            │
│                                                            │
│  3. 脆弱性管理プログラム                                    │
│     • 要件5: ウイルス対策                                  │
│     • 要件6: 安全なシステム開発                            │
│                                                            │
│  4. 強力なアクセス制御                                      │
│     • 要件7: アクセス制限                                  │
│     • 要件8: ユーザー認証                                  │
│     • 要件9: 物理的アクセス制限                            │
│                                                            │
│  5. ネットワークの監視とテスト                              │
│     • 要件10: アクセス追跡と監視                           │
│     • 要件11: セキュリティテスト                           │
│                                                            │
│  6. 情報セキュリティポリシー                                │
│     • 要件12: セキュリティポリシーの維持                    │
└────────────────────────────────────────────────────────────┘
```

## SAQ（自己評価質問票）レベル

```
┌────────────────────────────────────────────────────────────┐
│                    SAQ レベル                               │
│                                                            │
│  SAQ A:                                                    │
│  • カード情報を一切扱わない                                 │
│  • Stripe Checkout 等の完全な外部委託                      │
│  • 最も簡単な準拠                                          │
│                                                            │
│  SAQ A-EP:                                                 │
│  • カード入力を自サイトで行う                               │
│  • データは PSP に直接送信                                  │
│  • Stripe Elements 等                                      │
│                                                            │
│  SAQ D:                                                    │
│  • カードデータを自社で処理/保存                            │
│  • 最も厳しい要件                                          │
│  • 避けるべき                                              │
└────────────────────────────────────────────────────────────┘
```

## Stripe の安全な実装

### Stripe Elements（SAQ A-EP 対応）

```typescript
// components/PaymentForm.tsx
"use client";

import { useState } from "react";
import {
  Elements,
  CardElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

function CheckoutForm({ clientSecret }: { clientSecret: string }) {
  const stripe = useStripe();
  const elements = useElements();
  const [error, setError] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) return;

    setProcessing(true);
    setError(null);

    const { error, paymentIntent } = await stripe.confirmCardPayment(
      clientSecret,
      {
        payment_method: {
          card: elements.getElement(CardElement)!,
        },
      }
    );

    if (error) {
      setError(error.message || "支払いに失敗しました");
      setProcessing(false);
    } else if (paymentIntent?.status === "succeeded") {
      // 成功処理（サーバー側で Webhook で確認）
      window.location.href = "/checkout/success";
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <CardElement
        options={{
          style: {
            base: {
              fontSize: "16px",
              color: "#424770",
            },
          },
          hidePostalCode: true,
        }}
      />
      {error && <div className="text-red-500 mt-2">{error}</div>}
      <button
        type="submit"
        disabled={!stripe || processing}
        className="mt-4 w-full bg-blue-500 text-white py-2 rounded disabled:opacity-50"
      >
        {processing ? "処理中..." : "支払う"}
      </button>
    </form>
  );
}

export function PaymentForm({ clientSecret }: { clientSecret: string }) {
  return (
    <Elements stripe={stripePromise}>
      <CheckoutForm clientSecret={clientSecret} />
    </Elements>
  );
}
```

### PaymentIntent の作成（サーバー側）

```typescript
// app/api/payment/create-intent/route.ts
import Stripe from "stripe";
import { getSession } from "@/lib/auth";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2023-10-16",
});

export async function POST(req: Request) {
  const session = await getSession();
  if (!session) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { amount, orderId } = await req.json();

  // 金額の検証
  if (typeof amount !== "number" || amount < 50) {
    return Response.json({ error: "Invalid amount" }, { status: 400 });
  }

  // 注文の存在確認
  const order = await prisma.order.findUnique({
    where: { id: orderId, userId: session.user.id },
  });

  if (!order) {
    return Response.json({ error: "Order not found" }, { status: 404 });
  }

  // 二重支払い防止
  if (order.paymentStatus === "paid") {
    return Response.json({ error: "Already paid" }, { status: 400 });
  }

  try {
    // Idempotency Key で重複リクエスト防止
    const paymentIntent = await stripe.paymentIntents.create(
      {
        amount,
        currency: "jpy",
        metadata: {
          orderId,
          userId: session.user.id,
        },
        // 3D セキュア設定
        payment_method_options: {
          card: {
            request_three_d_secure: "automatic",
          },
        },
      },
      {
        idempotencyKey: `order_${orderId}`,
      }
    );

    // PaymentIntent ID を保存
    await prisma.order.update({
      where: { id: orderId },
      data: { stripePaymentIntentId: paymentIntent.id },
    });

    return Response.json({
      clientSecret: paymentIntent.client_secret,
    });
  } catch (error) {
    console.error("Stripe error:", error);
    return Response.json(
      { error: "Payment initialization failed" },
      { status: 500 }
    );
  }
}
```

### Webhook の安全な処理

```typescript
// app/api/webhooks/stripe/route.ts
import Stripe from "stripe";
import { headers } from "next/headers";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2023-10-16",
});

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export async function POST(req: Request) {
  const body = await req.text();
  const signature = headers().get("stripe-signature")!;

  let event: Stripe.Event;

  // 署名検証（必須！）
  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err) {
    console.error("Webhook signature verification failed");
    return Response.json({ error: "Invalid signature" }, { status: 400 });
  }

  // イベント処理
  switch (event.type) {
    case "payment_intent.succeeded": {
      const paymentIntent = event.data.object as Stripe.PaymentIntent;
      await handlePaymentSuccess(paymentIntent);
      break;
    }

    case "payment_intent.payment_failed": {
      const paymentIntent = event.data.object as Stripe.PaymentIntent;
      await handlePaymentFailure(paymentIntent);
      break;
    }

    case "charge.dispute.created": {
      const dispute = event.data.object as Stripe.Dispute;
      await handleDispute(dispute);
      break;
    }
  }

  return Response.json({ received: true });
}

async function handlePaymentSuccess(paymentIntent: Stripe.PaymentIntent) {
  const { orderId } = paymentIntent.metadata;

  await prisma.order.update({
    where: { id: orderId },
    data: {
      paymentStatus: "paid",
      paidAt: new Date(),
    },
  });

  // 確認メール送信等の後続処理
}

async function handlePaymentFailure(paymentIntent: Stripe.PaymentIntent) {
  const { orderId } = paymentIntent.metadata;

  await prisma.order.update({
    where: { id: orderId },
    data: {
      paymentStatus: "failed",
      paymentError: paymentIntent.last_payment_error?.message,
    },
  });
}
```

## 不正検知

### 基本的なチェック

```typescript
// lib/fraud-detection.ts
interface FraudCheckResult {
  riskScore: number;
  flags: string[];
  blocked: boolean;
}

export async function checkFraud(
  userId: string,
  amount: number,
  ipAddress: string
): Promise<FraudCheckResult> {
  const flags: string[] = [];
  let riskScore = 0;

  // 1. 高額取引チェック
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      orders: {
        where: { paymentStatus: "paid" },
        orderBy: { createdAt: "desc" },
        take: 10,
      },
    },
  });

  const avgOrderAmount =
    user?.orders.reduce((sum, o) => sum + o.amount, 0) / (user?.orders.length || 1);

  if (amount > avgOrderAmount * 3) {
    flags.push("UNUSUAL_AMOUNT");
    riskScore += 30;
  }

  // 2. 短時間での複数注文
  const recentOrders = await prisma.order.count({
    where: {
      userId,
      createdAt: { gte: new Date(Date.now() - 60 * 60 * 1000) }, // 1時間以内
    },
  });

  if (recentOrders > 5) {
    flags.push("HIGH_FREQUENCY");
    riskScore += 40;
  }

  // 3. 新規ユーザーの高額注文
  const accountAge = Date.now() - new Date(user!.createdAt).getTime();
  const isNewAccount = accountAge < 24 * 60 * 60 * 1000; // 24時間以内

  if (isNewAccount && amount > 10000) {
    flags.push("NEW_ACCOUNT_HIGH_VALUE");
    riskScore += 25;
  }

  // 4. IP アドレスチェック
  const ipOrders = await prisma.order.count({
    where: {
      ipAddress,
      userId: { not: userId },
      createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
    },
  });

  if (ipOrders > 0) {
    flags.push("SHARED_IP");
    riskScore += 20;
  }

  return {
    riskScore,
    flags,
    blocked: riskScore >= 70,
  };
}
```

### Stripe Radar との統合

```typescript
// Stripe Radar のルールを活用
const paymentIntent = await stripe.paymentIntents.create({
  amount,
  currency: "jpy",
  // Radar の追加情報
  metadata: {
    orderId,
    userId: session.user.id,
  },
  // Radar ルール用の追加データ
  payment_method_options: {
    card: {
      request_three_d_secure: "automatic",
    },
  },
});

// Webhook で Radar の判定結果を確認
case "radar.early_fraud_warning.created": {
  const warning = event.data.object;
  // 警告を記録、必要に応じて返金
  break;
}
```

## PayPay 統合

```typescript
// lib/paypay.ts
import PAYPAY from "@paypay/paypay-node";

const paypay = new PAYPAY({
  apiKey: process.env.PAYPAY_API_KEY!,
  apiSecret: process.env.PAYPAY_API_SECRET!,
  merchantId: process.env.PAYPAY_MERCHANT_ID!,
  productionMode: process.env.NODE_ENV === "production",
});

export async function createPayPayPayment(
  orderId: string,
  amount: number,
  orderDescription: string
) {
  const payload = {
    merchantPaymentId: orderId,
    amount: {
      amount,
      currency: "JPY",
    },
    orderDescription,
    redirectUrl: `${process.env.NEXT_PUBLIC_URL}/checkout/complete`,
    redirectType: "WEB_LINK",
    userAgent: "Mozilla/5.0",
  };

  const response = await paypay.CreateCode(payload);

  if (response.BODY.resultInfo.code !== "SUCCESS") {
    throw new Error(response.BODY.resultInfo.message);
  }

  return {
    paymentUrl: response.BODY.data.url,
    codeId: response.BODY.data.codeId,
  };
}

export async function getPayPayPaymentStatus(merchantPaymentId: string) {
  const response = await paypay.GetCodePaymentDetails([merchantPaymentId]);
  return response.BODY.data;
}
```

## セキュリティチェックリスト

```
□ カード情報は一切保存しない（Stripe/PayPay に委託）
□ HTTPS を強制
□ Webhook の署名を検証
□ Idempotency Key で重複処理を防止
□ 金額は必ずサーバー側で検証
□ 3D セキュアを有効化
□ 不正検知ルールを設定
□ PCI DSS 準拠レベルを確認
□ テスト環境と本番環境を完全に分離
□ 監査ログを記録
```

## 次のステップ

次章では、インフラセキュリティについて学びます。
