---
created: 2025-11-22
tags: [implementation, plan, roadmap, memo-app, nextjs, learning]
status: 計画中
project: 学習統合プロジェクト
---

# 実装計画: 学習統合メモアプリプロジェクト

## 📋 概要

Learning/In-Progress の学習内容を統合し、段階的に機能を追加していく実践プロジェクト。

**プロジェクト名**: `advanced-memo-app`

**目的**:

- 学習した技術を実践で習得
- ポートフォリオとして活用
- モダンな開発手法の体験

## 🎯 学習内容の統合マップ

```
Phase 1: 基礎実装
├── Next.js 16 (App Router, Server Actions)
├── AI駆動開発 (Claude Code + Copilot)
├── SDD (仕様駆動開発)
└── Vercel (デプロイ)

Phase 2: アーキテクチャ
├── Clean Architecture
├── DDD/CQRS
└── TypeScript 厳格な型定義

Phase 3: スケーラビリティ
├── Microservices (将来的な分割を考慮)
├── Event-Driven Architecture
└── システムデザイン原則

Phase 4: 代替実装（学習目的）
├── NestJS 版メモアプリ
└── Hono 版メモアプリ
```

## 🚀 Phase 1: MVP 実装 (2 週間)

### 目標

AI 駆動開発 × SDD で、高品質なメモアプリを短期間で構築

### 技術スタック

```yaml
フロントエンド:
  - Next.js 16 (App Router)
  - TypeScript (strict mode)
  - Tailwind CSS
  - React Hook Form
  - Zod (バリデーション)

バックエンド:
  - Next.js Server Actions
  - Prisma ORM
  - PostgreSQL (Vercel Postgres)
  - JWT認証

開発ツール:
  - Claude Code (AI アシスタント)
  - GitHub Copilot (コード補完)
  - Vitest (テスト)
  - Prettier & ESLint

デプロイ:
  - Vercel
  - GitHub Actions (CI/CD)
```

### 機能要件（MVP）

#### 1. ユーザー認証

- [ ] メール・パスワードでの登録
- [ ] ログイン/ログアウト
- [ ] JWT トークン管理
- [ ] パスワードリセット

#### 2. メモ管理（CRUD）

- [ ] メモの作成
- [ ] メモの一覧表示
- [ ] メモの編集
- [ ] メモの削除
- [ ] リッチテキスト対応（Markdown）

#### 3. タグ機能

- [ ] タグの追加/削除
- [ ] タグでフィルタリング
- [ ] タグの自動補完

#### 4. 検索機能

- [ ] 全文検索
- [ ] タイトル・本文で検索
- [ ] 検索履歴

### 実装手順（AI 駆動開発 + SDD）

#### Week 1: 基礎実装

**Day 1-2: プロジェクトセットアップ**

```bash
# 1. プロジェクト初期化
mkdir Projects/advanced-memo-app
cd Projects/advanced-memo-app

# Claude Code に依頼:
"Next.js 16のプロジェクトを初期化して。以下を含めて:
- TypeScript (strict mode)
- App Router
- Tailwind CSS
- Prisma
- Vitest
- ESLint & Prettier"

# 2. Git リポジトリ作成
git init
gh repo create advanced-memo-app --private

# 3. Vercel プロジェクト連携
vercel link
```

**仕様作成（SDD）**:

```gherkin
# specs/features/authentication.feature
Feature: ユーザー認証

  Scenario: 新規ユーザー登録
    Given ユーザーが未登録である
    When 以下の情報で登録を試みる:
      | email            | password     | name      |
      | user@example.com | Password123! | Test User |
    Then 登録に成功する
    And ホーム画面にリダイレクトされる

  Scenario: ログイン
    Given ユーザー "user@example.com" が登録されている
    When 正しい認証情報でログインを試みる
    Then ログインに成功する
    And JWTトークンが発行される
```

**Day 3-4: データモデル設計**

```prisma
// prisma/schema.prisma
// AI に依頼: "以下の仕様でPrismaスキーマを作成して"

model User {
  id        String   @id @default(cuid())
  email     String   @unique
  password  String
  name      String
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  notes     Note[]

  @@index([email])
}

model Note {
  id        String   @id @default(cuid())
  title     String
  content   String   @db.Text
  tags      String[]
  userId    String
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
  @@index([createdAt])
  @@fulltext([title, content])
}
```

**バリデーションスキーマ（Zod）**:

