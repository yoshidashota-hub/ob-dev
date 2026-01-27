# 第3章: データ保護

## データ分類

```
┌────────────────────────────────────────────────────────────┐
│                    データ分類レベル                          │
│                                                            │
│  レベル 1: 公開情報                                         │
│  • 製品情報、FAQ、ブログ記事                                │
│  • 保護: 不要                                               │
│                                                            │
│  レベル 2: 内部情報                                         │
│  • 社内文書、プロジェクト情報                                │
│  • 保護: アクセス制御                                       │
│                                                            │
│  レベル 3: 機密情報                                         │
│  • 個人情報、顧客データ                                     │
│  • 保護: 暗号化 + アクセス制御 + 監査                       │
│                                                            │
│  レベル 4: 極秘情報                                         │
│  • 決済情報、認証情報、秘密鍵                                │
│  • 保護: 強力な暗号化 + 厳格なアクセス制御 + 監査           │
└────────────────────────────────────────────────────────────┘
```

## 暗号化

### 保存時の暗号化（Encryption at Rest）

```typescript
// AES-256-GCM による暗号化
import crypto from "crypto";

const ALGORITHM = "aes-256-gcm";

export class Encryption {
  private key: Buffer;

  constructor(keyHex: string) {
    this.key = Buffer.from(keyHex, "hex");
    if (this.key.length !== 32) {
      throw new Error("Key must be 32 bytes for AES-256");
    }
  }

  encrypt(plaintext: string): { ciphertext: string; iv: string; tag: string } {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(ALGORITHM, this.key, iv);

    let ciphertext = cipher.update(plaintext, "utf8", "hex");
    ciphertext += cipher.final("hex");

    return {
      ciphertext,
      iv: iv.toString("hex"),
      tag: cipher.getAuthTag().toString("hex"),
    };
  }

  decrypt(ciphertext: string, iv: string, tag: string): string {
    const decipher = crypto.createDecipheriv(
      ALGORITHM,
      this.key,
      Buffer.from(iv, "hex")
    );
    decipher.setAuthTag(Buffer.from(tag, "hex"));

    let plaintext = decipher.update(ciphertext, "hex", "utf8");
    plaintext += decipher.final("utf8");

    return plaintext;
  }
}

// 使用例
const encryption = new Encryption(process.env.ENCRYPTION_KEY!);

// 暗号化して保存
const sensitiveData = "秘密の情報";
const encrypted = encryption.encrypt(sensitiveData);
await prisma.sensitiveRecord.create({
  data: {
    ciphertext: encrypted.ciphertext,
    iv: encrypted.iv,
    tag: encrypted.tag,
  },
});

// 復号
const record = await prisma.sensitiveRecord.findUnique({ where: { id } });
const decrypted = encryption.decrypt(record.ciphertext, record.iv, record.tag);
```

### AWS KMS との統合

```typescript
// lib/kms.ts
import { KMSClient, EncryptCommand, DecryptCommand } from "@aws-sdk/client-kms";

const kms = new KMSClient({ region: "ap-northeast-1" });
const KEY_ID = process.env.KMS_KEY_ID!;

export async function encryptWithKMS(plaintext: string): Promise<string> {
  const response = await kms.send(
    new EncryptCommand({
      KeyId: KEY_ID,
      Plaintext: Buffer.from(plaintext),
    })
  );

  return Buffer.from(response.CiphertextBlob!).toString("base64");
}

export async function decryptWithKMS(ciphertext: string): Promise<string> {
  const response = await kms.send(
    new DecryptCommand({
      CiphertextBlob: Buffer.from(ciphertext, "base64"),
    })
  );

  return Buffer.from(response.Plaintext!).toString("utf8");
}
```

### 転送時の暗号化（Encryption in Transit）

```typescript
// HTTPS の強制（Next.js middleware）
export function middleware(request: NextRequest) {
  // 本番環境で HTTP を HTTPS にリダイレクト
  if (
    process.env.NODE_ENV === "production" &&
    request.headers.get("x-forwarded-proto") !== "https"
  ) {
    return NextResponse.redirect(
      `https://${request.headers.get("host")}${request.nextUrl.pathname}`,
      301
    );
  }

  return NextResponse.next();
}
```

## Secrets Manager

### シークレット管理

```typescript
// lib/secrets.ts
import {
  SecretsManagerClient,
  GetSecretValueCommand,
  CreateSecretCommand,
  UpdateSecretCommand,
} from "@aws-sdk/client-secrets-manager";

const client = new SecretsManagerClient({ region: "ap-northeast-1" });

// キャッシュ
const secretCache = new Map<string, { value: any; expires: number }>();

