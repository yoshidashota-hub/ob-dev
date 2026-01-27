# PayPay 学習ノート

## 概要

PayPay は日本最大級の QR コード決済サービス。Web 決済 API でオンライン決済を実装可能。

## 決済フロー

```
┌─────────────────────────────────────────────────────┐
│                  PayPay Web 決済                     │
│                                                     │
│  ┌──────────┐     ┌──────────┐     ┌──────────┐   │
│  │  Client  │     │  Server  │     │  PayPay  │   │
│  └────┬─────┘     └────┬─────┘     └────┬─────┘   │
│       │                │                │          │
│       │ 1. 購入        │                │          │
│       │───────────────▶│                │          │
│       │                │ 2. Create Code │          │
│       │                │───────────────▶│          │
│       │                │                │          │
│       │                │ 3. 決済URL     │          │
│       │◀───────────────│◀───────────────│          │
│       │                │                │          │
│       │ 4. PayPay画面でリダイレクト     │          │
│       │───────────────────────────────▶│          │
│       │                │                │          │
│       │ 5. 決済完了後リダイレクト        │          │
│       │◀───────────────────────────────│          │
│       │                │                │          │
│       │                │ 6. Webhook     │          │
│       │                │◀───────────────│          │
└─────────────────────────────────────────────────────┘
```

## セットアップ

```bash
npm install paypay-api-sdk
# または REST API を直接使用
```

```typescript
// lib/paypay.ts
const PAYPAY_API_KEY = process.env.PAYPAY_API_KEY!;
const PAYPAY_API_SECRET = process.env.PAYPAY_API_SECRET!;
const PAYPAY_MERCHANT_ID = process.env.PAYPAY_MERCHANT_ID!;

const PAYPAY_BASE_URL =
  process.env.NODE_ENV === "production"
    ? "https://api.paypay.ne.jp"
    : "https://stg-api.sandbox.paypay.ne.jp";
```

## 決済コード作成

```typescript
// app/api/paypay/create/route.ts
import { v4 as uuidv4 } from "uuid";
import crypto from "crypto";

export async function POST(req: Request) {
  const { amount, orderDescription } = await req.json();
  const merchantPaymentId = uuidv4();

  const payload = {
    merchantPaymentId,
    amount: { amount, currency: "JPY" },
    codeType: "ORDER_QR",
    orderDescription,
    redirectUrl: `${process.env.NEXT_PUBLIC_BASE_URL}/checkout/complete`,
    redirectType: "WEB_LINK",
    userAgent: req.headers.get("user-agent"),
  };

  const nonce = uuidv4();
  const epoch = Math.floor(Date.now() / 1000);
  const message = `\n${nonce}\n${epoch}\nPOST\n/v2/codes\n${JSON.stringify(payload)}`;

  const hmac = crypto
    .createHmac("sha256", PAYPAY_API_SECRET)
    .update(message)
    .digest("base64");

  const response = await fetch(`${PAYPAY_BASE_URL}/v2/codes`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `hmac OPA-Auth:${PAYPAY_API_KEY}:${hmac}:${nonce}:${epoch}`,
    },
    body: JSON.stringify(payload),
  });

  const data = await response.json();

  if (data.resultInfo.code === "SUCCESS") {
    // DBに決済情報を保存
    await prisma.payment.create({
      data: {
        merchantPaymentId,
        amount,
        status: "pending",
        provider: "paypay",
      },
    });

    return Response.json({
      paymentUrl: data.data.url,
      merchantPaymentId,
    });
  }

  return Response.json({ error: data.resultInfo }, { status: 400 });
}
```

## 決済状態確認

```typescript
// app/api/paypay/status/[id]/route.ts
export async function GET(
  req: Request,
  { params }: { params: { id: string } },
) {
  const merchantPaymentId = params.id;

  const nonce = uuidv4();
  const epoch = Math.floor(Date.now() / 1000);
  const message = `\n${nonce}\n${epoch}\nGET\n/v2/codes/payments/${merchantPaymentId}\n`;

  const hmac = crypto
    .createHmac("sha256", PAYPAY_API_SECRET)
    .update(message)
    .digest("base64");

  const response = await fetch(
    `${PAYPAY_BASE_URL}/v2/codes/payments/${merchantPaymentId}`,
    {
      headers: {
        Authorization: `hmac OPA-Auth:${PAYPAY_API_KEY}:${hmac}:${nonce}:${epoch}`,
      },
    },
  );

  const data = await response.json();

  return Response.json({
    status: data.data?.status,
    paymentId: data.data?.paymentId,
  });
}
```

## Webhook 処理

```typescript
// app/api/webhook/paypay/route.ts
export async function POST(req: Request) {
  const body = await req.json();

  // 署名検証（本番では必須）
  const signature = req.headers.get("x-paypay-signature");
  // ... 署名検証ロジック

  const { notification_type, merchant_payment_id, state } = body;

  switch (notification_type) {
    case "Transaction":
      if (state === "COMPLETED") {
        await prisma.payment.update({
          where: { merchantPaymentId: merchant_payment_id },
          data: { status: "completed", paidAt: new Date() },
        });
        // 注文処理
      }
      break;

    case "Refund":
      await prisma.payment.update({
        where: { merchantPaymentId: merchant_payment_id },
        data: { status: "refunded" },
      });
      break;
  }

  return Response.json({ received: true });
}
```

## 返金

```typescript
async function refundPayment(
  paymentId: string,
  amount: number,
  reason: string,
) {
  const merchantRefundId = uuidv4();

  const payload = {
    merchantRefundId,
    paymentId,
    amount: { amount, currency: "JPY" },
    reason,
  };

  // ... HMAC 署名生成

  const response = await fetch(`${PAYPAY_BASE_URL}/v2/refunds`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `hmac OPA-Auth:${PAYPAY_API_KEY}:${hmac}:${nonce}:${epoch}`,
    },
    body: JSON.stringify(payload),
  });

  return response.json();
}
```

## テスト環境

- サンドボックス環境で開発・テスト
- テスト用アカウントを PayPay for Developers で作成
- 実際の決済は発生しない

## 参考リソース

- [PayPay for Developers](https://developer.paypay.ne.jp/)
- [Web Payment API ドキュメント](https://developer.paypay.ne.jp/products/docs/webpayment)
