# 第4章: サブスクリプション

## サブスクリプションの概念

```
┌─────────────────────────────────────────────────────┐
│               Subscription Model                     │
│                                                     │
│  Product (商品)                                     │
│     └── Price (価格)                                │
│            ├── recurring.interval: month           │
│            └── unit_amount: 1000                   │
│                                                     │
│  Customer (顧客)                                    │
│     └── Subscription (定期購読)                     │
│            ├── Price                               │
│            └── Status: active/canceled/past_due    │
└─────────────────────────────────────────────────────┘
```

## Product と Price の作成

### Dashboard で作成

```
Products → Add product
- Name: プレミアムプラン
- Pricing: ¥1,000 / month (recurring)
```

### API で作成

```typescript
// Product 作成
const product = await stripe.products.create({
  name: "プレミアムプラン",
  description: "すべての機能にアクセスできます",
  metadata: {
    features: "unlimited_access,priority_support",
  },
});

// Price 作成
const price = await stripe.prices.create({
  product: product.id,
  unit_amount: 1000,  // ¥1,000
  currency: "jpy",
  recurring: {
    interval: "month",  // month, year, week, day
    interval_count: 1,
  },
});

// 複数の価格オプション
const yearlyPrice = await stripe.prices.create({
  product: product.id,
  unit_amount: 10000,  // ¥10,000/年（2ヶ月分お得）
  currency: "jpy",
  recurring: {
    interval: "year",
  },
});
```

## サブスクリプション作成

### Checkout Session 経由（推奨）

```typescript
const session = await stripe.checkout.sessions.create({
  mode: "subscription",
  customer: customerId,  // または customer_email
  line_items: [
    {
      price: "price_xxx",
      quantity: 1,
    },
  ],
  subscription_data: {
    trial_period_days: 14,
    metadata: {
      userId: "user_123",
    },
  },
  success_url: `${baseUrl}/subscription/success?session_id={CHECKOUT_SESSION_ID}`,
  cancel_url: `${baseUrl}/subscription/cancel`,
});
```

### API で直接作成

```typescript
// 支払い方法が既に登録されている場合
const subscription = await stripe.subscriptions.create({
  customer: "cus_xxx",
  items: [{ price: "price_xxx" }],
  default_payment_method: "pm_xxx",
  trial_period_days: 14,
  metadata: {
    userId: "user_123",
  },
});
```

## サブスクリプション管理

### ステータス

```typescript
type SubscriptionStatus =
  | "active"         // アクティブ
  | "past_due"       // 支払い遅延
  | "unpaid"         // 未払い
  | "canceled"       // キャンセル済み
  | "incomplete"     // 不完全（最初の支払い失敗）
  | "incomplete_expired"  // 期限切れ
  | "trialing"       // トライアル中
  | "paused";        // 一時停止
```

### 取得

```typescript
// 単一のサブスクリプション
const subscription = await stripe.subscriptions.retrieve("sub_xxx");

// 顧客のサブスクリプション一覧
const subscriptions = await stripe.subscriptions.list({
  customer: "cus_xxx",
  status: "active",
});
```

### 更新

```typescript
// プラン変更
const updated = await stripe.subscriptions.update("sub_xxx", {
  items: [
    {
      id: subscription.items.data[0].id,
      price: "price_new_plan",
    },
  ],
  proration_behavior: "create_prorations",  // 日割り計算
});

// メタデータ更新
await stripe.subscriptions.update("sub_xxx", {
  metadata: { feature_flag: "enabled" },
});
```

### キャンセル

```typescript
// 即時キャンセル
const canceled = await stripe.subscriptions.cancel("sub_xxx");

// 期間終了時にキャンセル
const cancelAtPeriodEnd = await stripe.subscriptions.update("sub_xxx", {
  cancel_at_period_end: true,
});

// キャンセル取り消し
const reactivated = await stripe.subscriptions.update("sub_xxx", {
  cancel_at_period_end: false,
});
```

### 一時停止・再開

```typescript
// 一時停止
const paused = await stripe.subscriptions.update("sub_xxx", {
  pause_collection: {
    behavior: "mark_uncollectible",  // または "keep_as_draft", "void"
  },
});

// 再開
const resumed = await stripe.subscriptions.update("sub_xxx", {
  pause_collection: "",
});
```

## Customer Portal

顧客が自分でサブスクリプションを管理できるポータル。

### 設定

```
Dashboard → Settings → Billing → Customer portal
```

### ポータルセッション作成

```typescript
// app/api/portal/route.ts
import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";

export async function POST(req: Request) {
  const { customerId } = await req.json();

  const session = await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: `${process.env.NEXT_PUBLIC_APP_URL}/account`,
  });

  return NextResponse.json({ url: session.url });
}
```

```typescript
// クライアント
const handleManageSubscription = async () => {
  const response = await fetch("/api/portal", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ customerId: user.stripeCustomerId }),
  });

  const { url } = await response.json();
  window.location.href = url;
};
```

## 使用量ベース課金

```typescript
// Price 作成（使用量ベース）
const meteredPrice = await stripe.prices.create({
  product: "prod_xxx",
  currency: "jpy",
  recurring: {
    interval: "month",
    usage_type: "metered",
  },
  billing_scheme: "per_unit",
  unit_amount: 10,  // 1単位あたり¥10
});

// 使用量の報告
await stripe.subscriptionItems.createUsageRecord(
  "si_xxx",  // subscription item ID
  {
    quantity: 100,
    timestamp: Math.floor(Date.now() / 1000),
    action: "increment",  // または "set"
  },
);
```

## Webhook イベント

```typescript
// 重要なサブスクリプションイベント
const events = [
  "customer.subscription.created",      // 作成
  "customer.subscription.updated",      // 更新
  "customer.subscription.deleted",      // 削除
  "customer.subscription.trial_will_end",  // トライアル終了3日前
  "invoice.paid",                       // 請求書支払い完了
  "invoice.payment_failed",             // 支払い失敗
];
```

## 次のステップ

次章では、Webhook について詳しく学びます。
