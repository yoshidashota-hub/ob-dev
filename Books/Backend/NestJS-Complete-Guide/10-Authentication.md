# 第10章: 認証

## 概要

NestJS での認証実装パターン。

```
┌─────────────────────────────────────────────────────┐
│               Authentication Flow                    │
│                                                     │
│  1. Login Request (email/password)                  │
│     │                                               │
│     ▼                                               │
│  2. Validate Credentials                            │
│     │                                               │
│     ▼                                               │
│  3. Generate JWT Token                              │
│     │                                               │
│     ▼                                               │
│  4. Return Token to Client                          │
│     │                                               │
│     ▼                                               │
│  5. Client sends Token in Authorization Header      │
│     │                                               │
│     ▼                                               │
│  6. Guard validates Token                           │
│     │                                               │
│     ▼                                               │
│  7. Access granted/denied                           │
└─────────────────────────────────────────────────────┘
```

## セットアップ

```bash
npm install @nestjs/jwt @nestjs/passport passport passport-jwt passport-local
npm install -D @types/passport-jwt @types/passport-local
npm install bcrypt
npm install -D @types/bcrypt
```

## Auth モジュール構成

```
src/
├── auth/
│   ├── auth.module.ts
│   ├── auth.controller.ts
│   ├── auth.service.ts
│   ├── strategies/
│   │   ├── local.strategy.ts
│   │   └── jwt.strategy.ts
│   ├── guards/
│   │   ├── local-auth.guard.ts
│   │   └── jwt-auth.guard.ts
│   └── dto/
│       ├── login.dto.ts
│       └── register.dto.ts
└── users/
    ├── users.module.ts
    └── users.service.ts
```

## JWT 認証の実装

### Auth Module

```typescript
// auth/auth.module.ts
import { Module } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";
import { PassportModule } from "@nestjs/passport";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { AuthService } from "./auth.service";
import { AuthController } from "./auth.controller";
import { UsersModule } from "../users/users.module";
import { LocalStrategy } from "./strategies/local.strategy";
import { JwtStrategy } from "./strategies/jwt.strategy";

@Module({
  imports: [
    UsersModule,
    PassportModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>("JWT_SECRET"),
        signOptions: {
          expiresIn: configService.get<string>("JWT_EXPIRES_IN", "1h"),
        },
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, LocalStrategy, JwtStrategy],
  exports: [AuthService],
})
export class AuthModule {}
```

### Auth Service

```typescript
// auth/auth.service.ts
import { Injectable, UnauthorizedException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import * as bcrypt from "bcrypt";
import { UsersService } from "../users/users.service";
import { RegisterDto } from "./dto/register.dto";

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
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
    const payload = { email: user.email, sub: user.id, role: user.role };

    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    };
  }

  async register(registerDto: RegisterDto) {
    const hashedPassword = await bcrypt.hash(registerDto.password, 10);

    const user = await this.usersService.create({
      ...registerDto,
      password: hashedPassword,
    });

    return this.login(user);
  }

  async refreshToken(user: any) {
    const payload = { email: user.email, sub: user.id, role: user.role };
    return {
      access_token: this.jwtService.sign(payload),
    };
  }
}
```

### Local Strategy（ログイン用）

```typescript
// auth/strategies/local.strategy.ts
import { Strategy } from "passport-local";
import { PassportStrategy } from "@nestjs/passport";
import { Injectable, UnauthorizedException } from "@nestjs/common";
import { AuthService } from "../auth.service";

@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy) {
  constructor(private authService: AuthService) {
    super({ usernameField: "email" });
  }

  async validate(email: string, password: string): Promise<any> {
    const user = await this.authService.validateUser(email, password);

    if (!user) {
      throw new UnauthorizedException("Invalid credentials");
    }

    return user;
  }
}
```

### JWT Strategy（認証済みリクエスト用）

```typescript
// auth/strategies/jwt.strategy.ts
import { ExtractJwt, Strategy } from "passport-jwt";
import { PassportStrategy } from "@nestjs/passport";
import { Injectable, UnauthorizedException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { UsersService } from "../../users/users.service";

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private configService: ConfigService,
    private usersService: UsersService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>("JWT_SECRET"),
    });
  }

  async validate(payload: any) {
    const user = await this.usersService.findOne(payload.sub);

    if (!user) {
      throw new UnauthorizedException();
    }

    return { id: payload.sub, email: payload.email, role: payload.role };
  }
}
```

### Guards

```typescript
// auth/guards/local-auth.guard.ts
import { Injectable } from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";

@Injectable()
export class LocalAuthGuard extends AuthGuard("local") {}
```

