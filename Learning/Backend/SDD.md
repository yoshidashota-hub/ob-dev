---
created: 2025-11-22
tags:
  [
    learning,
    sdd,
    specification-driven-development,
    software-engineering,
    testing,
    tdd,
    bdd,
  ]
status: 進行中
topic: SDD (仕様駆動開発)
source: https://www.thoughtworks.com/insights/blog/specification-driven-development
---

# SDD (仕様駆動開発)

## 概要

SDD (Specification-Driven Development) は、**実装前に仕様を明確に定義し、その仕様を実行可能な形式で記述**することで、品質の高いソフトウェアを開発する手法。

## 学んだこと

### 🎯 SDD とは

**仕様を中心に据えた開発アプローチ**

SDD は、ソフトウェアの振る舞いを形式的な仕様として記述し、その仕様に基づいて開発とテストを行う手法。

**核心的な原則:**

- **仕様が真実**: コードではなく仕様がシステムの振る舞いを定義
- **実行可能な仕様**: 仕様はドキュメントであり、テストでもある
- **早期の検証**: 実装前に仕様の妥当性を確認
- **継続的な同期**: 仕様とコードは常に一致

**他の開発手法との比較:**

| 項目             | SDD          | TDD          | BDD                  | DDD            |
| ---------------- | ------------ | ------------ | -------------------- | -------------- |
| 焦点             | 仕様         | テスト       | 振る舞い             | ドメイン       |
| 開始点           | 仕様定義     | テスト作成   | シナリオ記述         | モデリング     |
| 主要成果物       | 実行可能仕様 | テストコード | フィーチャーファイル | ドメインモデル |
| ステークホルダー | 全員         | 開発者       | ビジネス+開発        | ビジネス+開発  |
| 自動化           | 高           | 高           | 高                   | 中             |

### 📋 仕様の種類

#### 1. 機能仕様 (Functional Specification)

システムが**何をすべきか**を定義する。

```gherkin
# Given-When-Then 形式
Feature: ユーザー認証

  Scenario: 有効な認証情報でログイン
    Given ユーザー "user@example.com" が登録されている
    And パスワードは "SecurePass123" である
    When ユーザーがログインを試みる
    Then ログインに成功する
    And ホーム画面にリダイレクトされる
```

#### 2. 技術仕様 (Technical Specification)

システムが**どのように動作するか**を定義する。

```typescript
/**
 * 認証サービス技術仕様
 *
 * @specification
 * - アルゴリズム: bcrypt (cost factor: 10)
 * - セッション管理: JWT (有効期限: 1時間)
 * - リフレッシュトークン: 7日間有効
 * - レート制限: 5回/分
 */
interface AuthenticationSpec {
  // パスワードハッシュ化
  hashPassword(password: string): Promise<string>;

  // パスワード検証
  verifyPassword(password: string, hash: string): Promise<boolean>;

  // トークン生成
  generateToken(userId: string): Promise<{
    accessToken: string;
    refreshToken: string;
  }>;

  // トークン検証
  verifyToken(token: string): Promise<TokenPayload>;
}
```

#### 3. API 仕様 (API Specification)

API のインターフェースを定義する（OpenAPI, GraphQL Schema など）。

```yaml
# OpenAPI 3.0 仕様
openapi: 3.0.0
info:
  title: User API
  version: 1.0.0

paths:
  /users/{id}:
    get:
      summary: ユーザー情報を取得
      parameters:
        - name: id
          in: path
          required: true
          schema:
            type: string
      responses:
        "200":
          description: 成功
          content:
            application/json:
              schema:
                $ref: "#/components/schemas/User"
        "404":
          description: ユーザーが見つからない

components:
  schemas:
    User:
      type: object
      required:
        - id
        - email
        - name
      properties:
        id:
          type: string
        email:
          type: string
          format: email
        name:
          type: string
```

#### 4. データ仕様 (Data Specification)

データ構造とバリデーションルールを定義する。

```typescript
import { z } from "zod";

/**
 * ユーザーデータ仕様
 */
export const UserSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email().max(255),
  name: z.string().min(1).max(100),
  age: z.number().int().min(0).max(150).optional(),
  roles: z.array(z.enum(["admin", "user", "guest"])).default(["user"]),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type User = z.infer<typeof UserSchema>;

/**
 * ユーザー作成リクエスト仕様
 */
export const CreateUserRequestSchema = z.object({
  email: z.string().email(),
  password: z
    .string()
    .min(8, "パスワードは8文字以上")
    .regex(/[A-Z]/, "大文字を含む必要があります")
    .regex(/[0-9]/, "数字を含む必要があります"),
  name: z.string().min(1).max(100),
});

export type CreateUserRequest = z.infer<typeof CreateUserRequestSchema>;
```

### 🔄 SDD のワークフロー

```
1. 要件収集
   ↓
2. 仕様作成 ← ステークホルダーとの協議
   ↓
3. 仕様レビュー ← 早期のフィードバック
   ↓
4. 仕様の実行 ← 自動テストとして実行
   ↓
5. 実装 ← 仕様を満たすコードを書く
   ↓
6. 検証 ← 仕様（テスト）を実行
   ↓
7. リファクタリング ← 仕様は変えずに実装を改善
   ↓
8. 仕様の更新 ← 要件変更時
   ↓
[繰り返し]
```

### 📝 仕様の書き方

#### レベル 1: 自然言語仕様

