# 第11章: テスト

## テストの種類

```
┌─────────────────────────────────────────────────────┐
│                 Testing Pyramid                      │
│                                                     │
│                    ┌───────┐                        │
│                   /   E2E   \                       │
│                  /───────────\                      │
│                 /  Integration \                    │
│                /─────────────────\                  │
│               /       Unit        \                 │
│              /─────────────────────\                │
│                                                     │
│  Unit: 個々のクラス・メソッドのテスト               │
│  Integration: モジュール間の連携テスト              │
│  E2E: API エンドポイントの統合テスト                │
└─────────────────────────────────────────────────────┘
```

## セットアップ

```bash
# NestJS プロジェクトにはデフォルトで Jest が含まれる
npm run test          # ユニットテスト
npm run test:watch    # ウォッチモード
npm run test:cov      # カバレッジ付き
npm run test:e2e      # E2Eテスト
```

## Unit テスト

### Service のテスト

```typescript
// users/users.service.spec.ts
import { Test, TestingModule } from "@nestjs/testing";
import { UsersService } from "./users.service";
import { getRepositoryToken } from "@nestjs/typeorm";
import { User } from "./entities/user.entity";
import { Repository } from "typeorm";
import { NotFoundException } from "@nestjs/common";

describe("UsersService", () => {
  let service: UsersService;
  let repository: Repository<User>;

  const mockUser = {
    id: "1",
    email: "test@example.com",
    name: "Test User",
    password: "hashedPassword",
  };

  const mockRepository = {
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: getRepositoryToken(User),
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    repository = module.get<Repository<User>>(getRepositoryToken(User));

    // Reset mocks
    jest.clearAllMocks();
  });

  describe("findAll", () => {
    it("should return an array of users", async () => {
      const users = [mockUser];
      mockRepository.find.mockResolvedValue(users);

      const result = await service.findAll();

      expect(result).toEqual(users);
      expect(mockRepository.find).toHaveBeenCalled();
    });
  });

  describe("findOne", () => {
    it("should return a user", async () => {
      mockRepository.findOne.mockResolvedValue(mockUser);

      const result = await service.findOne("1");

      expect(result).toEqual(mockUser);
      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { id: "1" },
      });
    });

    it("should throw NotFoundException if user not found", async () => {
      mockRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne("999")).rejects.toThrow(NotFoundException);
    });
  });

  describe("create", () => {
    it("should create a user", async () => {
      const createDto = { email: "new@example.com", name: "New User", password: "pass" };
      mockRepository.create.mockReturnValue({ ...createDto, id: "2" });
      mockRepository.save.mockResolvedValue({ ...createDto, id: "2" });

      const result = await service.create(createDto);

      expect(result).toHaveProperty("id");
      expect(mockRepository.create).toHaveBeenCalledWith(createDto);
      expect(mockRepository.save).toHaveBeenCalled();
    });
  });

  describe("update", () => {
    it("should update a user", async () => {
      const updateDto = { name: "Updated Name" };
      mockRepository.update.mockResolvedValue({ affected: 1 });
      mockRepository.findOne.mockResolvedValue({ ...mockUser, ...updateDto });

      const result = await service.update("1", updateDto);

      expect(result.name).toBe("Updated Name");
    });
  });

  describe("remove", () => {
    it("should remove a user", async () => {
      mockRepository.delete.mockResolvedValue({ affected: 1 });

      await service.remove("1");

      expect(mockRepository.delete).toHaveBeenCalledWith("1");
    });

    it("should throw NotFoundException if user not found", async () => {
      mockRepository.delete.mockResolvedValue({ affected: 0 });

      await expect(service.remove("999")).rejects.toThrow(NotFoundException);
    });
  });
});
```

### Controller のテスト

```typescript
// users/users.controller.spec.ts
import { Test, TestingModule } from "@nestjs/testing";
import { UsersController } from "./users.controller";
import { UsersService } from "./users.service";

describe("UsersController", () => {
  let controller: UsersController;
  let service: UsersService;

  const mockUser = {
    id: "1",
    email: "test@example.com",
    name: "Test User",
  };

  const mockUsersService = {
    findAll: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [
        {
          provide: UsersService,
          useValue: mockUsersService,
        },
      ],
    }).compile();

    controller = module.get<UsersController>(UsersController);
    service = module.get<UsersService>(UsersService);
  });

  describe("findAll", () => {
    it("should return an array of users", async () => {
      mockUsersService.findAll.mockResolvedValue([mockUser]);

      const result = await controller.findAll();

      expect(result).toEqual([mockUser]);
      expect(service.findAll).toHaveBeenCalled();
    });
  });

  describe("findOne", () => {
    it("should return a user", async () => {
      mockUsersService.findOne.mockResolvedValue(mockUser);

      const result = await controller.findOne("1");

      expect(result).toEqual(mockUser);
      expect(service.findOne).toHaveBeenCalledWith("1");
    });
  });

  describe("create", () => {
    it("should create a user", async () => {
      const createDto = { email: "new@example.com", name: "New", password: "pass" };
      mockUsersService.create.mockResolvedValue({ ...createDto, id: "2" });

      const result = await controller.create(createDto);

      expect(result).toHaveProperty("id");
      expect(service.create).toHaveBeenCalledWith(createDto);
    });
  });
});
```

