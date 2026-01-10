# 11 - Decorators

## 概要

TypeScript のデコレータについて学びます。クラス、メソッド、プロパティ、パラメータに対してメタプログラミングを行う強力な機能です。

## 学習目標

- [ ] デコレータの基本概念を理解できる
- [ ] 各種デコレータ（クラス、メソッド、プロパティ、パラメータ）を作成できる
- [ ] デコレータファクトリを使いこなせる
- [ ] 実践的なデコレータを実装できる

## デコレータの有効化

### tsconfig.json の設定

```json
{
  "compilerOptions": {
    "experimentalDecorators": true,
    "emitDecoratorMetadata": true
  }
}
```

## クラスデコレータ

### 基本的なクラスデコレータ

```typescript
// クラスデコレータの型
type ClassDecorator = <T extends new (...args: any[]) => any>(
  constructor: T
) => T | void;

// シンプルなログデコレータ
function LogClass(constructor: Function) {
  console.log(`Class ${constructor.name} was created`);
}

@LogClass
class User {
  constructor(public name: string) {}
}

// "Class User was created" が出力される
```

### クラスを拡張するデコレータ

```typescript
function Timestamped<T extends new (...args: any[]) => any>(constructor: T) {
  return class extends constructor {
    createdAt = new Date();
    updatedAt = new Date();
  };
}

@Timestamped
class User {
  constructor(public name: string) {}
}

const user = new User("Alice");
console.log((user as any).createdAt); // Date オブジェクト
```

### デコレータファクトリ

```typescript
// パラメータを受け取るデコレータ
function Entity(tableName: string) {
  return function <T extends new (...args: any[]) => any>(constructor: T) {
    return class extends constructor {
      static tableName = tableName;
    };
  };
}

@Entity("users")
class User {
  constructor(public name: string) {}
}

console.log((User as any).tableName); // "users"
```

## メソッドデコレータ

### 基本的なメソッドデコレータ

```typescript
function LogMethod(
  target: any,
  propertyKey: string,
  descriptor: PropertyDescriptor
) {
  const originalMethod = descriptor.value;

  descriptor.value = function (...args: any[]) {
    console.log(`Calling ${propertyKey} with args:`, args);
    const result = originalMethod.apply(this, args);
    console.log(`Result:`, result);
    return result;
  };

  return descriptor;
}

class Calculator {
  @LogMethod
  add(a: number, b: number): number {
    return a + b;
  }
}

const calc = new Calculator();
calc.add(2, 3);
// "Calling add with args: [2, 3]"
// "Result: 5"
```

### 実行時間計測デコレータ

```typescript
function Measure(
  target: any,
  propertyKey: string,
  descriptor: PropertyDescriptor
) {
  const originalMethod = descriptor.value;

  descriptor.value = async function (...args: any[]) {
    const start = performance.now();
    const result = await originalMethod.apply(this, args);
    const end = performance.now();
    console.log(`${propertyKey} took ${end - start}ms`);
    return result;
  };

  return descriptor;
}

class DataService {
  @Measure
  async fetchData(): Promise<string[]> {
    await new Promise((resolve) => setTimeout(resolve, 100));
    return ["data1", "data2"];
  }
}
```

### エラーハンドリングデコレータ

```typescript
function CatchError(message: string) {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      try {
        return await originalMethod.apply(this, args);
      } catch (error) {
        console.error(`${message}:`, error);
        throw error;
      }
    };

    return descriptor;
  };
}

class ApiService {
  @CatchError("Failed to fetch user")
  async getUser(id: string): Promise<User> {
    const response = await fetch(`/api/users/${id}`);
    return response.json();
  }
}
```

## プロパティデコレータ

### 基本的なプロパティデコレータ

```typescript
function LogProperty(target: any, propertyKey: string) {
  let value: any;

  const getter = () => {
    console.log(`Getting ${propertyKey}: ${value}`);
    return value;
  };

  const setter = (newValue: any) => {
    console.log(`Setting ${propertyKey} to ${newValue}`);
    value = newValue;
  };

  Object.defineProperty(target, propertyKey, {
    get: getter,
    set: setter,
    enumerable: true,
    configurable: true,
  });
}

class User {
  @LogProperty
  name: string = "";
}

const user = new User();
user.name = "Alice"; // "Setting name to Alice"
console.log(user.name); // "Getting name: Alice"
```

### バリデーションデコレータ

```typescript
function MinLength(length: number) {
  return function (target: any, propertyKey: string) {
    let value: string;

    Object.defineProperty(target, propertyKey, {
      get: () => value,
      set: (newValue: string) => {
        if (newValue.length < length) {
          throw new Error(
            `${propertyKey} must be at least ${length} characters`
          );
        }
        value = newValue;
      },
      enumerable: true,
      configurable: true,
    });
  };
}

function MaxLength(length: number) {
  return function (target: any, propertyKey: string) {
    let value: string;

    Object.defineProperty(target, propertyKey, {
      get: () => value,
      set: (newValue: string) => {
        if (newValue.length > length) {
          throw new Error(
            `${propertyKey} must be at most ${length} characters`
          );
        }
        value = newValue;
      },
      enumerable: true,
      configurable: true,
    });
  };
}

class User {
  @MinLength(3)
  @MaxLength(20)
  username: string = "";
}
```