```typescript
// auth/guards/jwt-auth.guard.ts
import { Injectable, ExecutionContext } from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import { Reflector } from "@nestjs/core";
import { IS_PUBLIC_KEY } from "../decorators/public.decorator";

@Injectable()
export class JwtAuthGuard extends AuthGuard("jwt") {
  constructor(private reflector: Reflector) {
    super();
  }

  canActivate(context: ExecutionContext) {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    return super.canActivate(context);
  }
}
```

### Auth Controller

```typescript
// auth/auth.controller.ts
import { Controller, Post, Body, UseGuards, Request, Get } from "@nestjs/common";
import { AuthService } from "./auth.service";
import { LocalAuthGuard } from "./guards/local-auth.guard";
import { JwtAuthGuard } from "./guards/jwt-auth.guard";
import { Public } from "./decorators/public.decorator";
import { RegisterDto } from "./dto/register.dto";
import { LoginDto } from "./dto/login.dto";

@Controller("auth")
export class AuthController {
  constructor(private authService: AuthService) {}

  @Public()
  @UseGuards(LocalAuthGuard)
  @Post("login")
  async login(@Request() req, @Body() loginDto: LoginDto) {
    return this.authService.login(req.user);
  }

  @Public()
  @Post("register")
  async register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  @UseGuards(JwtAuthGuard)
  @Get("profile")
  getProfile(@Request() req) {
    return req.user;
  }

  @UseGuards(JwtAuthGuard)
  @Post("refresh")
  refreshToken(@Request() req) {
    return this.authService.refreshToken(req.user);
  }
}
```

### Public デコレータ

```typescript
// auth/decorators/public.decorator.ts
import { SetMetadata } from "@nestjs/common";

export const IS_PUBLIC_KEY = "isPublic";
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
```

### CurrentUser デコレータ

```typescript
// auth/decorators/current-user.decorator.ts
import { createParamDecorator, ExecutionContext } from "@nestjs/common";

export const CurrentUser = createParamDecorator(
  (data: string | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user;
    return data ? user?.[data] : user;
  },
);

// 使用例
@Get("me")
getMe(@CurrentUser() user: User) {
  return user;
}

@Get("my-id")
getMyId(@CurrentUser("id") userId: string) {
  return { userId };
}
```

## ロールベース認可

### Roles デコレータ

```typescript
// auth/decorators/roles.decorator.ts
import { SetMetadata } from "@nestjs/common";

export const ROLES_KEY = "roles";
export const Roles = (...roles: string[]) => SetMetadata(ROLES_KEY, roles);
```

### RolesGuard

```typescript
// auth/guards/roles.guard.ts
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
      return true;
    }

    const { user } = context.switchToHttp().getRequest();
    return requiredRoles.some((role) => user.role === role);
  }
}
```

### 使用例

```typescript
@Controller("admin")
@UseGuards(JwtAuthGuard, RolesGuard)
export class AdminController {
  @Get("dashboard")
  @Roles("admin")
  getDashboard() {
    return { message: "Admin dashboard" };
  }

  @Get("users")
  @Roles("admin", "moderator")
  getUsers() {
    return this.usersService.findAll();
  }
}
```

## グローバル認証設定

```typescript
// app.module.ts
import { APP_GUARD } from "@nestjs/core";

@Module({
  providers: [
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
  ],
})
export class AppModule {}
```

## Refresh Token 実装

```typescript
// auth/auth.service.ts
@Injectable()
export class AuthService {
  async login(user: any) {
    const payload = { email: user.email, sub: user.id, role: user.role };

    const accessToken = this.jwtService.sign(payload, { expiresIn: "15m" });
    const refreshToken = this.jwtService.sign(payload, { expiresIn: "7d" });

    // Refresh token をDBに保存
    await this.usersService.updateRefreshToken(user.id, refreshToken);

    return {
      access_token: accessToken,
      refresh_token: refreshToken,
    };
  }

  async refreshTokens(userId: string, refreshToken: string) {
    const user = await this.usersService.findOne(userId);

    if (!user || user.refreshToken !== refreshToken) {
      throw new UnauthorizedException("Invalid refresh token");
    }

    const payload = { email: user.email, sub: user.id, role: user.role };

    const newAccessToken = this.jwtService.sign(payload, { expiresIn: "15m" });
    const newRefreshToken = this.jwtService.sign(payload, { expiresIn: "7d" });

    await this.usersService.updateRefreshToken(user.id, newRefreshToken);

    return {
      access_token: newAccessToken,
      refresh_token: newRefreshToken,
    };
  }

  async logout(userId: string) {
    await this.usersService.updateRefreshToken(userId, null);
  }
}
```

## 次のステップ

次章では、テストについて詳しく学びます。