### Guard のテスト

```typescript
// auth/guards/roles.guard.spec.ts
import { RolesGuard } from "./roles.guard";
import { Reflector } from "@nestjs/core";
import { ExecutionContext } from "@nestjs/common";

describe("RolesGuard", () => {
  let guard: RolesGuard;
  let reflector: Reflector;

  beforeEach(() => {
    reflector = new Reflector();
    guard = new RolesGuard(reflector);
  });

  const mockExecutionContext = (user: any, roles?: string[]): ExecutionContext => ({
    switchToHttp: () => ({
      getRequest: () => ({ user }),
    }),
    getHandler: () => jest.fn(),
    getClass: () => jest.fn(),
  } as unknown as ExecutionContext);

  it("should allow if no roles required", () => {
    jest.spyOn(reflector, "getAllAndOverride").mockReturnValue(undefined);

    const context = mockExecutionContext({ role: "user" });
    expect(guard.canActivate(context)).toBe(true);
  });

  it("should allow if user has required role", () => {
    jest.spyOn(reflector, "getAllAndOverride").mockReturnValue(["admin"]);

    const context = mockExecutionContext({ role: "admin" });
    expect(guard.canActivate(context)).toBe(true);
  });

  it("should deny if user does not have required role", () => {
    jest.spyOn(reflector, "getAllAndOverride").mockReturnValue(["admin"]);

    const context = mockExecutionContext({ role: "user" });
    expect(guard.canActivate(context)).toBe(false);
  });
});
```

## E2E テスト

```typescript
// test/users.e2e-spec.ts
import { Test, TestingModule } from "@nestjs/testing";
import { INestApplication, ValidationPipe } from "@nestjs/common";
import * as request from "supertest";
import { AppModule } from "../src/app.module";

describe("UsersController (e2e)", () => {
  let app: INestApplication;
  let accessToken: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe());
    await app.init();

    // ログインしてトークン取得
    const loginResponse = await request(app.getHttpServer())
      .post("/auth/login")
      .send({ email: "test@example.com", password: "password" });

    accessToken = loginResponse.body.access_token;
  });

  afterAll(async () => {
    await app.close();
  });

  describe("/users (GET)", () => {
    it("should return users array", () => {
      return request(app.getHttpServer())
        .get("/users")
        .set("Authorization", `Bearer ${accessToken}`)
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
        });
    });

    it("should return 401 without token", () => {
      return request(app.getHttpServer())
        .get("/users")
        .expect(401);
    });
  });

  describe("/users (POST)", () => {
    it("should create a user", () => {
      return request(app.getHttpServer())
        .post("/users")
        .set("Authorization", `Bearer ${accessToken}`)
        .send({
          email: "newuser@example.com",
          name: "New User",
          password: "password123",
        })
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty("id");
          expect(res.body.email).toBe("newuser@example.com");
        });
    });

    it("should return 400 for invalid data", () => {
      return request(app.getHttpServer())
        .post("/users")
        .set("Authorization", `Bearer ${accessToken}`)
        .send({ email: "invalid-email" })
        .expect(400);
    });
  });

  describe("/users/:id (GET)", () => {
    it("should return a user by id", () => {
      return request(app.getHttpServer())
        .get("/users/1")
        .set("Authorization", `Bearer ${accessToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty("id", "1");
        });
    });

    it("should return 404 for non-existent user", () => {
      return request(app.getHttpServer())
        .get("/users/non-existent-id")
        .set("Authorization", `Bearer ${accessToken}`)
        .expect(404);
    });
  });
});
```

## テスト用データベース

```typescript
// test/setup.ts
import { Test, TestingModule } from "@nestjs/testing";
import { TypeOrmModule } from "@nestjs/typeorm";
import { ConfigModule } from "@nestjs/config";

export const createTestingModule = async (imports: any[]) => {
  return Test.createTestingModule({
    imports: [
      ConfigModule.forRoot({ envFilePath: ".env.test" }),
      TypeOrmModule.forRoot({
        type: "sqlite",
        database: ":memory:",
        entities: [__dirname + "/../src/**/*.entity{.ts,.js}"],
        synchronize: true,
      }),
      ...imports,
    ],
  }).compile();
};
```

## モックファクトリ

```typescript
// test/mocks/user.mock.ts
import { User } from "../../src/users/entities/user.entity";

export const mockUser = (overrides?: Partial<User>): User => ({
  id: "test-id",
  email: "test@example.com",
  name: "Test User",
  password: "hashedPassword",
  role: "user",
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

export const mockUsers = (count: number): User[] =>
  Array.from({ length: count }, (_, i) =>
    mockUser({ id: `id-${i}`, email: `user${i}@example.com` }),
  );
```

## カバレッジ設定

```javascript
// jest.config.js
module.exports = {
  moduleFileExtensions: ["js", "json", "ts"],
  rootDir: "src",
  testRegex: ".*\\.spec\\.ts$",
  transform: {
    "^.+\\.(t|j)s$": "ts-jest",
  },
  collectCoverageFrom: ["**/*.(t|j)s"],
  coverageDirectory: "../coverage",
  testEnvironment: "node",
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },
};
```

## 次のステップ

次章では、ベストプラクティスについて詳しく学びます。