## パラメータデコレータ

### 基本的なパラメータデコレータ

```typescript
function LogParameter(
  target: any,
  propertyKey: string,
  parameterIndex: number
) {
  console.log(
    `Parameter at index ${parameterIndex} in ${propertyKey} was decorated`
  );
}

class User {
  greet(@LogParameter name: string): string {
    return `Hello, ${name}!`;
  }
}
```

### メタデータを使用したパラメータ検証

```typescript
import "reflect-metadata";

const requiredMetadataKey = Symbol("required");

function Required(
  target: any,
  propertyKey: string,
  parameterIndex: number
) {
  const existingRequired: number[] =
    Reflect.getOwnMetadata(requiredMetadataKey, target, propertyKey) || [];
  existingRequired.push(parameterIndex);
  Reflect.defineMetadata(
    requiredMetadataKey,
    existingRequired,
    target,
    propertyKey
  );
}

function Validate(
  target: any,
  propertyKey: string,
  descriptor: PropertyDescriptor
) {
  const originalMethod = descriptor.value;

  descriptor.value = function (...args: any[]) {
    const requiredParams: number[] =
      Reflect.getOwnMetadata(requiredMetadataKey, target, propertyKey) || [];

    for (const index of requiredParams) {
      if (args[index] === undefined || args[index] === null) {
        throw new Error(`Parameter at index ${index} is required`);
      }
    }

    return originalMethod.apply(this, args);
  };

  return descriptor;
}

class UserService {
  @Validate
  createUser(@Required name: string, age?: number): void {
    console.log(`Creating user: ${name}, ${age}`);
  }
}
```

## アクセサデコレータ

```typescript
function Configurable(configurable: boolean) {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    descriptor.configurable = configurable;
  };
}

class Point {
  private _x: number;
  private _y: number;

  constructor(x: number, y: number) {
    this._x = x;
    this._y = y;
  }

  @Configurable(false)
  get x() {
    return this._x;
  }

  @Configurable(false)
  get y() {
    return this._y;
  }
}
```

## デコレータの合成

### 複数のデコレータを適用

```typescript
function First() {
  console.log("First(): factory evaluated");
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    console.log("First(): called");
  };
}

function Second() {
  console.log("Second(): factory evaluated");
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    console.log("Second(): called");
  };
}

class Example {
  @First()
  @Second()
  method() {}
}

// 出力順序:
// "First(): factory evaluated"
// "Second(): factory evaluated"
// "Second(): called"
// "First(): called"
```

## 実践例: API ルーティング

```typescript
import "reflect-metadata";

// メタデータキー
const ROUTES_KEY = Symbol("routes");

interface RouteDefinition {
  path: string;
  method: "GET" | "POST" | "PUT" | "DELETE";
  handlerName: string;
}

// コントローラデコレータ
function Controller(basePath: string) {
  return function <T extends new (...args: any[]) => any>(constructor: T) {
    Reflect.defineMetadata("basePath", basePath, constructor);
    return constructor;
  };
}

// ルートデコレータファクトリ
function createRouteDecorator(method: RouteDefinition["method"]) {
  return function (path: string) {
    return function (
      target: any,
      propertyKey: string,
      descriptor: PropertyDescriptor
    ) {
      const routes: RouteDefinition[] =
        Reflect.getMetadata(ROUTES_KEY, target.constructor) || [];
      routes.push({
        path,
        method,
        handlerName: propertyKey,
      });
      Reflect.defineMetadata(ROUTES_KEY, routes, target.constructor);
    };
  };
}

const Get = createRouteDecorator("GET");
const Post = createRouteDecorator("POST");
const Put = createRouteDecorator("PUT");
const Delete = createRouteDecorator("DELETE");

// 使用例
@Controller("/users")
class UserController {
  @Get("/")
  getAll() {
    return "Get all users";
  }

  @Get("/:id")
  getOne() {
    return "Get one user";
  }

  @Post("/")
  create() {
    return "Create user";
  }

  @Delete("/:id")
  delete() {
    return "Delete user";
  }
}

// ルート情報を取得
function getRoutes(controller: any): RouteDefinition[] {
  const basePath = Reflect.getMetadata("basePath", controller);
  const routes: RouteDefinition[] =
    Reflect.getMetadata(ROUTES_KEY, controller) || [];

  return routes.map((route) => ({
    ...route,
    path: basePath + route.path,
  }));
}

console.log(getRoutes(UserController));
// [
//   { path: "/users/", method: "GET", handlerName: "getAll" },
//   { path: "/users/:id", method: "GET", handlerName: "getOne" },
//   { path: "/users/", method: "POST", handlerName: "create" },
//   { path: "/users/:id", method: "DELETE", handlerName: "delete" }
// ]
```

## 実践例: バリデーションフレームワーク

