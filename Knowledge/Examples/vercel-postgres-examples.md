# Vercel Postgres 実装例

Prisma を使用したデータベース駆動アプリケーションの完全ガイド。

---

## 📋 目次

1. [概要](#概要)
2. [セットアップ](#セットアップ)
3. [Prisma の基本操作](#prisma-の基本操作)
4. [CRUD 操作の実装](#crud-操作の実装)
5. [リレーションの管理](#リレーションの管理)
6. [高度な使用例](#高度な使用例)
7. [トラブルシューティング](#トラブルシューティング)

---

## 概要

### Vercel Postgres とは

フルマネージドな PostgreSQL データベース：
- **サーバーレス**: 使用量ベースの課金
- **自動スケーリング**: トラフィックに応じて自動調整
- **高可用性**: 自動バックアップとレプリケーション
- **Prisma 統合**: TypeScript の型安全性

### 主な機能

- フルテキスト検索
- JSON サポート
- トランザクション
- マイグレーション
- コネクションプーリング

---

## セットアップ

### 1. Vercel Postgres の作成

```bash
# Vercel ダッシュボードで:
# 1. プロジェクトを選択
# 2. Storage → Postgres
# 3. "Create" をクリック
# 4. データベース名を入力
# 5. リージョンを選択
```

### 2. パッケージのインストール

```bash
# Prisma と Vercel Postgres
npm install @vercel/postgres @prisma/client
npm install -D prisma
```

### 3. Prisma の初期化

```bash
npx prisma init
```

### 4. 環境変数の設定

**ファイル**: `.env.local`

```bash
# Vercel Postgres の接続情報（ダッシュボードから取得）
POSTGRES_URL="postgres://default:xxx@xxx.postgres.vercel-storage.com:5432/verceldb"
POSTGRES_PRISMA_URL="postgres://default:xxx@xxx.postgres.vercel-storage.com:5432/verceldb?pgbouncer=true"
POSTGRES_URL_NON_POOLING="postgres://default:xxx@xxx.postgres.vercel-storage.com:5432/verceldb"
POSTGRES_USER="default"
POSTGRES_HOST="xxx.postgres.vercel-storage.com"
POSTGRES_PASSWORD="xxx"
POSTGRES_DATABASE="verceldb"
```

### 5. スキーマの定義

**ファイル**: `prisma/schema.prisma`

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("POSTGRES_PRISMA_URL")
  directUrl = env("POSTGRES_URL_NON_POOLING")
}

model User {
  id        String   @id @default(cuid())
  email     String   @unique
  name      String
  password  String
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  posts     Post[]
  profile   Profile?
}

model Profile {
  id       String  @id @default(cuid())
  bio      String?
  avatar   String?
  user     User    @relation(fields: [userId], references: [id], onDelete: Cascade)
  userId   String  @unique
}

model Post {
  id        String   @id @default(cuid())
  title     String
  content   String?
  published Boolean  @default(false)
  author    User     @relation(fields: [authorId], references: [id], onDelete: Cascade)
  authorId  String
  tags      Tag[]
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([authorId])
  @@index([published])
}

model Tag {
  id    String @id @default(cuid())
  name  String @unique
  posts Post[]
}
```

### 6. マイグレーションの実行

```bash
# データベーススキーマを作成
npx prisma migrate dev --name init

# Prisma Client を生成
npx prisma generate
```

### 7. Prisma Client の作成

**ファイル**: `lib/prisma.ts`

```typescript
import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}
```

---

## Prisma の基本操作

### データの作成

```typescript
import { prisma } from '@/lib/prisma';

// 単一レコードの作成
const user = await prisma.user.create({
  data: {
    email: 'john@example.com',
    name: 'John Doe',
    password: 'hashed_password',
  },
});

// リレーションと一緒に作成
const userWithProfile = await prisma.user.create({
  data: {
    email: 'jane@example.com',
    name: 'Jane Smith',
    password: 'hashed_password',
    profile: {
      create: {
        bio: 'Software Developer',
        avatar: 'https://example.com/avatar.jpg',
      },
    },
  },
  include: {
    profile: true,
  },
});
```

### データの読み取り

```typescript
// 単一レコードの取得
const user = await prisma.user.findUnique({
  where: { email: 'john@example.com' },
});

// すべてのレコードを取得
const users = await prisma.user.findMany();

// 条件付きで取得
const publishedPosts = await prisma.post.findMany({
  where: { published: true },
  include: {
    author: {
      select: {
        name: true,
        email: true,
      },
    },
  },
  orderBy: {
    createdAt: 'desc',
  },
  take: 10, // 最大10件
});

// 複雑な検索
const posts = await prisma.post.findMany({
  where: {
    OR: [
      { title: { contains: 'Next.js' } },
      { content: { contains: 'Next.js' } },
    ],
    published: true,
  },
});
```

### データの更新

```typescript
// 単一レコードの更新
const updatedUser = await prisma.user.update({
  where: { id: 'user-123' },
  data: {
    name: 'Updated Name',
  },
});

// 複数レコードの更新
const result = await prisma.post.updateMany({
  where: { published: false },
  data: { published: true },
});

// upsert（存在すれば更新、なければ作成）
const user = await prisma.user.upsert({
  where: { email: 'john@example.com' },
  update: {
    name: 'John Updated',
  },
  create: {
    email: 'john@example.com',
    name: 'John Doe',
    password: 'hashed_password',
  },
});
```

### データの削除

```typescript
// 単一レコードの削除
await prisma.user.delete({
  where: { id: 'user-123' },
});

// 複数レコードの削除
await prisma.post.deleteMany({
  where: {
    published: false,
    createdAt: {
      lt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30日以上前
    },
  },
});
```

---

## CRUD 操作の実装

### ユーザー管理 API

**ファイル**: `app/api/users/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcrypt';

// ユーザー一覧取得
export async function GET() {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        createdAt: true,
        _count: {
          select: { posts: true },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json({
      success: true,
      data: users,
    });
  } catch (error) {
    console.error('Failed to fetch users:', error);
    return NextResponse.json(
      { error: 'Failed to fetch users' },
      { status: 500 }
    );
  }
}

// ユーザー作成
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, name, password } = body;

    // バリデーション
    if (!email || !name || !password) {
      return NextResponse.json(
        { error: 'All fields are required' },
        { status: 400 }
      );
    }

    // 既存ユーザーチェック
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'Email already exists' },
        { status: 400 }
      );
    }

    // パスワードハッシュ化
    const hashedPassword = await bcrypt.hash(password, 10);

    // ユーザー作成
    const user = await prisma.user.create({
      data: {
        email,
        name,
        password: hashedPassword,
      },
      select: {
        id: true,
        email: true,
        name: true,
        createdAt: true,
      },
    });

    return NextResponse.json({
      success: true,
      data: user,
    });
  } catch (error) {
    console.error('User creation error:', error);
    return NextResponse.json(
      { error: 'Failed to create user' },
      { status: 500 }
    );
  }
}
```

**ファイル**: `app/api/users/[id]/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// ユーザー詳細取得
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: params.id },
      include: {
        profile: true,
        posts: {
          where: { published: true },
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: user,
    });
  } catch (error) {
    console.error('Failed to fetch user:', error);
    return NextResponse.json(
      { error: 'Failed to fetch user' },
      { status: 500 }
    );
  }
}

