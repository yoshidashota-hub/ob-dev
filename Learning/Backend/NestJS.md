---
created: 2025-11-17
tags: [learning, nestjs, nodejs, typescript, backend, framework]
status: 進行中
topic: NestJS Framework
source: https://nestjs.com
---

# NestJS

## 概要

NestJS は、効率的でスケーラブルな Node.js サーバーサイドアプリケーションを構築するための TypeScript フレームワーク。Angular にインスパイアされた構造で、DI（依存性注入）、モジュールシステム、デコレーターを活用し、エンタープライズグレードのアプリケーションを構築できる。

## 学んだこと

### 🎯 NestJS とは

**主要な特徴:**

```
NestJS の特徴:
├── TypeScript ファースト
├── Angular ライクなアーキテクチャ
├── 依存性注入（DI）
├── モジュールシステム
├── デコレーター駆動
├── Express/Fastify 互換
└── マイクロサービス対応
```

**他のフレームワークとの比較:**

| 特性             | Express    | Fastify    | NestJS   |
| ---------------- | ---------- | ---------- | -------- |
| 構造             | 自由       | 自由       | 規約的   |
| TypeScript       | オプション | オプション | 標準     |
| DI               | なし       | なし       | 組み込み |
| 学習曲線         | 低い       | 低い       | 中〜高   |
| スケーラビリティ | 要設計     | 要設計     | 設計済み |
| テスト容易性     | 要工夫     | 要工夫     | 組み込み |

---

### 📦 基本構造

#### プロジェクトセットアップ

```bash
# CLI インストール
npm i -g @nestjs/cli

# 新規プロジェクト作成
nest new my-project

# 構造
my-project/
├── src/
│   ├── app.controller.ts      # コントローラー
│   ├── app.service.ts         # サービス
│   ├── app.module.ts          # ルートモジュール
│   └── main.ts                # エントリーポイント
├── test/                       # テスト
├── nest-cli.json              # CLI 設定
└── tsconfig.json              # TypeScript 設定
```

#### モジュール（Module）

**アプリケーションの構造化単位。**

```typescript
// users/users.module.ts
import { Module } from "@nestjs/common";
import { UsersController } from "./users.controller";
import { UsersService } from "./users.service";
import { TypeOrmModule } from "@nestjs/typeorm";
import { User } from "./entities/user.entity";

@Module({
  imports: [
    TypeOrmModule.forFeature([User]), // 依存モジュール
  ],
  controllers: [UsersController], // コントローラー
  providers: [UsersService], // サービス
  exports: [UsersService], // 外部公開
})
export class UsersModule {}

// app.module.ts（ルートモジュール）
import { Module } from "@nestjs/common";
import { UsersModule } from "./users/users.module";
import { AuthModule } from "./auth/auth.module";
import { OrdersModule } from "./orders/orders.module";
import { TypeOrmModule } from "@nestjs/typeorm";
import { ConfigModule } from "@nestjs/config";

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRoot({
      type: "postgres",
      host: process.env.DB_HOST,
      port: parseInt(process.env.DB_PORT, 10),
      username: process.env.DB_USERNAME,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      autoLoadEntities: true,
      synchronize: process.env.NODE_ENV !== "production",
    }),
    UsersModule,
    AuthModule,
    OrdersModule,
  ],
})
export class AppModule {}
```

#### コントローラー（Controller）

**リクエストを処理しレスポンスを返す。**

