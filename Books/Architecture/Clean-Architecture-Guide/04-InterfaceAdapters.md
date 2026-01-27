# 第4章: インターフェースアダプター

## インターフェースアダプターとは

外部と内部を変換する層。コントローラー、プレゼンター、ゲートウェイ。

```
┌─────────────────────────────────────────────────────┐
│              Interface Adapters                      │
│                                                     │
│  External   ┌───────────────┐   Internal            │
│  Request ──▶│  Controller   │──▶ Use Case Input     │
│             └───────────────┘                       │
│                                                     │
│  Use Case   ┌───────────────┐   External            │
│  Output ───▶│  Presenter    │──▶ Response           │
│             └───────────────┘                       │
│                                                     │
│  Entity     ┌───────────────┐   External            │
│       ◀────│   Gateway     │◀── DB/API             │
│             └───────────────┘                       │
└─────────────────────────────────────────────────────┘
```

## コントローラー

### HTTP コントローラー

```typescript
// adapters/controllers/UserController.ts
export class UserController {
  constructor(
    private createUser: CreateUserUseCase,
    private getUser: GetUserUseCase,
    private updateUser: UpdateUserUseCase,
    private deleteUser: DeleteUserUseCase,
  ) {}

  async create(request: HttpRequest): Promise<HttpResponse> {
    try {
      // リクエストのバリデーション
      const validatedData = await this.validateCreateRequest(request.body);

      // ユースケース実行
      const output = await this.createUser.execute(validatedData);

      // レスポンス変換
      return {
        statusCode: 201,
        body: UserPresenter.toJson(output),
      };
    } catch (error) {
      return this.handleError(error);
    }
  }

  async getById(request: HttpRequest): Promise<HttpResponse> {
    try {
      const userId = request.params.id;
      const output = await this.getUser.execute({ userId });

      if (!output) {
        return { statusCode: 404, body: { error: "User not found" } };
      }

      return {
        statusCode: 200,
        body: UserPresenter.toJson(output),
      };
    } catch (error) {
      return this.handleError(error);
    }
  }

  async update(request: HttpRequest): Promise<HttpResponse> {
    try {
      const userId = request.params.id;
      const validatedData = await this.validateUpdateRequest(request.body);

      const output = await this.updateUser.execute({
        userId,
        ...validatedData,
      });

      return {
        statusCode: 200,
        body: UserPresenter.toJson(output),
      };
    } catch (error) {
      return this.handleError(error);
    }
  }

  private handleError(error: unknown): HttpResponse {
    if (error instanceof ApplicationError) {
      return {
        statusCode: error.statusCode,
        body: { error: error.message, code: error.code },
      };
    }

    console.error("Unexpected error:", error);
    return {
      statusCode: 500,
      body: { error: "Internal server error" },
    };
  }
}
```

### Next.js API Route

```typescript
// app/api/users/route.ts
import { NextRequest, NextResponse } from "next/server";
import { container } from "@/infrastructure/container";

export async function POST(request: NextRequest) {
  const controller = container.resolve(UserController);
  const body = await request.json();

  const response = await controller.create({
    body,
    params: {},
    query: {},
  });

  return NextResponse.json(response.body, { status: response.statusCode });
}

export async function GET(request: NextRequest) {
  const controller = container.resolve(UserController);
  const { searchParams } = new URL(request.url);

  const response = await controller.list({
    body: {},
    params: {},
    query: Object.fromEntries(searchParams),
  });

  return NextResponse.json(response.body, { status: response.statusCode });
}
```

## プレゼンター

### JSON プレゼンター

```typescript
// adapters/presenters/UserPresenter.ts
export class UserPresenter {
  static toJson(user: UserOutput): UserJsonResponse {
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      createdAt: user.createdAt.toISOString(),
    };
  }

  static toListJson(users: UserOutput[]): UserListJsonResponse {
    return {
      data: users.map((user) => this.toJson(user)),
      count: users.length,
    };
  }

  static toPaginatedJson(
    users: UserOutput[],
    pagination: PaginationInfo,
  ): PaginatedUserJsonResponse {
    return {
      data: users.map((user) => this.toJson(user)),
      pagination: {
        page: pagination.page,
        pageSize: pagination.pageSize,
        totalItems: pagination.totalItems,
        totalPages: pagination.totalPages,
      },
    };
  }
}

// 型定義
interface UserJsonResponse {
  id: string;
  email: string;
  name: string;
  createdAt: string;
}

interface UserListJsonResponse {
  data: UserJsonResponse[];
  count: number;
}
```

### エラープレゼンター

