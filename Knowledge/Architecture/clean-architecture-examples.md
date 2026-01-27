# Clean Architecture サンプル集

## ディレクトリ構成

```
src/
├── domain/                 # Enterprise Business Rules
│   ├── entities/
│   │   ├── User.ts
│   │   └── Post.ts
│   └── repositories/       # インターフェース
│       ├── UserRepository.ts
│       └── PostRepository.ts
│
├── application/            # Application Business Rules
│   ├── use-cases/
│   │   ├── user/
│   │   │   ├── CreateUser.ts
│   │   │   ├── GetUser.ts
│   │   │   └── UpdateUser.ts
│   │   └── post/
│   │       └── CreatePost.ts
│   └── services/           # サービスインターフェース
│       └── HashService.ts
│
├── infrastructure/         # Frameworks & Drivers
│   ├── repositories/
│   │   ├── PrismaUserRepository.ts
│   │   └── PrismaPostRepository.ts
│   ├── services/
│   │   └── BcryptHashService.ts
│   └── database/
│       └── prisma.ts
│
└── presentation/           # Interface Adapters
    ├── controllers/
    │   ├── UserController.ts
    │   └── PostController.ts
    └── dto/
        ├── CreateUserDto.ts
        └── UserResponse.ts
```

## Entity

```typescript
// domain/entities/User.ts
export class User {
  constructor(
    public readonly id: string,
    public readonly email: string,
    private _name: string,
    public readonly createdAt: Date,
  ) {
    this.validateEmail(email);
  }

  get name(): string {
    return this._name;
  }

  changeName(newName: string): void {
    if (newName.length < 1) {
      throw new Error("Name is required");
    }
    if (newName.length > 100) {
      throw new Error("Name is too long");
    }
    this._name = newName;
  }

  private validateEmail(email: string): void {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      throw new Error("Invalid email format");
    }
  }

  toJSON() {
    return {
      id: this.id,
      email: this.email,
      name: this.name,
      createdAt: this.createdAt,
    };
  }
}
```

## Repository Interface

```typescript
// domain/repositories/UserRepository.ts
import { User } from "../entities/User";

export interface UserRepository {
  findById(id: string): Promise<User | null>;
  findByEmail(email: string): Promise<User | null>;
  findAll(options?: { page?: number; limit?: number }): Promise<User[]>;
  save(user: User, hashedPassword: string): Promise<void>;
  update(user: User): Promise<void>;
  delete(id: string): Promise<void>;
}
```

## Use Case

```typescript
// application/use-cases/user/CreateUser.ts
import { User } from "@/domain/entities/User";
import { UserRepository } from "@/domain/repositories/UserRepository";
import { HashService } from "@/application/services/HashService";

export interface CreateUserInput {
  email: string;
  password: string;
  name: string;
}

export interface CreateUserOutput {
  id: string;
  email: string;
  name: string;
}

export class CreateUserUseCase {
  constructor(
    private userRepository: UserRepository,
    private hashService: HashService,
  ) {}

  async execute(input: CreateUserInput): Promise<CreateUserOutput> {
    // 1. ビジネスルールの検証
    const existingUser = await this.userRepository.findByEmail(input.email);
    if (existingUser) {
      throw new UserAlreadyExistsError(input.email);
    }

    // 2. エンティティの作成
    const user = new User(generateId(), input.email, input.name, new Date());

    // 3. パスワードのハッシュ化
    const hashedPassword = await this.hashService.hash(input.password);

    // 4. 永続化
    await this.userRepository.save(user, hashedPassword);

    // 5. 出力の変換
    return {
      id: user.id,
      email: user.email,
      name: user.name,
    };
  }
}

// カスタムエラー
export class UserAlreadyExistsError extends Error {
  constructor(email: string) {
    super(`User with email ${email} already exists`);
    this.name = "UserAlreadyExistsError";
  }
}
```

## Infrastructure (Repository 実装)