```typescript
// users/users.controller.ts
import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
  ParseIntPipe,
  UseGuards,
  Request,
} from "@nestjs/common";
import { UsersService } from "./users.service";
import { CreateUserDto } from "./dto/create-user.dto";
import { UpdateUserDto } from "./dto/update-user.dto";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { ApiTags, ApiOperation, ApiResponse } from "@nestjs/swagger";

@ApiTags("users")
@Controller("users")
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: "Create user" })
  @ApiResponse({ status: 201, description: "User created successfully" })
  @ApiResponse({ status: 400, description: "Invalid input" })
  create(@Body() createUserDto: CreateUserDto) {
    return this.usersService.create(createUserDto);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: "Get all users" })
  findAll(@Query("page") page: number = 1, @Query("limit") limit: number = 10) {
    return this.usersService.findAll(page, limit);
  }

  @Get(":id")
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: "Get user by ID" })
  @ApiResponse({ status: 404, description: "User not found" })
  findOne(@Param("id", ParseIntPipe) id: number) {
    return this.usersService.findOne(id);
  }

  @Put(":id")
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: "Update user" })
  update(
    @Param("id", ParseIntPipe) id: number,
    @Body() updateUserDto: UpdateUserDto
  ) {
    return this.usersService.update(id, updateUserDto);
  }

  @Delete(":id")
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: "Delete user" })
  remove(@Param("id", ParseIntPipe) id: number) {
    return this.usersService.remove(id);
  }

  @Get("me")
  @UseGuards(JwtAuthGuard)
  getProfile(@Request() req) {
    return req.user;
  }
}
```

#### サービス（Service / Provider）

**ビジネスロジックを担当。**

```typescript
// users/users.service.ts
import {
  Injectable,
  NotFoundException,
  ConflictException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { User } from "./entities/user.entity";
import { CreateUserDto } from "./dto/create-user.dto";
import { UpdateUserDto } from "./dto/update-user.dto";
import * as bcrypt from "bcrypt";

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>
  ) {}

  async create(createUserDto: CreateUserDto): Promise<User> {
    // メールアドレスの重複チェック
    const existingUser = await this.userRepository.findOne({
      where: { email: createUserDto.email },
    });

    if (existingUser) {
      throw new ConflictException("Email already exists");
    }

    // パスワードハッシュ化
    const hashedPassword = await bcrypt.hash(createUserDto.password, 10);

    const user = this.userRepository.create({
      ...createUserDto,
      password: hashedPassword,
    });

    const savedUser = await this.userRepository.save(user);
    delete savedUser.password; // パスワードを除外
    return savedUser;
  }

  async findAll(
    page: number,
    limit: number
  ): Promise<{ users: User[]; total: number }> {
    const [users, total] = await this.userRepository.findAndCount({
      skip: (page - 1) * limit,
      take: limit,
      select: ["id", "email", "name", "createdAt"], // パスワードを除外
      order: { createdAt: "DESC" },
    });

    return { users, total };
  }

  async findOne(id: number): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { id },
      select: ["id", "email", "name", "createdAt"],
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    return user;
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.userRepository.findOne({ where: { email } });
  }

  async update(id: number, updateUserDto: UpdateUserDto): Promise<User> {
    const user = await this.findOne(id);

    if (updateUserDto.password) {
      updateUserDto.password = await bcrypt.hash(updateUserDto.password, 10);
    }

    Object.assign(user, updateUserDto);
    const updatedUser = await this.userRepository.save(user);
    delete updatedUser.password;
    return updatedUser;
  }

  async remove(id: number): Promise<void> {
    const user = await this.findOne(id);
    await this.userRepository.remove(user);
  }
}
```

#### DTO（Data Transfer Object）

**データのバリデーションと型定義。**

```typescript
// users/dto/create-user.dto.ts
import {
  IsEmail,
  IsString,
  MinLength,
  MaxLength,
  Matches,
  IsOptional,
} from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export class CreateUserDto {
  @ApiProperty({ example: "user@example.com" })
  @IsEmail({}, { message: "Invalid email format" })
  email: string;

  @ApiProperty({ example: "John Doe" })
  @IsString()
  @MinLength(2, { message: "Name must be at least 2 characters" })
  @MaxLength(50)
  name: string;

  @ApiProperty({ example: "P@ssword123" })
  @IsString()
  @MinLength(8, { message: "Password must be at least 8 characters" })
  @Matches(/((?=.*\d)|(?=.*\W+))(?![.\n])(?=.*[A-Z])(?=.*[a-z]).*$/, {
    message:
      "Password must contain uppercase, lowercase, and number/special character",
  })
  password: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  bio?: string;
}

// users/dto/update-user.dto.ts
import { PartialType } from "@nestjs/swagger";
import { CreateUserDto } from "./create-user.dto";

export class UpdateUserDto extends PartialType(CreateUserDto) {}
```

