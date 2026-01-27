# 第0章: はじめに

## NestJS とは

NestJS は、効率的でスケーラブルな Node.js サーバーサイドアプリケーションを構築するためのフレームワークです。

### 主な特徴

1. **TypeScript ファースト**: 完全な TypeScript サポート
2. **モジュラー設計**: 機能をモジュールで整理
3. **依存性注入**: テスト容易性と疎結合
4. **デコレータベース**: 宣言的なコード記述
5. **豊富なエコシステム**: 多数の公式・サードパーティモジュール

### Angular インスパイア

NestJS は Angular の設計思想を取り入れています：

- モジュール、コントローラー、サービスの概念
- 依存性注入（DI）コンテナ
- デコレータによるメタデータ定義

## 環境構築

### プロジェクト作成

```bash
# Nest CLI インストール
npm install -g @nestjs/cli

# 新規プロジェクト作成
nest new my-app

# 開発サーバー起動
cd my-app
npm run start:dev
```

### 推奨 VS Code 拡張

- ESLint
- Prettier
- NestJS Snippets

## プロジェクト構成

```
src/
├── app.controller.ts    # ルートコントローラー
├── app.controller.spec.ts
├── app.module.ts        # ルートモジュール
├── app.service.ts       # ルートサービス
└── main.ts              # エントリーポイント
```

## Hello World

```typescript
// main.ts
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  await app.listen(3000);
}
bootstrap();

// app.module.ts
import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';

@Module({
  imports: [],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}

// app.controller.ts
import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }
}

// app.service.ts
import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getHello(): string {
    return 'Hello World!';
  }
}
```

## Next.js との比較

| 項目 | NestJS | Next.js API Routes |
|------|--------|-------------------|
| 用途 | 専用 Backend | フルスタック |
| 構造 | MVC + DI | シンプル |
| 学習曲線 | 高め | 低め |
| 向いているケース | 大規模 API | 小〜中規模 |

## 次のステップ

次章では、NestJS のプロジェクト構成とモジュールシステムについて学びます。
