# 第9章: データベース統合

## 概要

NestJS は様々なデータベースとの統合をサポート。

```
┌─────────────────────────────────────────────────────┐
│               Database Options                       │
│                                                     │
│  SQL                    NoSQL                       │
│  ├── PostgreSQL         ├── MongoDB                 │
│  ├── MySQL              ├── Redis                   │
│  └── SQLite             └── DynamoDB               │
│                                                     │
│  ORM/ODM                                            │
│  ├── TypeORM            ├── Prisma                  │
│  ├── Sequelize          └── Mongoose               │
│  └── Drizzle                                        │
└─────────────────────────────────────────────────────┘
```

## TypeORM

### セットアップ

```bash
npm install @nestjs/typeorm typeorm pg
```

```typescript
// app.module.ts
import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: "postgres",
      host: "localhost",
      port: 5432,
      username: "postgres",
      password: "password",
      database: "myapp",
      entities: [__dirname + "/**/*.entity{.ts,.js}"],
      synchronize: true,  // 開発時のみ true
    }),
  ],
})
export class AppModule {}
```

### 環境変数から設定

```typescript
// app.module.ts
import { ConfigModule, ConfigService } from "@nestjs/config";

@Module({
  imports: [
    ConfigModule.forRoot(),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: "postgres",
        host: configService.get("DB_HOST"),
        port: configService.get("DB_PORT"),
        username: configService.get("DB_USERNAME"),
        password: configService.get("DB_PASSWORD"),
        database: configService.get("DB_NAME"),
        autoLoadEntities: true,
        synchronize: configService.get("NODE_ENV") !== "production",
      }),
      inject: [ConfigService],
    }),
  ],
})
export class AppModule {}
```

### Entity 定義

```typescript
// users/entities/user.entity.ts
import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  Index,
} from "typeorm";
import { Post } from "../../posts/entities/post.entity";

@Entity("users")
export class User {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ length: 100 })
  name: string;

  @Index({ unique: true })
  @Column()
  email: string;

  @Column({ select: false })  // デフォルトで取得しない
  password: string;

  @Column({ default: true })
  isActive: boolean;

  @Column({ type: "enum", enum: ["user", "admin"], default: "user" })
  role: "user" | "admin";

  @OneToMany(() => Post, (post) => post.author)
  posts: Post[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
```

### リレーション

```typescript
// posts/entities/post.entity.ts
import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  ManyToMany,
  JoinTable,
} from "typeorm";
import { User } from "../../users/entities/user.entity";
import { Tag } from "../../tags/entities/tag.entity";

@Entity("posts")
export class Post {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column()
  title: string;

  @Column("text")
  content: string;

  @ManyToOne(() => User, (user) => user.posts)
  author: User;

  @Column()
  authorId: string;

  @ManyToMany(() => Tag)
  @JoinTable()
  tags: Tag[];
}
```

### Repository パターン

```typescript
// users/users.module.ts
import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { User } from "./entities/user.entity";
import { UsersService } from "./users.service";
import { UsersController } from "./users.controller";

@Module({
  imports: [TypeOrmModule.forFeature([User])],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
```

```typescript
// users/users.service.ts
import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { User } from "./entities/user.entity";
import { CreateUserDto } from "./dto/create-user.dto";

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) {}

  async create(createUserDto: CreateUserDto): Promise<User> {
    const user = this.usersRepository.create(createUserDto);
    return this.usersRepository.save(user);
  }

  async findAll(): Promise<User[]> {
    return this.usersRepository.find({
      relations: ["posts"],
    });
  }

  async findOne(id: string): Promise<User> {
    const user = await this.usersRepository.findOne({
      where: { id },
      relations: ["posts"],
    });

    if (!user) {
      throw new NotFoundException(`User #${id} not found`);
    }

    return user;
  }

  async update(id: string, updateUserDto: UpdateUserDto): Promise<User> {
    await this.usersRepository.update(id, updateUserDto);
    return this.findOne(id);
  }

  async remove(id: string): Promise<void> {
    const result = await this.usersRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`User #${id} not found`);
    }
  }
}
```

### QueryBuilder

```typescript
async findWithFilters(filters: {
  role?: string;
  isActive?: boolean;
  search?: string;
}): Promise<User[]> {
  const query = this.usersRepository
    .createQueryBuilder("user")
    .leftJoinAndSelect("user.posts", "post");

  if (filters.role) {
    query.andWhere("user.role = :role", { role: filters.role });
  }

  if (filters.isActive !== undefined) {
    query.andWhere("user.isActive = :isActive", { isActive: filters.isActive });
  }

  if (filters.search) {
    query.andWhere(
      "(user.name ILIKE :search OR user.email ILIKE :search)",
      { search: `%${filters.search}%` },
    );
  }

  return query.getMany();
}
```

### トランザクション

```typescript
import { DataSource } from "typeorm";