#### エンティティ（Entity）

**データベーススキーマの定義。**

```typescript
// users/entities/user.entity.ts
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from "typeorm";
import { Order } from "../../orders/entities/order.entity";

@Entity("users")
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  email: string;

  @Column()
  name: string;

  @Column({ select: false }) // デフォルトで取得しない
  password: string;

  @Column({ nullable: true })
  bio: string;

  @Column({ default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @OneToMany(() => Order, (order) => order.user)
  orders: Order[];
}
```

---

### 🔐 認証と認可

#### JWT 認証

```typescript
// auth/auth.module.ts
import { Module } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";
import { PassportModule } from "@nestjs/passport";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { AuthService } from "./auth.service";
import { AuthController } from "./auth.controller";
import { UsersModule } from "../users/users.module";
import { JwtStrategy } from "./strategies/jwt.strategy";
import { LocalStrategy } from "./strategies/local.strategy";

@Module({
  imports: [
    UsersModule,
    PassportModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>("JWT_SECRET"),
        signOptions: { expiresIn: "1h" },
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, LocalStrategy, JwtStrategy],
  exports: [AuthService],
})
export class AuthModule {}

// auth/auth.service.ts
import { Injectable, UnauthorizedException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { UsersService } from "../users/users.service";
import * as bcrypt from "bcrypt";

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService
  ) {}

  async validateUser(email: string, password: string): Promise<any> {
    const user = await this.usersService.findByEmail(email);
    if (user && (await bcrypt.compare(password, user.password))) {
      const { password, ...result } = user;
      return result;
    }
    return null;
  }

  async login(user: any) {
    const payload = { email: user.email, sub: user.id };
    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
    };
  }

  async register(createUserDto: CreateUserDto) {
    const user = await this.usersService.create(createUserDto);
    return this.login(user);
  }
}

// auth/strategies/jwt.strategy.ts
import { ExtractJwt, Strategy } from "passport-jwt";
import { PassportStrategy } from "@nestjs/passport";
import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>("JWT_SECRET"),
    });
  }

  async validate(payload: any) {
    return { userId: payload.sub, email: payload.email };
  }
}

// auth/guards/jwt-auth.guard.ts
import { Injectable } from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";

@Injectable()
export class JwtAuthGuard extends AuthGuard("jwt") {}

// auth/auth.controller.ts
import { Controller, Post, Body, UseGuards, Request } from "@nestjs/common";
import { AuthService } from "./auth.service";
import { LocalAuthGuard } from "./guards/local-auth.guard";
import { CreateUserDto } from "../users/dto/create-user.dto";
import { LoginDto } from "./dto/login.dto";

@Controller("auth")
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post("register")
  register(@Body() createUserDto: CreateUserDto) {
    return this.authService.register(createUserDto);
  }

  @UseGuards(LocalAuthGuard)
  @Post("login")
  login(@Request() req) {
    return this.authService.login(req.user);
  }
}
```

#### ロールベース認可

```typescript
// auth/decorators/roles.decorator.ts
import { SetMetadata } from "@nestjs/common";

export enum Role {
  User = "user",
  Admin = "admin",
}

export const ROLES_KEY = "roles";
export const Roles = (...roles: Role[]) => SetMetadata(ROLES_KEY, roles);

// auth/guards/roles.guard.ts
import { Injectable, CanActivate, ExecutionContext } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { Role, ROLES_KEY } from "../decorators/roles.decorator";

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles) {
      return true;
    }

    const { user } = context.switchToHttp().getRequest();
    return requiredRoles.some((role) => user.roles?.includes(role));
  }
}

// 使用例
@Controller("admin")
@UseGuards(JwtAuthGuard, RolesGuard)
export class AdminController {
  @Get("dashboard")
  @Roles(Role.Admin)
  getDashboard() {
    return { message: "Admin dashboard" };
  }
}
```