// ユーザー更新
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const { name, bio, avatar } = body;

    const user = await prisma.user.update({
      where: { id: params.id },
      data: {
        ...(name && { name }),
        profile: {
          upsert: {
            create: { bio, avatar },
            update: { bio, avatar },
          },
        },
      },
      include: {
        profile: true,
      },
    });

    return NextResponse.json({
      success: true,
      data: user,
    });
  } catch (error) {
    console.error('Failed to update user:', error);
    return NextResponse.json(
      { error: 'Failed to update user' },
      { status: 500 }
    );
  }
}

// ユーザー削除
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await prisma.user.delete({
      where: { id: params.id },
    });

    return NextResponse.json({
      success: true,
      message: 'User deleted successfully',
    });
  } catch (error) {
    console.error('Failed to delete user:', error);
    return NextResponse.json(
      { error: 'Failed to delete user' },
      { status: 500 }
    );
  }
}
```

### 投稿管理 API

**ファイル**: `app/api/posts/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// 投稿一覧取得
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const skip = (page - 1) * limit;

    const [posts, total] = await Promise.all([
      prisma.post.findMany({
        where: { published: true },
        include: {
          author: {
            select: {
              name: true,
              email: true,
            },
          },
          tags: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
        skip,
        take: limit,
      }),
      prisma.post.count({ where: { published: true } }),
    ]);

    return NextResponse.json({
      success: true,
      data: posts,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Failed to fetch posts:', error);
    return NextResponse.json(
      { error: 'Failed to fetch posts' },
      { status: 500 }
    );
  }
}

// 投稿作成
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { title, content, authorId, tags } = body;

    const post = await prisma.post.create({
      data: {
        title,
        content,
        author: {
          connect: { id: authorId },
        },
        tags: {
          connectOrCreate: tags.map((tag: string) => ({
            where: { name: tag },
            create: { name: tag },
          })),
        },
      },
      include: {
        author: {
          select: {
            name: true,
            email: true,
          },
        },
        tags: true,
      },
    });

    return NextResponse.json({
      success: true,
      data: post,
    });
  } catch (error) {
    console.error('Failed to create post:', error);
    return NextResponse.json(
      { error: 'Failed to create post' },
      { status: 500 }
    );
  }
}
```

---

## リレーションの管理

### One-to-One リレーション

```typescript
// プロフィール付きユーザー作成
const user = await prisma.user.create({
  data: {
    email: 'user@example.com',
    name: 'User Name',
    password: 'hashed_password',
    profile: {
      create: {
        bio: 'My bio',
        avatar: 'https://example.com/avatar.jpg',
      },
    },
  },
  include: {
    profile: true,
  },
});

