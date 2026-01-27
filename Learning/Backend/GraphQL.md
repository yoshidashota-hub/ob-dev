# GraphQL 学習ノート

## 概要

GraphQL は API のクエリ言語。クライアントが必要なデータのみを指定して取得できる。

## REST vs GraphQL

| REST               | GraphQL                     |
| ------------------ | --------------------------- |
| 複数エンドポイント | 単一エンドポイント          |
| Over-fetching      | 必要なフィールドのみ取得    |
| Under-fetching     | 1リクエストで関連データ取得 |
| バージョニング必要 | スキーマ進化                |

## スキーマ定義

```graphql
# schema.graphql
type User {
  id: ID!
  email: String!
  name: String
  posts: [Post!]!
  createdAt: DateTime!
}

type Post {
  id: ID!
  title: String!
  content: String!
  author: User!
  comments: [Comment!]!
  published: Boolean!
}

type Comment {
  id: ID!
  content: String!
  author: User!
  post: Post!
}

type Query {
  user(id: ID!): User
  users: [User!]!
  post(id: ID!): Post
  posts(published: Boolean): [Post!]!
}

type Mutation {
  createUser(input: CreateUserInput!): User!
  createPost(input: CreatePostInput!): Post!
  updatePost(id: ID!, input: UpdatePostInput!): Post
  deletePost(id: ID!): Boolean!
}

input CreateUserInput {
  email: String!
  name: String
}

input CreatePostInput {
  title: String!
  content: String!
  authorId: ID!
}

input UpdatePostInput {
  title: String
  content: String
  published: Boolean
}
```

## クエリ例

```graphql
# ユーザーと投稿を同時取得
query GetUserWithPosts($userId: ID!) {
  user(id: $userId) {
    id
    name
    email
    posts {
      id
      title
      published
    }
  }
}

# ミューテーション
mutation CreatePost($input: CreatePostInput!) {
  createPost(input: $input) {
    id
    title
    author {
      name
    }
  }
}
```

## Next.js での実装

### Apollo Client

```typescript
// lib/apollo-client.ts
import { ApolloClient, InMemoryCache, HttpLink } from "@apollo/client";

const client = new ApolloClient({
  link: new HttpLink({
    uri: process.env.GRAPHQL_ENDPOINT,
  }),
  cache: new InMemoryCache(),
});

export default client;
```

### Server Component での使用

```typescript
// app/users/page.tsx
import { gql } from "@apollo/client";
import client from "@/lib/apollo-client";

const GET_USERS = gql`
  query GetUsers {
    users {
      id
      name
      email
    }
  }
`;

export default async function UsersPage() {
  const { data } = await client.query({ query: GET_USERS });

  return (
    <ul>
      {data.users.map((user) => (
        <li key={user.id}>{user.name}</li>
      ))}
    </ul>
  );
}
```

### urql（軽量な代替）

```typescript
import { Client, cacheExchange, fetchExchange } from "urql";

const client = new Client({
  url: "/api/graphql",
  exchanges: [cacheExchange, fetchExchange],
});
```

## GraphQL サーバー (Node.js)

### Apollo Server

```typescript
// app/api/graphql/route.ts
import { ApolloServer } from "@apollo/server";
import { startServerAndCreateNextHandler } from "@as-integrations/next";

const typeDefs = `#graphql
  type Query {
    hello: String
  }
`;

const resolvers = {
  Query: {
    hello: () => "Hello, world!",
  },
};

const server = new ApolloServer({ typeDefs, resolvers });

const handler = startServerAndCreateNextHandler(server);

export { handler as GET, handler as POST };
```

## Prisma との統合

```typescript
// リゾルバー
const resolvers = {
  Query: {
    users: () => prisma.user.findMany(),
    user: (_, { id }) => prisma.user.findUnique({ where: { id } }),
  },
  User: {
    posts: (parent) => prisma.post.findMany({ where: { authorId: parent.id } }),
  },
  Mutation: {
    createUser: (_, { input }) => prisma.user.create({ data: input }),
  },
};
```

## ベストプラクティス

1. **DataLoader でN+1問題を解決**
2. **クエリの複雑さを制限**
3. **ページネーション実装**
4. **エラーハンドリング**
5. **認証・認可**

## 参考リソース

- [GraphQL 公式](https://graphql.org/)
- [Apollo GraphQL](https://www.apollographql.com/)