```typescript
import "reflect-metadata";

const validatorsKey = Symbol("validators");

type Validator = (value: any) => string | null;

// バリデーションデコレータ
function addValidator(validator: Validator) {
  return function (target: any, propertyKey: string) {
    const validators: Map<string, Validator[]> =
      Reflect.getMetadata(validatorsKey, target) || new Map();
    const propertyValidators = validators.get(propertyKey) || [];
    propertyValidators.push(validator);
    validators.set(propertyKey, propertyValidators);
    Reflect.defineMetadata(validatorsKey, validators, target);
  };
}

// バリデーションデコレータ
function IsRequired() {
  return addValidator((value) =>
    value === undefined || value === null || value === ""
      ? "This field is required"
      : null
  );
}

function IsEmail() {
  return addValidator((value) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(value) ? null : "Invalid email format";
  });
}

function MinLength(min: number) {
  return addValidator((value) =>
    typeof value === "string" && value.length >= min
      ? null
      : `Minimum length is ${min}`
  );
}

function Min(min: number) {
  return addValidator((value) =>
    typeof value === "number" && value >= min
      ? null
      : `Minimum value is ${min}`
  );
}

// バリデーション実行
function validate(obj: any): { valid: boolean; errors: Record<string, string[]> } {
  const validators: Map<string, Validator[]> =
    Reflect.getMetadata(validatorsKey, obj) || new Map();

  const errors: Record<string, string[]> = {};

  for (const [propertyKey, propertyValidators] of validators) {
    const value = obj[propertyKey];
    const propertyErrors = propertyValidators
      .map((v) => v(value))
      .filter((e): e is string => e !== null);

    if (propertyErrors.length > 0) {
      errors[propertyKey] = propertyErrors;
    }
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  };
}

// 使用例
class User {
  @IsRequired()
  @MinLength(3)
  name!: string;

  @IsRequired()
  @IsEmail()
  email!: string;

  @Min(0)
  age!: number;
}

const user = new User();
user.name = "Al";
user.email = "invalid-email";
user.age = -5;

console.log(validate(user));
// {
//   valid: false,
//   errors: {
//     name: ["Minimum length is 3"],
//     email: ["Invalid email format"],
//     age: ["Minimum value is 0"]
//   }
// }
```

## 実践例: 依存性注入

```typescript
import "reflect-metadata";

const injectableKey = Symbol("injectable");
const injectKey = Symbol("inject");

// コンテナ
class Container {
  private static instances = new Map<string, any>();

  static register<T>(token: string, instance: T): void {
    this.instances.set(token, instance);
  }

  static resolve<T>(token: string): T {
    const instance = this.instances.get(token);
    if (!instance) {
      throw new Error(`No provider for ${token}`);
    }
    return instance;
  }
}

// デコレータ
function Injectable() {
  return function <T extends new (...args: any[]) => any>(constructor: T) {
    Reflect.defineMetadata(injectableKey, true, constructor);
    return constructor;
  };
}

function Inject(token: string) {
  return function (target: any, propertyKey: string) {
    const tokens: Map<string, string> =
      Reflect.getMetadata(injectKey, target) || new Map();
    tokens.set(propertyKey, token);
    Reflect.defineMetadata(injectKey, tokens, target);
  };
}

// 自動注入
function createInstance<T>(constructor: new (...args: any[]) => T): T {
  const instance = new constructor();
  const tokens: Map<string, string> =
    Reflect.getMetadata(injectKey, instance) || new Map();

  for (const [propertyKey, token] of tokens) {
    (instance as any)[propertyKey] = Container.resolve(token);
  }

  return instance;
}

// 使用例
@Injectable()
class Logger {
  log(message: string): void {
    console.log(`[LOG] ${message}`);
  }
}

@Injectable()
class UserService {
  @Inject("Logger")
  private logger!: Logger;

  createUser(name: string): void {
    this.logger.log(`Creating user: ${name}`);
  }
}

// セットアップ
Container.register("Logger", new Logger());

const userService = createInstance(UserService);
userService.createUser("Alice");
// "[LOG] Creating user: Alice"
```

## まとめ

- **クラスデコレータ**: クラス全体を修正・拡張
- **メソッドデコレータ**: メソッドの動作を変更
- **プロパティデコレータ**: プロパティの動作を制御
- **パラメータデコレータ**: パラメータにメタデータを付与
- **アクセサデコレータ**: getter/setter を修正
- **デコレータファクトリ**: パラメータ付きデコレータ
- **合成**: 複数のデコレータを組み合わせ

## 演習問題

1. **メソッドデコレータ**: メソッドの実行を遅延させるデコレータを作成してください
2. **プロパティデコレータ**: 数値の範囲を検証するデコレータを作成してください
3. **クラスデコレータ**: シングルトンパターンを実装するデコレータを作成してください
4. **合成**: ログとエラーハンドリングを組み合わせたデコレータを作成してください

## 次のステップ

次の章では、モジュールと名前空間について学びます。

⬅️ 前へ: [10-Utility-Types.md](./10-Utility-Types.md)
➡️ 次へ: [12-Modules-and-Namespaces.md](./12-Modules-and-Namespaces.md)