```markdown
# ユーザー登録機能仕様

## 概要

新規ユーザーがアカウントを作成できる機能

## 入力

- メールアドレス（必須、有効な形式）
- パスワード（必須、8 文字以上、大文字・数字を含む）
- 名前（必須、1-100 文字）

## 処理

1. 入力値をバリデーション
2. メールアドレスの重複チェック
3. パスワードをハッシュ化（bcrypt、cost factor 10）
4. データベースに保存
5. 確認メールを送信

## 出力

- 成功時: ユーザー ID、作成日時
- 失敗時: エラーメッセージ

## エラー処理

- バリデーションエラー: 400 Bad Request
- メール重複: 409 Conflict
- サーバーエラー: 500 Internal Server Error
```

#### レベル 2: 半形式的仕様（Given-When-Then）

```gherkin
Feature: ユーザー登録

  Scenario: 有効なデータで登録成功
    Given データベースが空である
    When 以下のデータで登録を試みる:
      | email            | password     | name      |
      | user@example.com | Password123  | Test User |
    Then 登録に成功する
    And ユーザーIDが返される
    And 確認メールが送信される

  Scenario: 無効なメールアドレスで登録失敗
    When 以下のデータで登録を試みる:
      | email        | password     | name      |
      | invalid-mail | Password123  | Test User |
    Then 登録に失敗する
    And エラーメッセージ "有効なメールアドレスを入力してください" が表示される

  Scenario: パスワードが短すぎて登録失敗
    When 以下のデータで登録を試みる:
      | email            | password | name      |
      | user@example.com | Pass1    | Test User |
    Then 登録に失敗する
    And エラーメッセージ "パスワードは8文字以上である必要があります" が表示される

  Scenario: メールアドレスが重複して登録失敗
    Given ユーザー "existing@example.com" が既に登録されている
    When 以下のデータで登録を試みる:
      | email                | password     | name      |
      | existing@example.com | Password123  | Test User |
    Then 登録に失敗する
    And エラーメッセージ "このメールアドレスは既に登録されています" が表示される
```

#### レベル 3: 形式的仕様（コードとして実行可能）

```typescript
import { describe, it, expect, beforeEach } from "vitest";
import { registerUser } from "./user-registration";
import { db } from "@/lib/db";

/**
 * ユーザー登録機能仕様
 *
 * この仕様は実行可能なテストとして機能する
 */
describe("ユーザー登録機能", () => {
  beforeEach(async () => {
    await db.user.deleteMany();
  });

  describe("正常系", () => {
    it("有効なデータで登録に成功する", async () => {
      // Given: 有効な登録データ
      const userData = {
        email: "user@example.com",
        password: "Password123",
        name: "Test User",
      };

      // When: 登録を実行
      const result = await registerUser(userData);

      // Then: 成功する
      expect(result.success).toBe(true);
      expect(result.data).toMatchObject({
        id: expect.any(String),
        email: userData.email,
        name: userData.name,
        createdAt: expect.any(Date),
      });
      expect(result.data.password).toBeUndefined(); // パスワードは返されない
    });

    it("パスワードがハッシュ化されて保存される", async () => {
      // Given
      const userData = {
        email: "user@example.com",
        password: "Password123",
        name: "Test User",
      };

      // When
      await registerUser(userData);

      // Then: パスワードはハッシュ化されている
      const user = await db.user.findUnique({
        where: { email: userData.email },
      });
      expect(user?.password).not.toBe(userData.password);
      expect(user?.password).toMatch(/^\$2[ayb]\$.{56}$/); // bcrypt形式
    });
  });

  describe("バリデーション", () => {
    it("無効なメールアドレスでエラー", async () => {
      const result = await registerUser({
        email: "invalid-email",
        password: "Password123",
        name: "Test User",
      });

      expect(result.success).toBe(false);
      expect(result.errors?.email).toContain(
        "有効なメールアドレスを入力してください"
      );
    });

    it("短いパスワードでエラー", async () => {
      const result = await registerUser({
        email: "user@example.com",
        password: "Pass1",
        name: "Test User",
      });

      expect(result.success).toBe(false);
      expect(result.errors?.password).toContain(
        "パスワードは8文字以上である必要があります"
      );
    });

    it("大文字を含まないパスワードでエラー", async () => {
      const result = await registerUser({
        email: "user@example.com",
        password: "password123",
        name: "Test User",
      });

      expect(result.success).toBe(false);
      expect(result.errors?.password).toContain("大文字を含む必要があります");
    });

    it("数字を含まないパスワードでエラー", async () => {
      const result = await registerUser({
        email: "user@example.com",
        password: "Password",
        name: "Test User",
      });

      expect(result.success).toBe(false);
      expect(result.errors?.password).toContain("数字を含む必要があります");
    });

    it("空の名前でエラー", async () => {
      const result = await registerUser({
        email: "user@example.com",
        password: "Password123",
        name: "",
      });

      expect(result.success).toBe(false);
      expect(result.errors?.name).toContain("名前を入力してください");
    });
  });

  describe("ビジネスルール", () => {
    it("重複するメールアドレスでエラー", async () => {
      // Given: 既存ユーザー
      await registerUser({
        email: "existing@example.com",
        password: "Password123",
        name: "Existing User",
      });

      // When: 同じメールで登録を試みる
      const result = await registerUser({
        email: "existing@example.com",
        password: "DifferentPass123",
        name: "New User",
      });

      // Then: エラー
      expect(result.success).toBe(false);
      expect(result.errors?.email).toContain(
        "このメールアドレスは既に登録されています"
      );
    });
  });

  describe("セキュリティ", () => {
    it("レスポンスにパスワードを含まない", async () => {
      const result = await registerUser({
        email: "user@example.com",
        password: "Password123",
        name: "Test User",
      });

      expect(result.data).toBeDefined();
      expect(result.data?.password).toBeUndefined();
      expect(JSON.stringify(result)).not.toContain("Password123");
    });

    it("SQLインジェクションを防ぐ", async () => {
      const result = await registerUser({
        email: "' OR '1'='1",
        password: "Password123",
        name: "Test User",
      });

      expect(result.success).toBe(false);
      // 悪意のあるSQLが実行されていないことを確認
      const users = await db.user.findMany();
      expect(users).toHaveLength(0);
    });
  });
});
```

