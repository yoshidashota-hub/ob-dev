# 09 - Subscriptions（リアルタイム通信）

## この章で学ぶこと

- tRPC Subscriptions の概念と仕組み
- WebSocket を使ったリアルタイム通信
- サブスクリプションの実装パターン
- イベント駆動アーキテクチャの構築

## Subscriptions の概要

tRPC Subscriptions は WebSocket を使ってサーバーからクライアントへリアルタイムでデータをプッシュする機能です。チャット、通知、ライブ更新などに適しています。

## セットアップ

### インストール

```bash
npm install @trpc/server @trpc/client ws
npm install -D @types/ws
```

### WebSocket サーバーの作成

```typescript
// server/wss.ts
import { WebSocketServer } from "ws";
import { applyWSSHandler } from "@trpc/server/adapters/ws";
import { appRouter } from "./router";
import { createContext } from "./context";

const wss = new WebSocketServer({
  port: 3001,
});

const handler = applyWSSHandler({
  wss,
  router: appRouter,
  createContext,
});

wss.on("connection", (ws) => {
  console.log(`➕ Connection (${wss.clients.size})`);
  ws.once("close", () => {
    console.log(`➖ Connection (${wss.clients.size})`);
  });
});

console.log("✅ WebSocket Server listening on ws://localhost:3001");

process.on("SIGTERM", () => {
  console.log("SIGTERM received, closing WebSocket server");
  handler.broadcastReconnectNotification();
  wss.close();
});
```

## イベントエミッターの実装

### EventEmitter の作成

```typescript
// server/events.ts
import { EventEmitter } from "events";

// 型安全なイベントエミッター
interface MyEvents {
  newMessage: (data: { id: string; content: string; userId: string }) => void;
  userJoined: (data: { userId: string; roomId: string }) => void;
  userLeft: (data: { userId: string; roomId: string }) => void;
  typing: (data: { userId: string; roomId: string }) => void;
}

declare interface TypedEventEmitter {
  on<K extends keyof MyEvents>(event: K, listener: MyEvents[K]): this;
  off<K extends keyof MyEvents>(event: K, listener: MyEvents[K]): this;
  emit<K extends keyof MyEvents>(
    event: K,
    ...args: Parameters<MyEvents[K]>
  ): boolean;
}

class TypedEventEmitter extends EventEmitter {}

export const ee = new TypedEventEmitter();
```

## Subscription の定義

### 基本的なサブスクリプション

```typescript
// server/routers/chat.ts
import { observable } from "@trpc/server/observable";
import { z } from "zod";
import { router, publicProcedure } from "../trpc";
import { ee } from "../events";

export const chatRouter = router({
  // メッセージ送信（Mutation）
  sendMessage: publicProcedure
    .input(
      z.object({
        roomId: z.string(),
        content: z.string(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const message = {
        id: crypto.randomUUID(),
        content: input.content,
        userId: ctx.user?.id ?? "anonymous",
        roomId: input.roomId,
        createdAt: new Date(),
      };

      // データベースに保存
      await ctx.db.message.create({ data: message });

      // イベントを発火
      ee.emit("newMessage", message);

      return message;
    }),

  // メッセージのサブスクリプション
  onNewMessage: publicProcedure
    .input(z.object({ roomId: z.string() }))
    .subscription(({ input }) => {
      return observable<{
        id: string;
        content: string;
        userId: string;
      }>((emit) => {
        const onMessage = (data: {
          id: string;
          content: string;
          userId: string;
          roomId: string;
        }) => {
          // 指定されたルームのメッセージのみを送信
          if (data.roomId === input.roomId) {
            emit.next({
              id: data.id,
              content: data.content,
              userId: data.userId,
            });
          }
        };

        // イベントリスナーを登録
        ee.on("newMessage", onMessage);

        // クリーンアップ関数を返す
        return () => {
          ee.off("newMessage", onMessage);
        };
      });
    }),
});
```

### 複数のサブスクリプション