```typescript
// infrastructure/repositories/PrismaUserRepository.ts
import { PrismaClient } from "@prisma/client";
import { User } from "@/domain/entities/User";
import { UserRepository } from "@/domain/repositories/UserRepository";

export class PrismaUserRepository implements UserRepository {
  constructor(private prisma: PrismaClient) {}

  async findById(id: string): Promise<User | null> {
    const data = await this.prisma.user.findUnique({ where: { id } });
    return data ? this.toDomain(data) : null;
  }

  async findByEmail(email: string): Promise<User | null> {
    const data = await this.prisma.user.findUnique({ where: { email } });
    return data ? this.toDomain(data) : null;
  }

  async findAll(options?: { page?: number; limit?: number }): Promise<User[]> {
    const page = options?.page ?? 1;
    const limit = options?.limit ?? 20;

    const data = await this.prisma.user.findMany({
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: "desc" },
    });

    return data.map(this.toDomain);
  }

  async save(user: User, hashedPassword: string): Promise<void> {
    await this.prisma.user.create({
      data: {
        id: user.id,
        email: user.email,
        name: user.name,
        password: hashedPassword,
        createdAt: user.createdAt,
      },
    });
  }

  async update(user: User): Promise<void> {
    await this.prisma.user.update({
      where: { id: user.id },
      data: { name: user.name },
    });
  }

  async delete(id: string): Promise<void> {
    await this.prisma.user.delete({ where: { id } });
  }

  private toDomain(data: any): User {
    return new User(data.id, data.email, data.name, data.createdAt);
  }
}
```

## Service 実装

```typescript
// application/services/HashService.ts
export interface HashService {
  hash(password: string): Promise<string>;
  compare(password: string, hash: string): Promise<boolean>;
}

// infrastructure/services/BcryptHashService.ts
import bcrypt from "bcrypt";
import { HashService } from "@/application/services/HashService";

export class BcryptHashService implements HashService {
  private readonly saltRounds = 12;

  async hash(password: string): Promise<string> {
    return bcrypt.hash(password, this.saltRounds);
  }

  async compare(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }
}
```

## DI Container

```typescript
// infrastructure/container.ts
import { PrismaClient } from "@prisma/client";
import { PrismaUserRepository } from "./repositories/PrismaUserRepository";
import { BcryptHashService } from "./services/BcryptHashService";
import { CreateUserUseCase } from "@/application/use-cases/user/CreateUser";

const prisma = new PrismaClient();

// Repositories
const userRepository = new PrismaUserRepository(prisma);

// Services
const hashService = new BcryptHashService();

// Use Cases
export const createUserUseCase = new CreateUserUseCase(
  userRepository,
  hashService,
);

// Export for testing
export { userRepository, hashService };
```

## Controller (Next.js Route Handler)

```typescript
// app/api/users/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createUserUseCase } from "@/infrastructure/container";
import { UserAlreadyExistsError } from "@/application/use-cases/user/CreateUser";
import { z } from "zod";

const createUserSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().min(1),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const input = createUserSchema.parse(body);

    const result = await createUserUseCase.execute(input);

    return NextResponse.json({ data: result }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: { code: "VALIDATION_ERROR", details: error.errors } },
        { status: 400 },
      );
    }
    if (error instanceof UserAlreadyExistsError) {
      return NextResponse.json(
        { error: { code: "USER_EXISTS", message: error.message } },
        { status: 409 },
      );
    }
    throw error;
  }
}
```

## テスト

```typescript
// __tests__/use-cases/CreateUser.test.ts
import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  CreateUserUseCase,
  UserAlreadyExistsError,
} from "@/application/use-cases/user/CreateUser";

describe("CreateUserUseCase", () => {
  const mockUserRepository = {
    findByEmail: vi.fn(),
    save: vi.fn(),
  };

  const mockHashService = {
    hash: vi.fn(),
  };

  const useCase = new CreateUserUseCase(
    mockUserRepository as any,
    mockHashService as any,
  );

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("creates a new user", async () => {
    mockUserRepository.findByEmail.mockResolvedValue(null);
    mockHashService.hash.mockResolvedValue("hashed");

    const result = await useCase.execute({
      email: "test@example.com",
      password: "password123",
      name: "Test User",
    });

    expect(result.email).toBe("test@example.com");
    expect(mockUserRepository.save).toHaveBeenCalled();
  });

  it("throws error if user exists", async () => {
    mockUserRepository.findByEmail.mockResolvedValue({ id: "1" });

    await expect(
      useCase.execute({
        email: "existing@example.com",
        password: "password123",
        name: "Test",
      }),
    ).rejects.toThrow(UserAlreadyExistsError);
  });
});
```
