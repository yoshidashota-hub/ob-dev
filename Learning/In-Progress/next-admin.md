# Next Admin 完全ガイド

> **最終更新**: 2025-12-02
> **バージョン**: 8.4.1 (最新)
> **公式サイト**: https://next-admin.js.org > **GitHub**: https://github.com/premieroctet/next-admin > **ドキュメント**: https://next-admin-docs.vercel.app

## 📋 目次

1. [概要](#概要)
2. [主要機能](#主要機能)
3. [インストール](#インストール)
4. [基本セットアップ](#基本セットアップ)
5. [設定オプション](#設定オプション)
6. [カスタマイズ](#カスタマイズ)
7. [対応フレームワーク](#対応フレームワーク)
8. [実践例](#実践例)
9. [ベストプラクティス](#ベストプラクティス)
10. [トラブルシューティング](#トラブルシューティング)

---

## 概要

### Next Admin とは？

**Next Admin** は、Prisma ORM と React フレームワーク (Next.js, Remix, TanStack Start) で構築されたアプリケーション向けの、カスタマイズ可能なターンキー管理ダッシュボードライブラリです。

### 特徴

- 🎯 **ターンキーソリューション**: すぐに使える管理画面
- 🔧 **高度なカスタマイズ**: 外観と動作を完全にカスタマイズ可能
- 🗄️ **Prisma 統合**: Prisma スキーマから自動生成
- ⚡ **高速セットアップ**: CLI で数分でセットアップ完了
- 🎨 **モダンな UI**: TailwindCSS ベースのデザイン

### ユースケース

- 社内管理ツールの構築
- データベース管理 GUI
- CRUD 操作が必要なバックオフィス
- MVP の管理画面を素早く構築

---

## 主要機能

### ✅ コア機能

| 機能                     | 説明                                           |
| ------------------------ | ---------------------------------------------- |
| 💅 **カスタマイズ可能**  | ダッシュボードの外観と動作を自由にカスタマイズ |
| 💽 **リレーション管理**  | データベースのリレーションシップを管理         |
| 👩‍💻 **ユーザー管理**      | CRUD 操作をサポート                            |
| 🎨 **ウィジェット**      | カスタマイズ可能なダッシュボードウィジェット   |
| ⚛️ **Prisma 統合**       | Prisma ORM との完全な統合                      |
| 👔 **リスト & フォーム** | リストビューとフォームのカスタマイズ           |
| 🔍 **検索 & フィルター** | 強力な検索とフィルター機能                     |
| 🌐 **i18n サポート**     | 多言語対応                                     |
| 🎨 **テーマ**            | ダークモード対応                               |

### 🚀 対応フレームワーク

- **Next.js** (App Router / Pages Router)
- **Remix**
- **TanStack Start**
- **任意のフルスタックフレームワーク**

---

## インストール

### 方法 1: CLI を使用 (推奨)

**最も簡単な方法**です。CLI が必要なファイルを自動生成します。

```bash
npx @premieroctet/next-admin-cli@latest init
```

**オプションを確認**:

```bash
npx @premieroctet/next-admin-cli@latest init --help
```

⚠️ **注意**: CLI は現在 Next.js プロジェクトのみサポート

### 方法 2: 手動インストール

#### 1. パッケージをインストール

```bash
# yarn
yarn add @premieroctet/next-admin @premieroctet/next-admin-generator-prisma

# npm
npm install @premieroctet/next-admin @premieroctet/next-admin-generator-prisma

# pnpm
pnpm add @premieroctet/next-admin @premieroctet/next-admin-generator-prisma
```

#### 2. TailwindCSS セットアップ

Next Admin は TailwindCSS を使用します。

**Tailwind v4 の場合**:

```css
/* styles.css */
@import "tailwindcss";
@import "@premieroctet/next-admin/theme";
@source "./node_modules/@premieroctet/next-admin/dist";
```

**Tailwind v3 以下の場合**:

```js
// tailwind.config.js
module.exports = {
  presets: [require("@premieroctet/next-admin/preset")],
  content: [
    // ... your content
    "./node_modules/@premieroctet/next-admin/**/*.{js,ts,jsx,tsx}",
  ],
};
```

#### 3. Prisma セットアップ

**schema.prisma に generator を追加**:

```prisma
generator nextAdmin {
  provider = "next-admin-generator-prisma"
}
```

⚠️ **重要**: 新しい Prisma Client generator を使用する場合、Next-Admin generator は Prisma Client generator の**後に**配置してください。

**スキーマを生成**:

```bash
yarn run prisma generate
```

---

## 基本セットアップ

### Next.js App Router

#### 1. 管理画面ページを作成

**`app/admin/[[...nextadmin]]/page.tsx`**:

```typescript
import { PageProps } from "@premieroctet/next-admin";
import { getNextAdminProps } from "@premieroctet/next-admin/appRouter";
import { NextAdmin } from "@premieroctet/next-admin/adapters/next";
import { prisma } from "@/prisma";
import "@/styles.css"; // Tailwind CSS

export default async function AdminPage({ params, searchParams }: PageProps) {
  const props = await getNextAdminProps({
    params: params.nextadmin,
    searchParams,
    basePath: "/admin",
    apiBasePath: "/api/admin",
    prisma,
    // options (オプション)
  });

  return <NextAdmin {...props} />;
}
```

⚠️ **注意点**:

- `use client` を使用しないでください（Server Component として動作）
- App Router では `options` prop に関数を含めるとエラーになります
- `suppressHydrationWarning` を最も近い `<html>` タグに追加してください（ダークモード対応のため）

#### 2. API ルートを作成

**`app/api/admin/[[...nextadmin]]/route.ts`**:

```typescript
import { prisma } from "@/prisma";
import { createHandler } from "@premieroctet/next-admin/appHandler";

const { run } = createHandler({
  apiBasePath: "/api/admin",
  prisma,
  // options (オプション)
});

export { run as DELETE, run as GET, run as POST };
```

### Next.js Pages Router

#### 1. 管理画面ページを作成

**`pages/admin/[[...nextadmin]].tsx`**:

```typescript
import { GetServerSideProps } from "next";
import { getNextAdminProps } from "@premieroctet/next-admin/pageRouter";
import { NextAdmin } from "@premieroctet/next-admin/adapters/next";
import { prisma } from "@/prisma";
import { options } from "./options";

export default function Admin(props: any) {
  return <NextAdmin {...props} options={options} />;
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const props = await getNextAdminProps({
    params: context.params?.nextadmin as string[],
    searchParams: context.query,
    basePath: "/admin",
    apiBasePath: "/api/admin",
    prisma,
    options,
  });

  return {
    props,
  };
};
```

#### 2. API ルートを作成

**`pages/api/admin/[[...nextadmin]].ts`**:

```typescript
import { NextApiRequest, NextApiResponse } from "next";
import { createHandler } from "@premieroctet/next-admin/pageHandler";
import { prisma } from "@/prisma";
import { options } from "../../admin/options";

const { run } = createHandler({
  apiBasePath: "/api/admin",
  prisma,
  options,
});

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  return run(req, res);
}
```

### 使用方法

セットアップ完了後、以下の URL にアクセス:

```
http://localhost:3000/admin
```

---

## 設定オプション

### NextAdminOptions の構造

オプションを一元管理するため、別ファイルに定義することをお勧めします。

**`app/admin/options.ts`** (または `options.tsx`):

```typescript
import { NextAdminOptions } from "@premieroctet/next-admin";

export const options: NextAdminOptions = {
  // タイトル
  title: "⚡️ My Admin Dashboard",

  // ベースパス
  basePath: "/admin",

  // モデル設定
  model: {
    User: {
      toString: (user) => `${user.name} (${user.email})`,
      title: "Users",
      icon: "UsersIcon", // Heroicons
      list: {
        display: ["name", "email", "role", "createdAt"],
        search: ["name", "email"],
        filters: [
          {
            name: "is Admin",
            active: false,
            value: {
              role: {
                equals: "ADMIN",
              },
            },
          },
        ],
      },
      edit: {
        display: ["name", "email", "role", "posts"],
      },
    },
    Post: {
      toString: (post) => `${post.title}`,
      title: "Posts",
      icon: "DocumentTextIcon",
      list: {
        display: ["title", "published", "author", "createdAt"],
        search: ["title", "content"],
      },
    },
    Category: {
      toString: (category) => `${category.name}`,
      title: "Categories",
      icon: "InboxStackIcon",
      list: {
        display: ["name", "posts"],
      },
    },
  },

  // カスタムページ
  pages: {
    "/custom": {
      title: "Custom page",
      icon: "AdjustmentsHorizontalIcon",
    },
  },

  // 外部リンク
  externalLinks: [
    {
      label: "Website",
      url: "https://www.myblog.com",
    },
  ],

  // サイドバーグループ
  sidebar: {
    groups: [
      {
        title: "Users",
        models: ["User"],
      },
      {
        title: "Content",
        models: ["Post", "Category"],
      },
    ],
  },
};
```

### モデル設定の詳細

#### `toString`

モデルの文字列表現を定義します（リレーション表示などで使用）。

```typescript
toString: (user) => `${user.name} (${user.email})`;
```

#### `list` - リストビュー設定

```typescript
list: {
  display: ["name", "email", "role"],  // 表示するフィールド
  search: ["name", "email"],            // 検索対象フィールド
  filters: [                            // フィルター定義
    {
      name: "Active users",
      active: false,
      value: {
        isActive: { equals: true }
      }
    }
  ],
  fields: {                             // フィールドごとのカスタマイズ
    email: {
      formatter: (value) => value.toLowerCase()
    }
  }
}
```

#### `edit` - 編集フォーム設定

```typescript
edit: {
  display: ["name", "email", "role"],  // 編集可能なフィールド
  fields: {
    password: {
      validate: (value) => value.length >= 8,
      helperText: "8文字以上"
    }
  }
}
```

### アイコン

Next Admin は **Heroicons** を使用します。

利用可能なアイコン:

- `UsersIcon`
- `DocumentTextIcon`
- `InboxStackIcon`
- `AdjustmentsHorizontalIcon`
- など

参考: https://heroicons.com

---

## カスタマイズ

### カスタムフィールド表示

#### フォーマッター

```typescript
list: {
  fields: {
    createdAt: {
      formatter: (value: Date) => {
        return new Intl.DateTimeFormat('ja-JP').format(value);
      }
    },
    email: {
      formatter: (value: string, context) => {
        return <a href={`mailto:${value}`}>{value}</a>;
      }
    }
  }
}
```

#### カスタムコンポーネント

```typescript
edit: {
  fields: {
    content: {
      input: (props) => {
        return <CustomRichTextEditor {...props} />;
      };
    }
  }
}
```

### アクションハンドラー

#### 作成/更新/削除のカスタマイズ

```typescript
export const options: NextAdminOptions = {
  model: {
    User: {
      handlers: {
        beforeCreate: async (data, context) => {
          // パスワードをハッシュ化
          if (data.password) {
            data.password = await hashPassword(data.password);
          }
          return data;
        },
        afterUpdate: async (data, context) => {
          // 更新後の処理（通知など）
          await sendNotification(data.id);
        },
        beforeDelete: async (id, context) => {
          // 削除前のチェック
          const hasRelatedData = await checkRelations(id);
          if (hasRelatedData) {
            throw new Error("Cannot delete user with related data");
          }
        },
      },
    },
  },
};
```

### ダッシュボードウィジェット

```typescript
// app/admin/[[...nextadmin]]/page.tsx
export default async function AdminPage({ params, searchParams }: PageProps) {
  const props = await getNextAdminProps({
    params: params.nextadmin,
    searchParams,
    basePath: "/admin",
    apiBasePath: "/api/admin",
    prisma,
    options,
  });

  return (
    <NextAdmin
      {...props}
      dashboard={{
        widgets: [
          {
            title: "Total Users",
            value: await prisma.user.count(),
          },
          {
            title: "Active Posts",
            value: await prisma.post.count({ where: { published: true } }),
          },
        ],
      }}
    />
  );
}
```

### 認証

Next Admin は認証機能を提供していません。既存の認証システムと統合する必要があります。

#### NextAuth.js の例

```typescript
// app/admin/[[...nextadmin]]/page.tsx
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";

export default async function AdminPage({ params, searchParams }: PageProps) {
  const session = await getServerSession(authOptions);

  if (!session || session.user.role !== "ADMIN") {
    redirect("/login");
  }

  const props = await getNextAdminProps({
    params: params.nextadmin,
    searchParams,
    basePath: "/admin",
    apiBasePath: "/api/admin",
    prisma,
    options,
  });

  return <NextAdmin {...props} />;
}
```

### テーマカスタマイズ

#### カラーのカスタマイズ

```css
/* styles.css */
@import "tailwindcss";
@import "@premieroctet/next-admin/theme";

:root {
  --nextadmin-primary: 59 130 246; /* blue-500 */
  --nextadmin-success: 34 197 94; /* green-500 */
  --nextadmin-error: 239 68 68; /* red-500 */
}

[data-theme="dark"] {
  --nextadmin-primary: 96 165 250; /* blue-400 */
}
```

---

## 対応フレームワーク

### Next.js

✅ **完全サポート**

- App Router (推奨)
- Pages Router

### Remix

```typescript
// app/routes/admin.$.tsx
import { LoaderFunction } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { NextAdmin } from "@premieroctet/next-admin/adapters/remix";
import { getNextAdminProps } from "@premieroctet/next-admin/remix";
import { prisma } from "~/prisma";

export const loader: LoaderFunction = async ({ request, params }) => {
  const props = await getNextAdminProps({
    params: params["*"]?.split("/") ?? [],
    searchParams: new URL(request.url).searchParams,
    basePath: "/admin",
    apiBasePath: "/api/admin",
    prisma,
  });

  return props;
};

export default function Admin() {
  const props = useLoaderData<typeof loader>();
  return <NextAdmin {...props} />;
}
```

### TanStack Start

詳細はドキュメントを参照: https://next-admin-docs.vercel.app/docs/frameworks-support

---

## 実践例

### シンプルなブログ管理

#### Prisma スキーマ

```prisma
model User {
  id        String   @id @default(cuid())
  email     String   @unique
  name      String?
  role      Role     @default(USER)
  posts     Post[]
  createdAt DateTime @default(now())
}

model Post {
  id         String     @id @default(cuid())
  title      String
  content    String?
  published  Boolean    @default(false)
  author     User       @relation(fields: [authorId], references: [id])
  authorId   String
  categories Category[]
  createdAt  DateTime   @default(now())
  updatedAt  DateTime   @updatedAt
}

model Category {
  id    String @id @default(cuid())
  name  String @unique
  posts Post[]
}

enum Role {
  USER
  ADMIN
}

generator nextAdmin {
  provider = "next-admin-generator-prisma"
}

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

#### オプション設定

```typescript
// app/admin/options.ts
import { NextAdminOptions } from "@premieroctet/next-admin";

export const options: NextAdminOptions = {
  title: "📝 Blog Admin",
  model: {
    User: {
      toString: (user) => `${user.name ?? user.email}`,
      title: "Users",
      icon: "UsersIcon",
      list: {
        display: ["name", "email", "role", "createdAt"],
        search: ["name", "email"],
        filters: [
          {
            name: "Admins only",
            active: false,
            value: { role: { equals: "ADMIN" } },
          },
        ],
      },
      edit: {
        display: ["name", "email", "role"],
      },
    },
    Post: {
      toString: (post) => post.title,
      title: "Posts",
      icon: "DocumentTextIcon",
      list: {
        display: ["title", "author", "published", "createdAt"],
        search: ["title", "content"],
        filters: [
          {
            name: "Published",
            active: false,
            value: { published: { equals: true } },
          },
        ],
      },
      edit: {
        display: ["title", "content", "published", "author", "categories"],
      },
    },
    Category: {
      toString: (category) => category.name,
      title: "Categories",
      icon: "InboxStackIcon",
      list: {
        display: ["name", "posts"],
      },
      edit: {
        display: ["name", "posts"],
      },
    },
  },
  sidebar: {
    groups: [
      {
        title: "Content",
        models: ["Post", "Category"],
      },
      {
        title: "Users",
        models: ["User"],
      },
    ],
  },
};
```

---

## ベストプラクティス

### 🎯 設計原則

#### 1. オプションを一元管理

```typescript
// ❌ 悪い例: オプションを各ファイルに分散
// page.tsx と route.ts で異なる設定になる可能性

// ✅ 良い例: 一箇所で管理
// app/admin/options.ts で定義
// page.tsx と route.ts でインポート
```

#### 2. 型安全性を活用

```typescript
// ✅ 良い例: 型を活用
import { NextAdminOptions } from "@premieroctet/next-admin";
import { User } from "@prisma/client";

export const options: NextAdminOptions = {
  model: {
    User: {
      toString: (user: User) => `${user.name}`, // 型安全
    },
  },
};
```

#### 3. Server Component を活用 (App Router)

```typescript
// ✅ 良い例: async Server Component
export default async function AdminPage({ params, searchParams }: PageProps) {
  // データベースクエリを直接実行
  const userCount = await prisma.user.count();

  const props = await getNextAdminProps({
    params: params.nextadmin,
    searchParams,
    basePath: "/admin",
    apiBasePath: "/api/admin",
    prisma,
  });

  return (
    <NextAdmin
      {...props}
      dashboard={{
        widgets: [{ title: "Total Users", value: userCount }],
      }}
    />
  );
}
```

### 🔒 セキュリティ

#### 認証は必須

```typescript
// ✅ 必ず認証チェックを実装
export default async function AdminPage({ params, searchParams }: PageProps) {
  const session = await getServerSession(authOptions);

  if (!session?.user || session.user.role !== "ADMIN") {
    redirect("/login");
  }

  // ... rest of the code
}
```

#### API ルートも保護

```typescript
// app/api/admin/[[...nextadmin]]/route.ts
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";

const { run } = createHandler({
  apiBasePath: "/api/admin",
  prisma,
});

const handler = async (req: NextRequest) => {
  const session = await getServerSession(authOptions);

  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return run(req);
};

export { handler as GET, handler as POST, handler as DELETE };
```

### 📊 パフォーマンス

#### リレーションの最適化

```typescript
// Prisma スキーマでインデックスを追加
model Post {
  id        String   @id @default(cuid())
  title     String
  authorId  String
  author    User     @relation(fields: [authorId], references: [id])

  @@index([authorId]) // インデックス追加
}
```

#### ページネーション設定

```typescript
export const options: NextAdminOptions = {
  model: {
    Post: {
      list: {
        display: ["title", "author", "createdAt"],
        // 表示件数を制限
        perPage: 20,
      },
    },
  },
};
```

---

## トラブルシューティング

### よくある問題と解決方法

#### 1. `options` prop でエラーが発生

**問題**: App Router で関数を含む `options` を渡すとエラー

```
Error: Functions cannot be passed directly to Client Components
```

**解決策**: App Router では `options` prop を `NextAdmin` コンポーネントに渡さない

```typescript
// ❌ 悪い例
<NextAdmin {...props} options={options} />

// ✅ 良い例
<NextAdmin {...props} />
```

#### 2. スタイルが適用されない

**問題**: Tailwind CSS が適用されない

**解決策**:

1. CSS ファイルをインポート

```typescript
import "@/styles.css";
```

2. Tailwind 設定を確認

```css
/* styles.css */
@import "tailwindcss";
@import "@premieroctet/next-admin/theme";
@source "./node_modules/@premieroctet/next-admin/dist";
```

#### 3. Hydration エラー

**問題**: ダークモード使用時の Hydration warning

**解決策**: `<html>` タグに `suppressHydrationWarning` を追加

```tsx
// app/layout.tsx
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja" suppressHydrationWarning>
      <body>{children}</body>
    </html>
  );
}
```

#### 4. Prisma generator が動作しない

**問題**: `prisma generate` を実行してもスキーマが生成されない

**解決策**:

1. generator の順序を確認（Prisma Client の後に Next Admin）

```prisma
generator client {
  provider = "prisma-client-js"
}

generator nextAdmin {
  provider = "next-admin-generator-prisma"
}
```

2. node_modules をクリーンして再インストール

```bash
rm -rf node_modules
rm -rf .next
npm install
npx prisma generate
```

#### 5. リレーションが表示されない

**問題**: 外部キーのフィールドが表示されない

**解決策**: `toString` を定義

```typescript
model: {
  Post: {
    toString: (post) => post.title,
  },
  User: {
    toString: (user) => user.name,
  },
}
```

---

## 参考リンク

### 公式リソース

- **公式サイト**: https://next-admin.js.org
- **ドキュメント**: https://next-admin-docs.vercel.app
- **GitHub**: https://github.com/premieroctet/next-admin
- **デモ**: https://next-admin-po.vercel.app
- **npm**: https://www.npmjs.com/package/@premieroctet/next-admin

### 関連技術

- **Prisma**: https://www.prisma.io
- **Next.js**: https://nextjs.org
- **TailwindCSS**: https://tailwindcss.com
- **Heroicons**: https://heroicons.com

### コミュニティ

- **GitHub Issues**: https://github.com/premieroctet/next-admin/issues
- **GitHub Discussions**: https://github.com/premieroctet/next-admin/discussions

---

## まとめ

### Next Admin を選ぶべき理由

✅ **すぐに使える**: CLI で数分でセットアップ完了
✅ **カスタマイズ可能**: ニーズに合わせて柔軟にカスタマイズ
✅ **Prisma 統合**: スキーマから自動生成
✅ **モダンな UI**: TailwindCSS ベースの美しいデザイン
✅ **複数フレームワーク対応**: Next.js, Remix, TanStack Start

### Next Admin が適している場面

- 社内ツールの管理画面
- MVP の管理画面を素早く構築
- Prisma を使用している既存プロジェクト
- カスタマイズ性の高い管理画面が必要

### Next Admin が適していない場面

- 高度にカスタマイズされた UI が必要（ゼロから構築した方が良い）
- Prisma 以外の ORM を使用
- 管理画面以外の複雑な UI

---

**次のステップ**: [サンプルプロジェクトを作成](../../Projects/next-admin-sample/README.md)