```typescript
// src/lib/schemas/note.ts
// AI に依頼: "データ仕様をZodスキーマとして実装して"

import { z } from "zod";

export const NoteSchema = z.object({
  id: z.string().cuid(),
  title: z
    .string()
    .min(1, "タイトルを入力してください")
    .max(200, "タイトルは200文字以内です"),
  content: z.string().max(50000, "本文は50000文字以内です"),
  tags: z.array(z.string()).default([]),
  userId: z.string().cuid(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type Note = z.infer<typeof NoteSchema>;

export const CreateNoteSchema = NoteSchema.pick({
  title: true,
  content: true,
  tags: true,
});

export const UpdateNoteSchema = CreateNoteSchema.partial();
```

**Day 5-7: 認証機能実装**

AI 駆動で実装:

```typescript
// プロンプト（Claude Code）:
"ユーザー認証機能を実装して。以下の要件:
1. bcryptでパスワードハッシュ化
2. JWTトークン発行（アクセス1h、リフレッシュ7d）
3. Server Actionsで実装
4. Zodでバリデーション
5. エラーハンドリング
6. セキュリティベストプラクティス

仕様:
- specs/features/authentication.feature を参照
- Clean Architectureに従う
- テストも含めて"
```

**生成されるファイル構成**:

```
src/
├── domain/
│   ├── entities/
│   │   └── user.ts
│   └── repositories/
│       └── user-repository.ts
├── application/
│   ├── use-cases/
│   │   ├── register-user.ts
│   │   ├── login-user.ts
│   │   └── refresh-token.ts
│   └── services/
│       └── auth-service.ts
├── infrastructure/
│   ├── database/
│   │   └── prisma-user-repository.ts
│   └── security/
│       ├── password-hasher.ts
│       └── token-generator.ts
└── presentation/
    ├── actions/
    │   └── auth-actions.ts
    └── components/
        ├── login-form.tsx
        └── register-form.tsx
```

#### Week 2: メモ機能実装

**Day 8-10: メモ CRUD**

仕様作成:

```gherkin
# specs/features/notes.feature
Feature: メモ管理

  Background:
    Given ユーザー "user-123" がログインしている

  Scenario: メモを作成
    When 以下の内容でメモを作成する:
      | title      | content        | tags         |
      | 買い物リスト | 牛乳、パン、卵  | personal,todo |
    Then メモが作成される
    And メモ一覧に表示される

  Scenario: メモを編集
    Given メモ "note-123" が存在する
    When タイトルを "新しいタイトル" に変更する
    Then メモが更新される
    And 更新日時が記録される

  Scenario: メモを削除
    Given メモ "note-123" が存在する
    When メモを削除する
    Then メモが削除される
    And メモ一覧から消える
```

AI に依頼:

```typescript
// プロンプト:
"メモのCRUD機能を実装して。
要件:
- Clean Architecture
- Server Actions
- 楽観的更新（Optimistic UI）
- エラーハンドリング
- ローディング状態
- specs/features/notes.feature に従う"
```

**Day 11-12: タグ・検索機能**

```typescript
// プロンプト:
"タグと検索機能を実装して。
要件:
- タグの自動補完
- タグでフィルタリング
- 全文検索（PostgreSQL Full-Text Search）
- 検索履歴（LocalStorage）
- debounce処理"
```

**Day 13-14: UI/UX 改善**

```typescript
// プロンプト:
"UIを改善して。
要件:
- レスポンシブデザイン
- ダークモード対応
- アニメーション（Framer Motion）
- アクセシビリティ対応（ARIA）
- ローディングスケルトン"
```

### テスト戦略（SDD）

#### 1. ユニットテスト

```typescript
// tests/unit/use-cases/create-note.spec.ts
import { describe, it, expect, beforeEach } from "vitest";
import { CreateNoteUseCase } from "@/application/use-cases/create-note";

describe("CreateNoteUseCase", () => {
  let useCase: CreateNoteUseCase;
  let mockRepository: MockNoteRepository;

  beforeEach(() => {
    mockRepository = new MockNoteRepository();
    useCase = new CreateNoteUseCase(mockRepository);
  });

  it("有効なデータでメモを作成できる", async () => {
    const result = await useCase.execute({
      userId: "user-123",
      title: "Test Note",
      content: "Test Content",
      tags: ["test"],
    });

    expect(result.success).toBe(true);
    expect(result.note.title).toBe("Test Note");
  });

  it("タイトルが空でエラー", async () => {
    const result = await useCase.execute({
      userId: "user-123",
      title: "",
      content: "Test Content",
      tags: [],
    });

    expect(result.success).toBe(false);
    expect(result.error).toContain("タイトルを入力してください");
  });
});
```

