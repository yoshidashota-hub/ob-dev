# 11 - Next.js Pages Router 統合

## この章で学ぶこと

- Pages Router での tRPC セットアップ
- getServerSideProps での使用
- SSR と SSG パターン
- API ルートの構成

## プロジェクト構造

```
pages/
├── api/
│   └── trpc/
│       └── [trpc].ts       # tRPC API ルート
├── _app.tsx                # Provider 設定
├── index.tsx
└── users/
    ├── index.tsx
    └── [id].tsx
src/
├── server/
│   ├── router.ts
│   └── trpc.ts
└── utils/
    └── trpc.ts             # クライアント設定
```

## API ルートのセットアップ

### tRPC ハンドラー

```typescript
// pages/api/trpc/[trpc].ts
import { createNextApiHandler } from "@trpc/server/adapters/next";
import { appRouter } from "@/server/router";
import { createContext } from "@/server/trpc";

export default createNextApiHandler({
  router: appRouter,
  createContext,
  onError: ({ path, error }) => {
    console.error(`tRPC Error on '${path}':`, error);
  },
});
```

## クライアントのセットアップ

### tRPC クライアント設定

```typescript
// src/utils/trpc.ts
import { httpBatchLink } from "@trpc/client";
import { createTRPCNext } from "@trpc/next";
import superjson from "superjson";
import type { AppRouter } from "@/server/router";

function getBaseUrl() {
  if (typeof window !== "undefined") return "";
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return `http://localhost:${process.env.PORT ?? 3000}`;
}

export const trpc = createTRPCNext<AppRouter>({
  config() {
    return {
      transformer: superjson,
      links: [
        httpBatchLink({
          url: `${getBaseUrl()}/api/trpc`,
        }),
      ],
      queryClientConfig: {
        defaultOptions: {
          queries: {
            staleTime: 5 * 1000,
          },
        },
      },
    };
  },
  ssr: false, // SSR を無効化（後述の SSR セクションで有効化）
});
```

### _app.tsx の設定

```typescript
// pages/_app.tsx
import type { AppType } from "next/app";
import { trpc } from "@/utils/trpc";

const MyApp: AppType = ({ Component, pageProps }) => {
  return <Component {...pageProps} />;
};

export default trpc.withTRPC(MyApp);
```

## 基本的な使用方法

### クライアントコンポーネントでの使用

```typescript
// pages/users/index.tsx
import { trpc } from "@/utils/trpc";
import Link from "next/link";

