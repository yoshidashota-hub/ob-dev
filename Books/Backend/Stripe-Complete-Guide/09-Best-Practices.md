# 第9章: ベストプラクティス

## プロジェクト構成

```
src/
├── app/
│   └── api/
│       ├── checkout/
│       │   └── route.ts
│       ├── webhooks/
│       │   └── stripe/
│       │       └── route.ts
│       └── stripe/
│           ├── portal/
│           │   └── route.ts
│           └── subscription/
│               └── route.ts
├── lib/
│   ├── stripe.ts           # Stripe クライアント
│   └── stripe/
│       ├── handlers.ts     # Webhook ハンドラー
│       ├── customer.ts     # 顧客管理
│       └── subscription.ts # サブスクリプション管理
└── types/
    └── stripe.ts           # 型定義
```

## 環境変数の管理

```env
# .env.local
STRIPE_SECRET_KEY=sk_test_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# 価格ID
STRIPE_PRICE_MONTHLY=price_...
STRIPE_PRICE_YEARLY=price_...
```

```typescript
// lib/env.ts
export const env = {
  stripe: {
    secretKey: process.env.STRIPE_SECRET_KEY!,
    publishableKey: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!,
    webhookSecret: process.env.STRIPE_WEBHOOK_SECRET!,
    prices: {
      monthly: process.env.STRIPE_PRICE_MONTHLY!,
      yearly: process.env.STRIPE_PRICE_YEARLY!,
    },
  },
} as const;
```

## エラーハンドリング

### 共通エラーハンドラー

```typescript
// lib/stripe/errors.ts
import Stripe from "stripe";

export class StripeError extends Error {
  constructor(
    public code: string,
    message: string,
    public statusCode: number = 500,
  ) {
    super(message);
    this.name = "StripeError";
  }
}

export function handleStripeError(error: unknown): never {
  if (error instanceof Stripe.errors.StripeCardError) {
    throw new StripeError(
      error.code || "card_error",
      error.message,
      400,
    );
  }

  if (error instanceof Stripe.errors.StripeRateLimitError) {
    throw new StripeError(
      "rate_limit",
      "リクエストが多すぎます。しばらく待ってから再試行してください。",
      429,
    );
  }

  if (error instanceof Stripe.errors.StripeInvalidRequestError) {
    throw new StripeError(
      "invalid_request",
      error.message,
      400,
    );
  }

  if (error instanceof Stripe.errors.StripeAuthenticationError) {
    console.error("Stripe authentication failed:", error);
    throw new StripeError(
      "authentication_error",
      "決済システムの認証に失敗しました。",
      500,
    );
  }

  console.error("Unknown Stripe error:", error);
  throw new StripeError(
    "unknown_error",
    "決済処理中にエラーが発生しました。",
    500,
  );
}
```

### API Route での使用

```typescript
// app/api/checkout/route.ts
import { NextResponse } from "next/server";
import { handleStripeError, StripeError } from "@/lib/stripe/errors";

export async function POST(req: Request) {
  try {
    const { priceId } = await req.json();

    const session = await stripe.checkout.sessions.create({
      // ...
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    if (error instanceof StripeError) {
      return NextResponse.json(
        { error: error.message, code: error.code },
        { status: error.statusCode },
      );
    }

    handleStripeError(error);
  }
}
```

## Webhook のベストプラクティス

### 冪等性の確保

```typescript
// lib/stripe/handlers.ts
export async function handleCheckoutCompleted(
  session: Stripe.Checkout.Session,
) {
  // イベントIDで重複チェック
  const existing = await prisma.stripeEvent.findUnique({
    where: { id: session.id },
  });

  if (existing) {
    console.log(`Event already processed: ${session.id}`);
    return;
  }

  // トランザクションで処理
  await prisma.$transaction(async (tx) => {
    // イベント記録
    await tx.stripeEvent.create({
      data: {
        id: session.id,
        type: "checkout.session.completed",
        processedAt: new Date(),
      },
    });

    // 本処理
    await tx.order.create({
      data: {
        stripeSessionId: session.id,
        customerId: session.customer as string,
        amount: session.amount_total!,
        status: "completed",
      },
    });
  });
}
```

### タイムアウト対策

```typescript
// 重い処理はキューに入れる
export async function handleCheckoutCompleted(
  session: Stripe.Checkout.Session,
) {
  // 即座に200を返すため、非同期処理をキューに追加
  await queue.add("process-order", {
    sessionId: session.id,
    customerId: session.customer,
    amount: session.amount_total,
  });

  // ここで return すれば Webhook は成功
}
```

