# Amazon Pay 学習ノート

## 概要

Amazon Pay は Amazon アカウントを使った決済サービス。ユーザーは新規登録不要で、Amazon に登録済みの住所・支払い方法で購入可能。

## 決済フロー

```
┌─────────────────────────────────────────────────────┐
│                  Amazon Pay Flow                     │
│                                                     │
│  1. Amazon Pay ボタンクリック                        │
│       ↓                                             │
│  2. Amazon ログイン（ポップアップ）                   │
│       ↓                                             │
│  3. 配送先・支払い方法選択                           │
│       ↓                                             │
│  4. Checkout Session 作成                           │
│       ↓                                             │
│  5. 注文確認・決済実行                               │
│       ↓                                             │
│  6. 決済完了                                        │
└─────────────────────────────────────────────────────┘
```

## セットアップ

```bash
npm install @amazonpay/amazon-pay-api-sdk-nodejs
```

```typescript
// lib/amazon-pay.ts
import AmazonPayClient from "@amazonpay/amazon-pay-api-sdk-nodejs";

const config = {
  publicKeyId: process.env.AMAZON_PAY_PUBLIC_KEY_ID!,
  privateKey: process.env.AMAZON_PAY_PRIVATE_KEY!,
  region: "jp",
  sandbox: process.env.NODE_ENV !== "production",
};

export const amazonPayClient = new AmazonPayClient.WebStoreClient(config);
```

## Checkout Session 作成

```typescript
// app/api/amazon-pay/create-session/route.ts
import { amazonPayClient } from "@/lib/amazon-pay";

export async function POST(req: Request) {
  const { amount, items } = await req.json();

  const payload = {
    webCheckoutDetails: {
      checkoutReviewReturnUrl: `${process.env.NEXT_PUBLIC_BASE_URL}/checkout/review`,
      checkoutResultReturnUrl: `${process.env.NEXT_PUBLIC_BASE_URL}/checkout/complete`,
    },
    storeId: process.env.AMAZON_PAY_STORE_ID,
    chargePermissionType: "OneTime",
    paymentDetails: {
      paymentIntent: "Authorize",
      chargeAmount: {
        amount: amount.toString(),
        currencyCode: "JPY",
      },
    },
    merchantMetadata: {
      merchantReferenceId: `order-${Date.now()}`,
      merchantStoreName: "My Store",
      noteToBuyer: "ご注文ありがとうございます",
    },
  };

  const response = await amazonPayClient.createCheckoutSession(payload);
  const data = JSON.parse(response.body);

  return Response.json({
    checkoutSessionId: data.checkoutSessionId,
    amazonPayRedirectUrl: data.webCheckoutDetails.amazonPayRedirectUrl,
  });
}
```

## Checkout Session 取得

```typescript
// app/api/amazon-pay/session/[id]/route.ts
export async function GET(
  req: Request,
  { params }: { params: { id: string } },
) {
  const response = await amazonPayClient.getCheckoutSession(params.id);
  const data = JSON.parse(response.body);

  return Response.json({
    checkoutSessionId: data.checkoutSessionId,
    buyer: data.buyer,
    shippingAddress: data.shippingAddress,
    paymentPreferences: data.paymentPreferences,
    statusDetails: data.statusDetails,
  });
}
```

## 決済実行

```typescript
// app/api/amazon-pay/complete/route.ts
export async function POST(req: Request) {
  const { checkoutSessionId, amount } = await req.json();

  const payload = {
    chargeAmount: {
      amount: amount.toString(),
      currencyCode: "JPY",
    },
  };

  const response = await amazonPayClient.completeCheckoutSession(
    checkoutSessionId,
    payload,
  );
  const data = JSON.parse(response.body);

  if (data.statusDetails.state === "Completed") {
    // 注文確定処理
    await prisma.order.update({
      where: { checkoutSessionId },
      data: {
        status: "paid",
        chargeId: data.chargeId,
        paidAt: new Date(),
      },
    });

    return Response.json({ success: true, chargeId: data.chargeId });
  }

  return Response.json({ error: data.statusDetails }, { status: 400 });
}
```

## クライアントサイド

```typescript
// components/AmazonPayButton.tsx
'use client';

import { useEffect } from 'react';

declare global {
  interface Window {
    amazon?: any;
  }
}

export function AmazonPayButton({ amount }: { amount: number }) {
  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://static-fe.payments-amazon.com/checkout.js';
    script.async = true;
    script.onload = () => {
      window.amazon.Pay.renderButton('#amazon-pay-button', {
        merchantId: process.env.NEXT_PUBLIC_AMAZON_PAY_MERCHANT_ID,
        publicKeyId: process.env.NEXT_PUBLIC_AMAZON_PAY_PUBLIC_KEY_ID,
        ledgerCurrency: 'JPY',
        checkoutLanguage: 'ja_JP',
        productType: 'PayOnly',
        placement: 'Cart',
        buttonColor: 'Gold',
        createCheckoutSessionConfig: {
          payloadJSON: JSON.stringify({
            webCheckoutDetails: {
              checkoutReviewReturnUrl: `${window.location.origin}/checkout/review`,
            },
            storeId: process.env.NEXT_PUBLIC_AMAZON_PAY_STORE_ID,
          }),
          signature: '', // サーバーで生成
        },
      });
    };
    document.body.appendChild(script);
  }, []);

  return <div id="amazon-pay-button" />;
}
```

## IPN (Instant Payment Notification)

```typescript
// app/api/webhook/amazon-pay/route.ts
export async function POST(req: Request) {
  const body = await req.text();

  // SNS メッセージの検証
  // ... 署名検証ロジック

  const message = JSON.parse(body);
  const notification = JSON.parse(message.Message);

  switch (notification.NotificationType) {
    case "CHARGE":
      if (notification.ChargeStatus === "Captured") {
        await handleChargeCaptured(notification);
      }
      break;

    case "REFUND":
      await handleRefund(notification);
      break;
  }

  return Response.json({ received: true });
}
```

## 返金

```typescript
async function createRefund(chargeId: string, amount: number) {
  const payload = {
    chargeId,
    refundAmount: {
      amount: amount.toString(),
      currencyCode: "JPY",
    },
    softDescriptor: "Refund",
  };

  const response = await amazonPayClient.createRefund(payload);
  return JSON.parse(response.body);
}
```

## 参考リソース

- [Amazon Pay ドキュメント](https://developer.amazon.com/ja/docs/amazon-pay/intro.html)
- [Amazon Pay Integration Guide](https://developer.amazon.com/ja/docs/amazon-pay-checkout/get-started.html)