```typescript
// server/routers/presence.ts
import { observable } from "@trpc/server/observable";
import { z } from "zod";
import { router, publicProcedure } from "../trpc";
import { ee } from "../events";

export const presenceRouter = router({
  // ユーザー参加通知
  onUserJoined: publicProcedure
    .input(z.object({ roomId: z.string() }))
    .subscription(({ input }) => {
      return observable<{ userId: string }>((emit) => {
        const onJoin = (data: { userId: string; roomId: string }) => {
          if (data.roomId === input.roomId) {
            emit.next({ userId: data.userId });
          }
        };
        ee.on("userJoined", onJoin);
        return () => ee.off("userJoined", onJoin);
      });
    }),

  // ユーザー退出通知
  onUserLeft: publicProcedure
    .input(z.object({ roomId: z.string() }))
    .subscription(({ input }) => {
      return observable<{ userId: string }>((emit) => {
        const onLeave = (data: { userId: string; roomId: string }) => {
          if (data.roomId === input.roomId) {
            emit.next({ userId: data.userId });
          }
        };
        ee.on("userLeft", onLeave);
        return () => ee.off("userLeft", onLeave);
      });
    }),

  // タイピング状態
  onTyping: publicProcedure
    .input(z.object({ roomId: z.string() }))
    .subscription(({ input }) => {
      return observable<{ userId: string }>((emit) => {
        const onTyping = (data: { userId: string; roomId: string }) => {
          if (data.roomId === input.roomId) {
            emit.next({ userId: data.userId });
          }
        };
        ee.on("typing", onTyping);
        return () => ee.off("typing", onTyping);
      });
    }),

  // タイピング開始を通知
  startTyping: publicProcedure
    .input(z.object({ roomId: z.string() }))
    .mutation(({ input, ctx }) => {
      ee.emit("typing", { userId: ctx.user!.id, roomId: input.roomId });
      return { success: true };
    }),
});
```

## クライアント側の実装

### WebSocket リンクの設定

```typescript
// utils/trpc.ts
import { createTRPCReact } from "@trpc/react-query";
import { createWSClient, wsLink, httpBatchLink, splitLink } from "@trpc/client";
import type { AppRouter } from "../server/router";

export const trpc = createTRPCReact<AppRouter>();

// WebSocket クライアントの作成
const wsClient = createWSClient({
  url: "ws://localhost:3001",
  retryDelayMs: () => 3000, // 再接続の遅延
  onClose: (cause) => {
    console.log("WebSocket closed:", cause);
  },
  onOpen: () => {
    console.log("WebSocket connected");
  },
});

export function TRPCProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());

  const [trpcClient] = useState(() =>
    trpc.createClient({
      links: [
        // サブスクリプションとそれ以外でリンクを分ける
        splitLink({
          condition: (op) => op.type === "subscription",
          true: wsLink({
            client: wsClient,
          }),
          false: httpBatchLink({
            url: "/api/trpc",
          }),
        }),
      ],
    })
  );

  return (
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    </trpc.Provider>
  );
}
```

### サブスクリプションの使用

```typescript
// components/ChatRoom.tsx
"use client";

import { useEffect, useState } from "react";
import { trpc } from "../utils/trpc";

export function ChatRoom({ roomId }: { roomId: string }) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");

  // 既存のメッセージを取得
  const { data: initialMessages } = trpc.chat.getMessages.useQuery({ roomId });

  useEffect(() => {
    if (initialMessages) {
      setMessages(initialMessages);
    }
  }, [initialMessages]);

  // 新しいメッセージのサブスクリプション
  trpc.chat.onNewMessage.useSubscription(
    { roomId },
    {
      onData: (message) => {
        setMessages((prev) => [...prev, message]);
      },
      onError: (err) => {
        console.error("Subscription error:", err);
      },
    }
  );

  // メッセージ送信
  const sendMessage = trpc.chat.sendMessage.useMutation();

  const handleSend = () => {
    if (newMessage.trim()) {
      sendMessage.mutate({ roomId, content: newMessage });
      setNewMessage("");
    }
  };

  return (
    <div>
      <div className="messages">
        {messages.map((msg) => (
          <div key={msg.id}>
            <strong>{msg.userId}</strong>: {msg.content}
          </div>
        ))}
      </div>
      <input
        value={newMessage}
        onChange={(e) => setNewMessage(e.target.value)}
        onKeyPress={(e) => e.key === "Enter" && handleSend()}
      />
      <button onClick={handleSend}>Send</button>
    </div>
  );
}
```