### 🔧 ツールとテクニック

#### 1. BDD ツール

**Cucumber / Jest-Cucumber**

```typescript
// features/user-registration.feature
Feature: ユーザー登録

  Scenario: 有効なデータで登録成功
    Given データベースが空である
    When 以下のデータで登録を試みる
      | email            | password     | name      |
      | user@example.com | Password123  | Test User |
    Then 登録に成功する

// steps/user-registration.steps.ts
import { defineFeature, loadFeature } from 'jest-cucumber';
import { registerUser } from '@/services/user-registration';
import { db } from '@/lib/db';

const feature = loadFeature('features/user-registration.feature');

defineFeature(feature, (test) => {
  test('有効なデータで登録成功', ({ given, when, then }) => {
    let result: any;

    given('データベースが空である', async () => {
      await db.user.deleteMany();
    });

    when('以下のデータで登録を試みる', async (table) => {
      const userData = table[0];
      result = await registerUser(userData);
    });

    then('登録に成功する', () => {
      expect(result.success).toBe(true);
    });
  });
});
```

#### 2. スキーマバリデーション

**Zod / Yup / Joi**

```typescript
import { z } from "zod";

// 仕様をスキーマとして定義
export const UserRegistrationSpec = z.object({
  email: z
    .string()
    .email("有効なメールアドレスを入力してください")
    .max(255, "メールアドレスは255文字以内である必要があります"),

  password: z
    .string()
    .min(8, "パスワードは8文字以上である必要があります")
    .regex(/[A-Z]/, "大文字を含む必要があります")
    .regex(/[0-9]/, "数字を含む必要があります")
    .regex(/[^A-Za-z0-9]/, "特殊文字を含む必要があります"),

  name: z
    .string()
    .min(1, "名前を入力してください")
    .max(100, "名前は100文字以内である必要があります"),
});

// 仕様から型を生成
export type UserRegistrationData = z.infer<typeof UserRegistrationSpec>;

// 実装で仕様を使用
export async function registerUser(data: unknown) {
  // 仕様に基づいてバリデーション
  const validated = UserRegistrationSpec.safeParse(data);

  if (!validated.success) {
    return {
      success: false,
      errors: validated.error.flatten().fieldErrors,
    };
  }

  // 実装...
  return { success: true, data: validated.data };
}
```

#### 3. API 仕様駆動開発

**OpenAPI + コード生成**

```yaml
# api-spec.yaml
openapi: 3.0.0
info:
  title: User Service API
  version: 1.0.0

paths:
  /users:
    post:
      operationId: registerUser
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: "#/components/schemas/RegisterUserRequest"
      responses:
        "201":
          description: Created
          content:
            application/json:
              schema:
                $ref: "#/components/schemas/User"
        "400":
          description: Bad Request
          content:
            application/json:
              schema:
                $ref: "#/components/schemas/Error"

components:
  schemas:
    RegisterUserRequest:
      type: object
      required:
        - email
        - password
        - name
      properties:
        email:
          type: string
          format: email
        password:
          type: string
          minLength: 8
        name:
          type: string
          minLength: 1
          maxLength: 100

    User:
      type: object
      properties:
        id:
          type: string
        email:
          type: string
        name:
          type: string
        createdAt:
          type: string
          format: date-time

    Error:
      type: object
      properties:
        message:
          type: string
        errors:
          type: object
```

```bash
# 仕様から型を生成
npx openapi-typescript api-spec.yaml -o ./types/api.ts

# 仕様から検証コードを生成
npx openapi-typescript-codegen --input api-spec.yaml --output ./generated
```

```typescript
// 生成された型を使用
import type { paths } from "./types/api";

type RegisterUserRequest =
  paths["/users"]["post"]["requestBody"]["content"]["application/json"];
type RegisterUserResponse =
  paths["/users"]["post"]["responses"]["201"]["content"]["application/json"];

// 実装は自動生成された型に従う
export async function registerUser(
  data: RegisterUserRequest
): Promise<RegisterUserResponse> {
  // 実装...
}
```

#### 4. Property-Based Testing

**仕様をプロパティとして記述**

