# 第6章: リレーション

## リレーションの種類

```
┌─────────────────────────────────────────────────────┐
│                 Relation Types                       │
│                                                     │
│  1対1:    User ────── Profile                       │
│                                                     │
│  1対多:   User ────┬─ Post                          │
│                    └─ Post                          │
│                                                     │
│  多対多:  Post ────┬─ Tag                           │
│           Post ────┼─ Tag                           │
│           Post ────┴─ Tag                           │
└─────────────────────────────────────────────────────┘
```

## 1対1 リレーション

### スキーマ定義

```prisma
model User {
  id      Int      @id @default(autoincrement())
  email   String   @unique
  profile Profile?
}

model Profile {
  id     Int     @id @default(autoincrement())
  bio    String?
  avatar String?
  user   User    @relation(fields: [userId], references: [id])
  userId Int     @unique
}
```

### 操作

```typescript
// 作成（ネスト）
const user = await prisma.user.create({
  data: {
    email: "test@example.com",
    profile: {
      create: {
        bio: "Hello!",
      },
    },
  },
  include: { profile: true },
});

// 読み込み
const user = await prisma.user.findUnique({
  where: { id: 1 },
  include: { profile: true },
});

// 更新
const user = await prisma.user.update({
  where: { id: 1 },
  data: {
    profile: {
      update: {
        bio: "Updated bio",
      },
    },
  },
});

// upsert（なければ作成）
const user = await prisma.user.update({
  where: { id: 1 },
  data: {
    profile: {
      upsert: {
        create: { bio: "New profile" },
        update: { bio: "Updated profile" },
      },
    },
  },
});
```

## 1対多 リレーション

### スキーマ定義

```prisma
model User {
  id    Int    @id @default(autoincrement())
  email String @unique
  posts Post[]
}

model Post {
  id       Int    @id @default(autoincrement())
  title    String
  author   User   @relation(fields: [authorId], references: [id])
  authorId Int
}
```

### 操作

```typescript
// 作成（複数の子レコード）
const user = await prisma.user.create({
  data: {
    email: "test@example.com",
    posts: {
      create: [
        { title: "Post 1" },
        { title: "Post 2" },
      ],
    },
  },
  include: { posts: true },
});

// 既存のレコードに追加
const user = await prisma.user.update({
  where: { id: 1 },
  data: {
    posts: {
      create: { title: "New Post" },
    },
  },
});

// 子レコードのフィルタリング
const user = await prisma.user.findUnique({
  where: { id: 1 },
  include: {
    posts: {
      where: { status: "PUBLISHED" },
      orderBy: { createdAt: "desc" },
      take: 5,
    },
  },
});

// カウントも含める
const user = await prisma.user.findUnique({
  where: { id: 1 },
  include: {
    posts: true,
    _count: {
      select: { posts: true },
    },
  },
});
```

## 多対多 リレーション

### 暗黙的（自動中間テーブル）

```prisma
model Post {
  id    Int    @id @default(autoincrement())
  title String
  tags  Tag[]
}

model Tag {
  id    Int    @id @default(autoincrement())
  name  String @unique
  posts Post[]
}
```

```typescript
// 作成
const post = await prisma.post.create({
  data: {
    title: "New Post",
    tags: {
      create: [
        { name: "typescript" },
        { name: "prisma" },
      ],
    },
  },
  include: { tags: true },
});

// 既存のタグに接続
const post = await prisma.post.update({
  where: { id: 1 },
  data: {
    tags: {
      connect: [{ id: 1 }, { name: "react" }],
    },
  },
});

// 切断
const post = await prisma.post.update({
  where: { id: 1 },
  data: {
    tags: {
      disconnect: [{ id: 1 }],
    },
  },
});

// 置き換え
const post = await prisma.post.update({
  where: { id: 1 },
  data: {
    tags: {
      set: [{ id: 2 }, { id: 3 }],
    },
  },
});

// connectOrCreate
const post = await prisma.post.update({
  where: { id: 1 },
  data: {
    tags: {
      connectOrCreate: {
        where: { name: "newTag" },
        create: { name: "newTag" },
      },
    },
  },
});
```

### 明示的（中間テーブルにフィールドを追加）

```prisma
model Post {
  id         Int          @id @default(autoincrement())
  title      String
  categories PostCategory[]
}

model Category {
  id    Int            @id @default(autoincrement())
  name  String         @unique
  posts PostCategory[]
}

model PostCategory {
  post       Post     @relation(fields: [postId], references: [id])
  postId     Int
  category   Category @relation(fields: [categoryId], references: [id])
  categoryId Int
  assignedAt DateTime @default(now())
  assignedBy String?

  @@id([postId, categoryId])
}
```

```typescript
// 作成
const postCategory = await prisma.postCategory.create({
  data: {
    post: { connect: { id: 1 } },
    category: { connect: { id: 1 } },
    assignedBy: "admin",
  },
});

// 読み込み
const post = await prisma.post.findUnique({
  where: { id: 1 },
  include: {
    categories: {
      include: {
        category: true,
      },
    },
  },
});
```

## 自己参照リレーション

### ツリー構造

```prisma
model Category {
  id       Int        @id @default(autoincrement())
  name     String
  parent   Category?  @relation("CategoryTree", fields: [parentId], references: [id])
  parentId Int?
  children Category[] @relation("CategoryTree")
}
```

```typescript
// 子カテゴリ付きで作成
const category = await prisma.category.create({
  data: {
    name: "Electronics",
    children: {
      create: [
        { name: "Phones" },
        { name: "Laptops" },
      ],
    },
  },
  include: { children: true },
});

// ルートカテゴリを取得
const roots = await prisma.category.findMany({
  where: { parentId: null },
  include: {
    children: {
      include: {
        children: true,  // 2階層目まで
      },
    },
  },
});
```

### フォロー/フォロワー

```prisma
model User {
  id        Int     @id @default(autoincrement())
  name      String
  followers User[]  @relation("UserFollows")
  following User[]  @relation("UserFollows")
}
```

```typescript
// フォロー
const user = await prisma.user.update({
  where: { id: 1 },
  data: {
    following: {
      connect: { id: 2 },
    },
  },
});

// フォロワー一覧
const user = await prisma.user.findUnique({
  where: { id: 1 },
  include: {
    followers: true,
    following: true,
    _count: {
      select: {
        followers: true,
        following: true,
      },
    },
  },
});
```

## カスケード

```prisma
model User {
  id    Int    @id @default(autoincrement())
  posts Post[]
}

model Post {
  id       Int  @id @default(autoincrement())
  author   User @relation(fields: [authorId], references: [id], onDelete: Cascade)
  authorId Int
}
```

### onDelete オプション

| 値 | 説明 |
|---|------|
| Cascade | 親削除時に子も削除 |
| Restrict | 子がある場合は親削除を禁止 |
| NoAction | DB のデフォルト動作 |
| SetNull | 親削除時に外部キーを NULL に |
| SetDefault | 親削除時にデフォルト値を設定 |

## 次のステップ

次章では、トランザクションについて学びます。