// プロフィール更新
const updatedUser = await prisma.user.update({
  where: { id: 'user-123' },
  data: {
    profile: {
      update: {
        bio: 'Updated bio',
      },
    },
  },
  include: {
    profile: true,
  },
});
```

### One-to-Many リレーション

```typescript
// 投稿を含むユーザー取得
const userWithPosts = await prisma.user.findUnique({
  where: { id: 'user-123' },
  include: {
    posts: {
      orderBy: {
        createdAt: 'desc',
      },
    },
  },
});

// 新しい投稿を作成
const post = await prisma.post.create({
  data: {
    title: 'My Post',
    content: 'Post content',
    author: {
      connect: { id: 'user-123' },
    },
  },
});
```

### Many-to-Many リレーション

```typescript
// タグ付き投稿作成
const post = await prisma.post.create({
  data: {
    title: 'Tagged Post',
    content: 'Content',
    authorId: 'user-123',
    tags: {
      connectOrCreate: [
        {
          where: { name: 'nextjs' },
          create: { name: 'nextjs' },
        },
        {
          where: { name: 'react' },
          create: { name: 'react' },
        },
      ],
    },
  },
  include: {
    tags: true,
  },
});

// 特定のタグを持つ投稿を検索
const posts = await prisma.post.findMany({
  where: {
    tags: {
      some: {
        name: 'nextjs',
      },
    },
  },
  include: {
    tags: true,
  },
});
```

---

## 高度な使用例

### 1. トランザクション

```typescript
import { prisma } from '@/lib/prisma';

// シーケンシャルトランザクション
const [user, post] = await prisma.$transaction([
  prisma.user.create({
    data: {
      email: 'new@example.com',
      name: 'New User',
      password: 'hashed_password',
    },
  }),
  prisma.post.create({
    data: {
      title: 'First Post',
      content: 'Content',
      authorId: 'user-123',
    },
  }),
]);

