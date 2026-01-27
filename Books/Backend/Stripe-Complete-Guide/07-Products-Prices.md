# 第7章: 商品と価格

## Product と Price の関係

```
┌─────────────────────────────────────────────────────┐
│               Product & Price Model                  │
│                                                     │
│  Product (商品)                                     │
│  ├── id: prod_xxx                                  │
│  ├── name: "プレミアムプラン"                       │
│  ├── description                                   │
│  ├── images[]                                      │
│  └── metadata                                      │
│                                                     │
│  └── Prices (価格)                                 │
│      ├── Monthly: ¥1,000/月                        │
│      ├── Yearly: ¥10,000/年                        │
│      └── One-time: ¥5,000                          │
└─────────────────────────────────────────────────────┘
```

## Product の作成

### 基本

```typescript
const product = await stripe.products.create({
  name: "プレミアムプラン",
  description: "すべての機能にアクセスできます",
});
```

### 詳細オプション

```typescript
const product = await stripe.products.create({
  name: "プレミアムプラン",
  description: "すべての機能にアクセスできます",

  // 画像（最大8枚）
  images: [
    "https://example.com/product-image.png",
  ],

  // 単位ラベル（数量ベースの場合）
  unit_label: "シート",

  // メタデータ
  metadata: {
    features: "unlimited_projects,priority_support",
    tier: "premium",
  },

  // 税コード
  tax_code: "txcd_10000000",  // Software as a Service

  // アクティブ状態
  active: true,
});
```

## Price の作成

### 一回払い

```typescript
const oneTimePrice = await stripe.prices.create({
  product: "prod_xxx",
  unit_amount: 5000,  // ¥5,000
  currency: "jpy",
});
```

### サブスクリプション（定額）

```typescript
// 月額
const monthlyPrice = await stripe.prices.create({
  product: "prod_xxx",
  unit_amount: 1000,  // ¥1,000
  currency: "jpy",
  recurring: {
    interval: "month",
    interval_count: 1,
  },
});

// 年額
const yearlyPrice = await stripe.prices.create({
  product: "prod_xxx",
  unit_amount: 10000,  // ¥10,000
  currency: "jpy",
  recurring: {
    interval: "year",
  },
});
```

### 使用量ベース（メータリング）

```typescript
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
```

### 段階的価格（ティアード）

```typescript
const tieredPrice = await stripe.prices.create({
  product: "prod_xxx",
  currency: "jpy",
  recurring: {
    interval: "month",
  },
  billing_scheme: "tiered",
  tiers_mode: "graduated",  // または "volume"
  tiers: [
    { up_to: 100, unit_amount: 100 },      // 1-100: ¥100/単位
    { up_to: 500, unit_amount: 80 },       // 101-500: ¥80/単位
    { up_to: "inf", unit_amount: 50 },     // 501+: ¥50/単位
  ],
});
```

### カスタム価格（見積もり用）

```typescript
const customPrice = await stripe.prices.create({
  product: "prod_xxx",
  currency: "jpy",
  custom_unit_amount: {
    enabled: true,
    minimum: 1000,
    maximum: 100000,
    preset: 5000,
  },
});
```

## Product の取得・更新

```typescript
// 取得
const product = await stripe.products.retrieve("prod_xxx");

// 一覧
const products = await stripe.products.list({
  active: true,
  limit: 10,
});

// 更新
const updated = await stripe.products.update("prod_xxx", {
  name: "エンタープライズプラン",
  metadata: {
    tier: "enterprise",
  },
});

// アーカイブ（非アクティブ化）
const archived = await stripe.products.update("prod_xxx", {
  active: false,
});
```

## Price の取得・更新

```typescript
// 取得
const price = await stripe.prices.retrieve("price_xxx");

// 商品の価格一覧
const prices = await stripe.prices.list({
  product: "prod_xxx",
  active: true,
});

// 更新（限定的）
const updated = await stripe.prices.update("price_xxx", {
  nickname: "月額プラン",
  metadata: {
    display_order: "1",
  },
  active: false,  // 非アクティブ化
});
```