---

### 🔌 ミドルウェアとインターセプター

#### ミドルウェア

```typescript
// common/middleware/logger.middleware.ts
import { Injectable, NestMiddleware } from "@nestjs/common";
import { Request, Response, NextFunction } from "express";

@Injectable()
export class LoggerMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    const start = Date.now();

    res.on("finish", () => {
      const duration = Date.now() - start;
      console.log(
        `[${new Date().toISOString()}] ${req.method} ${req.url} ${
          res.statusCode
        } - ${duration}ms`
      );
    });

    next();
  }
}

// app.module.ts で適用
import { Module, NestModule, MiddlewareConsumer } from "@nestjs/common";

@Module({})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(LoggerMiddleware).forRoutes("*"); // 全ルートに適用
  }
}
```

#### インターセプター

```typescript
// common/interceptors/transform.interceptor.ts
import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from "@nestjs/common";
import { Observable } from "rxjs";
import { map } from "rxjs/operators";

export interface Response<T> {
  success: boolean;
  data: T;
  timestamp: string;
}

@Injectable()
export class TransformInterceptor<T>
  implements NestInterceptor<T, Response<T>>
{
  intercept(
    context: ExecutionContext,
    next: CallHandler
  ): Observable<Response<T>> {
    return next.handle().pipe(
      map((data) => ({
        success: true,
        data,
        timestamp: new Date().toISOString(),
      }))
    );
  }
}

// common/interceptors/timeout.interceptor.ts
import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  RequestTimeoutException,
} from "@nestjs/common";
import { Observable, throwError, TimeoutError } from "rxjs";
import { catchError, timeout } from "rxjs/operators";

@Injectable()
export class TimeoutInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle().pipe(
      timeout(5000),
      catchError((err) => {
        if (err instanceof TimeoutError) {
          return throwError(() => new RequestTimeoutException());
        }
        return throwError(() => err);
      })
    );
  }
}

// main.ts でグローバル適用
import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import { TransformInterceptor } from "./common/interceptors/transform.interceptor";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalInterceptors(new TransformInterceptor());
  await app.listen(3000);
}
bootstrap();
```

#### 例外フィルター

```typescript
// common/filters/http-exception.filter.ts
import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from "@nestjs/common";
import { Request, Response } from "express";

@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const status = exception.getStatus();
    const exceptionResponse = exception.getResponse();

    const errorResponse = {
      success: false,
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      method: request.method,
      message:
        typeof exceptionResponse === "string"
          ? exceptionResponse
          : (exceptionResponse as any).message,
    };

    response.status(status).json(errorResponse);
  }
}

// 全例外をキャッチ
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const message =
      exception instanceof HttpException
        ? exception.message
        : "Internal server error";

    response.status(status).json({
      success: false,
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      message,
    });
  }
}
```

---

### 🗄️ データベース連携

#### TypeORM

```typescript
// orders/orders.service.ts
import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, DataSource } from "typeorm";
import { Order } from "./entities/order.entity";

@Injectable()
export class OrdersService {
  constructor(
    @InjectRepository(Order)
    private orderRepository: Repository<Order>,
    private dataSource: DataSource
  ) {}

  // トランザクション
  async createOrderWithItems(orderData: CreateOrderDto): Promise<Order> {
    const queryRunner = this.dataSource.createQueryRunner();

    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const order = queryRunner.manager.create(Order, {
        userId: orderData.userId,
        status: "pending",
      });

      const savedOrder = await queryRunner.manager.save(order);

      for (const item of orderData.items) {
        const orderItem = queryRunner.manager.create(OrderItem, {
          orderId: savedOrder.id,
          productId: item.productId,
          quantity: item.quantity,
          price: item.price,
        });
        await queryRunner.manager.save(orderItem);
      }

      await queryRunner.commitTransaction();
      return savedOrder;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  // QueryBuilder
  async findOrdersWithFilters(filters: OrderFiltersDto) {
    const queryBuilder = this.orderRepository
      .createQueryBuilder("order")
      .leftJoinAndSelect("order.user", "user")
      .leftJoinAndSelect("order.items", "items");

    if (filters.userId) {
      queryBuilder.andWhere("order.userId = :userId", {
        userId: filters.userId,
      });
    }

    if (filters.status) {
      queryBuilder.andWhere("order.status = :status", {
        status: filters.status,
      });
    }

    if (filters.startDate) {
      queryBuilder.andWhere("order.createdAt >= :startDate", {
        startDate: filters.startDate,
      });
    }

    if (filters.endDate) {
      queryBuilder.andWhere("order.createdAt <= :endDate", {
        endDate: filters.endDate,
      });
    }

    return queryBuilder
      .orderBy("order.createdAt", "DESC")
      .skip((filters.page - 1) * filters.limit)
      .take(filters.limit)
      .getManyAndCount();
  }
}
```

