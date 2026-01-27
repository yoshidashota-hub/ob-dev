# 第2章: スキーマ定義

## スキーマファイルの構造

```prisma
// prisma/schema.prisma

// ジェネレーター設定
generator client {
  provider = "prisma-client-js"
}

// データソース設定
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// モデル定義
model User {
  id    Int    @id @default(autoincrement())
  email String @unique
  name  String?
}
```

## フィールド型

### スカラー型

```prisma
model Example {
  // 数値
  intField      Int
  bigIntField   BigInt
  floatField    Float
  decimalField  Decimal

  // 文字列
  stringField   String

  // Boolean
  boolField     Boolean

  // 日時
  dateField     DateTime

  // JSON（PostgreSQL, MySQL）
  jsonField     Json

  // バイナリ
  bytesField    Bytes
}
```

### オプショナルとリスト

```prisma
model User {
  name     String?   // nullable
  tags     String[]  // 配列（PostgreSQL のみ）
  roles    Role[]    // リレーション
}
```

## 属性（Attributes）

### フィールド属性

```prisma
model User {
  // プライマリキー
  id        Int      @id @default(autoincrement())

  // ユニーク制約
  email     String   @unique

  // デフォルト値
  role      String   @default("user")
  createdAt DateTime @default(now())

  // 自動更新
  updatedAt DateTime @updatedAt

  // カラム名のマッピング
  firstName String   @map("first_name")

  // データベース固有の型
  price     Decimal  @db.Decimal(10, 2)
}
```

### モデル属性

```prisma
model User {
  id    Int    @id
  email String

  // テーブル名のマッピング
  @@map("users")
}

model Post {
  id        Int    @id
  authorId  Int
  title     String

  // 複合ユニーク
  @@unique([authorId, title])

  // 複合インデックス
  @@index([authorId])
}
```

## ID 戦略

```prisma
model AutoIncrement {
  id Int @id @default(autoincrement())
}

model UUID {
  id String @id @default(uuid())
}

model CUID {
  id String @id @default(cuid())
}

// 複合プライマリキー
model CompositeKey {
  orderId   Int
  productId Int
  quantity  Int

  @@id([orderId, productId])
}
```

## Enum

```prisma
enum Role {
  USER
  ADMIN
  MODERATOR
}

enum Status {
  DRAFT
  PUBLISHED
  ARCHIVED
}

model User {
  id   Int  @id @default(autoincrement())
  role Role @default(USER)
}

model Post {
  id     Int    @id @default(autoincrement())
  status Status @default(DRAFT)
}
```

## リレーション

### 1対1

```prisma
model User {
  id      Int      @id @default(autoincrement())
  profile Profile?
}

model Profile {
  id     Int  @id @default(autoincrement())
  bio    String?
  user   User @relation(fields: [userId], references: [id])
  userId Int  @unique
}
```

### 1対多

```prisma
model User {
  id    Int    @id @default(autoincrement())
  posts Post[]
}

model Post {
  id       Int  @id @default(autoincrement())
  author   User @relation(fields: [authorId], references: [id])
  authorId Int
}
```

### 多対多

```prisma
// 暗黙的な中間テーブル
model Post {
  id       Int        @id @default(autoincrement())
  tags     Tag[]
}

model Tag {
  id    Int    @id @default(autoincrement())
  name  String @unique
  posts Post[]
}

// 明示的な中間テーブル（追加フィールドが必要な場合）
model Post {
  id          Int           @id @default(autoincrement())
  title       String
  categories  PostCategory[]
}

model Category {
  id    Int            @id @default(autoincrement())
  name  String
  posts PostCategory[]
}

model PostCategory {
  post       Post     @relation(fields: [postId], references: [id])
  postId     Int
  category   Category @relation(fields: [categoryId], references: [id])
  categoryId Int
  assignedAt DateTime @default(now())

  @@id([postId, categoryId])
}
```

### 自己参照リレーション

```prisma
model Category {
  id       Int        @id @default(autoincrement())
  name     String
  parent   Category?  @relation("CategoryHierarchy", fields: [parentId], references: [id])
  parentId Int?
  children Category[] @relation("CategoryHierarchy")
}

model User {
  id          Int     @id @default(autoincrement())
  name        String
  followers   User[]  @relation("UserFollows")
  following   User[]  @relation("UserFollows")
}
```

## インデックス

```prisma
model Post {
  id       Int      @id @default(autoincrement())
  title    String
  content  String?
  authorId Int
  status   Status

  // 単一インデックス
  @@index([authorId])

  // 複合インデックス
  @@index([authorId, status])

  // ユニークインデックス
  @@unique([authorId, title])

  // 全文検索インデックス（PostgreSQL）
  @@index([title, content], type: Gin)
}
```

## 完全なスキーマ例

```prisma
// prisma/schema.prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

enum Role {
  USER
  ADMIN
}

enum PostStatus {
  DRAFT
  PUBLISHED
  ARCHIVED
}

model User {
  id            Int       @id @default(autoincrement())
  email         String    @unique
  name          String?
  role          Role      @default(USER)
  posts         Post[]
  profile       Profile?
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt

  @@map("users")
}

model Profile {
  id     Int     @id @default(autoincrement())
  bio    String?
  avatar String?
  user   User    @relation(fields: [userId], references: [id], onDelete: Cascade)
  userId Int     @unique

  @@map("profiles")
}

model Post {
  id        Int        @id @default(autoincrement())
  title     String
  content   String?
  status    PostStatus @default(DRAFT)
  author    User       @relation(fields: [authorId], references: [id])
  authorId  Int
  tags      Tag[]
  createdAt DateTime   @default(now())
  updatedAt DateTime   @updatedAt

  @@index([authorId])
  @@index([status])
  @@map("posts")
}

model Tag {
  id    Int    @id @default(autoincrement())
  name  String @unique
  posts Post[]

  @@map("tags")
}
```

## 次のステップ

次章では、マイグレーションについて詳しく学びます。