export async function getSecret(secretName: string): Promise<any> {
  // キャッシュチェック
  const cached = secretCache.get(secretName);
  if (cached && cached.expires > Date.now()) {
    return cached.value;
  }

  const response = await client.send(
    new GetSecretValueCommand({ SecretId: secretName })
  );

  const value = JSON.parse(response.SecretString!);

  // 5分間キャッシュ
  secretCache.set(secretName, {
    value,
    expires: Date.now() + 5 * 60 * 1000,
  });

  return value;
}

// 使用例
const dbCredentials = await getSecret("prod/database");
const connectionString = `postgresql://${dbCredentials.username}:${dbCredentials.password}@${dbCredentials.host}:5432/mydb`;
```

### 環境変数のベストプラクティス

```bash
# ❌ 機密情報を直接記載しない
DATABASE_URL=postgresql://admin:password123@localhost:5432/mydb

# ✅ Secrets Manager ARN を参照
DATABASE_SECRET_ARN=arn:aws:secretsmanager:ap-northeast-1:123456789012:secret:prod/database

# ✅ ローカル開発用は .env.local（.gitignore に追加）
```

## PII（個人情報）の取り扱い

### データマスキング

```typescript
// lib/masking.ts
export function maskEmail(email: string): string {
  const [local, domain] = email.split("@");
  if (local.length <= 2) {
    return `*@${domain}`;
  }
  return `${local[0]}***${local[local.length - 1]}@${domain}`;
}

export function maskPhone(phone: string): string {
  // 090-1234-5678 → 090-****-5678
  return phone.replace(/(\d{3})-(\d{4})-(\d{4})/, "$1-****-$3");
}

export function maskCreditCard(cardNumber: string): string {
  // 4111111111111111 → ************1111
  return cardNumber.replace(/^(\d{12})(\d{4})$/, "************$2");
}

// API レスポンスでマスキング
export function sanitizeUser(user: User) {
  return {
    id: user.id,
    name: user.name,
    email: maskEmail(user.email),
    phone: user.phone ? maskPhone(user.phone) : null,
    // パスワードハッシュは含めない
  };
}
```

### ログからの除外

```typescript
// lib/logger.ts
const SENSITIVE_FIELDS = ["password", "token", "secret", "cardNumber", "cvv"];

function sanitizeObject(obj: any): any {
  if (typeof obj !== "object" || obj === null) {
    return obj;
  }

  const sanitized: any = Array.isArray(obj) ? [] : {};

  for (const [key, value] of Object.entries(obj)) {
    if (SENSITIVE_FIELDS.some((field) => key.toLowerCase().includes(field))) {
      sanitized[key] = "[REDACTED]";
    } else if (typeof value === "object") {
      sanitized[key] = sanitizeObject(value);
    } else {
      sanitized[key] = value;
    }
  }

  return sanitized;
}

export function log(level: string, message: string, data?: any) {
  console.log(
    JSON.stringify({
      timestamp: new Date().toISOString(),
      level,
      message,
      data: data ? sanitizeObject(data) : undefined,
    })
  );
}

// 使用例
log("info", "User login", {
  userId: "123",
  email: "user@example.com",
  password: "secret123", // → "[REDACTED]"
});
```

## データ保持と削除

```typescript
// データ保持ポリシー
const RETENTION_POLICIES = {
  logs: 90, // 90日
  sessions: 30, // 30日
  deletedUsers: 30, // 30日後に完全削除
  payments: 7 * 365, // 7年（法的要件）
};

// 定期削除ジョブ
export async function cleanupExpiredData() {
  const now = new Date();

  // 期限切れログの削除
  await prisma.log.deleteMany({
    where: {
      createdAt: {
        lt: new Date(now.getTime() - RETENTION_POLICIES.logs * 24 * 60 * 60 * 1000),
      },
    },
  });

  // 削除済みユーザーの完全削除
  await prisma.user.deleteMany({
    where: {
      deletedAt: {
        lt: new Date(now.getTime() - RETENTION_POLICIES.deletedUsers * 24 * 60 * 60 * 1000),
      },
    },
  });
}

// GDPR: データ削除リクエスト
export async function handleDeletionRequest(userId: string) {
  // 論理削除
  await prisma.user.update({
    where: { id: userId },
    data: {
      deletedAt: new Date(),
      email: `deleted_${userId}@deleted.local`,
      name: "[Deleted]",
      // PII をクリア
      phone: null,
      address: null,
    },
  });

  // 関連データの匿名化
  await prisma.order.updateMany({
    where: { userId },
    data: {
      shippingAddress: "[Deleted]",
    },
  });
}
```

## 次のステップ

次章では、決済セキュリティについて学びます。
