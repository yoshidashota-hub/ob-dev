# 楽天ペイ 学習ノート

## 概要

楽天ペイ（オンライン決済）は楽天会員の ID・登録済み支払い情報を使った決済サービス。楽天ポイントも利用可能。

## 決済フロー

```
┌─────────────────────────────────────────────────────┐
│                楽天ペイ オンライン決済                │
│                                                     │
│  ┌──────────┐     ┌──────────┐     ┌──────────┐   │
│  │  Client  │     │  Server  │     │ 楽天ペイ  │   │
│  └────┬─────┘     └────┬─────┘     └────┬─────┘   │
│       │                │                │          │
│       │ 1. 楽天ペイボタン│               │          │
│       │───────────────▶│                │          │
│       │                │ 2. Auth API    │          │
│       │                │───────────────▶│          │
│       │                │                │          │
│       │                │ 3. 認証URL     │          │
│       │◀───────────────│◀───────────────│          │
│       │                │                │          │
│       │ 4. 楽天ログイン・決済承認         │          │
│       │───────────────────────────────▶│          │
│       │                │                │          │
│       │ 5. リダイレクト（authCode）      │          │
│       │◀───────────────────────────────│          │
│       │                │                │          │
│       │ 6. Capture API │                │          │
│       │───────────────▶│───────────────▶│          │
│       │                │                │          │
│       │ 7. 完了        │                │          │
│       │◀───────────────│◀───────────────│          │
└─────────────────────────────────────────────────────┘
```

## セットアップ

```env
# .env.local
RAKUTEN_PAY_SERVICE_SECRET=your_service_secret
RAKUTEN_PAY_LICENSE_KEY=your_license_key
RAKUTEN_PAY_SHOP_ID=your_shop_id
```

```typescript
// lib/rakuten-pay.ts
const RAKUTEN_PAY_BASE_URL =
  process.env.NODE_ENV === "production"
    ? "https://api.rps.rakuten.co.jp"
    : "https://stg-api.rps.rakuten.co.jp";

const SHOP_ID = process.env.RAKUTEN_PAY_SHOP_ID!;
const LICENSE_KEY = process.env.RAKUTEN_PAY_LICENSE_KEY!;
const SERVICE_SECRET = process.env.RAKUTEN_PAY_SERVICE_SECRET!;
```

## 認証リクエスト（Auth API）

```typescript
// app/api/rakuten-pay/auth/route.ts
import crypto from "crypto";

export async function POST(req: Request) {
  const { amount, orderItems } = await req.json();
  const orderId = `order-${Date.now()}`;

  // 署名生成
  const timestamp = new Date().toISOString();
  const signData = `${SHOP_ID}:${orderId}:${amount}:${timestamp}`;
  const signature = crypto
    .createHmac("sha256", SERVICE_SECRET)
    .update(signData)
    .digest("base64");

  const payload = {
    shopId: SHOP_ID,
    orderId,
    amount,
    currency: "JPY",
    callbackUrl: `${process.env.NEXT_PUBLIC_BASE_URL}/checkout/rakuten-callback`,
    cancelUrl: `${process.env.NEXT_PUBLIC_BASE_URL}/checkout/cancel`,
    itemName: orderItems.map((i: any) => i.name).join(", "),
    timestamp,
    signature,
  };

  const response = await fetch(`${RAKUTEN_PAY_BASE_URL}/v1/auth`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-License-Key": LICENSE_KEY,
    },
    body: JSON.stringify(payload),
  });

  const data = await response.json();

  if (data.resultCode === "0000") {
    // DBに保存
    await prisma.payment.create({
      data: {
        orderId,
        amount,
        status: "pending",
        provider: "rakuten_pay",
        authCode: data.authCode,
      },
    });

    return Response.json({
      authUrl: data.authUrl,
      orderId,
    });
  }

  return Response.json({ error: data.resultMessage }, { status: 400 });
}
```

## 決済実行（Capture API）

```typescript
// app/api/rakuten-pay/capture/route.ts
export async function POST(req: Request) {
  const { orderId, authCode, amount } = await req.json();

  const timestamp = new Date().toISOString();
  const signData = `${SHOP_ID}:${orderId}:${authCode}:${amount}:${timestamp}`;
  const signature = crypto
    .createHmac("sha256", SERVICE_SECRET)
    .update(signData)
    .digest("base64");

  const payload = {
    shopId: SHOP_ID,
    orderId,
    authCode,
    amount,
    timestamp,
    signature,
  };

  const response = await fetch(`${RAKUTEN_PAY_BASE_URL}/v1/capture`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-License-Key": LICENSE_KEY,
    },
    body: JSON.stringify(payload),
  });

  const data = await response.json();

  if (data.resultCode === "0000") {
    await prisma.payment.update({
      where: { orderId },
      data: {
        status: "completed",
        captureId: data.captureId,
        paidAt: new Date(),
      },
    });

    return Response.json({ success: true, captureId: data.captureId });
  }

  return Response.json({ error: data.resultMessage }, { status: 400 });
}
```

## コールバック処理

```typescript
// app/checkout/rakuten-callback/page.tsx
import { redirect } from "next/navigation";

export default async function RakutenCallback({
  searchParams,
}: {
  searchParams: { orderId: string; authCode: string; status: string };
}) {
  const { orderId, authCode, status } = searchParams;

  if (status === "success") {
    // 決済情報を取得
    const payment = await prisma.payment.findUnique({
      where: { orderId },
    });

    if (payment) {
      // Capture API を呼び出し
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BASE_URL}/api/rakuten-pay/capture`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            orderId,
            authCode,
            amount: payment.amount,
          }),
        },
      );

      if (response.ok) {
        redirect("/checkout/complete");
      }
    }
  }

  redirect("/checkout/failed");
}
```

## 返金

```typescript
async function refundPayment(
  orderId: string,
  captureId: string,
  amount: number,
) {
  const timestamp = new Date().toISOString();
  const signData = `${SHOP_ID}:${orderId}:${captureId}:${amount}:${timestamp}`;
  const signature = crypto
    .createHmac("sha256", SERVICE_SECRET)
    .update(signData)
    .digest("base64");

  const response = await fetch(`${RAKUTEN_PAY_BASE_URL}/v1/refund`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-License-Key": LICENSE_KEY,
    },
    body: JSON.stringify({
      shopId: SHOP_ID,
      orderId,
      captureId,
      amount,
      timestamp,
      signature,
    }),
  });

  return response.json();
}
```

## 楽天ペイボタン

```typescript
// components/RakutenPayButton.tsx
'use client';

export function RakutenPayButton({
  amount,
  items,
}: {
  amount: number;
  items: any[];
}) {
  const handleClick = async () => {
    const response = await fetch('/api/rakuten-pay/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount, orderItems: items }),
    });

    const data = await response.json();

    if (data.authUrl) {
      window.location.href = data.authUrl;
    }
  };

  return (
    <button
      onClick={handleClick}
      className="bg-[#BF0000] text-white px-6 py-3 rounded-lg flex items-center gap-2"
    >
      <img src="/rakuten-pay-logo.svg" alt="楽天ペイ" className="h-6" />
      楽天ペイで支払う
    </button>
  );
}
```

## 参考リソース

- [楽天ペイ オンライン決済 API](https://pay.rakuten.co.jp/business/ec/)
- [開発者ドキュメント](https://developer.pay.rakuten.co.jp/)