#### 2. 統合テスト

```typescript
// tests/integration/notes-api.spec.ts
import { describe, it, expect, beforeEach } from "vitest";
import { testClient } from "@/tests/helpers/test-client";

describe("Notes API", () => {
  let authToken: string;

  beforeEach(async () => {
    await cleanDatabase();
    authToken = await createTestUser();
  });

  it("メモを作成できる", async () => {
    const response = await testClient.post("/api/notes", {
      headers: { Authorization: `Bearer ${authToken}` },
      body: {
        title: "Test Note",
        content: "Test Content",
      },
    });

    expect(response.status).toBe(201);
    expect(response.body.title).toBe("Test Note");
  });
});
```

#### 3. E2E テスト（Playwright）

```typescript
// tests/e2e/notes.spec.ts
import { test, expect } from "@playwright/test";

test.describe("メモ管理", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/login");
    await page.fill('[name="email"]', "test@example.com");
    await page.fill('[name="password"]', "Password123!");
    await page.click('button[type="submit"]');
  });

  test("メモを作成できる", async ({ page }) => {
    await page.click('button:has-text("New Note")');
    await page.fill('[name="title"]', "Test Note");
    await page.fill('[name="content"]', "Test Content");
    await page.click('button:has-text("Save")');

    await expect(page.locator("text=Test Note")).toBeVisible();
  });
});
```

### デプロイ（Vercel）

**Week 2 終了時にデプロイ**:

```bash
# 1. 環境変数設定
vercel env add DATABASE_URL
vercel env add JWT_SECRET
vercel env add NEXTAUTH_SECRET

# 2. デプロイ
vercel --prod

# 3. データベースマイグレーション
vercel env pull .env.production
npx prisma migrate deploy
```

## 🏗️ Phase 2: アーキテクチャ改善 (2 週間)

### 目標

Clean Architecture + DDD/CQRS で保守性・拡張性を向上

### 実装内容

#### Week 3: Clean Architecture 適用

**ディレクトリ構造再編成**:

```
src/
├── domain/
│   ├── entities/          # エンティティ
│   │   ├── user.ts
│   │   ├── note.ts
│   │   └── tag.ts
│   ├── value-objects/     # 値オブジェクト
│   │   ├── email.ts
│   │   ├── password.ts
│   │   └── note-content.ts
│   ├── repositories/      # リポジトリインターフェース
│   │   ├── user-repository.ts
│   │   └── note-repository.ts
│   └── services/          # ドメインサービス
│       └── note-search-service.ts
│
├── application/
│   ├── use-cases/         # ユースケース
│   │   ├── notes/
│   │   │   ├── create-note.ts
│   │   │   ├── update-note.ts
│   │   │   ├── delete-note.ts
│   │   │   └── search-notes.ts
│   │   └── auth/
│   │       ├── register.ts
│   │       ├── login.ts
│   │       └── refresh-token.ts
│   ├── dto/               # Data Transfer Objects
│   │   ├── create-note-dto.ts
│   │   └── note-response-dto.ts
│   └── ports/             # ポート（インターフェース）
│       ├── password-hasher.ts
│       └── token-generator.ts
│
├── infrastructure/
│   ├── database/
│   │   ├── prisma/
│   │   │   └── schema.prisma
│   │   └── repositories/
│   │       ├── prisma-user-repository.ts
│   │       └── prisma-note-repository.ts
│   ├── security/
│   │   ├── bcrypt-password-hasher.ts
│   │   └── jwt-token-generator.ts
│   └── external/
│       └── email-service.ts
│
└── presentation/
    ├── actions/           # Server Actions
    │   ├── note-actions.ts
    │   └── auth-actions.ts
    ├── components/        # React Components
    │   ├── notes/
    │   │   ├── note-list.tsx
    │   │   ├── note-form.tsx
    │   │   └── note-detail.tsx
    │   └── auth/
    │       ├── login-form.tsx
    │       └── register-form.tsx
    └── hooks/             # Custom Hooks
        ├── use-notes.ts
        └── use-auth.ts
```

