# 第7章: パイプ

## パイプとは

入力データの変換とバリデーションを行う機能。

```
┌─────────────────────────────────────────────────────┐
│                      Pipe                            │
│                                                     │
│  Input Data                                         │
│     │                                               │
│     ▼                                               │
│  ┌─────────────────────────────────────────────┐   │
│  │           Transformation                     │   │
│  │         型変換、整形                         │   │
│  └─────────────────────────────────────────────┘   │
│     │                                               │
│     ▼                                               │
│  ┌─────────────────────────────────────────────┐   │
│  │            Validation                        │   │
│  │         バリデーション                       │   │
│  └─────────────────────────────────────────────┘   │
│     │                                               │
│     ▼                                               │
│  Handler (valid data) or Exception (invalid)        │
└─────────────────────────────────────────────────────┘
```

## 組み込みパイプ

```typescript
import {
  ValidationPipe,
  ParseIntPipe,
  ParseFloatPipe,
  ParseBoolPipe,
  ParseArrayPipe,
  ParseUUIDPipe,
  ParseEnumPipe,
  DefaultValuePipe,
} from "@nestjs/common";
```

### ParseIntPipe

```typescript
@Get(":id")
findOne(@Param("id", ParseIntPipe) id: number) {
  // id は number 型に変換済み
  return this.usersService.findOne(id);
}

// カスタムエラー
@Get(":id")
findOne(
  @Param("id", new ParseIntPipe({
    errorHttpStatusCode: HttpStatus.NOT_ACCEPTABLE,
  }))
  id: number,
) {
  return this.usersService.findOne(id);
}
```

### ParseUUIDPipe

```typescript
@Get(":id")
findOne(@Param("id", ParseUUIDPipe) id: string) {
  // UUID 形式でなければ 400 エラー
  return this.usersService.findOne(id);
}

// バージョン指定
@Get(":id")
findOne(@Param("id", new ParseUUIDPipe({ version: "4" })) id: string) {
  return this.usersService.findOne(id);
}
```

### ParseBoolPipe

```typescript
@Get()
findAll(@Query("active", ParseBoolPipe) active: boolean) {
  // "true" → true, "false" → false
  return this.usersService.findAll({ active });
}
```

### ParseArrayPipe

```typescript
@Get()
findByIds(
  @Query("ids", new ParseArrayPipe({ items: Number, separator: "," }))
  ids: number[],
) {
  // ?ids=1,2,3 → [1, 2, 3]
  return this.usersService.findByIds(ids);
}
```

### ParseEnumPipe

```typescript
enum UserStatus {
  ACTIVE = "active",
  INACTIVE = "inactive",
}

@Get()
findAll(
  @Query("status", new ParseEnumPipe(UserStatus))
  status: UserStatus,
) {
  return this.usersService.findAll({ status });
}
```

### DefaultValuePipe

```typescript
@Get()
findAll(
  @Query("page", new DefaultValuePipe(1), ParseIntPipe) page: number,
  @Query("limit", new DefaultValuePipe(10), ParseIntPipe) limit: number,
) {
  return this.usersService.findAll({ page, limit });
}
```

## ValidationPipe

### 基本設定

```typescript
// main.ts
import { ValidationPipe } from "@nestjs/common";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,             // DTOにないプロパティを除去
      forbidNonWhitelisted: true,  // 不正なプロパティでエラー
      transform: true,             // 型変換を有効化
      transformOptions: {
        enableImplicitConversion: true,  // 暗黙的な型変換
      },
    }),
  );

  await app.listen(3000);
}
```

### DTO バリデーション

```typescript
// dto/create-user.dto.ts
import {
  IsString,
  IsEmail,
  IsNotEmpty,
  MinLength,
  MaxLength,
  IsOptional,
  IsInt,
  Min,
  Max,
  IsEnum,
  IsArray,
  ValidateNested,
  IsUrl,
  Matches,
} from "class-validator";
import { Type } from "class-transformer";

enum Role {
  USER = "user",
  ADMIN = "admin",
}

class AddressDto {
  @IsString()
  street: string;

  @IsString()
  city: string;
}

export class CreateUserDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(50)
  name: string;

  @IsEmail()
  email: string;

  @IsString()
  @MinLength(8)
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, {
    message: "Password must contain uppercase, lowercase, and number",
  })
  password: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(120)
  age?: number;

  @IsEnum(Role)
  role: Role;

  @IsOptional()
  @IsUrl()
  website?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @IsOptional()
  @ValidateNested()
  @Type(() => AddressDto)
  address?: AddressDto;
}
```

