# 第3章: マイグレーション

## マイグレーションとは

データベーススキーマの変更を追跡・管理する仕組み。

```
┌─────────────────────────────────────────────────────┐
│              Migration Workflow                      │
│                                                     │
│  schema.prisma ──▶ prisma migrate dev              │
│                           │                         │
│                           ▼                         │
│                    migrations/                      │
│                    └── 20240101_init/               │
│                        └── migration.sql            │
│                           │                         │
│                           ▼                         │
│                    Database Updated                 │
└─────────────────────────────────────────────────────┘
```

## 開発環境でのマイグレーション

### 作成と適用

```bash
# マイグレーション作成 + 適用 + クライアント生成
npx prisma migrate dev --name init

# 名前付きマイグレーション
npx prisma migrate dev --name add_user_role
npx prisma migrate dev --name add_post_table
```

### 生成されるファイル

```
prisma/
├── schema.prisma
└── migrations/
    ├── 20240101000000_init/
    │   └── migration.sql
    └── 20240102000000_add_user_role/
        └── migration.sql
```

### マイグレーションの例

```sql
-- prisma/migrations/20240101000000_init/migration.sql
-- CreateTable
CREATE TABLE "users" (
    "id" SERIAL NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");
```

## 本番環境でのマイグレーション

```bash
# マイグレーションを適用（確認なし）
npx prisma migrate deploy

# CI/CD で使用
DATABASE_URL=$PRODUCTION_DATABASE_URL npx prisma migrate deploy
```

## マイグレーションの状態確認

```bash
# 状態を確認
npx prisma migrate status

# 出力例:
# 3 migrations found in prisma/migrations
# 2 applied
# 1 pending
```

## データベースのリセット

```bash
# 全てのデータを削除してマイグレーションを再適用
npx prisma migrate reset

# 確認をスキップ
npx prisma migrate reset --force
```

## db push（開発用）

マイグレーション履歴なしでスキーマを同期。プロトタイピングに便利。

```bash
# スキーマをデータベースに直接適用
npx prisma db push

# データ損失を許可
npx prisma db push --accept-data-loss
```

## db pull（リバースエンジニアリング）

```bash
# 既存のデータベースからスキーマを生成
npx prisma db pull
```

## カスタムマイグレーション

### SQL を追加

```bash
# 空のマイグレーションを作成
npx prisma migrate dev --create-only --name add_full_text_index
```

```sql
-- prisma/migrations/xxx_add_full_text_index/migration.sql
-- 自動生成されたSQL

-- 手動で追加
CREATE INDEX posts_content_idx ON posts USING gin(to_tsvector('english', content));
```

```bash
# マイグレーションを適用
npx prisma migrate dev
```

### データマイグレーション

```sql
-- 1. カラムを追加（nullable で）
ALTER TABLE "users" ADD COLUMN "role" TEXT;

-- 2. データを移行
UPDATE "users" SET "role" = 'USER' WHERE "role" IS NULL;

-- 3. NOT NULL に変更
ALTER TABLE "users" ALTER COLUMN "role" SET NOT NULL;
ALTER TABLE "users" ALTER COLUMN "role" SET DEFAULT 'USER';
```

## ベストプラクティス

### マイグレーション名の命名規則

```bash
# 良い例
npx prisma migrate dev --name init
npx prisma migrate dev --name add_user_email_index
npx prisma migrate dev --name create_posts_table
npx prisma migrate dev --name add_role_to_users

# 悪い例
npx prisma migrate dev --name update
npx prisma migrate dev --name fix
```

### 安全なマイグレーション

```prisma
// ❌ 危険: カラム削除
model User {
  id    Int    @id
  email String
  // name を削除
}

// ✅ 安全: 段階的に
// Step 1: nullable にする
model User {
  id    Int     @id
  email String
  name  String?  // nullable に変更
}

// Step 2: アプリケーションで name を使用しなくなったら削除
```

### 破壊的変更の回避

```typescript
// 1. 新しいカラムを追加（nullable または default 付き）
// 2. アプリケーションを更新
// 3. データを移行
// 4. 古いカラムを削除
```

## マイグレーションのトラブルシューティング

### ドリフト検出

```bash
# スキーマとDBの差分を確認
npx prisma migrate diff \
  --from-schema-datamodel prisma/schema.prisma \
  --to-schema-datasource prisma/schema.prisma
```

### 失敗したマイグレーションの対処

```bash
# 失敗したマイグレーションをマーク
npx prisma migrate resolve --applied "20240101000000_init"

# または、ロールバック
npx prisma migrate resolve --rolled-back "20240101000000_init"
```

### ベースラインマイグレーション

既存のデータベースに Prisma を導入する場合:

```bash
# 1. 現在のスキーマを取得
npx prisma db pull

# 2. ベースラインマイグレーションを作成
npx prisma migrate diff \
  --from-empty \
  --to-schema-datamodel prisma/schema.prisma \
  --script > prisma/migrations/0_init/migration.sql

# 3. マイグレーションを適用済みとしてマーク
npx prisma migrate resolve --applied 0_init
```

## CI/CD での使用

```yaml
# GitHub Actions
name: Deploy

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: "20"

      - name: Install dependencies
        run: npm ci

      - name: Run migrations
        run: npx prisma migrate deploy
        env:
          DATABASE_URL: ${{ secrets.DATABASE_URL }}
```

## 次のステップ

次章では、CRUD 操作について詳しく学びます。