**注意**: Price の金額や通貨は作成後に変更できません。新しい Price を作成してください。

## 実装パターン

### 料金表の表示

```typescript
// app/api/prices/route.ts
import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";

export async function GET() {
  const prices = await stripe.prices.list({
    active: true,
    expand: ["data.product"],
  });

  const formattedPrices = prices.data.map((price) => ({
    id: price.id,
    productId: (price.product as Stripe.Product).id,
    name: (price.product as Stripe.Product).name,
    description: (price.product as Stripe.Product).description,
    unitAmount: price.unit_amount,
    currency: price.currency,
    interval: price.recurring?.interval,
    metadata: price.metadata,
  }));

  return NextResponse.json(formattedPrices);
}
```

```typescript
// components/PricingTable.tsx
"use client";

import { useState, useEffect } from "react";

interface Price {
  id: string;
  name: string;
  description: string;
  unitAmount: number;
  currency: string;
  interval?: string;
}

export function PricingTable() {
  const [prices, setPrices] = useState<Price[]>([]);

  useEffect(() => {
    fetch("/api/prices")
      .then((res) => res.json())
      .then(setPrices);
  }, []);

  const handleSubscribe = async (priceId: string) => {
    const response = await fetch("/api/checkout/session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ priceId }),
    });

    const { url } = await response.json();
    window.location.href = url;
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {prices.map((price) => (
        <div key={price.id} className="border rounded-lg p-6">
          <h3 className="text-xl font-bold">{price.name}</h3>
          <p className="text-gray-600">{price.description}</p>
          <p className="text-3xl font-bold mt-4">
            ¥{price.unitAmount?.toLocaleString()}
            {price.interval && <span className="text-sm">/{price.interval}</span>}
          </p>
          <button
            onClick={() => handleSubscribe(price.id)}
            className="mt-4 w-full bg-blue-600 text-white py-2 rounded"
          >
            購入する
          </button>
        </div>
      ))}
    </div>
  );
}
```

### 環境変数での Price ID 管理

```env
# .env
STRIPE_PRICE_MONTHLY=price_xxx
STRIPE_PRICE_YEARLY=price_yyy
```

```typescript
// lib/stripe/prices.ts
export const PRICES = {
  monthly: process.env.STRIPE_PRICE_MONTHLY!,
  yearly: process.env.STRIPE_PRICE_YEARLY!,
} as const;
```

## クーポンと割引

### クーポンの作成

```typescript
// 固定金額割引
const coupon = await stripe.coupons.create({
  amount_off: 500,  // ¥500引き
  currency: "jpy",
  duration: "once",  // once, repeating, forever
  name: "初回割引",
});

// パーセント割引
const percentCoupon = await stripe.coupons.create({
  percent_off: 20,  // 20%オフ
  duration: "repeating",
  duration_in_months: 3,  // 3ヶ月間
  name: "3ヶ月20%オフ",
});
```

### プロモーションコードの作成

```typescript
const promoCode = await stripe.promotionCodes.create({
  coupon: coupon.id,
  code: "WELCOME2024",
  max_redemptions: 100,
  expires_at: Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60,  // 30日後
});
```

### Checkout での割引適用

```typescript
const session = await stripe.checkout.sessions.create({
  mode: "subscription",
  line_items: [{ price: "price_xxx", quantity: 1 }],

  // クーポンを適用
  discounts: [{ coupon: "coupon_xxx" }],

  // または、プロモーションコード入力を許可
  allow_promotion_codes: true,

  success_url: `${baseUrl}/success`,
  cancel_url: `${baseUrl}/cancel`,
});
```

## 次のステップ

次章では、Stripe Connect（マーケットプレイス）について学びます。