**Value Object 実装例**:

```typescript
// src/domain/value-objects/email.ts
export class Email {
  private readonly value: string;

  private constructor(value: string) {
    this.value = value;
  }

  static create(email: string): Email {
    if (!this.isValid(email)) {
      throw new Error("Invalid email address");
    }
    return new Email(email.toLowerCase());
  }

  private static isValid(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  getValue(): string {
    return this.value;
  }

  equals(other: Email): boolean {
    return this.value === other.value;
  }
}
```

#### Week 4: DDD/CQRS パターン

**コマンドとクエリの分離**:

```typescript
// src/application/commands/create-note-command.ts
export class CreateNoteCommand {
  constructor(
    public readonly userId: string,
    public readonly title: string,
    public readonly content: string,
    public readonly tags: string[]
  ) {}
}

export class CreateNoteCommandHandler {
  constructor(
    private readonly noteRepository: NoteRepository,
    private readonly eventBus: EventBus
  ) {}

  async execute(command: CreateNoteCommand): Promise<Note> {
    // バリデーション
    const title = NoteTitle.create(command.title);
    const content = NoteContent.create(command.content);

    // エンティティ作成
    const note = Note.create({
      userId: command.userId,
      title,
      content,
      tags: command.tags,
    });

    // 永続化
    await this.noteRepository.save(note);

    // イベント発行
    await this.eventBus.publish(new NoteCreatedEvent(note));

    return note;
  }
}
```

```typescript
// src/application/queries/get-notes-query.ts
export class GetNotesQuery {
  constructor(
    public readonly userId: string,
    public readonly filter?: NoteFilter,
    public readonly pagination?: Pagination
  ) {}
}

export class GetNotesQueryHandler {
  constructor(private readonly noteReadModel: NoteReadModel) {}

  async execute(query: GetNotesQuery): Promise<NoteListDto> {
    const notes = await this.noteReadModel.findByUserId(
      query.userId,
      query.filter,
      query.pagination
    );

    return NoteListDto.fromNotes(notes);
  }
}
```

**ドメインイベント**:

```typescript
// src/domain/events/note-created-event.ts
export class NoteCreatedEvent implements DomainEvent {
  constructor(
    public readonly noteId: string,
    public readonly userId: string,
    public readonly occurredAt: Date = new Date()
  ) {}
}

// イベントハンドラー
export class SendNotificationOnNoteCreated {
  async handle(event: NoteCreatedEvent): Promise<void> {
    // 通知を送信
    await this.notificationService.send({
      userId: event.userId,
      message: "New note created",
    });
  }
}
```

## 📊 Phase 3: スケーラビリティ (2 週間)

### 目標

大規模アプリケーションを想定した設計

### 実装内容

#### Week 5: Event-Driven Architecture

**イベントソーシング導入**:

```typescript
// src/domain/aggregates/note-aggregate.ts
export class NoteAggregate extends AggregateRoot {
  private id: string;
  private userId: string;
  private title: string;
  private content: string;
  private version: number = 0;

  static create(command: CreateNoteCommand): NoteAggregate {
    const note = new NoteAggregate();
    note.apply(
      new NoteCreatedEvent({
        noteId: generateId(),
        userId: command.userId,
        title: command.title,
        content: command.content,
      })
    );
    return note;
  }

  update(command: UpdateNoteCommand): void {
    this.apply(
      new NoteUpdatedEvent({
        noteId: this.id,
        title: command.title,
        content: command.content,
      })
    );
  }

  private onNoteCreated(event: NoteCreatedEvent): void {
    this.id = event.noteId;
    this.userId = event.userId;
    this.title = event.title;
    this.content = event.content;
  }

  private onNoteUpdated(event: NoteUpdatedEvent): void {
    this.title = event.title;
    this.content = event.content;
  }
}
```

**イベントストア**:

```typescript
// src/infrastructure/event-store/event-store.ts
export class EventStore {
  async save(events: DomainEvent[]): Promise<void> {
    await this.prisma.event.createMany({
      data: events.map((event) => ({
        aggregateId: event.aggregateId,
        type: event.constructor.name,
        payload: JSON.stringify(event),
        version: event.version,
        occurredAt: event.occurredAt,
      })),
    });
  }

  async getEvents(aggregateId: string): Promise<DomainEvent[]> {
    const events = await this.prisma.event.findMany({
      where: { aggregateId },
      orderBy: { version: "asc" },
    });

    return events.map((e) => this.deserialize(e));
  }
}
```