## セキュリティ

### Webhook 署名検証

```typescript
// app/api/webhooks/stripe/route.ts
export async function POST(req: Request) {
  const body = await req.text();
  const signature = headers().get("stripe-signature");

  if (!signature) {
    return NextResponse.json(
      { error: "Missing signature" },
      { status: 400 },
    );
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!,
    );
  } catch (err) {
    console.error("Webhook signature verification failed:", err);
    return NextResponse.json(
      { error: "Invalid signature" },
      { status: 400 },
    );
  }

  // イベント処理...
}
```

### Client Secret の保護

```typescript
// ✅ 良い例: client_secret はサーバーからクライアントに渡す
const paymentIntent = await stripe.paymentIntents.create({
  amount: 10000,
  currency: "jpy",
});

// クライアントには client_secret のみ返す
return NextResponse.json({
  clientSecret: paymentIntent.client_secret,
});

// ❌ 悪い例: PaymentIntent 全体を返さない
// return NextResponse.json(paymentIntent);
```

### 金額検証

```typescript
// サーバー側で必ず金額を計算
export async function POST(req: Request) {
  const { items } = await req.json();

  // ❌ クライアントからの金額を信用しない
  // const amount = req.body.amount;

  // ✅ サーバーで金額を計算
  const products = await prisma.product.findMany({
    where: {
      id: { in: items.map((i: any) => i.productId) },
    },
  });

  const amount = items.reduce((total: number, item: any) => {
    const product = products.find((p) => p.id === item.productId);
    return total + (product?.price || 0) * item.quantity;
  }, 0);

  const session = await stripe.checkout.sessions.create({
    // 計算した金額を使用
  });
}
```

## テスト

### テストカードの活用

```typescript
// テスト用のカード番号
const TEST_CARDS = {
  success: "4242424242424242",
  declined: "4000000000000002",
  insufficientFunds: "4000000000009995",
  requires3DS: "4000002500003155",
};
```

### Webhook のローカルテスト

```bash
# Stripe CLI でローカルにフォワード
stripe listen --forward-to localhost:3000/api/webhooks/stripe

# イベントをトリガー
stripe trigger checkout.session.completed
stripe trigger customer.subscription.updated
```

### Jest でのテスト

```typescript
// __tests__/stripe.test.ts
import { stripe } from "@/lib/stripe";

describe("Stripe Integration", () => {
  it("should create a payment intent", async () => {
    const paymentIntent = await stripe.paymentIntents.create({
      amount: 10000,
      currency: "jpy",
    });

    expect(paymentIntent.id).toMatch(/^pi_/);
    expect(paymentIntent.amount).toBe(10000);
    expect(paymentIntent.status).toBe("requires_payment_method");
  });

  it("should create a customer", async () => {
    const customer = await stripe.customers.create({
      email: "test@example.com",
    });

    expect(customer.id).toMatch(/^cus_/);
    expect(customer.email).toBe("test@example.com");

    // クリーンアップ
    await stripe.customers.del(customer.id);
  });
});
```

## 本番環境へのデプロイ

### チェックリスト

- [ ] 本番用 API キーに切り替え
- [ ] Webhook エンドポイントを Dashboard で登録
- [ ] Webhook シークレットを本番用に更新
- [ ] エラー通知の設定
- [ ] ログの設定
- [ ] 返金・キャンセルフローのテスト

### ログとモニタリング

```typescript
// lib/stripe/logger.ts
export function logStripeEvent(event: Stripe.Event) {
  console.log(JSON.stringify({
    type: "stripe_event",
    eventId: event.id,
    eventType: event.type,
    timestamp: new Date().toISOString(),
    livemode: event.livemode,
  }));
}

export function logStripeError(error: unknown, context: string) {
  console.error(JSON.stringify({
    type: "stripe_error",
    context,
    error: error instanceof Error ? error.message : String(error),
    timestamp: new Date().toISOString(),
  }));
}
```

## まとめ

### 重要なポイント

1. **署名検証**: Webhook は必ず署名を検証
2. **冪等性**: 同じイベントを複数回処理しても安全に
3. **金額検証**: サーバー側で金額を計算
4. **エラーハンドリング**: 適切なエラーメッセージを返す
5. **テスト**: テストカードと Stripe CLI を活用

### 参考リンク

- [Stripe Docs](https://stripe.com/docs)
- [Stripe API Reference](https://stripe.com/docs/api)
- [Stripe CLI](https://stripe.com/docs/stripe-cli)
- [Stripe Testing](https://stripe.com/docs/testing)
