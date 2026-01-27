# NestJS サンプル集

## Controller

### 基本的な CRUD

```typescript
// users.controller.ts
import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  HttpStatus,
  HttpCode,
} from "@nestjs/common";
import { UsersService } from "./users.service";
import { CreateUserDto, UpdateUserDto, QueryUserDto } from "./dto";

@Controller("users")
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  findAll(@Query() query: QueryUserDto) {
    return this.usersService.findAll(query);
  }

  @Get(":id")
  findOne(@Param("id") id: string) {
    return this.usersService.findOne(id);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body() dto: CreateUserDto) {
    return this.usersService.create(dto);
  }

  @Put(":id")
  update(@Param("id") id: string, @Body() dto: UpdateUserDto) {
    return this.usersService.update(id, dto);
  }

  @Delete(":id")
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param("id") id: string) {
    return this.usersService.remove(id);
  }
}
```

## Service

### Prisma 統合

```typescript
// users.service.ts
import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { CreateUserDto, UpdateUserDto, QueryUserDto } from "./dto";

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async findAll(query: QueryUserDto) {
    const { page = 1, limit = 20, search } = query;

    const where = search
      ? {
          OR: [{ name: { contains: search } }, { email: { contains: search } }],
        }
      : {};

    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: "desc" },
      }),
      this.prisma.user.count({ where }),
    ]);

    return { data: users, meta: { page, limit, total } };
  }

  async findOne(id: string) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException("User not found");
    return user;
  }

  async create(dto: CreateUserDto) {
    return this.prisma.user.create({ data: dto });
  }

  async update(id: string, dto: UpdateUserDto) {
    await this.findOne(id);
    return this.prisma.user.update({ where: { id }, data: dto });
  }

  async remove(id: string) {
    await this.findOne(id);
    await this.prisma.user.delete({ where: { id } });
  }
}
```

## DTO とバリデーション

```typescript
// dto/create-user.dto.ts
import { IsEmail, IsString, MinLength, IsOptional } from "class-validator";

export class CreateUserDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(8)
  password: string;

  @IsString()
  @IsOptional()
  name?: string;
}

// dto/update-user.dto.ts
import { PartialType } from "@nestjs/mapped-types";
import { CreateUserDto } from "./create-user.dto";

export class UpdateUserDto extends PartialType(CreateUserDto) {}

// dto/query-user.dto.ts
import { IsOptional, IsInt, Min, IsString } from "class-validator";
import { Type } from "class-transformer";

export class QueryUserDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number;

  @IsOptional()
  @IsString()
  search?: string;
}
```

## Guard (認証)

```typescript
// auth/jwt-auth.guard.ts
import {
  Injectable,
  ExecutionContext,
  UnauthorizedException,
} from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";

@Injectable()
export class JwtAuthGuard extends AuthGuard("jwt") {
  canActivate(context: ExecutionContext) {
    return super.canActivate(context);
  }

  handleRequest(err: any, user: any) {
    if (err || !user) {
      throw err || new UnauthorizedException();
    }
    return user;
  }
}

// 使用例
@Controller("profile")
@UseGuards(JwtAuthGuard)
export class ProfileController {
  @Get()
  getProfile(@Request() req) {
    return req.user;
  }
}
```

## Exception Filter

```typescript
// filters/http-exception.filter.ts
import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from "@nestjs/common";
import { Response } from "express";

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const message =
      exception instanceof HttpException
        ? exception.getResponse()
        : "Internal server error";

    response.status(status).json({
      statusCode: status,
      timestamp: new Date().toISOString(),
      message: typeof message === "object" ? message : { error: message },
    });
  }
}
```

## Interceptor

```typescript
// interceptors/logging.interceptor.ts
import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from "@nestjs/common";
import { Observable, tap } from "rxjs";

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger("HTTP");

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const { method, url } = request;
    const now = Date.now();

    return next.handle().pipe(
      tap(() => {
        const response = context.switchToHttp().getResponse();
        this.logger.log(
          `${method} ${url} ${response.statusCode} - ${Date.now() - now}ms`,
        );
      }),
    );
  }
}
```