#### Week 6: パフォーマンス最適化

**キャッシング戦略**:

```typescript
// src/infrastructure/cache/redis-cache.ts
import { Redis } from "@upstash/redis";

export class RedisCache {
  private redis: Redis;

  async get<T>(key: string): Promise<T | null> {
    const value = await this.redis.get(key);
    return value as T;
  }

  async set<T>(key: string, value: T, ttl: number = 3600): Promise<void> {
    await this.redis.setex(key, ttl, JSON.stringify(value));
  }

  async invalidate(pattern: string): Promise<void> {
    const keys = await this.redis.keys(pattern);
    if (keys.length > 0) {
      await this.redis.del(...keys);
    }
  }
}
```

**読み取り最適化（CQRS Read Model）**:

```typescript
// src/infrastructure/read-models/note-read-model.ts
export class NoteReadModel {
  async findByUserId(userId: string, filter?: NoteFilter): Promise<NoteDto[]> {
    // キャッシュチェック
    const cacheKey = `notes:${userId}:${JSON.stringify(filter)}`;
    const cached = await this.cache.get<NoteDto[]>(cacheKey);
    if (cached) return cached;

    // データベースクエリ（最適化済み）
    const notes = await this.prisma.note.findMany({
      where: {
        userId,
        ...(filter?.tags && { tags: { hasSome: filter.tags } }),
        ...(filter?.search && {
          OR: [
            { title: { contains: filter.search, mode: "insensitive" } },
            { content: { contains: filter.search, mode: "insensitive" } },
          ],
        }),
      },
      select: {
        id: true,
        title: true,
        content: true,
        tags: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { updatedAt: "desc" },
    });

    // キャッシュに保存
    await this.cache.set(cacheKey, notes, 600); // 10分

    return notes;
  }
}
```

**データベース最適化**:

```prisma
// prisma/schema.prisma
model Note {
  id        String   @id @default(cuid())
  title     String
  content   String   @db.Text
  tags      String[]
  userId    String
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  user      User     @relation(fields: [userId], references: [id])

  // パフォーマンス最適化のためのインデックス
  @@index([userId, updatedAt(sort: Desc)])
  @@index([tags])
  @@fulltext([title, content])
}
```

## 🔄 Phase 4: 代替実装（学習目的） (2 週間)

### 目標

異なるフレームワークで同じ機能を実装し、比較学習

#### Week 7: NestJS 版メモアプリ

**プロジェクト構成**:

```
Projects/
├── advanced-memo-app/        # Next.js版（メイン）
├── nestjs-memo-api/          # NestJS版（バックエンドのみ）
└── hono-memo-api/            # Hono版（バックエンドのみ）
```

**NestJS 実装**:

```bash
# プロジェクト作成
nest new nestjs-memo-api

# 必要なモジュール
nest g module notes
nest g module auth
nest g service notes
nest g controller notes
```

```typescript
// src/notes/notes.controller.ts
@Controller("notes")
@UseGuards(JwtAuthGuard)
export class NotesController {
  constructor(private readonly notesService: NotesService) {}

  @Get()
  async findAll(@Request() req): Promise<NoteDto[]> {
    return this.notesService.findByUserId(req.user.id);
  }

  @Post()
  async create(
    @Request() req,
    @Body() createNoteDto: CreateNoteDto
  ): Promise<NoteDto> {
    return this.notesService.create(req.user.id, createNoteDto);
  }

  @Put(":id")
  async update(
    @Param("id") id: string,
    @Body() updateNoteDto: UpdateNoteDto
  ): Promise<NoteDto> {
    return this.notesService.update(id, updateNoteDto);
  }

  @Delete(":id")
  async delete(@Param("id") id: string): Promise<void> {
    return this.notesService.delete(id);
  }
}
```

#### Week 8: Hono 版メモアプリ

**Hono 実装**:

```typescript
// src/index.ts
import { Hono } from "hono";
import { jwt } from "hono/jwt";
import { zValidator } from "@hono/zod-validator";
import { CreateNoteSchema } from "./schemas";

const app = new Hono();

// JWT認証ミドルウェア
app.use("/api/*", jwt({ secret: process.env.JWT_SECRET }));

// メモCRUD
app.get("/api/notes", async (c) => {
  const userId = c.get("jwtPayload").sub;
  const notes = await noteService.findByUserId(userId);
  return c.json(notes);
});

app.post("/api/notes", zValidator("json", CreateNoteSchema), async (c) => {
  const userId = c.get("jwtPayload").sub;
  const data = c.req.valid("json");
  const note = await noteService.create(userId, data);
  return c.json(note, 201);
});

export default app;
```

