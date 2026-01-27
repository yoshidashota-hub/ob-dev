# 第7章: テスト戦略

## テストピラミッド

```
┌─────────────────────────────────────────────────────┐
│                Test Pyramid                          │
│                                                     │
│                    /\                               │
│                   /  \      E2E Tests               │
│                  /    \     (少数)                   │
│                 /──────\                            │
│                /        \   Integration Tests       │
│               /          \  (中程度)                 │
│              /────────────\                         │
│             /              \                        │
│            /                \ Unit Tests            │
│           /                  \ (多数)               │
│          /────────────────────\                     │
│                                                     │
└─────────────────────────────────────────────────────┘
```

## ユニットテスト

### エンティティのテスト

```typescript
// __tests__/domain/entities/User.test.ts
import { User, UserStatus } from "@/domain/entities/User";
import { Email } from "@/domain/value-objects/Email";
import { UserId } from "@/domain/value-objects/UserId";

describe("User", () => {
  const validProps = {
    id: UserId.generate(),
    email: Email.create("test@example.com"),
    name: "Test User",
    password: "hashed_password",
  };

  describe("create", () => {
    it("should create a user with active status", () => {
      const user = User.create(validProps);

      expect(user.isActive).toBe(true);
      expect(user.status).toBe(UserStatus.Active);
    });

    it("should have a creation timestamp", () => {
      const before = new Date();
      const user = User.create(validProps);
      const after = new Date();

      expect(user.createdAt.getTime()).toBeGreaterThanOrEqual(before.getTime());
      expect(user.createdAt.getTime()).toBeLessThanOrEqual(after.getTime());
    });
  });

  describe("changeName", () => {
    it("should change the name", () => {
      const user = User.create(validProps);

      user.changeName("New Name");

      expect(user.name).toBe("New Name");
    });

    it("should throw error for empty name", () => {
      const user = User.create(validProps);

      expect(() => user.changeName("")).toThrow();
    });

    it("should throw error for name exceeding max length", () => {
      const user = User.create(validProps);
      const longName = "a".repeat(101);

      expect(() => user.changeName(longName)).toThrow();
    });
  });

  describe("deactivate", () => {
    it("should deactivate an active user", () => {
      const user = User.create(validProps);

      user.deactivate();

      expect(user.isActive).toBe(false);
      expect(user.status).toBe(UserStatus.Deactivated);
    });

    it("should throw error when already deactivated", () => {
      const user = User.create(validProps);
      user.deactivate();

      expect(() => user.deactivate()).toThrow();
    });
  });
});
```

### 値オブジェクトのテスト

```typescript
// __tests__/domain/value-objects/Email.test.ts
import { Email } from "@/domain/value-objects/Email";

describe("Email", () => {
  describe("create", () => {
    it("should create a valid email", () => {
      const email = Email.create("test@example.com");

      expect(email.getValue()).toBe("test@example.com");
    });

    it("should normalize email to lowercase", () => {
      const email = Email.create("TEST@EXAMPLE.COM");

      expect(email.getValue()).toBe("test@example.com");
    });

    it("should throw error for invalid email", () => {
      expect(() => Email.create("invalid")).toThrow();
      expect(() => Email.create("")).toThrow();
      expect(() => Email.create("@example.com")).toThrow();
    });
  });

  describe("equals", () => {
    it("should return true for same email", () => {
      const email1 = Email.create("test@example.com");
      const email2 = Email.create("test@example.com");

      expect(email1.equals(email2)).toBe(true);
    });

    it("should return false for different email", () => {
      const email1 = Email.create("test1@example.com");
      const email2 = Email.create("test2@example.com");

      expect(email1.equals(email2)).toBe(false);
    });
  });
});
```

### ユースケースのテスト

