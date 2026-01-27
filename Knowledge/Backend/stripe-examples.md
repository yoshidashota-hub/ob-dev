# Stripe 決済サンプル集

## Payment Intent（カード決済）

```typescript
// app/api/payment/create-intent/route.ts
import Stripe from 'stripe';
import { NextResponse } from 'next/server';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

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

## Checkout Session（リダイレクト型）

```typescript
// app/api/checkout/route.ts
export async function POST(req: Request) {
  const { items, successUrl, cancelUrl } = await req.json();

  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    payment_method_types: ['card'],
    line_items: items.map((item: any) => ({
      price_data: {
        currency: 'jpy',
        product_data: { name: item.name },
        unit_amount: item.price,
      },
      quantity: item.quantity,
    })),
    success_url: successUrl,
    cancel_url: cancelUrl,
  });

  return NextResponse.json({ url: session.url });
}
```

## サブスクリプション

```typescript
// 顧客作成
export async function createCustomer(email: string, name: string) {
  return stripe.customers.create({ email, name });
}

// サブスクリプション開始
export async function createSubscription(
  customerId: string,
  priceId: string
) {
  const subscription = await stripe.subscriptions.create({
    customer: customerId,
    items: [{ price: priceId }],
    payment_behavior: 'default_incomplete',
    payment_settings: { save_default_payment_method: 'on_subscription' },
    expand: ['latest_invoice.payment_intent'],
  });

  return {
    subscriptionId: subscription.id,
    clientSecret: (subscription.latest_invoice as any)
      .payment_intent.client_secret,
  };
}

// プラン変更
export async function changeSubscriptionPlan(
  subscriptionId: string,
  newPriceId: string
) {
  const subscription = await stripe.subscriptions.retrieve(subscriptionId);
  
  return stripe.subscriptions.update(subscriptionId, {
    items: [
      { id: subscription.items.data[0].id, price: newPriceId },
    ],
    proration_behavior: 'create_prorations',
  });
}

// 解約
export async function cancelSubscription(subscriptionId: string) {
  return stripe.subscriptions.cancel(subscriptionId);
}
```

## Webhook 処理

```typescript
// app/api/webhook/stripe/route.ts
import { headers } from 'next/headers';

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
      await handlePaymentSuccess(event.data.object);
      break;

    case 'payment_intent.payment_failed':
      await handlePaymentFailure(event.data.object);
      break;

    case 'customer.subscription.created':
      await handleSubscriptionCreated(event.data.object);
      break;

    case 'customer.subscription.updated':
      await handleSubscriptionUpdated(event.data.object);
      break;

    case 'customer.subscription.deleted':
      await handleSubscriptionDeleted(event.data.object);
      break;

    case 'invoice.payment_failed':
      await handleInvoicePaymentFailed(event.data.object);
      break;
  }

  return NextResponse.json({ received: true });
}
```

## クライアントコンポーネント

```typescript
// components/CheckoutForm.tsx
'use client';

import {
  Elements,
  PaymentElement,
  useStripe,
  useElements,
} from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { useState } from 'react';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

function PaymentForm() {
  const stripe = useStripe();
  const elements = useElements();
  const [error, setError] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) return;

    setProcessing(true);

    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/checkout/complete`,
      },
    });

    if (error) {
      setError(error.message ?? 'Payment failed');
    }
    setProcessing(false);
  };

  return (
    <form onSubmit={handleSubmit}>
      <PaymentElement />
      {error && <p className="text-red-500 mt-2">{error}</p>}
      <button
        type="submit"
        disabled={!stripe || processing}
        className="mt-4 w-full py-2 px-4 bg-blue-600 text-white rounded disabled:opacity-50"
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
        locale: 'ja',
      }}
    >
      <PaymentForm />
    </Elements>
  );
}
```

## 請求書

```typescript
// 請求書作成
export async function createInvoice(customerId: string, items: any[]) {
  // 請求書アイテム作成
  for (const item of items) {
    await stripe.invoiceItems.create({
      customer: customerId,
      amount: item.amount,
      currency: 'jpy',
      description: item.description,
    });
  }

  // 請求書作成・確定
  const invoice = await stripe.invoices.create({
    customer: customerId,
    auto_advance: true,
  });

  await stripe.invoices.finalizeInvoice(invoice.id);

  return invoice;
}
```

## テスト用カード

```typescript
const TEST_CARDS = {
  success: '4242424242424242',
  decline: '4000000000000002',
  insufficientFunds: '4000000000009995',
  requires3DS: '4000002500003155',
  expires: '4000000000000069',
};
```