// インタラクティブトランザクション
await prisma.$transaction(async (tx) => {
  const user = await tx.user.create({
    data: {
      email: 'new@example.com',
      name: 'New User',
      password: 'hashed_password',
    },
  });

  await tx.post.create({
    data: {
      title: 'First Post',
      content: 'Content',
      authorId: user.id,
    },
  });
});
```

### 2. フルテキスト検索

```typescript
// PostgreSQL のフルテキスト検索
const posts = await prisma.$queryRaw`
  SELECT * FROM "Post"
  WHERE to_tsvector('english', title || ' ' || COALESCE(content, ''))
    @@ plainto_tsquery('english', ${searchQuery})
  ORDER BY ts_rank(
    to_tsvector('english', title || ' ' || COALESCE(content, '')),
    plainto_tsquery('english', ${searchQuery})
  ) DESC
  LIMIT 10
`;
```

### 3. 集計とグループ化

```typescript
// ユーザーごとの投稿数
const userStats = await prisma.user.findMany({
  select: {
    id: true,
    name: true,
    _count: {
      select: {
        posts: true,
      },
    },
  },
});

// タグ別の投稿数
const tagStats = await prisma.tag.findMany({
  select: {
    name: true,
    _count: {
      select: {
        posts: true,
      },
    },
  },
  orderBy: {
    posts: {
      _count: 'desc',
    },
  },
  take: 10,
});
```

### 4. ページネーション

```typescript
// カーソルベースページネーション
async function getPosts(cursor?: string, limit: number = 10) {
  const posts = await prisma.post.findMany({
    take: limit + 1,
    ...(cursor && {
      skip: 1,
      cursor: {
        id: cursor,
      },
    }),
    orderBy: {
      createdAt: 'desc',
    },
  });

  const hasNextPage = posts.length > limit;
  const data = hasNextPage ? posts.slice(0, -1) : posts;
  const nextCursor = hasNextPage ? data[data.length - 1].id : null;

  return {
    data,
    nextCursor,
    hasNextPage,
  };
}
```

### 5. ソフトデリート

```prisma
// schema.prisma に追加
model Post {
  id        String    @id @default(cuid())
  title     String
  content   String?
  published Boolean   @default(false)
  deletedAt DateTime?
  // ... 他のフィールド
}
```

```typescript
// ソフトデリート実装
async function softDeletePost(id: string) {
  return await prisma.post.update({
    where: { id },
    data: { deletedAt: new Date() },
  });
}

// 削除されていない投稿のみ取得
async function getActivePosts() {
  return await prisma.post.findMany({
    where: { deletedAt: null },
  });
}
```

---

## トラブルシューティング

### マイグレーションエラー

```bash
# スキーマをリセット（開発環境のみ！）
npx prisma migrate reset

# 新しいマイグレーションを作成
npx prisma migrate dev --name your_migration_name

# 本番環境へのデプロイ
npx prisma migrate deploy
```

### 接続エラー

```typescript
// 接続プールの設定
// prisma/schema.prisma
datasource db {
  provider = "postgresql"
  url      = env("POSTGRES_PRISMA_URL")
  directUrl = env("POSTGRES_URL_NON_POOLING")
  relationMode = "prisma" // Planetscale など外部キー制約がない場合
}
```

### パフォーマンスの最適化

```typescript
// インデックスの追加
// schema.prisma
model Post {
  // ...
  @@index([authorId])
  @@index([published])
  @@index([createdAt])
}

// N+1 問題の解決
const posts = await prisma.post.findMany({
  include: {
    author: true, // eager loading
    tags: true,
  },
});
```

---

## まとめ

### チェックリスト

- [ ] Vercel Postgres を作成
- [ ] Prisma をインストールして初期化
- [ ] スキーマを定義
- [ ] マイグレーションを実行
- [ ] CRUD API を実装
- [ ] リレーションを設定
- [ ] インデックスを追加
- [ ] Vercel にデプロイ

### ベストプラクティス

- ✅ 適切なインデックスを設定
- ✅ トランザクションを使用
- ✅ N+1 問題を回避（eager loading）
- ✅ ページネーションを実装
- ✅ エラーハンドリングを適切に実装
- ✅ パスワードはハッシュ化

### 次のステップ

- Vercel KV でキャッシュ層を追加
- Full-text search を実装
- データベースの監視とパフォーマンス最適化

---

**最終更新**: 2025年11月
**難易度**: ★★★★★
**所要時間**: 4-5時間