```typescript
// __tests__/application/use-cases/CreateUser.test.ts
import { CreateUserUseCase } from "@/application/use-cases/CreateUser";
import { UserRepository } from "@/application/ports/output/UserRepository";
import { PasswordHasher } from "@/application/ports/output/PasswordHasher";
import { EventPublisher } from "@/application/ports/output/EventPublisher";

describe("CreateUserUseCase", () => {
  let useCase: CreateUserUseCase;
  let mockUserRepository: jest.Mocked<UserRepository>;
  let mockPasswordHasher: jest.Mocked<PasswordHasher>;
  let mockEventPublisher: jest.Mocked<EventPublisher>;

  beforeEach(() => {
    mockUserRepository = {
      findById: jest.fn(),
      findByEmail: jest.fn(),
      save: jest.fn(),
      delete: jest.fn(),
    };

    mockPasswordHasher = {
      hash: jest.fn(),
      verify: jest.fn(),
    };

    mockEventPublisher = {
      publish: jest.fn(),
    };

    useCase = new CreateUserUseCase(
      mockUserRepository,
      mockPasswordHasher,
      mockEventPublisher,
    );
  });

  describe("execute", () => {
    const input = {
      email: "test@example.com",
      name: "Test User",
      password: "password123",
    };

    it("should create a user successfully", async () => {
      mockUserRepository.findByEmail.mockResolvedValue(null);
      mockPasswordHasher.hash.mockResolvedValue("hashed_password");

      const result = await useCase.execute(input);

      expect(result.email).toBe(input.email);
      expect(result.name).toBe(input.name);
      expect(mockUserRepository.save).toHaveBeenCalled();
      expect(mockEventPublisher.publish).toHaveBeenCalled();
    });

    it("should throw error if user already exists", async () => {
      const existingUser = User.create({
        id: UserId.generate(),
        email: Email.create(input.email),
        name: "Existing User",
        password: "hash",
      });
      mockUserRepository.findByEmail.mockResolvedValue(existingUser);

      await expect(useCase.execute(input)).rejects.toThrow(
        UserAlreadyExistsError,
      );
      expect(mockUserRepository.save).not.toHaveBeenCalled();
    });

    it("should hash the password", async () => {
      mockUserRepository.findByEmail.mockResolvedValue(null);
      mockPasswordHasher.hash.mockResolvedValue("hashed_password");

      await useCase.execute(input);

      expect(mockPasswordHasher.hash).toHaveBeenCalledWith(input.password);
    });
  });
});
```

## インテグレーションテスト

### リポジトリのテスト

```typescript
// __tests__/adapters/gateways/PrismaUserRepository.test.ts
import { PrismaClient } from "@prisma/client";
import { PrismaUserRepository } from "@/adapters/gateways/PrismaUserRepository";
import { User } from "@/domain/entities/User";
import { Email } from "@/domain/value-objects/Email";
import { UserId } from "@/domain/value-objects/UserId";

describe("PrismaUserRepository", () => {
  let prisma: PrismaClient;
  let repository: PrismaUserRepository;

  beforeAll(() => {
    prisma = new PrismaClient();
    repository = new PrismaUserRepository(prisma);
  });

  beforeEach(async () => {
    await prisma.user.deleteMany();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  describe("save and findById", () => {
    it("should save and retrieve a user", async () => {
      const user = User.create({
        id: UserId.generate(),
        email: Email.create("test@example.com"),
        name: "Test User",
        password: "hashed_password",
      });

      await repository.save(user);

      const found = await repository.findById(user.id);

      expect(found).not.toBeNull();
      expect(found!.id.value).toBe(user.id.value);
      expect(found!.email.value).toBe(user.email.value);
    });
  });

  describe("findByEmail", () => {
    it("should find user by email", async () => {
      const user = User.create({
        id: UserId.generate(),
        email: Email.create("test@example.com"),
        name: "Test User",
        password: "hashed_password",
      });
      await repository.save(user);

      const found = await repository.findByEmail(user.email);

      expect(found).not.toBeNull();
      expect(found!.email.equals(user.email)).toBe(true);
    });

    it("should return null for non-existent email", async () => {
      const email = Email.create("nonexistent@example.com");

      const found = await repository.findByEmail(email);

      expect(found).toBeNull();
    });
  });
});
```