```typescript
import { fc, test } from "@fast-check/vitest";
import { registerUser } from "./user-registration";

/**
 * プロパティベースの仕様
 *
 * 任意の有効な入力に対して、システムが満たすべき性質を定義
 */
describe("ユーザー登録のプロパティ", () => {
  test.prop([
    fc.emailAddress(),
    fc
      .string({ minLength: 8 })
      .filter((s) => /[A-Z]/.test(s) && /[0-9]/.test(s)),
    fc.string({ minLength: 1, maxLength: 100 }),
  ])("有効なデータは常に成功する", async (email, password, name) => {
    const result = await registerUser({ email, password, name });
    expect(result.success).toBe(true);
  });

  test.prop([
    fc.string().filter((s) => !s.includes("@")),
    fc.string({ minLength: 8 }),
    fc.string({ minLength: 1 }),
  ])("無効なメールアドレスは常に失敗する", async (email, password, name) => {
    const result = await registerUser({ email, password, name });
    expect(result.success).toBe(false);
    expect(result.errors?.email).toBeDefined();
  });

  test.prop([
    fc.emailAddress(),
    fc.string({ maxLength: 7 }),
    fc.string({ minLength: 1 }),
  ])("短いパスワードは常に失敗する", async (email, password, name) => {
    const result = await registerUser({ email, password, name });
    expect(result.success).toBe(false);
    expect(result.errors?.password).toBeDefined();
  });
});
```

#### 5. Contract Testing

**API 間の契約を仕様として定義**

```typescript
// Pact を使用した契約テスト
import { Pact } from "@pact-foundation/pact";
import { registerUser } from "@/api/client";

describe("User Service Contract", () => {
  const provider = new Pact({
    consumer: "Frontend",
    provider: "UserService",
  });

  beforeAll(() => provider.setup());
  afterEach(() => provider.verify());
  afterAll(() => provider.finalize());

  it("ユーザー登録APIの契約", async () => {
    // 期待する契約を定義
    await provider.addInteraction({
      state: "データベースが空",
      uponReceiving: "ユーザー登録リクエスト",
      withRequest: {
        method: "POST",
        path: "/users",
        headers: { "Content-Type": "application/json" },
        body: {
          email: "user@example.com",
          password: "Password123",
          name: "Test User",
        },
      },
      willRespondWith: {
        status: 201,
        headers: { "Content-Type": "application/json" },
        body: {
          id: Matchers.uuid(),
          email: "user@example.com",
          name: "Test User",
          createdAt: Matchers.iso8601DateTime(),
        },
      },
    });

    // 契約に従って実装をテスト
    const result = await registerUser({
      email: "user@example.com",
      password: "Password123",
      name: "Test User",
    });

    expect(result.id).toBeDefined();
    expect(result.email).toBe("user@example.com");
  });
});
```

### 🎨 SDD のベストプラクティス

#### 1. INVEST 原則に従う

仕様は **INVEST** であるべき:

- **I**ndependent（独立している）
- **N**egotiable（交渉可能）
- **V**aluable（価値がある）
- **E**stimable（見積もり可能）
- **S**mall（小さい）
- **T**estable（テスト可能）

```gherkin
# ❌ 悪い例: 大きすぎて依存関係が多い
Scenario: ユーザーが商品を購入する
  Given ユーザーがログインしている
  And カートに商品がある
  And 配送先が設定されている
  And 支払い方法が設定されている
  When ユーザーが購入ボタンをクリックする
  Then 注文が作成される
  And 在庫が減少する
  And メールが送信される
  And ポイントが付与される

# ✅ 良い例: 小さく独立している
Scenario: 注文を作成する
  Given カート "cart-123" に商品 "product-456" が入っている
  When ユーザー "user-789" が注文を確定する
  Then 注文 "order-001" が作成される

Scenario: 注文確定時に在庫を減らす
  Given 商品 "product-456" の在庫が 10個 ある
  When 注文 "order-001" が確定される
  Then 商品 "product-456" の在庫が 9個 になる
```

#### 2. 階層的な仕様

```
高レベル仕様（ビジネス価値）
  ↓
中レベル仕様（ユーザーストーリー）
  ↓
低レベル仕様（技術詳細）
```

```markdown
# 高レベル: エピック

**オンライン決済機能**
ユーザーがクレジットカードで商品を購入できる

## 中レベル: ユーザーストーリー

**ストーリー 1**: クレジットカード情報の登録
**ストーリー 2**: 保存されたカードでの支払い
**ストーリー 3**: 新しいカードでの支払い

### 低レベル: 技術仕様

**ストーリー 1 の技術仕様**:

- Stripe API を使用してカード情報を保存
- PCI DSS 準拠のトークン化を実装
- カード番号の下 4 桁のみを表示
```

#### 3. Given-When-Then の効果的な使用

```typescript
/**
 * Given-When-Then パターンの原則
 *
 * Given: 前提条件を設定（状態のセットアップ）
 * When: アクションを実行（テスト対象の操作）
 * Then: 結果を検証（期待される振る舞い）
 */

// ✅ 良い例: 明確に分離されている
describe("注文キャンセル", () => {
  it("確定前の注文はキャンセルできる", async () => {
    // Given: 確定前の注文
    const order = await createOrder({
      status: "pending",
      items: [{ productId: "123", quantity: 1 }],
    });

    // When: キャンセルを実行
    const result = await cancelOrder(order.id);

    // Then: キャンセルされる
    expect(result.success).toBe(true);
    expect(result.order.status).toBe("cancelled");
  });

  it("発送済みの注文はキャンセルできない", async () => {
    // Given: 発送済みの注文
    const order = await createOrder({
      status: "shipped",
      items: [{ productId: "123", quantity: 1 }],
    });

    // When: キャンセルを試みる
    const result = await cancelOrder(order.id);

    // Then: エラーになる
    expect(result.success).toBe(false);
    expect(result.error).toBe("発送済みの注文はキャンセルできません");
  });
});

// ❌ 悪い例: GivenとWhenが混在
it("注文をキャンセルする", async () => {
  const order = await createOrder({ status: "pending" }); // Given + When が混在
  const result = await cancelOrder(order.id); // When
  expect(result.success).toBe(true); // Then
});
```

