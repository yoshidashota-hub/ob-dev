# 第5章: ガード

## ガードとは

リクエストがルートハンドラに到達できるかを判断する役割。主に認可（Authorization）に使用。

```
┌─────────────────────────────────────────────────────┐
│                      Guard                           │
│                                                     │
│  ┌─────────────────────────────────────────────┐   │
│  │              canActivate()                   │   │
│  │                                             │   │
│  │   true  → リクエストを続行                   │   │
│  │   false → ForbiddenException                 │   │
│  └─────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────┘
```

## 基本的なガード

```typescript
// common/guards/auth.guard.ts
import { Injectable, CanActivate, ExecutionContext } from "@nestjs/common";
import { Observable } from "rxjs";

@Injectable()
export class AuthGuard implements CanActivate {
  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    const request = context.switchToHttp().getRequest();
    return this.validateRequest(request);
  }

  private validateRequest(request: Request): boolean {
    const token = request.headers["authorization"];
    return !!token;
  }
}
```

## ガードの適用

### メソッドレベル

```typescript
@Controller("users")
export class UsersController {
  @UseGuards(AuthGuard)
  @Get("profile")
  getProfile() {
    return { name: "John" };
  }
}
```

### コントローラーレベル

```typescript
@Controller("users")
@UseGuards(AuthGuard)
export class UsersController {
  @Get()
  findAll() {}

  @Get(":id")
  findOne() {}
}
```

### グローバルレベル

```typescript
// main.ts
async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalGuards(new AuthGuard());
  await app.listen(3000);
}

// または モジュールで登録（DI対応）
@Module({
  providers: [
    {
      provide: APP_GUARD,
      useClass: AuthGuard,
    },
  ],
})
export class AppModule {}
```

## ExecutionContext

```typescript
@Injectable()
export class AuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    // HTTP リクエスト
    const request = context.switchToHttp().getRequest();
    const response = context.switchToHttp().getResponse();

    // WebSocket
    const client = context.switchToWs().getClient();
    const data = context.switchToWs().getData();

    // GraphQL
    const gqlContext = GqlExecutionContext.create(context);

    // コントローラー/ハンドラ情報
    const controller = context.getClass();
    const handler = context.getHandler();

    return true;
  }
}
```

## ロールベース認可

### ロールデコレータ

```typescript
// common/decorators/roles.decorator.ts
import { SetMetadata } from "@nestjs/common";

export const ROLES_KEY = "roles";
export const Roles = (...roles: string[]) => SetMetadata(ROLES_KEY, roles);
```

### ロールガード

```typescript
// common/guards/roles.guard.ts
import { Injectable, CanActivate, ExecutionContext } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { ROLES_KEY } from "../decorators/roles.decorator";

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredRoles) {
      return true;  // ロールが設定されていなければ許可
    }

    const { user } = context.switchToHttp().getRequest();
    return requiredRoles.some((role) => user.roles?.includes(role));
  }
}
```

### 使用例

```typescript
@Controller("users")
@UseGuards(AuthGuard, RolesGuard)
export class UsersController {
  @Get()
  @Roles("admin", "moderator")
  findAll() {
    return this.usersService.findAll();
  }

  @Delete(":id")
  @Roles("admin")
  remove(@Param("id") id: string) {
    return this.usersService.remove(id);
  }
}
```

## JWT 認証ガード

```typescript
// auth/guards/jwt-auth.guard.ts
import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { Request } from "express";

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private jwtService: JwtService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const token = this.extractTokenFromHeader(request);

    if (!token) {
      throw new UnauthorizedException();
    }

    try {
      const payload = await this.jwtService.verifyAsync(token, {
        secret: process.env.JWT_SECRET,
      });
      request["user"] = payload;
    } catch {
      throw new UnauthorizedException();
    }

    return true;
  }

  private extractTokenFromHeader(request: Request): string | undefined {
    const [type, token] = request.headers.authorization?.split(" ") ?? [];
    return type === "Bearer" ? token : undefined;
  }
}
```

## Public ルートの設定

```typescript
// common/decorators/public.decorator.ts
import { SetMetadata } from "@nestjs/common";

export const IS_PUBLIC_KEY = "isPublic";
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
```

```typescript
// common/guards/jwt-auth.guard.ts
@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private jwtService: JwtService,
    private reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // @Public() デコレータがあればスキップ
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) {
      return true;
    }

    // 通常の認証処理
    const request = context.switchToHttp().getRequest();
    const token = this.extractTokenFromHeader(request);
    // ...
  }
}
```

```typescript
@Controller("auth")
export class AuthController {
  @Public()  // 認証不要
  @Post("login")
  login(@Body() loginDto: LoginDto) {}

  @Public()  // 認証不要
  @Post("register")
  register(@Body() registerDto: RegisterDto) {}
}
```

## 複数ガードの組み合わせ

```typescript
@Controller("admin")
@UseGuards(JwtAuthGuard, RolesGuard)  // 順番に実行
export class AdminController {
  @Get("dashboard")
  @Roles("admin")
  getDashboard() {}

  @Get("users")
  @Roles("admin", "moderator")
  getUsers() {}
}
```

## カスタムデコレータとの組み合わせ

```typescript
// common/decorators/current-user.decorator.ts
import { createParamDecorator, ExecutionContext } from "@nestjs/common";

export const CurrentUser = createParamDecorator(
  (data: string | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user;
    return data ? user?.[data] : user;
  },
);
```

```typescript
@Controller("users")
@UseGuards(JwtAuthGuard)
export class UsersController {
  @Get("me")
  getProfile(@CurrentUser() user: User) {
    return user;
  }

  @Get("my-email")
  getEmail(@CurrentUser("email") email: string) {
    return { email };
  }
}
```

## ポリシーベース認可

```typescript
// common/guards/policies.guard.ts
import { Injectable, CanActivate, ExecutionContext, Type } from "@nestjs/common";
import { Reflector } from "@nestjs/core";

interface IPolicyHandler {
  handle(user: User, resource?: any): boolean;
}

type PolicyHandlerCallback = (user: User, resource?: any) => boolean;
type PolicyHandler = IPolicyHandler | PolicyHandlerCallback;

export const CHECK_POLICIES_KEY = "check_policy";
export const CheckPolicies = (...handlers: PolicyHandler[]) =>
  SetMetadata(CHECK_POLICIES_KEY, handlers);

@Injectable()
export class PoliciesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const policyHandlers =
      this.reflector.get<PolicyHandler[]>(
        CHECK_POLICIES_KEY,
        context.getHandler(),
      ) || [];

    const { user } = context.switchToHttp().getRequest();

    return policyHandlers.every((handler) =>
      this.execPolicyHandler(handler, user),
    );
  }

  private execPolicyHandler(handler: PolicyHandler, user: User) {
    if (typeof handler === "function") {
      return handler(user);
    }
    return handler.handle(user);
  }
}
```

## テスト

```typescript
describe("AuthGuard", () => {
  let guard: AuthGuard;

  beforeEach(() => {
    guard = new AuthGuard();
  });

  it("should allow requests with valid token", () => {
    const context = createMock<ExecutionContext>();
    context.switchToHttp().getRequest.mockReturnValue({
      headers: { authorization: "Bearer valid-token" },
    });

    expect(guard.canActivate(context)).toBe(true);
  });

  it("should deny requests without token", () => {
    const context = createMock<ExecutionContext>();
    context.switchToHttp().getRequest.mockReturnValue({
      headers: {},
    });

    expect(guard.canActivate(context)).toBe(false);
  });
});
```

## 次のステップ

次章では、インターセプターについて詳しく学びます。