#### Prisma

```typescript
// prisma/prisma.service.ts
import { Injectable, OnModuleInit, OnModuleDestroy } from "@nestjs/common";
import { PrismaClient } from "@prisma/client";

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}

// users/users.service.ts (Prisma版)
import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { User, Prisma } from "@prisma/client";

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async create(data: Prisma.UserCreateInput): Promise<User> {
    return this.prisma.user.create({ data });
  }

  async findAll(): Promise<User[]> {
    return this.prisma.user.findMany({
      include: { orders: true },
    });
  }

  async findOne(id: number): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { id },
      include: { orders: true },
    });
  }
}
```

---

### 🧪 テスト

#### ユニットテスト

```typescript
// users/users.service.spec.ts
import { Test, TestingModule } from "@nestjs/testing";
import { getRepositoryToken } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { UsersService } from "./users.service";
import { User } from "./entities/user.entity";
import { NotFoundException, ConflictException } from "@nestjs/common";

describe("UsersService", () => {
  let service: UsersService;
  let repository: Repository<User>;

  const mockRepository = {
    create: jest.fn(),
    save: jest.fn(),
    findOne: jest.fn(),
    findAndCount: jest.fn(),
    remove: jest.fn(),
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
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("create", () => {
    it("should create a new user", async () => {
      const createUserDto = {
        email: "test@example.com",
        name: "Test User",
        password: "Password123!",
      };

      mockRepository.findOne.mockResolvedValue(null);
      mockRepository.create.mockReturnValue(createUserDto);
      mockRepository.save.mockResolvedValue({
        id: 1,
        ...createUserDto,
        createdAt: new Date(),
      });

      const result = await service.create(createUserDto);

      expect(result).toHaveProperty("id");
      expect(result.email).toBe(createUserDto.email);
      expect(result).not.toHaveProperty("password");
    });

    it("should throw ConflictException if email exists", async () => {
      mockRepository.findOne.mockResolvedValue({
        id: 1,
        email: "test@example.com",
      });

      await expect(
        service.create({
          email: "test@example.com",
          name: "Test",
          password: "Password123!",
        })
      ).rejects.toThrow(ConflictException);
    });
  });

  describe("findOne", () => {
    it("should return a user", async () => {
      const user = { id: 1, email: "test@example.com", name: "Test" };
      mockRepository.findOne.mockResolvedValue(user);

      const result = await service.findOne(1);

      expect(result).toEqual(user);
    });

    it("should throw NotFoundException if user not found", async () => {
      mockRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne(999)).rejects.toThrow(NotFoundException);
    });
  });
});
```