#### 4. リビングドキュメント

仕様は**生きたドキュメント**として維持する。

```typescript
/**
 * この仕様は自動的にドキュメントとして生成される
 *
 * テスト実行時に仕様レポートを生成:
 * npm test -- --reporter=spec
 */

describe("ユーザー管理機能", () => {
  describe("ユーザー登録", () => {
    it("有効なデータで登録に成功する");
    it("無効なメールアドレスでエラー");
    it("短いパスワードでエラー");
  });

  describe("ユーザーログイン", () => {
    it("正しい認証情報でログインできる");
    it("間違ったパスワードでエラー");
    it("存在しないユーザーでエラー");
  });
});
```

```bash
# 仕様レポートの生成
npm test -- --reporter=json > spec-report.json

# HTMLレポートの生成
npm test -- --reporter=html > spec-report.html
```

#### 5. 仕様の進化

```typescript
/**
 * 仕様のバージョン管理
 *
 * 仕様の変更履歴をコミットメッセージに記録
 */

// v1.0.0: 初期仕様
describe("パスワード要件 v1", () => {
  it("8文字以上である", () => {
    expect(validatePassword("Pass1234")).toBe(true);
  });
});

// v1.1.0: 要件を強化
describe("パスワード要件 v1.1", () => {
  it("8文字以上である", () => {
    expect(validatePassword("Pass1234")).toBe(true);
  });

  it("大文字を含む", () => {
    expect(validatePassword("password123")).toBe(false);
    expect(validatePassword("Password123")).toBe(true);
  });

  it("数字を含む", () => {
    expect(validatePassword("Password")).toBe(false);
    expect(validatePassword("Password123")).toBe(true);
  });
});

// v2.0.0: 破壊的変更
describe("パスワード要件 v2", () => {
  it("12文字以上である", () => {
    // 8→12に変更
    expect(validatePassword("Pass1234")).toBe(false);
    expect(validatePassword("Password1234")).toBe(true);
  });

  it("特殊文字を含む", () => {
    // 新しい要件
    expect(validatePassword("Password1234")).toBe(false);
    expect(validatePassword("Password123!")).toBe(true);
  });
});
```

### 📊 SDD と他の手法の統合

#### SDD + TDD

```typescript
/**
 * TDD (Test-Driven Development) との統合
 *
 * 1. 仕様を書く（失敗するテスト）
 * 2. 実装する（テストを通す）
 * 3. リファクタリング（仕様は変えない）
 */

// Step 1: 仕様（失敗するテスト）
describe("calculateTotal", () => {
  it("商品の合計金額を計算する", () => {
    // Given
    const items = [
      { price: 100, quantity: 2 },
      { price: 200, quantity: 1 },
    ];

    // When
    const total = calculateTotal(items);

    // Then
    expect(total).toBe(400); // 100*2 + 200*1 = 400
  });

  it("空の配列で0を返す", () => {
    expect(calculateTotal([])).toBe(0);
  });
});

// Step 2: 最小限の実装
export function calculateTotal(
  items: Array<{ price: number; quantity: number }>
) {
  return items.reduce((sum, item) => sum + item.price * item.quantity, 0);
}

// Step 3: リファクタリング（仕様は変えない）
export function calculateTotal(
  items: Array<{ price: number; quantity: number }>
) {
  if (items.length === 0) return 0;

  return items
    .map((item) => item.price * item.quantity)
    .reduce((sum, subtotal) => sum + subtotal, 0);
}
```

#### SDD + BDD

```gherkin
# BDD (Behavior-Driven Development) との統合
#
# ビジネス価値に焦点を当てた仕様

Feature: ショッピングカート

  Rule: カートの合計金額は全商品の小計の合計である

    Example: 複数商品の合計
      Given カートに以下の商品が入っている:
        | 商品      | 単価 | 数量 |
        | りんご    | 100  | 2    |
        | バナナ    | 200  | 1    |
      When 合計金額を計算する
      Then 合計金額は 400円 である

    Example: 空のカート
      Given カートが空である
      When 合計金額を計算する
      Then 合計金額は 0円 である

  Rule: 税込価格は税抜価格の1.1倍である

    Example: 税込計算
      Given カートの税抜合計が 1000円 である
      When 税込金額を計算する
      Then 税込金額は 1100円 である
```

```typescript
// ステップ定義
import { defineFeature, loadFeature } from "jest-cucumber";

const feature = loadFeature("features/shopping-cart.feature");

defineFeature(feature, (test) => {
  let cart: ShoppingCart;

  test("複数商品の合計", ({ given, when, then }) => {
    given("カートに以下の商品が入っている:", (table) => {
      cart = new ShoppingCart();
      table.forEach((row) => {
        cart.addItem({
          name: row.商品,
          price: Number(row.単価),
          quantity: Number(row.数量),
        });
      });
    });

    when("合計金額を計算する", () => {
      // 計算は自動的に行われる
    });

    then(/合計金額は (\d+)円 である/, (amount) => {
      expect(cart.total).toBe(Number(amount));
    });
  });
});
```