### プレゼンス表示の実装

```typescript
// components/PresenceIndicator.tsx
"use client";

import { useState, useEffect } from "react";
import { trpc } from "../utils/trpc";

export function PresenceIndicator({ roomId }: { roomId: string }) {
  const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set());
  const [typingUsers, setTypingUsers] = useState<Set<string>>(new Set());

  // ユーザー参加の購読
  trpc.presence.onUserJoined.useSubscription(
    { roomId },
    {
      onData: ({ userId }) => {
        setOnlineUsers((prev) => new Set(prev).add(userId));
      },
    }
  );

  // ユーザー退出の購読
  trpc.presence.onUserLeft.useSubscription(
    { roomId },
    {
      onData: ({ userId }) => {
        setOnlineUsers((prev) => {
          const next = new Set(prev);
          next.delete(userId);
          return next;
        });
      },
    }
  );

  // タイピング状態の購読
  trpc.presence.onTyping.useSubscription(
    { roomId },
    {
      onData: ({ userId }) => {
        setTypingUsers((prev) => new Set(prev).add(userId));
        // 3秒後にタイピング状態を解除
        setTimeout(() => {
          setTypingUsers((prev) => {
            const next = new Set(prev);
            next.delete(userId);
            return next;
          });
        }, 3000);
      },
    }
  );

  return (
    <div>
      <div>Online: {Array.from(onlineUsers).join(", ")}</div>
      {typingUsers.size > 0 && (
        <div>{Array.from(typingUsers).join(", ")} is typing...</div>
      )}
    </div>
  );
}
```

## 認証付きサブスクリプション

```typescript
// server/routers/notifications.ts
import { observable } from "@trpc/server/observable";
import { router, protectedProcedure } from "../trpc";
import { ee } from "../events";

export const notificationRouter = router({
  // 認証が必要なサブスクリプション
  onNotification: protectedProcedure.subscription(({ ctx }) => {
    const userId = ctx.user.id;

    return observable<{
      type: string;
      message: string;
    }>((emit) => {
      const onNotification = (data: {
        userId: string;
        type: string;
        message: string;
      }) => {
        // 自分宛ての通知のみを送信
        if (data.userId === userId) {
          emit.next({
            type: data.type,
            message: data.message,
          });
        }
      };

      ee.on("notification", onNotification);

      return () => {
        ee.off("notification", onNotification);
      };
    });
  }),
});
```

## エラーハンドリング

```typescript
// クライアント側のエラーハンドリング
trpc.chat.onNewMessage.useSubscription(
  { roomId },
  {
    onData: (message) => {
      setMessages((prev) => [...prev, message]);
    },
    onError: (err) => {
      console.error("Subscription error:", err);
      // エラー通知を表示
      toast.error("Connection lost. Trying to reconnect...");
    },
    onStarted: () => {
      console.log("Subscription started");
    },
    onStopped: () => {
      console.log("Subscription stopped");
    },
  }
);
```

## まとめ

- Subscriptions は WebSocket を使ったリアルタイム通信機能
- observable 関数でサブスクリプションを定義
- EventEmitter でサーバー内部のイベントを管理
- splitLink で HTTP と WebSocket のリンクを分離
- useSubscription フックでクライアントから購読
- 認証付きサブスクリプションも実装可能

## 確認問題

1. tRPC Subscriptions と通常の Query/Mutation の違いを説明してください
2. observable 関数の戻り値（クリーンアップ関数）の役割は何ですか？
3. splitLink を使う理由を説明してください
4. リアルタイムチャットアプリで必要なサブスクリプションを3つ挙げてください

## 次の章へ

[10 - NextJS-App-Router](./10-NextJS-App-Router.md) では、Next.js App Router との統合について学びます。
