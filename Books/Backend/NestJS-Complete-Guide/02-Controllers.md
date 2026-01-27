# 第2章: コントローラー

## コントローラーとは

HTTP リクエストを受け取り、レスポンスを返す役割。

```
┌─────────────────────────────────────────────────────┐
│                   Controller                         │
│                                                     │
│  GET /users       → findAll()                       │
│  GET /users/:id   → findOne(id)                     │
│  POST /users      → create(dto)                     │
│  PATCH /users/:id → update(id, dto)                 │
│  DELETE /users/:id → remove(id)                     │
└─────────────────────────────────────────────────────┘
```

## 基本構造

```typescript
// users/users.controller.ts
import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  Patch,
  Query,
} from "@nestjs/common";
import { UsersService } from "./users.service";
import { CreateUserDto } from "./dto/create-user.dto";
import { UpdateUserDto } from "./dto/update-user.dto";

@Controller("users")  // /users パスにマッピング
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  create(@Body() createUserDto: CreateUserDto) {
    return this.usersService.create(createUserDto);
  }

  @Get()
  findAll(@Query("limit") limit?: number) {
    return this.usersService.findAll(limit);
  }

  @Get(":id")
  findOne(@Param("id") id: string) {
    return this.usersService.findOne(id);
  }

  @Patch(":id")
  update(@Param("id") id: string, @Body() updateUserDto: UpdateUserDto) {
    return this.usersService.update(id, updateUserDto);
  }

  @Delete(":id")
  remove(@Param("id") id: string) {
    return this.usersService.remove(id);
  }
}
```

## HTTP メソッドデコレータ

```typescript
@Controller("items")
export class ItemsController {
  @Get()          // GET /items
  @Post()         // POST /items
  @Put()          // PUT /items
  @Patch()        // PATCH /items
  @Delete()       // DELETE /items
  @Head()         // HEAD /items
  @Options()      // OPTIONS /items
  @All()          // すべてのメソッド
}
```

## ルーティング

### パスパラメータ

```typescript
@Get(":id")
findOne(@Param("id") id: string) {
  return `User #${id}`;
}

// 複数パラメータ
@Get(":userId/posts/:postId")
findPost(
  @Param("userId") userId: string,
  @Param("postId") postId: string,
) {
  return { userId, postId };
}

// すべてのパラメータを取得
@Get(":id")
findOne(@Param() params: { id: string }) {
  return params;
}
```

### クエリパラメータ

```typescript
// GET /users?page=1&limit=10&sort=name
@Get()
findAll(
  @Query("page") page: number = 1,
  @Query("limit") limit: number = 10,
  @Query("sort") sort?: string,
) {
  return { page, limit, sort };
}

// すべてのクエリを取得
@Get()
findAll(@Query() query: QueryDto) {
  return query;
}
```

### リクエストボディ

```typescript
@Post()
create(@Body() createUserDto: CreateUserDto) {
  return this.usersService.create(createUserDto);
}

// 特定のプロパティのみ
@Post()
create(@Body("name") name: string) {
  return { name };
}
```

## リクエスト/レスポンス

### リクエストオブジェクト

```typescript
import { Request } from "express";

@Get()
findAll(@Req() request: Request) {
  return {
    url: request.url,
    method: request.method,
    headers: request.headers,
  };
}
```

### レスポンス制御

```typescript
import { Res, HttpStatus } from "@nestjs/common";
import { Response } from "express";

// ステータスコード変更
@Post()
@HttpCode(HttpStatus.CREATED)
create(@Body() dto: CreateUserDto) {
  return this.usersService.create(dto);
}

// ヘッダー設定
@Get()
@Header("Cache-Control", "none")
@Header("X-Custom-Header", "value")
findAll() {
  return [];
}

// リダイレクト
@Get("old-endpoint")
@Redirect("https://example.com", 301)
redirect() {}

// 動的リダイレクト
@Get("redirect")
redirect(@Query("version") version: string) {
  if (version === "5") {
    return { url: "https://docs.nestjs.com/v5/" };
  }
}

// Response オブジェクト直接操作（非推奨）
@Get()
findAll(@Res() res: Response) {
  res.status(HttpStatus.OK).json([]);
}
```

## DTO（Data Transfer Object）

### 定義

```typescript
// dto/create-user.dto.ts
export class CreateUserDto {
  name: string;
  email: string;
  password: string;
  age?: number;
}

// dto/update-user.dto.ts
import { PartialType } from "@nestjs/mapped-types";

export class UpdateUserDto extends PartialType(CreateUserDto) {}
```

### バリデーション（class-validator）

```typescript
// dto/create-user.dto.ts
import {
  IsString,
  IsEmail,
  IsNotEmpty,
  MinLength,
  IsOptional,
  IsInt,
  Min,
  Max,
} from "class-validator";

export class CreateUserDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  name: string;

  @IsEmail()
  email: string;

  @IsString()
  @MinLength(8)
  password: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(120)
  age?: number;
}
```

### ValidationPipe の設定

```typescript
// main.ts
import { ValidationPipe } from "@nestjs/common";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,        // DTO にないプロパティを除去
      forbidNonWhitelisted: true,  // 不正なプロパティでエラー
      transform: true,        // 型変換を有効化
    }),
  );

  await app.listen(3000);
}
```

## サブルート

```typescript
@Controller("users")
export class UsersController {
  // GET /users
  @Get()
  findAll() {}

  // GET /users/profile
  @Get("profile")
  getProfile() {}

  // GET /users/:id/posts
  @Get(":id/posts")
  getUserPosts(@Param("id") id: string) {}
}
```

## ホストルーティング

```typescript
@Controller({ host: "admin.example.com" })
export class AdminController {
  @Get()
  index() {
    return "Admin panel";
  }
}

@Controller({ host: ":account.example.com" })
export class AccountController {
  @Get()
  getInfo(@HostParam("account") account: string) {
    return { account };
  }
}
```

## 非同期処理

```typescript
@Controller("users")
export class UsersController {
  // Promise
  @Get()
  async findAll(): Promise<User[]> {
    return this.usersService.findAll();
  }

  // Observable（RxJS）
  @Get()
  findAll(): Observable<User[]> {
    return this.usersService.findAll();
  }
}
```

## ファイルアップロード

```typescript
import {
  Controller,
  Post,
  UseInterceptors,
  UploadedFile,
  UploadedFiles,
} from "@nestjs/common";
import { FileInterceptor, FilesInterceptor } from "@nestjs/platform-express";

@Controller("upload")
export class UploadController {
  // 単一ファイル
  @Post("single")
  @UseInterceptors(FileInterceptor("file"))
  uploadFile(@UploadedFile() file: Express.Multer.File) {
    return {
      filename: file.originalname,
      size: file.size,
    };
  }

  // 複数ファイル
  @Post("multiple")
  @UseInterceptors(FilesInterceptor("files", 10))
  uploadFiles(@UploadedFiles() files: Express.Multer.File[]) {
    return files.map((file) => ({
      filename: file.originalname,
      size: file.size,
    }));
  }
}
```

## 次のステップ

次章では、プロバイダー（サービス）について詳しく学びます。