#### SDD + DDD

```typescript
/**
 * DDD (Domain-Driven Design) との統合
 *
 * ドメインモデルの振る舞いを仕様として定義
 */

// ドメイン仕様
describe("Order (注文) ドメインモデル", () => {
  describe("ビジネスルール", () => {
    it("注文は最低1つの商品を含む必要がある", () => {
      expect(() => {
        new Order([]);
      }).toThrow("注文には最低1つの商品が必要です");
    });

    it("確定前の注文のみキャンセル可能", () => {
      const order = new Order([{ productId: "123", quantity: 1 }]);

      // 確定前はキャンセル可能
      expect(order.canCancel()).toBe(true);
      order.cancel();
      expect(order.status).toBe("cancelled");
    });

    it("発送後の注文はキャンセル不可", () => {
      const order = new Order([{ productId: "123", quantity: 1 }]);
      order.confirm();
      order.ship();

      // 発送後はキャンセル不可
      expect(order.canCancel()).toBe(false);
      expect(() => order.cancel()).toThrow(
        "発送済みの注文はキャンセルできません"
      );
    });
  });

  describe("不変条件 (Invariants)", () => {
    it("注文の合計金額は常に0以上", () => {
      const order = new Order([{ productId: "123", quantity: 2, price: 100 }]);

      expect(order.total).toBeGreaterThanOrEqual(0);
    });

    it("注文のステータス遷移は正しい順序", () => {
      const order = new Order([{ productId: "123", quantity: 1 }]);

      // pending → confirmed → shipped → delivered
      expect(order.status).toBe("pending");

      order.confirm();
      expect(order.status).toBe("confirmed");

      order.ship();
      expect(order.status).toBe("shipped");

      order.deliver();
      expect(order.status).toBe("delivered");

      // 逆方向の遷移は不可
      expect(() => order.ship()).toThrow(); // 既にdelivered
    });
  });

  describe("値オブジェクト", () => {
    it("Moneyは不変である", () => {
      const money = new Money(1000, "JPY");
      const added = money.add(new Money(500, "JPY"));

      // 元のオブジェクトは変更されない
      expect(money.amount).toBe(1000);
      expect(added.amount).toBe(1500);
    });

    it("異なる通貨は加算できない", () => {
      const jpy = new Money(1000, "JPY");
      const usd = new Money(10, "USD");

      expect(() => jpy.add(usd)).toThrow("異なる通貨は加算できません");
    });
  });
});
```

### 🏗️ 実践例: メモアプリの仕様駆動開発

#### プロジェクト構造

```
memo-app/
├── specs/                      # 仕様ドキュメント
│   ├── features/              # BDD仕様
│   │   ├── create-note.feature
│   │   ├── edit-note.feature
│   │   └── delete-note.feature
│   ├── api/                   # API仕様
│   │   └── openapi.yaml
│   └── data/                  # データ仕様
│       └── schemas.ts
├── tests/                     # テスト（実行可能な仕様）
│   ├── unit/
│   ├── integration/
│   └── e2e/
└── src/
    ├── domain/               # ドメインモデル
    ├── application/          # アプリケーションサービス
    └── infrastructure/       # インフラストラクチャ
```

#### Step 1: 機能仕様

```gherkin
# specs/features/create-note.feature
Feature: メモの作成

  ユーザーとして
  新しいメモを作成したい
  なぜなら、アイデアや情報を記録したいから

  Rule: メモにはタイトルと本文が必要

    Example: 有効なメモの作成
      Given ユーザー "user-123" がログインしている
      When 以下の内容でメモを作成する:
        | title         | content                    |
        | 買い物リスト  | 牛乳、パン、卵を買う        |
      Then メモが作成される
      And メモのタイトルは "買い物リスト" である
      And メモの本文は "牛乳、パン、卵を買う" である
      And 作成日時が記録される

    Example: タイトルが空でエラー
      Given ユーザー "user-123" がログインしている
      When 以下の内容でメモを作成する:
        | title | content      |
        |       | これは本文です |
      Then エラーメッセージ "タイトルを入力してください" が表示される

  Rule: メモは作成者に紐付く

    Example: 作成者の記録
      Given ユーザー "user-123" がログインしている
      When タイトル "テストメモ" でメモを作成する
      Then メモの作成者は "user-123" である
```

#### Step 2: データ仕様

```typescript
// specs/data/schemas.ts
import { z } from "zod";

/**
 * メモデータ仕様
 */
export const NoteSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  title: z
    .string()
    .min(1, "タイトルを入力してください")
    .max(200, "タイトルは200文字以内である必要があります"),
  content: z.string().max(10000, "本文は10000文字以内である必要があります"),
  createdAt: z.date(),
  updatedAt: z.date(),
  tags: z.array(z.string()).default([]),
});

export type Note = z.infer<typeof NoteSchema>;

/**
 * メモ作成リクエスト仕様
 */
export const CreateNoteRequestSchema = z.object({
  title: z.string().min(1).max(200),
  content: z.string().max(10000),
  tags: z.array(z.string()).optional(),
});

export type CreateNoteRequest = z.infer<typeof CreateNoteRequestSchema>;

/**
 * メモ更新リクエスト仕様
 */
export const UpdateNoteRequestSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  content: z.string().max(10000).optional(),
  tags: z.array(z.string()).optional(),
});

export type UpdateNoteRequest = z.infer<typeof UpdateNoteRequestSchema>;
```