```typescript
// adapters/presenters/ErrorPresenter.ts
export class ErrorPresenter {
  static toJson(error: ApplicationError): ErrorJsonResponse {
    return {
      error: {
        code: error.code,
        message: error.message,
      },
    };
  }

  static toValidationJson(error: ValidationError): ValidationErrorJsonResponse {
    return {
      error: {
        code: error.code,
        message: error.message,
        details: error.errors,
      },
    };
  }
}
```

## ゲートウェイ（リポジトリ実装）

### Prisma リポジトリ

```typescript
// adapters/gateways/PrismaUserRepository.ts
import { PrismaClient } from "@prisma/client";
import { User, UserId, Email } from "@/domain/entities/User";
import { UserRepository } from "@/application/ports/output/UserRepository";

export class PrismaUserRepository implements UserRepository {
  constructor(private prisma: PrismaClient) {}

  async findById(id: UserId): Promise<User | null> {
    const record = await this.prisma.user.findUnique({
      where: { id: id.value },
    });

    if (!record) return null;

    return this.toDomain(record);
  }

  async findByEmail(email: Email): Promise<User | null> {
    const record = await this.prisma.user.findUnique({
      where: { email: email.value },
    });

    if (!record) return null;

    return this.toDomain(record);
  }

  async save(user: User): Promise<void> {
    const data = this.toPersistence(user);

    await this.prisma.user.upsert({
      where: { id: user.id.value },
      create: data,
      update: data,
    });
  }

  async delete(id: UserId): Promise<void> {
    await this.prisma.user.delete({
      where: { id: id.value },
    });
  }

  async findAll(pagination: Pagination): Promise<User[]> {
    const records = await this.prisma.user.findMany({
      skip: (pagination.page - 1) * pagination.pageSize,
      take: pagination.pageSize,
      orderBy: { createdAt: "desc" },
    });

    return records.map((r) => this.toDomain(r));
  }

  // マッパー: DB → Domain
  private toDomain(record: PrismaUser): User {
    return User.reconstruct({
      id: UserId.from(record.id),
      email: Email.create(record.email),
      name: record.name,
      passwordHash: record.passwordHash,
      status: record.status as UserStatus,
      createdAt: record.createdAt,
    });
  }

  // マッパー: Domain → DB
  private toPersistence(user: User): PrismaUserCreateInput {
    return {
      id: user.id.value,
      email: user.email.value,
      name: user.name,
      passwordHash: user.passwordHash,
      status: user.status,
      createdAt: user.createdAt,
    };
  }
}
```

## 外部サービスアダプター

### メールサービス

```typescript
// adapters/gateways/SendGridEmailService.ts
import sgMail from "@sendgrid/mail";
import { EmailService, SendEmailParams } from "@/application/ports/output/EmailService";

export class SendGridEmailService implements EmailService {
  constructor() {
    sgMail.setApiKey(process.env.SENDGRID_API_KEY!);
  }

  async send(params: SendEmailParams): Promise<void> {
    await sgMail.send({
      to: params.to,
      from: params.from,
      subject: params.subject,
      text: params.text,
      html: params.html,
    });
  }
}
```

### 決済サービス

```typescript
// adapters/gateways/StripePaymentService.ts
import Stripe from "stripe";
import { PaymentService, ChargeParams, ChargeResult } from "@/application/ports/output/PaymentService";

export class StripePaymentService implements PaymentService {
  private stripe: Stripe;

  constructor() {
    this.stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
  }

  async charge(params: ChargeParams): Promise<ChargeResult> {
    try {
      const paymentIntent = await this.stripe.paymentIntents.create({
        amount: params.amount.getAmount(),
        currency: params.amount.getCurrency().toLowerCase(),
        customer: params.customerId,
        payment_method: params.paymentMethodId,
        confirm: true,
      });

      return {
        success: true,
        transactionId: paymentIntent.id,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Payment failed",
      };
    }
  }
}
```

## DTO とマッパー

```typescript
// adapters/mappers/UserMapper.ts
export class UserMapper {
  // Request → Input
  static toCreateInput(request: CreateUserRequest): CreateUserInput {
    return {
      email: request.email,
      name: request.name,
      password: request.password,
    };
  }

  // Output → Response
  static toResponse(output: UserOutput): UserResponse {
    return {
      id: output.id,
      email: output.email,
      name: output.name,
      createdAt: output.createdAt.toISOString(),
    };
  }

  // Domain → Output
  static toOutput(user: User): UserOutput {
    return {
      id: user.id.value,
      email: user.email.value,
      name: user.name,
      createdAt: user.createdAt,
    };
  }
}
```

## 次のステップ

次章では、フレームワークとドライバーについて学びます。