#### E2E テスト

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

    // 認証トークンを取得
    const authResponse = await request(app.getHttpServer())
      .post("/auth/login")
      .send({ email: "admin@example.com", password: "Admin123!" });

    accessToken = authResponse.body.access_token;
  });

  afterAll(async () => {
    await app.close();
  });

  describe("/users (POST)", () => {
    it("should create a user", () => {
      return request(app.getHttpServer())
        .post("/users")
        .send({
          email: "newuser@example.com",
          name: "New User",
          password: "Password123!",
        })
        .expect(201)
        .expect((res) => {
          expect(res.body.email).toBe("newuser@example.com");
          expect(res.body).not.toHaveProperty("password");
        });
    });

    it("should return 400 for invalid email", () => {
      return request(app.getHttpServer())
        .post("/users")
        .send({
          email: "invalid-email",
          name: "Test",
          password: "Password123!",
        })
        .expect(400);
    });
  });

  describe("/users (GET)", () => {
    it("should return users with authentication", () => {
      return request(app.getHttpServer())
        .get("/users")
        .set("Authorization", `Bearer ${accessToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty("users");
          expect(res.body).toHaveProperty("total");
        });
    });

    it("should return 401 without authentication", () => {
      return request(app.getHttpServer()).get("/users").expect(401);
    });
  });
});
```

---

### 📡 マイクロサービス

```typescript
// Gateway (HTTP to Microservice)
// api-gateway/src/users/users.controller.ts
import { Controller, Get, Inject } from "@nestjs/common";
import { ClientProxy } from "@nestjs/microservices";

@Controller("users")
export class UsersController {
  constructor(
    @Inject("USER_SERVICE") private readonly userService: ClientProxy
  ) {}

  @Get()
  async getUsers() {
    return this.userService.send({ cmd: "get_users" }, {});
  }
}

// api-gateway/src/users/users.module.ts
import { Module } from "@nestjs/common";
import { ClientsModule, Transport } from "@nestjs/microservices";

@Module({
  imports: [
    ClientsModule.register([
      {
        name: "USER_SERVICE",
        transport: Transport.TCP,
        options: {
          host: "user-service",
          port: 3001,
        },
      },
    ]),
  ],
})
export class UsersModule {}

// user-service/src/main.ts (Microservice)
import { NestFactory } from "@nestjs/core";
import { Transport, MicroserviceOptions } from "@nestjs/microservices";
import { AppModule } from "./app.module";

async function bootstrap() {
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(
    AppModule,
    {
      transport: Transport.TCP,
      options: {
        host: "0.0.0.0",
        port: 3001,
      },
    }
  );
  await app.listen();
}
bootstrap();

// user-service/src/users/users.controller.ts
import { Controller } from "@nestjs/common";
import { MessagePattern } from "@nestjs/microservices";
import { UsersService } from "./users.service";

@Controller()
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @MessagePattern({ cmd: "get_users" })
  async getUsers() {
    return this.usersService.findAll();
  }

  @MessagePattern({ cmd: "get_user" })
  async getUser(data: { id: number }) {
    return this.usersService.findOne(data.id);
  }

  @MessagePattern({ cmd: "create_user" })
  async createUser(data: CreateUserDto) {
    return this.usersService.create(data);
  }
}
```

---

### 🚀 本番環境設定

#### 設定管理

```typescript
// config/configuration.ts
export default () => ({
  port: parseInt(process.env.PORT, 10) || 3000,
  database: {
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT, 10) || 5432,
    username: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
  },
  jwt: {
    secret: process.env.JWT_SECRET,
    expiresIn: process.env.JWT_EXPIRES_IN || "1h",
  },
  redis: {
    host: process.env.REDIS_HOST,
    port: parseInt(process.env.REDIS_PORT, 10) || 6379,
  },
});

// app.module.ts
import { Module } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import configuration from "./config/configuration";

@Module({
  imports: [
    ConfigModule.forRoot({
      load: [configuration],
      isGlobal: true,
      cache: true,
    }),
  ],
})
export class AppModule {}
```

#### ヘルスチェック

```typescript
// health/health.controller.ts
import { Controller, Get } from "@nestjs/common";
import {
  HealthCheckService,
  HttpHealthIndicator,
  TypeOrmHealthIndicator,
  MemoryHealthIndicator,
  DiskHealthIndicator,
} from "@nestjs/terminus";

@Controller("health")
export class HealthController {
  constructor(
    private health: HealthCheckService,
    private http: HttpHealthIndicator,
    private db: TypeOrmHealthIndicator,
    private memory: MemoryHealthIndicator,
    private disk: DiskHealthIndicator
  ) {}

  @Get()
  check() {
    return this.health.check([
      () => this.db.pingCheck("database"),
      () => this.memory.checkHeap("memory_heap", 150 * 1024 * 1024),
      () =>
        this.disk.checkStorage("storage", {
          path: "/",
          thresholdPercent: 0.9,
        }),
    ]);
  }

  @Get("liveness")
  liveness() {
    return { status: "ok" };
  }

  @Get("readiness")
  async readiness() {
    return this.health.check([() => this.db.pingCheck("database")]);
  }
}
```

#### ロギング

```typescript
// main.ts
import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import { Logger } from "@nestjs/common";

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: ["error", "warn", "log", "debug", "verbose"],
  });

  const logger = new Logger("Bootstrap");
  const port = process.env.PORT || 3000;

  await app.listen(port);
  logger.log(`Application is running on: http://localhost:${port}`);
}
bootstrap();

// Winston Logger
import { WinstonModule } from "nest-winston";
import * as winston from "winston";

@Module({
  imports: [
    WinstonModule.forRoot({
      transports: [
        new winston.transports.Console({
          format: winston.format.combine(
            winston.format.timestamp(),
            winston.format.colorize(),
            winston.format.simple()
          ),
        }),
        new winston.transports.File({
          filename: "logs/error.log",
          level: "error",
        }),
        new winston.transports.File({
          filename: "logs/combined.log",
        }),
      ],
    }),
  ],
})
export class AppModule {}
```

---

## 🎯 学習ロードマップ

### 初級（1-2 週間）

1. **基本概念**

   - Module, Controller, Service
   - デコレーターの理解
   - DI（依存性注入）

2. **CRUD 実装**

   - REST API 作成
   - DTO とバリデーション
   - データベース連携（TypeORM）

3. **認証**
   - JWT 認証
   - Guards と Strategies

### 中級（2-4 週間）

1. **高度な機能**

   - インターセプター
   - ミドルウェア
   - 例外フィルター

2. **テスト**

   - ユニットテスト
   - E2E テスト
   - モック

3. **パフォーマンス**
   - キャッシング（Redis）
   - ページネーション
   - クエリ最適化

### 上級（1 ヶ月以上）

1. **マイクロサービス**

   - TCP/Redis/NATS トランスポート
   - イベント駆動
   - SAGA パターン

2. **GraphQL**

   - Schema First / Code First
   - Resolver
   - Subscription

3. **WebSocket**
   - Gateway
   - リアルタイム通信

---

## 🎓 学習リソース

### 公式ドキュメント

- [NestJS Documentation](https://docs.nestjs.com/)
- [NestJS Fundamentals Course](https://courses.nestjs.com/)

### 主要リポジトリ

1. **[nestjs/nest](https://github.com/nestjs/nest)**

   - 公式リポジトリ
   - ソースコード解析

2. **[nestjs/nest-cli](https://github.com/nestjs/nest-cli)**

   - CLI ツール
   - コード生成

3. **[awesome-nestjs](https://github.com/nestjs/awesome-nestjs)**
   - リソース集
   - ボイラープレート

### 推奨書籍

- **NestJS: A Progressive Node.js Framework** - Kamil Myśliwiec
- **Building Modern Web Applications with NestJS**

### 実践プロジェクト

1. **REST API**

   - ユーザー管理システム
   - ブログ API
   - EC サイト API

2. **リアルタイム**

   - チャットアプリ
   - 通知システム

3. **マイクロサービス**
   - 分散システム構築
   - イベント駆動アーキテクチャ

---

## 次のステップ

1. **実践**

   - CLI でプロジェクト作成
   - CRUD API を実装
   - JWT 認証を追加

2. **深い学習**

   - クリーンアーキテクチャとの統合
   - DDD パターンの適用
   - CQRS の実装

3. **本番運用**
   - Docker 化
   - CI/CD パイプライン
   - モニタリング設定

---

最終更新: 2025 年 11 月