@Injectable()
export class UsersService {
  constructor(private dataSource: DataSource) {}

  async createWithProfile(
    createUserDto: CreateUserDto,
    createProfileDto: CreateProfileDto,
  ) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const user = await queryRunner.manager.save(User, createUserDto);
      const profile = await queryRunner.manager.save(Profile, {
        ...createProfileDto,
        userId: user.id,
      });

      await queryRunner.commitTransaction();
      return { user, profile };
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
  }
}
```

## Prisma

### セットアップ

```bash
npm install @prisma/client
npm install -D prisma

npx prisma init
```

```prisma
// prisma/schema.prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id        String   @id @default(cuid())
  email     String   @unique
  name      String?
  password  String
  role      Role     @default(USER)
  posts     Post[]
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

model Post {
  id        String   @id @default(cuid())
  title     String
  content   String?
  published Boolean  @default(false)
  author    User     @relation(fields: [authorId], references: [id])
  authorId  String
  createdAt DateTime @default(now())
}

enum Role {
  USER
  ADMIN
}
```

### Prisma サービス

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
```

### Prisma モジュール

```typescript
// prisma/prisma.module.ts
import { Global, Module } from "@nestjs/common";
import { PrismaService } from "./prisma.service";

@Global()
@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class PrismaModule {}
```

### 使用例

```typescript
// users/users.service.ts
import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { CreateUserDto } from "./dto/create-user.dto";

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async create(createUserDto: CreateUserDto) {
    return this.prisma.user.create({
      data: createUserDto,
    });
  }

  async findAll() {
    return this.prisma.user.findMany({
      include: { posts: true },
    });
  }

  async findOne(id: string) {
    return this.prisma.user.findUnique({
      where: { id },
      include: { posts: true },
    });
  }

  async update(id: string, updateUserDto: UpdateUserDto) {
    return this.prisma.user.update({
      where: { id },
      data: updateUserDto,
    });
  }

  async remove(id: string) {
    return this.prisma.user.delete({
      where: { id },
    });
  }
}
```

### Prisma トランザクション

```typescript
async createWithPosts(data: { user: CreateUserDto; posts: CreatePostDto[] }) {
  return this.prisma.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: data.user,
    });

    const posts = await Promise.all(
      data.posts.map((post) =>
        tx.post.create({
          data: { ...post, authorId: user.id },
        }),
      ),
    );

    return { user, posts };
  });
}
```

## Mongoose (MongoDB)

### セットアップ

```bash
npm install @nestjs/mongoose mongoose
```

```typescript
// app.module.ts
import { MongooseModule } from "@nestjs/mongoose";

@Module({
  imports: [
    MongooseModule.forRoot("mongodb://localhost/myapp"),
  ],
})
export class AppModule {}
```

### スキーマ定義

```typescript
// users/schemas/user.schema.ts
import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document, Types } from "mongoose";

export type UserDocument = User & Document;

@Schema({ timestamps: true })
export class User {
  @Prop({ required: true })
  name: string;

  @Prop({ required: true, unique: true })
  email: string;

  @Prop({ required: true, select: false })
  password: string;

  @Prop({ type: [{ type: Types.ObjectId, ref: "Post" }] })
  posts: Types.ObjectId[];
}

export const UserSchema = SchemaFactory.createForClass(User);
```

### 使用例

```typescript
// users/users.service.ts
import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { User, UserDocument } from "./schemas/user.schema";

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
  ) {}

  async create(createUserDto: CreateUserDto): Promise<User> {
    const user = new this.userModel(createUserDto);
    return user.save();
  }

  async findAll(): Promise<User[]> {
    return this.userModel.find().populate("posts").exec();
  }

  async findOne(id: string): Promise<User> {
    return this.userModel.findById(id).populate("posts").exec();
  }
}
```

## マイグレーション

### TypeORM マイグレーション

```bash
# マイグレーション生成
npx typeorm migration:generate -d src/data-source.ts src/migrations/CreateUsers

# マイグレーション実行
npx typeorm migration:run -d src/data-source.ts

# ロールバック
npx typeorm migration:revert -d src/data-source.ts
```

### Prisma マイグレーション

```bash
# マイグレーション作成・適用
npx prisma migrate dev --name init

# 本番環境への適用
npx prisma migrate deploy

# スキーマをDBに同期（開発用）
npx prisma db push
```

## 次のステップ

次章では、認証について詳しく学びます。