### カスタムバリデーション

```typescript
// common/validators/is-unique.validator.ts
import {
  registerDecorator,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
  ValidationArguments,
} from "class-validator";
import { Injectable } from "@nestjs/common";
import { UsersService } from "../../users/users.service";

@ValidatorConstraint({ async: true })
@Injectable()
export class IsUniqueConstraint implements ValidatorConstraintInterface {
  constructor(private usersService: UsersService) {}

  async validate(email: string, args: ValidationArguments) {
    const user = await this.usersService.findByEmail(email);
    return !user;
  }

  defaultMessage(args: ValidationArguments) {
    return "Email already exists";
  }
}

export function IsUnique(validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName,
      options: validationOptions,
      constraints: [],
      validator: IsUniqueConstraint,
    });
  };
}
```

```typescript
// 使用
export class CreateUserDto {
  @IsEmail()
  @IsUnique()
  email: string;
}
```

## カスタムパイプ

### 基本構造

```typescript
// common/pipes/parse-object-id.pipe.ts
import {
  PipeTransform,
  Injectable,
  ArgumentMetadata,
  BadRequestException,
} from "@nestjs/common";
import { Types } from "mongoose";

@Injectable()
export class ParseObjectIdPipe implements PipeTransform<string, Types.ObjectId> {
  transform(value: string, metadata: ArgumentMetadata): Types.ObjectId {
    if (!Types.ObjectId.isValid(value)) {
      throw new BadRequestException("Invalid ObjectId");
    }
    return new Types.ObjectId(value);
  }
}
```

### トリムパイプ

```typescript
// common/pipes/trim.pipe.ts
@Injectable()
export class TrimPipe implements PipeTransform {
  transform(value: any, metadata: ArgumentMetadata) {
    if (typeof value === "string") {
      return value.trim();
    }
    if (typeof value === "object" && value !== null) {
      return this.trimObject(value);
    }
    return value;
  }

  private trimObject(obj: Record<string, any>) {
    const trimmed: Record<string, any> = {};
    for (const [key, value] of Object.entries(obj)) {
      trimmed[key] = typeof value === "string" ? value.trim() : value;
    }
    return trimmed;
  }
}
```

### ファイルバリデーションパイプ

```typescript
// common/pipes/file-validation.pipe.ts
import {
  PipeTransform,
  Injectable,
  BadRequestException,
} from "@nestjs/common";

@Injectable()
export class FileValidationPipe implements PipeTransform {
  constructor(
    private options: {
      maxSize?: number;
      mimeTypes?: string[];
    } = {},
  ) {}

  transform(file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException("File is required");
    }

    if (this.options.maxSize && file.size > this.options.maxSize) {
      throw new BadRequestException(
        `File size exceeds ${this.options.maxSize} bytes`,
      );
    }

    if (
      this.options.mimeTypes &&
      !this.options.mimeTypes.includes(file.mimetype)
    ) {
      throw new BadRequestException(
        `Invalid file type. Allowed: ${this.options.mimeTypes.join(", ")}`,
      );
    }

    return file;
  }
}

// 使用
@Post("upload")
@UseInterceptors(FileInterceptor("file"))
uploadFile(
  @UploadedFile(
    new FileValidationPipe({
      maxSize: 5 * 1024 * 1024,  // 5MB
      mimeTypes: ["image/jpeg", "image/png"],
    }),
  )
  file: Express.Multer.File,
) {
  return { filename: file.originalname };
}
```

## パイプの適用レベル

### パラメータレベル

```typescript
@Get(":id")
findOne(@Param("id", ParseIntPipe) id: number) {}
```

### メソッドレベル

```typescript
@Post()
@UsePipes(ValidationPipe)
create(@Body() createUserDto: CreateUserDto) {}
```

### コントローラーレベル

```typescript
@Controller("users")
@UsePipes(ValidationPipe)
export class UsersController {}
```

### グローバルレベル

```typescript
app.useGlobalPipes(new ValidationPipe());
```

## パイプチェーン

```typescript
@Get()
findAll(
  @Query("page", new DefaultValuePipe(1), ParseIntPipe) page: number,
  @Query("limit", new DefaultValuePipe(10), ParseIntPipe) limit: number,
) {
  return this.usersService.findAll({ page, limit });
}
```

## 次のステップ

次章では、例外フィルターについて詳しく学びます。