### API テスト

```typescript
// __tests__/api/users.test.ts
import { createServer } from "@/infrastructure/server";

describe("Users API", () => {
  let server: any;

  beforeAll(async () => {
    server = await createServer();
  });

  beforeEach(async () => {
    await server.prisma.user.deleteMany();
  });

  afterAll(async () => {
    await server.close();
  });

  describe("POST /api/users", () => {
    it("should create a user", async () => {
      const response = await server.inject({
        method: "POST",
        url: "/api/users",
        payload: {
          email: "test@example.com",
          name: "Test User",
          password: "password123",
        },
      });

      expect(response.statusCode).toBe(201);
      const body = JSON.parse(response.body);
      expect(body.email).toBe("test@example.com");
    });

    it("should return 409 for duplicate email", async () => {
      // 最初のユーザーを作成
      await server.inject({
        method: "POST",
        url: "/api/users",
        payload: {
          email: "test@example.com",
          name: "Test User",
          password: "password123",
        },
      });

      // 同じメールで再度作成
      const response = await server.inject({
        method: "POST",
        url: "/api/users",
        payload: {
          email: "test@example.com",
          name: "Another User",
          password: "password456",
        },
      });

      expect(response.statusCode).toBe(409);
    });
  });

  describe("GET /api/users/:id", () => {
    it("should return a user", async () => {
      // ユーザーを作成
      const createResponse = await server.inject({
        method: "POST",
        url: "/api/users",
        payload: {
          email: "test@example.com",
          name: "Test User",
          password: "password123",
        },
      });
      const { id } = JSON.parse(createResponse.body);

      // ユーザーを取得
      const response = await server.inject({
        method: "GET",
        url: `/api/users/${id}`,
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.id).toBe(id);
    });

    it("should return 404 for non-existent user", async () => {
      const response = await server.inject({
        method: "GET",
        url: "/api/users/non-existent-id",
      });

      expect(response.statusCode).toBe(404);
    });
  });
});
```

## E2E テスト

```typescript
// e2e/user-flow.test.ts
import { test, expect } from "@playwright/test";

test.describe("User Registration Flow", () => {
  test("should register a new user", async ({ page }) => {
    await page.goto("/register");

    await page.fill('[name="email"]', "newuser@example.com");
    await page.fill('[name="name"]', "New User");
    await page.fill('[name="password"]', "password123");
    await page.click('button[type="submit"]');

    await expect(page).toHaveURL("/dashboard");
    await expect(page.locator("h1")).toContainText("Welcome, New User");
  });

  test("should show error for existing email", async ({ page }) => {
    // 既存ユーザーを作成（API経由）
    await page.request.post("/api/users", {
      data: {
        email: "existing@example.com",
        name: "Existing User",
        password: "password123",
      },
    });

    await page.goto("/register");

    await page.fill('[name="email"]', "existing@example.com");
    await page.fill('[name="name"]', "Another User");
    await page.fill('[name="password"]', "password123");
    await page.click('button[type="submit"]');

    await expect(page.locator(".error")).toContainText(
      "Email already registered",
    );
  });
});
```

## テストダブル

### Fake

```typescript
// __tests__/fakes/FakeUserRepository.ts
export class FakeUserRepository implements UserRepository {
  private users: Map<string, User> = new Map();

  async findById(id: UserId): Promise<User | null> {
    return this.users.get(id.value) || null;
  }

  async findByEmail(email: Email): Promise<User | null> {
    for (const user of this.users.values()) {
      if (user.email.equals(email)) {
        return user;
      }
    }
    return null;
  }

  async save(user: User): Promise<void> {
    this.users.set(user.id.value, user);
  }

  async delete(id: UserId): Promise<void> {
    this.users.delete(id.value);
  }

  // テストヘルパー
  clear(): void {
    this.users.clear();
  }
}
```

## 次のステップ

次章では、実装パターンについて詳しく学びます。