export default function UsersPage() {
  const { data: users, isLoading, error } = trpc.user.list.useQuery();

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <div>
      <h1>Users</h1>
      <ul>
        {users?.map((user) => (
          <li key={user.id}>
            <Link href={`/users/${user.id}`}>{user.name}</Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
```

### Mutation の使用

```typescript
// pages/users/new.tsx
import { useState } from "react";
import { useRouter } from "next/router";
import { trpc } from "@/utils/trpc";

export default function NewUserPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");

  const utils = trpc.useUtils();

  const createUser = trpc.user.create.useMutation({
    onSuccess: () => {
      utils.user.list.invalidate();
      router.push("/users");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createUser.mutate({ name, email });
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Name"
      />
      <input
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Email"
      />
      <button type="submit" disabled={createUser.isPending}>
        Create
      </button>
    </form>
  );
}
```

## getServerSideProps との統合

### SSR ヘルパーの使用

```typescript
// src/utils/trpc.ts
import { createServerSideHelpers } from "@trpc/react-query/server";
import { appRouter } from "@/server/router";
import { createContext } from "@/server/trpc";
import superjson from "superjson";

export const createSSRHelpers = async (ctx: GetServerSidePropsContext) => {
  return createServerSideHelpers({
    router: appRouter,
    ctx: await createContext({ req: ctx.req, res: ctx.res }),
    transformer: superjson,
  });
};
```

### getServerSideProps での使用

```typescript
// pages/users/[id].tsx
import type { GetServerSidePropsContext, InferGetServerSidePropsType } from "next";
import { trpc } from "@/utils/trpc";
import { createSSRHelpers } from "@/utils/trpc";

export async function getServerSideProps(
  ctx: GetServerSidePropsContext<{ id: string }>
) {
  const helpers = await createSSRHelpers(ctx);
  const id = ctx.params?.id;

  if (!id) {
    return { notFound: true };
  }

  // サーバーでデータをプリフェッチ
  await helpers.user.getById.prefetch({ id });

  return {
    props: {
      trpcState: helpers.dehydrate(),
      id,
    },
  };
}

export default function UserPage(
  props: InferGetServerSidePropsType<typeof getServerSideProps>
) {
  const { id } = props;

  // プリフェッチされたデータを使用
  const { data: user } = trpc.user.getById.useQuery({ id });

  if (!user) return <div>User not found</div>;

  return (
    <div>
      <h1>{user.name}</h1>
      <p>{user.email}</p>
    </div>
  );
}
```

## getStaticProps と getStaticPaths

### 静的生成

```typescript
// pages/posts/[slug].tsx
import type {
  GetStaticPaths,
  GetStaticPropsContext,
  InferGetStaticPropsType,
} from "next";
import { createServerSideHelpers } from "@trpc/react-query/server";
import { appRouter } from "@/server/router";
import { prisma } from "@/server/db";
import superjson from "superjson";
import { trpc } from "@/utils/trpc";

export async function getStaticPaths(): Promise<GetStaticPaths> {
  const posts = await prisma.post.findMany({
    select: { slug: true },
  });

  return {
    paths: posts.map((post) => ({ params: { slug: post.slug } })),
    fallback: "blocking", // 新しいページは SSR でレンダリング
  };
}

export async function getStaticProps(
  ctx: GetStaticPropsContext<{ slug: string }>
) {
  const helpers = createServerSideHelpers({
    router: appRouter,
    ctx: { db: prisma, session: null },
    transformer: superjson,
  });

  const slug = ctx.params?.slug;

  if (!slug) {
    return { notFound: true };
  }

  await helpers.post.getBySlug.prefetch({ slug });

  return {
    props: {
      trpcState: helpers.dehydrate(),
      slug,
    },
    revalidate: 60, // ISR: 60秒ごとに再生成
  };
}

export default function PostPage(
  props: InferGetStaticPropsType<typeof getStaticProps>
) {
  const { slug } = props;
  const { data: post } = trpc.post.getBySlug.useQuery({ slug });

  if (!post) return <div>Post not found</div>;

  return (
    <article>
      <h1>{post.title}</h1>
      <div dangerouslySetInnerHTML={{ __html: post.content }} />
    </article>
  );
}
```

## SSR の有効化

### クライアント設定の更新

```typescript
// src/utils/trpc.ts
import { httpBatchLink, loggerLink } from "@trpc/client";
import { createTRPCNext } from "@trpc/next";
import superjson from "superjson";
import type { AppRouter } from "@/server/router";
import type { inferRouterInputs, inferRouterOutputs } from "@trpc/server";

export const trpc = createTRPCNext<AppRouter>({
  config({ ctx }) {
    return {
      transformer: superjson,
      links: [
        loggerLink({
          enabled: (opts) =>
            process.env.NODE_ENV === "development" ||
            (opts.direction === "down" && opts.result instanceof Error),
        }),
        httpBatchLink({
          url: `${getBaseUrl()}/api/trpc`,
          headers() {
            if (!ctx?.req?.headers) {
              return {};
            }
            // Cookie を転送（認証用）
            return {
              cookie: ctx.req.headers.cookie,
            };
          },
        }),
      ],
    };
  },
  ssr: true, // SSR を有効化
});

// 型ヘルパー
export type RouterInputs = inferRouterInputs<AppRouter>;
export type RouterOutputs = inferRouterOutputs<AppRouter>;
```

## 認証との統合

### NextAuth.js との組み合わせ

```typescript
// server/trpc.ts
import { initTRPC, TRPCError } from "@trpc/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/pages/api/auth/[...nextauth]";
import type { CreateNextContextOptions } from "@trpc/server/adapters/next";

export const createContext = async (opts: CreateNextContextOptions) => {
  const session = await getServerSession(opts.req, opts.res, authOptions);

  return {
    session,
    db: prisma,
  };
};

// pages/api/protected.tsx
import { trpc } from "@/utils/trpc";
import { getSession } from "next-auth/react";
import type { GetServerSidePropsContext } from "next";

export async function getServerSideProps(ctx: GetServerSidePropsContext) {
  const session = await getSession(ctx);

  if (!session) {
    return {
      redirect: {
        destination: "/login",
        permanent: false,
      },
    };
  }

  const helpers = await createSSRHelpers(ctx);
  await helpers.user.me.prefetch();

  return {
    props: {
      trpcState: helpers.dehydrate(),
    },
  };
}

export default function ProtectedPage() {
  const { data: user } = trpc.user.me.useQuery();

  return (
    <div>
      <h1>Welcome, {user?.name}</h1>
    </div>
  );
}
```

## エラーハンドリング

### カスタムエラーページ

```typescript
// pages/_error.tsx
import { NextPageContext } from "next";
import { TRPCClientError } from "@trpc/client";

interface Props {
  statusCode: number;
  message?: string;
}

function ErrorPage({ statusCode, message }: Props) {
  return (
    <div>
      <h1>{statusCode}</h1>
      <p>{message || "An error occurred"}</p>
    </div>
  );
}

ErrorPage.getInitialProps = ({ res, err }: NextPageContext) => {
  let statusCode = res?.statusCode ?? err?.statusCode ?? 404;
  let message = err?.message;

  // tRPC エラーの処理
  if (err instanceof TRPCClientError) {
    statusCode = err.data?.httpStatus ?? 500;
    message = err.message;
  }

  return { statusCode, message };
};

export default ErrorPage;
```

## パフォーマンス最適化

### データのプリロード

```typescript
// pages/index.tsx
import { trpc } from "@/utils/trpc";
import Link from "next/link";

export default function HomePage() {
  const utils = trpc.useUtils();
  const { data: posts } = trpc.post.list.useQuery();

  // ホバー時にプリフェッチ
  const handleMouseEnter = (id: string) => {
    utils.post.getById.prefetch({ id });
  };

  return (
    <ul>
      {posts?.map((post) => (
        <li key={post.id} onMouseEnter={() => handleMouseEnter(post.id)}>
          <Link href={`/posts/${post.id}`}>{post.title}</Link>
        </li>
      ))}
    </ul>
  );
}
```

## まとめ

- Pages Router では `createTRPCNext` を使用
- `_app.tsx` で `trpc.withTRPC` でラップ
- `getServerSideProps` で `createServerSideHelpers` を使用
- `getStaticProps` と ISR で静的生成
- SSR を有効にすると Cookie が自動的に転送される
- NextAuth.js との組み合わせで認証を実装

## 確認問題

1. App Router と Pages Router での tRPC セットアップの違いを説明してください
2. getServerSideProps でデータをプリフェッチする利点は何ですか？
3. SSR を有効にした場合の Cookie の扱いを説明してください
4. fallback: "blocking" の動作を説明してください

## 次の章へ

[12 - Express-Fastify](./12-Express-Fastify.md) では、Express や Fastify での tRPC 使用について学びます。
