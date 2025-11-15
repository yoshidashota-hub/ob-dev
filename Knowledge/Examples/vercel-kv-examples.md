# Vercel KV 実装例

Redis ベースの高速キャッシュとセッション管理の完全ガイド。

---

## 📋 目次

1. [概要](#概要)
2. [セットアップ](#セットアップ)
3. [基本操作](#基本操作)
4. [セッション管理](#セッション管理)
5. [キャッシュ戦略](#キャッシュ戦略)
6. [Rate Limiting](#rate-limiting)
7. [高度な使用例](#高度な使用例)
8. [トラブルシューティング](#トラブルシューティング)

---

## 概要

### Vercel KV とは

Redis 互換の分散キーバリューストア：

- **高速**: ミリ秒単位のレスポンス
- **グローバル**: エッジロケーションに近いデータ配置
- **スケーラブル**: 自動スケーリング
- **シンプル**: Redis API と完全互換

### 主なユースケース

- セッション管理
- キャッシュ
- Rate Limiting
- リアルタイムカウンター
- 一時データの保存

---

## セットアップ

### 1. Vercel KV ストアの作成

```bash
# Vercel ダッシュボードで:
# 1. プロジェクトを選択
# 2. Storage → KV
# 3. "Create Store" をクリック
# 4. 名前を入力 (例: "next16-sandbox-kv")
```

### 2. パッケージのインストール

```bash
npm install @vercel/kv
```

### 3. 環境変数の設定

**ファイル**: `.env.local`

```bash
# Vercel KV の接続情報（ダッシュボードから取得）
KV_URL="redis://default:xxxx@xxxx.upstash.io:6379"
KV_REST_API_URL="https://xxxx.upstash.io"
KV_REST_API_TOKEN="xxxx"
KV_REST_API_READ_ONLY_TOKEN="xxxx"
```

Vercel にデプロイする場合は自動設定されます。

---

## 基本操作

### KV クライアントの初期化

**ファイル**: `lib/kv.ts`

```typescript
import { kv } from "@vercel/kv";

// kv はそのまま使用可能（設定不要）
export { kv };
```

### 値の保存と取得

#### 基本的な Set/Get

```typescript
import { kv } from "@vercel/kv";

// 値を保存
await kv.set("key", "value");

// 値を取得
const value = await kv.get("key");
console.log(value); // "value"

// オブジェクトを保存
await kv.set("user:123", {
  id: "123",
  name: "山田太郎",
  email: "yamada@example.com",
});

// オブジェクトを取得
const user = await kv.get("user:123");
console.log(user); // { id: '123', name: '山田太郎', ... }
```

#### TTL（有効期限）付きで保存

```typescript
// 60秒後に自動削除
await kv.set("session:abc123", sessionData, {
  ex: 60, // 秒単位
});

// ミリ秒単位でも指定可能
await kv.set("temp:data", tempData, {
  px: 5000, // 5000ミリ秒 = 5秒
});

// Unix タイムスタンプで指定
await kv.set("event:data", eventData, {
  exat: Math.floor(Date.now() / 1000) + 3600, // 1時間後
});
```

#### 条件付き保存

```typescript
// キーが存在しない場合のみ保存
const result = await kv.set("key", "value", { nx: true });
console.log(result); // "OK" or null

// キーが存在する場合のみ更新
const result2 = await kv.set("key", "new-value", { xx: true });
```

### 値の削除

```typescript
// 単一キーの削除
await kv.del("key");

// 複数キーの削除
await kv.del("key1", "key2", "key3");

// 削除された数を取得
const deleted = await kv.del("key1", "key2");
console.log(`${deleted} keys deleted`);
```

### 存在確認

```typescript
// キーの存在確認
const exists = await kv.exists("key");
console.log(exists); // 1 (存在) or 0 (存在しない)

// 複数キーの存在確認
const count = await kv.exists("key1", "key2", "key3");
console.log(`${count} keys exist`);
```

---

## セッション管理

### セッションヘルパー関数

**ファイル**: `lib/session.ts`

```typescript
import { kv } from "@vercel/kv";
import crypto from "crypto";

interface SessionData {
  userId: string;
  email: string;
  name: string;
  createdAt: number;
}

// セッションの作成
export async function createSession(
  userId: string,
  userData: Omit<SessionData, "userId" | "createdAt">
) {
  const sessionId = crypto.randomUUID();
  const sessionData: SessionData = {
    userId,
    ...userData,
    createdAt: Date.now(),
  };

  // 7日間有効
  await kv.set(`session:${sessionId}`, sessionData, {
    ex: 60 * 60 * 24 * 7,
  });

  return sessionId;
}

// セッションの取得
export async function getSession(
  sessionId: string
): Promise<SessionData | null> {
  return await kv.get<SessionData>(`session:${sessionId}`);
}

// セッションの更新
export async function updateSession(
  sessionId: string,
  data: Partial<SessionData>
) {
  const session = await getSession(sessionId);
  if (!session) {
    throw new Error("Session not found");
  }

  const updatedSession = { ...session, ...data };
  await kv.set(`session:${sessionId}`, updatedSession, {
    ex: 60 * 60 * 24 * 7,
  });

  return updatedSession;
}

// セッションの削除
export async function deleteSession(sessionId: string) {
  await kv.del(`session:${sessionId}`);
}

// セッションの延長
export async function extendSession(sessionId: string) {
  await kv.expire(`session:${sessionId}`, 60 * 60 * 24 * 7);
}
```

### 認証 API の実装

**ファイル**: `app/api/auth/route.ts`

```typescript
import { NextRequest, NextResponse } from "next/server";
import { createSession, deleteSession } from "@/lib/session";

// ログイン
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = body;

    // ユーザー認証（実際はデータベースで確認）
    const user = await authenticateUser(email, password);
    if (!user) {
      return NextResponse.json(
        { error: "Invalid credentials" },
        { status: 401 }
      );
    }

    // セッションを作成
    const sessionId = await createSession(user.id, {
      email: user.email,
      name: user.name,
    });

    const response = NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
    });

    // Cookie にセッション ID をセット
    response.cookies.set("session-id", sessionId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7,
    });

    return response;
  } catch (error) {
    console.error("Auth error:", error);
    return NextResponse.json(
      { error: "Authentication failed" },
      { status: 500 }
    );
  }
}

// ログアウト
export async function DELETE(request: NextRequest) {
  try {
    const sessionId = request.cookies.get("session-id")?.value;

    if (sessionId) {
      await deleteSession(sessionId);
    }

    const response = NextResponse.json({ success: true });
    response.cookies.delete("session-id");

    return response;
  } catch (error) {
    console.error("Logout error:", error);
    return NextResponse.json({ error: "Logout failed" }, { status: 500 });
  }
}
```

### Middleware でセッション検証

**ファイル**: `middleware.ts`

```typescript
import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";

export async function middleware(request: NextRequest) {
  const sessionId = request.cookies.get("session-id")?.value;

  // 保護されたルート
  if (request.nextUrl.pathname.startsWith("/dashboard")) {
    if (!sessionId) {
      return NextResponse.redirect(new URL("/login", request.url));
    }

    const session = await getSession(sessionId);
    if (!session) {
      return NextResponse.redirect(new URL("/login", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*"],
};
```

---

## キャッシュ戦略

### 基本的なキャッシュ実装

```typescript
import { kv } from "@vercel/kv";

async function getDataWithCache(key: string) {
  // キャッシュを確認
  const cached = await kv.get(key);
  if (cached) {
    console.log("Cache hit");
    return cached;
  }

  // キャッシュがない場合、データを取得
  console.log("Cache miss");
  const data = await fetchDataFromDatabase(key);

  // キャッシュに保存（1時間）
  await kv.set(key, data, { ex: 3600 });

  return data;
}
```

### Cache-Aside パターン

```typescript
import { kv } from "@vercel/kv";

export async function getUserById(userId: string) {
  const cacheKey = `user:${userId}`;

  // 1. キャッシュを確認
  const cached = await kv.get(cacheKey);
  if (cached) {
    return cached;
  }

  // 2. データベースから取得
  const user = await db.user.findUnique({ where: { id: userId } });
  if (!user) {
    return null;
  }

  // 3. キャッシュに保存
  await kv.set(cacheKey, user, { ex: 3600 });

  return user;
}
```

### Write-Through パターン

```typescript
import { kv } from "@vercel/kv";

export async function updateUser(userId: string, data: any) {
  const cacheKey = `user:${userId}`;

  // 1. データベースを更新
  const updatedUser = await db.user.update({
    where: { id: userId },
    data,
  });

  // 2. キャッシュも同時に更新
  await kv.set(cacheKey, updatedUser, { ex: 3600 });

  return updatedUser;
}
```

### キャッシュの無効化

```typescript
import { kv } from "@vercel/kv";

// 単一キャッシュの削除
export async function invalidateUserCache(userId: string) {
  await kv.del(`user:${userId}`);
}

// パターンマッチによる一括削除
export async function invalidateUserCaches(userIds: string[]) {
  const keys = userIds.map((id) => `user:${id}`);
  await kv.del(...keys);
}

// データ更新時にキャッシュを削除
export async function deleteUser(userId: string) {
  // 1. データベースから削除
  await db.user.delete({ where: { id: userId } });

  // 2. キャッシュも削除
  await invalidateUserCache(userId);
}
```

---

## Rate Limiting

### 基本的な Rate Limiting

**ファイル**: `lib/rate-limit.ts`

```typescript
import { kv } from "@vercel/kv";

interface RateLimitResult {
  success: boolean;
  current: number;
  limit: number;
  reset: number;
}

export async function rateLimit(
  identifier: string,
  limit: number = 10,
  window: number = 60
): Promise<RateLimitResult> {
  const key = `ratelimit:${identifier}`;

  // カウンターをインクリメント
  const current = await kv.incr(key);

  // 初回の場合、有効期限を設定
  if (current === 1) {
    await kv.expire(key, window);
  }

  // 残り時間を取得
  const ttl = await kv.ttl(key);

  return {
    success: current <= limit,
    current,
    limit,
    reset: ttl > 0 ? ttl : window,
  };
}
```

### API での Rate Limiting 実装

```typescript
import { NextRequest, NextResponse } from "next/server";
import { rateLimit } from "@/lib/rate-limit";

export async function POST(request: NextRequest) {
  const ip = request.headers.get("x-forwarded-for") || "unknown";

  // 1分間に10リクエストまで
  const rateLimitResult = await rateLimit(ip, 10, 60);

  if (!rateLimitResult.success) {
    return NextResponse.json(
      {
        error: "Too many requests",
        retryAfter: rateLimitResult.reset,
      },
      {
        status: 429,
        headers: {
          "X-RateLimit-Limit": rateLimitResult.limit.toString(),
          "X-RateLimit-Remaining": Math.max(
            0,
            rateLimitResult.limit - rateLimitResult.current
          ).toString(),
          "X-RateLimit-Reset": rateLimitResult.reset.toString(),
        },
      }
    );
  }

  // 通常の処理...
  return NextResponse.json({ success: true });
}
```

### ユーザーごとの Rate Limiting

```typescript
import { rateLimit } from "@/lib/rate-limit";

export async function POST(request: NextRequest) {
  const sessionId = request.cookies.get("session-id")?.value;

  if (!sessionId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // ユーザーごとに制限
  const rateLimitResult = await rateLimit(`user:${sessionId}`, 100, 3600);

  if (!rateLimitResult.success) {
    return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 });
  }

  // 処理を続行...
}
```

### スライディングウィンドウ Rate Limiting

```typescript
import { kv } from "@vercel/kv";

export async function slidingWindowRateLimit(
  identifier: string,
  limit: number,
  window: number
): Promise<RateLimitResult> {
  const key = `ratelimit:sliding:${identifier}`;
  const now = Date.now();
  const windowStart = now - window * 1000;

  // 古いエントリを削除
  await kv.zremrangebyscore(key, 0, windowStart);

  // 現在のカウントを取得
  const current = await kv.zcard(key);

  if (current >= limit) {
    const oldestEntry = await kv.zrange(key, 0, 0, { withScores: true });
    const resetTime =
      oldestEntry.length > 0
        ? Math.ceil((Number(oldestEntry[1]) + window * 1000 - now) / 1000)
        : window;

    return {
      success: false,
      current,
      limit,
      reset: resetTime,
    };
  }

  // 新しいエントリを追加
  await kv.zadd(key, { score: now, member: `${now}-${Math.random()}` });
  await kv.expire(key, window);

  return {
    success: true,
    current: current + 1,
    limit,
    reset: window,
  };
}
```

---

## 高度な使用例

### 1. リアルタイムカウンター

```typescript
import { kv } from "@vercel/kv";

// ページビューカウンター
export async function incrementPageView(pageId: string) {
  const key = `pageview:${pageId}`;
  const count = await kv.incr(key);
  return count;
}

// いいねカウンター
export async function toggleLike(postId: string, userId: string) {
  const likeKey = `post:${postId}:likes`;
  const userLikeKey = `user:${userId}:liked:${postId}`;

  const hasLiked = await kv.exists(userLikeKey);

  if (hasLiked) {
    // いいね解除
    await kv.del(userLikeKey);
    await kv.decr(likeKey);
  } else {
    // いいね追加
    await kv.set(userLikeKey, 1);
    await kv.incr(likeKey);
  }

  const count = (await kv.get<number>(likeKey)) || 0;
  return { liked: !hasLiked, count };
}
```

### 2. リーダーボード

```typescript
import { kv } from "@vercel/kv";

// スコアを追加
export async function addScore(userId: string, score: number) {
  await kv.zadd("leaderboard", { score, member: userId });
}

// トップ10を取得
export async function getTopPlayers(limit: number = 10) {
  const players = await kv.zrange("leaderboard", 0, limit - 1, {
    rev: true,
    withScores: true,
  });

  const result = [];
  for (let i = 0; i < players.length; i += 2) {
    result.push({
      userId: players[i] as string,
      score: players[i + 1] as number,
      rank: Math.floor(i / 2) + 1,
    });
  }

  return result;
}

// ユーザーの順位を取得
export async function getUserRank(userId: string) {
  const rank = await kv.zrevrank("leaderboard", userId);
  const score = await kv.zscore("leaderboard", userId);

  return {
    rank: rank !== null ? rank + 1 : null,
    score,
  };
}
```

### 3. 重複排除（Deduplication）

```typescript
import { kv } from "@vercel/kv";

export async function processOnce(operationId: string, ttl: number = 3600) {
  const key = `operation:${operationId}`;

  // 既に処理済みかチェック
  const alreadyProcessed = await kv.exists(key);
  if (alreadyProcessed) {
    return { success: false, message: "Already processed" };
  }

  // 処理を実行
  await performOperation();

  // 処理済みマークを保存
  await kv.set(key, 1, { ex: ttl });

  return { success: true };
}
```

### 4. 分散ロック

```typescript
import { kv } from "@vercel/kv";

export async function acquireLock(
  resource: string,
  ttl: number = 10
): Promise<string | null> {
  const lockKey = `lock:${resource}`;
  const lockValue = crypto.randomUUID();

  // ロックを取得（キーが存在しない場合のみ）
  const acquired = await kv.set(lockKey, lockValue, {
    nx: true,
    ex: ttl,
  });

  return acquired ? lockValue : null;
}

export async function releaseLock(resource: string, lockValue: string) {
  const lockKey = `lock:${resource}`;
  const currentValue = await kv.get(lockKey);

  // 自分が取得したロックの場合のみ解放
  if (currentValue === lockValue) {
    await kv.del(lockKey);
    return true;
  }

  return false;
}

// 使用例
export async function criticalOperation() {
  const lock = await acquireLock("resource-123", 30);

  if (!lock) {
    throw new Error("Could not acquire lock");
  }

  try {
    // クリティカルセクション
    await performCriticalOperation();
  } finally {
    await releaseLock("resource-123", lock);
  }
}
```

### 5. Pub/Sub（リアルタイム通知）

```typescript
import { kv } from "@vercel/kv";

// メッセージを発行
export async function publishMessage(channel: string, message: any) {
  await kv.publish(channel, JSON.stringify(message));
}

// 通知の実装例
export async function notifyUser(userId: string, notification: any) {
  await publishMessage(`user:${userId}:notifications`, notification);
}

// Server-Sent Events での受信
export async function GET(request: NextRequest) {
  const userId = request.nextUrl.searchParams.get("userId");

  const stream = new ReadableStream({
    async start(controller) {
      const channel = `user:${userId}:notifications`;

      // Pub/Sub をサブスクライブ
      const subscription = await kv.subscribe(channel);

      for await (const message of subscription) {
        const data = `data: ${message}\n\n`;
        controller.enqueue(new TextEncoder().encode(data));
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
```

---

## トラブルシューティング

### エラー: "Connection refused"

```bash
# 環境変数を確認
echo $KV_URL
echo $KV_REST_API_URL

# .env.local に設定
KV_URL="redis://..."
KV_REST_API_URL="https://..."
KV_REST_API_TOKEN="..."

# Vercel にデプロイする場合は自動設定
vercel env pull
```

### エラー: "Authentication failed"

```bash
# トークンを確認
echo $KV_REST_API_TOKEN

# Vercel ダッシュボードで再生成
# Storage → KV → Settings → Reset Token
```

### パフォーマンスの最適化

#### 1. パイプライン処理

```typescript
import { kv } from "@vercel/kv";

// 悪い例: 個別にリクエスト
const user1 = await kv.get("user:1");
const user2 = await kv.get("user:2");
const user3 = await kv.get("user:3");

// 良い例: パイプライン
const pipeline = kv.pipeline();
pipeline.get("user:1");
pipeline.get("user:2");
pipeline.get("user:3");
const results = await pipeline.exec();
```

#### 2. バッチ処理

```typescript
// 複数の操作を一度に実行
const pipeline = kv.pipeline();
pipeline.set("key1", "value1");
pipeline.set("key2", "value2");
pipeline.incr("counter");
await pipeline.exec();
```

---

## まとめ

### チェックリスト

- [ ] Vercel KV ストアを作成
- [ ] @vercel/kv をインストール
- [ ] 環境変数を設定
- [ ] セッション管理を実装
- [ ] キャッシュ戦略を実装
- [ ] Rate Limiting を実装
- [ ] ローカルで動作確認
- [ ] Vercel にデプロイ

### ベストプラクティス

- ✅ TTL を設定してメモリ使用量を管理
- ✅ キーに命名規則を使用（例: `user:123`, `session:abc`）
- ✅ Rate Limiting で API を保護
- ✅ パイプライン処理でパフォーマンス向上
- ✅ エラーハンドリングを適切に実装

### 次のステップ

- AI SDK でチャットボット機能を実装
- Edge Config で Feature Flags を管理
- Vercel Postgres でデータ永続化

---

**最終更新**: 2025 年 11 月
**難易度**: ★★★☆☆
**所要時間**: 2-3 時間
