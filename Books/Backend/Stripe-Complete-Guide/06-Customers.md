# 第6章: 顧客管理

## Customer オブジェクト

```
┌─────────────────────────────────────────────────────┐
│                 Customer Structure                   │
│                                                     │
│  Customer                                           │
│  ├── id: cus_xxx                                   │
│  ├── email                                         │
│  ├── name                                          │
│  ├── metadata                                      │
│  │                                                 │
│  ├── PaymentMethods[]                              │
│  │   ├── card                                      │
│  │   └── bank_account                              │
│  │                                                 │
│  ├── Subscriptions[]                               │
│  │                                                 │
│  └── Invoices[]                                    │
└─────────────────────────────────────────────────────┘
```

## 顧客の作成

### 基本

```typescript
const customer = await stripe.customers.create({
  email: "customer@example.com",
  name: "田中太郎",
  metadata: {
    userId: "user_123",
  },
});
```

### 詳細オプション

```typescript
const customer = await stripe.customers.create({
  email: "customer@example.com",
  name: "田中太郎",
  phone: "+81-90-1234-5678",

  // 住所
  address: {
    line1: "東京都渋谷区...",
    city: "渋谷区",
    state: "東京都",
    postal_code: "150-0001",
    country: "JP",
  },

  // 配送先住所
  shipping: {
    name: "田中太郎",
    address: {
      line1: "東京都渋谷区...",
      postal_code: "150-0001",
      country: "JP",
    },
  },

  // メタデータ
  metadata: {
    userId: "user_123",
    plan: "premium",
  },

  // 税金設定
  tax_exempt: "none",  // none, exempt, reverse

  // 請求書設定
  invoice_settings: {
    default_payment_method: "pm_xxx",
    footer: "お支払いありがとうございます",
  },
});
```

## 顧客の取得・検索

```typescript
// 単一の顧客取得
const customer = await stripe.customers.retrieve("cus_xxx");

// 関連データを含めて取得
const customerWithData = await stripe.customers.retrieve("cus_xxx", {
  expand: ["subscriptions", "sources"],
});

// 顧客一覧
const customers = await stripe.customers.list({
  limit: 10,
  email: "customer@example.com",
});

// メールで検索
const searchResult = await stripe.customers.search({
  query: 'email:"customer@example.com"',
});

// メタデータで検索
const searchByMeta = await stripe.customers.search({
  query: 'metadata["userId"]:"user_123"',
});
```

## 顧客の更新・削除

```typescript
// 更新
const updated = await stripe.customers.update("cus_xxx", {
  name: "山田花子",
  metadata: {
    plan: "enterprise",
  },
});

// 削除
const deleted = await stripe.customers.del("cus_xxx");
```

## 支払い方法の管理

### 支払い方法の追加

```typescript
// PaymentMethod を顧客に紐付け
const paymentMethod = await stripe.paymentMethods.attach("pm_xxx", {
  customer: "cus_xxx",
});

// デフォルトの支払い方法に設定
await stripe.customers.update("cus_xxx", {
  invoice_settings: {
    default_payment_method: "pm_xxx",
  },
});
```

### 支払い方法の一覧

```typescript
const paymentMethods = await stripe.paymentMethods.list({
  customer: "cus_xxx",
  type: "card",
});
```

### 支払い方法の削除

```typescript
await stripe.paymentMethods.detach("pm_xxx");
```

## SetupIntent（カード保存）

顧客のカード情報を将来の決済用に保存。

```typescript
// サーバー側
const setupIntent = await stripe.setupIntents.create({
  customer: "cus_xxx",
  payment_method_types: ["card"],
  usage: "off_session",  // 顧客不在での課金を許可
});

return { clientSecret: setupIntent.client_secret };
```

```typescript
// クライアント側
"use client";

import { useStripe, useElements, PaymentElement } from "@stripe/react-stripe-js";

export function SetupForm() {
  const stripe = useStripe();
  const elements = useElements();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) return;

    const { error, setupIntent } = await stripe.confirmSetup({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/setup/complete`,
      },
      redirect: "if_required",
    });

    if (error) {
      console.error(error);
    } else if (setupIntent.status === "succeeded") {
      console.log("Card saved successfully!");
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <PaymentElement />
      <button type="submit">カードを保存</button>
    </form>
  );
}
```

## 顧客不在での課金（Off-session）

```typescript
// 保存済みの支払い方法で課金
const paymentIntent = await stripe.paymentIntents.create({
  amount: 10000,
  currency: "jpy",
  customer: "cus_xxx",
  payment_method: "pm_xxx",
  off_session: true,
  confirm: true,
});
```

### 認証が必要な場合の処理

```typescript
try {
  const paymentIntent = await stripe.paymentIntents.create({
    amount: 10000,
    currency: "jpy",
    customer: "cus_xxx",
    payment_method: "pm_xxx",
    off_session: true,
    confirm: true,
  });
} catch (err) {
  if (err.code === "authentication_required") {
    // 顧客に通知して再認証を依頼
    const paymentIntentId = err.raw.payment_intent.id;
    await notifyCustomerForAuth(paymentIntentId);
  }
}
```

## アプリケーションとの連携

### Prisma スキーマ

```prisma
model User {
  id               String    @id @default(cuid())
  email            String    @unique
  name             String?
  stripeCustomerId String?   @unique
  subscriptionId   String?
  subscriptionStatus String?
  createdAt        DateTime  @default(now())
  updatedAt        DateTime  @updatedAt
}
```

### 顧客の同期

```typescript
// lib/stripe/customer.ts
import { stripe } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";

export async function getOrCreateStripeCustomer(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    throw new Error("User not found");
  }

  // 既存の Stripe Customer がある場合
  if (user.stripeCustomerId) {
    return user.stripeCustomerId;
  }

  // 新規作成
  const customer = await stripe.customers.create({
    email: user.email,
    name: user.name || undefined,
    metadata: {
      userId: user.id,
    },
  });

  // DB に保存
  await prisma.user.update({
    where: { id: userId },
    data: { stripeCustomerId: customer.id },
  });

  return customer.id;
}
```

## 次のステップ

次章では、商品と価格の設定について詳しく学びます。