#### Step 3: API 仕様

```yaml
# specs/api/openapi.yaml
openapi: 3.0.0
info:
  title: Memo App API
  version: 1.0.0

paths:
  /notes:
    get:
      summary: メモ一覧を取得
      parameters:
        - name: page
          in: query
          schema:
            type: integer
            default: 1
        - name: limit
          in: query
          schema:
            type: integer
            default: 20
      responses:
        "200":
          description: 成功
          content:
            application/json:
              schema:
                type: object
                properties:
                  notes:
                    type: array
                    items:
                      $ref: "#/components/schemas/Note"
                  total:
                    type: integer
                  page:
                    type: integer

    post:
      summary: メモを作成
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: "#/components/schemas/CreateNoteRequest"
      responses:
        "201":
          description: 作成成功
          content:
            application/json:
              schema:
                $ref: "#/components/schemas/Note"
        "400":
          description: バリデーションエラー

  /notes/{id}:
    get:
      summary: メモを取得
      parameters:
        - name: id
          in: path
          required: true
          schema:
            type: string
      responses:
        "200":
          description: 成功
          content:
            application/json:
              schema:
                $ref: "#/components/schemas/Note"
        "404":
          description: メモが見つからない

    put:
      summary: メモを更新
      parameters:
        - name: id
          in: path
          required: true
          schema:
            type: string
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: "#/components/schemas/UpdateNoteRequest"
      responses:
        "200":
          description: 更新成功
          content:
            application/json:
              schema:
                $ref: "#/components/schemas/Note"

    delete:
      summary: メモを削除
      parameters:
        - name: id
          in: path
          required: true
          schema:
            type: string
      responses:
        "204":
          description: 削除成功
        "404":
          description: メモが見つからない

components:
  schemas:
    Note:
      type: object
      properties:
        id:
          type: string
          format: uuid
        userId:
          type: string
          format: uuid
        title:
          type: string
        content:
          type: string
        tags:
          type: array
          items:
            type: string
        createdAt:
          type: string
          format: date-time
        updatedAt:
          type: string
          format: date-time

    CreateNoteRequest:
      type: object
      required:
        - title
        - content
      properties:
        title:
          type: string
          minLength: 1
          maxLength: 200
        content:
          type: string
          maxLength: 10000
        tags:
          type: array
          items:
            type: string

    UpdateNoteRequest:
      type: object
      properties:
        title:
          type: string
          minLength: 1
          maxLength: 200
        content:
          type: string
          maxLength: 10000
        tags:
          type: array
          items:
            type: string
```

#### Step 4: 実行可能な仕様（テスト）

```typescript
// tests/unit/note.spec.ts
import { describe, it, expect } from "vitest";
import { Note } from "@/domain/note";
import { CreateNoteRequestSchema } from "@/specs/data/schemas";

/**
 * メモドメインモデル仕様
 */
describe("Note", () => {
  describe("作成", () => {
    it("有効なデータでメモを作成できる", () => {
      const noteData = {
        userId: "123",
        title: "買い物リスト",
        content: "牛乳、パン、卵",
      };

      const note = Note.create(noteData);

      expect(note.id).toBeDefined();
      expect(note.userId).toBe("123");
      expect(note.title).toBe("買い物リスト");
      expect(note.content).toBe("牛乳、パン、卵");
      expect(note.createdAt).toBeInstanceOf(Date);
      expect(note.updatedAt).toBeInstanceOf(Date);
    });

    it("タイトルが空でエラー", () => {
      expect(() => {
        Note.create({
          userId: "123",
          title: "",
          content: "これは本文です",
        });
      }).toThrow("タイトルを入力してください");
    });

    it("タイトルが長すぎてエラー", () => {
      expect(() => {
        Note.create({
          userId: "123",
          title: "a".repeat(201),
          content: "本文",
        });
      }).toThrow("タイトルは200文字以内である必要があります");
    });
  });

  describe("更新", () => {
    it("タイトルを更新できる", () => {
      const note = Note.create({
        userId: "123",
        title: "古いタイトル",
        content: "本文",
      });

      const oldUpdatedAt = note.updatedAt;

      // 時間を進める
      jest.advanceTimersByTime(1000);

      note.updateTitle("新しいタイトル");

      expect(note.title).toBe("新しいタイトル");
      expect(note.updatedAt).not.toEqual(oldUpdatedAt);
    });

    it("本文を更新できる", () => {
      const note = Note.create({
        userId: "123",
        title: "タイトル",
        content: "古い本文",
      });

      note.updateContent("新しい本文");

      expect(note.content).toBe("新しい本文");
    });
  });

  describe("タグ", () => {
    it("タグを追加できる", () => {
      const note = Note.create({
        userId: "123",
        title: "タイトル",
        content: "本文",
      });

      note.addTag("仕事");
      note.addTag("重要");

      expect(note.tags).toContain("仕事");
      expect(note.tags).toContain("重要");
    });

    it("重複するタグは追加されない", () => {
      const note = Note.create({
        userId: "123",
        title: "タイトル",
        content: "本文",
      });

      note.addTag("仕事");
      note.addTag("仕事");

      expect(note.tags.filter((t) => t === "仕事")).toHaveLength(1);
    });

    it("タグを削除できる", () => {
      const note = Note.create({
        userId: "123",
        title: "タイトル",
        content: "本文",
        tags: ["仕事", "重要"],
      });

      note.removeTag("仕事");

      expect(note.tags).not.toContain("仕事");
      expect(note.tags).toContain("重要");
    });
  });
});
```