### 比較レポート作成

```markdown
# フレームワーク比較レポート

## パフォーマンス

| フレームワーク | リクエスト/秒 | レスポンスタイム(p95) |
| -------------- | ------------- | --------------------- |
| Next.js        | 1,200         | 45ms                  |
| NestJS         | 2,500         | 28ms                  |
| Hono           | 8,000         | 12ms                  |

## 開発体験

- Next.js: フルスタック、UI も含めて開発可能
- NestJS: エンタープライズ向け、豊富な機能
- Hono: 軽量、高速、シンプル

## ユースケース

- Next.js: フルスタックアプリ
- NestJS: 大規模バックエンド、マイクロサービス
- Hono: エッジ環境、高速 API
```

## 📈 成功指標（KPI）

### 技術的指標

- [ ] テストカバレッジ > 80%
- [ ] Lighthouse スコア > 90
- [ ] Core Web Vitals 合格
- [ ] TypeScript strict mode エラー 0
- [ ] ESLint エラー 0

### 学習指標

- [ ] 全ての学習トピックを実装に適用
- [ ] 技術ブログ記事を 3 本以上執筆
- [ ] ポートフォリオに追加
- [ ] GitHub スター獲得

### ビジネス指標（オプション）

- [ ] 実際のユーザーフィードバック取得
- [ ] デイリーアクティブユーザー計測
- [ ] パフォーマンス監視（Vercel Analytics）

## 🗓️ タイムライン

```
Week 1-2:  MVP実装 + デプロイ
Week 3-4:  アーキテクチャ改善
Week 5-6:  スケーラビリティ対応
Week 7-8:  代替実装（NestJS, Hono）
Week 9-10: ドキュメント、ブログ執筆
```

## 📚 学習リソース活用

### ドキュメント参照

```
実装中の参照先:
├── Learning/In-Progress/Next.js 16.md
├── Learning/In-Progress/AI-Driven-Development.md
├── Learning/In-Progress/SDD.md
├── Learning/In-Progress/Clean Architecture.md
├── Learning/In-Progress/DDD-CQRS.md
└── Learning/In-Progress/Vercel.md
```

### Daily メモ

```bash
# 毎日の学習を記録
Daily/
├── 2025-11-23.md  # 今日の進捗
├── 2025-11-24.md
└── ...
```

## 🔧 開発環境セットアップ

```bash
# 1. リポジトリクローン
git clone <repository-url>
cd ob-dev

# 2. プロジェクト作成
cd Projects
# Claude Code に依頼して初期化

# 3. 依存関係インストール
cd advanced-memo-app
npm install

# 4. 環境変数設定
cp .env.example .env.local
# DATABASE_URL, JWT_SECRET などを設定

# 5. データベースセットアップ
npx prisma migrate dev
npx prisma generate

# 6. 開発サーバー起動
npm run dev
```

## 🎯 次のアクション

### 今すぐ実行

1. **Phase 1 の開始**

   ```bash
   cd Projects
   mkdir advanced-memo-app
   cd advanced-memo-app
   ```

2. **Claude Code で初期化**

   ```
   "Next.js 16プロジェクトを初期化して..."
   ```

3. **仕様ドキュメント作成**
   ```bash
   mkdir specs/features
   touch specs/features/authentication.feature
   ```

### 週次レビュー

毎週日曜日に:

- [ ] 進捗確認
- [ ] 学習内容を Daily/に記録
- [ ] 次週の計画調整

## 📝 まとめ

この実装計画により:

✅ **実践的な学習**: 理論だけでなく実装で習得
✅ **段階的な成長**: MVP から高度な機能へ
✅ **ポートフォリオ**: 実際に動くアプリケーション
✅ **比較学習**: 複数フレームワークで実装
✅ **AI 活用**: 効率的な開発体験

**開始日**: 2025-11-23（今日から！）
**完了予定**: 2026-01-18（8 週間後）

---

**最終更新**: 2025-11-22
**ステータス**: 計画中 → 実装準備完了

Let's build something amazing! 🚀
