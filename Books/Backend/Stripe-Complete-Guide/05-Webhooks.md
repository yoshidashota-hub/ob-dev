# 第5章: Webhooks

## Webhook とは

Stripe からアプリケーションへの非同期通知。

```
┌─────────────────────────────────────────────────────┐
│                 Webhook Flow                         │
│                                                     │
│  Stripe                    Your Server              │
│  ┌────────┐               ┌────────────┐           │
│  │ Event  │──────────────▶│  Webhook   │           │
│  │ occurs │               │  Endpoint  │           │
│  └────────┘               └─────┬──────┘           │
│                                 │                   │
│                                 ▼                   │
│                           Verify signature          │
│                                 │                   │
│                                 ▼                   │
│                           Process event             │
│                                 │                   │
│                                 ▼                   │
│                           Return 200 OK             │
└─────────────────────────────────────────────────────┘
```

## エンドポイントの作成

### Next.js App Router

```typescript
// app/api/webhooks/stripe/route.ts
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import Stripe from "stripe";
import { stripe } from "@/lib/stripe";

export async function POST(req: Request) {
  const body = await req.text();
  const signature = headers().get("stripe-signature")!;

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!,
    );
  } catch (err) {
    console.error("Webhook signature verification failed:", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed":
        await handleCheckoutCompleted(event.data.object);
        break;

      case "customer.subscription.created":
        await handleSubscriptionCreated(event.data.object);
        break;

      case "customer.subscription.updated":
        await handleSubscriptionUpdated(event.data.object);
        break;

      case "customer.subscription.deleted":
        await handleSubscriptionDeleted(event.data.object);
        break;

      case "invoice.paid":
        await handleInvoicePaid(event.data.object);
        break;

      case "invoice.payment_failed":
        await handlePaymentFailed(event.data.object);
        break;

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (err) {
    console.error("Webhook handler error:", err);
    return NextResponse.json(
      { error: "Webhook handler failed" },
      { status: 500 },
    );
  }
}
```

### イベントハンドラー

```typescript
// lib/stripe/handlers.ts
import Stripe from "stripe";
import { prisma } from "@/lib/prisma";

export async function handleCheckoutCompleted(
  session: Stripe.Checkout.Session,
) {
  const customerId = session.customer as string;
  const subscriptionId = session.subscription as string;

  if (session.mode === "subscription") {
    // サブスクリプション開始
    await prisma.user.update({
      where: { stripeCustomerId: customerId },
      data: {
        subscriptionId,
        subscriptionStatus: "active",
      },
    });
  } else if (session.mode === "payment") {
    // 一回払い
    await prisma.order.create({
      data: {
        stripeSessionId: session.id,
        customerId,
        amount: session.amount_total!,
        status: "completed",
      },
    });
  }
}

export async function handleSubscriptionCreated(
  subscription: Stripe.Subscription,
) {
  await prisma.user.update({
    where: { stripeCustomerId: subscription.customer as string },
    data: {
      subscriptionId: subscription.id,
      subscriptionStatus: subscription.status,
      currentPeriodEnd: new Date(subscription.current_period_end * 1000),
    },
  });
}

export async function handleSubscriptionUpdated(
  subscription: Stripe.Subscription,
) {
  await prisma.user.update({
    where: { stripeCustomerId: subscription.customer as string },
    data: {
      subscriptionStatus: subscription.status,
      currentPeriodEnd: new Date(subscription.current_period_end * 1000),
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
    },
  });
}

export async function handleSubscriptionDeleted(
  subscription: Stripe.Subscription,
) {
  await prisma.user.update({
    where: { stripeCustomerId: subscription.customer as string },
    data: {
      subscriptionId: null,
      subscriptionStatus: "canceled",
    },
  });
}

export async function handleInvoicePaid(invoice: Stripe.Invoice) {
  // 請求書支払い完了時の処理
  console.log(`Invoice ${invoice.id} paid`);
}

export async function handlePaymentFailed(invoice: Stripe.Invoice) {
  // 支払い失敗時の処理（メール通知など）
  const customerId = invoice.customer as string;

  await prisma.user.update({
    where: { stripeCustomerId: customerId },
    data: { subscriptionStatus: "past_due" },
  });

  // 通知メール送信
  // await sendPaymentFailedEmail(customerId);
}
```

## ローカルテスト

### Stripe CLI

```bash
# Webhook をローカルに転送
stripe listen --forward-to localhost:3000/api/webhooks/stripe

# 出力される webhook secret をコピー
# whsec_xxx...

# イベントをトリガー
stripe trigger checkout.session.completed
stripe trigger customer.subscription.created
stripe trigger invoice.payment_failed
```

## 重要なイベント

### 決済関連

```typescript
const paymentEvents = [
  "payment_intent.succeeded",      // 決済成功
  "payment_intent.payment_failed", // 決済失敗
  "payment_intent.canceled",       // 決済キャンセル
  "charge.refunded",               // 返金
  "charge.dispute.created",        // チャージバック
];
```

### サブスクリプション関連

```typescript
const subscriptionEvents = [
  "customer.subscription.created",       // 作成
  "customer.subscription.updated",       // 更新
  "customer.subscription.deleted",       // 削除
  "customer.subscription.trial_will_end", // トライアル終了3日前
  "customer.subscription.paused",        // 一時停止
  "customer.subscription.resumed",       // 再開
];
```

### 請求書関連

```typescript
const invoiceEvents = [
  "invoice.created",         // 請求書作成
  "invoice.finalized",       // 請求書確定
  "invoice.paid",            // 支払い完了
  "invoice.payment_failed",  // 支払い失敗
  "invoice.upcoming",        // 次回請求書（3日前）
];
```

### Checkout 関連

```typescript
const checkoutEvents = [
  "checkout.session.completed",       // 完了
  "checkout.session.async_payment_succeeded", // 非同期決済成功
  "checkout.session.async_payment_failed",    // 非同期決済失敗
  "checkout.session.expired",         // 期限切れ
];
```

## べスト プラクティス

### 冪等性

```typescript
export async function handleCheckoutCompleted(
  session: Stripe.Checkout.Session,
) {
  // 既に処理済みかチェック
  const existingOrder = await prisma.order.findUnique({
    where: { stripeSessionId: session.id },
  });

  if (existingOrder) {
    console.log(`Order already processed: ${session.id}`);
    return;
  }

  // 注文処理
  await prisma.order.create({
    data: {
      stripeSessionId: session.id,
      // ...
    },
  });
}
```

### エラーハンドリング

```typescript
export async function POST(req: Request) {
  // ...

  try {
    await processEvent(event);
    return NextResponse.json({ received: true });
  } catch (err) {
    // エラーをログに記録しつつ、200を返す
    // Stripeがリトライするため
    console.error("Webhook error:", err);

    // 重要なエラーは通知
    await notifyAdmin(err, event);

    return NextResponse.json({ received: true });
  }
}
```

### タイムアウト対策

```typescript
// 重い処理は非同期で実行
export async function handleCheckoutCompleted(
  session: Stripe.Checkout.Session,
) {
  // すぐに応答を返すため、非同期処理をキューに入れる
  await queue.add("process-order", {
    sessionId: session.id,
  });
}
```

## Dashboard での設定

```
Developers → Webhooks → Add endpoint

- Endpoint URL: https://your-domain.com/api/webhooks/stripe
- Events to send: 必要なイベントを選択
```

## 次のステップ

次章では、顧客管理について詳しく学びます。