#### Step 5: 実装

```typescript
// src/domain/note.ts
import { v4 as uuid } from "uuid";
import { NoteSchema, CreateNoteRequestSchema } from "@/specs/data/schemas";

export class Note {
  private constructor(
    public readonly id: string,
    public readonly userId: string,
    private _title: string,
    private _content: string,
    private _tags: string[],
    public readonly createdAt: Date,
    private _updatedAt: Date
  ) {}

  static create(data: {
    userId: string;
    title: string;
    content: string;
    tags?: string[];
  }): Note {
    // 仕様に基づいてバリデーション
    const validated = CreateNoteRequestSchema.parse({
      title: data.title,
      content: data.content,
      tags: data.tags,
    });

    const now = new Date();
    return new Note(
      uuid(),
      data.userId,
      validated.title,
      validated.content,
      validated.tags || [],
      now,
      now
    );
  }

  get title(): string {
    return this._title;
  }

  get content(): string {
    return this._content;
  }

  get tags(): string[] {
    return [...this._tags];
  }

  get updatedAt(): Date {
    return this._updatedAt;
  }

  updateTitle(title: string): void {
    if (title.length === 0 || title.length > 200) {
      throw new Error("タイトルは1-200文字である必要があります");
    }
    this._title = title;
    this._updatedAt = new Date();
  }

  updateContent(content: string): void {
    if (content.length > 10000) {
      throw new Error("本文は10000文字以内である必要があります");
    }
    this._content = content;
    this._updatedAt = new Date();
  }

  addTag(tag: string): void {
    if (!this._tags.includes(tag)) {
      this._tags.push(tag);
      this._updatedAt = new Date();
    }
  }

  removeTag(tag: string): void {
    const index = this._tags.indexOf(tag);
    if (index > -1) {
      this._tags.splice(index, 1);
      this._updatedAt = new Date();
    }
  }

  toJSON() {
    return {
      id: this.id,
      userId: this.userId,
      title: this._title,
      content: this._content,
      tags: this._tags,
      createdAt: this.createdAt,
      updatedAt: this._updatedAt,
    };
  }
}
```

### 📈 仕様の測定と改善

#### 仕様カバレッジ

```typescript
// 仕様のカバレッジを測定
describe("仕様カバレッジ", () => {
  it("全てのビジネスルールがテストされている", () => {
    // ビジネスルール一覧
    const businessRules = [
      "メモにはタイトルが必要",
      "メモには本文が必要",
      "タイトルは200文字以内",
      "本文は10000文字以内",
      "メモは作成者に紐付く",
      "タグは重複しない",
    ];

    // テストされているルール
    const testedRules = getTestedRules(); // 実装は省略

    // 全てのルールがテストされているか確認
    businessRules.forEach((rule) => {
      expect(testedRules).toContain(rule);
    });
  });
});
```

#### 仕様の品質メトリクス

```typescript
// 仕様の品質を測定
interface SpecificationMetrics {
  totalSpecs: number;
  passRate: number;
  coverage: number;
  avgExecutionTime: number;
  flakiness: number; // 不安定なテストの割合
}

function calculateSpecMetrics(): SpecificationMetrics {
  // 実装...
  return {
    totalSpecs: 150,
    passRate: 0.98, // 98%が成功
    coverage: 0.85, // 85%のコードがカバーされている
    avgExecutionTime: 1200, // 平均1.2秒
    flakiness: 0.02, // 2%が不安定
  };
}
```

### 🎓 まとめ

#### SDD の利点

✅ **早期の問題発見**: 実装前に仕様の問題を発見
✅ **コミュニケーション改善**: 仕様が共通言語になる
✅ **ドキュメントの自動化**: テストが仕様ドキュメントになる
✅ **回帰防止**: 仕様が回帰テストとして機能
✅ **リファクタリングの安全性**: 仕様を満たす限り自由に変更可能

#### SDD の課題

❌ **学習コスト**: チーム全体が仕様の書き方を学ぶ必要がある
❌ **初期コスト**: 仕様作成に時間がかかる
❌ **メンテナンス**: 仕様とコードの同期を維持する必要がある
❌ **過剰な仕様**: 細かすぎる仕様は柔軟性を失う

#### 成功のポイント

1. **段階的な導入**: 重要な機能から始める
2. **適切な粒度**: 大きすぎず小さすぎない仕様
3. **継続的な改善**: 仕様も進化させる
4. **ツールの活用**: 自動化ツールを活用
5. **チームの合意**: 仕様の価値をチーム全体で共有

### 📚 参考リンク

#### 公式ドキュメント・ツール

- **Cucumber**: https://cucumber.io/
- **Jest**: https://jestjs.io/
- **Vitest**: https://vitest.dev/
- **Zod**: https://zod.dev/
- **OpenAPI**: https://www.openapis.org/
- **Pact**: https://pact.io/

#### 書籍・記事

- "Specification by Example" by Gojko Adzic
- "BDD in Action" by John Ferguson Smart
- "Test Driven Development: By Example" by Kent Beck

#### コミュニティ

- BDD Community: https://bddcommunity.slack.com
- Cucumber Community: https://community.smartbear.com/

---

**最終更新**: 2025 年 11 月 22 日

**次のステップ**: 実際のプロジェクトで SDD を試してみましょう！
